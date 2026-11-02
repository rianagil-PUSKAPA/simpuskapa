import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { RoleDefinition } from '@/shared/role.access'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { ApplicationContext } from '@server/common/acl.gate'
import { Request, Response } from 'express'
import { createReadStream, writeFileSync } from 'fs'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getFileValidator } from '../common/file.validator'
import { EmployeeService } from '../services/employee.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import {
  CreateEmployeeContractRequest,
  EmployeeContract,
  EmployeeContractListDataResponse,
} from '../types/employee.contract.dto'
import {
  AddEmplloyeeTrainingRequest,
  Employee,
  EmployeeDataRequest,
  EmployeeDataResponse,
  EmployeeInitRequest,
  EmployeeListDataResponse,
  EmployeePerdiemTaxSet,
  EmployeePerdiemTaxSetValue,
  EmployeeUpdateRequest,
} from '../types/employee.dto'
import { EmployeeTraining, EmployeeTrainingListDataResponse } from '../types/employee.training.dto'

@Controller()
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name)
  private static readonly apiTags = 'employee'
  private lang = Language.use(new BaseLanguageDefinition())

  @Post('/v1/init-employee')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'create new employee and user return employee id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createEmployeeAndUser(
    @Body() employee: EmployeeInitRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const employeeID = await this.employeeService.createUserThenEmployee(employee)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Employee']), employeeID))
  }
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('/v1/employes')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'create new employee' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Employee)
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createEmployee(
    @Body() employee: EmployeeDataRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const employeeID = await this.employeeService.createEmployee(employee)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Employee']), employeeID))
  }

  @Put('/v1/employes/:id')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'create new employee' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeeUpdateRequest)
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateEmployee(
    @Param('id') id: string,
    @Body() employee: EmployeeUpdateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const ctx = ApplicationContext.getContext(request)

    const employeeID = await this.employeeService.updateEmployee(ctx, id, employee)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Employee']), employeeID))
  }

  @Delete('/v1/employes/:id')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'delete employee by id' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Employee)
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async deleteEmployee(@Param('id') id: string, @Req() request: Request, @Res() response: Response): Promise<Response> {
    const employeeID = await this.employeeService.deleteEmployeeByID(id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_DELETED, ['Employee']), employeeID))
  }

  @Get('/v1/employes')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'get list employee all' })
  @ApiQuery({ name: 'only_draft', required: false, example: false })
  @ApiQuery({ name: 'spv_id', required: false, example: 'xxx-xxx-xxx' })
  @ApiQuery({
    name: 'role',
    required: false,
    example: RoleDefinition.HEAD_OF_FINANCE,
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Employee)
  @ApiOkResponse({ type: EmployeeListDataResponse })
  @ApiBearerAuth()
  async getAllEmployee(
    @Req() request: Request,
    @Query('only_draft') only_draft = 'false',
    @Query('spv_id') spv_id = '',
    @Query('role') role = '',
    @Res() response: Response,
  ): Promise<Response> {
    const employes = await this.employeeService.getAllEmployee(only_draft, spv_id, role)
    return response.status(HttpStatus.OK).send(new EmployeeListDataResponse(this.lang.lang(LD.RESPONSE_OK), employes))
  }

  @Get('/v1/employes/:id')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'get detail all' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Employee)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: EmployeeDataResponse })
  @ApiBearerAuth()
  async getEmployeeDetail(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const employe = await this.employeeService.getEmployeeByID(id)
    return response.status(HttpStatus.OK).send(new EmployeeDataResponse(this.lang.lang(LD.RESPONSE_OK), employe))
  }

  @Patch('/v1/employes-perdiem-tax')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'set perdiem tax' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Employee)
  @ApiOkResponse({ type: EmployeeDataResponse })
  @ApiBearerAuth()
  async setPerdiemTax(
    @Body() perdiemTax: EmployeePerdiemTaxSet,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.employeeService.setEmployeePerdiemTax(perdiemTax)
    return response.status(HttpStatus.OK).send(new EmployeeDataResponse(this.lang.lang(LD.RESPONSE_OK), null))
  }

  @Post('/v1/employes/:id/contracts')
  @ApiTags(EmployeeController.apiTags)
  @ApiQuery({ name: 'purge', required: false, example: false })
  @ApiOperation({ summary: 'Add employee contract' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createEmployeeContracts(
    @Param('id') id: string,
    @Query('purge') purge = 'false',
    @Body() contract: CreateEmployeeContractRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    let withPurge = false
    if (purge == 'true') {
      withPurge = true
    }

    contract.employee_id = id
    console.log(contract)

    await this.employeeService.addEmployeeContracts(contract, withPurge)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK), `Contract created`))
  }

  @Get('/v1/contracts')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'get all contracts' })
  @ApiQuery({ name: 'spv_id', required: false, example: 'uuid' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeeContract)
  @ApiOkResponse({ type: EmployeeContractListDataResponse })
  @ApiBearerAuth()
  async getAllEmployeeContract(@Query('spv_id') spv_id = '', @Req() request: Request, @Res() response: Response) {
    const contracts = await this.employeeService.getAllEmployeeContracts(spv_id)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeeContractListDataResponse(this.lang.lang(LD.RESPONSE_OK), contracts))
  }

  @Get('/v1/contracts/export/xls')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'export list employee contracts' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeeContract)
  @ApiOkResponse({ type: EmployeeContractListDataResponse })
  @ApiBearerAuth()
  async exportEmployeeContract(@Req() request: Request, @Res() response: Response) {
    let data = `<table className="text-sm">
      <tr>
        <td className="border border-black p-2 text-center">Emp. ID</td>
        <td className="border border-black p-2 text-center">Contract Number</td>
        <td className="border border-black p-2 text-center">Name</td>
        <td className="border border-black p-2 text-center">Position</td>
        <td className="border border-black p-2 text-center">Department</td>
        <td className="border border-black p-2 text-center">Supervisor</td>
        <td className="border border-black p-2 text-center">Emp. Status</td>
        <td className="border border-black p-2 text-center">Effective Date</td>
      </tr>`

    const contracts = await this.employeeService.getAllEmployeeContracts()
    contracts.forEach((contract) => {
      data += `<tr>
        <td className="border border-black p-2 text-center">${contract.emp_detail.id}</td>
        <td className="border border-black p-2 text-center">${contract.contract_number}</td>
        <td className="border border-black p-2 text-center">${contract.emp_detail.full_name}</td>
        <td className="border border-black p-2 text-center">${contract.position}</td>
        <td className="border border-black p-2 text-center">${contract.department}</td>
        <td className="border border-black p-2 text-center">${contract.spv_name}</td>
        <td className="border border-black p-2 text-center">${contract.emp_status}</td>
        <td className="border border-black p-2 text-center">${contract.contract_started}</td>
      </tr>`
    })
    data += `</table>`
    const fileName = `contracts_${uuidv4()}.xls`
    writeFileSync(join(process.cwd(), 'storage', fileName), data, {
      flag: 'w',
    })
    const file = createReadStream(join(process.cwd(), 'storage', fileName))
    response.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    })
    file.pipe(response)
  }

  @Get('/v1/employes/:id/contracts')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'get list employee contracts' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeeContract)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: EmployeeContractListDataResponse })
  @ApiBearerAuth()
  async getEmployeeContracts(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const contracts = await this.employeeService.getEmployeeContracts(id)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeeContractListDataResponse(this.lang.lang(LD.RESPONSE_OK), contracts as EmployeeContract[]))
  }

  @Post('/v1/employes/:id/trainings')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'Add employee training' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiExtraModels(AddEmplloyeeTrainingRequest)
  @ApiBearerAuth()
  async addEmployeeTraining(
    @Body() training: AddEmplloyeeTrainingRequest,
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    console.table(training)
    await this.employeeService.addEmployeeTraining(
      id,
      training.training_name,
      training.training_date,
      training.organizer,
      training.source_fund,
      training.file_path,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Employee Training']), null))
  }

  @Put('/v1/employes/trainings/:id')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'Update employee training' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiExtraModels(AddEmplloyeeTrainingRequest)
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateEmployeeTraining(
    @Param('id') id: string,
    @Body() training: AddEmplloyeeTrainingRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.employeeService.updateEmployeeTraining(
      id,
      training.training_name,
      training.training_date,
      training.organizer,
      training.source_fund,
      training.file_path,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Employee Training']), null))
  }

  @Get('/v1/employes/:id/trainings')
  @ApiTags(EmployeeController.apiTags)
  @ApiOperation({ summary: 'get list employee trainings' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeeTraining)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: EmployeeTrainingListDataResponse })
  @ApiBearerAuth()
  async getEmployeeTrainings(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const trainings = await this.employeeService.getEmployeeTrainings(id)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeeTrainingListDataResponse(this.lang.lang(LD.RESPONSE_OK), trainings))
  }
}
