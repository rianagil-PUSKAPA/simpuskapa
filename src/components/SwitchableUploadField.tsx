import { Button } from '@/components/Button'
import { FilePreview } from '@/components/FilePreview'
import { FileUploadDragDrop } from '@/components/FileUploadDragDrop'
import { Input } from '@/components/Input'
import { Link03Icon } from '@/components/icon/Link03Icon'
import { SwitchHorizontal02 } from '@/components/icon/SwitchHorizontal02'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form'

type SwitchableUploadFieldProps<T extends FieldValues> = {
  // Field identification
  name: Path<T>
  label: string
  fieldKey: string // e.g., 'background_docs'

  // Form control
  control: Control<T>
  errors: FieldErrors<T>
  setValue: (name: Path<T>, value: any) => void

  // Switch state
  isLinkMode: boolean
  onToggle: () => void

  // File upload props
  bucketName: BucketsUnion
  uploadProgress: DynamicProgressType
  uploadedFiles: any[]
  setUploadedFiles: (files: any[]) => void
  handleUploadFile?: (files: File[], fieldKey: string) => void
  deleteFilePath: (filename: string) => void
  maxFiles?: number
  informationText?: string

  // Existing file preview
  existingFilePath?: string | null
  handleDeleteExistingFile: () => void

  // Validation
  isEditMode: boolean
  isRequired?: boolean

  // Optional customization
  linkPlaceholder?: string
  linkHintText?: string
}

export function SwitchableUploadField<T extends FieldValues>({
  name,
  label,
  fieldKey,
  control,
  errors,
  setValue,
  isLinkMode,
  onToggle,
  bucketName,
  uploadProgress,
  uploadedFiles,
  setUploadedFiles,
  handleUploadFile,
  deleteFilePath,
  maxFiles = 1,
  informationText = 'IMAGE or DOCUMENTS (max. 5MB)',
  existingFilePath,
  handleDeleteExistingFile,
  isEditMode,
  isRequired = true,
  linkPlaceholder = 'drive.google.com/linkthefile',
  linkHintText = 'Make sure the file is "Anyone with Link can view"',
}: SwitchableUploadFieldProps<T>) {
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

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <label htmlFor={name} className="inline-block text-sm font-medium text-gray-700">
          {label}
        </label>
        <Button
          btnType="normal"
          variant="secondary-gray"
          size="xs"
          onClick={() => {
            onToggle()
            setValue(name, null)
          }}
          className="shrink-0"
        >
          {isLinkMode ? 'Switch to File Upload' : 'Switch to Link Upload'}
          <SwitchHorizontal02 className="h-4 w-4 stroke-gray-600" />
        </Button>
      </div>

      {/* Preview existing file */}
      {existingFilePath && (
        <div className="mb-3">
          <FilePreview
            fileName={existingFilePath}
            showDeleteButton={true}
            handleDeleteFile={handleDeleteExistingFile}
          />
        </div>
      )}

      {/* Link mode */}
      {isLinkMode ? (
        <Controller
          control={control}
          rules={
            isEditMode
              ? undefined
              : {
                  required: isRequired ? `${label} link is required field` : false,
                  validate: (value: string) => {
                    // If field is empty or whitespace
                    if (!value || value.trim() === '') {
                      return true // Valid when not required
                    }
                    // If value exists, validate URL format
                    return /^(ftp|http|https):\/\/[^ "]+$/.test(value) || 'Please enter a valid URL'
                  },
                }
          }
          name={name}
          render={({ field: { value, onChange }, fieldState: { invalid } }) => (
            <>
              <Input
                type="text"
                placeholder={linkPlaceholder}
                primaryIcon={<Link03Icon className="h-5 w-5 stroke-gray-600" />}
                onChange={onChange}
                value={(value || '') as string}
                error={invalid}
              />
              {linkHintText && <span className="input-hint-text !block">{linkHintText}</span>}
              {fieldError && <span className="input-hint-text error">{fieldError.message as string}</span>}
            </>
          )}
        />
      ) : (
        /* File upload mode */
        <Controller
          control={control}
          rules={isEditMode ? undefined : isRequired ? { required: `${label} document is required field` } : undefined}
          name={name}
          render={({ field: { onChange }, fieldState: { invalid } }) => (
            <>
              <FileUploadDragDrop
                id={fieldKey}
                bucketName={bucketName}
                progress={uploadProgress}
                setUploadedFile={setUploadedFiles}
                stateUploadedFile={uploadedFiles}
                onChange={(files: File[]) => {
                  handleUploadFile?.(files, fieldKey)
                  onChange(files)
                }}
                maxFiles={maxFiles}
                informationText={informationText}
                error={invalid}
                deleteFilePath={deleteFilePath}
              />
              {fieldError && <span className="input-hint-text error">{fieldError.message as string}</span>}
            </>
          )}
        />
      )}
    </div>
  )
}
