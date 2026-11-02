import { Prisma, PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

export async function seedProject(prisma: PrismaClient) {
  const programs = await prisma.programs.findMany()

  for (const program of programs) {
    const projectInserted = await prisma.projects.create({
      data: {
        code: faker.datatype.hexadecimal({ length: 5, case: 'upper' }),
        ordering_seq: faker.datatype.number({ min: 1, max: 5 }),
        description: faker.lorem.words(5),
        program_id: program.id,
      } as Prisma.projectsUncheckedCreateInput,
    })

    const activity = await prisma.activities.create({
      data: {
        project_id: projectInserted.id,
        description: faker.lorem.words(10),
        ordering_seq: faker.datatype.number({ min: 1, max: 10 }),
        timeline: {
          start: '2011-10-05T14:48:00.000Z',
          end: '2011-10-05T14:48:00.000Z',
        },
        code: faker.datatype.hexadecimal({ length: 3, case: 'upper' }),
        proposed_milestone: faker.lorem.word(10),
        due_date: '2011-10-05T14:48:00.000Z',
        notes: faker.lorem.paragraph(1),
      },
    })
    const selectedType = await prisma.vendor_type.findFirst()

    const selectedCateory = await prisma.vendor_category_information.findFirst({
      where: {
        vendor_type_id: selectedType.id,
      },
    })
    console.log('seeding budget')
    for (let i = 1; i < 5; i++) {
      console.log(i)
      await prisma.budgets.create({
        data: {
          ordering_seq: i,
          code: faker.datatype.hexadecimal({ length: 5, case: 'upper' }),
          description: faker.lorem.word(10),
          vendor_category_info_id: selectedCateory.id,
          qty: faker.datatype.number({ max: 100, min: 10 }),
          unit: ['pack', 'pcs'][faker.datatype.number({ min: 0, max: 1 })],
          pkg_qty: faker.datatype.number({ max: 5, min: 1 }),
          pkg_unit: 'time',
          cost: faker.datatype.number({ min: 10000, max: 1000000 }),
          activity_id: activity.id,
        } as Prisma.budgetsUncheckedCreateInput,
      })
    }
  }

  console.log('project.seed')
}
