import {getEnv} from "../utils/getEnv";
import {getAllTenantsByTenantOwnerFromDb} from "../clients/aws/dynamoDb/getAllTenantsByTenantOwnerFromDb";

interface getAllTenantsByTenantOwnerInput {
    // sub is the tenant owner in DynamoDb table
    sub: string;
}

export const getAllTenantsByTenantOwnerService = async (input: getAllTenantsByTenantOwnerInput) => {
    const {sub} = input;
    const {tableName} = getEnv;

    return await getAllTenantsByTenantOwnerFromDb({
        sub,
        tableName
    })
};

