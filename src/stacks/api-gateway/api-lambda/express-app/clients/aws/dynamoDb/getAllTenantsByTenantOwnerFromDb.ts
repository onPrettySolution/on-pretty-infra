import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {tryCatch} from "../../../utils/tryCatch";
import {docClient} from "../client";
import {TENANT_ENTITIES} from "../../../models/tenantModel";

interface GetAllTenantsInput {
    // iss, aud, etc
    sub: string,
    // on-pretty-stage-DynamoDBStack-Base93336DB5-P53XFU00N1TB
    tableName: string
}

export const getAllTenantsByTenantOwnerFromDb = async (input: GetAllTenantsInput) => {
    const sub = input.sub
    if (!sub) throw new Error("Make sure Authorization header contains a Token with sub");
    const rawTenantOwner = `${TENANT_ENTITIES.TENANT_OWNER}#${sub}`;
    const command = new QueryCommand({
        TableName: input.tableName, // replace with your table name
        KeyConditionExpression: "#pk = :pkVal",
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pkVal": rawTenantOwner,
        },
    });
    const {data, error} = await tryCatch(docClient.send(command));
    if (error) throw new Error(`transactWriteCommandError: ${error.message}`);
    return data
}