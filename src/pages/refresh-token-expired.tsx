import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { removeCookie } from 'typescript-cookie'

const RefreshTokenExpired = () => {
  const router = useRouter()
  const [counter, setCounter] = useState(10)

  const intervalRef = useRef(null)

  const decreaseNum = () => setCounter((prev) => prev - 1)

  useEffect(() => {
    intervalRef.current = setInterval(decreaseNum, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (counter === 0) {
      clearInterval(intervalRef.current)
      removeCookie('auth_token')
      router.reload()
    }
  }, [counter])

  return (
    <div className="flex h-screen items-center justify-center">
      <div>
        <h1 className="text-center text-2xl font-semibold">Your Refresh Token was EXPIRED</h1>
        <p>Please re-login. You will be redirect to login page in {counter} second</p>
      </div>
    </div>
  )
}

export default RefreshTokenExpired
