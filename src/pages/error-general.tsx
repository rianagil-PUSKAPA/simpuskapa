import { cn } from '@/lib/utils'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard), {
  ssr: false,
})

const ErrorGeneral = (props: any) => {
  return (
    <div
      className={cn(
        props.parameter === 'dashboard' ? 'flex items-center justify-start' : 'flex items-center justify-center',
      )}
      style={props.parameter === 'dashboard' ? { height: 'calc(100vh - 73px)' } : { height: '100vh' }}
    >
      <div className="px-10">
        <span className="mb-3 inline-block font-semibold text-primary-700">Error</span>
        <h1 className="mb-3 text-5xl font-semibold tracking-tight text-gray-900">Oops! Something happens...</h1>
        <p className="mb-6 max-w-2xl text-lg text-gray-600">
          Please Try Again Later... after 10 - 15 minutes. We're doing software update or some internal errors happened,
          please hang thight... for some minutes.
        </p>
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

const CustomErrorGeneral = () => {
  const router = useRouter()

  return (
    <>
      <NextSeo title="Error" />
      {router.asPath.split('/')[1] === 'dashboard' ? (
        <Dashboard breadcrumbLists={[{ title: 'Error', url: '' }]}>
          <ErrorGeneral parameter={router.asPath.split('/')[1]} />
        </Dashboard>
      ) : (
        <ErrorGeneral parameter={router.asPath.split('/')[1]} />
      )}
    </>
  )
}

export default CustomErrorGeneral
