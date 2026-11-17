import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Alarm Clock Off icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const AlarmClockOffIcon = ({ className, error }: IconProps) => {
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
        d="M8.75033 4.28487C9.15946 4.20677 9.57783 4.16667 10.0003 4.16667C11.7684 4.16667 13.4641 4.86905 14.7144 6.11929C15.9646 7.36953 16.667 9.06522 16.667 10.8333C16.667 11.2558 16.6269 11.6742 16.5488 12.0833M15.1133 15.1115C14.9873 15.262 14.8543 15.4075 14.7144 15.5474C13.4641 16.7976 11.7684 17.5 10.0003 17.5C8.23222 17.5 6.53652 16.7976 5.28628 15.5474C4.03604 14.2971 3.33366 12.6014 3.33366 10.8333C3.33366 9.06522 4.03604 7.36953 5.28628 6.11929C5.42489 5.98068 5.56897 5.84881 5.71802 5.72388M3.33366 3.33333L1.66699 5M18.3337 5L15.8337 2.5M5.00033 15.8333L3.33366 17.5M17.5003 17.5L2.50033 2.5"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
