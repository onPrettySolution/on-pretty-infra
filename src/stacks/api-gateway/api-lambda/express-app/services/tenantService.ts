import {TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {docClient, cognitoIdentityClient, cloudFrontClient} from '../utils/singletonClients';
import {Tenant, TenantOwner} from '../models/tenantModel';
import {CreateDistributionTenantCommand} from '@aws-sdk/client-cloudfront';
import {getEnv} from "../utils/getEnv";
import {GetIdCommand} from "@aws-sdk/client-cognito-identity";
import {tryCatch} from "../utils/tryCatch";

export enum ENTITIES {
    TENANT_OWNER = 'TENANT_OWNER',
    TENANT = 'TENANT',
}

interface CreateTenantInput {
    claims: Record<string, string>;
    tenantName: string;
    idToken: string;
}

class TenantService {
    async createTenant(createTenantInput: CreateTenantInput): Promise<Tenant> {
        const {
            tableName,
            domainName,
            distributionId,
            identityPoolId,
            distributionEndpoint
        } = getEnv;

        // resolve provider from idToken
        const iss = createTenantInput.claims.iss; // "https://accounts.google.com"
        const provider = iss.startsWith("https://") ? iss.slice(8) : iss;

        // exchange users' idToken for Cognito IdentityId
        const getIdCommand = new GetIdCommand({
            IdentityPoolId: identityPoolId,
            Logins: {[provider]: createTenantInput.idToken},
        });
        const {
            data: getIdCommandOutput,
            error: getIdCommandErr
        } = await tryCatch(cognitoIdentityClient.send(getIdCommand))
        if (getIdCommandErr) throw new Error(`getIdCommandErr: ${getIdCommandErr.message}`);
        if (!getIdCommandOutput.IdentityId) throw new Error("IdentityId is undefined");
        const identityId = getIdCommandOutput.IdentityId

        // create CloudFront Distribution Tenant
        const createDistributionTenantCommand = new CreateDistributionTenantCommand({
            Name: createTenantInput.tenantName,
            DistributionId: distributionId,
            Domains: [
                {Domain: `${createTenantInput.tenantName}.${domainName}`}
            ],
            Parameters: [
                {Name: 'tenantOwnerIdentityId', Value: identityId},
                {Name: 'tenantName', Value: createTenantInput.tenantName}
            ]
        })
        const {
            data: createDistributionTenantCommandOutput,
            error: createDistributionTenantCommandError
        } = await tryCatch(cloudFrontClient.send(createDistributionTenantCommand))
        if (createDistributionTenantCommandError) throw new Error(`createDistributionTenantCommandError: ${createDistributionTenantCommandError.message}`);
        if (!createDistributionTenantCommandOutput.DistributionTenant) throw new Error("DistributionTenant is undefined");

        // Save tenant and owner in a single table designed DDB table
        const tenantInfo = {
            tenantOwnerSub: createTenantInput.claims.sub,
            tenantOwnerIdentityId: identityId,
            DistributionId: createDistributionTenantCommandOutput.DistributionTenant.DistributionId,
            Domains: createDistributionTenantCommandOutput.DistributionTenant.Domains,
            Name: createDistributionTenantCommandOutput.DistributionTenant?.Name,
            distributionEndpoint: distributionEndpoint
        }

        // defining tenant item
        const tenant: Tenant = {
            tenantName: createTenantInput.tenantName,
            data: tenantInfo
        };
        const rawTenant = `${ENTITIES.TENANT}#${tenant.tenantName}`;
        const rawTenantItem = {pk: rawTenant, sk: rawTenant, data: tenantInfo};
        // defining tenantOwner item
        const tenantOwner: TenantOwner = {
            sub: createTenantInput.claims.sub,
            identityId: identityId,
            tenantName: createTenantInput.tenantName
        }
        const rawTenantOwner = `${ENTITIES.TENANT_OWNER}#${tenantOwner.sub}`
        const rawTenantOwnerItem = {
            pk: rawTenantOwner,
            sk: rawTenant,
            data: tenantInfo
        };

        // save tenant in DDB
        const items = [
            rawTenantItem, rawTenantOwnerItem
        ];
        const transactWriteCommand = new TransactWriteCommand({
            TransactItems: items.map(item => ({
                Put: {TableName: tableName, Item: item},
            })),
        });
        const {error: transactWriteCommandError} = await tryCatch(docClient.send(transactWriteCommand))
        if (transactWriteCommandError) throw new Error(`transactWriteCommandError: ${transactWriteCommandError.message}`);

        return tenant;
    }

}

export default new TenantService();
