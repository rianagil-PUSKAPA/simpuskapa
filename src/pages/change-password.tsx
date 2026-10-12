import { MAIN_URL_FE } from '@/utils/constant'
import { createAxiosInstance } from '@/utils/apiAuthToken'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))

const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))

const Logo: any = dynamic(() => import('@/components/Logo').then((mod) => mod.Logo))

export default function ChangePassword() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi')
      return
    }

    if (!email.endsWith('@puskapa.org')) {
      toast.error('Gunakan email dengan domain @puskapa.org')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak sama')
      return
    }

    setLoading(true)

    try {
      const token = Cookies.get('auth_token')
      const api = createAxiosInstance()

      await api.put(
        '/v1/users/change-password',
        {
          email,
          old_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success('Password berhasil diubah')

      Cookies.remove('auth_token')
      Cookies.remove('refresh_token')

      router.replace('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.data || 'Gagal mengganti password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NextSeo title="Change Password" canonical={`${MAIN_URL_FE}change-password`} />

      <div className="mx-auto mt-20 w-full max-w-md">
        <Logo className="mb-8" />

        <h1 className="mb-2 text-4xl font-bold">Change Password</h1>

        <p className="mb-8 text-gray-500">Silakan ubah password sementara Anda.</p>

        <label className="input-label">Email @puskapa.org</label>

        <Input type="email" value={email} placeholder="nama@puskapa.org" onChange={(e) => setEmail(e.target.value)} />

        <div className="mt-4" />

        <label className="input-label">Old Password</label>

        <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />

        <div className="mt-4" />

        <label className="input-label">New Password</label>

        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

        <div className="mt-4" />

        <label className="input-label">Retype Password</label>

        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <Button loading={loading} className="mt-8 w-full" onClick={submit}>
          Simpan Password
        </Button>

        <div className="mt-5 text-center">
          <Link href="/login">Kembali ke Login</Link>
        </div>
      </div>
    </>
  )
}
