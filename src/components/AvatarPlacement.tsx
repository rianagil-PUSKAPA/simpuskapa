import { cn } from '@/lib/utils'
import { BucketsUnion } from '@/types/global'
import { getOpenUrl } from '@/utils/apiRequestHelper'
import Image from 'next/image'
import { memo, useEffect, useState } from 'react'
import useSWRMutation from 'swr/mutation'

type AvatarPlacementProps = {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  image: string
  text?: string
}

const classesStyles = {
  image: {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  },
}

const AvatarPlacementComponent = ({ size = 'md', image, text }: AvatarPlacementProps) => {
  const [avatarSrc, setAvatarSrc] = useState<string>(`${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`)

  const { data: openS3UrlData, trigger: openS3UrlTrigger } = useSWRMutation(
    [
      image?.split('/') ? (image.split('/')[0] as BucketsUnion) : null,
      image?.split('/') ? image.split('/')[1] : null,
      3600 * 24,
    ],
    ([bucketName, fileName, expiry]) => getOpenUrl(bucketName, fileName, expiry),
  )

  useEffect(() => {
    if (!image) return
    openS3UrlTrigger()
  }, [image])

  useEffect(() => {
    if (openS3UrlData?.url) {
      setAvatarSrc(openS3UrlData?.url)
    }
  }, [openS3UrlData?.url])

  return (
    <Image
      className={cn(classesStyles.image[size], 'rounded-full object-cover')}
      src={avatarSrc}
      alt={avatarSrc || text}
      width={40}
      height={40}
    />
  )
}

const arePropsEqual = (prevProps: AvatarPlacementProps, nextProps: AvatarPlacementProps) => {
  if (prevProps.image === nextProps.image) {
    return true // props are equal
  }
  return false // props are not equal -> update the component
}

export const AvatarPlacement = memo(AvatarPlacementComponent, arePropsEqual)
