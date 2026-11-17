import { uploadObject } from '../../src/server/commands/s3uploader'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { BucketsEnum } from '../../src/shared/file.system'

export async function seedEmployeeTraining(prisma: PrismaClient) {
  const files: string[] = ['git-cheat-sheet-education.pdf', 'html-cheat-sheet.pdf']

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_trainings, true)
  })

  const employees = await prisma.employee.findMany({})
  employees.forEach((employee) => {
    for (let i = 0; i < 5; i++) {
      prisma.trainings
        .create({
          data: {
            employee_id: employee.id,
            organizer: faker.company.name(),
            source_fund: faker.company.name(),
            training_name: faker.name.fullName(),
            certificate_path: [`${BucketsEnum.employee_trainings}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
            training_date: new Date(),
          } as Prisma.trainingsUncheckedCreateInput,
        })
        .catch((err) => console.log('errr', err))
    }
  })
  console.log('employee.training.seed')
}
