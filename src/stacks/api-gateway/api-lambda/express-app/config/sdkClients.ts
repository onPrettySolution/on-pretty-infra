import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity";

// create docClient
let dynamoDBDocumentClient: DynamoDBDocumentClient | null = null;
const getDocClient = (): DynamoDBDocumentClient => {
    if (dynamoDBDocumentClient) return dynamoDBDocumentClient;
    console.log(`[WARN ${Date.now()}]:`, 'new DynamoDBClient()');
    // console.log(`[WARN ${nanoid()}]:`, 'new DynamoDBClient()');
    dynamoDBDocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient());
    return dynamoDBDocumentClient;
};
export const docClient = getDocClient();

// create cognito identity client
let _cognitoIdentityClient: CognitoIdentityClient | null = null;
export const getCognitoIdentityClient = (): CognitoIdentityClient => {
    return _cognitoIdentityClient ??= new CognitoIdentityClient();
};
export const cognitoIdentityClient = getCognitoIdentityClient()