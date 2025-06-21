import {CfnOutput, Duration, Stack, StackProps} from 'aws-cdk-lib';
import {AttributeType, BillingMode, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {StringParameter} from 'aws-cdk-lib/aws-ssm';
import {Construct} from 'constructs';
import {Topic} from "aws-cdk-lib/aws-sns";
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime, StartingPosition} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {DynamoEventSource, SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsSubscription} from 'aws-cdk-lib/aws-sns-subscriptions';
import {Bucket} from "aws-cdk-lib/aws-s3";

interface DynamoDBStackProps extends StackProps {
    onPrettyMTUploadBucket: Bucket
}

interface Tables {
    BASE_TABLE_PARAMETER_NAME: string;
}

export const TABLES: Tables = {
    BASE_TABLE_PARAMETER_NAME: '/on-pretty-infra/core/DynamoDbStack/Tables/Base',
};

export class DynamoDBStack extends Stack {

    constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
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
                newTenantInsertedInDdbTopicArn: newTenantInsertedInDdbTopic.topicArn
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

        // const toCreateCloudFrontTenantQueue = new Queue(this, 'toCreateCloudFrontTenantQueue', {
        //     deadLetterQueue: {
        //         queue: new Queue(this, 'DlqToCreateCloudFrontTenant', {retentionPeriod: Duration.days(14)}),
        //         maxReceiveCount: 3
        //     }
        // })
        // newTenantInsertedInDdbTopic.addSubscription(new SqsSubscription(toCreateCloudFrontTenantQueue, {rawMessageDelivery: true}))

        const toPutDefaultIndexHtmlInS3Queue = new Queue(this, 'toPutDefaultIndexHtmlInS3Queue', {
            deadLetterQueue: {
                queue: new Queue(this, 'DlqToPutDefaultIndexHtmlInS3Queue', {retentionPeriod: Duration.days(14)}),
                maxReceiveCount: 2
            }
        })
        newTenantInsertedInDdbTopic.addSubscription(new SqsSubscription(toPutDefaultIndexHtmlInS3Queue, {rawMessageDelivery: true}))
        const toPutDefaultIndexHtmlInS3Lambda = new NodejsFunction(this, 'toPutDefaultIndexHtmlInS3Lambda', {
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TZ: 'Europe/Kiev',
                onPrettyMTUploadBucketName: props.onPrettyMTUploadBucket.bucketName
            },
            logRetention: RetentionDays.ONE_MONTH,
        })
        toPutDefaultIndexHtmlInS3Queue.grantSendMessages(toPutDefaultIndexHtmlInS3Lambda)
        toPutDefaultIndexHtmlInS3Lambda.addEventSource(new SqsEventSource(toPutDefaultIndexHtmlInS3Queue, { reportBatchItemFailures: true, batchSize: 10, maxConcurrency: 2 }))

        // grants:
        newTenantInsertedInDdbTopic.grantPublish(newTenantInsertedLambda)
        props.onPrettyMTUploadBucket.grantReadWrite(toPutDefaultIndexHtmlInS3Lambda) // need both read and write, see headObjectCommand in toPutDefaultIndexHtmlInS3Lambda

        new StringParameter(this, 'baseTable', {
            parameterName: TABLES.BASE_TABLE_PARAMETER_NAME,
            stringValue: base.tableName,
        });

        new CfnOutput(this, 'newTenantInsertedLambda.logGroupName', {value: newTenantInsertedLambda.logGroup.logGroupName})
        new CfnOutput(this, 'toPutDefaultIndexHtmlInS3Lambda.logGroupName', {value: toPutDefaultIndexHtmlInS3Lambda.logGroup.logGroupName})

    }
}