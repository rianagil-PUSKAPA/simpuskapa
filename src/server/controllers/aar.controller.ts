import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request, Response } from 'express'
import { AarService } from '../services/aar.service'

@Injectable()
class AarAdminEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()

    let claims: { email?: unknown }

    try {
      claims = JSON.parse(String(req.headers.authorization || ''))
    } catch {
      throw new ForbiddenException('AAR is in development')
    }

    if (typeof claims.email !== 'string' || claims.email.trim().toLowerCase() !== 'admin@puskapa.org') {
      throw new ForbiddenException('AAR is in development')
    }

    return true
  }
}

@UseGuards(AarAdminEmailGuard)
@Controller('/v1/aar')
@ApiTags('After Activity Report')
@ApiBearerAuth()
export class AarController {
  constructor(private readonly aar: AarService) {}
  // AuthJwtMiddleware has verified and replaced Authorization with serialized claims.
  private user(req: Request): { id: string; role?: string[]; email?: string } {
    return JSON.parse(req.headers.authorization as string)
  }

  @Get()
  list() {
    return this.aar.list()
  }

  @Post()
  create(@Req() req: Request) {
    return this.aar.create(this.user(req))
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.aar.get(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Req() req: Request, @Body() body: { answers: Record<string, string> }) {
    return this.aar.save(id, this.user(req), body?.answers)
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Req() req: Request, @Body() body: { answers: Record<string, string> }) {
    return this.aar.submit(id, this.user(req), body?.answers)
  }

  @Post(':id/retry-email')
  retryEmail(@Param('id') id: string, @Req() req: Request) {
    return this.aar.retryEmail(id, this.user(req))
  }

  @Get(':id/pdf')
  async download(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.aar.pdf(id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="After-Activity-Report.pdf"')
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(buffer)
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@Param('id') id: string, @Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    return this.aar.upload(id, this.user(req), file)
  }

  @Delete(':id/files/:fileId')
  remove(@Param('id') id: string, @Param('fileId') fileId: string, @Req() req: Request) {
    return this.aar.removeFile(id, fileId, this.user(req))
  }

  @Get(':id/files/:fileId')
  async file(@Param('id') id: string, @Param('fileId') fileId: string, @Res() res: Response) {
    const { file, content } = await this.aar.getFile(id, fileId)
    res.setHeader('Content-Type', file.mime)
    res.setHeader('Content-Disposition', 'attachment; filename="' + file.name.replace(/[\r\n"]/g, '_') + '"')
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(content)
  }
}
