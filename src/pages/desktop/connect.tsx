import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import { validateHandshake } from '../../../desktop/handoff.cjs'

type Handshake = { port: number; state: string; publicKey: string }
type Props = { handshake: Handshake | null }

export default function DesktopConnect({ handshake }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/desktop/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(handshake),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to connect. Please try again.')
      // Defense in depth: the server may return only the loopback port from this request.
      const callback = new URL(result.callbackUrl)
      if (
        callback.origin !== `http://127.0.0.1:${handshake.port}` ||
        callback.pathname !== '/callback' ||
        callback.searchParams.get('state') !== handshake.state
      ) {
        throw new Error('Invalid desktop connection. Start again from the application.')
      }
      window.location.assign(callback.href)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to connect. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <Head>
        <title>Connect Desktop | SIM PUSKAPA</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-primary-25 px-6 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
          <Image src="/images/logo-simpuskapa.png" width={80} height={80} alt="SIM PUSKAPA" />
          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-primary-600">SIM PUSKAPA Desktop</p>
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">Connect your desktop application</h1>
          {handshake ? (
            <>
              <p className="mb-6 leading-relaxed text-gray-600">
                Continue only if you started sign-in from SIM PUSKAPA Desktop on this computer. Connecting gives that
                application access to your SIM PUSKAPA account.
              </p>
              <p className="mb-3 text-sm text-gray-700">
                1. Sign in to SIM PUSKAPA in the new tab, using Google Workspace or your email and password.
              </p>
              <a
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 inline-flex rounded-lg border border-primary-200 px-5 py-3 font-semibold text-primary-700"
              >
                Sign in to SIM PUSKAPA
              </a>
              <p className="mb-3 text-sm text-gray-700">2. Return to this tab and connect your desktop application.</p>
              <button
                type="button"
                onClick={connect}
                disabled={busy}
                className="w-full rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {busy ? 'Connecting…' : 'Connect to Desktop'}
              </button>
              {error && (
                <p role="alert" className="mt-4 text-sm text-error-600">
                  {error}
                </p>
              )}
              <p className="mt-6 text-xs leading-relaxed text-gray-500">
                This connection expires after five minutes. Keep the desktop application open.
              </p>
            </>
          ) : (
            <p className="leading-relaxed text-gray-600">
              This connection is invalid. Start sign-in again from SIM PUSKAPA Desktop.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  try {
    const handshake = validateHandshake({ port: query.port, state: query.state, publicKey: query.publicKey })
    return { props: { handshake } }
  } catch {
    res.statusCode = 400
    return { props: { handshake: null } }
  }
}
