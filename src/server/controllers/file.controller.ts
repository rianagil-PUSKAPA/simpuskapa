import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { BucketsEnum, ObjectStorageHelpers } from '@/shared/file.system'
import { Controller, Delete, Get, HttpStatus, Logger, Param, Query, Req, Res } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { HttpBaseResponse } from '../types/base.response.dto'
import { v4 as uuidv4 } from 'uuid'

@Controller()
export class FileController {
  private readonly logger = new Logger(FileController.name)
  private static readonly apiTags = 'files'
  private lang = Language.use(new BaseLanguageDefinition())

  @Get('/v1/files/presign/download/:bucket_name/:file_name')
  @ApiTags(FileController.apiTags)
  @ApiOperation({ summary: 'Get uri download file presign metadata' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiParam({
    name: 'bucket_name',
    type: 'string',
    required: true,
    enum: Object.values(BucketsEnum),
  })
  @ApiParam({ name: 'file_name', type: 'string', required: true })
  @ApiQuery({ name: 'expiry', type: 'integer', required: true })
  async getPresignUrlForDownload(
    @Param('file_name') fileName: string,
    @Param('bucket_name') bucketName: string,
    @Query('expiry') expiry: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    console.log('bucketName', bucketName, 'fileName', fileName, 'expiry', expiry)
    const url = await ObjectStorageHelpers.getDownloadPresignedUrl(bucketName, fileName, Number(expiry))

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<any>(this.lang.lang(LD.RESPONSE_CREATED, ['Presign URL']), url))
  }

  @Get('/v1/files/presign/upload/:bucket_name/:file_name')
  @ApiTags(FileController.apiTags)
  @ApiOperation({ summary: 'Get obj file presign metadata' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiParam({
    name: 'bucket_name',
    type: 'string',
    required: true,
    enum: Object.values(BucketsEnum),
  })
  @ApiParam({ name: 'file_name', type: 'string', required: true })
  async getPresignUrl(
    @Param('file_name') fileName: string,
    @Param('bucket_name') bucketName: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const newFileName = `${uuidv4()}-${fileName}`
    const url = await ObjectStorageHelpers.getUploadPresignedUrl(bucketName, newFileName, 180)

    return response
      .status(HttpStatus.OK)
      .send(
        new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Presign URL']), `${newFileName}::${url}`),
      )
  }

  @Delete('/v1/files/:bucket_name/:file_name')
  @ApiTags(FileController.apiTags)
  @ApiOperation({
    summary: 'Delete object from s3 and set path as empty on db',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiParam({
    name: 'bucket_name',
    type: 'string',
    required: true,
    enum: Object.values(BucketsEnum),
  })
  @ApiParam({ name: 'file_name', type: 'string', required: true })
  @ApiQuery({ name: 'clear_path', type: 'string', required: false })
  async deleteFile(
    @Query('clear_path') clear_path: string,
    @Param('file_name') fileName: string,
    @Param('bucket_name') bucketName: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const newFileName = `${uuidv4()}-${fileName}`
    const url = await ObjectStorageHelpers.getUploadPresignedUrl(bucketName, newFileName, 180)

    return response
      .status(HttpStatus.OK)
      .send(
        new HttpBaseResponse<string>(
          this.lang.lang(LD.RESPONSE_DELETED, ['Deleted File OK']),
          `${newFileName}::${url}`,
        ),
      )
  }
}
