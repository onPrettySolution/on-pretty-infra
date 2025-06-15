import {TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {docClient, cognitoIdentityClient, cloudFrontClient} from '../config/singletonClients';
import {Tenant, tableName, TenantOwner} from '../models/tenantModel';
import {
    CloudFrontClient,
    CreateDistributionTenantCommand,
    CreateDistributionTenantCommandInput
} from '@aws-sdk/client-cloudfront';
import {multiTenant} from "../config/multiTenant";
import {
    CognitoIdentityClient,
    GetIdCommand,
} from "@aws-sdk/client-cognito-identity";
import {tryCatch} from "../utils/tryCatch";

/**
 * cursor is timestamp of last item
 * last is the id of last item
 * **/
// export interface LastEvaluatedKey {
//   cursor?: string;
//   last?: string;
// }
//
// /**
//  * IGetAllReports todo doc
//  */
// export interface IGetAllReports {
//   driverId: string;
//   limit: number;
//   lastEvaluatedKey: LastEvaluatedKey;
//   all: number;
// }
//
// export enum REPORTS_GSI1 {
//   REPORTS = 'REPORTS$',
//   REPORTS_OF_DRIVER = 'REPORTS|DRIVER$',
//   REPORTS_OF_VEHICLE = 'REPORTS|VEHICLE$',
// }
//
export enum ENTITIES {
    TENANT_OWNER = 'TENANT_OWNER',
    TENANT = 'TENANT',
}

class TenantService {
    private readonly tableName: string | undefined = tableName;

    async createTenant(data: { claims: any, tenantName: string, idToken: string }): Promise<Tenant> {

        const iss = data.claims.iss; // "https://accounts.google.com"
        const provider = iss.startsWith("https://") ? iss.slice(8) : iss;

        // exchange users' idToken for Cognito IdentityId
        const getIdCommand = new GetIdCommand({
            IdentityPoolId: multiTenant.identityPoolId,
            Logins: {[provider]: data.idToken},
        });
        const {
            data: getIdCommandOutput,
            error: getIdCommandErr
        } = await tryCatch(cognitoIdentityClient.send(getIdCommand))
        if (getIdCommandErr) throw new Error("Could not send GetIdCommand");
        if (getIdCommandOutput.IdentityId === undefined) throw new Error("IdentityId is undefined");
        const identityId = getIdCommandOutput.IdentityId

        // create CloudFront Distribution Tenant
        const createDistributionTenantCommand = new CreateDistributionTenantCommand({
            Name: data.tenantName,
            DistributionId: multiTenant.distributionId,
            Domains: [{Domain: `${data.tenantName}.${multiTenant.domainName}`}],
            Parameters: [
                {Name: 'tenantOwnerIdentityId', Value: identityId},
                {Name: 'tenantName', Value: data.tenantName}
            ]
        })
        const {
            data: createDistributionTenantCommandOutput,
            error: createDistributionTenantCommandError
        } = await tryCatch(cloudFrontClient.send(createDistributionTenantCommand))
        if (createDistributionTenantCommandError) throw new Error("Could not send CreateDistributionTenantCommand");
        if (createDistributionTenantCommandOutput.DistributionTenant === undefined) throw new Error("DistributionTenant is undefined");

        // Save tenant and owner in a single table designed DDB table
        const tenantInfo = {
            tenantOwnerSub: data.claims.sub,
            tenantOwnerIdentityId: identityId,
            DistributionId: createDistributionTenantCommandOutput.DistributionTenant.DistributionId,
            Domains: createDistributionTenantCommandOutput.DistributionTenant.Domains,
            Name: createDistributionTenantCommandOutput.DistributionTenant?.Name,
            distributionEndpoint: multiTenant.distributionEndpoint
        }

        // defining tenant item
        const tenant: Tenant = {
            tenantName: data.tenantName,
            data: tenantInfo
        };
        const rawTenant = `${ENTITIES.TENANT}#${tenant.tenantName}`;
        const rawTenantItem = {pk: rawTenant, sk: rawTenant, data: tenantInfo};
        // defining tenantOwner item
        const tenantOwner: TenantOwner = {
            sub: data.claims.sub,
            identityId: identityId,
            tenantName: data.tenantName
        }
        const rawTenantOwner = `${ENTITIES.TENANT_OWNER}#${tenantOwner.sub}`
        const rawTenantOwnerItem = {
            pk: rawTenantOwner,
            sk: rawTenant,
            data: tenantInfo
        };

        // save tenant in DDB
        const items = [rawTenantItem, rawTenantOwnerItem];
        const transactWriteCommand = new TransactWriteCommand({
            TransactItems: items.map(item => ({
                Put: {TableName: this.tableName, Item: item},
            })),
        });
        const {error: transactWriteCommandError} = await tryCatch(docClient.send(transactWriteCommand))
        if (transactWriteCommandError) throw new Error("Could not send TransactWriteCommand");
        // console.log(JSON.stringify(tenant));

        return tenant;
    }

}

export default new TenantService();
