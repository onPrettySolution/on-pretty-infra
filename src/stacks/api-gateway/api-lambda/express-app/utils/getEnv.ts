function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`utils/getEnv.ts: Missing required environment variable: ${name}`);
    }
    return value;
}

export const getEnv = {
    /** example: 'on.stage.prettysolution.com'
     * is different from domain for React Dashboard app
     * the React Dashboard is hosted on (be-on.stage.prettysolution.com)
     */
    domainName: requireEnv('domainName'),
    // example: 'E18GDWUAFG5IU8'
    distributionId: requireEnv('distributionId'),
    // example: 'd1fu2it2pa9bwt.cloudfront.net'
    distributionEndpoint: requireEnv('distributionEndpoint'),
    // example: us-east-1:2037428b-e67b-4fa9-b157-01eb505359f0
    identityPoolId: requireEnv('identityPoolId'),
    // example: on-pretty-stage-DynamoDBStack-Base93336DB5-P53XFU00N1TB
    tableName: requireEnv('BASE_TABLE_NAME'),
}