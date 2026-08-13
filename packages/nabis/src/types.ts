/**
 * Normalized inventory item — unified schema from both Nabis accounts.
 * All fields that cannot be sourced from Nabis are null.
 * We NEVER fabricate product data.
 */
export interface NabisInventoryItem {
  nabisId: string
  nabisAccount: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  sku: string
  batchNumber: string
  productName: string
  brand: string
  category: string | null
  harvestDate: string | null   // ISO date string
  labResultDate: string | null // ISO date string
  thcPct: number | null
  cbdPct: number | null
  qtyOnHand: number           // cases
  caseSize: number            // units per case
  unitPrice: string           // Decimal as string to avoid float drift
  casePrice: string           // Decimal as string
  isActive: boolean
}

export interface NabisPollResult {
  account: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  items: NabisInventoryItem[]
  polledAt: string // ISO datetime
  newBatchIds: string[] // nabisIds that weren't in the previous poll
  errors: string[]
}
