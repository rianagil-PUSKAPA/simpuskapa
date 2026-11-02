import { uploadObject } from '../../src/server/commands/s3uploader'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { BucketsEnum } from '../../src/shared/file.system'

export async function seedEmployeeTimeOff(prisma: PrismaClient) {
  const files: string[] = ['git-cheat-sheet-education.pdf', 'html-cheat-sheet.pdf']

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_timeoff, true)
  })

  const employees = await prisma.employee.findMany({})
  employees.forEach((employee) => {
    for (let i = 0; i < 5; i++) {
      const only_year_now = new Date().getFullYear()

      const starting = faker.date.between(
        `${only_year_now}-01-01T00:00:00.000Z`,
        `${only_year_now}-07-01T00:00:00.000Z`,
      )
      const end_date = new Date(starting.getTime() + 3600 * 1000 * 24 * faker.datatype.number({ min: 1, max: 5 }))

      prisma.time_off_request
        .create({
          data: {
            employee_id: employee.id,
            pic_employee_id: employee.id,
            start_date: starting,
            end_date: end_date,
            leave_type: 'annual',
            approved_at: new Date(),
            duration: faker.datatype.number({ min: 1, max: 5 }),
            notes: faker.lorem.paragraph(),
            doc_path: [`${BucketsEnum.employee_timeoff}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
            status: ['approved', 'rejected', 'declined', 'cancelled'][faker.datatype.number({ min: 1, max: 2 })],
          } as Prisma.time_off_requestUncheckedCreateInput,
        })
        .catch((err) => console.log('errr', err))
    }
  })
  console.log('employee.timeoff.seed')
}
