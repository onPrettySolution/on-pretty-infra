#### Set up DEV in your account
1. `ln -s ../on-pretty-web on-pretty-web` # create link to frontend directory
2. `aws configure --profile ps_dev` # configure your DEV aws profile
3. `asp ps_dev` # activate 
4. `export CDK_DOMAIN_NAME=vh.prettysolution.com` # set hosted zone, must exist in route53 in your ps_dev account
5. `npx projen cdk:dev ls` # list stacks
6. `npx projen cdk:dev deploy <name of a stack from prev step> -e` # deploy a stack, name example: dev-pipeline/dev/DynamoDBStack

#### run express in server mode
1. follow steps from [Set up DEV in your account](#set-up-dev-in-your-account)
2. `export BASE_TABLE_NAME=$(aws ssm get-parameter --name "/on-pretty-infra/core/DynamoDbStack/Tables/Base" --query "Parameter.Value" --output text)`
3. `export domainName=$(aws ssm get-parameter --name "/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/domainName" --query "Parameter.Value" --output text)`
4. `export distributionId=$(aws ssm get-parameter --name "/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/distributionId" --query "Parameter.Value" --output text)`
5. `export distributionEndpoint=$(aws ssm get-parameter --name "/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/distributionEndpoint" --query "Parameter.Value" --output text)`
6. `export identityPoolId=$(aws ssm get-parameter --name "/on-pretty-infra/core/CognitoStack/identityPool/identityPoolId" --query "Parameter.Value" --output text)`
7. `npx projen express:run`
8. [test your api](src/stacks/api-gateway/api-lambda/debug/report-api.http)

#### deploy cloudfront
1. `export VITE_COGNITO_AUTHORITY=$(aws ssm get-parameter --name "/core/CognitoStack/userPool01/userPoolProviderUrl" --query "Parameter.Value" --output text)`
2. `export VITE_COGNITO_CLIENT_ID=$(aws ssm get-parameter --name "/core/CognitoStack/userPoolClient01/userPoolClientId" --query "Parameter.Value" --output text)`
3. `npx projen cdk:dev deploy <name of cloudfront stack> -e`

#### Examples
```shell
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_h2ixgDZEz \
  --client-id 6j4nc3kkioj2pvln7r7o8un6nf \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=user10,PASSWORD=user10 | cat
```
```shell
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_h2ixgDZEz \
  --username user10 \
  --password user10 \
  --permanent | cat
```