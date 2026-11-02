import { BucketsVisibility, createS3Client } from '../../shared/file.system'
import * as AWS from '@aws-sdk/client-s3'
import fs from 'fs'

export async function uploadCsvFileString(csvData: string, fileName: string, bucket: string) {
  if (process.env.JEST == 'testing') {
    return
  }

  const input = {
    Bucket: bucket,
    Key: fileName,
    Body: csvData,
    Tagging: 'allow_all=true',
    ACL: BucketsVisibility.visibilities[bucket],
  } as AWS.PutObjectCommandInputType

  input.ContentType = 'text/csv'

  const command = new AWS.PutObjectCommand(input)

  const client = createS3Client()
  const upload = await client.send(command)
  console.log(upload.$metadata)
}

export async function uploadObject(filePath: string, fileName: string, bucket: string, pdfPreview = false) {
  if (process.env.JEST == 'testing') {
    return
  }

  const fileStream = fs.createReadStream(filePath)
  fileStream.on('error', function (err) {
    if (err) {
      throw err
    }
  })

  const input = {
    Bucket: bucket,
    Key: fileName,
    Body: fileStream,
    Tagging: 'allow_all=true',
    ACL: BucketsVisibility.visibilities[bucket],
  } as AWS.PutObjectCommandInputType

  if (pdfPreview) {
    input.ContentDisposition = 'inline'
    input.ContentType = 'application/pdf'
  }

  const command = new AWS.PutObjectCommand(input)

  const client = createS3Client()
  const upload = await client.send(command)
  console.log(upload.$metadata)
}
