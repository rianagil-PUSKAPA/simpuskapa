import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Phone Call 01 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const Pencil01Icon = ({ className, error }: IconProps) => {
  const [widthParameter, setWidthParameter] = useState<string | null>('h-4')
  const [heightParameter, setHeightParameter] = useState<string | null>('w-4')
  const [colorsParameter, setColorsParameter] = useState<string | null>('stroke-gray-400')

  useEffect(() => {
    if (className) {
      const [height, width, colors] = className.split(' ')

      setHeightParameter(height)
      setWidthParameter(width)
      setColorsParameter(colors)
    }
  }, [className])

  return (
    <svg
      className={`${widthParameter} ${heightParameter}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.08331 17.9167L6.7077 16.1381C7.00349 16.0243 7.15138 15.9674 7.28975 15.8931C7.41265 15.8272 7.52981 15.751 7.64001 15.6655C7.76408 15.5692 7.87612 15.4572 8.10021 15.2331L17.5 5.83334C18.4205 4.91286 18.4205 3.42048 17.5 2.5C16.5795 1.57953 15.0871 1.57953 14.1667 2.5L4.76688 11.8998C4.54279 12.1239 4.43075 12.2359 4.33447 12.36C4.24896 12.4702 4.17281 12.5873 4.10684 12.7102C4.03257 12.8486 3.97569 12.9965 3.86192 13.2923L2.08331 17.9167ZM2.08331 17.9167L3.79841 13.4575C3.92114 13.1384 3.98251 12.9788 4.08776 12.9057C4.17975 12.8419 4.29357 12.8177 4.40356 12.8387C4.52942 12.8628 4.6503 12.9836 4.89205 13.2254L6.77462 15.108C7.01637 15.3497 7.13725 15.4706 7.16128 15.5964C7.18229 15.7064 7.15813 15.8203 7.09427 15.9122C7.02118 16.0175 6.86164 16.0789 6.54254 16.2016L2.08331 17.9167Z"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={error ? 'stroke-error-500' : colorsParameter}
      />
    </svg>
  )
}
