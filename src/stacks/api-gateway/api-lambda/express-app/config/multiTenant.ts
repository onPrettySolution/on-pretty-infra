export const multiTenant = {
    domainName: process.env.MULTI_TENANT_DOMAIN_NAME, // 'on.stage.prettysolution.com',
    distributionId: process.env.MULTI_TENANT_DISTRIBUTION_ID, //'E18GDWUAFG5IU8',
    distributionEndpoint: process.env.MULTI_TENANT_DISTRIBUTION_ENDPOINT, //'d1fu2it2pa9bwt.cloudfront.net'
    cognitoIdentityPoolId: process.env.IDENTITY_POOL_ID, // us-east-1:2037428b-e67b-4fa9-b157-01eb505359f0
}