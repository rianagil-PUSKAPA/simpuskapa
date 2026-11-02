import { Injectable } from '@nestjs/common'
import { employee_contracts as EmployeeContract, performances as EmployeePerformance, Prisma } from '@prisma/client'
import { EmployeePerformance as EmployeePerformanceDTO } from '@server/types/employee.performance.dto'
import { ApplicationContext } from '../common/acl.gate'
import { EmployeeContractRepository } from '../repositories/employee.contract.repository'
import { EmployeePerformanceRepository } from '../repositories/employee.performance.repository'

import { faker } from '@faker-js/faker'
import { Password } from '../common/password'
import { EmployeeRepository } from '../repositories/employee.repository'
import { EmployeeTrainingRepository } from '../repositories/employee.training.repository'
import { UserRepository } from '../repositories/user.repository'
import {
  Employee,
  EmployeeDataRequest,
  EmployeeInitRequest,
  EmployeePerdiemTaxSet,
  EmployeeUpdateRequest,
} from '../types/employee.dto'
import { EmployeePerformanceAggregated } from '../types/employee.performance.dto'
import { EmployeeTraining } from '../types/employee.training.dto'
import { CreateEmployeeContractRequest, EmployeeContract as EmployeeContractDto } from '../types/employee.contract.dto'

@Injectable()
export class EmployeeService {
  private readonly timeOffQuota: number = 12

  constructor(
    private employeeRepo: EmployeeRepository,
    private employeePerformaceRepo: EmployeePerformanceRepository,
    private employeeContractRepo: EmployeeContractRepository,
    private employeeTrainingRepo: EmployeeTrainingRepository,
    private userRepo: UserRepository,
    private userRepository: UserRepository,
  ) {}

  async createEmployee(employeeReq: EmployeeDataRequest): Promise<string> {
    const payload = employeeReq as Prisma.employeeUncheckedCreateInput
    payload.annual_quota = this.timeOffQuota
    const employee = await this.employeeRepo.createEmployee(payload)

    return employee.id
  }

  async createUserThenEmployee(employeeReq: EmployeeInitRequest): Promise<string> {
    const user = await this.userRepository.createUser({
      email: employeeReq.email,
      acl: [],
      password: Password.createPassword(faker.random.alphaNumeric(8)),
    } as Prisma.usersCreateInput)

    employeeReq.user_id = user.id
    delete employeeReq.email

    const payload = employeeReq as Prisma.employeeUncheckedCreateInput
    payload.annual_quota = this.timeOffQuota
    const employee = await this.employeeRepo.createEmployee(payload)

    return employee.id
  }

  async updateEmployee(ctx: ApplicationContext, id: string, employeeReq: EmployeeUpdateRequest): Promise<string> {
    const payload = { ...employeeReq } as Prisma.employeeUncheckedUpdateInput
    // Quotas must be changed only via the admin-authorized annual leave endpoint.
    delete payload.annual_quota
    const employee = await this.employeeRepo.updateEmployeeById(id, payload)

    return employee.id
  }

  async deleteEmployeeByID(id: string): Promise<string> {
    const employee = await this.employeeRepo.deleteEmployeeById(id)

    return employee.id
  }

  async setEmployeePerdiemTax(perdiem_taxes: EmployeePerdiemTaxSet): Promise<any> {
    for (const tax of perdiem_taxes.employees) {
      await this.employeeRepo.updateEmployeeById(tax.employee_id, {
        perdiem_tax_percentage: tax.perdiem_tax_percentage,
      })
    }
  }

  async getEmployeeByID(id: string): Promise<EmployeeDataRequest> {
    const user = await this.employeeRepo.getEmployeeById(id)
    return user as EmployeeDataRequest
  }

  async addEmployeeContracts(contract: CreateEmployeeContractRequest, purge = false): Promise<string | null> {
    if (purge) {
      console.log('PURGING CONTRACT', purge)
      await this.employeeContractRepo.deleteAllEmployeeContractByEmployeeById(contract.employee_id)
    }

    console.log(contract)
    const empContract = await this.employeeContractRepo.createContractByEmployeeById({
      contract_number: contract.contract_number,
      supervisor_id: contract.supervisor_id,
      employee_id: contract.employee_id,
      contract_name: contract.contract_name,
      position: contract.position,
      department: contract.department,
      emp_status: contract.emp_status,
      contract_started: contract.contract_started,
      contract_ended: contract.contract_ended,
      doc_path: contract.doc_path,
    })
    return empContract.id
  }

  async getAllEmployeeContracts(spvId: string = null): Promise<EmployeeContractDto[] | null> {
    let contracts = []
    if (spvId && spvId != '') {
      contracts = await this.employeeContractRepo.getContractAllEmployeeFilterSPV(spvId)
    } else {
      contracts = await this.employeeContractRepo.getContractAllEmployee()
    }
    return contracts as EmployeeContractDto[]
  }

