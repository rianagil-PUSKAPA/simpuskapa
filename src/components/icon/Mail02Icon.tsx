import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Mail 02 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const Mail02Icon = ({ className, error }: IconProps) => {
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
        d="M14.3332 12.0001L9.90468 8.00008M6.09516 8.00008L1.66661 12.0001M1.33325 4.66675L6.77653 8.47704C7.21731 8.78559 7.4377 8.93986 7.67743 8.99962C7.88918 9.0524 8.11066 9.0524 8.32241 8.99962C8.56213 8.93986 8.78252 8.78559 9.2233 8.47704L14.6666 4.66675M4.53325 13.3334H11.4666C12.5867 13.3334 13.1467 13.3334 13.5746 13.1154C13.9509 12.9237 14.2569 12.6177 14.4486 12.2414C14.6666 11.8136 14.6666 11.2535 14.6666 10.1334V5.86675C14.6666 4.74664 14.6666 4.18659 14.4486 3.75877C14.2569 3.38244 13.9509 3.07648 13.5746 2.88473C13.1467 2.66675 12.5867 2.66675 11.4666 2.66675H4.53325C3.41315 2.66675 2.85309 2.66675 2.42527 2.88473C2.04895 3.07648 1.74299 3.38244 1.55124 3.75877C1.33325 4.18659 1.33325 4.74664 1.33325 5.86675V10.1334C1.33325 11.2535 1.33325 11.8136 1.55124 12.2414C1.74299 12.6177 2.04895 12.9237 2.42527 13.1154C2.85309 13.3334 3.41315 13.3334 4.53325 13.3334Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
