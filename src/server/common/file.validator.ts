import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { extname } from 'path'

export function getFileValidator(exts: string[]): PipeTransform {
  return new ParseFilePipeDocument(exts)
}

@Injectable()
export class ParseFilePipeDocument implements PipeTransform {
  private readonly allowedExtensions = []

  constructor(exts: string[]) {
    this.allowedExtensions = exts
  }

  transform(value: Express.Multer.File): Express.Multer.File {
    if (value == undefined) {
      return
    }
    const extension = extname(value.originalname)
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`File type ${extension} not supported`)
    }
    return value
  }
}
