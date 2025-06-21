import { DynamoDBStreamEvent } from 'aws-lambda'

exports.handler = async (event: DynamoDBStreamEvent) => {
  event.Records.forEach((record) => {
    console.log('record.eventID', record.eventID)
    console.log('record.eventName:', record.eventName)
    console.log('record.dynamodb?.NewImage', record.dynamodb?.NewImage)
  })
}
