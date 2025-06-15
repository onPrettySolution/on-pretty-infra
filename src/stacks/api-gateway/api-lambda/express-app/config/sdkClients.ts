import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity";

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

// export
export const cognitoIdentityClient = getCognitoIdentityClient()
export const docClient = getDocClient();