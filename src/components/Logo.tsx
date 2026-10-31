import { app_version } from '@/version'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoPropsValue {
  logoOnly: boolean
  isDark?: boolean
  isResponsive?: boolean
  className?: string
}
export const Logo = ({ logoOnly, isDark = false, isResponsive = true, className }: LogoPropsValue) => {
  if (logoOnly) {
    return (
      <Image
        width={32}
        height={32}
        src={`${process.env.NEXT_PUBLIC_ASSETS}/images/logo-simpuskapa.png`}
        alt="SIM Puskapa Logo"
      />
    )
  }

  return (
    <div id="logo" className={cn([className], `inline-flex items-center gap-1`)}>
      <Image
        width={32}
        height={32}
        src={`${process.env.NEXT_PUBLIC_ASSETS}/images/logo-simpuskapa.png`}
        alt="SIM Puskapa Logo"
        className="h-12 w-12 shrink-0 xxs:h-8 xxs:w-8"
      />
      <p
        className={cn(
          'font-bold uppercase',
          isDark ? 'text-gray-600' : 'text-white',
          isResponsive && 'hidden xxs:inline-block',
        )}
      >
        simpuskapa
      </p>
      <span className="absolute -bottom-2.5 right-0 text-[10px] font-bold text-primary-700 duration-200">
        {app_version}
      </span>
    </div>
  )
}
