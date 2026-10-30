import { useState, useEffect } from 'react'
import { getOpenUrl } from '@/utils/apiRequestHelper'
import { BucketsUnion } from '@/types/global'
import { AVATAR_PLACEHOLDER, AVATAR_URL_EXPIRY } from '../constants'

/**
 * Custom hook to fetch and manage avatar URLs from S3
 * @param photoPath - Path to the photo in S3 (format: "bucket/filename")
 * @returns The signed URL for the avatar or placeholder
 */
export const useAvatarFetcher = (photoPath?: string | null): string => {
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PLACEHOLDER)

  useEffect(() => {
    if (!photoPath) {
      setAvatarUrl(AVATAR_PLACEHOLDER)
      return
    }

    const fetchAvatar = async () => {
      try {
        const [bucket, fileName] = photoPath.split('/')
        if (!bucket || !fileName) {
          console.warn('Invalid photo path format:', photoPath)
          return
        }

        const file = await getOpenUrl(bucket as BucketsUnion, fileName, AVATAR_URL_EXPIRY)

        if (file?.url) {
          setAvatarUrl(file.url)
        }
      } catch (err) {
        console.error('Failed to fetch avatar:', err)
        setAvatarUrl(AVATAR_PLACEHOLDER)
      }
    }

    fetchAvatar()
  }, [photoPath])

  return avatarUrl
}
