import { ClipPath, Defs, Document, Font, G, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
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
  title: { fontFamily: 'Rabar015', fontSize: 16, marginTop: 4, textAlign: 'center' ,  letterSpacing: 1.2, },
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

const CONE_PATH =
  'M295 335 C300 300 350 282 470 282 C590 282 640 300 645 335 C650 450 620 560 595 650 C575 740 565 790 555 830 C535 868 405 868 385 830 C375 790 365 740 345 650 C320 560 290 450 295 335 Z'

const HAT_PATH =
  'M262 322 C214 298 192 262 192 226 C192 184 232 152 280 154 C302 155 318 163 326 177 C334 146 358 130 388 131 C396 72 442 40 500 40 C566 40 606 92 602 180 C640 150 700 156 724 196 C748 240 730 292 676 322'

const SLICES = [
  'M270 400 C360 440 410 370 490 410 C560 445 610 410 670 390',
  'M270 500 C350 465 420 535 495 505 C565 478 610 520 670 495',
  'M270 605 C360 640 410 575 490 610 C560 640 610 600 670 590',
  'M270 705 C350 675 420 735 495 710 C560 690 600 725 670 700',
  'M270 800 C350 830 410 775 490 805 C550 825 600 800 670 790',
]

/** Doner kebab + chef hat logo. Black only, with thicker lines so it prints sharp on thermal paper. */
function LogoMark() {
  const stroke = {
    stroke: '#000',
    fill: 'none',
    strokeWidth: 34,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const

  return (
    <Svg width={27.4} height={30} viewBox="0 0 940 1030">
      <Defs>
        <ClipPath id="cone">
          <Path d={CONE_PATH} />
        </ClipPath>
      </Defs>

      {/* Chef hat */}
      <Path d={HAT_PATH} {...stroke} />

      {/* Skewer top */}
      <Path d="M470 218 V285" {...stroke} strokeWidth={40} />

      {/* Meat slices (cut at the cone edge) */}
      <G clipPath="url(#cone)">
        {SLICES.map((d) => (
          <Path key={d} d={d} {...stroke} />
        ))}
      </G>

      {/* Cone outline */}
      <Path d={CONE_PATH} {...stroke} />

      {/* Skewer bottom */}
      <Path d="M470 860 V985" {...stroke} strokeWidth={40} />
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