  async getEmployeeContracts(employeeId: string): Promise<EmployeeContract[] | null> {
    const contracts = await this.employeeContractRepo.getContractByEmployeeById(employeeId)
    return contracts
  }

  async getAllEmployee(only_draft = 'false', spv_id = '', role = ''): Promise<Employee[] | null> {
    if (only_draft == 'false') {
      let data = (await this.employeeRepo.getAllEmployee()) as unknown as Employee[]

      if (data.length > 0 && spv_id != '') {
        data = data.filter((emp) => {
          return emp.employee_contracts[0]?.supervisor_id === spv_id
        })
      }

      if (data.length > 0 && role != '') {
        console.log(role, '------', data)
        data = data.filter((emp) => {
          console.log(emp.user.role, role)
          if (emp.user.role) {
            return emp.user.role.indexOf(role) > -1
          }
        })
      }

      return data
    } else {
      console.log('IS ONLY DRAFT', only_draft)
      let data = (await this.employeeRepo.getAllEmployeeNotCompletedForm()) as unknown as Employee[]

      if (data.length > 0 && spv_id != '') {
        data = data.filter((emp) => {
          return emp.employee_contracts[0]?.supervisor_id === spv_id
        })
      }

      if (data.length > 0 && role != '') {
        data = data.filter((emp) => {
          if (emp.user.role) {
            console.log(emp.user.role, role)
            return emp.user.role.indexOf(role) > -1
          }
        })
      }

      return data
    }
  }

  async addEmployeePerformance(
    employeeId: string,
    year: number,
    docType: string,
    docPath: string[] | null = null,
  ): Promise<string> {
    const performance = await this.employeePerformaceRepo.saveEmployeePerformance({
      employee_id: employeeId,
      doc_path: docPath,
      doc_type: docType.replaceAll('-', '_'),
      year: year,
    } as Prisma.performancesUncheckedCreateInput)
    return performance.id
  }

  async updateEmployeeTraining(
    trainingId: string,
    trainingName: string,
    trainingDate: string,
    organizer: string,
    sourceFund: string,
    certificatePath: string[],
  ): Promise<string> {
    const performance = await this.employeePerformaceRepo.updateEmployeeTraining(trainingId, {
      organizer: organizer,
      source_fund: sourceFund,
      training_name: trainingName,
      certificate_path: certificatePath,
      training_date: new Date(trainingDate),
    } as Prisma.trainingsUncheckedUpdateInput)
    return performance.id
  }

  async addEmployeeTraining(
    employeeId: string,
    trainingName: string,
    trainingDate: string,
    organizer: string,
    sourceFund: string,
    certificatePath: string[],
  ): Promise<string> {
    const performance = await this.employeePerformaceRepo.saveEmployeeTraining({
      employee_id: employeeId,
      organizer: organizer,
      source_fund: sourceFund,
      training_name: trainingName,
      certificate_path: certificatePath,
      training_date: new Date(trainingDate),
    } as Prisma.trainingsUncheckedCreateInput)
    return performance.id
  }

  async getEmployeeTrainings(employeeId: string): Promise<EmployeeTraining[] | null> {
    const trainings = await this.employeeTrainingRepo.getEmployeeTrainings(employeeId)
    return trainings as EmployeeTraining[]
  }

  async getEmployeePerformance(employeeId: string, performanceId: string): Promise<EmployeePerformance> {
    const performance = await this.employeePerformaceRepo.getEmployeePerformanceByEmployeeAndPerformanceID(
      employeeId,
      performanceId,
    )
    return performance
  }

