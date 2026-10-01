import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Coin Swap 01
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const CoinsSwap01Icon = ({ className, error }: IconProps) => {
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
        d="M5.00001 4.99984L6.66667 3.33317M6.66667 3.33317L5.00001 1.6665M6.66667 3.33317H5.00001C3.15906 3.33317 1.66667 4.82555 1.66667 6.6665M15 14.9998L13.3333 16.6665M13.3333 16.6665L15 18.3332M13.3333 16.6665H15C16.841 16.6665 18.3333 15.1741 18.3333 13.3332M11.181 11.1808C11.8329 11.4922 12.5627 11.6665 13.3333 11.6665C16.0948 11.6665 18.3333 9.42793 18.3333 6.6665C18.3333 3.90508 16.0948 1.6665 13.3333 1.6665C10.5719 1.6665 8.33334 3.90508 8.33334 6.6665C8.33334 7.4371 8.50766 8.16698 8.81903 8.81886M11.6667 13.3332C11.6667 16.0946 9.4281 18.3332 6.66667 18.3332C3.90525 18.3332 1.66667 16.0946 1.66667 13.3332C1.66667 10.5717 3.90525 8.33317 6.66667 8.33317C9.4281 8.33317 11.6667 10.5717 11.6667 13.3332Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
