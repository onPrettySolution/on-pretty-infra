import {SNSClient, PublishCommand} from '@aws-sdk/client-sns'
import {DynamoDBStreamEvent} from 'aws-lambda'
import {tryCatch} from "../api-gateway/api-lambda/express-app/utils/tryCatch";

const snsClient = new SNSClient()
const NEW_TENANT_INSERTED_TOPIC_ARN = process.env.NEW_TENANT_INSERTED_TOPIC_ARN

exports.handler = async (event: DynamoDBStreamEvent) => {
    if (!NEW_TENANT_INSERTED_TOPIC_ARN) throw new Error('NEW_TENANT_INSERTED_TOPIC_ARN undefined')

    for (const record of event.Records) {

        if (!record.dynamodb) throw new Error('record.dynamodb undefined')
        console.log(`new tenant ${record.eventName} event ${record.dynamodb.Keys}`)

        // TODO: PublishBatchCommand
        const publishCommand = new PublishCommand({
            TopicArn: NEW_TENANT_INSERTED_TOPIC_ARN,
            Message: JSON.stringify(record.dynamodb.NewImage),
        })
        const {data, error} = await tryCatch(snsClient.send(publishCommand))
        if (error) throw new Error(`err: could not publish in ${NEW_TENANT_INSERTED_TOPIC_ARN}, ${error.message}`)
        console.log(`info: MessageId: ${data.MessageId} published in ${NEW_TENANT_INSERTED_TOPIC_ARN}`)
    }
}
