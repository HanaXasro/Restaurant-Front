import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { buildInvoiceDocument } from '@/pdf/InvoiceDocument'
import type { InvoiceData } from './types'

/**
 * Prints the receipt directly (no preview window).
 * The PDF is made in memory and sent to the browser print dialog.
 * Choose your mini printer there and set margins to "None".
 */
export async function printInvoice(data: InvoiceData): Promise<void> {
  try {
    const blob = await pdf(buildInvoiceDocument(data)).toBlob()
    const url = URL.createObjectURL(blob)

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
  }
}
