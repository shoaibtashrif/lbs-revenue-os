/**
 * Column contract regression tests.
 *
 * These tests enforce that the Google Sheet column contract is NEVER broken.
 * CI fails if any column is removed or renamed without a version bump.
 * Adding new columns is always allowed.
 */
import { describe, it, expect } from 'vitest'
import { ORDERS_COLUMNS, LINE_ITEMS_COLUMNS } from '../src/columns'

describe('Sheets column contract — ORDERS tab', () => {
  // These columns are the PRESERVED contract from the existing lbs. setup.
  // Removing or renaming any column breaks Ross's team's workflow.
  const REQUIRED_ORDERS_COLUMNS = [
    'Order ID',
    'Order Number',
    'Placed At',
    'Status',
    'Source',
    'Buyer Business Name',
    'Buyer License Number', // ← REQUIRED: captured with every order per §7
    'Buyer Contact Name',
    'Buyer Email',
    'Buyer Phone',
    'Subtotal',
    'Notes',
  ]

  it('contains all required orders columns', () => {
    REQUIRED_ORDERS_COLUMNS.forEach((col) => {
      expect(ORDERS_COLUMNS).toContain(col)
    })
  })

  it('has Buyer License Number in orders tab', () => {
    expect(ORDERS_COLUMNS).toContain('Buyer License Number')
  })
})

describe('Sheets column contract — LINE ITEMS tab', () => {
  const REQUIRED_LINE_ITEMS_COLUMNS = [
    'Order ID',
    'Order Number',
    'Placed At',
    'Buyer Business Name',
    'Buyer License Number', // ← REQUIRED: license on every line item row
    'SKU',
    'Batch Number',
    'Product Name',
    'Brand',
    'Case Count',
    'Unit Price',
    'Case Price',
    'Line Total',
  ]

  it('contains all required line item columns', () => {
    REQUIRED_LINE_ITEMS_COLUMNS.forEach((col) => {
      expect(LINE_ITEMS_COLUMNS).toContain(col)
    })
  })

  it('has Buyer License Number in line items tab', () => {
    expect(LINE_ITEMS_COLUMNS).toContain('Buyer License Number')
  })
})
