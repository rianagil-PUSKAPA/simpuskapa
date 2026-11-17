import { RoleDefinition } from './role.access'

export const canDeleteAar = (status: string, roles?: readonly string[] | null): boolean =>
  status === 'draft' ||
  (status === 'submitted' &&
    Array.isArray(roles) &&
    roles.some((role) => role === RoleDefinition.ADMIN || role === RoleDefinition.SUPERADMIN))
