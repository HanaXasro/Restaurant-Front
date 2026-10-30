import { Input } from '@/components/ui/input'
import { formatNumber, onlyDigits } from '@/lib/utils'

interface MoneyInputProps {
  /** Raw digits only, for example "1500" */
  value: string
  onChange: (digits: string) => void
  placeholder?: string
  id?: string
}

/** Price input: shows 1,500 while typing, always stores plain digits. */
export function MoneyInput({ value, onChange, placeholder = '0', id }: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="numeric"
        dir="ltr"
        className="pe-3 text-end"
        placeholder={placeholder}
        value={value ? formatNumber(Number(value)) : ''}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
      />
      <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        د.ع
      </span>
    </div>
  )
}
