import { cn } from '@/lib/utils'
import { AvatarPlacement } from './AvatarPlacement'

type AvatarLabelGroupProps = {
  size: 'sm' | 'md' | 'lg' | 'xl'
  statusIcon: 'online' | 'verified' | 'company' | boolean
  image: string
  text: string
  supportingText?: string
  className?: string
  light?: boolean
}

const classesStyles = {
  base: 'flex items-center',
  card: {
    sm: 'gap-2.5',
    md: 'gap-3',
    xl: 'gap-4',
  },
  image: {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  },
  indicator: {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  },
  title: {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  },
  subtitle: {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-base',
  },
}

export const AvatarLabelGroup = ({
  size = 'md',
  statusIcon = false,
  className,
  image,
  text,
  supportingText,
  light,
}: AvatarLabelGroupProps) => {
  return (
    <>
      <div className={cn(classesStyles.base, text && classesStyles.card[size], className)}>
        <div className="relative shrink-0">
          <AvatarPlacement size={size} image={image} text={text} />
          {statusIcon === 'online' && (
            <span
              className={`${classesStyles.indicator[size]} absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-success-500`}
            ></span>
          )}
        </div>
        <div className="overflow-auto">
          <p
            className={cn(
              // 'capitalize',
              classesStyles.title[size],
              supportingText
                ? light
                  ? 'font-normal text-gray-900'
                  : 'font-semibold text-gray-900'
                : 'font-normal text-gray-600',
            )}
          >
            {text}
          </p>
          <p className={`truncate font-normal text-gray-600 ${classesStyles.subtitle[size]}`}>{supportingText}</p>
        </div>
      </div>
    </>
  )
}
