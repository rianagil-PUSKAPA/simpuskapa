import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'
import { uploadObject } from '../../src/server/commands/s3uploader'
import { Password } from '../../src/server/common/password'
import { AclDefinition, aclLabels } from '../../src/shared/acl.labels'
import { BucketsEnum } from '../../src/shared/file.system'
import { RoleDefinition } from '../../src/shared/role.access'

export async function seedUser(prisma: PrismaClient) {
  const password = Password.createPassword('12345678Ab#')
  const onlyAcl = new Array<string>()
  aclLabels.forEach((_, acl) => {
    onlyAcl.push(acl)
  })

  const avatars: string[] = [
    'avatar-1.jpeg',
    'avatar-2.jpeg',
    'avatar-3.jpeg',
    'avatar-4.jpeg',
    'avatar-5.jpeg',
    'avatar-6.jpeg',
  ]

  avatars.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.user_avatars, false)
  })

  // test/admin/super
  await prisma.users.create({
    data: {
      email: 'root@test.com',
      password: Password.createPassword('54321Abcdef#'),
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [...onlyAcl],
    } as Prisma.usersCreateInput,
  })

  // roled user

  await prisma.users.create({
    data: {
      email: 'test_admin@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.ADMIN],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'hof@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.HEAD_OF_FINANCE],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'hoo@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.HEAD_OF_OPERATION],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'staff_admin@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.STAFF],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'superadmin_admin@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.SUPERADMIN],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'supervisor_admin@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.SUPERVISOR],
    } as Prisma.usersCreateInput,
  })

  await prisma.users.create({
    data: {
      email: 'hrteam_admin@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [],
      role: [RoleDefinition.HR_TEAM],
    } as Prisma.usersCreateInput,
  })

  // admin
  await prisma.users.create({
    data: {
      email: 'fadh.dzaki@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [...onlyAcl],
    } as Prisma.usersCreateInput,
  })
  await prisma.users.create({
    data: {
      email: 'alfiankan19@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [...onlyAcl],
    } as Prisma.usersCreateInput,
  })
  await prisma.users.create({
    data: {
      email: 'nurizkaf96@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [...onlyAcl],
    } as Prisma.usersCreateInput,
  })
  await prisma.users.create({
    data: {
      email: 'khairani.u@gmail.com',
      password: password,
      avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
      acl: [...onlyAcl],
    } as Prisma.usersCreateInput,
  })

  for (let i = 0; i < 50; i++) {
    await prisma.users.create({
      data: {
        email: faker.internet.email(),
        password: password,
        avatar: `${BucketsEnum.user_avatars}/${avatars[faker.datatype.number({ min: 0, max: 3 })]}`,
        acl: [
          AclDefinition.EMPLOYEE_ADD_TRAINING_SELF,
          AclDefinition.EMPLOYEE_READ_DETAIL_SELF,
          AclDefinition.EMPLOYEE_READ_CONTRACT_LIST_SELF,
          AclDefinition.EMPLOYEE_READ_LIST_ANY,
        ],
      } as Prisma.usersCreateInput,
    })
  }

  const adminAcls = new Map<string, boolean>()
  aclLabels.forEach((_, acl) => {
    adminAcls.set(acl, true)
  })

  console.log('user.seed')
}
