import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Query, Req, Res } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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

import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { HttpBaseResponse } from '@server/types/base.response.dto'
import {
  FinanceDashboardResponse,
  Log,
  LogsListResponse,
  MetadaataTotalResponse,
  MetadataDashboard,
  MetadataTotals,
} from '../types/metadata.dto'
import { MetadataService } from '../services/metadata.service'
import { finance_logs } from '@prisma/client'
import { JwtLib } from '@/shared/jwt.lib'
import { NotificationsResponse } from '../types/notification.dto'

@Controller()
export class MetadataController {
  private readonly logger = new Logger(MetadataController.name)
  private static readonly apiTags = 'metadata'
  private lang = Language.use(new BaseLanguageDefinition())
  constructor(private readonly metadataService: MetadataService) {}

  @Get('/v1/metadata/total')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'get metadata (type=total)' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: MetadaataTotalResponse })
  @ApiExtraModels(MetadataTotals)
  @ApiBearerAuth()
  async getMetadataTotal(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    const res = await this.metadataService.getMetadataForTotals(userClaims['id'], userClaims['role'])

    return response.status(HttpStatus.OK).send(new MetadaataTotalResponse(this.lang.lang(LD.RESPONSE_OK), res))
  }

  @Get('/v1/metadata/last-logs')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'get latest logs' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: LogsListResponse })
  @ApiExtraModels(Log)
  @ApiBearerAuth()
  async getLatestLogs(@Res() response: Response): Promise<Response> {
    const res = await this.metadataService.getLatestLogActivities()

    return response.status(HttpStatus.OK).send(new LogsListResponse(this.lang.lang(LD.RESPONSE_OK), res))
  }

  @Get('/v1/metadata/logs')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'get filtered logs' })
  @ApiQuery({ name: 'log_type', required: true })
  @ApiQuery({ name: 'ref_id', required: true })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: LogsListResponse })
  @ApiExtraModels(Log)
  @ApiBearerAuth()
  async getLogsFiltered(
    @Query('log_type') log_type = 'PaymentRequest',
    @Query('ref_id') ref_id = 'uuid',
    @Res() response: Response,
  ): Promise<Response> {
    console.log(log_type, ref_id)
    const res = await this.metadataService.getFilteredLogActivities(log_type, ref_id)

    return response.status(HttpStatus.OK).send(new LogsListResponse(this.lang.lang(LD.RESPONSE_OK), res))
  }

  @Get('/v1/metadata/dashboard/me')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'get metadata dashboard' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse<MetadataDashboard> })
  @ApiExtraModels(MetadataDashboard)
  @ApiBearerAuth()
  async getDashoardLogedinMetadata(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    const res = await this.metadataService.getMetadataForDashboard(userClaims['id'], userClaims['role'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<MetadataDashboard>(this.lang.lang(LD.RESPONSE_OK), res))
  }

  @Get('/v1/metadata/finance-dashboard')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'finance dashboard' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse<MetadataDashboard> })
  @ApiExtraModels(MetadataDashboard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'year', required: true, example: 2024 })
  async getDashoardFinance(
    @Query('year') year = new Date().getFullYear(),
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const res = await this.metadataService.getMetadataForFinanceDashboard(year)

    return response.status(HttpStatus.OK).send(new FinanceDashboardResponse(this.lang.lang(LD.RESPONSE_OK), res))
  }

  @Get('/v1/me/notification')
  @ApiTags(MetadataController.apiTags)
  @ApiOperation({ summary: 'get notifications' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: NotificationsResponse })
  @ApiExtraModels(MetadataTotals)
  @ApiBearerAuth()
  async getPersonalizedNotification(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    const res = await this.metadataService.getPersonalizedNotification(userClaims['id'])

    return response.status(HttpStatus.OK).send(new NotificationsResponse(this.lang.lang(LD.RESPONSE_OK), res))
  }
}
