import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { GoogleIcon } from './icon/GoogleIcon'

const buttonVariants = cva(
  'shadow-xs focus-visible:outline-none inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-300 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-4 focus-within:ring-4 focus:ring-primary-100 focus-within:ring-primary-100 disabled:bg-primary-200 disabled:hover:bg-primary-200 disabled:border-primary-200',
        secondary:
          'bg-primary-50 border focus:border-primary-50 hover:focus:border-primary-100 text-primary-700 border-primary-300 hover:text-primary-800 hover:bg-primary-100 focus:ring-4 focus-within:ring-4 focus:ring-primary-100 focus-within:ring-primary-100 disabled:bg-primary-25 disabled:hover:bg-primary-25 disabled:border-primary-25 disabled:text-primary-300 disabled:hover:text-primary-300',
        'secondary-gray':
          'bg-white border focus:border-gray-300 text-gray-700 border-gray-300 hover:text-gray-800 focus:bg-white hover:bg-gray-50 focus:ring-4 focus-within:ring-4 focus:ring-gray-100 focus-within:ring-gray-100 disabled:bg-white disabled:hover:bg-white disabled:border-gray-200 disabled:text-gray-300 disabled:hover:text-gray-300',
        error:
          'bg-error-600 text-white hover:bg-error-700 focus:ring-4 focus-within:ring-4 focus:ring-error-100 focus-within:ring-error-100 disabled:bg-error-200 disabled:hover:bg-error-200 disabled:border-error-200',
        'error-secondary':
          'bg-error-50 border focus:border-error-50 hover:focus:border-error-100 text-error-700 border-error-300 hover:text-error-800 hover:bg-error-100 focus:ring-4 focus-within:ring-4 focus:ring-error-100 focus-within:ring-error-100 disabled:bg-error-25 disabled:hover:bg-error-25 disabled:border-error-25 disabled:text-error-300 disabled:hover:text-error-300',
        google: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-sm xs:text-base',
        xl: 'text-sm xs:text-base',
        '2xl': 'text-sm xs:text-base sm:text-lg',
      },
      btnFormat: {
        rectangle: '',
        square: '',
      },
    },
    compoundVariants: [
      // Rectangle sizes
      { btnFormat: 'rectangle', size: 'xs', class: 'py-1.5 px-3 gap-2' },
      { btnFormat: 'rectangle', size: 'sm', class: 'py-2 px-3.5 gap-2' },
      { btnFormat: 'rectangle', size: 'md', class: 'py-2.5 px-4 gap-2' },
      { btnFormat: 'rectangle', size: 'lg', class: 'py-2.5 px-[18px] gap-2' },
      { btnFormat: 'rectangle', size: 'xl', class: 'py-3 px-5 gap-2' },
      { btnFormat: 'rectangle', size: '2xl', class: 'py-4 px-7 gap-3' },
      // Square sizes
      { btnFormat: 'square', size: 'xs', class: 'p-1.5' },
      { btnFormat: 'square', size: 'sm', class: 'p-2' },
      { btnFormat: 'square', size: 'md', class: 'p-2.5' },
      { btnFormat: 'square', size: 'lg', class: 'p-3' },
      { btnFormat: 'square', size: 'xl', class: 'p-3.5' },
      { btnFormat: 'square', size: '2xl', class: 'p-4' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      btnFormat: 'rectangle',
    },
  },
)

const loaderColorVariants = cva('', {
  variants: {
    variant: {
      primary: 'fill-white',
      secondary: 'fill-primary-700',
      'secondary-gray': 'fill-gray-700',
      error: 'fill-white',
      'error-secondary': 'fill-error-700',
      google: 'fill-gray-700',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})

interface ButtonBaseProps extends VariantProps<typeof buttonVariants> {
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  isLoading?: boolean
  'aria-label'?: string
  id?: string
  asChild?: boolean
}

interface NormalButtonProps extends ButtonBaseProps {
  btnType: 'normal'
  type?: 'submit' | 'button'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  form?: string
  variant?: 'primary' | 'secondary' | 'secondary-gray' | 'error' | 'error-secondary'
}

interface DivButtonProps extends ButtonBaseProps {
  btnType: 'div'
  onClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void
  variant?: 'primary' | 'secondary' | 'secondary-gray' | 'error' | 'error-secondary'
}

interface GoogleButtonProps extends ButtonBaseProps {
  btnType: 'google'
  type?: 'button'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'google'
}

type ButtonV2Props = NormalButtonProps | DivButtonProps | GoogleButtonProps

const ButtonLoader = ({
  variant = 'primary',
}: {
  variant?: 'primary' | 'secondary' | 'secondary-gray' | 'error' | 'error-secondary' | 'google'
}) => {
  return (
    <div aria-label="Loading..." role="status">
      <svg
        aria-hidden="true"
        className={cn(
          'h-5 w-5 animate-spin-fast text-gray-200 group-disabled:opacity-20',
          loaderColorVariants({ variant }),
        )}
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  )
}

export const Button = forwardRef<HTMLButtonElement | HTMLDivElement, ButtonV2Props>((props, ref) => {
  const {
    className,
    children,
    disabled = false,
    isLoading = false,
    'aria-label': ariaLabel,
    id,
    asChild = false,
    btnType,
    size = 'md',
    btnFormat = 'rectangle',
    variant,
  } = props

  // Google button
  if (btnType === 'google') {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        data-testid={id}
        id={id}
        type={props.type || 'button'}
        onClick={props.onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(buttonVariants({ variant: 'google', size, btnFormat }), isLoading && 'cursor-wait', className)}
      >
        {isLoading ? <ButtonLoader variant="google" /> : <GoogleIcon />}
        {children}
      </Comp>
    )
  }

  // Normal button
  if (btnType === 'normal') {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        data-testid={id}
        id={id}
        type={props.type || 'button'}
        onClick={props.onClick}
        disabled={isLoading || disabled}
        form={props.form}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        className={cn(buttonVariants({ variant, size, btnFormat }), isLoading && 'cursor-wait', className)}
      >
        {isLoading && <ButtonLoader variant={variant} />}
        {children}
      </Comp>
    )
  }

  // Div button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading) {
      e.preventDefault()
      props.onClick?.(e)
    }
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-testid={id}
      id={id}
      role="button"
      tabIndex={disabled || isLoading ? -1 : 0}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={ariaLabel}
      onClick={disabled || isLoading ? undefined : props.onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        buttonVariants({ variant, size, btnFormat }),
        isLoading && 'cursor-wait',
        (disabled || isLoading) && 'pointer-events-none',
        className,
      )}
    >
      {isLoading && <ButtonLoader variant={variant} />}
      {children}
    </div>
  )
})

Button.displayName = 'Button'
