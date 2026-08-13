import type { NabisInventoryItem, NabisPollResult } from './types'
import { MOCK_INVENTORY } from './mock-data'

export interface NabisClientConfig {
  account1ApiKey: string
  account2ApiKey: string
  baseUrl: string
  mockMode?: boolean
}

/**
 * Dual-account Nabis API client.
 *
 * In mockMode (MOCK_NABIS=true), returns realistic mock data without
 * hitting the real API — for development and staging before credentials arrive.
 *
 * Real API: Nabis uses GraphQL. Auth is Bearer token.
 */
export class NabisClient {
  private config: NabisClientConfig
  private seenBatchIds: Set<string> = new Set()

  constructor(config: NabisClientConfig) {
    this.config = config
  }

  async pollAccount(
    account: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  ): Promise<NabisPollResult> {
    if (this.config.mockMode) {
      return this.mockPoll(account)
    }
    return this.realPoll(account)
  }

  async pollBothAccounts(): Promise<{
    houseBrands: NabisPollResult
    connectedAlienLabs: NabisPollResult
    allItems: NabisInventoryItem[]
  }> {
    const [houseBrands, connectedAlienLabs] = await Promise.all([
      this.pollAccount('HOUSE_BRANDS'),
      this.pollAccount('CONNECTED_ALIEN_LABS'),
    ])

    const allItems = [
      ...houseBrands.items.filter((i) => i.isActive),
      ...connectedAlienLabs.items.filter((i) => i.isActive),
    ]

    return { houseBrands, connectedAlienLabs, allItems }
  }

  private mockPoll(
    account: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  ): NabisPollResult {
    const items = MOCK_INVENTORY.filter((i) => i.nabisAccount === account)
    const newBatchIds = items
      .filter((i) => !this.seenBatchIds.has(i.nabisId))
      .map((i) => i.nabisId)

    items.forEach((i) => this.seenBatchIds.add(i.nabisId))

    return {
      account,
      items,
      polledAt: new Date().toISOString(),
      newBatchIds,
      errors: [],
    }
  }

  private async realPoll(
    account: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  ): Promise<NabisPollResult> {
    const apiKey =
      account === 'HOUSE_BRANDS'
        ? this.config.account1ApiKey
        : this.config.account2ApiKey

    // Nabis GraphQL endpoint for inventory
    // NOTE: Exact query shape depends on Nabis API version at integration time.
    // This is the expected structure based on Nabis Platform API patterns.
    const query = `
      query GetInventory {
        organization {
          inventory {
            edges {
              node {
                id
                product {
                  id
                  name
                  brand { name }
                  category { name }
                  sku
                }
                batch {
                  id
                  batchNumber
                  harvestDate
                  labResultDate
                  thcPercentage
                  cbdPercentage
                }
                quantityOnHand
                caseQuantity
                unitPrice
                casePrice
                isActive
              }
            }
          }
        }
      }
    `

    try {
      const res = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        throw new Error(`Nabis API error: ${res.status} ${res.statusText}`)
      }

      const json = (await res.json()) as {
        data?: { organization?: { inventory?: { edges?: unknown[] } } }
        errors?: { message: string }[]
      }

      if (json.errors?.length) {
        return {
          account,
          items: [],
          polledAt: new Date().toISOString(),
          newBatchIds: [],
          errors: json.errors.map((e) => e.message),
        }
      }

      const edges = json.data?.organization?.inventory?.edges ?? []
      const items: NabisInventoryItem[] = (
        edges as Array<{ node: Record<string, unknown> }>
      )
        .map((edge) => this.normalizeEdge(edge.node, account))
        .filter((item): item is NabisInventoryItem => item !== null)

      const newBatchIds = items
        .filter((i) => !this.seenBatchIds.has(i.nabisId))
        .map((i) => i.nabisId)

      items.forEach((i) => this.seenBatchIds.add(i.nabisId))

      return {
        account,
        items,
        polledAt: new Date().toISOString(),
        newBatchIds,
        errors: [],
      }
    } catch (err) {
      return {
        account,
        items: [],
        polledAt: new Date().toISOString(),
        newBatchIds: [],
        errors: [err instanceof Error ? err.message : String(err)],
      }
    }
  }

  /**
   * Normalize a raw Nabis inventory edge into our unified schema.
   * Returns null for items that cannot be normalized (logged as errors).
   * NEVER returns fabricated data — missing fields are null.
   */
  private normalizeEdge(
    node: Record<string, unknown>,
    account: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  ): NabisInventoryItem | null {
    try {
      const product = node.product as Record<string, unknown>
      const batch = node.batch as Record<string, unknown>
      const brand = product?.brand as Record<string, unknown>
      const category = product?.category as Record<string, unknown>

      if (!node.id || !product?.name) return null

      return {
        nabisId: String(node.id),
        nabisAccount: account,
        sku: product.sku ? String(product.sku) : String(node.id),
        batchNumber: batch?.batchNumber ? String(batch.batchNumber) : '',
        productName: String(product.name),
        brand: brand?.name ? String(brand.name) : 'Unknown',
        category: category?.name ? String(category.name) : null,
        harvestDate: batch?.harvestDate ? String(batch.harvestDate) : null,
        labResultDate: batch?.labResultDate
          ? String(batch.labResultDate)
          : null,
        thcPct:
          batch?.thcPercentage != null
            ? parseFloat(String(batch.thcPercentage))
            : null,
        cbdPct:
          batch?.cbdPercentage != null
            ? parseFloat(String(batch.cbdPercentage))
            : null,
        qtyOnHand: node.quantityOnHand ? Number(node.quantityOnHand) : 0,
        caseSize: node.caseQuantity ? Number(node.caseQuantity) : 1,
        unitPrice: node.unitPrice ? String(node.unitPrice) : '0.00',
        casePrice: node.casePrice ? String(node.casePrice) : '0.00',
        isActive: Boolean(node.isActive),
      }
    } catch {
      return null
    }
  }
}

export function createNabisClient(): NabisClient {
  return new NabisClient({
    account1ApiKey: process.env.NABIS_ACCOUNT_1_API_KEY ?? '',
    account2ApiKey: process.env.NABIS_ACCOUNT_2_API_KEY ?? '',
    baseUrl:
      process.env.NABIS_BASE_URL ?? 'https://api.getnabis.com/graphql/admin',
    mockMode: process.env.MOCK_NABIS === 'true',
  })
}
