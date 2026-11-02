import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'focus-visible:outline-none font-normal inline-flex items-center rounded-lg shadow-xs disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'primary bg-primary-600 text-white hover:bg-primary-700 focus:ring-4 focus-within:ring-4 focus:ring-primary-100 focus-within:ring-primary-100 disabled:bg-primary-200 disabled:hover:bg-primary-200 disabled:border-primary-200',
        secondary:
          'secondary bg-primary-50 border focus:border-primary-50 hover:focus:border-primary-100 text-primary-700 border-primary-300 hover:text-primary-800 hover:bg-primary-100 focus:ring-4 focus-within:ring-4 focus:ring-primary-100 focus-within:ring-primary-100 disabled:bg-primary-25 disabled:hover:bg-primary-25 disabled:border-primary-25 disabled:text-primary-300 disabled:hover:text-primary-300',
        'secondary-gray':
          'should-primary border focus:border-primary-300 border-gray-300 focus:bg-white focus:ring-4 focus-within:ring-4 focus:ring-primary-100 focus-within:ring-primary-100 disabled:bg-white disabled:hover:bg-white disabled:border-gray-200 disabled:text-gray-300',
        error:
          'error border border-error-300 focus:border-error-300 focus:ring-error-100 focus:ring-4 focus-within:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
      },
      size: {
        default: 'py-2.5 px-4 text-sm gap-2',
        sm: 'py-2 px-3.5 text-sm gap-2',
        lg: 'py-2.5 px-[18px] text-sm xs:text-base gap-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
