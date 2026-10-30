import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

interface TableStateProps {
  loading: boolean
  empty: boolean
  colSpan: number
}

/** Shows skeleton rows while loading, or an empty message. Renders nothing when there is data. */
export function TableState({ loading, empty, colSpan }: TableStateProps) {
  if (loading) {
    return (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <TableRow key={i}>
            <TableCell colSpan={colSpan}>
              <Skeleton className="h-8 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </>
    )
  }
  if (empty) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-40 text-center text-muted-foreground">
          هیچ داتایەک نەدۆزرایەوە
        </TableCell>
      </TableRow>
    )
  }
  return null
}
