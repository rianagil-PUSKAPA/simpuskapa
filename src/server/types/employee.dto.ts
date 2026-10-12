import { ApiProperty } from '@nestjs/swagger'
import { Gender, MaritalStatus } from '@prisma/client'
import { HttpBaseResponse } from './base.response.dto'
import { EmployeeContract } from './employee.contract.dto'

export class EmployeeStatus {
  public static readonly ACTIVE = 'ACTIVE'
  public static readonly RESIGNED = 'RESIGNED'
}

class EmployeeUser {
  @ApiProperty()
  email?: string
  @ApiProperty()
  avatar?: string
  @ApiProperty()
  role?: string[]
  @ApiProperty()
  status?: boolean
}

class EmergencyContact {
  @ApiProperty()
  name?: string
  @ApiProperty()
  phone_number?: string
  @ApiProperty()
  relationship?: string
}

export class Employee {
  @ApiProperty()
  id?: string
  @ApiProperty()
  staff_id?: string | null
  @ApiProperty()
  user_id?: string
  @ApiProperty({ enum: [Gender.male.toString(), Gender.female.toString()] })
  gender?: Gender | null
  @ApiProperty()
  full_name: string
  @ApiProperty()
  pob?: string | null
  @ApiProperty({ type: 'string' })
  dob?: Date | string
  @ApiProperty()
  religion?: string | null
  @ApiProperty({
    enum: [MaritalStatus.maried.toString(), MaritalStatus.not_maried.toString()],
  })
  marital_status?: MaritalStatus | null
  @ApiProperty()
  nationality?: string | null
  @ApiProperty()
  id_card_address?: string | null
  @ApiProperty()
  residence_address?: string | null
  @ApiProperty()
  phone_number?: string | null
  @ApiProperty()
  identity_number?: string | null
  @ApiProperty()
  npwp_number?: string | null
  @ApiProperty()
  bpjs_number?: string | null
  @ApiProperty()
  bpjs_tkn_number?: string | null
  @ApiProperty()
  kk_number?: string | null
  @ApiProperty()
  passport_number?: string | null
  @ApiProperty({ type: 'string' })
  passport_expiry?: Date | string | null
  @ApiProperty()
  insurance_number?: string | null

  @ApiProperty({ type: String })
  emergency_contacts?: string | null

  @ApiProperty()
  bank_name?: string | null
  @ApiProperty()
  bank_branch?: string | null
  @ApiProperty()
  bank_acc_number?: string | null
  @ApiProperty()
  bank_acc_name?: string | null
  @ApiProperty()
  swift_code?: string | null
  @ApiProperty()
  cv_path?: string[] | null
  @ApiProperty()
  identity_path?: string[] | null
  @ApiProperty()
  passport_path?: string[] | null
  @ApiProperty()
  npwp_path?: string[] | null
  @ApiProperty()
  bpjs_path?: string[] | null
  @ApiProperty()
  bpjs_emp_path?: string[] | null
  @ApiProperty()
  kk_path?: string[] | null
  @ApiProperty()
  insurance_path?: string[] | null
  @ApiProperty()
  emergency_path?: string[] | null
  @ApiProperty()
  bank_path?: string[] | null
  @ApiProperty()
  pass_photo_path?: string[] | null
  @ApiProperty({ type: 'string' })
  created_at?: Date | string | string
  @ApiProperty({ type: 'string' })
  updated_at?: Date | string
  @ApiProperty({ type: 'string' })
  deleted_at?: Date | string | null
  @ApiProperty({ type: [EmployeeContract] })
  employee_contracts?: EmployeeContract[]
  @ApiProperty({ type: EmployeeUser })
  user?: EmployeeUser
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  is_lock?: boolean
  @ApiProperty()
  form_state?: string

  @ApiProperty()
  health_insurance_number?: string | null
  @ApiProperty()
  health_insurance_path?: string[] | null
  @ApiProperty()
  recruitment_documents_path?: string[] | null
  @ApiProperty()
  recruitment_documents_title?: string | null
  @ApiProperty()
  cv_title?: string | null
  @ApiProperty()
  perdiem_tax_percentage?: number
}

export class EmployeeUpdateRequest extends Employee {
  id?: string
}

export class EmployeeListDataResponse extends HttpBaseResponse<Employee[]> {
  @ApiProperty({ type: [Employee] })
  data: Employee[]
}

export class EmployeeDataResponse extends HttpBaseResponse<Employee> {
  @ApiProperty({ type: Employee })
  data: Employee
}

export class EmployeeDataRequest extends Employee {
  user_id: string
}

export class EmployeeInitRequest {
  user_id: string
  @ApiProperty()
  full_name?: string
  @ApiProperty()
  email?: string | null
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  is_lock?: boolean
  @ApiProperty()
  form_state?: string
}

export class AddEmplloyeeTrainingRequest {
  @ApiProperty()
  file_path?: string[]
  @ApiProperty()
  training_name?: string
  @ApiProperty({ type: 'string' })
  training_date?: string
  @ApiProperty()
  organizer?: string
  @ApiProperty()
  source_fund?: string
}

export class EmployeePerdiemTaxSetValue {
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  perdiem_tax_percentage?: number
}

export class EmployeePerdiemTaxSet {
  @ApiProperty({ type: [EmployeePerdiemTaxSetValue] })
  employees?: EmployeePerdiemTaxSetValue[]
}
