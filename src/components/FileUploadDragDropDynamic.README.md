# FileUploadDragDropDynamic Component

A reusable React component designed for dynamic or loop-based scenarios that provides a switchable interface between file upload and external link input modes. This is the specialized variant of `SwitchableUploadField` optimized for use in dynamic field arrays or repeated fields.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Differences from SwitchableUploadField](#differences-from-switchableuploadfield)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Complete Implementation Guide](#complete-implementation-guide)
- [Migration Guide](#migration-guide)
- [Examples](#examples)

## Overview

The `FileUploadDragDropDynamic` component is purpose-built for scenarios where:

- You have dynamic attachment fields (e.g., multiple document types in a form)
- You're working with field arrays that can grow/shrink
- You need per-field toggle states for link/file modes
- You're dealing with attachment collections that have unique keys

While functionally similar to `SwitchableUploadField`, this component has been optimized for integration with dynamic data structures and existing attachment systems.

## Features

- **Type-safe**: Full TypeScript support with generics for form type safety
- **React Hook Form integration**: Works seamlessly with `react-hook-form`
- **Dynamic field support**: Designed for use in loops and dynamic scenarios
- **Flexible validation**: Supports both required and optional fields
- **Edit mode aware**: Handles validation differently for edit vs create modes
- **Existing file preview**: Shows and allows deletion of previously uploaded files
- **Customizable**: All labels, placeholders, and hint texts can be customized
- **Consistent UX**: Ensures the same user experience across all switchable upload fields
- **Automatic error handling**: Built-in error message display

## Differences from SwitchableUploadField

| Feature              | SwitchableUploadField | FileUploadDragDropDynamic             |
| -------------------- | --------------------- | ------------------------------------- |
| **Primary Use Case** | Standard form fields  | Dynamic/loop-based fields             |
| **UI Toggle**        | Button with icon      | Same (after refactor)                 |
| **Props Interface**  | Standard field props  | Optimized for dynamic scenarios       |
| **Documentation**    | General purpose       | Loop/array-focused examples           |
| **When to Use**      | Single, static fields | Fields inside loops or dynamic arrays |

## Installation

The component is located at:

```
/src/components/FileUploadDragDropDynamic.tsx
```

Import it in your component:

```typescript
import { FileUploadDragDropDynamic } from '@/components/FileUploadDragDropDynamic'
```

## Basic Usage

```tsx
<FileUploadDragDropDynamic
  name="additional_attachments.attendees"
  label="Attendees List"
  fieldKey="attendees_list"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.attendeesList}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      attendeesList: !prev.attendeesList,
    }))
  }}
  bucketName={BucketsEnum.pr_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={attendeesFiles}
  setUploadedFiles={setAttendeesFiles}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteAttendeesFile}
  existingFilePath={existingAttachments?.['attendees_list']?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistingAttachments((prev) => ({
      ...prev,
      attendees_list: null,
    }))
  }}
  isEditMode={router.query.edit === 'true'}
  isRequired={true}
/>
```

## Props Reference

### Required Props

| Prop                       | Type                  | Description                                                                        |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `name`                     | `Path<T>`             | React Hook Form field name (e.g., "additional_attachments.attendees")              |
| `label`                    | `string`              | Display label for the field                                                        |
| `fieldKey`                 | `string`              | Internal key for the field (e.g., "attendees_list")                                |
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
// Toggle state for each dynamic attachment type
const [switchTogglableButton, setSwitchTogglableButton] = useState<{
  attendeesList: boolean
  budgetBreakdown: boolean
  supportingDocs: boolean
}>({
  attendeesList: false,
  budgetBreakdown: false,
  supportingDocs: false,
})

// File upload state for each type
const [attendeesFiles, setAttendeesFiles] = useState([])
const [budgetFiles, setBudgetFiles] = useState([])
const [supportingFiles, setSupportingFiles] = useState([])

// Progress tracking
const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})

// Existing attachments (for edit mode)
const [existingAttachments, setExistingAttachments] = useState<{
  attendees_list?: string[] | null
  budget_breakdown?: string[] | null
  supporting_docs?: string[] | null
}>({})
```

### Step 2: Create Upload Handler

```typescript
const handleUploadFile = async (
  fileObjects: File[],
  fileUploadType: 'attendees_list' | 'budget_breakdown' | 'supporting_docs',
) => {
  const bucketName = BucketsEnum.pr_doc
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
    setExistingAttachments((prev) => ({
      ...prev,
      [fileUploadType]: filePath,
    }))
  })
}
```

### Step 3: Create Delete Handlers

```typescript
const deleteAttendeesFile = async (filename: string) => {
  setExistingAttachments((prev) => ({
    ...prev,
    attendees_list: prev.attendees_list?.filter((path) => !path.includes(filename)),
  }))
  setAttendeesFiles((prev) => prev.filter((item) => item.path !== filename))
}

