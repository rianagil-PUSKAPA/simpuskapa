// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_APP_ENV != 'development') {
  Sentry.init({
    dsn: 'https://7775c2b2ddec4c158e2c4302cc5a7cea@o4506082851028992.ingest.sentry.io/4506082877636608',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    environment: process.env.NEXT_PUBLIC_APP_ENV,
  })
}
