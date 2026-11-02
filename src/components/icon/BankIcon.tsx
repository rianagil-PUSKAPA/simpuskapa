import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Bank Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const BankIcon = ({ className, error }: IconProps) => {
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
        d="M4.16667 7.49994V14.1666M7.91667 7.49994V14.1666M12.0833 7.49994V14.1666M15.8333 7.49994V14.1666M2.5 15.4999L2.5 16.1666C2.5 16.6333 2.5 16.8667 2.59083 17.0449C2.67072 17.2017 2.79821 17.3292 2.95501 17.4091C3.13327 17.4999 3.36662 17.4999 3.83333 17.4999H16.1667C16.6334 17.4999 16.8667 17.4999 17.045 17.4091C17.2018 17.3292 17.3293 17.2017 17.4092 17.0449C17.5 16.8667 17.5 16.6333 17.5 16.1666V15.4999C17.5 15.0332 17.5 14.7999 17.4092 14.6216C17.3293 14.4648 17.2018 14.3373 17.045 14.2574C16.8667 14.1666 16.6334 14.1666 16.1667 14.1666H3.83333C3.36662 14.1666 3.13327 14.1666 2.95501 14.2574C2.79821 14.3373 2.67072 14.4648 2.59083 14.6216C2.5 14.7999 2.5 15.0332 2.5 15.4999ZM9.71076 2.56421L3.54409 3.93458C3.17154 4.01737 2.98527 4.05876 2.84622 4.15894C2.72358 4.2473 2.62727 4.36735 2.56762 4.50624C2.5 4.66371 2.5 4.85453 2.5 5.23616L2.5 6.1666C2.5 6.63331 2.5 6.86667 2.59083 7.04493C2.67072 7.20173 2.79821 7.32921 2.95501 7.40911C3.13327 7.49994 3.36662 7.49994 3.83333 7.49994H16.1667C16.6334 7.49994 16.8667 7.49994 17.045 7.40911C17.2018 7.32921 17.3293 7.20173 17.4092 7.04493C17.5 6.86667 17.5 6.63331 17.5 6.1666V5.23616C17.5 4.85453 17.5 4.66371 17.4324 4.50624C17.3727 4.36735 17.2764 4.2473 17.1538 4.15894C17.0147 4.05877 16.8285 4.01737 16.4559 3.93458L10.2892 2.56421C10.1813 2.54022 10.1273 2.52823 10.0728 2.52345C10.0244 2.5192 9.97564 2.5192 9.9272 2.52345C9.87267 2.52823 9.8187 2.54022 9.71076 2.56421Z"
        className={error ? 'stroke-error-500' : colorsParameter}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
