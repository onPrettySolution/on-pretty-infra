import {CfnOutput, Duration, Stack, StackProps} from 'aws-cdk-lib';
import {AttributeType, BillingMode, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {StringParameter} from 'aws-cdk-lib/aws-ssm';
import {Construct} from 'constructs';
import {Topic} from "aws-cdk-lib/aws-sns";
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime, StartingPosition} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {DynamoEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsSubscription} from 'aws-cdk-lib/aws-sns-subscriptions';

interface DynamoDBStackProps extends StackProps {
}

interface Tables {
    BASE_TABLE_PARAMETER_NAME: string;
}

export const TABLES: Tables = {
    BASE_TABLE_PARAMETER_NAME: '/on-pretty-infra/core/DynamoDbStack/Tables/Base',
};

export class DynamoDBStack extends Stack {

    constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
        super(scope, id, props);

        const base = new Table(this, 'Base', {
            partitionKey: {name: 'pk', type: AttributeType.STRING},
            sortKey: {name: 'sk', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
            // pointInTimeRecovery: true,
            maxReadRequestUnits: 1,
            maxWriteRequestUnits: 1,
            stream: StreamViewType.NEW_IMAGE
        });
        // base.addGlobalSecondaryIndex({
        //   indexName: 'gsi1pk-sk-index',
        //   partitionKey: { name: 'gsi1pk', type: AttributeType.STRING },
        //   sortKey: { name: 'sk', type: AttributeType.STRING },
        // });

        // stream DDB insert invents from insertLambda into SNS (newTenantInsertedInDdbTopic)
        const newTenantInsertedInDdbTopic = new Topic(this, 'newTenantInsertedInDdbTopic')
        const newTenantInsertedLambda = new NodejsFunction(this, 'newTenantInsertedLambda', {
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TZ: 'Europe/Kiev',
                NEW_TENANT_INSERTED_TOPIC_ARN: newTenantInsertedInDdbTopic.topicArn
            },
            logRetention: RetentionDays.ONE_MONTH,
        })
        newTenantInsertedLambda.addEventSource(new DynamoEventSource(base, {
            startingPosition: StartingPosition.LATEST,
            batchSize: 10,
            filters: [{
                pattern: JSON.stringify({
                    eventName: ["INSERT"],
                    dynamodb: {Keys: {pk: {S: [{"prefix": "TENANT#"}]}, sk: {S: [{"prefix": "TENANT#"}]}}}
                })
            }],
        }))

        // create Queue to proces Tenant Insert events
        const toCreateCloudFrontTenantQueue = new Queue(this, 'toCreateCloudFrontTenantQueue', {
            deadLetterQueue: {
                queue: new Queue(this, 'DlqToCreateCloudFrontTenant', {retentionPeriod: Duration.days(14)}),
                maxReceiveCount: 3
            }
        })
        newTenantInsertedInDdbTopic.addSubscription(new SqsSubscription(toCreateCloudFrontTenantQueue))


        // grants:
        newTenantInsertedInDdbTopic.grantPublish(newTenantInsertedLambda)
        new StringParameter(this, 'baseTable', {
            parameterName: TABLES.BASE_TABLE_PARAMETER_NAME,
            stringValue: base.tableName,
        });

        new CfnOutput(this, 'newTenantInsertedLambda.logGroupName', {value: newTenantInsertedLambda.logGroup.logGroupName})

    }
}