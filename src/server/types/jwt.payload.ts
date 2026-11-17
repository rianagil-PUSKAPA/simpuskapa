export class AppJwtPayload {
  id: string
  email: string
  acl: string[]
  role: string[]
  employee_name?: string
  employee_id?: string
  avatar?: string
  pass_photo?: string
  is_active?: boolean
}
