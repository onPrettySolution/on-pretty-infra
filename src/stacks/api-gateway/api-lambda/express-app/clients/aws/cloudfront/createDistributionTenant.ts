import {CreateDistributionTenantCommand} from "@aws-sdk/client-cloudfront";
import {tryCatch} from "../../../utils/tryCatch";
import {cloudFrontClient} from "../client";

interface CreateDistributionTenantInput {
    // tenant01 in tenant01.on.prettysolution.com
    tenantName: string;
    // identity id from Cognito Identity pool, ex: us-east-1:40a8a2af-cf8a-cd5c-2bbe-76556903e1ae
    identityId: string;
    // ex: tenant01 in tenant01.on.prettysolution.com
    domainName: string;
    // cloud front distribution id, ex: E18GDWUAFG5IU8
    distributionId: string;
}

export const createDistributionTenant = async (input: CreateDistributionTenantInput) => {

    const command = new CreateDistributionTenantCommand({
        Name: input.tenantName,
        DistributionId: input.distributionId,
        Domains: [{Domain: `${input.tenantName}.${input.domainName}`}],
        Parameters: [
            {Name: "tenantOwnerIdentityId", Value: input.identityId},
            {Name: "tenantName", Value: input.tenantName}
        ]
    });

    const {data, error} = await tryCatch(cloudFrontClient.send(command));
    if (error) throw new Error(`createDistributionTenantCommandError: ${error.message}`);
    if (!data.DistributionTenant) throw new Error("DistributionTenant is undefined");
    if (!data.DistributionTenant.DistributionId) throw new Error("DistributionId is undefined");
    if (!data.DistributionTenant.Domains) throw new Error("Domains is undefined");
    if (!data.DistributionTenant.Id) throw new Error("Id is undefined");
    return {
        distributionId: data.DistributionTenant.DistributionId,
        domains: data.DistributionTenant.Domains,
        distributionTenantId: data.DistributionTenant.Id
    };
};