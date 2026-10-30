import { BucketsEnum, BucketsVisibility } from '@/shared/file.system'
import * as AWS from '@aws-sdk/client-s3'
import { CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'

async function main() {
  dotenv.config()
  console.log('Creating buckets...')
  console.log('Endpoint: ', process.env.S3_ENDPOINT)
  console.log('Region: ', process.env.S3_REGION)
  const buckets = Object.values(BucketsEnum)
  const client = new AWS.S3({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  })

  buckets.forEach(async (bucketName) => {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
      ACL: BucketsVisibility.visibilities[bucketName],
    })

    const commandCORS = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT'],
            AllowedOrigins: ['http://localhost:3000'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })

    try {
      const { Location } = await client.send(command)
      console.log(`Bucket created with location ${Location} visibility ${BucketsVisibility.visibilities[bucketName]}`)
      const { $metadata } = await client.send(commandCORS)
      console.log(`Bucket CORS created with location ${$metadata}`)
      console.table($metadata)
    } catch (err) {
      console.error(err)
    }
  })
}

// run
main()
