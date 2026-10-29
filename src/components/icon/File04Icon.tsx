import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary File 04 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const File04Icon = ({ className, error }: IconProps) => {
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
        d="M11.6668 1.8913V5.33342C11.6668 5.80013 11.6668 6.03348 11.7577 6.21174C11.8376 6.36854 11.965 6.49603 12.1218 6.57592C12.3001 6.66675 12.5335 6.66675 13.0002 6.66675H16.4423M16.6668 8.3236V14.3334C16.6668 15.7335 16.6668 16.4336 16.3943 16.9684C16.1547 17.4388 15.7722 17.8212 15.3018 18.0609C14.767 18.3334 14.067 18.3334 12.6668 18.3334H7.3335C5.93336 18.3334 5.2333 18.3334 4.69852 18.0609C4.22811 17.8212 3.84566 17.4388 3.60598 16.9684C3.3335 16.4336 3.3335 15.7335 3.3335 14.3334V5.66675C3.3335 4.26662 3.3335 3.56655 3.60598 3.03177C3.84566 2.56137 4.22811 2.17892 4.69852 1.93923C5.2333 1.66675 5.93336 1.66675 7.3335 1.66675H10.01C10.6215 1.66675 10.9272 1.66675 11.2149 1.73582C11.47 1.79707 11.7139 1.89808 11.9375 2.03515C12.1898 2.18975 12.406 2.40594 12.8384 2.83832L15.4953 5.49517C15.9276 5.92755 16.1438 6.14374 16.2984 6.39604C16.4355 6.61972 16.5365 6.86358 16.5978 7.11867C16.6668 7.40639 16.6668 7.71213 16.6668 8.3236Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
