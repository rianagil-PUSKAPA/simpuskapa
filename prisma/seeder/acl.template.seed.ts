import { Prisma, PrismaClient } from '@prisma/client'
import { AclDefinition, aclLabels } from '../../src/shared/acl.labels'

export async function seedAclTemplate(prisma: PrismaClient) {
  await prisma.acl_templates.create({
    data: {
      role_name: 'admin',
      acl: [...aclLabels.keys()],
    } as Prisma.acl_templatesCreateInput,
  })

  await prisma.acl_templates.create({
    data: {
      role_name: 'staff',
      acl: [AclDefinition.USER_READ, AclDefinition.USER_EDIT],
    } as Prisma.acl_templatesCreateInput,
  })

  await prisma.acl_templates.create({
    data: {
      role_name: 'receptionist',
      acl: [AclDefinition.ACL_KEYS, AclDefinition.ACL_CREATE_TEMPLATE],
    } as Prisma.acl_templatesCreateInput,
  })
  console.log('acl.template.seed')
}
