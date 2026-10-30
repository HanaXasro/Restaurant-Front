import { cn } from '@/lib/utils'
import { RESTAURANT_NAME } from '@/lib/config'

interface LogoProps {
  className?: string
  size?: number
  showName?: boolean
}

export function Logo({ className, size = 40, showName = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img src="/logo.svg" alt="لۆگۆ" width={size} height={size} className="shrink-0 rounded-xl" />
      {showName && <span className="font-title text-xl leading-none">{RESTAURANT_NAME}</span>}
    </div>
  )
}
