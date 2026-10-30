import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateFieldProps {
  id: string
  label: string
  value: string // yyyy-MM-dd or ''
  onChange: (value: string) => void
}

export function DateField({ id, label, value, onChange }: DateFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-44"
      />
    </div>
  )
}
