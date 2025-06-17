import {GetCommand} from "@aws-sdk/lib-dynamodb";
import {tryCatch} from "../../../utils/tryCatch";
import {docClient} from "../client";
import {TENANT_ENTITIES} from "../../../models/tenantModel";

interface GetTenantFromDbInput {
    // iss, aud, etc
    sub: string,
    // on-pretty-stage-DynamoDBStack-Base93336DB5-P53XFU00N1TB
    tableName: string,
    tenantName: string
}

export const getTenantFromDb = async (input: GetTenantFromDbInput) => {
    const {sub, tenantName, tableName} = input
    if (!sub) throw new Error("Make sure Authorization header contains a Token with sub");

    const rawTenantName = `${TENANT_ENTITIES.TENANT}#${tenantName}`;
    const command = new GetCommand({
        TableName: tableName, // replace with your table name
        Key: {
            pk: rawTenantName,
            sk: rawTenantName
        }
    });
    const {data, error} = await tryCatch(docClient.send(command));
    if (error) throw new Error(`getCommandError: ${error.message}`);
    return data
}