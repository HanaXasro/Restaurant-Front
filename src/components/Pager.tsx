import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PagerProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2 border-t p-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronRight />
        پێشوو
      </Button>
      <span className="text-sm text-muted-foreground">
        پەڕەی {page} لە {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        دواتر
        <ChevronLeft />
      </Button>
    </div>
  )
}
