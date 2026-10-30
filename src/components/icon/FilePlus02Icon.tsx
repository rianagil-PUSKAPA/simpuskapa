import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary File Plus 02 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const FilePlus02Icon = ({ className, error }: IconProps) => {
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
        d="M13.3334 6.99992V4.53325C13.3334 3.41315 13.3334 2.85309 13.1154 2.42527C12.9237 2.04895 12.6177 1.74299 12.2414 1.55124C11.8136 1.33325 11.2535 1.33325 10.1334 1.33325H5.86675C4.74664 1.33325 4.18659 1.33325 3.75877 1.55124C3.38244 1.74299 3.07648 2.04895 2.88473 2.42527C2.66675 2.85309 2.66675 3.41315 2.66675 4.53325V11.4666C2.66675 12.5867 2.66675 13.1467 2.88473 13.5746C3.07648 13.9509 3.38244 14.2569 3.75877 14.4486C4.18659 14.6666 4.74664 14.6666 5.86675 14.6666H8.00008M9.33341 7.33325H5.33341M6.66675 9.99992H5.33341M10.6667 4.66659H5.33341M12.0001 13.9999V9.99992M10.0001 11.9999H14.0001"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
