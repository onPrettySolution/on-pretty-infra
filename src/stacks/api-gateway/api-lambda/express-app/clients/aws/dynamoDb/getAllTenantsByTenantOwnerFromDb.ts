import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {tryCatch} from "../../../utils/tryCatch";
import {docClient} from "../client";
import {TENANT_ENTITIES} from "../../../models/tenantModel";

interface GetAllTenantsInput {
    // iss, aud, etc
    sub: string,
    // on-pretty-stage-DynamoDBStack-Base93336DB5-P53XFU00N1TB
    tableName: string
    lastEvaluatedKey?: string
}

export const getAllTenantsByTenantOwnerFromDb = async (input: GetAllTenantsInput) => {
    const {sub, lastEvaluatedKey, tableName} = input
    if (!sub) throw new Error("Make sure Authorization header contains a Token with sub");

    let exclusiveStartKey
    const rawTenantOwner = `${TENANT_ENTITIES.TENANT_OWNER}#${sub}`;
    if (lastEvaluatedKey) {
        exclusiveStartKey = {
            pk: rawTenantOwner,
            sk: `${TENANT_ENTITIES.TENANT}#${lastEvaluatedKey}`
            // sk: lastEvaluatedKey
        }
    }
    const command = new QueryCommand({
        TableName: tableName, // replace with your table name
        KeyConditionExpression: "#pk = :pkVal",
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pkVal": rawTenantOwner,
        },
        Limit: 2,
        ExclusiveStartKey: exclusiveStartKey
    });
    const {data, error} = await tryCatch(docClient.send(command));
    if (error) throw new Error(`transactWriteCommandError: ${error.message}`);
    return data
}