import { Button } from '@/components/Button'
import { FilePreview } from '@/components/FilePreview'
import { FileUploadDragDrop } from '@/components/FileUploadDragDrop'
import { Input } from '@/components/Input'
import { Link03Icon } from '@/components/icon/Link03Icon'
import { SwitchHorizontal02 } from '@/components/icon/SwitchHorizontal02'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form'

type FileUploadDragDropDynamicProps<T extends FieldValues> = {
  // Field identification
  name: Path<T>
  label: string
  fieldKey: string // e.g., 'attendees_list'

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
  handleUploadFile: (files: File[], fieldKey: string) => void
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

/**
 * File upload component with switchable link/file modes for dynamic use cases.
 * This component is designed for use in loops or dynamic field scenarios.
 *
 * @example
 * ```tsx
 * <FileUploadDragDropDynamic
 *   name="additional_attachments.attendees"
 *   label="Attendees List"
 *   fieldKey="attendees_list"
 *   control={control}
 *   errors={errors}
 *   setValue={setValue}
 *   isLinkMode={switchTogglableButton.attendeesList}
 *   onToggle={() => setSwitchTogglableButton(prev => ({...prev, attendeesList: !prev.attendeesList}))}
 *   bucketName={BucketsEnum.pr_doc}
 *   uploadProgress={tempProgressUpload}
 *   uploadedFiles={attendeesFiles}
 *   setUploadedFiles={setAttendeesFiles}
 *   handleUploadFile={handleUploadFile}
 *   deleteFilePath={deleteAttendeesFile}
 *   existingFilePath={existingAttachments?.['attendees_list']?.[0] || null}
 *   handleDeleteExistingFile={() => setExistingAttachments(prev => ({...prev, attendees_list: null}))}
 *   isEditMode={router.query.edit === 'true'}
 * />
 * ```
 */
export function FileUploadDragDropDynamic<T extends FieldValues>({
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
}: FileUploadDragDropDynamicProps<T>) {
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

  const fieldError = getNestedError(errors, String(name))

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
              : isRequired
              ? {
                  required: `${label} link is required field`,
                  pattern: {
                    value: /^(ftp|http|https):\/\/[^ "]+$/,
                    message: 'Please enter a valid URL',
                  },
                }
              : undefined
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
                  handleUploadFile(files, fieldKey)
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
