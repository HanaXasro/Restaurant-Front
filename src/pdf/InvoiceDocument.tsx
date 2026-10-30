import { Circle, Document, Font, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { RESTAURANT_ADDRESS, RESTAURANT_NAME, RESTAURANT_PHONE } from '@/lib/config'
import type { InvoiceData } from '@/lib/types'
import { formatIQD, formatNumber } from '@/lib/utils'

// Fonts: put the files in /public/fonts
Font.register({ family: 'Rabar022', src: '/fonts/rabar_022.ttf' })
Font.register({ family: 'Rabar015', src: '/fonts/rabar_015.ttf' })
// do not cut Kurdish words
Font.registerHyphenationCallback((word) => [word])

/** Paper width in points (1mm = 2.8346pt) */
export const PAPER_WIDTH = { '80': 226.77, '58': 164.41 } as const
export type PaperSize = keyof typeof PAPER_WIDTH

const styles = StyleSheet.create({
  page: { fontFamily: 'Rabar022', color: '#000', paddingHorizontal: 8, paddingVertical: 10 },
  center: { alignItems: 'center' },
  title: { fontFamily: 'Rabar015', fontSize: 16, marginTop: 4, textAlign: 'center' },
  sub: { fontSize: 9, textAlign: 'center', marginTop: 2 },
  small: { fontSize: 8, textAlign: 'center', marginTop: 1 },
  line: { borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#000', marginVertical: 6 },
  dashed: { borderBottomWidth: 0.5, borderBottomStyle: 'dashed', borderBottomColor: '#000' },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 2 },
  meta: { fontSize: 9, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', paddingVertical: 3 },
  headRow: { flexDirection: 'row-reverse', paddingBottom: 3 },
  cName: { flex: 3, fontSize: 9, textAlign: 'right', paddingLeft: 2 },
  cQty: { flex: 1.2, fontSize: 9, textAlign: 'center' },
  cPrice: { flex: 2, fontSize: 9, textAlign: 'center' },
  cSub: { flex: 2, fontSize: 9, textAlign: 'left' },
  head: { fontSize: 8 },
  totalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: 'Rabar015', fontSize: 11, textAlign: 'right' },
  totalValue: { fontFamily: 'Rabar015', fontSize: 12, textAlign: 'left' },
  thanks: { fontSize: 9, textAlign: 'center', marginTop: 6 },
})

function LogoMark() {
  return (
    <Svg width={30} height={30} viewBox="0 0 64 64">
      <Path d="M12 44h40" stroke="#000" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M18 44a14 14 0 0 1 28 0" stroke="#000" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M32 30v-3" stroke="#000" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M16 51h32" stroke="#000" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Circle cx={32} cy={23} r={3} fill="#000" />
    </Svg>
  )
}

/** Height of the receipt, so it prints on one piece of paper without extra pages. */
function estimateHeight(data: InvoiceData, width: number): number {
  const charsPerLine = width > 200 ? 13 : 8
  const lines = data.items.reduce(
    (sum, it) => sum + Math.max(1, Math.ceil(it.name.length / charsPerLine)),
    0,
  )
  const extra = (RESTAURANT_PHONE ? 11 : 0) + (RESTAURANT_ADDRESS ? 11 : 0)
  return 235 + extra + data.items.length * 7 + lines * 14
}

/** Receipt for a mini thermal printer (80mm or 58mm). */
export function buildInvoiceDocument(data: InvoiceData, paper: PaperSize = '80') {
  const width = PAPER_WIDTH[paper]
  const height = estimateHeight(data, width)

  return (
    <Document title={`پسوولە ${data.number}`} author={RESTAURANT_NAME}>
      <Page size={{ width, height }} style={styles.page} wrap={false}>
        <View style={styles.center}>
          <LogoMark />
          <Text style={styles.title}>{RESTAURANT_NAME}</Text>
          <Text style={styles.sub}>پسوولەی فرۆشتن</Text>
          {RESTAURANT_ADDRESS ? <Text style={styles.small}>{RESTAURANT_ADDRESS}</Text> : null}
          {RESTAURANT_PHONE ? <Text style={styles.small}>{RESTAURANT_PHONE}</Text> : null}
        </View>

        <View style={styles.line} />

        <View style={styles.metaRow}>
          <Text style={styles.meta}>:ژمارەی پسوولە</Text>
          <Text style={styles.meta}>{data.number}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>:بەروار</Text>
          <Text style={styles.meta}>{data.date}</Text>
        </View>

        <View style={styles.line} />

        <View style={[styles.headRow, styles.dashed]}>
          <Text style={[styles.cName, styles.head]}>ناو</Text>
          <Text style={[styles.cQty, styles.head]}>ژمارە</Text>
          <Text style={[styles.cPrice, styles.head]}>نرخ</Text>
          <Text style={[styles.cSub, styles.head]}>کۆ</Text>
        </View>

        {data.items.map((it, i) => (
          <View key={i} style={[styles.row, styles.dashed]} wrap={false}>
            <Text style={styles.cName}>{it.name}</Text>
            <Text style={styles.cQty}>{it.quantity}</Text>
            <Text style={styles.cPrice}>{formatNumber(it.unitPrice)}</Text>
            <Text style={styles.cSub}>{formatNumber(it.quantity * it.unitPrice)}</Text>
          </View>
        ))}

        <View style={styles.line} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>:کۆی گشتی</Text>
          <Text style={styles.totalValue}>{formatIQD(data.total)}</Text>
        </View>

        <View style={styles.line} />

        <Text style={styles.thanks}>سوپاس بۆ سەردانتان</Text>
      </Page>
    </Document>
  )
}
