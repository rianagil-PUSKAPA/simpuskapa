import { identityApi } from '@/utils/apiRequestHelper'
import { APP_ENV, MAIN_URL_BE, MAIN_URL_FE } from '@/utils/constant'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Logo: any = dynamic(() => import('@/components/Logo').then((mod) => mod.Logo))

type LoginType = {
  email: string
  password: string
}

const Login = () => {
  const router = useRouter()

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginType>()

  const handleLogin: SubmitHandler<LoginType> = async (data) => {
    const { email, password } = data

    return new Promise<void>((resolve, reject) => {
      const loginRes = identityApi.userControllerLoginUser({
        email,
        password,
      })

      toast.promise(loginRes, {
        error: {
          render({ data }) {
            return data['response']?.data.data
          },
        },
      })

      loginRes.then((res) => {
        if (res) {
          if (res?.['code'] === 'ERR_BAD_REQUEST') {
            toast.error(res?.['response']?.data?.data)
            reject()
            return
          }
        }

        if (res.data === undefined) return

        resolve()

        const loginData = res.data.data

        router.replace(`/welcome?auth_token=${loginData.auth_token}&refresh_token=${loginData.refresh_token}`)
      })

      loginRes.catch(() => {
        reject()
      })
    })
      .then(() => {})
      .catch(() => {})
  }

  useEffect(() => {
    if (APP_ENV !== 'production') {
      setValue('email', '') // admin@puskapa.org
      setValue('password', '') //puskapa
    }
  }, [APP_ENV])

  return (
    <>
      <NextSeo title="Login" canonical={`${MAIN_URL_FE}login`} />
      <div className="relative my-8 flex h-screen items-stretch justify-center bg-white xxs:my-0">
        <div className="flex w-[40rem] max-w-full items-center justify-center px-4">
          <div className="relative w-[23rem]">
            <Logo logoOnly={false} isDark={true} className="absolute -top-20 left-0" />
            <h1 className="mb-3 text-4xl font-semibold">Hello!</h1>
            <p className="mb-8 text-gray-600">Welcome back! Please enter your details.</p>
            <form onSubmit={handleSubmit(handleLogin)}>
              <div className="mb-5">
                <label htmlFor="email" className="input-label">
                  Email
                </label>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'Email is required field',
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={value || ''}
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.email && <span className="input-hint-text error">{errors.email?.message}</span>}
                    </>
                  )}
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'Password is required field',
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="password"
                        id="password"
                        placeholder="••••••••"
                        value={value || ''}
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.password && <span className="input-hint-text error">{errors.password?.message}</span>}
                    </>
                  )}
                />
              </div>
              <div className="mb-6 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <input type="checkbox" id="remember" name="remember" value="Bike" className="input-checkbox" />
                  <label
                    htmlFor="remember"
                    className="select-none text-sm font-medium text-gray-700 hover:cursor-pointer"
                  >
                    Remember for 30 days
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm font-semibold text-primary-600">
                  Forgot Password
                </Link>
              </div>
              <Button type="submit" btnType="normal" variant="primary" className="mb-4 w-full justify-center" size="lg">
                {isSubmitting ? (
                  <div aria-label="Loading..." role="status">
                    <svg className="h-5 w-5 animate-spin-fast" viewBox="3 3 18 18">
                      <path
                        className="fill-primary-500"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
                      ></path>
                      <path
                        className="fill-white"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <>Sign in</>
                )}
              </Button>
            </form>
            <Link href={`${MAIN_URL_BE}/v1/auth/oauth/google`}>
              <Button type="button" btnType="google" size="md" className="mb-8 w-full">
                Continue with Google Workspace
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm text-gray-600">Don’t have an account? </p>
              <Link href="#" className="text-sm font-semibold text-primary-700">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden grow items-center justify-center bg-primary-100 md:flex">
          <Image
            src={`${process.env.NEXT_PUBLIC_ASSETS}/images/logo-illustration.png`}
            width={720}
            height={650}
            alt="logo-illustration.png"
            className="w-[39rem] mix-blend-multiply 2xl:w-auto"
          />
        </div>
        <span className="absolute bottom-8 left-8 hidden text-sm text-gray-600 xxs:inline-block">© PUSKAPA 2023</span>
      </div>
    </>
  )
}

export default Login
