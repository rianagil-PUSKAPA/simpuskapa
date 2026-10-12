import { cn } from '@/lib/utils'
import { slugify } from '@/utils/globalHelper'
import Link from 'next/link'
import { Fragment } from 'react'
import { HomeLineIcon } from './icon/HomeLineIcon'

type BreadcrumbList = {
  title: string
  url: string
}

type BreadcrumbProps = {
  type: 'arrow' | 'slash'
  activeState: 'text' | 'badge'
  breadcrumbLists: BreadcrumbList[]
  className?: string
}

export const Breadcrumb = ({ breadcrumbLists, type, activeState, className }: BreadcrumbProps) => {
  return (
    <ul className={cn('inline-flex items-center gap-8 xxs:gap-10', className)}>
      <li className={`breadcrumb-item${type === 'arrow' && ' arrow'}`}>
        <Link href="/dashboard">
          <HomeLineIcon className="h-5 w-5 stroke-gray-500" />
        </Link>
      </li>
      {breadcrumbLists?.map((breadcrumbList, index) => (
        <Fragment key={slugify(breadcrumbList.title) || index}>
          {/* Detect last item */}
          {breadcrumbLists.length - 1 === index ? (
            <li className={cn('breadcrumb-item active', activeState === 'badge' && ' badge')}>
              {breadcrumbList.title}
            </li>
          ) : (
            <li className={cn('breadcrumb-item', type === 'arrow' && 'arrow')}>
              {breadcrumbList.url ? (
                <Link href={breadcrumbList.url} className="text-xs font-medium text-gray-600 xxs:text-sm">
                  {breadcrumbList.title}
                </Link>
              ) : (
                <p className="text-xs font-medium text-gray-600 xxs:text-sm">{breadcrumbList.title}</p>
              )}
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  )
}