// Repeat for other file types...
```

### Step 4: Handle Form Submission

```typescript
const submitForm: SubmitHandler<FormType> = async (formInput) => {
  const additionalAttachments = [
    {
      key: 'attendees_list',
      file_path: switchTogglableButton.attendeesList
        ? [formInput.additional_attachments?.attendees] // Link mode
        : existingAttachments.attendees_list || [], // File mode
    },
    {
      key: 'budget_breakdown',
      file_path: switchTogglableButton.budgetBreakdown
        ? [formInput.additional_attachments?.budget]
        : existingAttachments.budget_breakdown || [],
    },
    // Add more as needed...
  ]

  const submitValues = {
    ...formInput,
    additional_attachments: additionalAttachments,
  }

  // Submit the form...
}
```

### Step 5: Handle Edit Mode Loading

```typescript
useEffect(() => {
  const loadExistingAttachments = async () => {
    const result = await getFormData()

    if (result.additional_attachments) {
      result.additional_attachments.forEach((attachment: PRAttachment) => {
        if (attachment.key === 'attendees_list') {
          if (isValidUrl(attachment.file_path[0])) {
            // It's a link - enable link mode
            setSwitchTogglableButton((prev) => ({
              ...prev,
              attendeesList: true,
            }))
            setValue('additional_attachments.attendees', attachment.file_path[0])
          } else {
            // It's a file path - store in existing attachments
            setExistingAttachments((prev) => ({
              ...prev,
              attendees_list: attachment.file_path,
            }))
          }
        }
        // Repeat for other attachment types...
      })
    }
  }

  if (router.query.edit) {
    loadExistingAttachments()
  }
}, [router.query.edit])
```

## Migration Guide

### Before: Old FileUploadDragDropDynamic Pattern

```tsx
<FileUploadDragDropDynamic
  existingAttachments={existingPRAttachments}
  fileAttachments={attendeesFiles}
  onChange={(files) => {
    handleUploadFile(files, 'attendees_list')
  }}
  onChangeText={(value) => {
    // Handle text input
  }}
  maxFiles={1}
  informationText="IMAGE or DOCUMENTS (max. 5MB)"
  allowedDataType={['pdf', 'doc', 'images']}
  maxSize={5242880}
  progress={tempProgressUpload}
  bucketName={BucketsEnum.pr_doc}
  attachmentName="Attendees List"
/>
```

### After: Refactored Pattern

```tsx
<FileUploadDragDropDynamic
  name="additional_attachments.attendees"
  label="Attendees List"
  fieldKey="attendees_list"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.attendeesList}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      attendeesList: !prev.attendeesList,
    }))
  }}
  bucketName={BucketsEnum.pr_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={attendeesFiles}
  setUploadedFiles={setAttendeesFiles}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteAttendeesFile}
  existingFilePath={existingAttachments?.attendees_list?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistingAttachments((prev) => ({
      ...prev,
      attendees_list: null,
    }))
  }}
  isEditMode={router.query.edit === 'true'}
  isRequired={true}
/>
```

## Examples

### Example 1: Required Dynamic Field

```tsx
<FileUploadDragDropDynamic
  name="additional_attachments.attendees"
  label="Attendees List"
  fieldKey="attendees_list"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.attendeesList}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      attendeesList: !prev.attendeesList,
    }))
  }}
  bucketName={BucketsEnum.pr_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={attendeesFiles}
  setUploadedFiles={setAttendeesFiles}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteAttendeesFile}
  existingFilePath={existingAttachments?.attendees_list?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistingAttachments((prev) => ({
      ...prev,
      attendees_list: null,
    }))
  }}
  isEditMode={router.query.edit === 'true'}
  isRequired={true}
/>
```

### Example 2: Optional Dynamic Field

```tsx
<FileUploadDragDropDynamic
  name="additional_attachments.supporting"
  label="Supporting Documents (Optional)"
  fieldKey="supporting_docs"
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
  bucketName={BucketsEnum.pr_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={supportingFiles}
  setUploadedFiles={setSupportingFiles}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteSupportingFile}
  existingFilePath={existingAttachments?.supporting_docs?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistingAttachments((prev) => ({
      ...prev,
      supporting_docs: null,
    }))
  }}
  isEditMode={router.query.edit === 'true'}
  isRequired={false} // Optional field