  agregatePerformace(performances: EmployeePerformanceDTO[], employewId: string): EmployeePerformanceAggregated[] {
    const store = new Map<string, EmployeePerformanceAggregated>()

    performances.forEach((v) => {
      if (v.employee_id == employewId) {
        if (store[String(v.year)] != undefined) {
          // if exist
          // add to value
          const edit: EmployeePerformanceAggregated = store[String(v.year)]
          switch (v.doc_type) {
            case 'planning':
              edit.planning = {
                path: v.doc_path[0],
                id: v.id,
              }
              break
            case 'mid_year':
              edit.mid_year = {
                path: v.doc_path[0],
                id: v.id,
              }
              break
            case 'end_year':
              edit.end_year = {
                path: v.doc_path[0],
                id: v.id,
              }
              break
          }
          edit.employee_name = v.employee.full_name
          edit.user_avatar = v.employee.user.avatar
          edit.email = v.employee.user.email
          edit.employee_pass_photo = v.employee.pass_photo_path[0]
          edit.contract_position = v.employee?.employee_contracts[0]?.position
          edit.contract_department = v.employee?.employee_contracts[0]?.department
          edit.employee_id = v.employee_id
          edit.spv_id = v.employee?.employee_contracts[0]?.supervisor_id

          store[String(v.year)] = edit
        } else {
          const nn = new EmployeePerformanceAggregated()
          nn.year = v.year
          switch (v.doc_type) {
            case 'planning':
              nn.planning = {
                path: v.doc_path[0],
                id: v.id,
              }
              break
            case 'mid_year':
              nn.mid_year = {
                path: v.doc_path[0],
                id: v.id,
              }
              break
            case 'end_year':
              nn.end_year = {
                path: v.doc_path[0],
                id: v.id,
              }
              break

            default:
              break
          }
          nn.employee_name = v.employee.full_name
          nn.user_avatar = v.employee.user.avatar
          nn.email = v.employee.user.email
          nn.employee_pass_photo = v.employee.pass_photo_path?.[0]
          nn.contract_position = v.employee?.employee_contracts[0]?.position
          nn.contract_department = v.employee?.employee_contracts[0]?.department
          nn.employee_id = v.employee_id
          nn.spv_id = v.employee?.employee_contracts[0]?.supervisor_id

          store[String(v.year)] = nn
        }
      }
    })
    const result: EmployeePerformanceAggregated[] = []
    const perfObj = JSON.parse(JSON.stringify(store))
    for (const [key, value] of Object.entries(perfObj)) {
      const a = new EmployeePerformanceAggregated()
      a.year = value['year'] ?? null
      a.planning = value['planning'] ?? null
      a.mid_year = value['mid_year'] ?? null
      a.end_year = value['end_year'] ?? null
      a.contract_position = value['contract_position']
      a.user_avatar = value['user_avatar']
      a.email = value['email']
      a.employee_name = value['employee_name']
      a.employee_pass_photo = value['employee_pass_photo'] ?? null
      a.contract_department = value['contract_department'] ?? null
      a.employee_id = value['employee_id']
      a.spv_id = value['spv_id']

      result.push(a)
    }
    return result
  }

  async getEmployeePerformanceAll(employeeId?: string, all = false): Promise<EmployeePerformanceAggregated[]> {
    let performances: EmployeePerformanceDTO[] = []
    if (all) {
      if (employeeId) {
        performances = (await this.employeePerformaceRepo.getEmployeePerformancesAll()) as EmployeePerformanceDTO[]
        console.log('BEFORE', performances.length)
        performances = performances.filter((perf) => {
          return perf.employee.employee_contracts[0].supervisor_id === employeeId
        })
        console.log('AFTER', performances.length)
      } else {
        performances = (await this.employeePerformaceRepo.getEmployeePerformancesAll()) as EmployeePerformanceDTO[]
      }
    } else {
      performances = (await this.employeePerformaceRepo.getEmployeePerformancesByEmployeeID(
        employeeId,
      )) as EmployeePerformanceDTO[]
    }

    console.log('EMPLOYEE TOTAL', performances.length)

    const toBeAgregateSet = new Set()
    performances.forEach((c) => {
      toBeAgregateSet.add(c.employee_id)
    })

    const results: EmployeePerformanceAggregated[] = []

    toBeAgregateSet.forEach((employeeId) => {
      this.agregatePerformace(performances, employeeId as string).forEach((perf) => {
        results.push(perf)
      })
    })
    console.log(results.length)

    // add spv information

    const subed = []

    for (const perf of results) {
      const spv = await this.employeeRepo.getEmployeeById(perf.spv_id)
      perf.spv_name = spv?.full_name
      perf.spv_pass_photo = spv?.pass_photo_path[0]
      if (spv) {
        const spvUser = await this.userRepo.getUserById(spv?.user_id)
        perf.spv_avatar = spvUser?.avatar
      }
      subed.push(perf)
    }

    return subed
  }

  async editEmployeePerformance(
    employeeId: string,
    performanceId: string,
    year: number,
    docType: string,
    docPath: string[] | null = null,
  ): Promise<string> {
    const performance = await this.employeePerformaceRepo.updateEmployeePerformance(employeeId, performanceId, {
      employee_id: employeeId,
      doc_path: docPath,
      doc_type: docType.replaceAll('-', '_'),
      year: year,
    } as Prisma.performancesUncheckedUpdateInput)
    return performance.id
  }

  async deleteEmployeePerformance(employeeId: string, performanceId: string): Promise<string> {
    const employee = await this.employeePerformaceRepo.deleteEmployeePerfomanceByEmployeeAndPerformanceID(
      employeeId,
      performanceId,
    )

    return employee.id
  }
}
