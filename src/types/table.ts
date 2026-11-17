export type EmploymentContract = {
  id: string
  position: string
  department: string
  supervisor: {
    image: string
    name: string
  }
  empStatus: string
  joinedDate: string
}

export type Employee = {
  id: string
  avatar: {
    image: string
    name: string
    email: string
  }
  idNumber: number
  position: string
  department: string
  empStatus: string
}

export type SwitchingLayoutType = {
  name: string
  status: boolean
}

export type optionsType = {
  id: number
  name: string
}

export type AnnualTeamOff = {
  employee_id: string
  full_name: string
  avatar: string
  position: string
  department: string
  quota: number
  used: number
  remaining: number
  email: string
  employee_number: string
}
