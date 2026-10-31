import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Users X Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const UsersXIcon = ({ className, error }: IconProps) => {
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
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.9999 10.6667L14.3333 14M14.3333 10.6667L10.9999 14M10.3333 2.19384C11.3105 2.58943 11.9999 3.54754 11.9999 4.66667C11.9999 5.78579 11.3105 6.7439 10.3333 7.13949M7.99992 10H5.33325C4.09074 10 3.46949 10 2.97943 10.203C2.32602 10.4736 1.80689 10.9928 1.53624 11.6462C1.33325 12.1362 1.33325 12.7575 1.33325 14M8.99992 4.66667C8.99992 6.13943 7.80601 7.33333 6.33325 7.33333C4.86049 7.33333 3.66659 6.13943 3.66659 4.66667C3.66659 3.19391 4.86049 2 6.33325 2C7.80601 2 8.99992 3.19391 8.99992 4.66667Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
