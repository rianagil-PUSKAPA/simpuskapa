import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary User Square Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const UserSquareIcon = (props: IconProps) => {
  const [widthParameter, setWidthParameter] = useState<string | null>('h-4')
  const [heightParameter, setHeightParameter] = useState<string | null>('w-4')
  const [colorsParameter, setColorsParameter] = useState<string | null>('stroke-gray-500')

  useEffect(() => {
    if (props.className) {
      const [height, width, colors] = props.className.split(' ')

      setHeightParameter(height)
      setWidthParameter(width)
      setColorsParameter(colors)
    }
  }, [props.className])

  return (
    <svg
      className={`${widthParameter} ${heightParameter}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_7087_27763)">
        <path
          d="M3.33343 18.1813C3.83558 18.3334 4.51382 18.3334 5.66675 18.3334H14.3334C15.4863 18.3334 16.1646 18.3334 16.6667 18.1813M3.33343 18.1813C3.22577 18.1487 3.12619 18.109 3.03177 18.0609C2.56137 17.8212 2.17892 17.4388 1.93923 16.9684C1.66675 16.4336 1.66675 15.7335 1.66675 14.3334V5.66675C1.66675 4.26662 1.66675 3.56655 1.93923 3.03177C2.17892 2.56137 2.56137 2.17892 3.03177 1.93923C3.56655 1.66675 4.26662 1.66675 5.66675 1.66675H14.3334C15.7335 1.66675 16.4336 1.66675 16.9684 1.93923C17.4388 2.17892 17.8212 2.56137 18.0609 3.03177C18.3334 3.56655 18.3334 4.26662 18.3334 5.66675V14.3334C18.3334 15.7335 18.3334 16.4336 18.0609 16.9684C17.8212 17.4388 17.4388 17.8212 16.9684 18.0609C16.874 18.109 16.7744 18.1487 16.6667 18.1813M3.33343 18.1813C3.33371 17.5068 3.33775 17.15 3.39746 16.8498C3.66049 15.5275 4.69415 14.4938 6.01645 14.2308C6.33844 14.1667 6.72566 14.1667 7.50008 14.1667H12.5001C13.2745 14.1667 13.6617 14.1667 13.9837 14.2308C15.306 14.4938 16.3397 15.5275 16.6027 16.8498C16.6624 17.15 16.6665 17.5068 16.6667 18.1813M13.3334 7.91675C13.3334 9.7577 11.841 11.2501 10.0001 11.2501C8.15913 11.2501 6.66675 9.7577 6.66675 7.91675C6.66675 6.0758 8.15913 4.58341 10.0001 4.58341C11.841 4.58341 13.3334 6.0758 13.3334 7.91675Z"
          className={props.error ? 'stroke-error-500' : colorsParameter}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_7087_27763">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
