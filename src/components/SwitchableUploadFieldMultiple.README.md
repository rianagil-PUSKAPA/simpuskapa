# SwitchableUploadFieldMultiple Component

A reusable React component that provides a switchable interface between **multiple file uploads** and **multiple external link inputs**. This component extends the functionality of `SwitchableUploadField` to support multiple files and multiple links with an "Add link" workflow.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [When to Use](#when-to-use)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Complete Implementation Guide](#complete-implementation-guide)
- [Examples](#examples)
- [Differences from SwitchableUploadField](#differences-from-switchableuploadfield)

## Overview

The `SwitchableUploadFieldMultiple` component is designed for scenarios where users need to:

1. **Upload multiple files** - Using drag-and-drop or file picker (up to a specified limit)
2. **Provide multiple external links** - Add multiple URLs one by one with validation

This component is perfect for contract documents, project files, and any scenario requiring multiple file submissions.

## Features

- **Multiple files support**: Upload up to N files (configurable via `maxFiles` prop)
- **Multiple links support**: Add multiple external links with "Add link" button
- **Link validation**: Validates each URL before adding to the collection
- **Link preview**: Shows all added links with individual delete buttons
- **Type-safe**: Full TypeScript support with generics
- **React Hook Form integration**: Seamless integration with `react-hook-form`
- **Edit mode aware**: Handles existing files/links in edit mode
- **Flexible validation**: Supports both required and optional fields
- **Consistent UX**: Maintains the same user experience across all forms

## When to Use

### Use `SwitchableUploadFieldMultiple` when:

- ✅ Need to upload **multiple files** (e.g., contract documents)
- ✅ Need to support **multiple links** (e.g., Google Drive folder links)
- ✅ Users should add links one at a time with validation
- ✅ Need to preview all added links before submission

### Use `SwitchableUploadField` when:

- ✅ Only need **one file or one link**
- ✅ Simpler use case with single document
- ✅ Personnel documents, single contract, etc.

## Installation

The component is located at:

```
/src/components/SwitchableUploadFieldMultiple.tsx
```

Import it in your component:

```typescript
import { SwitchableUploadFieldMultiple } from '@/components/SwitchableUploadFieldMultiple'
```

## Basic Usage

```tsx
<SwitchableUploadFieldMultiple
  name="contract.contract_path"
  label="Documents"
  fieldKey="contract_path"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.contractDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contractDocuments: !prev.contractDocuments,
    }))
  }}
  linkCollections={linkCollections}
  setLinkCollections={setLinkCollections}
  bucketName={BucketsEnum.program_contract}
  uploadProgress={tempProgressUpload}
  uploadedFiles={otherDoc}
  setUploadedFiles={setOtherDoc}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteContractFiles}
  maxFiles={10}
  informationText="IMAGE or DOCUMENTS (max 5MB each file)"
  existingFiles={programDetailData?.contract?.contract_path}
  handleDeleteExistingFile={handleDeleteFile}
  existingFileBucketCheck={BucketsEnum.program_contract}
  isEditMode={!!router?.query?.id}
  isRequired={true}
/>
```

## Props Reference

### Required Props

| Prop                 | Type                  | Description                                                                       |
| -------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `name`               | `Path<T>`             | React Hook Form field name (e.g., "contract.contract_path")                       |
| `label`              | `string`              | Display label for the field                                                       |
| `fieldKey`           | `string`              | Internal key for the field (e.g., "contract_path")                                |
| `control`            | `Control<T>`          | React Hook Form control object                                                    |
| `errors`             | `FieldErrors<T>`      | React Hook Form errors object                                                     |
| `setValue`           | `function`            | React Hook Form setValue function                                                 |
| `isLinkMode`         | `boolean`             | Current mode state (true = link mode, false = file upload mode)                   |
| `onToggle`           | `function`            | Callback function to toggle between modes                                         |
| `linkCollections`    | `string[]`            | Array of added links (state)                                                      |
| `setLinkCollections` | `function`            | State setter for link collections                                                 |
| `bucketName`         | `BucketsUnion`        | S3 bucket name for file uploads                                                   |
| `uploadProgress`     | `DynamicProgressType` | Upload progress tracking object                                                   |
| `uploadedFiles`      | `any[]`               | Array of uploaded file objects                                                    |
| `setUploadedFiles`   | `function`            | State setter for uploaded files                                                   |
| `handleUploadFile`   | `function`            | Upload handler with signature `(files: File[], bucketName: BucketsUnion) => void` |
| `deleteFilePath`     | `function`            | File deletion handler with signature `(filename: string) => void`                 |

### Optional Props

| Prop                       | Type               | Default                                                 | Description                                                                 |
| -------------------------- | ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `maxFiles`                 | `number`           | `10`                                                    | Maximum number of files allowed                                             |
| `informationText`          | `string`           | `"IMAGE or DOCUMENTS (max 5MB each file)"`              | Helper text shown below upload area                                         |
| `existingFiles`            | `string[] \| null` | `null`                                                  | Array of existing file paths (for edit mode)                                |
| `handleDeleteExistingFile` | `function`         | `undefined`                                             | Handler for deleting existing files with signature `(file: string) => void` |
| `existingFileBucketCheck`  | `BucketsEnum`      | `undefined`                                             | Bucket name to check if existing files are uploaded files (not links)       |
| `isEditMode`               | `boolean`          | `false`                                                 | Whether the form is in edit mode                                            |
| `isRequired`               | `boolean`          | `true`                                                  | Whether the field is required                                               |
| `linkPlaceholder`          | `string`           | `"Insert external link here"`                           | Placeholder text for link input                                             |
| `linkHintText`             | `string`           | `"Make sure the file is \"Anyone with Link can view\""` | Hint text shown below link input                                            |

## Complete Implementation Guide

### Step 1: Set Up Required State

```typescript
// Toggle state for switching between link/file modes
const [switchTogglableButton, setSwitchTogglableButton] = useState<{
  contractDocuments: boolean
}>({
  contractDocuments: false,
})

// Multiple links collection state
const [linkCollections, setLinkCollections] = useState<string[]>([])

// File upload state
const [otherDoc, setOtherDoc] = useState([])
const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})

// Document paths for uploaded files
const [documentsPath, setDocumentsPath] = useState<object | null>(null)
```

### Step 2: Create Upload Handler

```typescript
const handleUploadFile = async (fileObjects: File[], bucketName: BucketsUnion) => {
  if (!Array.isArray(fileObjects)) return

  fileObjects.map(async (fileObject) => {
    const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)
    const identifier = `${slugify(fileObject.name)}-${fileObject.lastModified}`
    const fileNameS3 = String(presignUrl.data.data).split('::')[0]

    await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
      headers: {
        'Content-Type': fileObject.type,
      },
      onUploadProgress: (e) => {
        const percentCompleted = Math.round((e.loaded * 100) / e.total)

        setTempProgressUpload((prev) => {
          if (!prev[identifier] || percentCompleted > prev[identifier]?.progress) {
            return {
              ...prev,
              [identifier]: {
                bucketName,
                progress: percentCompleted,
                identifier,
              },
            }
          }
          return prev
        })
      },
    })

    // Save the uploaded file path
    const filePath = `${bucketName}/${fileNameS3}`
    setDocumentsPath((prev) => ({
      ...prev,
      contract_path: [...(prev?.contract_path || []), filePath],
    }))
  })
}
```

### Step 3: Create Delete Handler

```typescript
const deleteContractFiles = async (filename: string) => {
  setDocumentsPath((prev) => {
    if (prev?.contract_path) {
      prev.contract_path = prev.contract_path.filter((path) => !path.includes(filename))
    }
    return prev
  })
  setValue('contract.contract_path', undefined)
  setOtherDoc((prev) => prev.filter((item) => item.path !== filename))
}
```

### Step 4: Handle Existing File Deletion (Edit Mode)

```typescript
const handleDeleteFile = (file: string) => {
  const fileCollections = programDetailData?.contract?.contract_path

  const filteredContracts = fileCollections.filter((fileCollection) => fileCollection !== file)

  const modifiedProgram = {
    // ... other program fields
    contract: {
      contract_number: programDetailData.contract.contract_number,
      contract_path: filteredContracts,
    },
  }

  const programRes = programApi.programControllerUpdateProgram(
    programDetailData.id,
    modifiedProgram as unknown as ProgramCreateRequest,
  )

  toast.promise(programRes, {
    pending: `Deleting ${file}`,
    success: `${file} deleted`,
    error: 'Promise rejected 🤯',
  })

  programRes.then(() => {
    mutate(`project/${router.query.id}`)
  })
}
```

### Step 5: Handle Form Submission

```typescript
const submitForm: SubmitHandler<FormType> = async (formInput) => {
  // Validate link collections if in link mode
  if (switchTogglableButton.contractDocuments && linkCollections.length === 0) {
    toast.warning('Contract link is required field', {
      icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      autoClose: 10000,
    })
    return false
  }

  // Check if files are still uploading
  if (documentsPath === undefined && !switchTogglableButton.contractDocuments) {
    toast.warning('Please wait for file to be uploaded', {
      autoClose: 10000,
      icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
    })
    return false
  }

  const submitValues = {
    // ... other form fields
    contract: {
      contract_number: formInput.contract.contract_number,
      contract_path: switchTogglableButton.contractDocuments
        ? linkCollections // Link mode: use link collections array
        : documentsPath?.['contract_path'], // Upload mode: use uploaded file paths
    },
  }

  // Submit the form...
}
```

### Step 6: Handle Edit Mode Loading

```typescript
useEffect(() => {
  if (programDetailData) {
    setValue('contract.contract_number', programDetailData.contract.contract_number)

    // Check if existing data is links (not file paths)
    if (programDetailData.contract['contract_path'][0]?.split(BucketsEnum.program_contract)[0]) {
      // It's a link - enable link mode and load links
      setSwitchTogglableButton({
        contractDocuments: true,
      })
      programDetailData.contract['contract_path'].forEach((path) => {
        setLinkCollections((prev) => [...prev, path])
      })
    } else {
      // It's a file path - enable file upload mode
      setValue('contract.contract_path', programDetailData.contract.contract_path)
    }
  }
}, [programDetailData])
```

## Examples

### Example 1: Project Contract Documents

```tsx
<SwitchableUploadFieldMultiple
  name="contract.contract_path"
  label="Contract Documents"
  fieldKey="contract_path"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.contractDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contractDocuments: !prev.contractDocuments,
    }))
    setDocumentsPath(null)
    setOtherDoc([])
    setLinkCollections([])
  }}
  linkCollections={linkCollections}
  setLinkCollections={setLinkCollections}
  bucketName={BucketsEnum.program_contract}
  uploadProgress={tempProgressUpload}
  uploadedFiles={otherDoc}
  setUploadedFiles={setOtherDoc}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteContractFiles}
  maxFiles={10}
  informationText="IMAGE or DOCUMENTS (max 5MB each file)"
  existingFiles={programDetailData?.contract?.contract_path}
  handleDeleteExistingFile={handleDeleteFile}
  existingFileBucketCheck={BucketsEnum.program_contract}
  isEditMode={!!router?.query?.id}
  isRequired={true}
/>
```

### Example 2: Vendor Documents (Optional)

```tsx
<SwitchableUploadFieldMultiple
  name="vendor.supporting_documents"
  label="Supporting Documents (Optional)"
  fieldKey="supporting_documents"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.supportingDocs}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      supportingDocs: !prev.supportingDocs,
    }))
  }}
  linkCollections={supportingLinksCollections}
  setLinkCollections={setSupportingLinksCollections}
  bucketName={BucketsEnum.vendor_docs}
  uploadProgress={tempProgressUpload}
  uploadedFiles={supportingDocs}
  setUploadedFiles={setSupportingDocs}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteSupportingDocs}
  maxFiles={5}
  informationText="PDF or IMAGE files (max 10MB each)"
  isEditMode={isEditMode}
  isRequired={false} // Optional field
  linkPlaceholder="https://drive.google.com/..."
/>
```

## Differences from SwitchableUploadField

| Feature              | SwitchableUploadField  | SwitchableUploadFieldMultiple      |
| -------------------- | ---------------------- | ---------------------------------- |
| **Number of files**  | Single file            | Multiple files (configurable)      |
| **Number of links**  | Single link            | Multiple links with "Add" button   |
| **Link input**       | Direct input           | Input + "Add link" button workflow |
| **Link preview**     | No preview needed      | Shows list of added links          |
| **Link validation**  | On form submit         | On each "Add link" click           |
| **Use case**         | Simple single document | Contract documents, multiple files |
| **State complexity** | Lower                  | Higher (link collections array)    |

## Migration Guide

### Before: Old Pattern (~155 lines)

```tsx
<div>
  <div className="mb-2.5 flex items-center justify-between">
    <label htmlFor="documents" className="input-label mb-0">
      Documents
    </label>
    <Switch
      checked={switchTogglableButton.contractDocuments}
      onCheckedChange={() => {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          contractDocuments: !prev.contractDocuments,
        }))
        setValue('contract.contract_path', undefined)
        setDocumentsPath(null)
        setOtherDoc([])
        setLinkCollections([])
      }}
    />
  </div>

  {switchTogglableButton.contractDocuments ? (
    <>
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
      <Controller
        control={control}
        name="contract.contract_path"
        rules={{ required: false }}
        render={({ field: { value, onChange } }) => (
          <div className="flex items-start gap-3">
            <div className="grow">
              <Input
                type="text"
                placeholder="Insert external link here"
                primaryIcon={<Link03Icon className="h-5 w-5 stroke-gray-600" />}
                onChange={onChange}
                value={(value || '') as unknown as string}
              />
              <span className="input-hint-text !block">Make sure the file is "Anyone with Link can view"</span>
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
                  setValue('contract.contract_path', null)
                }
                setLinkCollections((prev) => [...prev, value])
              }}
            >
              Add link
            </Button>
          </div>
        )}
      />
    </>
  ) : (
    <>
      {!programDetailData?.contract['contract_path'][0]?.includes(BucketsEnum.program_contract) ? (
        <div
          className={cn(
            'flex w-full flex-col gap-3',
            programDetailData?.contract['contract_path']?.length ? 'mb-5' : '',
          )}
        >
          {programDetailData?.contract['contract_path']?.map((item: string, index: number) => (
            <FilePreview
              key={index}
              fileName={item}
              showDeleteButton={true}
              handleDeleteFile={() => handleDeleteFile(item)}
            />
          ))}
        </div>
      ) : null}

      <Controller
        control={control}
        name="contract.contract_path"
        rules={{ required: 'This is required field' }}
        render={({ field: { onChange }, fieldState: { invalid } }) => (
          <FileUploadDragDrop
            bucketName={BucketsEnum.program_contract}
            progress={tempProgressUpload}
            setUploadedFile={setOtherDoc}
            stateUploadedFile={otherDoc}
            onChange={(files: File[]) => {
              handleUploadFile(files, BucketsEnum.program_contract)
              onChange(files)
            }}
            maxFiles={10}
            informationText="IMAGE or DOCUMENTS (max 5MB each file)"
            error={invalid}
            deleteFilePath={deleteContractFiles}
          />
        )}
      />
      {errors.contract?.contract_path && (
        <p className="input-hint-text error !block">{errors.contract.contract_path?.message}</p>
      )}
    </>
  )}
</div>
```

### After: Using SwitchableUploadFieldMultiple (~30 lines)

```tsx
<SwitchableUploadFieldMultiple
  name="contract.contract_path"
  label="Documents"
  fieldKey="contract_path"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.contractDocuments}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contractDocuments: !prev.contractDocuments,
    }))
    setDocumentsPath(null)
    setOtherDoc([])
    setLinkCollections([])
  }}
  linkCollections={linkCollections}
  setLinkCollections={setLinkCollections}
  bucketName={BucketsEnum.program_contract}
  uploadProgress={tempProgressUpload}
  uploadedFiles={otherDoc}
  setUploadedFiles={setOtherDoc}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteContractFiles}
  maxFiles={10}
  informationText="IMAGE or DOCUMENTS (max 5MB each file)"
  existingFiles={programDetailData?.contract?.contract_path}
  handleDeleteExistingFile={handleDeleteFile}
  existingFileBucketCheck={BucketsEnum.program_contract}
  isEditMode={!!router?.query?.id}
  isRequired={true}
/>
```

**Code Reduction**: From ~155 lines to ~30 lines (**80% reduction**)

## Benefits

1. **Massive Code Reduction**: From ~155 lines to ~30 lines per field (80% reduction)
2. **Consistent Multiple Links UX**: All forms handle multiple links identically
3. **Built-in Link Validation**: Validates each link before adding
4. **Easier Maintenance**: Update logic in one place affects all forms
5. **Better Error Handling**: Centralized error messages and validation
6. **Type Safety**: Full TypeScript support with proper error handling
7. **Reusability**: Can be used across different pages and forms

## Common Pages to Implement

- ✅ Add Program Wizard - Already implemented
- ⬜ Add Employee Wizard
- ⬜ Add Vendor Wizard
- ⬜ Personal Hire
- ⬜ Purchase Request (PR)
- ⬜ Advance Payment Statement (APS)
- ⬜ Account Payable Receipt (APR)

## Troubleshooting

### Issue: Links are not being added

**Solution**: Check that the input value is being passed correctly and the URL pattern is valid.

### Issue: Existing files not showing in edit mode

**Solution**: Ensure `existingFileBucketCheck` prop is set correctly and the file paths don't contain the bucket name prefix.

### Issue: File upload not working

**Solution**: Verify that `handleUploadFile` function signature matches `(files: File[], bucketName: BucketsUnion) => void`.

## Support

For questions or issues:

1. Check this README
2. Review the component implementation at [/src/components/SwitchableUploadFieldMultiple.tsx](../components/SwitchableUploadFieldMultiple.tsx)
3. Look at the working example in [/src/layout/form-wizard/AddProgramWizard.tsx](../layout/form-wizard/AddProgramWizard.tsx)
4. Compare with the simpler [SwitchableUploadField](./SwitchableUploadField.README.md) component

---

**Last Updated**: 2026-02-05
**Component Version**: 1.0.0
**Maintained by**: Development Team
