import * as AWS from '@aws-sdk/client-s3'
import { PutObjectCommandInput } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class BucketsEnum {
  public static readonly employee_cv = 'puskapa-employee-cv'
  public static readonly employee_identity_card = 'puskapa-employee-identity-card'
  public static readonly employee_passport = 'puskapa-employee-passport'
  public static readonly employee_npwp = 'puskapa-employee-npwp'
  public static readonly employee_bpjs = 'puskapa-employee-bpjs'
  public static readonly employee_bpjs_emp = 'puskapa-employee-bpjs-emp'
  public static readonly employee_kk = 'puskapa-employee-kk'
  public static readonly employee_insurance = 'puskapa-employee-insurance'
  public static readonly employee_emergency = 'puskapa-employee-emergency'
  public static readonly employee_bank = 'puskapa-employee-bank'
  public static readonly employee_pass_photo = 'puskapa-employee-pass-photo'
  public static readonly employee_trainings = 'puskapa-employee-trainings'
  public static readonly employee_contract = 'puskapa-employee-contract'
  public static readonly employee_performance = 'puskapa-employee-performance'
  public static readonly user_avatars = 'puskapa-user-avatars'
  public static readonly employee_timeoff = 'puskapa-employee-timeoff'
  public static readonly employee_health_insurance = 'puskapa-employee-health-insurance'
  public static readonly employee_recruitment_docs = 'puskapa-employee-recruitment-docs'
  public static readonly vendor_files = 'puskapa-vendor-files'
  public static readonly program_snapshoot = 'puskapa-program-snapshoot'
  public static readonly program_contract = 'puskapa-program-contract'
  public static readonly revise_approval_doc = 'revise-approval-doc'
  public static readonly rf_doc = 'puskapa-rf-doc'
  public static readonly pr_attachment = 'puskapa-pr-attachment'
  public static readonly puskapa_program_transfer_list = 'puskapa-program-transfer-list'
}

export class BucketsVisibility {
  public static readonly visibilities = {
    [BucketsEnum.employee_pass_photo]: 'private',
    [BucketsEnum.employee_cv]: 'private',
    [BucketsEnum.employee_identity_card]: 'private',
    [BucketsEnum.employee_passport]: 'private',
    [BucketsEnum.employee_npwp]: 'private',
    [BucketsEnum.employee_bpjs]: 'private',
    [BucketsEnum.employee_bpjs_emp]: 'private',
    [BucketsEnum.employee_kk]: 'private',
    [BucketsEnum.employee_insurance]: 'private',
    [BucketsEnum.employee_emergency]: 'private',
    [BucketsEnum.employee_bank]: 'private',
    [BucketsEnum.employee_trainings]: 'private',
    [BucketsEnum.employee_contract]: 'private',
    [BucketsEnum.employee_performance]: 'private',
    [BucketsEnum.user_avatars]: 'private',
    [BucketsEnum.employee_timeoff]: 'private',
    [BucketsEnum.employee_health_insurance]: 'private',
    [BucketsEnum.employee_recruitment_docs]: 'private',
    [BucketsEnum.vendor_files]: 'private',
    [BucketsEnum.program_snapshoot]: 'private',
    [BucketsEnum.program_contract]: 'private',
    [BucketsEnum.revise_approval_doc]: 'private',
    [BucketsEnum.rf_doc]: 'private',
    [BucketsEnum.pr_attachment]: 'private',
    [BucketsEnum.puskapa_program_transfer_list]: 'private',
  }
}

