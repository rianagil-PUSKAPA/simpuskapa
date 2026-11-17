import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Edit 05 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const Edit05Icon = ({ className, error }: IconProps) => {
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
      <g clipPath="url(#clip0_6124_14973)">
        <path
          d="M9.16699 3.33344H5.66699C4.26686 3.33344 3.5668 3.33344 3.03202 3.60593C2.56161 3.84561 2.17916 4.22806 1.93948 4.69847C1.66699 5.23324 1.66699 5.93331 1.66699 7.33344V14.3334C1.66699 15.7336 1.66699 16.4336 1.93948 16.9684C2.17916 17.4388 2.56161 17.8213 3.03202 18.061C3.5668 18.3334 4.26686 18.3334 5.66699 18.3334H12.667C14.0671 18.3334 14.7672 18.3334 15.302 18.061C15.7724 17.8213 16.1548 17.4388 16.3945 16.9684C16.667 16.4336 16.667 15.7336 16.667 14.3334V10.8334M6.66697 13.3334H8.06242C8.47007 13.3334 8.6739 13.3334 8.86571 13.2874C9.03577 13.2466 9.19835 13.1792 9.34747 13.0878C9.51566 12.9848 9.65979 12.8406 9.94804 12.5524L17.917 4.58344C18.6073 3.89309 18.6073 2.7738 17.917 2.08344C17.2266 1.39309 16.1073 1.39308 15.417 2.08344L7.44802 10.0524C7.15977 10.3406 7.01564 10.4848 6.91257 10.653C6.82119 10.8021 6.75385 10.9647 6.71302 11.1347C6.66697 11.3265 6.66697 11.5304 6.66697 11.938V13.3334Z"
          className={error ? 'stroke-error-500' : colorsParameter}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6124_14973">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
