import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
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
import { Request, Response } from 'express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { getFileValidator } from '../common/file.validator'
import { EmployeeService } from '../services/employee.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import {
  EmployeePerformance,
  EmployeePerformanceCreateRequest,
  EmployeePerformanceDataResponse,
  EmployeePerformanceListDataResponse,
} from '../types/employee.performance.dto'

@Controller()
export class EmployeePerformanceController {
  private readonly logger = new Logger(EmployeePerformanceController.name)
  private static readonly apiTags = 'employee_performance'
  private lang = Language.use(new BaseLanguageDefinition())
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('/v1/employes/:id/performance')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'create employee performance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeePerformanceCreateRequest)
  @ApiBearerAuth()
  async createEmployeePerformanceCV(
    @Param('id') id: string,
    @Body() employeePerf: EmployeePerformanceCreateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const createdId = await this.employeeService.addEmployeePerformance(
      id,
      Number(employeePerf.year),
      employeePerf.doc_type,
      employeePerf.file,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Employee Performance']), createdId))
  }

  @Put('/v1/employes/:id/performance/:performance_id')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'create employee performance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'performance_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(EmployeePerformanceCreateRequest)
  @ApiBearerAuth()
  async updateEmployeePerformanceCV(
    @Param('id') id: string,
    @Param('performance_id') performance_id: string,
    @Body() employeePerf: EmployeePerformanceCreateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const createdId = await this.employeeService.editEmployeePerformance(
      id,
      performance_id,
      Number(employeePerf.year),
      employeePerf.doc_type,
      employeePerf.file,
    )

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Employee Performance']), createdId))
  }

  @Delete('/v1/employes/:id/performance/:performance_id')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'delete employee performance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'performance_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async deleteEmployeePerformance(
    @Param('id') id: string,
    @Param('performance_id') performance_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.employeeService.deleteEmployeePerformance(id, performance_id)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_DELETED, ['Employee Performance']), null))
  }

  @Get('/v1/employes/:id/performance/:performance_id')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'delete employee performance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'performance_id', type: 'string' })
  @ApiExtraModels(EmployeePerformance)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: EmployeePerformanceDataResponse })
  @ApiBearerAuth()
  async getEmployeePerformanceDetail(
    @Param('id') id: string,
    @Param('performance_id') performance_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const employee = await this.employeeService.getEmployeePerformance(id, performance_id)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeePerformanceDataResponse(this.lang.lang(LD.RESPONSE_OK), employee as EmployeePerformance))
  }

  @Get('/v1/employes/:id/performance')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'get employee performance by employeeid' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiExtraModels(EmployeePerformance)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: EmployeePerformanceListDataResponse })
  @ApiBearerAuth()
  async getEmployeePerformanceAllByEmployeeId(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const employeePerformances = await this.employeeService.getEmployeePerformanceAll(id)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeePerformanceListDataResponse(this.lang.lang(LD.RESPONSE_OK), employeePerformances))
  }

  @Get('/v1/employes-performance')
  @ApiTags(EmployeePerformanceController.apiTags)
  @ApiOperation({ summary: 'get employee performance all' })
  @ApiQuery({ name: 'spv_id', required: false })
  @ApiExtraModels(EmployeePerformance)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: EmployeePerformanceListDataResponse })
  @ApiBearerAuth()
  async getEmployeePerformanceAll(
    @Query('spv_id') spvId = null,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    //filter by spv if needed
    const employeePerformances = await this.employeeService.getEmployeePerformanceAll(spvId, true)
    return response
      .status(HttpStatus.OK)
      .send(new EmployeePerformanceListDataResponse(this.lang.lang(LD.RESPONSE_OK), employeePerformances))
  }
}