export class BucketPathColumn {
  public static readonly bucketColumn = {
    [BucketsEnum.employee_pass_photo]: 'pass_photo_path',
    [BucketsEnum.employee_cv]: 'cv_path',
    [BucketsEnum.employee_identity_card]: 'identity_path',
    [BucketsEnum.employee_passport]: 'passport_path',
    [BucketsEnum.employee_npwp]: 'npwp_path',
    [BucketsEnum.employee_bpjs]: 'bpjs_path',
    [BucketsEnum.employee_bpjs_emp]: 'bpjs_emp_path',
    [BucketsEnum.employee_kk]: 'kk_path',
    [BucketsEnum.employee_insurance]: 'insurance_path',
    [BucketsEnum.employee_emergency]: 'emergency_path',
    [BucketsEnum.employee_bank]: 'bank_path',
    [BucketsEnum.employee_trainings]: 'certificate_path',
    [BucketsEnum.employee_contract]: 'doc_path',
    [BucketsEnum.employee_performance]: 'doc_path',
    [BucketsEnum.user_avatars]: 'avatar',
    [BucketsEnum.employee_timeoff]: 'doc_path',
    [BucketsEnum.employee_health_insurance]: 'health_insurance_path',
    [BucketsEnum.employee_recruitment_docs]: 'recruitment_documents_path',
    [BucketsEnum.vendor_files]: '::recheck-path::vendor',
    [BucketsEnum.program_snapshoot]: 'revisions_path',
    [BucketsEnum.program_contract]: 'contract_path',
    [BucketsEnum.revise_approval_doc]: 'revise_approval_doc_path',
  }
}

export class BucketsAllowedFormat {
  public static readonly visibilities = {
    [BucketsEnum.employee_pass_photo]: ['*'],
    [BucketsEnum.employee_cv]: ['*'],
    [BucketsEnum.employee_identity_card]: ['*'],
    [BucketsEnum.employee_passport]: ['*'],
    [BucketsEnum.employee_npwp]: ['*'],
    [BucketsEnum.employee_bpjs]: ['*'],
    [BucketsEnum.employee_bpjs_emp]: ['*'],
    [BucketsEnum.employee_kk]: ['*'],
    [BucketsEnum.employee_insurance]: ['*'],
    [BucketsEnum.employee_emergency]: ['*'],
    [BucketsEnum.employee_bank]: ['*'],
    [BucketsEnum.employee_trainings]: ['*'],
    [BucketsEnum.employee_contract]: ['*'],
    [BucketsEnum.employee_performance]: ['*'],
    [BucketsEnum.user_avatars]: ['*'],
    [BucketsEnum.employee_timeoff]: ['*'],
    [BucketsEnum.employee_health_insurance]: ['*'],
    [BucketsEnum.employee_recruitment_docs]: ['*'],
    [BucketsEnum.vendor_files]: ['*'],
    [BucketsEnum.program_snapshoot]: ['*'],
    [BucketsEnum.program_contract]: ['*'],
    [BucketsEnum.revise_approval_doc]: ['*'],
    [BucketsEnum.rf_doc]: ['*'],
    [BucketsEnum.pr_attachment]: ['*'],
  }
}

export function createS3Client(): AWS.S3 {
  return new AWS.S3({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  })
}

export class ObjectStorageHelpers {
  public static async getUploadPresignedUrl(bucket: string, key: string, expires = 60, pdfPreview = false) {
    const input = {
      Bucket: bucket,
      Key: key,
    } as PutObjectCommandInput

    if (pdfPreview) {
      input.ContentDisposition = 'inline'
      input.ContentType = 'application/pdf'
    }

    const command = new AWS.PutObjectCommand(input)

    const url = await getSignedUrl(createS3Client(), command, {
      expiresIn: expires,
    })
    return url
  }

  public static async getDownloadPresignedUrl(bucket: string, key: string, expires = 60) {
    const command = new AWS.GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const client = createS3Client()

    const url = await getSignedUrl(client, command, {
      expiresIn: expires,
    })
    return url
  }

  public static async deleteFile(bucket: string, key: string) {
    const input: AWS.DeleteObjectCommandInput = {
      Bucket: bucket,
      Key: key,
    }

    await createS3Client().deleteObject(input)
  }
}
