/**
 * Google Sheets Column Contract
 *
 * This is the PRESERVED column structure from the existing lbs. setup.
 * Columns may be ADDED but never REMOVED or RENAMED without explicit written
 * sign-off from Ross Haley. Violations break his team's daily workflow.
 *
 * ORDERS tab — one row per order (summary)
 * LINE ITEMS tab — one row per order line item
 */

export const ORDERS_COLUMNS = [
  'Order ID',           // A
  'Order Number',       // B
  'Placed At',         // C
  'Status',            // D
  'Source',            // E — menu | concierge | desk
  'Buyer Business Name', // F
  'Buyer License Number', // G  ← Required: license captured with every order
  'Buyer Contact Name',  // H
  'Buyer Email',        // I
  'Buyer Phone',        // J
  'Subtotal',          // K
  'Notes',             // L
] as const

export const LINE_ITEMS_COLUMNS = [
  'Order ID',           // A
  'Order Number',       // B
  'Placed At',         // C
  'Buyer Business Name', // D
  'Buyer License Number', // E ← Required: license on every line item row too
  'SKU',               // F
  'Batch Number',      // G
  'Product Name',      // H
  'Brand',             // I
  'Case Count',        // J
  'Unit Price',        // K
  'Case Price',        // L
  'Line Total',        // M
] as const

export type OrdersRow = {
  [K in (typeof ORDERS_COLUMNS)[number]]: string
}

export type LineItemsRow = {
  [K in (typeof LINE_ITEMS_COLUMNS)[number]]: string
}
