import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from './Button'

import { EyeIcon } from '@/components/icon/EyeIcon'
import { File04Icon } from '@/components/icon/File04Icon'

type Props = {
  url: string
  className?: string
}

export const LinkPreview = ({ url, className }: Props) => {
  return (
    <div
      className={cn('flex justify-between gap-4 rounded-xl border border-gray-200 p-3.5', className)}
      title="Preview file"
    >
      <div className="inline-flex w-[84%] gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
          <File04Icon className="h-4 w-4 stroke-primary-600" />
        </div>
        <div className="shrink grow-0">
          <p className="text-sm font-medium text-gray-700" style={{ wordBreak: 'break-word' }}>
            {url}
          </p>
        </div>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1.5">
        <Link href={url} target="_blank" rel="noopener noreferrer">
          <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
            <EyeIcon className="h-5 w-5 stroke-gray-500" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
