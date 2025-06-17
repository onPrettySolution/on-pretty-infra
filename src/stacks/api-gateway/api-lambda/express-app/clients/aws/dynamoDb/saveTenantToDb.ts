import {TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import {tryCatch} from "../../../utils/tryCatch";
import {docClient} from "../client";
import {Tenant, TENANT_ENTITIES} from "../../../models/tenantModel";

interface saveTenantToDbInput {
    // ex: tenant01
    tenantName: string,
    // ex: 84a8b4e8-e071-70c0-4eee-b944cadb2270
    sub: string,
    // Identity ID from Identity browser in Cognito Identity pool, ex: us-east-1:40a8a2af-cf43-cfa8-9960-8707c2005f97
    identityId: string,
    // Multi-tenant CloudFront distribution ID, ex: E18GDWUAFG5IU8
    distributionId: string,
    // tenant01.on.stage.prettysolution.com
    domains: any[],
    // d2748vdoi7cuu0.cloudfront.net
    distributionEndpoint: string,
    // on-pretty-stage-DynamoDBStack-Base93336DB5-P53XFU00N1TB
    tableName: string
}

export const saveTenantToDb = async (input: saveTenantToDbInput): Promise<Tenant> => {
    const tenantInfo = {
        tenantOwnerSub: input.sub,
        tenantOwnerIdentityId: input.identityId,
        distributionId: input.distributionId,
        domains: input.domains,
        name: input.tenantName,
        distributionEndpoint: input.distributionEndpoint
    };

    const tenant = {
        tenantName: input.tenantName,
        data: tenantInfo
    };

    const rawTenant = `${TENANT_ENTITIES.TENANT}#${input.tenantName}`;
    const rawTenantOwner = `${TENANT_ENTITIES.TENANT_OWNER}#${input.sub}`;

    const items = [
        {pk: rawTenant, sk: rawTenant, data: tenantInfo},
        {pk: rawTenantOwner, sk: rawTenant, data: tenantInfo}
    ];

    const command = new TransactWriteCommand({
        TransactItems: items.map((item) => ({
            Put: {TableName: input.tableName, Item: item}
        }))
    });

    const {error} = await tryCatch(docClient.send(command));
    if (error) throw new Error(`transactWriteCommandError: ${error.message}`);

    return tenant;
};
