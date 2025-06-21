import {SNSClient, PublishCommand} from '@aws-sdk/client-sns'
import {DynamoDBStreamEvent} from 'aws-lambda'
import {tryCatch} from "../api-gateway/api-lambda/express-app/utils/tryCatch";

const snsClient = new SNSClient()
const newTenantInsertedInDdbTopicArn = process.env.newTenantInsertedInDdbTopicArn

exports.handler = async (event: DynamoDBStreamEvent) => {
    if (!newTenantInsertedInDdbTopicArn) throw new Error('newTenantInsertedInDdbTopicArn undefined')

    for (const record of event.Records) {

        if (!record.dynamodb) throw new Error('record.dynamodb undefined')
        console.log(`new tenant ${record.eventName} event ${record.dynamodb.Keys}`)

        // TODO: PublishBatchCommand
        const publishCommand = new PublishCommand({
            TopicArn: newTenantInsertedInDdbTopicArn,
            Message: JSON.stringify(record.dynamodb.NewImage),
        })
        const {data, error} = await tryCatch(snsClient.send(publishCommand))
        if (error) throw new Error(`err: could not publish in ${newTenantInsertedInDdbTopicArn}, ${error.message}`)
        console.log(`info: MessageId: ${data.MessageId} published in ${newTenantInsertedInDdbTopicArn}`)
    }
}
