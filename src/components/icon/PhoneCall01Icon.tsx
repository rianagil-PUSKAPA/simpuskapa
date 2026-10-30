import { useEffect, useState } from 'react'

interface IconProps {
  className?: string
  error?: boolean
}

/**
 *
 * @summary Phone Call 01 Icon
 * @param {string} className contain 3 elements, height, width, colors (colors mostly be start with stroke-)
 */

export const PhoneCall01Icon = ({ className, error }: IconProps) => {
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
      <g clipPath="url(#clip0_7087_21477)">
        <path
          d="M9.36636 3.99992C10.0175 4.12696 10.616 4.44542 11.0851 4.91454C11.5542 5.38366 11.8726 5.9821 11.9997 6.63325M9.36636 1.33325C10.7192 1.48354 11.9808 2.08937 12.9439 3.05126C13.907 4.01315 14.5144 5.27393 14.6664 6.62659M6.81768 9.24196C6.01663 8.44091 5.3841 7.53515 4.9201 6.56874C4.88019 6.48561 4.86024 6.44405 4.84491 6.39145C4.79042 6.20455 4.82956 5.97505 4.9429 5.81676C4.97479 5.77222 5.0129 5.73411 5.0891 5.65791C5.32217 5.42483 5.43871 5.3083 5.5149 5.19111C5.80223 4.74919 5.80223 4.17947 5.5149 3.73754C5.43871 3.62035 5.32218 3.50382 5.0891 3.27075L4.95919 3.14084C4.6049 2.78654 4.42775 2.60939 4.23749 2.51316C3.85912 2.32178 3.41228 2.32178 3.0339 2.51316C2.84365 2.60939 2.6665 2.78654 2.31221 3.14084L2.20712 3.24593C1.85403 3.59901 1.67749 3.77555 1.54266 4.01557C1.39305 4.28191 1.28547 4.69557 1.28638 5.00105C1.2872 5.27635 1.3406 5.4645 1.44741 5.84079C2.02139 7.86306 3.10437 9.7713 4.69636 11.3633C6.28835 12.9553 8.19659 14.0383 10.2189 14.6122C10.5951 14.719 10.7833 14.7724 11.0586 14.7733C11.3641 14.7742 11.7777 14.6666 12.0441 14.517C12.2841 14.3822 12.4606 14.2056 12.8137 13.8525L12.9188 13.7474C13.2731 13.3931 13.4503 13.216 13.5465 13.0257C13.7379 12.6474 13.7379 12.2005 13.5465 11.8221C13.4503 11.6319 13.2731 11.4547 12.9188 11.1005L12.7889 10.9705C12.5558 10.7375 12.4393 10.6209 12.3221 10.5447C11.8802 10.2574 11.3105 10.2574 10.8685 10.5447C10.7513 10.6209 10.6348 10.7375 10.4017 10.9705C10.3255 11.0467 10.2874 11.0849 10.2429 11.1167C10.0846 11.2301 9.85509 11.2692 9.66819 11.2147C9.6156 11.1994 9.57403 11.1795 9.49091 11.1395C8.52449 10.6755 7.61873 10.043 6.81768 9.24196Z"
          className={error ? 'stroke-error-500' : colorsParameter}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_7087_21477">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
