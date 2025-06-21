import {CopyObjectCommand, HeadObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {SQSEvent} from 'aws-lambda'
import {TenantDataSchema} from "../api-gateway/api-lambda/express-app/models/tenantModel";
import {unmarshall} from "@aws-sdk/util-dynamodb";
import {tryCatch} from "../api-gateway/api-lambda/express-app/utils/tryCatch";

const s3Client = new S3Client()
const onPrettyMTUploadBucketName = process.env.onPrettyMTUploadBucketName

exports.handler = async (event: SQSEvent) => {
    if (!onPrettyMTUploadBucketName) throw new Error('onPrettyMTUploadBucketName undefined')
    const batchItemFailures: { itemIdentifier: string }[] = []

    try {
        for (const record of event.Records) {
            const messageId = record.messageId
            const {data: maybeTenantData} = unmarshall(JSON.parse(record.body))
            // console.log(maybeTenantData)
            const srcKey = `default/index.html`

            try {
                const tenantData = TenantDataSchema.parse(maybeTenantData)
                const destKey = `${tenantData.tenantOwnerIdentityId}/${tenantData.name}/index.html`
                // check if src exists
                const headObjectCommand = new HeadObjectCommand({
                    Bucket: onPrettyMTUploadBucketName,
                    Key: srcKey,
                })
                const {error: headError} = await tryCatch(s3Client.send(headObjectCommand))
                if (headError) throw new Error(`headObjectCommand ${srcKey} in ${onPrettyMTUploadBucketName}: ${headError}`)

                // Copy src -> dest
                const copyObjectCommand = new CopyObjectCommand({
                    Bucket: onPrettyMTUploadBucketName,
                    CopySource: `${onPrettyMTUploadBucketName}/${srcKey}`,
                    Key: destKey
                })
                const {error: copyError} = await tryCatch(s3Client.send(copyObjectCommand))
                if (copyError) throw new Error(`copyObjectCommand ${srcKey} -> ${destKey} in ${onPrettyMTUploadBucketName}: ${copyError}`)

                console.log(`info: copied ${srcKey} -> ${destKey}`)
            } catch (e) {
                console.error(e)
                batchItemFailures.push({itemIdentifier: messageId})
            }

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
