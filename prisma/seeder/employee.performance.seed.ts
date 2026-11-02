import { uploadObject } from '../../src/server/commands/s3uploader'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { BucketsEnum } from '../../src/shared/file.system'

export async function seedEmployeePerformance(prisma: PrismaClient) {
  const files: string[] = ['git-cheat-sheet-education.pdf', 'html-cheat-sheet.pdf']

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_performance, true)
  })

  const employees = await prisma.employee.findMany({})
  employees.forEach((employee) => {
    ;['planning', 'mid_year', 'end_year'].forEach((dt) => {
      prisma.performances
        .create({
          data: {
            year: 2022,
            doc_type: dt,
            employee_id: employee.id,
            doc_path: [`${BucketsEnum.employee_performance}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          } as Prisma.performancesUncheckedCreateInput,
        })
        .catch((err) => console.log('errr', err))
    })
  })
  employees.forEach((employee) => {
    ;['planning', 'end_year'].forEach((dt) => {
      prisma.performances
        .create({
          data: {
            year: 2021,
            doc_type: dt,
            employee_id: employee.id,
            doc_path: [`${BucketsEnum.employee_performance}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
          } as Prisma.performancesUncheckedCreateInput,
        })
        .catch((err) => console.log('errr', err))
    })
  })
  console.log('employee.performance.seed')
}
