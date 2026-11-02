import { Button } from '@/components/Button'
import { FilePreview } from '@/components/FilePreview'
import { FileUploadDragDrop } from '@/components/FileUploadDragDrop'
import { Input } from '@/components/Input'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { Link03Icon } from '@/components/icon/Link03Icon'
import { SwitchHorizontal02 } from '@/components/icon/SwitchHorizontal02'
import { cn } from '@/lib/utils'
import { BucketsEnum } from '@/shared/file.system'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form'
import { toast } from 'react-toastify'

type SwitchableUploadFieldMultipleProps<T extends FieldValues> = {
  // Field identification
  name: Path<T>
  label: string

  // Form control
  control: Control<T>
  errors: FieldErrors<T>
  setValue: (name: Path<T>, value: any) => void

  // Switch state
  isLinkMode: boolean
  onToggle: () => void

  // Multiple links state (for link mode)
  linkCollections: string[]
  setLinkCollections: React.Dispatch<React.SetStateAction<string[]>>

  // File upload props (for file mode)
  bucketName: BucketsUnion
  uploadProgress: DynamicProgressType
  uploadedFiles: any[]
  setUploadedFiles: (files: any[]) => void
  handleUploadFile: (files: File[], bucketName: BucketsUnion) => void
  deleteFilePath: (filename: string) => void
  maxFiles?: number
  informationText?: string

  // Existing files preview (for edit mode with file upload)
  existingFiles?: string[] | null
  handleDeleteExistingFile?: (file: string) => void
  existingFileBucketCheck?: BucketsEnum // e.g., BucketsEnum.program_contract

  // Validation
  isEditMode?: boolean
  isRequired?: boolean

  // Optional customization
  linkPlaceholder?: string
  linkHintText?: string
}

export function SwitchableUploadFieldMultiple<T extends FieldValues>({
  name,
  label,
  control,
  errors,
  setValue,
  isLinkMode,
  onToggle,
  linkCollections,
  setLinkCollections,
  bucketName,
  uploadProgress,
  uploadedFiles,
  setUploadedFiles,
  handleUploadFile,
  deleteFilePath,
  maxFiles = 10,
  informationText = 'IMAGE or DOCUMENTS (max 5MB each file)',
  existingFiles,
  handleDeleteExistingFile,
  existingFileBucketCheck,
  isEditMode = false,
  isRequired = true,
  linkPlaceholder = 'Insert external link here',
  linkHintText = 'Make sure the file is "Anyone with Link can view"',
}: SwitchableUploadFieldMultipleProps<T>) {
  // Get the error for this field
  const getNestedError = (errors: any, path: string) => {
    const keys = path.split('.')
    let error = errors
    for (const key of keys) {
      if (error && error[key]) {
        error = error[key]
      } else {
        return null
      }
    }
    return error
  }

  const fieldError = getNestedError(errors, name as string)

  // Check if existing files are from the expected bucket (not external links)
  const shouldShowExistingFiles =
    existingFiles &&
    existingFiles.length > 0 &&
    existingFileBucketCheck &&
    !existingFiles[0]?.includes(String(existingFileBucketCheck))

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label htmlFor={name} className="input-label mb-0 inline-block text-sm font-medium text-gray-700">
          {label}
        </label>
        <Button
          btnType="normal"
          variant="secondary-gray"
          size="xs"
          onClick={() => {
            onToggle()
            setValue(name, undefined)
          }}
        >
          {isLinkMode ? 'Switch to File Upload' : 'Switch to Link Upload'}
          <SwitchHorizontal02 className="h-4 w-4 stroke-gray-600" />
        </Button>
      </div>

      {/* Link mode - Multiple links with add button */}
      {isLinkMode ? (
        <>
          {/* Preview added links */}
          <div className={cn('flex w-full flex-col gap-3', linkCollections?.length ? 'mb-5' : '')}>
            {linkCollections?.map((item: string, index: number) => (
              <FilePreview
                key={index}
                fileName={item}
                showDeleteButton={true}
                handleDeleteFile={() => {
                  setLinkCollections((prev) => prev.filter((i) => i !== item))
                }}
              />
            ))}
          </div>

          {/* Link input with Add button */}
          <Controller
            control={control}
            name={name}
            rules={
              isEditMode
                ? undefined
                : isRequired
                ? {
                    validate: () => {
                      // Only validate in link mode
                      if (!isLinkMode) return true
                      // Check if linkCollections has at least one item
                      if (linkCollections.length === 0) {
                        return `${label} is required field`
                      }
                      return true
                    },
                  }
                : undefined
            }
            render={({ field: { value, onChange } }) => (
              <div className="flex items-start gap-3">
                <div className="grow">
                  <Input
                    type="text"
                    placeholder={linkPlaceholder}
                    primaryIcon={<Link03Icon className="h-5 w-5 stroke-gray-600" />}
                    onChange={onChange}
                    value={(value || '') as unknown as string}
                  />
                  {linkHintText && <span className="input-hint-text !block">{linkHintText}</span>}
                </div>
                <Button
                  type="button"
                  btnType="normal"
                  size="md"
                  variant="primary"
                  onClick={() => {
                    const pattern = /^(ftp|http|https):\/\/[^ "]+$/

                    if (!pattern.test((value || '') as unknown as string)) {
                      toast.warning('Please enter a valid URL', {
                        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
                        autoClose: 10000,
                      })
                      return false
                    } else {
                      setValue(name, null)
                    }

                    setLinkCollections((prev) => [...prev, value as string])
                  }}
                >
                  Add link
                </Button>
              </div>
            )}
          />

          {/* Error message for link mode - shown outside input */}
          {fieldError && <p className="input-hint-text error mt-2 !block">{fieldError.message as string}</p>}
        </>
      ) : (
        /* File upload mode */
        <>
          {/* Preview existing files (for edit mode) */}
          {shouldShowExistingFiles ? (
            <div className={cn('flex w-full flex-col gap-3', existingFiles?.length ? 'mb-5' : '')}>
              {existingFiles?.map((item: string, index: number) => (
                <FilePreview
                  key={index}
                  fileName={item}
                  showDeleteButton={true}
                  handleDeleteFile={() => handleDeleteExistingFile && handleDeleteExistingFile(item)}
                />
              ))}
            </div>
          ) : null}

          {/* File upload drag & drop */}
          <Controller
            control={control}
            name={name}
            rules={
              isEditMode
                ? undefined
                : isRequired
                ? {
                    validate: () => {
                      // Only validate in file mode
                      if (isLinkMode) return true
                      // Check if files are uploaded
                      if (!uploadedFiles || uploadedFiles.length === 0) {
                        return 'This is required field'
                      }
                      return true
                    },
                  }
                : undefined
            }
            render={({ field: { onChange }, fieldState: { invalid } }) => (
              <FileUploadDragDrop
                bucketName={bucketName}
                progress={uploadProgress}
                setUploadedFile={setUploadedFiles}
                stateUploadedFile={uploadedFiles}
                onChange={(files: File[]) => {
                  handleUploadFile(files, bucketName)
                  onChange(files)
                }}
                maxFiles={maxFiles}
                informationText={informationText}
                error={invalid}
                deleteFilePath={deleteFilePath}
              />
            )}
          />
          {fieldError && <p className="input-hint-text error !block">{fieldError.message as string}</p>}
        </>
      )}
    </div>
  )
}
