import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DAY_START_HOUR } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 1500000 -> "1,500,000" */
export function formatNumber(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** 1500000 -> "1,500,000 د.ع" */
export function formatIQD(n: number): string {
  return `${formatNumber(n)} د.ع`
}

/** Converts Kurdish/Arabic digits (٠١٢ / ۰۱۲) to English digits and keeps only 0-9 */
export function onlyDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\d]/g, '')
}

/**
 * The backend saves dates with DateTime.Now (local time, no "Z"),
 * so a date without a time zone is read as local time.
 */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return new Date(value)
}

/** 2026/10/30 14:55 */
export function formatDateTime(value: string | Date): string {
  const d = parseDate(value)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Start of the current business day (the day starts at DAY_START_HOUR, not at 00:00). */
export function businessDayStart(now: Date = new Date()): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_START_HOUR, 0, 0, 0)
  if (now.getHours() < DAY_START_HOUR) start.setDate(start.getDate() - 1)
  return start
}

/** true when the date is inside the current business day (only these orders can be edited) */
export function isCurrentBusinessDay(value: string | Date): boolean {
  const d = parseDate(value)
  const start = businessDayStart()
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return d >= start && d < end
}

/** yyyy-MM-dd of the current business day, moved by `offsetDays` (-1 = yesterday). For DateOnly params. */
export function businessDateString(offsetDays = 0): string {
  const d = businessDayStart()
  d.setDate(d.getDate() + offsetDays)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Short invoice number from the order Guid */
export function orderNumber(id: string): string {
  return (id ?? '').slice(0, 8).toUpperCase() || '-'
}
