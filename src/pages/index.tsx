import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div>
        <Image
          width={64}
          height={64}
          src={`${process.env.NEXT_PUBLIC_ASSETS}/images/logo-simpuskapa.png`}
          alt="SIM Puskapa Logo"
          className="mx-auto h-16 w-16"
        />
        <h1 className="mt-2 text-center text-2xl font-bold uppercase text-gray-600">simpuskapa</h1>
      </div>
    </div>
  )
}
