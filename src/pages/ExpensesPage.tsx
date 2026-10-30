import { useState, type FormEvent } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoneyInput } from '@/components/MoneyInput'
import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { SearchInput } from '@/components/SearchInput'
import { TableState } from '@/components/TableState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { expensesApi, getErrorMessage } from '@/lib/api'
import { usePagedData } from '@/lib/hooks'
import type { ExpenseDto } from '@/lib/types'
import { formatDateTime, formatIQD } from '@/lib/utils'

export default function ExpensesPage() {
  const { data, loading, search, setSearch, page, setPage, reload } = usePagedData<ExpenseDto>(
    expensesApi.list,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseDto | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<ExpenseDto | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openForm(x?: ExpenseDto) {
    setEditing(x ?? null)
    setName(x?.name ?? '')
    setAmount(x ? String(Math.round(x.amount)) : '')
    setDescription(x?.description ?? '')
    setFormOpen(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const v = Number(amount)
    if (!n) return toast.error('ناوی خەرجی بنووسە')
    if (!v || v <= 0) return toast.error('بڕێکی دروست بنووسە')

    const body = { name: n, amount: v, description: description.trim() || undefined }
    setSaving(true)
    try {
      if (editing) await expensesApi.update(editing.id, body)
      else await expensesApi.create(body)
      toast.success('بە سەرکەوتوویی پاشەکەوتکرا')
      setFormOpen(false)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await expensesApi.remove(toDelete.id)
      toast.success('خەرجییەکە سڕایەوە')
      setToDelete(null)
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const items = data?.items ?? []

  return (
    <>
      <PageHeader
        title="خەرجییەکان"
        description="تۆمارکردنی خەرجییەکانی چێشتخانە"
        actions={
          <Button size="lg" onClick={() => openForm()}>
            <Plus />
            خەرجی نوێ
          </Button>
        }
      />

      <Card>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="گەڕان بە ناوی خەرجی..." />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ناو</TableHead>
              <TableHead>بڕ</TableHead>
              <TableHead>وەسف</TableHead>
              <TableHead>بەروار</TableHead>
              <TableHead className="w-28">کردار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState loading={loading} empty={!loading && items.length === 0} colSpan={5} />
            {!loading &&
              items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-base">{x.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatIQD(x.amount)}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {x.description || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(x.createAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openForm(x)} aria-label="دەستکاریکردن">
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToDelete(x)}
                        aria-label="سڕینەوە"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Pager page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'دەستکاریکردنی خەرجی' : 'خەرجی نوێ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="x-name">ناوی خەرجی</Label>
              <Input id="x-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-amount">بڕی پارە</Label>
              <MoneyInput id="x-amount" value={amount} onChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-desc">وەسف (ئارەزوومەندانە)</Label>
              <Textarea id="x-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                پاشەکەوتکردن
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                پاشگەزبوونەوە
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="سڕینەوەی خەرجی"
        description={`ئایا دڵنیایت لە سڕینەوەی «${toDelete?.name ?? ''}»؟`}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  )
}
