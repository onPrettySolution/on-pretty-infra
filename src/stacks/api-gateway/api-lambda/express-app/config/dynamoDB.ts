import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let dynamoDBDocumentClient: DynamoDBDocumentClient | null = null;

const getDocClient = (): DynamoDBDocumentClient => {
  if (dynamoDBDocumentClient) return dynamoDBDocumentClient;
  console.log(`[WARN ${Date.now()}]:`, 'new DynamoDBClient()');
  // console.log(`[WARN ${nanoid()}]:`, 'new DynamoDBClient()');
  dynamoDBDocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient());
  return dynamoDBDocumentClient;
};
export const docClient = getDocClient();