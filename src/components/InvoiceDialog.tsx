import { useMemo, useState } from 'react'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import { Download, Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buildInvoiceDocument, type PaperSize } from '@/pdf/InvoiceDocument'
import type { InvoiceData } from '@/lib/types'

interface InvoiceDialogProps {
  data: InvoiceData | null
  onClose: () => void
}

const PAPER_KEY = 'restaurant_paper_size'

function loadPaper(): PaperSize {
  return localStorage.getItem(PAPER_KEY) === '58' ? '58' : '80'
}

export default function InvoiceDialog({ data, onClose }: InvoiceDialogProps) {
  const [paper, setPaper] = useState<PaperSize>(loadPaper)
  const [busy, setBusy] = useState<'print' | 'download' | null>(null)

  const doc = useMemo(() => (data ? buildInvoiceDocument(data, paper) : null), [data, paper])

  const changePaper = (p: PaperSize) => {
    setPaper(p)
    localStorage.setItem(PAPER_KEY, p)
  }

  async function makeBlob() {
    if (!doc) throw new Error('no document')
    return pdf(doc).toBlob()
  }

  async function handlePrint() {
    setBusy('print')
    try {
      const url = URL.createObjectURL(await makeBlob())
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
      iframe.src = url
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          window.open(url, '_blank') // fallback: open the PDF and print from there
        }
        setTimeout(() => {
          URL.revokeObjectURL(url)
          iframe.remove()
        }, 60_000)
      }
      document.body.appendChild(iframe)
    } catch {
      toast.error('نەتوانرا پسوولە ئامادە بکرێت')
    } finally {
      setBusy(null)
    }
  }

  async function handleDownload() {
    if (!data) return
    setBusy('download')
    try {
      const url = URL.createObjectURL(await makeBlob())
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${data.number}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      toast.error('نەتوانرا پسوولە دابگیرێت')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>پسوولەی ژمارە : {data?.number} </DialogTitle>
          <DialogDescription>پێش چاپکردن دەتوانیت پسوولەکە ببینیت</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">قەبارەی کاغەز:</span>
          {(['80', '58'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={paper === p ? 'default' : 'outline'}
              onClick={() => changePaper(p)}
            >
              {p} mm
            </Button>
          ))}
        </div>

        {/* PDF preview (phones cannot show PDFs inside the page, so it is hidden there) */}
        <div className="hidden h-[55vh] overflow-hidden rounded-lg border bg-muted md:block">
          {doc && (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 0 }}>
              {doc}
            </PDFViewer>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={handlePrint} disabled={busy !== null} className="sm:flex-1">
            {busy === 'print' ? <Loader2 className="animate-spin" /> : <Printer />}
            چاپکردن
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownload}
            disabled={busy !== null}
            className="sm:flex-1"
          >
            {busy === 'download' ? <Loader2 className="animate-spin" /> : <Download />}
            داگرتنی PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
