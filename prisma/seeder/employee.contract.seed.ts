import { BucketsEnum } from '../../src/shared/file.system'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { uploadObject } from '../../src/server/commands/s3uploader'

export async function seedEmployeeContract(prisma: PrismaClient) {
  const files: string[] = ['git-cheat-sheet-education.pdf', 'html-cheat-sheet.pdf']

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.employee_contract, true)
  })

  const departements: string[] = ['BDO', 'Head of Finance', 'Tech', 'Civil']
  const employees = await prisma.employee.findMany({})

  const spvs = await prisma.employee.findMany({
    where: {
      user: {
        email: {
          in: ['khairani.u@gmail.com', 'nurizkaf96@gmail.com', 'alfiankan19@gmail.com', 'fadh.dzaki@gmail.com'],
        },
      },
    },
  })

  console.log('total', spvs.length)

  employees.forEach((employee) => {
    for (let i = 0; i < 5; i++) {
      prisma.employee_contracts
        .create({
          data: {
            employee_id: employee.id,
            contract_name: faker.name.jobTitle(),
            position: faker.name.jobType(),
            doc_path: [`${BucketsEnum.employee_contract}/${files[faker.datatype.number({ min: 0, max: 1 })]}`],
            contract_started: new Date(),
            department: departements[faker.datatype.number({ min: 0, max: 3 })],
            emp_status: 'Full Time',
            contract_number: uuidv4().replace(/-/g, ''),
            contract_ended: new Date(Date.now() + 3600 * 1000 * 24 * 30 * faker.datatype.number({ min: 7, max: 24 })),
            supervisor_id: spvs[faker.datatype.number({ min: 0, max: 3 })].id,
          } as Prisma.employee_contractsUncheckedCreateInput,
        })
        .catch((err) => console.log('errr', err))
    }
  })
  console.log('employee.contract.seed')
}
