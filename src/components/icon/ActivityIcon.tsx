import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Activity Icon icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const ActivityIcon = ({ className, error }: IconProps) => {
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
        d="M22 12H18L15 21L9 3L6 12H2"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
