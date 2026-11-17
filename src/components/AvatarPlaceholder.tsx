import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

type AvatarPlaceholderProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  name: string
}

const classesStyles = {
  base: 'inline-flex items-center justify-center bg-gray-100 font-medium text-gray-600 rounded-full',
  image: {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  },
  text: {
    xs: 'text-sm',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-base',
    xl: 'text-lg',
  },
}

export const AvatarPlaceholder = ({ size = 'md', className, name }: AvatarPlaceholderProps) => {
  const [stringAvatar, setStringAvatar] = useState('')

  useEffect(() => {
    const matches = name?.match(/\b(\w)/g)
    const filteringLengthText = matches?.length >= 2 ? [matches[0], matches.pop()] : matches
    const acronym = filteringLengthText?.join('')
    setStringAvatar(acronym)
  }, [name])

  if (!stringAvatar) {
    return <></>
  }

  return (
    <>
      <div className={cn(classesStyles.base, classesStyles.image[size], classesStyles.text[size], [className])}>
        {stringAvatar}
      </div>
    </>
  )
}
