import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Link External 02 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const Link03Icon = ({ className, error }: IconProps) => {
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
      <g clipPath="url(#clip0_13975_16480)">
        <path
          d="M8.33326 10.8333C8.69113 11.3118 9.14772 11.7077 9.67205 11.9941C10.1964 12.2806 10.7762 12.4509 11.3721 12.4936C11.9681 12.5363 12.5662 12.4503 13.126 12.2415C13.6858 12.0327 14.1942 11.7059 14.6166 11.2833L17.1166 8.78334C17.8756 7.9975 18.2956 6.94499 18.2861 5.85251C18.2766 4.76002 17.8384 3.71497 17.0658 2.94243C16.2933 2.1699 15.2482 1.7317 14.1558 1.7222C13.0633 1.71271 12.0108 2.13269 11.2249 2.89168L9.79159 4.31668M11.6666 9.16668C11.3087 8.68824 10.8521 8.29236 10.3278 8.00589C9.80347 7.71943 9.22367 7.54908 8.62771 7.5064C8.03176 7.46372 7.4336 7.54971 6.8738 7.75853C6.314 7.96735 5.80566 8.29412 5.38326 8.71668L2.88326 11.2167C2.12426 12.0025 1.70429 13.055 1.71378 14.1475C1.72327 15.24 2.16148 16.2851 2.93401 17.0576C3.70655 17.8301 4.7516 18.2683 5.84408 18.2778C6.93657 18.2873 7.98908 17.8673 8.77492 17.1083L10.1999 15.6833"
          className={error ? 'stroke-error-500' : colorsParameter}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_13975_16480">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
