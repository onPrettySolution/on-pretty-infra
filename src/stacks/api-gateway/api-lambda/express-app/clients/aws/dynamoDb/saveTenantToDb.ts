import {TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import {tryCatch} from "../../../utils/tryCatch";
import {docClient} from "../client";

export const saveTenantToDb = async (
    tenantName: string,
    sub: string,
    identityId: string,
    DistributionId: string,
    Domains: any[],
    distributionEndpoint: string,
    tableName: string
) => {
    const tenantInfo = {
        tenantOwnerSub: sub,
        tenantOwnerIdentityId: identityId,
        DistributionId,
        Domains,
        Name: tenantName,
        distributionEndpoint
    };

    const tenant = {
        tenantName,
        data: tenantInfo
    };

    const rawTenant = `TENANT#${tenantName}`;
    const rawTenantOwner = `TENANT_OWNER#${sub}`;

    const items = [
        { pk: rawTenant, sk: rawTenant, data: tenantInfo },
        { pk: rawTenantOwner, sk: rawTenant, data: tenantInfo }
    ];

    const command = new TransactWriteCommand({
        TransactItems: items.map((item) => ({
            Put: { TableName: tableName, Item: item }
        }))
    });

    const { error } = await tryCatch(docClient.send(command));
    if (error) throw new Error(`transactWriteCommandError: ${error.message}`);

    return tenant;
};
