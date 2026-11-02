import { RoleDefinition } from '@/shared/role.access'
import { DepartmentPosition } from '@/types/global'

export const MAIN_URL_FE = process.env.NEXT_PUBLIC_MAIN_URL_FE
export const MAIN_URL_BE = process.env.NEXT_PUBLIC_MAIN_URL_BE
export const API_URL_FE = process.env.NEXT_PUBLIC_API_URL_FE
export const S3_ENDPOINT = process.env.NEXT_PUBLIC_S3_ENDPOINT

export const STAFF = RoleDefinition.STAFF
export const SUPERVISOR = RoleDefinition.SUPERVISOR
export const HR_TEAM = RoleDefinition.HR_TEAM
export const ADMIN = RoleDefinition.ADMIN
export const SUPERADMIN = RoleDefinition.SUPERADMIN

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV

export const DEPARTMENT_OPTIONS: DepartmentPosition[] = [
  {
    department: 'Director',
    position: ['Director'],
  },
  {
    department: 'Technical',
    position: [
      'Head of Programs',
      'Senior Researcher',
      'Lead for Social Inclusion and Protection',
      'Lead for Legal Identity and CRVS',
      'Lead for Acess to Justice',
      'Lead for Research, Monitoring and Evaluation',
      'Senior Research and Advocacy Associate',
      'Research and Advocacy Associate',
      'Research and Advocacy Officer',
      'Research Affiliate',
      'Project Officer',
    ],
  },
  {
    department: 'Finance',
    position: ['Head of Finance', 'Senior Finance Officer', 'Finance Assistant', 'Finance Staff'],
  },
  {
    department: 'Operations',
    position: [
      'Head of Operations',
      'Senior Logistic and Procurement Officer',
      'Logistic and Procurement Officer',
      'General Affair Officer',
      'Administrative Officer',
      'Office Assistant',
      'Manager Program and Operations',
      'General Staff',
      'IT Support',
    ],
  },
  {
    department: 'Communication',
    position: ['Communication and Relations Manager', 'Communication Officer'],
  },
  {
    department: 'Knowledge Management',
    position: ['Knowledge Manager', 'Knowledge Assistant'],
  },
]

export const LEAVE_TYPE = {
  annual: 'annual',
  sick_certified: 'sick_certified',
  sick_uncertified: 'sick_uncertified',
  special: 'special',
  compensatory: 'compensatory',
  maternity: 'maternity',
  paternity: 'paternity',
  work_remotely: 'work_remotely',
  isolation: 'isolation',
  caregiving: 'caregiving',
}

export const leaveTypeList: string[] = Object.getOwnPropertyNames(LEAVE_TYPE)

const currentDate = new Date()

export const firstDayIndexWeek = currentDate.getDate() - currentDate.getDay()
export const lastDayIndexWeek = firstDayIndexWeek + 6

export const firstDayInWeekday = new Date(currentDate.setDate(firstDayIndexWeek + 1))
export const lastDayInWeekday = new Date(currentDate.setDate(lastDayIndexWeek - 1))

export const ROLE_OPTION = {
  ADD_NEW_EMPLOYEE_DATA: 'Add new employee data',
  VIEW_EMPLOYEE_LIST_ALL: 'View employee list (all)',
  VIEW_EMPLOYEE_LIST_SUBORDINATE: 'View employee list (subordinate)',
  VIEW_EMPLOYEE_DETAIL_SELF: 'View employee detail (self)',
  VIEW_EMPLOYEE_DETAIL_ALL: 'View employee detail (all)',
  VIEW_EMPLOYEE_DETAIL_SUBORDINATE: 'View employee detail (subordinate)',
}

export const ROLE_FEATURES = [
  {
    name: 'Add new employee data',
    roles: [HR_TEAM, ADMIN, SUPERADMIN],
  },
  {
    name: 'View employee list (all)',
    roles: [STAFF, SUPERVISOR, HR_TEAM, ADMIN, SUPERADMIN],
  },
  {
    name: 'View employee list (subordinate)',
    roles: [SUPERVISOR, SUPERADMIN],
  },
  {
    name: 'View employee detail (self)',
    roles: [STAFF, SUPERVISOR, HR_TEAM, SUPERADMIN],
  },
  {
    name: 'View employee detail (all)',
    roles: [HR_TEAM, ADMIN, SUPERADMIN],
  },
  {
    name: 'View employee detail (subordinate)',
    roles: [SUPERVISOR, SUPERADMIN],
  },
]

export const MONTHS = [
  {
    id: 1,
    name: 'January',
  },
  {
    id: 2,
    name: 'February',
  },
  {
    id: 3,
    name: 'March',
  },
  {
    id: 4,
    name: 'April',
  },
  {
    id: 5,
    name: 'May',
  },
  {
    id: 6,
    name: 'June',
  },
  {
    id: 7,
    name: 'July',
  },
  {
    id: 8,
    name: 'August',
  },
  {
    id: 9,
    name: 'September',
  },
  {
    id: 10,
    name: 'October',
  },
  {
    id: 11,
    name: 'November',
  },
  {
    id: 12,
    name: 'December',
  },
]

export const TYPE_LIST: string[] = [
  'goods',
  'subscriptions',
  'miscellaneous',
  'services',
  'travel',
  'event',
  'consultant',
]

export const VENDOR_ANNONATE = [
  'Insurance',
  'Auditor',
  'Others',
  'Translator',
  'Interpreter',
  'Sign Language',
  'Transcriber',
  'Notulen',
  'Proofreader',
  'Master of Ceremony',
  'Key Person',
  'Moderator',
  'Designer',
  'Editor',
  'Photographer',
  'Videographer',
  'Online Services',
  'Software',
  'Hotels',
  'Food Services',
  'Room Rental',
  'Transportation',
  'Item / Tools Rental',
  'Travel Agent',
  'Event Organizer',
  'ATK',
  'IT / Peripherals',
  'Printing',
  'Equipments',
]

export const VENDOR_TYPES = {
  goods: ['ATK', 'IT / Peripherals', 'Printing', 'Equipments', 'Others'],
  services: [
    'Translator',
    'Interpreter',
    'Sign Language',
    'Transcriber',
    'Notulen',
    'Proofreader',
    'Master of Ceremony',
    'Key Person',
    'Moderator',
    'Designer',
    'Editor',
    'Photographer',
    'Videographer',
    'Others',
  ],
  subscription: ['Online Services', 'Software', 'Others'],
  travel: ['Airfare', 'Perdiem', 'Transportation', 'Vehicle Rental', 'Accomodation', 'Others'],
  event: [
    'Accommodations',
    'Food Services',
    'Room Rental',
    'Transportation',
    'Item / Tools Rental',
    'Travel Agent',
    'Event Organizer',
    'Others',
  ],
  miscellaneous: ['Insurance', 'Auditor', 'Others'],
  consultant: ['??', 'Others'],
}

export const PUSKAPA_ROLES = [
  'Staff',
  'Supervisor',
  'Admin',
  'Superadmin',
  'General Manager',
  'Grant Manager',
  'Program Manager',
  'Program Officer',
  'Ops Team',
  'Head of Operation',
  'Head of Finance',
  'Finance Team',
  'Program Team',
  'Comms Team',
  'Knowledge Team',
]

export const UNFIX_TRANSPORT = 'Transportation'

export const FINANCE_DEPT = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM]

export const FUND_RECEIVED_TYPE = {
  PUSKAPA: 'PUSKAPA',
  DONOR: 'DONOR',
  DONOR_REIMBURSE: 'DONOR-REIMBURSE',
}
