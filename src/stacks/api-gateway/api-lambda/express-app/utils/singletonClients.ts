import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity";
import {CloudFrontClient} from "@aws-sdk/client-cloudfront";

// create docClient
let _docClientInstance: DynamoDBDocumentClient;
const getDocClient = (): DynamoDBDocumentClient => {
    return _docClientInstance ??= DynamoDBDocumentClient.from(new DynamoDBClient());
}

// create cognito identity client
let _cognitoIdentityClient: CognitoIdentityClient;
const getCognitoIdentityClient = (): CognitoIdentityClient => {
    return _cognitoIdentityClient ??= new CognitoIdentityClient();
};

// create cloud front client
let _cloudFrontClient: CloudFrontClient;
const getCloudFrontClient = (): CloudFrontClient => {
    return _cloudFrontClient ??= new CloudFrontClient();
}

// export
export const docClient = getDocClient();
export const cognitoIdentityClient = getCognitoIdentityClient()
export const cloudFrontClient = getCloudFrontClient()
