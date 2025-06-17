import {getEnv} from "../utils/getEnv";
import {getTenantFromDb} from "../clients/aws/dynamoDb";

interface GetTenantServiceInput {
    // sub is the tenant owner in DynamoDb table
    sub: string;
    // tenant01
    tenantName: string
}

export const getTenantService = async (input: GetTenantServiceInput) => {
    const {sub, tenantName} = input;
    const {tableName} = getEnv;

    return await getTenantFromDb({
        sub, tableName, tenantName
    })
};

