import {getEnv} from "../utils/getEnv";
import {createDistributionTenant, getIdentityId} from "../clients/aws";
import {saveTenantToDb} from "../clients/aws/dynamoDb";

interface CreateTenantInput {
    claims: Record<string, string>;
    tenantName: string;
    idToken: string;
}

export const createTenantService = async (input: CreateTenantInput) => {
    const {idToken, claims, tenantName} = input;
    const {tableName, domainName, distributionId, identityPoolId, distributionEndpoint} = getEnv;

    const identityId = await getIdentityId({
        idToken,
        claims,
        identityPoolId
    });

    const dist = await createDistributionTenant({
        tenantName,
        identityId,
        domainName,
        distributionId
    });

    return await saveTenantToDb({
        tenantName,
        sub: claims.sub,
        identityId,
        distributionId: dist.distributionId,
        distributionTenantId: dist.distributionTenantId,
        domains: dist.domains,
        distributionEndpoint,
        tableName
    });
};

