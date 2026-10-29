import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardLayoutProvider } from '@/providers/DashboardProvider'
import '@/styles/custom-component.css'
import '@/styles/globals.css'
import '@/styles/modern-dashboard.css'
import { API_URL_FE, MAIN_URL_FE } from '@/utils/constant'
import { DefaultSeo } from 'next-seo'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Sidebar: any = dynamic(() => import('@/layout/Sidebar').then((mod) => mod.Sidebar))

const plusJakartaSans = Plus_Jakarta_Sans({
  // weight: ['200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  // variable: '--my-font',
})

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  NProgress.configure({ showSpinner: false })
  useEffect(() => {
    router.events.on('routeChangeStart', () => NProgress.start())
    router.events.on('routeChangeComplete', () => NProgress.done())
    router.events.on('routeChangeError', () => NProgress.done())
  }, [router.events])

  if (!router.isReady) {
    return <></>
  }

  return (
    <>
      <style jsx global>{`
        html,
        .react-datepicker,
        .CircularProgressbar-text,
        .Toastify__toast,
        .react-tagsinput-tag,
        .react-tagsinput-input {
          font-family: ${plusJakartaSans.style.fontFamily}!important;
        }
      `}</style>
      <ToastContainer autoClose={5000} className="min-w-[20rem] max-w-md" />
      <DefaultSeo
        titleTemplate="%s | SIM PUSKAPA"
        defaultTitle="SIM PUSKAPA"
        description="Sistem Informasi Manajemen Pusat Kajian dan Advokasi Perlindungan dan Kualitas Hidup Anak Universitas Indonesia"
        canonical={MAIN_URL_FE}
        openGraph={{
          url: `${MAIN_URL_FE}`,
          title: 'SIM PUSKAPA',
          description:
            'Sistem Informasi Manajemen Pusat Kajian dan Advokasi Perlindungan dan Kualitas Hidup Anak Universitas Indonesia',
          images: [
            {
              url: `${MAIN_URL_FE}images/logo-simpuskapa.png`,
              width: 72,
              height: 72,
              alt: 'PUSKAPA Logo',
              type: 'image/jpeg',
            },
          ],
          siteName: API_URL_FE,
        }}
        dangerouslySetAllPagesToNoFollow={true}
        dangerouslySetAllPagesToNoIndex={true}
      />

      <DashboardLayoutProvider>
        {router.asPath.split('/')[1] === 'dashboard' && <Sidebar activeSidebar={pageProps.activeSidebar} />}
        <main>
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </main>
      </DashboardLayoutProvider>
    </>
  )
}
