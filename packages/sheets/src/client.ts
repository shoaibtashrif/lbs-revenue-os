import { google } from 'googleapis'
import {
  ORDERS_COLUMNS,
  LINE_ITEMS_COLUMNS,
  type OrdersRow,
  type LineItemsRow,
} from './columns'

export interface OrderWritePayload {
  orderId: string
  orderNumber: string
  placedAt: Date
  status: string
  source: string
  buyerBusinessName: string
  buyerLicenseNumber: string
  buyerContactName: string
  buyerEmail: string
  buyerPhone: string | null
  subtotal: string
  notes: string | null
  lines: LinePayload[]
}

export interface LinePayload {
  sku: string
  batchNumber: string
  productName: string
  brand: string
  caseCount: number
  unitPrice: string
  casePrice: string
  lineTotal: string
}

export interface WriteResult {
  success: boolean
  ordersRowRange?: string
  lineItemsRowRanges?: string[]
  error?: string
}

export class SheetsClient {
  private spreadsheetId: string
  private ordersTab: string
  private lineItemsTab: string
  private auth: unknown = null

  constructor(config: {
    spreadsheetId: string
    ordersTab: string
    lineItemsTab: string
    serviceAccountKeyB64?: string
    oauthClientJsonB64?: string
  }) {
    this.spreadsheetId = config.spreadsheetId
    this.ordersTab = config.ordersTab
    this.lineItemsTab = config.lineItemsTab

    // 1. Service account authentication (if available)
    if (config.serviceAccountKeyB64) {
      try {
        const keyJson = JSON.parse(
          Buffer.from(config.serviceAccountKeyB64, 'base64').toString('utf-8')
        )
        this.auth = google.auth.fromJSON(keyJson)
      } catch (err) {
        console.error('[SheetsClient] Failed to parse service account key:', err)
      }
    }

    // 2. OAuth2 Client authentication (installed OAuth credentials)
    if (!this.auth && config.oauthClientJsonB64) {
      try {
        const parsed = JSON.parse(
          Buffer.from(config.oauthClientJsonB64, 'base64').toString('utf-8')
        )
        const creds = parsed.installed || parsed.web
        if (creds) {
          const oauth2Client = new google.auth.OAuth2(
            creds.client_id,
            creds.client_secret,
            creds.redirect_uris?.[0] || 'http://localhost'
          )
          this.auth = oauth2Client
        }
      } catch (err) {
        console.error('[SheetsClient] Failed to parse OAuth client json:', err)
      }
    }
  }

  async writeOrder(payload: OrderWritePayload): Promise<WriteResult> {
    if (!this.auth || !this.spreadsheetId) {
      console.warn(
        '[SheetsClient] No authenticated Google credentials or Sheet ID — logging order output locally.'
      )
      return { success: true }
    }

    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth as never })

      const ordersRow = this.buildOrdersRow(payload)
      const lineRows = payload.lines.map((line) =>
        this.buildLineItemsRow(payload, line)
      )

      // Append order summary
      const ordersResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.ordersTab}!A:A`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [Object.values(ordersRow)],
        },
      })

      // Append order detail lines
      const lineRanges: string[] = []
      for (const lineRow of lineRows) {
        const lineResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.lineItemsTab}!A:A`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [Object.values(lineRow)],
          },
        })
        if (lineResponse.data.updates?.updatedRange) {
          lineRanges.push(lineResponse.data.updates.updatedRange)
        }
      }

      return {
        success: true,
        ordersRowRange: ordersResponse.data.updates?.updatedRange ?? undefined,
        lineItemsRowRanges: lineRanges,
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error('[SheetsClient] Write failed:', error)
      return { success: false, error }
    }
  }

  private buildOrdersRow(payload: OrderWritePayload): OrdersRow {
    const row: Record<string, string> = {}
    ORDERS_COLUMNS.forEach((col) => {
      switch (col) {
        case 'Order ID':
          row[col] = payload.orderId
          break
        case 'Order Number':
          row[col] = payload.orderNumber
          break
        case 'Placed At':
          row[col] = payload.placedAt.toISOString()
          break
        case 'Status':
          row[col] = payload.status
          break
        case 'Source':
          row[col] = payload.source
          break
        case 'Buyer Business Name':
          row[col] = payload.buyerBusinessName
          break
        case 'Buyer License Number':
          row[col] = payload.buyerLicenseNumber
          break
        case 'Buyer Contact Name':
          row[col] = payload.buyerContactName
          break
        case 'Buyer Email':
          row[col] = payload.buyerEmail
          break
        case 'Buyer Phone':
          row[col] = payload.buyerPhone ?? ''
          break
        case 'Subtotal':
          row[col] = payload.subtotal
          break
        case 'Notes':
          row[col] = payload.notes ?? ''
          break
      }
    })
    return row as OrdersRow
  }

  private buildLineItemsRow(
    order: OrderWritePayload,
    line: LinePayload
  ): LineItemsRow {
    const row: Record<string, string> = {}
    LINE_ITEMS_COLUMNS.forEach((col) => {
      switch (col) {
        case 'Order ID':
          row[col] = order.orderId
          break
        case 'Order Number':
          row[col] = order.orderNumber
          break
        case 'Placed At':
          row[col] = order.placedAt.toISOString()
          break
        case 'Buyer Business Name':
          row[col] = order.buyerBusinessName
          break
        case 'Buyer License Number':
          row[col] = order.buyerLicenseNumber
          break
        case 'SKU':
          row[col] = line.sku
          break
        case 'Batch Number':
          row[col] = line.batchNumber
          break
        case 'Product Name':
          row[col] = line.productName
          break
        case 'Brand':
          row[col] = line.brand
          break
        case 'Case Count':
          row[col] = String(line.caseCount)
          break
        case 'Unit Price':
          row[col] = line.unitPrice
          break
        case 'Case Price':
          row[col] = line.casePrice
          break
        case 'Line Total':
          row[col] = line.lineTotal
          break
      }
    })
    return row as LineItemsRow
  }
}

export function createSheetsClient(): SheetsClient {
  return new SheetsClient({
    spreadsheetId: process.env.GOOGLE_SHEET_ID ?? '',
    ordersTab: process.env.GOOGLE_SHEET_ORDERS_TAB ?? 'Orders',
    lineItemsTab: process.env.GOOGLE_SHEET_LINE_ITEMS_TAB ?? 'Line Items',
    serviceAccountKeyB64: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 ?? '',
    oauthClientJsonB64: process.env.GOOGLE_OAUTH_CLIENT_JSON_B64 ?? '',
  })
}
