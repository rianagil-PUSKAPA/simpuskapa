import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Users Plus Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const UsersPlusIcon = ({ className, error }: IconProps) => {
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
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.3333 17.5V12.5M13.8333 15H18.8333M10.5 12.5H7.16663C5.61349 12.5 4.83692 12.5 4.22435 12.7537C3.40759 13.092 2.75867 13.741 2.42036 14.5577C2.16663 15.1703 2.16663 15.9469 2.16663 17.5M13.4166 2.7423C14.6382 3.23679 15.5 4.43443 15.5 5.83333C15.5 7.23224 14.6382 8.42988 13.4166 8.92437M11.75 5.83333C11.75 7.67428 10.2576 9.16667 8.41663 9.16667C6.57568 9.16667 5.08329 7.67428 5.08329 5.83333C5.08329 3.99238 6.57568 2.5 8.41663 2.5C10.2576 2.5 11.75 3.99238 11.75 5.83333Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
