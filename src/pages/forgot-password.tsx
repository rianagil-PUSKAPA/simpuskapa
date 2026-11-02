import { MAIN_URL_BE, MAIN_URL_FE } from '@/utils/constant'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'react-toastify'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Logo: any = dynamic(() => import('@/components/Logo').then((mod) => mod.Logo))

const ForgotPassword = () => {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [resetRequested, setResetRequested] = useState(false)
  const [loading, setLoading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const submitReset = async () => {
    if (!email) {
      toast.error('Email wajib diisi')
      return
    }

    if (!email.toLowerCase().endsWith('@puskapa.org')) {
      toast.error('Gunakan email @puskapa.org')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${MAIN_URL_BE}/v1/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.message || data?.data || 'Gagal membuat password sementara')
        return
      }

      setResetRequested(true)

      toast.success('Password sementara telah dikirim ke email Anda')
    } catch (error) {
      console.error('[FORGOT PASSWORD]', error)
      toast.error('Terjadi kesalahan saat meminta password sementara')
    } finally {
      setLoading(false)
    }
  }

  const completeForgotPassword = async () => {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Retype New Password tidak sama dengan New Password')
      return
    }

    if (oldPassword === newPassword) {
      toast.error('New Password harus berbeda dari Old Password')
      return
    }

    try {
      setChangingPassword(true)

      const res = await fetch(`${MAIN_URL_BE}/complete-forgot-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          old_password: oldPassword,
          new_password: newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.message || data?.data || 'Gagal mengubah password')
        return
      }

      toast.success('Password berhasil diubah. Silakan login kembali.')

      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('[COMPLETE FORGOT PASSWORD]', error)
      toast.error('Terjadi kesalahan saat mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <NextSeo title="Forgot Password" canonical={`${MAIN_URL_FE}forgot-password`} />

      <div className="relative my-8 flex h-screen items-stretch justify-center bg-white xxs:my-0">
        <div className="flex w-[40rem] max-w-full items-center justify-center px-4">
          <div className="w-full max-w-md">
            <Logo className="mb-10" />

            <h1 className="mb-2 text-5xl font-bold">Forgot Password</h1>

            <p className="mb-8 text-lg text-gray-500">
              Gunakan password sementara yang dikirim ke email Anda untuk membuat password baru.
            </p>

            <div className="space-y-6">
              <Input
                label="Email"
                placeholder="nama@puskapa.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetRequested}
              />

              {!resetRequested && (
                <Button loading={loading} className="w-full" onClick={submitReset}>
                  Reset Password
                </Button>
              )}

              {resetRequested && (
                <>
                  <div className="border-blue-200 rounded-xl border bg-blue-50 p-5">
                    <h3 className="mb-2 text-lg font-semibold text-blue-700">Password sementara telah dikirim</h3>

                    <p className="text-sm text-gray-600">Password sementara telah dikirim ke:</p>

                    <p className="mt-1 font-semibold text-gray-900">{email}</p>

                    <p className="mt-3 text-sm text-gray-600">
                      Silakan cek email Anda. Masukkan password sementara tersebut pada kolom{' '}
                      <strong>Old Password</strong> di bawah ini.
                    </p>
                  </div>

                  <Input
                    label="Old Password"
                    placeholder="Masukkan password sementara dari email"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />

                  <Input
                    label="New Password"
                    placeholder="Masukkan password baru"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Input
                    label="Retype New Password"
                    placeholder="Masukkan kembali password baru"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <p className="text-sm text-gray-500">Password baru minimal 8 karakter.</p>

                  <Button loading={changingPassword} className="w-full" onClick={completeForgotPassword}>
                    Ganti Password
                  </Button>
                </>
              )}

              <div className="text-center">
                <Link href="/login" className="font-semibold text-primary-600">
                  ← Kembali ke Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center bg-[#FBE6CF] lg:flex">
          <Image src="/images/login-illustration.png" alt="Login Illustration" width={700} height={700} priority />
        </div>
      </div>
    </>
  )
}

export default ForgotPassword
