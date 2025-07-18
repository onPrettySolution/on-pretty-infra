// import {getEnv} from "../../utils/getEnv";
// import {Tenant} from "../../models/tenantModel";
// import {getTenantFromDb} from "../../clients/aws/dynamoDb";
import {createInvalidation} from "../../clients/aws/cloudfront/createInvalidation";

interface CreateInvalidationInput {
    // sub: string
    distributionTenantId: string;
}

export const createInvalidationService = async (input: CreateInvalidationInput) => {
    const {distributionTenantId} = input;
    // const {tableName} = getEnv;

    // todo: check if req is authorized checking sub
    // const tenantRes = await getTenantFromDb({
    //     sub, tableName, tenantName
    // })
    // const tenant = tenantRes.Item as Tenant
    // const tenantOwnerSub = tenant.data.tenantOwnerSub

    return await createInvalidation({
        distributionTenantId: distributionTenantId
    })

};

