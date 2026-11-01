import { NotificationLinkLauncher } from '@/components/NotificationLinkLauncher'
import { safeDashboardTarget } from '@/shared/app-links.cjs'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'

export default function OpenNotification({ target }: { target: string | null }) {
  return (
    <>
      <Head>
        <title>Open notification | SIM PUSKAPA</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <NotificationLinkLauncher target={target} />
      <noscript>
        <a href={target || '/dashboard'}>Continue in Browser</a>
      </noscript>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  const target = safeDashboardTarget(query.target)
  if (!target) res.statusCode = 400
  return { props: { target } }
}
