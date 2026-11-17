import { ADMIN, HR_TEAM, STAFF, SUPERADMIN, SUPERVISOR } from '@/utils/constant'

export type AddNewEmployeeData = {
  features: 'Add new employee data'
  roles?: [typeof HR_TEAM, typeof ADMIN, typeof SUPERADMIN]
}

export type ViewEmployeeListAll = {
  features: 'View employee list (all)'
  roles?: [typeof STAFF, typeof SUPERVISOR, typeof HR_TEAM, typeof ADMIN, typeof SUPERADMIN]
}

export type ViewEmployeeListSubordinate = {
  features: 'View employee list (subordinate)'
  roles?: [typeof SUPERVISOR, typeof SUPERADMIN]
}

export type ViewEmployeeDetailSelf = {
  features: 'View employee detail (self)'
  roles?: [typeof STAFF, typeof SUPERVISOR, typeof HR_TEAM, typeof SUPERADMIN]
}

export type ViewEmployeeDetailAll = {
  features: 'View employee detail (all)'
  roles?: [typeof HR_TEAM, typeof ADMIN, typeof SUPERADMIN]
}

export type ViewEmployeeDetailSubordinate = {
  features: 'View employee detail (subordinate)'
  roles?: [typeof SUPERVISOR, typeof SUPERADMIN]
}
