// Change these values to your restaurant information.
// They are printed on the invoice and shown in the app.
export const RESTAURANT_NAME = 'شاورمەی پیکی بلایندەرس'
export const RESTAURANT_PHONE = '' // for example: '0750 000 0000'
export const RESTAURANT_ADDRESS = '' // for example: 'کەرکووک'

// A new business day starts at this hour (3 = 03:00 AM), same as the backend.
export const DAY_START_HOUR = 3

// Login (handled in the front-end only)
export const ADMIN_USERNAME = 'Admin'
export const ADMIN_PASSWORD = 'ad1234'

// Names of the two sales types (SalesType enum: Restaurant = 1, Delivery = 2).
export const SALES_TYPE_LABEL = {
  1: 'چێشتخانە',
  2: 'گەیاندن',
} as const

// Paper width of the receipt printer in millimetres.
export const PAPER_WIDTH_MM = 72.1
