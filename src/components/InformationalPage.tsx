import { Dashboard } from '@/layout/Dashboard'
import { cn } from '@/lib/utils'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from './Button'

type InformationalPageType = {
  perTitle?: string
  title?: string
  description?: string
  postDescription?: boolean
}

type ErrorGeneralType = {
  parameter: string
} & InformationalPageType

const ErrorGeneral = (props: ErrorGeneralType) => {
  const { parameter, perTitle, title, description, postDescription } = props
  return (
    <div
      className={cn(parameter === 'dashboard' ? 'flex items-center justify-start' : 'flex items-center justify-center')}
      style={parameter === 'dashboard' ? { height: 'calc(100vh - 73px)' } : { height: '100vh' }}
    >
      <div className="px-10">
        <span className="mb-3 inline-block font-semibold text-primary-700">{perTitle || 'Error'}</span>
        <h1 className="mb-3 text-5xl font-semibold tracking-tight text-gray-900">
          {title || 'Oops! Something happens...'}
        </h1>
        <p className={cn('max-w-2xl text-lg text-gray-600', postDescription ? 'mb-6' : '')}>
          {description ||
            "Please Try Again Later... after 10 - 15 minutes. We're doing software update or some internal errors happened, please hang thight... for some minutes."}
        </p>
        {postDescription ? (
          <p className="text-lg text-gray-600">
            SIMPUSKAPA Dev Team{' '}
            <Link
              href="devsimpuskapa@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700"
            >
              devsimpuskapa@gmail.com
            </Link>
          </p>
        ) : null}
        <div className="mt-12 flex items-center gap-3 ">
          <Link href="/dashboard">
            <Button btnType="div" size="lg" variant="primary">
              Take me home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export const InformationalPage = (props: InformationalPageType) => {
  const { perTitle, title, description, postDescription } = props
  const router = useRouter()

  return (
    <>
      <NextSeo title={title} />
      {router.asPath.split('/')[1] === 'dashboard' ? (
        <Dashboard breadcrumbLists={[{ title, url: '' }]}>
          <ErrorGeneral
            perTitle={perTitle}
            title={title}
            description={description}
            postDescription={postDescription}
            parameter={router.asPath.split('/')[1]}
          />
        </Dashboard>
      ) : (
        <ErrorGeneral
          perTitle={perTitle}
          title={title}
          description={description}
          postDescription={postDescription}
          parameter={router.asPath.split('/')[1]}
        />
      )}
    </>
  )
}
