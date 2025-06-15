import {TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {docClient} from '../config/dynamoDB';
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


        const cognitoIdentityClient = new CognitoIdentityClient()
        const iss = data.claims.iss; // "https://accounts.google.com"
        const provider = iss.startsWith("https://") ? iss.slice(8) : iss;
        const command = new GetIdCommand({
            IdentityPoolId: multiTenant.cognitoIdentityPoolId,
            Logins: {
                [provider]: data.idToken,
            },
        });
        const {IdentityId} = await cognitoIdentityClient.send(command);
        console.log(IdentityId)


        const cfClient = new CloudFrontClient();
        const cfTenantInput: CreateDistributionTenantCommandInput = {
            Name: data.tenantName,
            DistributionId: multiTenant.distributionId,
            Domains: [{Domain: `${data.tenantName}.${multiTenant.domainName}`}],
            Parameters: [{Name: 'tenantOwnerIdentityId', Value: IdentityId}, {Name: 'tenantName', Value: data.tenantName}]
        }

        const res = await cfClient.send(new CreateDistributionTenantCommand(cfTenantInput))
        const tenantData = {
            tenantOwnerSub: data.claims.sub,
            tenantOwnerIdentityId: IdentityId,
            DistributionId: res.DistributionTenant?.DistributionId,
            Domains: res.DistributionTenant?.Domains,
            Name: res.DistributionTenant?.Name,
            distributionEndpoint: multiTenant.distributionEndpoint
        }


        // defining Tenant
        const tenant: Tenant = {
            tenantName: data.tenantName,
            data: tenantData
        };

        const rawTenant = `${ENTITIES.TENANT}#${tenant.tenantName}`;

        const rawTenantItem = {
            pk: rawTenant,
            sk: rawTenant,
            data: tenant.data,
        };

        // defining tenantOwner
        const tenantOwner: TenantOwner = {
            sub: data.claims.sub,
            identityId: IdentityId!,
            tenantName: data.tenantName
        }
        const rawTenantOwner = `${ENTITIES.TENANT_OWNER}#${tenantOwner.sub}`
        const rawTenantOwnerItem = {
            pk: rawTenantOwner,
            sk: rawTenant,
            data: tenant.data,
        };

        const items = [rawTenantItem, rawTenantOwnerItem];

        try {
            const cmd = new TransactWriteCommand({
                TransactItems: items.map(item => ({
                    Put: {TableName: this.tableName, Item: item},
                })),
            });
            await docClient.send(cmd);
            console.log(JSON.stringify(tenant));

            return tenant;

        } catch (error) {
            console.error('Error inserting report: ', error);
            throw new Error('Failed to create report');
        }
    }

}

export default new TenantService();
