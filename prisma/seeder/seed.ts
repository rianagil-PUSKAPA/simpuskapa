import { PrismaClient } from '@prisma/client'
import { seedAclTemplate } from './acl.template.seed'
import { seedEmployeeContract } from './employee.contract.seed'
import { seedEmployeePerformance } from './employee.performance.seed'
import { seedEmployee } from './employee.seed'
import { seedEmployeeTraining } from './employee.training.seed'
import { seedUser } from './user.seed'
import { seedEmployeeTimeOff } from './employee.timeoff.seed'
import { seedVendor } from './vendor.seed'
import { Prata } from 'next/font/google'
import { seedPartner } from './partner.seed'
import { seedProgram } from './program.seed'
import { seedProject } from './project.seed'
import { seedRF } from './rf.seed'
import { seedPR } from './pr.seed'

const prisma = new PrismaClient()

async function main() {
  await seedUser(prisma)
  await seedAclTemplate(prisma)
  await seedEmployee(prisma)
  await seedEmployeePerformance(prisma)
  await seedEmployeeContract(prisma)
  await seedEmployeeTraining(prisma)
  await seedEmployeeTimeOff(prisma)
  await seedVendor(prisma)
  await seedPartner(prisma)
  await seedProgram(prisma)
  await seedProject(prisma)
  await seedRF(prisma)
  await seedPR(prisma)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
