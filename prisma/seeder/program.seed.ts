import { Prisma, PrismaClient, ProgramApproval } from '@prisma/client'
import { faker } from '@faker-js/faker'

export async function seedProgram(prisma: PrismaClient) {
  const partners = await prisma.partners.findFirst()
  const employee = await prisma.employee.findFirst({
    where: { deleted_at: null },
  })
  for (let x = 0; x < 10; x++) {
    await prisma.programs.create({
      data: {
        code: faker.datatype.hexadecimal({ case: 'upper', length: 4 }),
        currency: 'IDR',
        contract: {
          contract_number: faker.datatype.hexadecimal({
            length: 5,
            case: 'upper',
          }),
          contract_path: [],
        },
        timeline: {
          start_date: {
            month: 9,
            year: 2022,
          },
          end_date: {
            month: 12,
            year: 2022,
          },
        },
        submitted_by: employee.id,
        submitted_at: new Date().toISOString(),
        partner_code: partners.code,
        program_name: faker.name.fullName(),
        grant_manager: employee.id,
        program_manager: employee.id,
        program_officer: employee.id,
        estimated_budget: faker.datatype.number({ min: 45000, max: 4000000 }),
        program_description: faker.lorem.sentence(3),
        finance_progress: faker.datatype.number({ min: 40, max: 100 }),
        approval: ['success', 'pending', 'rejected'][faker.datatype.number({ min: 0, max: 2 })] as ProgramApproval,
      },
    })
  }

  console.log('partner.seed')
}
