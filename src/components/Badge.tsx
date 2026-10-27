import { cn } from '@/lib/utils'

interface IconOnly {
  icon: 'circle'
  children: React.ReactNode
}

interface IconNone {
  icon: 'none'
  children: React.ReactNode
}

type LabelProps = {
  id?: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color:
    | 'primary'
    | 'gray'
    | 'error'
    | 'blue-light'
    | 'success'
    | 'warning'
    | 'blue'
    | 'pink'
    | 'purple'
    | 'orange'
    | 'indigo'
    | 'blue-gray'
    | string
} & (IconOnly | IconNone)

const classesStyles = {
  base: 'rounded-full leading-5 inline-flex justify-center items-center font-medium whitespace-pre',
  circle: {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-1.5 h-1.5',
  },
  size: {
    circle: {
      sm: 'py-0.5 gap-1 px-2 text-xs',
      md: 'py-0.5 pl-2 gap-1.5 pr-2.5 text-sm',
      lg: 'py-1 pl-2.5 pr-3 gap-1.5 text-sm',
    },
    none: {
      sm: 'py-0.5 gap-1 px-2 text-xs',
      md: 'py-0.5 gap-1.5 px-2.5 text-sm',
      lg: 'py-1 px-4 gap-1.5 text-sm',
    },
  },
  colorIcon: {
    success: 'bg-success-500',
    blue: 'bg-blue-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    pink: 'bg-pink-500',
    'blue-gray': 'bg-blue-gray-700',
  },
  color: {
    transparent: 'text-transparent',
    gray: 'bg-gray-100',
    primary: 'bg-primary-50 text-primary-700',
    error: 'bg-error-50 text-error-700',
    warning: 'bg-warning-50 text-warning-700',
    success: 'bg-success-50 text-success-800',
    'blue-light': 'bg-blue-light-50 text-blue-light-700',
    blue: 'bg-blue-50 text-blue-700',
    pink: 'bg-pink-50 text-pink-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    'blue-gray': 'bg-blue-gray-50 text-blue-gray-700',
  },
}

export const Badge = ({ children, className, size, color, icon, id }: LabelProps) => {
  return (
    <div
      id={id}
      data-testid={id}
      className={cn(
        [className],
        `${classesStyles.base}`,
        icon === 'circle' ? `${classesStyles.size.circle[size]}` : `${classesStyles.size.none[size]}`,
        `${classesStyles.color[color]}`,
      )}
    >
      {icon === 'circle' && (
        <span className={cn('rounded-full', classesStyles.circle[size], classesStyles.colorIcon[color])}></span>
      )}
      <p className="">{children}</p>
    </div>
  )
}
