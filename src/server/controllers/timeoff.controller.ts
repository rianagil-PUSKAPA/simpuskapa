import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  ForbiddenException,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
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
import { HttpBaseResponse } from '../types/base.response.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { Prisma, LeaveType, TimeOffRequestStatus } from '@prisma/client'
import { getFileValidator } from '../common/file.validator'
import { Request, Response } from 'express'
import {
  AnnualTimeOffListDataResponse,
  ResetTimeOffRequestDto,
  UpdateAnnualQuotaDto,
  TimeOff,
  TimeOffDetailResponse,
  TimeOffListDataResponse,
  TimeOffRequestDto,
  TimeOffRow,
  TimeOffUpdateStatusDto,
} from '../types/time.off.request.dto'
import { TimeOffRequestService } from '../services/time.off.request.service'

@Controller()
export class TimeOffController {
  private readonly logger = new Logger(TimeOffController.name)
  private static readonly apiTags = 'employee-time-off'
  private lang = Language.use(new BaseLanguageDefinition())
  constructor(private readonly timeOffService: TimeOffRequestService) {}

  @Delete('/v1/employes/:id/timeoff/:timeoff_id')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Delete Time Off' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiParam({ name: 'timeoff_id', type: 'string', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRequestDto)
  @ApiBearerAuth()
  async deleteeEmployeeTimeOffRequest(
    @Param('id') id: string,
    @Param('timeoff_id') timeoff_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.deleteTimeOff(timeoff_id)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_DELETED, ['Time Off']), null))
  }

  @Post('/v1/employes/:id/timeoff')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Add employee timeoff request' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRequestDto)
  @ApiBearerAuth()
  async createEmployeeTimeOffRequest(
    @Param('id') id: string,
    @Body() timeOff: TimeOffRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.createTimeOffRequest(
      timeOff.doc_path,
      id,
      timeOff.start_date as string,
      timeOff.end_date as string,
      timeOff.leave_type,
      Number(timeOff.duration),
      timeOff.notes,
      timeOff.pic_employee_id,
      timeOff.direct_approve,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Time Off']), null))
  }

  @Patch('/v1/employes/:id/timeoff/:time_off_id/status')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Update employee timeoff status' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffUpdateStatusDto)
  @ApiBearerAuth()
  async updateEmployeeTimeOffStatus(
    @Param('id') id: string,
    @Param('time_off_id') timeOffId: string,
    @Body() timeOffStatus: TimeOffUpdateStatusDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.updateTimeOffStatus(timeOffStatus.status, timeOffId)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Time Off Status']), null))
  }

  @Put('/v1/employes/:id/timeoff/:time_off_id')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Update employee timeoff request' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRequestDto)
  @ApiBearerAuth()
  async updateEmployeeTimeOffRequest(
    @Param('id') id: string,
    @Param('time_off_id') timeOffId: string,
    @Body() timeOff: TimeOffRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.updateTimeOffRequest(
      timeOff.doc_path,
      id,
      timeOff.start_date as string,
      timeOff.end_date as string,
      timeOff.leave_type,
      Number(timeOff.duration),
      timeOff.notes,
      timeOff.pic_employee_id,
      timeOff.status,
      timeOffId,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Time Off']), null))
  }

  @Get('/v1/employes/timeoff/wall')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'get list employee timeoff between dates' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiQuery({
    name: 'start_date',
    required: true,
    description: 'start date 2020-06-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: true,
    description: 'end date 2020-06-01',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: 'string',
    description: 'status to use multi search status Eg. cancelled|approved|requested',
    example: 'approved rejected declined cancelled requested',
  })
  @ApiQuery({
    name: 'spv_id',
    required: false,
    description: 'supervisor id',
  })
  @ApiQuery({
    name: 'leave_type',
    required: false,
    description: 'leave type',
  })
  @ApiQuery({
    name: 'group_date',
    required: false,
    description: 'group by start end date',
  })
  @ApiOkResponse({ type: TimeOffListDataResponse })
  @ApiBearerAuth()
  async getAllTimeOffActiveBetweenDates(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const result = await this.timeOffService.getAllActiveTimeOffBetweenDates(
      request.query.start_date as string,
      request.query.end_date as string,
      request.query.status as string,
      request.query.spv_id as string,
      request.query.leave_type as string,
      request.query.group_date as string,
    )

    return response.status(HttpStatus.OK).send(result)
  }

  @Get('/v1/employes/:id/timeoff')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'get list employee timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: TimeOffListDataResponse })
  @ApiBearerAuth()
  async getEmployeeTimeOffList(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const result = await this.timeOffService.getTimeOffList(id)

    return response.status(HttpStatus.OK).send(result)
  }

  @Get('/v1/employes/:id/timeoff/:timeoff_id')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'get detail employee timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: TimeOffRow })
  @ApiBearerAuth()
  async getEmployeeTimeOffDetail(
    @Param('id') id: string,
    @Param('timeoff_id') timeoff_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const timeoff = await this.timeOffService.getById(timeoff_id, id)

    return response.status(HttpStatus.OK).send(new TimeOffDetailResponse(this.lang.lang(LD.RESPONSE_OK), timeoff))
  }

  @Patch('/v1/employes/:id/timeoff/:timeoff_id/cancel')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'cancel timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: TimeOffRow })
  @ApiBearerAuth()
  async cancelTimeOffRequest(
    @Param('id') id: string,
    @Param('timeoff_id') timeoff_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.cancelTimeOffRequest(timeoff_id)

    return response.status(HttpStatus.OK).send(new HttpBaseResponse<object>(this.lang.lang(LD.RESPONSE_OK), {}))
  }

  @Post('/v1/employes/bulk-timeoff')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Add bulk employee timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRequestDto)
  @ApiBearerAuth()
  async createBulkTimeOffEmployeeTimeOffRequest(
    @Body() timeOff: TimeOffRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.timeOffService.bulkCreateTimeOffRequest(
      timeOff.doc_path,
      timeOff.start_date as string,
      timeOff.end_date as string,
      timeOff.leave_type,
      Number(timeOff.duration),
      timeOff.notes,
      timeOff.pic_employee_id,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Bulk Time Off']), null))
  }

  @Get('/v1/timeoff/annual-timeoff')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'get list annual timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiOkResponse({ type: TimeOffListDataResponse })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'year filter',
  })
  @ApiBearerAuth()
  async getEmployeeAnnualTimeOffList(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const result = await this.timeOffService.getAnnualTimeOffList(request.query.year as string)

    return response
      .status(HttpStatus.OK)
      .send(new AnnualTimeOffListDataResponse(this.lang.lang(LD.RESPONSE_CREATED, ['Annual Time Off']), result))
  }

  @Put('/v1/timeoff/annual-timeoff/:employeeId/quota')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'Update current-year annual leave quota (admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'employeeId', type: 'string' })
  @ApiBody({ type: UpdateAnnualQuotaDto })
  @ApiOkResponse({ type: HttpBaseResponse })
  async updateEmployeeAnnualQuota(
    @Param('employeeId') employeeId: string,
    @Body() input: UpdateAnnualQuotaDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // JWT was verified by AuthJwtMiddleware, which places the verified claims in this header.
    const claims = JSON.parse(request.headers.authorization as string) as { role?: string[] }
    if (
      !Array.isArray(claims.role) ||
      !claims.role.some((role) => role === 'admin' || role === 'superadmin')
    ) {
      throw new ForbiddenException('Only Admin or Superadmin can change annual leave quotas')
    }

    const quota = await this.timeOffService.updateAnnualQuota(employeeId, input?.quota)
    return response.status(HttpStatus.OK).send(new HttpBaseResponse('Annual leave quota updated', quota))
  }

  @Post('/v1/timeoff/annual-timeoff-reset')
  @ApiTags(TimeOffController.apiTags)
  @ApiOperation({ summary: 'reset annual timeoff request' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiExtraModels(TimeOffRow)
  @ApiOkResponse({ type: TimeOffListDataResponse })
  @ApiBearerAuth()
  async resetEmployeeAnnualTimeOffList(
    @Body() timeOffReset: ResetTimeOffRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // The Start New Year Cycle action is exposed to superadmins only in the UI;
    // enforce the same restriction on the server.
    const claims = JSON.parse(request.headers.authorization as string) as { role?: string[] }
    if (!Array.isArray(claims.role) || !claims.role.includes('superadmin')) {
      throw new ForbiddenException('Only Superadmin can reset annual leave cycles')
    }

    const result = await this.timeOffService.resetAnnualTimeOffList(timeOffReset.reset_date)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<boolean>(this.lang.lang(LD.RESPONSE_CREATED, ['Annual Time Off Reset']), result))
  }
}