/>
```

### Example 3: Multiple Files Upload

```tsx
<FileUploadDragDropDynamic
  name="additional_attachments.images"
  label="Event Images"
  fieldKey="event_images"
  control={control}
  errors={errors}
  setValue={setValue}
  isLinkMode={switchTogglableButton.eventImages}
  onToggle={() => {
    setSwitchTogglableButton((prev) => ({
      ...prev,
      eventImages: !prev.eventImages,
    }))
  }}
  bucketName={BucketsEnum.event_doc}
  uploadProgress={tempProgressUpload}
  uploadedFiles={eventImageFiles}
  setUploadedFiles={setEventImageFiles}
  handleUploadFile={handleUploadFile}
  deleteFilePath={deleteEventImageFile}
  maxFiles={10} // Allow up to 10 images
  informationText="IMAGES only (max 5MB each)"
  existingFilePath={existingAttachments?.event_images?.[0] || null}
  handleDeleteExistingFile={() => {
    setExistingAttachments((prev) => ({
      ...prev,
      event_images: null,
    }))
  }}
  isEditMode={router.query.edit === 'true'}
  isRequired={true}
/>
```

### Example 4: Inside a Loop (Dynamic Attachment Collection)

```tsx
{
  attachmentTypes.map((attachmentType) => (
    <FileUploadDragDropDynamic
      key={attachmentType.key}
      name={`additional_attachments.${attachmentType.key}`}
      label={attachmentType.label}
      fieldKey={attachmentType.key}
      control={control}
      errors={errors}
      setValue={setValue}
      isLinkMode={switchTogglableButton[attachmentType.key] || false}
      onToggle={() => {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          [attachmentType.key]: !prev[attachmentType.key],
        }))
      }}
      bucketName={BucketsEnum.pr_doc}
      uploadProgress={tempProgressUpload}
      uploadedFiles={uploadedFilesByType[attachmentType.key] || []}
      setUploadedFiles={(files) => {
        setUploadedFilesByType((prev) => ({
          ...prev,
          [attachmentType.key]: files,
        }))
      }}
      handleUploadFile={handleUploadFile}
      deleteFilePath={(filename) => deleteFileByType(attachmentType.key, filename)}
      existingFilePath={existingAttachments?.[attachmentType.key]?.[0] || null}
      handleDeleteExistingFile={() => {
        setExistingAttachments((prev) => ({
          ...prev,
          [attachmentType.key]: null,
        }))
      }}
      isEditMode={router.query.edit === 'true'}
      isRequired={attachmentType.required}
    />
  ))
}
```

## Benefits

1. **Consistent with SwitchableUploadField**: Same UX and patterns across all upload components
2. **Optimized for Dynamic Scenarios**: Better suited for loops and dynamic field arrays
3. **Better Type Safety**: Full TypeScript support with generics
4. **Improved Validation**: Consistent validation rules and error handling
5. **Cleaner Code**: Uses modern Button component instead of Switch for mode toggle
6. **Easier Maintenance**: Changes in one component pattern benefit both variants
7. **Better Documentation**: Clear guidance on when to use each variant

## When to Use Which Component

### Use `SwitchableUploadField` when:

- You have static, predefined form fields
- Each field is standalone and not generated dynamically
- Simple, straightforward implementation

### Use `FileUploadDragDropDynamic` when:

- Working with dynamic attachment collections
- Fields are generated in loops or from arrays
- Complex attachment management with unique keys
- Integration with existing attachment systems (e.g., PRAttachment)

## Implementation Checklist

When implementing on a new page:

- [ ] Import the `FileUploadDragDropDynamic` component
- [ ] Set up toggle state for each dynamic attachment type
- [ ] Set up file upload state for each type
- [ ] Create or reuse upload handler function
- [ ] Create or reuse delete handler functions (one per type)
- [ ] Set up existing attachments state structure
- [ ] Handle form submission with link/file logic
- [ ] Handle edit mode data loading with URL detection
- [ ] Replace old code blocks with component
- [ ] Test both link and file upload modes
- [ ] Test required/optional validation
- [ ] Test edit mode functionality
- [ ] Test dynamic/loop scenarios

## Common Use Cases

- Purchase Request (PR) additional attachments
- Travel Request supporting documents
- Project documentation collections
- Event-related file uploads
- Dynamic form builders with file uploads

## Support

For questions or issues:

1. Check this README
2. Review the component implementation at [FileUploadDragDropDynamic.tsx](./FileUploadDragDropDynamic.tsx)
3. Compare with [SwitchableUploadField.tsx](./SwitchableUploadField.tsx) for pattern consistency
4. Look at example implementations in PR and Travel Request forms

---

**Last Updated**: 2026-02-05
**Component Version**: 2.0.0 (Refactored)
**Maintained by**: Development Team
