import { SALES_TYPE_LABEL } from '@/lib/config'
import { SalesType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SalesTypeTabsProps {
  value: SalesType
  onChange: (type: SalesType) => void
  disabled?: boolean
  className?: string
}

const TABS = [SalesType.Restaurant, SalesType.Delivery] as const

/** The two tabs: Restaurant / Delivery. Used in Dashboard, Orders, Products and New sale. */
export function SalesTypeTabs({ value, onChange, disabled, className }: SalesTypeTabsProps) {
  return (
    <div
      role="tablist"
      className={cn('mb-4 inline-flex w-full gap-1 rounded-xl bg-muted p-1 sm:w-auto', className)}
    >
      {TABS.map((t) => {
        const active = value === t
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(t)}
            className={cn(
              'h-11 flex-1 rounded-lg px-8 text-base transition-colors sm:flex-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/70 hover:bg-background',
            )}
          >
            {SALES_TYPE_LABEL[t]}
          </button>
        )
      })}
    </div>
  )
}
