import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Narrow Narrow Right Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const ArrowNarrowRightIcon = ({ className, error }: IconProps) => {
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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12H20M20 12L14 6M20 12L14 18"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
