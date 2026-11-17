import { EmployeeDataRequest } from '@/server/types/employee.dto'
import { faker } from '@faker-js/faker'
import { v4 as uuidv4 } from 'uuid'

export function createEmployeeRequest(userId: string): EmployeeDataRequest {
  const employe = {
    user_id: userId,
    staff_id: uuidv4(),
    gender: faker.name.sex(),
    full_name: faker.name.fullName(),
    pob: faker.address.city(),
    dob: faker.date.birthdate(),
    religion: 'muslim',
    marital_status: 'maried',
    nationality: faker.address.country(),
    id_card_address: faker.address.streetAddress(),
    residence_address: faker.address.streetAddress(),
    phone_number: faker.phone.number(),
    identity_number: uuidv4(),
    npwp_number: uuidv4(),
    bpjs_number: uuidv4(),
    bpjs_tkn_number: uuidv4(),
    kk_number: uuidv4(),
    insurance_number: uuidv4(),
    emergency_contacts: JSON.stringify({
      name: faker.name.fullName(),
      phone_number: faker.phone.number('+6281#######'),
      relationship: 'father',
    }),
    bank_name: faker.company.name(),
    bank_branch: faker.address.streetAddress(),
    bank_acc_number: uuidv4(),
    bank_acc_name: faker.name.fullName(),
  } as EmployeeDataRequest
  return employe
}
