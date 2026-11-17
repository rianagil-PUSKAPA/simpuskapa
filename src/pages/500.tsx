import { Dashboard } from '@/layout/Dashboard'
import { cn } from '@/lib/utils'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const ArrowLeftIcon: any = dynamic(() => import('@/components/icon/ArrowLeftIcon').then((mod) => mod.ArrowLeftIcon))
const ArrowRightIcon: any = dynamic(() => import('@/components/icon/ArrowRightIcon').then((mod) => mod.ArrowRightIcon))

export const PageError = (props: { parameter?: string; className?: string }) => {
  const router = useRouter()

  return (
    <div
      className={cn(
        props.parameter === 'dashboard' ? 'flex items-center justify-start' : 'flex items-center justify-center',
      )}
      style={props.parameter === 'dashboard' ? { height: 'calc(100vh - 73px)' } : { height: '100vh' }}
    >
      <div className="px-10">
        <span className="mb-3 inline-block font-semibold text-primary-700">500 Error</span>
        <h1 className="mb-3 text-5xl font-semibold tracking-tight text-gray-900">Internal Server Error</h1>
        <p className="text-lg text-gray-600 ">Sorry, the data you'ew looking for may no longer exist</p>
        <div className="mt-12 flex items-center gap-3 ">
          <Button type="button" btnType="normal" size="lg" variant="secondary-gray" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5 stroke-gray-700" />
            Back
          </Button>
          <Link href="/dashboard">
            <Button btnType="div" size="lg" variant="primary">
              Take me home
            </Button>
          </Link>
        </div>
        <ul className="mt-12 flex flex-col gap-6">
          <li>
            <Link href="#" className="mb-1 inline-flex items-center gap-2 font-semibold text-primary-700">
              Documentation
              <ArrowRightIcon className="h-5 w-5 stroke-primary-700" />
            </Link>
            <p className="text-gray-600">Read about SIMPUSKAPA to understand how to use and navigate it</p>
          </li>
          <li>
            <Link href="#" className="mb-1 inline-flex items-center gap-2 font-semibold text-primary-700">
              Chat to support
              <ArrowRightIcon className="h-5 w-5 stroke-primary-700" />
            </Link>
            <p className="text-gray-600">Our friendly team is here to help.</p>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function Custom500() {
  const router = useRouter()
  return (
    <>
      <NextSeo title="500 Server Error" />
      {router.asPath.split('/')[1] === 'dashboard' ? (
        <Dashboard breadcrumbLists={[{ title: '500 Server Error', url: '505' }]}>
          <PageError parameter={router.asPath.split('/')[1]} />
        </Dashboard>
      ) : (
        <PageError parameter={router.asPath.split('/')[1]} />
      )}
    </>
  )
}
