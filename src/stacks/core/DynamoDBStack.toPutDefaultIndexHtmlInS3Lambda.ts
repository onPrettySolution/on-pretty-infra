import {CopyObjectCommand, HeadObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {SQSEvent} from 'aws-lambda'
import {TenantDataSchema} from "../api-gateway/api-lambda/express-app/models/tenantModel";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const s3Client = new S3Client()
const onPrettyMTUploadBucketName = process.env.onPrettyMTUploadBucketName

exports.handler = async (event: SQSEvent) => {
    if (!onPrettyMTUploadBucketName) throw new Error('onPrettyMTUploadBucketName undefined')
    const batchItemFailures: { itemIdentifier: string }[] = []

    try {
        for (const record of event.Records) {
            const messageId = record.messageId
            const {data: maybeTenantData} = unmarshall(JSON.parse(record.body))
            console.log(maybeTenantData)
            const src = `${onPrettyMTUploadBucketName}/default/index.html`

            try {
                const tenantData = TenantDataSchema.parse(maybeTenantData)
                const dest = `${onPrettyMTUploadBucketName}/${tenantData.tenantOwnerIdentityId}/index.html`
                // check if src exists
                const headObjectCommand = new HeadObjectCommand({
                    Bucket: onPrettyMTUploadBucketName,
                    Key: src,
                })
                await  s3Client.send(headObjectCommand)

                // Copy src -> dest
                const copyObjectCommand = new CopyObjectCommand({
                    Bucket: onPrettyMTUploadBucketName,
                    CopySource: src,
                    Key: dest
                })
                await s3Client.send(copyObjectCommand)

                console.log(`info: copied ${src} -> ${dest}`)
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
