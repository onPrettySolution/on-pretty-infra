import {CopyObjectCommand, HeadObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {SQSEvent} from 'aws-lambda'
import {tryCatch} from "../api-gateway/api-lambda/express-app/utils/tryCatch";

const s3Client = new S3Client()
const onPrettyMTUploadBucketName = process.env.onPrettyMTUploadBucketName

exports.handler = async (event: SQSEvent) => {
    if (!onPrettyMTUploadBucketName) throw new Error('onPrettyMTUploadBucketName undefined')
    const batchItemFailures: { itemIdentifier: string }[] = []

    try {
        for (const record of event.Records) {
            const messageId = record.messageId
            console.log(record.body)

            const src = `${onPrettyMTUploadBucketName}/default/index.html`
            const dest = `${onPrettyMTUploadBucketName}/test/index.html`

            // check if src exists
            const headObjectCommand = new HeadObjectCommand({
                Bucket: onPrettyMTUploadBucketName,
                Key: src,
            })
            const {data: checkIfExistsData, error:checkIfExistsDataErr} = await tryCatch(s3Client.send(headObjectCommand))
            if (checkIfExistsDataErr) {
                batchItemFailures.push({itemIdentifier: messageId})
                console.error(`${src} does not exist`)
            }

            // Copy src -> dest
            const copyObjectCommand = new CopyObjectCommand({
                Bucket: onPrettyMTUploadBucketName,
                CopySource: src,
                Key: dest
            })
            const {data, error} = await tryCatch(s3Client.send(copyObjectCommand))
            if (error) {
                batchItemFailures.push({itemIdentifier: messageId})
                console.error(`could not CopyObject ${src} -> ${dest}`)
            }
            console.log(`info: copied ${src} -> ${dest}`)

        }
        return {
            statusCode: 200,
            batchItemFailures: batchItemFailures,
            body: 'OK: Message sent to webhook',
        }

    } catch (err) {
        return {
            statusCode: 500,
            batchItemFailures: event.Records.map(e => ({itemIdentifier: e.messageId})),
            body: err
        }
    }

}
