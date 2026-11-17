# SwitchableUploadField Component

A reusable React component that provides a switchable interface between file upload and external link input modes. This component is designed to reduce code duplication and provide consistent user experience across forms that require flexible document submission options.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Complete Implementation Guide](#complete-implementation-guide)
- [Migration Guide](#migration-guide)
- [Examples](#examples)

## Overview

The `SwitchableUploadField` component encapsulates the common pattern of allowing users to either:

1. **Upload a file directly** - Using drag-and-drop or file picker
2. **Provide an external link** - Input a URL to a document (e.g., Google Drive link)

This eliminates the need to write ~120 lines of repetitive code for each switchable upload field in your forms.

## Features

- **Type-safe**: Full TypeScript support with generics for form type safety
- **React Hook Form integration**: Works seamlessly with `react-hook-form`
- **Flexible validation**: Supports both required and optional fields
- **Edit mode aware**: Handles validation differently for edit vs create modes
- **Existing file preview**: Shows and allows deletion of previously uploaded files
- **Customizable**: All labels, placeholders, and hint texts can be customized
- **Consistent UX**: Ensures the same user experience across all switchable upload fields
- **Automatic error handling**: Built-in error message display

## Installation

The component is located at:

```
/src/components/SwitchableUploadField.tsx
```

Import it in your component:

```typescript
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
```

## Basic Usage

```tsx
<SwitchableUploadField
  name="personal_hire_information.background_docs"
  label="Background Documents"
  fieldKey="background_docs"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.backgroundDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      backgroundDocuments: !prev.backgroundDocuments,
    }))
  }}
  bucketName={BucketsEnum.rf_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={backgroundDocuments}
  setUploadedFiles={setBackgroundDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteBackgroundDocuments}
  existingFilePath={existdocumentsPath?.['background_docs']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      background_docs: null,
    }))
  }}
  isEditMode={router.query.slug[1] === 'edit'}
  isRequired={true}
/>
```

## Props Reference

### Required Props

| Prop                       | Type                  | Description                                                                        |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `name`                     | `Path<T>`             | React Hook Form field name (e.g., "personal_hire_information.background_docs")     |
| `label`                    | `string`              | Display label for the field                                                        |
| `fieldKey`                 | `string`              | Internal key for the field (e.g., "background_docs")                               |
| `control`                  | `Control<T>`          | React Hook Form control object                                                     |
| `errors`                   | `FieldErrors<T>`      | React Hook Form errors object                                                      |
| `setValue`                 | `function`            | React Hook Form setValue function                                                  |
| `isLinkMode`               | `boolean`             | Current mode state (true = link mode, false = file upload mode)                    |
| `onToggle`                 | `function`            | Callback function to toggle between modes                                          |
| `bucketName`               | `BucketsUnion`        | S3 bucket name for file uploads                                                    |
| `uploadProgress`           | `DynamicProgressType` | Upload progress tracking object                                                    |
| `uploadedFiles`            | `any[]`               | Array of uploaded file objects                                                     |
| `setUploadedFiles`         | `function`            | State setter for uploaded files                                                    |
| `handleUploadFile`         | `function`            | Upload handler function with signature `(files: File[], fieldKey: string) => void` |
| `deleteFilePath`           | `function`            | File deletion handler with signature `(filename: string) => void`                  |
| `handleDeleteExistingFile` | `function`            | Handler for deleting existing files                                                |
| `isEditMode`               | `boolean`             | Whether the form is in edit mode                                                   |

### Optional Props

| Prop               | Type             | Default                                                 | Description                           |
| ------------------ | ---------------- | ------------------------------------------------------- | ------------------------------------- |
| `maxFiles`         | `number`         | `1`                                                     | Maximum number of files allowed       |
| `informationText`  | `string`         | `"IMAGE or DOCUMENTS (max. 5MB)"`                       | Helper text shown below upload area   |
| `existingFilePath` | `string \| null` | `null`                                                  | Path to existing file (for edit mode) |
| `isRequired`       | `boolean`        | `true`                                                  | Whether the field is required         |
| `linkPlaceholder`  | `string`         | `"drive.google.com/linkthefile"`                        | Placeholder text for link input       |
| `linkHintText`     | `string`         | `"Make sure the file is \"Anyone with Link can view\""` | Hint text shown below link input      |

## Complete Implementation Guide

### Step 1: Set Up Required State

```typescript
// Toggle state for switching between link/file modes
const [switchTogglableButton, setSwitchTogglableButton] = useState<{
  backgroundDocuments: boolean
  hireProcessDocuments: boolean
  offerPageDocuments: boolean
}>({
  backgroundDocuments: false,
  hireProcessDocuments: false,
  offerPageDocuments: false,
})

// File upload state
const [backgroundDocuments, setBackgroundDocuments] = useState([])
const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})

// Document paths for uploaded files
const [documentsPath, setDocumentsPath] = useState<object | null>(null)
const [existdocumentsPath, setExistDocumentsPath] = useState<object | null>(null)
```

### Step 2: Create Upload Handler

```typescript
const handleUploadFile = async (
  fileObjects: File[],
  fileUploadType: 'background_docs' | 'hire_process_docs' | 'offer_page_docs',
) => {
  const bucketName = BucketsEnum.rf_doc
  if (!Array.isArray(fileObjects)) return

  fileObjects.map(async (fileObject) => {
    const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

    const identifier = fileUploadType
    const fileNameS3 = String(presignUrl.data.data).split('::')[0]

    await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
      headers: {
        'Content-Type': fileObject.type,
      },
      onUploadProgress: (e) => {
        const percentCompleted = Math.round((e.loaded * 100) / e.total)
        setTempProgressUpload((prev) => ({
          ...prev,
          [identifier]: {
            bucketName,
            progress: percentCompleted,
            identifier,
          },
        }))
      },
    })

    // Save the uploaded file path
    const filePath = [`${bucketName}/${fileNameS3}`]
    setDocumentsPath((prev) => ({
      ...prev,
      [fileUploadType]: filePath,
    }))
  })
}
```

### Step 3: Create Delete Handler

```typescript
const deleteBackgroundDocuments = async (filename: string) => {
  setDocumentsPath((prev) => {
    prev['background_docs'] = prev['background_docs'].filter((path) => !path.includes(filename))
    return prev
  })
  setBackgroundDocuments((prev) => prev.filter((item) => item.path !== filename))
}
```

### Step 4: Handle Form Submission

```typescript
const submitForm: SubmitHandler<FormType> = async (formInput) => {
  const submitValues = {
    // ... other form fields
    background_docs: switchTogglableButton.backgroundDocuments
      ? [`${formInput.personal_hire_information.background_docs}`] // Link mode: use URL from input
      : documentsPath?.['background_docs'] || // Upload mode: use uploaded file path
        existdocumentsPath?.['background_docs'], // Edit mode: use existing path
  }

  // Submit the form...
}
```

### Step 5: Handle Edit Mode Loading

```typescript
useEffect(() => {
  const loadExistingData = async () => {
    const rfResult = await getFormData()

    // Check if existing value is a URL or file path
    if (isValidUrl(rfResult.rf_attributes['background_docs'][0])) {
      // It's a link - enable link mode
      setSwitchTogglableButton((prev) => ({
        ...prev,
        backgroundDocuments: true,
      }))
      setValue(
        'personal_hire_information.background_docs',
        rfResult.rf_attributes['background_docs'] as unknown as string[],
      )
    } else {
      // It's a file path - enable file upload mode
      if (rfResult.rf_attributes['background_docs'].length > 0) {
        setExistDocumentsPath((prev) => ({
          ...prev,
          background_docs: rfResult.rf_attributes['background_docs'],
        }))
      }
    }
  }

  if (isEditMode) {
    loadExistingData()
  }
}, [isEditMode])
```

## Migration Guide

### Before: Old Code Pattern (~120 lines)

```tsx
<div>
  <div className="mb-2.5 flex items-center justify-between">
    <label htmlFor="field" className="input-label mb-0">
      Field Label
    </label>
    <Switch
      checked={switchTogglableButton.field}
      onCheckedChange={() => {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          field: !prev.field,
        }))
        setValue('field', null)
      }}
    />
  </div>
  {existdocumentsPath && existdocumentsPath['field'] && (
    <div className="mb-3">
      <FilePreview
        fileName={existdocumentsPath['field'][0]}
        showDeleteButton={true}
        handleDeleteFile={() => {
          setExistDocumentsPath((prev) => ({
            ...prev,
            field: null,
          }))
        }}
      />
    </div>
  )}
  {switchTogglableButton.field ? (
    <Controller
      control={control}
      rules={{
        required: 'Link is required',
        pattern: {
          value: /^(ftp|http|https):\/\/[^ "]+$/,
          message: 'Please enter a valid URL',
        },
      }}
      name="field"
      render={({ field: { value, onChange }, fieldState: { invalid } }) => (
        <>
          <Input
            type="text"
            placeholder="Insert external link here"
            primaryIcon={<Link03Icon className="h-5 w-5 stroke-gray-600" />}
            onChange={onChange}
            value={(value || '') as string}
            error={invalid}
          />
          <span className="input-hint-text !block">Make sure the file is "Anyone with Link can view"</span>
          {errors?.field && <span className="input-hint-text error">{errors?.field?.message}</span>}
        </>
      )}
    />
  ) : (
    <Controller
      control={control}
      rules={{ required: 'Document is required' }}
      name="field"
      render={({ field: { onChange }, fieldState: { invalid } }) => (
        <>
          <FileUploadDragDrop
            id="field"
            bucketName={BucketsEnum.rf_doc}
            progress={tempProgressUpload}
            setUploadedFile={setFieldDocuments}
            stateUploadedFile={fieldDocuments}
            onChange={(files: File[]) => {
              handleUploadFile(files, 'field')
              onChange(files)
            }}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            error={invalid}
            deleteFilePath={deleteFieldDocuments}
          />
          {errors?.field && <span className="input-hint-text error">{errors?.field?.message}</span>}
        </>
      )}
    />
  )}
</div>
```

### After: Using SwitchableUploadField (~30 lines)

```tsx
<SwitchableUploadField
  name="field"
  label="Field Label"
  fieldKey="field"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.field}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      field: !prev.field,
    }))
  }}
  bucketName={BucketsEnum.rf_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={fieldDocuments}
  setUploadedFiles={setFieldDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteFieldDocuments}
  existingFilePath={existdocumentsPath?.['field']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      field: null,
    }))
  }}
  isEditMode={router.query.slug[1] === 'edit'}
  isRequired={true}
/>
```

## Examples

### Example 1: Required Field (Personnel Hire)

```tsx
<SwitchableUploadField
  name="personal_hire_information.background_docs"
  label="Background Documents"
  fieldKey="background_docs"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.backgroundDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      backgroundDocuments: !prev.backgroundDocuments,
    }))
  }}
  bucketName={BucketsEnum.rf_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={backgroundDocuments}
  setUploadedFiles={setBackgroundDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteBackgroundDocuments}
  existingFilePath={existdocumentsPath?.['background_docs']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      background_docs: null,
    }))
  }}
  isEditMode={router.query.slug[1] === 'edit'}
  isRequired={true}
/>
```

### Example 2: Optional Field

```tsx
<SwitchableUploadField
  name="personal_hire_information.other_docs"
  label="Other Documents (Optional)"
  fieldKey="other_docs"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.otherDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      otherDocuments: !prev.otherDocuments,
    }))
  }}
  bucketName={BucketsEnum.rf_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={otherDocuments}
  setUploadedFiles={setOtherDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteOtherDocuments}
  existingFilePath={existdocumentsPath?.['other_docs']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      other_docs: null,
    }))
  }}
  isEditMode={router.query.slug[1] === 'edit'}
  isRequired={false} // Optional field
/>
```

### Example 3: Multiple Files Upload

```tsx
<SwitchableUploadField
  name="project_documents"
  label="Project Documents"
  fieldKey="project_docs"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.projectDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      projectDocuments: !prev.projectDocuments,
    }))
  }}
  bucketName={BucketsEnum.project_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={projectDocuments}
  setUploadedFiles={setProjectDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteProjectDocuments}
  maxFiles={10} // Allow up to 10 files
  informationText="IMAGE or DOCUMENTS (max 5MB each file)"
  existingFilePath={existdocumentsPath?.['project_docs']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      project_docs: null,
    }))
  }}
  isEditMode={isEditMode}
  isRequired={true}
/>
```

### Example 4: Custom Placeholder and Hint

```tsx
<SwitchableUploadField
  name="contract_document"
  label="Contract Document"
  fieldKey="contract"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.contract}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contract: !prev.contract,
    }))
  }}
  bucketName={BucketsEnum.contract_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={contractDocuments}
  setUploadedFiles={setContractDocuments}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteContractDocuments}
  existingFilePath={existdocumentsPath?.['contract']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistDocumentsPath((prev) => ({
      ...prev,
      contract: null,
    }))
  }}
  isEditMode={isEditMode}
  isRequired={true}
  linkPlaceholder="https://example.com/contract.pdf" // Custom placeholder
  linkHintText="Share a link to the signed contract document" // Custom hint
/>
```

## Benefits

1. **Reduced Code Duplication**: From ~120 lines to ~30 lines per field (75% reduction)
2. **Easier Maintenance**: Update logic in one place affects all fields
3. **Consistent UX**: All fields behave identically
4. **Better Testability**: Component can be tested independently
5. **Type Safety**: Full TypeScript support with proper error handling
6. **Reusability**: Can be used across different pages and forms

## Implementation Checklist

When implementing on a new page:

- [ ] Import the `SwitchableUploadField` component
- [ ] Set up toggle state for each field
- [ ] Set up file upload state for each field
- [ ] Create or reuse upload handler function
- [ ] Create or reuse delete handler function
- [ ] Set up document paths state
- [ ] Handle form submission with link/file logic
- [ ] Handle edit mode data loading
- [ ] Replace old code blocks with component
- [ ] Test both link and file upload modes
- [ ] Test required/optional validation
- [ ] Test edit mode functionality

## Common Pages to Implement

- Personnel Hire (PH) - ✅ Already implemented
- Purchase Request (PR)
- Advance Payment Statement (APS)
- Account Payable Receipt (APR)
- Vendor Management
- Project Documentation
- Budget Request Forms

## Support

For questions or issues:

1. Check this README
2. Review the component implementation at `/src/components/SwitchableUploadField.tsx`
3. Look at the working example in `/src/layout/procurement/PersonalHire.tsx`

---

**Last Updated**: 2026-02-05
**Component Version**: 1.0.0
**Maintained by**: Development Team
