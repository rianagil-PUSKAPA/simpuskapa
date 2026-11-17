import { EyeIcon } from '@/components/icon/EyeIcon'
import { File04Icon } from '@/components/icon/File04Icon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { cn } from '@/lib/utils'
import { BucketsUnion } from '@/types/global'
import { getOpenUrl } from '@/utils/apiRequestHelper'
import { isValidUrl } from '@/utils/globalHelper'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Link03Icon } from './icon/Link03Icon'

type Props = {
  fileName: string
  className?: string
  showDeleteButton?: boolean
  handleDeleteFile?: () => void
}

export const FilePreview = ({ fileName, className, showDeleteButton = false, handleDeleteFile }: Props) => {
  const [fileSize, setFileSize] = useState<string>('')
  const [link, setLink] = useState<string>('')
  const [isLink, setIsLink] = useState(false)

  useEffect(() => {
    if (fileName) {
      if (!isValidUrl(fileName)) {
        const bucketName = fileName.split('/')[0]
        const realFileName = fileName.split('/')[1]

        getOpenUrl(bucketName as BucketsUnion, realFileName, 3600 * 24, true)
          .then((presignUrl) => {
            setLink(presignUrl.url)
            setFileSize(presignUrl.size)
          })
          .catch((err) => console.error('File preview error', err))
      } else {
        setIsLink(true)
        setLink(fileName)
      }
    }
  }, [fileName])

  if (!fileName) {
    return <></>
  }

  return (
    <div
      className={cn('flex justify-between gap-4 rounded-xl border border-gray-200 p-3.5', className)}
      title="Preview file"
    >
      <div className={cn('inline-flex w-[84%] gap-3.5', isLink && 'items-center')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
          {isLink ? (
            <Link03Icon className="h-4 w-4 stroke-primary-600" />
          ) : (
            <File04Icon className="h-4 w-4 stroke-primary-600" />
          )}
        </div>
        <div className="shrink grow-0">
          <p className="text-sm font-medium text-gray-700" style={{ overflowWrap: 'anywhere' }}>
            {isLink ? fileName : fileName.split('/')[1]}
          </p>
          {isLink ? null : <span className="inline-block text-sm text-gray-600">{fileSize}</span>}
        </div>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1.5">
        <Link href={link} target="_blank" rel="noopener noreferrer">
          <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
            <EyeIcon className="h-5 w-5 stroke-gray-500" />
          </Button>
        </Link>
        {showDeleteButton ? (
          <Button
            type="button"
            btnType="normal"
            size="sm"
            variant="error-secondary"
            btnFormat="square"
            onClick={handleDeleteFile}
          >
            <Trash01Icon className="h-5 w-5 stroke-error-700" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
