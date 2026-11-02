import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

type Props = {
  html: string | undefined | null
  className?: string
}

// Strips tags to plain text without needing a DOM. Used for the server render
// and the pre-hydration paint so users see readable content (not raw markup),
// while never injecting HTML on the server where DOMPurify cannot run.
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

// Renders backend-supplied HTML (e.g. activity log messages) after sanitizing
// with DOMPurify. Use this instead of raw dangerouslySetInnerHTML to prevent XSS.
//
// DOMPurify needs a DOM, which only exists in the browser. To avoid pulling in
// jsdom (ESM-only, breaks the Next.js build) we sanitize on the client after
// mount and fall back to plain text on the server / first paint.
export function SafeHtml({ html, className }: Props) {
  const raw = html || ''
  const [clean, setClean] = useState<string | null>(null)

  useEffect(() => {
    setClean(DOMPurify.sanitize(raw))
  }, [raw])

  if (clean === null) {
    // Server render and pre-hydration: plain text, no HTML injected.
    return (
      <p className={className} suppressHydrationWarning>
        {stripTags(raw)}
      </p>
    )
  }

  return <p className={className} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: clean }}></p>
}
