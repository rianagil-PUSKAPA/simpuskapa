import { cn } from '@/lib/utils'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { formatBytes, slugify } from '@/utils/globalHelper'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { FileError, FileWithPath, useDropzone } from 'react-dropzone'
import { File04Icon } from './icon/File04Icon'
import { Trash01Icon } from './icon/Trash01Icon'
import { UploadCloud02Icon } from './icon/UploadCloud02Icon'

interface FileUploadDragDropProps {
  setUploadedFile: Dispatch<SetStateAction<File[]>>
  stateUploadedFile: File[]
  onChange: (value: any) => void
  maxFiles: number
  informationText?: string
  allowedDataType?: string[]
  maxSize?: number
  error?: boolean
  useFilePreview?: boolean
  progress: DynamicProgressType
  bucketName: BucketsUnion
  id?: string
  deleteFilePath: (filename: string) => void
}

export const FileUploadDragDrop = ({
  setUploadedFile,
  stateUploadedFile,
  onChange,
  maxFiles = 0,
  informationText = '',
  allowedDataType = ['images', 'png', 'jpg', 'jpeg', 'pdf', 'doc', 'xls', 'xlsx'],
  maxSize = 5242880,
  error,
  useFilePreview = true,
  progress,
  id,
  deleteFilePath,
}: FileUploadDragDropProps) => {
  const [acceptedData, setAcceptedData] = useState()

  const typeCollection = {
    images: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    png: {
      'image/png': ['.png'],
    },
    jpg: {
      'image/jpg': ['.jpg'],
    },
    jpeg: {
      'image/jpeg': ['.jpeg'],
    },
    pdf: {
      'application/pdf': ['.pdf'],
    },
    doc: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    xls: {
      'application/vnd.ms-excel': ['.xls'],
    },
    xlsx: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  }

  useEffect(() => {
    setAcceptedData(
      allowedDataType
        .map((item) => typeCollection[item])
        .reduce((accumulator, currentValue) => Object.assign(accumulator, currentValue)),
    )
  }, [])

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept: acceptedData,
    maxFiles,
    maxSize,
    validator: (newFile) => {
      const isDuplicate = stateUploadedFile.some((file) => file.name === newFile.name && file.size === newFile.size)

      const isMoreThanMaxFileSize = stateUploadedFile.some((file) => file.size > maxSize)

      if (isDuplicate) {
        return {
          code: 'duplicate-file',
          message: `File with name ${newFile.name} already uploaded`,
        }
      }

      if (isMoreThanMaxFileSize) {
        return {
          code: 'more-than-max-file-size',
          message: `File with name ${newFile.name} is larger than ${formatBytes(maxSize)}`,
        }
      }

      return null
    },
    onDrop: (acceptedFiles, onDropfileRejections) => {
      if (onDropfileRejections.length > 0) return

      const allowedFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      )

      if (maxFiles === 1) {
        setUploadedFile(allowedFiles)
        onChange(allowedFiles)
      } else if (maxFiles > 0 && maxFiles !== 1) {
        const recap = [...stateUploadedFile, ...allowedFiles]
        setUploadedFile(recap)
        onChange(recap)
      }
    },
  })

  const fileRejectionItems = fileRejections.map(({ file, errors }: { file: FileWithPath; errors: FileError[] }) => (
    <div key={file.path} className="mb-4 text-sm">
      {file.path} - {formatBytes(file.size)}
      <ul>
        {errors.map((e) => (
          <li key={e.code} className="text-error-500">
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  ))

  const thumbs = stateUploadedFile.map((file) => (
    <div className={cn('mx-2 w-full')} key={file.name}>
      <div className="flex overflow-hidden">
        <div className="flex w-full items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
            <File04Icon className="h-4 w-4 stroke-primary-600" />
          </div>
          <div className="relative w-full">
            {maxFiles > 1 ? (
              <>
                {Object.keys(progress).length > 0 && (
                  <span
                    data-testid={`file-upload-status-${id}`}
                    className={cn(
                      'absolute -right-9 top-0 text-[0.625rem] font-medium',
                      progress[`${slugify(file.name)}-${file.lastModified}`]?.progress === 100
                        ? 'text-primary-600'
                        : 'text-gray-400',
                    )}
                  >
                    {progress[`${slugify(file.name)}-${file.lastModified}`]?.progress === 100
                      ? 'Uploaded!'
                      : 'Uploading...'}
                  </span>
                )}
                <p className="line-clamp-2 w-4/5 text-sm font-medium text-gray-700">{file.name}</p>
                <span className="text-sm uppercase">{formatBytes(file.size)}</span>
                {Object.keys(progress).length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative h-2 w-full shrink rounded bg-gray-200">
                      <span
                        style={{
                          width: `${progress?.[`${slugify(file.name)}-${file.lastModified}`]?.progress || 0}%`,
                        }}
                        className="absolute inset-0 rounded bg-primary-600"
                      ></span>
                    </div>
                    <p className="w-10 grow text-right text-sm font-medium text-gray-700">
                      {progress?.[`${slugify(file.name)}-${file.lastModified}`]?.progress || 0}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {Object.keys(progress).length > 0 && (
                  <span
                    data-testid={`file-upload-status-${id}`}
                    className={cn(
                      'absolute -right-9 top-0 text-xs font-medium',
                      progress[id]?.progress === 100 ? 'text-primary-600' : 'text-gray-400',
                    )}
                  >
                    {progress[id]?.progress === 100 ? 'Uploaded!' : 'Uploading...'}
                  </span>
                )}
                <p className="line-clamp-2 w-4/5 text-sm font-medium text-gray-700">{file.name}</p>
                <span className="text-sm uppercase">{formatBytes(file.size)}</span>
                {Object.keys(progress).length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative h-2 w-full shrink rounded bg-gray-200">
                      <span
                        style={{
                          width: `${progress?.[id]?.progress || 0}%`,
                        }}
                        className="absolute inset-0 rounded bg-primary-600"
                      ></span>
                    </div>
                    <p className="w-10 grow text-right text-sm font-medium text-gray-700">
                      {progress?.[id]?.progress || 0}%
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className="shrink-0 rounded-md border border-error-300 bg-error-50 p-1.5 text-error-700 duration-300 focus-within:ring-4 focus-within:ring-error-100 hover:bg-error-100 hover:text-error-800 focus:border-error-50 focus:ring-4 focus:ring-error-100 hover:focus:border-error-100 disabled:border-error-25 disabled:bg-error-25 disabled:text-error-300 disabled:hover:bg-error-25 disabled:hover:text-error-300"
            onClick={() => deleteFilePath(file.name)}
          >
            <Trash01Icon className="h-4 w-4 stroke-error-700" />
          </div>
        </div>
      </div>
    </div>
  ))

  useEffect(
    () => () => {
      // Make sure to revoke the data uris to avoid memory leaks
      stateUploadedFile.forEach((file: any) => URL.revokeObjectURL(file.preview))
    },
    [stateUploadedFile],
  )

  const handleClearAll = () => {
    stateUploadedFile.forEach((file: any) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      deleteFilePath(file.name)
    })
    setUploadedFile([])
    onChange([])
  }

  return (
    <>
      <section
        className={cn(
          'w-full rounded-xl border p-2 hover:cursor-pointer',
          error ? 'border-error-300' : 'border-gray-200',
        )}
      >
        <div {...getRootProps({ className: 'text-center my-2' })}>
          <input {...getInputProps({ onChange })} data-testid={id ? `file-upload-${slugify(id)}` : 'file-upload'} />
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-gray-50 bg-gray-100">
            <UploadCloud02Icon className="h-5 w-5 stroke-gray-600" />
          </div>
          <p className="mb-0.5 text-sm font-normal leading-5 text-gray-600">
            <span className="font-semibold text-primary-700">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-600">{informationText}</p>
        </div>
        {useFilePreview && stateUploadedFile.length > 0 && (
          <>
            <div className={cn('flex flex-wrap gap-2.5', maxFiles == 1 && 'justify-center')}>{thumbs}</div>
            {maxFiles > 1 && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClearAll()
                  }}
                  data-testid={id ? `clear-all-files-${slugify(id)}` : 'clear-all-files'}
                  className="rounded-md border border-error-300 bg-error-50 px-4 py-2 text-sm font-medium text-error-700 duration-300 focus-within:ring-4 focus-within:ring-error-100 hover:bg-error-100 hover:text-error-800 focus:border-error-50 focus:ring-4 focus:ring-error-100 hover:focus:border-error-100 disabled:border-error-25 disabled:bg-error-25 disabled:text-error-300 disabled:hover:bg-error-25 disabled:hover:text-error-300"
                >
                  Clear All Files
                </button>
              </div>
            )}
          </>
        )}
        <div className="block text-center">{fileRejectionItems && fileRejectionItems}</div>
      </section>
    </>
  )
}
