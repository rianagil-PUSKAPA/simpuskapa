import { uploadObject } from '../../src/server/commands/s3uploader'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { BucketsEnum } from '../../src/shared/file.system'

export async function seedEmployee(prisma: PrismaClient) {
  const files: string[] = ['git-cheat-sheet-education.pdf', 'html-cheat-sheet.pdf']

  const avatars: string[] = [
    'avatar-1.jpeg',
    'avatar-2.jpeg',
    'avatar-3.jpeg',
    'avatar-4.jpeg',
    'avatar-5.jpeg',
    'avatar-6.jpeg',
  ]

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_cv, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_bank, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_bpjs, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_bpjs_emp, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_identity_card, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_passport, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_emergency, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_npwp, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_kk, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_insurance, true)
  })
  avatars.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_pass_photo, false)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_health_insurance, true)
  })
  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_recruitment_docs, true)
  })

  const users = await prisma.users.findMany({})
  users.forEach((user) => {
    prisma.employee
      .create({
        data: {
          user_id: user.id,
          staff_id: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 6),
          gender: faker.name.sex(),
          full_name: faker.name.fullName(),
          pob: faker.address.city(),
          dob: faker.date.birthdate(),
          religion: 'muslim',
          form_progress: 100,
          form_state: JSON.stringify({}),
          is_lock: true,
          marital_status: 'maried',
          nationality: faker.address.country(),
          id_card_address: faker.address.streetAddress(),
          residence_address: faker.address.streetAddress(),
          phone_number: faker.phone.number('+6281#######'),
          identity_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 16),
          passport_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 16),
          swift_code: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 8),
          npwp_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 8),
          bpjs_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 8),
          bpjs_tkn_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 8),
          kk_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 10),
          insurance_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 8),
          emergency_contacts: JSON.stringify([
            {
              emergency_id: uuidv4(),
              emergency_name: faker.name.fullName(),
              emergency_phone_number: faker.phone.number('+62_###########'),
              emergency_relationship: 'father',
            },
          ]),
          bank_name: faker.company.name(),
          bank_branch: faker.address.cityName(),
          bank_acc_number: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 6),
          bank_acc_name: faker.name.fullName(),
          cv_path: [`${BucketsEnum.employee_cv}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          bank_path: [`${BucketsEnum.employee_bank}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          bpjs_emp_path: [`${BucketsEnum.employee_bpjs_emp}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          bpjs_path: [`${BucketsEnum.employee_bpjs}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          identity_path: [`${BucketsEnum.employee_identity_card}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          passport_path: [`${BucketsEnum.employee_passport}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          emergency_path: [`${BucketsEnum.employee_emergency}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          npwp_path: [`${BucketsEnum.employee_npwp}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          kk_path: [`${BucketsEnum.employee_kk}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          insurance_path: [`${BucketsEnum.employee_insurance}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          pass_photo_path: [`${BucketsEnum.employee_pass_photo}/${avatars[faker.datatype.number({ min: 0, max: 1 })]}`],
          health_insurance_path: [
            `${BucketsEnum.employee_health_insurance}/${files[faker.datatype.number({ min: 0, max: 1 })]}`,
          ],
          health_insurance_number: String(uuidv4()),
          recruitment_documents_path: [
            `${BucketsEnum.employee_recruitment_docs}/${files[faker.datatype.number({ min: 0, max: 1 })]}`,
          ],
        } as Prisma.employeeUncheckedCreateInput,
      })
      .catch((err) => console.log('errr', err))
  })
  console.log('employee.seed')
}
