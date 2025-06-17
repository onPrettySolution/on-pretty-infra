import {getEnv} from "../utils/getEnv";
import {getAllTenantsByTenantOwnerFromDb} from "../clients/aws/dynamoDb/getAllTenantsByTenantOwnerFromDb";

interface getAllTenantsByTenantOwnerInput {
    // sub is the tenant owner in DynamoDb table
    sub: string;
    lastEvaluatedKey?: string
}

export const getAllTenantsByTenantOwnerService = async (input: getAllTenantsByTenantOwnerInput) => {
    const {sub, lastEvaluatedKey} = input;
    const {tableName} = getEnv;

    return await getAllTenantsByTenantOwnerFromDb({
        sub, lastEvaluatedKey,
        tableName
    })
};

