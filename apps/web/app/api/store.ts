/**
 * Shared In-Memory Store for lbs. Revenue OS (Development Mode)
 *
 * Keeps live synchronized state between /menu and /desk:
 * - Inventory state (decremented live on order placement)
 * - Orders feed (newly placed orders immediately show on desk with buyer details & exact subtotal)
 * - AR receivables (automatically updated when orders deliver)
 */

export interface InventoryItem {
  nabisId: string
  brand: string
  productName: string
  qtyOnHand: number
  casePrice: string
  unitPrice: string
  caseSize: number
  sku: string
  batchNumber: string
  nabisAccount: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
  harvestDate: string | null
  labResultDate: string | null
  thcPct: number
  cbdPct: number
  category: string
}

export interface OrderLine {
  id: string
  sku: string
  batchNumber: string
  productName: string
  brand: string
  caseCount: number
  unitPrice: string
  casePrice: string
  lineTotal: string
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'MANIFESTED' | 'DELIVERED' | 'PAID' | 'CANCELLED'

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  source: string
  buyerBusinessName: string
  buyerLicenseNumber: string
  buyerContactName: string
  buyerEmail: string
  buyerPhone: string | null
  subtotal: string
  notes: string | null
  placedAt: string
  confirmedAt: string | null
  manifestedAt: string | null
  deliveredAt: string | null
  paidAt: string | null
  lines: OrderLine[]
  sheetRowWritten: boolean
  sheetRowError: string | null
}

export interface ARAccount {
  id: string
  orderNumber: string
  buyerBusinessName: string
  buyerContactName: string
  buyerEmail: string
  buyerPhone: string
  buyerLicenseNumber: string
  amountOwed: number
  daysOverdue: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedAction: string
  status: 'UNPAID' | 'STAGED_REMINDER' | 'RESOLVED'
  invoiceDate: string
  dueDate: string
}

// ─── Initial Mock Data ───────────────────────────────────────────────────────

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    nabisId: 'mock-al-002',
    brand: 'Alien Labs',
    productName: 'Ztartz 3.5g — NEW DROP',
    qtyOnHand: 8,
    casePrice: '1020.00',
    unitPrice: '85.00',
    caseSize: 12,
    sku: 'AL-ZTTZ-3.5-002',
    batchNumber: 'AL-2024-ZTZ-D01',
    nabisAccount: 'CONNECTED_ALIEN_LABS',
    harvestDate: '2024-11-01',
    labResultDate: '2024-11-10',
    thcPct: 35.2,
    cbdPct: 0.04,
    category: 'flower',
  },
  {
    nabisId: 'mock-al-001',
    brand: 'Alien Labs',
    productName: 'Runtz 3.5g',
    qtyOnHand: 4,
    casePrice: '960.00',
    unitPrice: '80.00',
    caseSize: 12,
    sku: 'AL-RNZ-3.5-001',
    batchNumber: 'AL-2024-RNZ-C01',
    nabisAccount: 'CONNECTED_ALIEN_LABS',
    harvestDate: '2024-10-15',
    labResultDate: '2024-10-25',
    thcPct: 33.4,
    cbdPct: 0.02,
    category: 'flower',
  },
  {
    nabisId: 'mock-conn-001',
    brand: 'Connected',
    productName: 'Baklava 3.5g',
    qtyOnHand: 6,
    casePrice: '900.00',
    unitPrice: '75.00',
    caseSize: 12,
    sku: 'CONN-BKLV-3.5-001',
    batchNumber: 'CONN-2024-BK-A01',
    nabisAccount: 'CONNECTED_ALIEN_LABS',
    harvestDate: '2024-10-10',
    labResultDate: '2024-10-20',
    thcPct: 32.7,
    cbdPct: 0.05,
    category: 'flower',
  },
  {
    nabisId: 'mock-conn-002',
    brand: 'Connected',
    productName: 'Peaches & Cream 3.5g',
    qtyOnHand: 2,
    casePrice: '864.00',
    unitPrice: '72.00',
    caseSize: 12,
    sku: 'CONN-PCH-3.5-002',
    batchNumber: 'CONN-2024-PCH-B01',
    nabisAccount: 'CONNECTED_ALIEN_LABS',
    harvestDate: '2024-10-05',
    labResultDate: '2024-10-15',
    thcPct: 30.1,
    cbdPct: 0.03,
    category: 'flower',
  },
  {
    nabisId: 'mock-wct-001',
    brand: 'West Coast Treez',
    productName: 'Baklava 3.5g',
    qtyOnHand: 18,
    casePrice: '540.00',
    unitPrice: '45.00',
    caseSize: 12,
    sku: 'WCT-BKLV-3.5-001',
    batchNumber: 'WCT-2024-BK-001',
    nabisAccount: 'HOUSE_BRANDS',
    harvestDate: '2024-09-15',
    labResultDate: '2024-09-25',
    thcPct: 29.4,
    cbdPct: 0.08,
    category: 'flower',
  },
  {
    nabisId: 'mock-wct-002',
    brand: 'West Coast Treez',
    productName: 'Gelato 41 3.5g',
    qtyOnHand: 3,
    casePrice: '504.00',
    unitPrice: '42.00',
    caseSize: 12,
    sku: 'WCT-GELZ-3.5-002',
    batchNumber: 'WCT-2024-GZ-002',
    nabisAccount: 'HOUSE_BRANDS',
    harvestDate: '2024-09-20',
    labResultDate: '2024-10-01',
    thcPct: 27.1,
    cbdPct: 0.1,
    category: 'flower',
  },
  {
    nabisId: 'mock-puff-001',
    brand: 'PUFF',
    productName: 'Baklava Pre-Roll 14-Pack',
    qtyOnHand: 24,
    casePrice: '550.00',
    unitPrice: '55.00',
    caseSize: 10,
    sku: 'PUFF-PR-BKLV-14-001',
    batchNumber: 'PUFF-2024-BK-PR-001',
    nabisAccount: 'HOUSE_BRANDS',
    harvestDate: '2024-09-28',
    labResultDate: '2024-10-08',
    thcPct: 28.9,
    cbdPct: 0.05,
    category: 'pre-roll',
  },
  {
    nabisId: 'mock-sc-001',
    brand: 'Simply Cannabis',
    productName: 'OG Kush 3.5g',
    qtyOnHand: 30,
    casePrice: '336.00',
    unitPrice: '28.00',
    caseSize: 12,
    sku: 'SC-OG-3.5-001',
    batchNumber: 'SC-2024-OG-001',
    nabisAccount: 'HOUSE_BRANDS',
    harvestDate: '2024-09-10',
    labResultDate: '2024-09-20',
    thcPct: 23.8,
    cbdPct: 0.12,
    category: 'flower',
  },
]

const INITIAL_ORDERS: Order[] = [
  {
    id: 'order_001',
    orderNumber: 'LBS-2024-10241',
    status: 'NEW',
    source: 'menu',
    buyerBusinessName: 'Green Leaf Dispensary',
    buyerLicenseNumber: 'C10-0000123-LIC',
    buyerContactName: 'Maria Santos',
    buyerEmail: 'orders@greenleaf.com',
    buyerPhone: '(916) 555-0100',
    subtotal: '2040.00',
    notes: null,
    placedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    confirmedAt: null,
    manifestedAt: null,
    deliveredAt: null,
    paidAt: null,
    sheetRowWritten: true,
    sheetRowError: null,
    lines: [
      {
        id: 'line_001a',
        sku: 'AL-ZTTZ-3.5-002',
        batchNumber: 'AL-2024-ZTZ-D01',
        productName: 'Ztartz 3.5g — NEW DROP',
        brand: 'Alien Labs',
        caseCount: 2,
        unitPrice: '85.00',
        casePrice: '1020.00',
        lineTotal: '2040.00',
      },
    ],
  },
  {
    id: 'order_002',
    orderNumber: 'LBS-2024-10240',
    status: 'CONFIRMED',
    source: 'menu',
    buyerBusinessName: 'Pacific Coast Collective',
    buyerLicenseNumber: 'C10-0000456-LIC',
    buyerContactName: 'Derek Tran',
    buyerEmail: 'purchasing@pacificcoast.com',
    buyerPhone: null,
    subtotal: '4320.00',
    notes: 'Morning delivery preferred',
    placedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    manifestedAt: null,
    deliveredAt: null,
    paidAt: null,
    sheetRowWritten: true,
    sheetRowError: null,
    lines: [
      {
        id: 'line_002a',
        sku: 'CONN-BKLV-3.5-001',
        batchNumber: 'CONN-2024-BK-A01',
        productName: 'Baklava 3.5g',
        brand: 'Connected',
        caseCount: 3,
        unitPrice: '75.00',
        casePrice: '900.00',
        lineTotal: '2700.00',
      },
      {
        id: 'line_002b',
        sku: 'WCT-BKLV-3.5-001',
        batchNumber: 'WCT-2024-BK-001',
        productName: 'Baklava 3.5g',
        brand: 'West Coast Treez',
        caseCount: 3,
        unitPrice: '45.00',
        casePrice: '540.00',
        lineTotal: '1620.00',
      },
    ],
  },
]

const INITIAL_AR_ACCOUNTS: ARAccount[] = [
  {
    id: 'ar_001',
    orderNumber: 'LBS-2024-10190',
    buyerBusinessName: 'Green Leaf Dispensary',
    buyerContactName: 'Maria Santos',
    buyerEmail: 'maria@greenleafdispensary.com',
    buyerPhone: '(916) 555-0100',
    buyerLicenseNumber: 'C10-0000123-LIC',
    amountOwed: 8400,
    daysOverdue: 67,
    riskLevel: 'HIGH',
    suggestedAction: 'Call account + send firm payment reminder',
    status: 'UNPAID',
    invoiceDate: '2024-05-01',
    dueDate: '2024-06-01',
  },
  {
    id: 'ar_002',
    orderNumber: 'LBS-2024-10204',
    buyerBusinessName: 'Pacific Coast Collective',
    buyerContactName: 'Derek Tran',
    buyerEmail: 'purchasing@pacificcoast.com',
    buyerPhone: '(415) 555-0188',
    buyerLicenseNumber: 'C10-0000456-LIC',
    amountOwed: 7550,
    daysOverdue: 42,
    riskLevel: 'MEDIUM',
    suggestedAction: 'Send firmer follow-up — draft staged',
    status: 'UNPAID',
    invoiceDate: '2024-05-20',
    dueDate: '2024-06-20',
  },
  {
    id: 'ar_003',
    orderNumber: 'LBS-2024-10218',
    buyerBusinessName: 'Desert Rose Cannabis',
    buyerContactName: 'Alex Kim',
    buyerEmail: 'alex@desertrose.co',
    buyerPhone: '(760) 555-0200',
    buyerLicenseNumber: 'C10-0000789-LIC',
    amountOwed: 4700,
    daysOverdue: 28,
    riskLevel: 'LOW',
    suggestedAction: 'Send friendly reminder — draft staged',
    status: 'UNPAID',
    invoiceDate: '2024-06-10',
    dueDate: '2024-07-10',
  },
]

// ─── Singleton Store Instance (Global across hot reloads) ───────────────────

declare global {
  // eslint-disable-next-line no-var
  var __lbs_store__: {
    inventory: InventoryItem[]
    orders: Order[]
    arAccounts: ARAccount[]
  } | undefined
}

if (!globalThis.__lbs_store__) {
  globalThis.__lbs_store__ = {
    inventory: [...INITIAL_INVENTORY],
    orders: [...INITIAL_ORDERS],
    arAccounts: [...INITIAL_AR_ACCOUNTS],
  }
}

const store = globalThis.__lbs_store__

// ─── Store API ───────────────────────────────────────────────────────────────

export function getStoreInventory(): InventoryItem[] {
  return store.inventory
}

export function getStoreOrders(): Order[] {
  return store.orders
}

export function getStoreARAccounts(): ARAccount[] {
  return store.arAccounts
}

export function submitNewOrder(payload: {
  buyerBusinessName: string
  buyerLicenseNumber: string
  buyerContactName: string
  buyerEmail: string
  buyerPhone?: string
  notes?: string
  lines: {
    batchNabisId: string
    sku: string
    batchNumber: string
    productName: string
    brand: string
    caseCount: number
    unitPrice: string
    casePrice: string
    lineTotal: string
  }[]
}): Order {
  // 1. Calculate line totals and subtotal with exact arithmetic
  let calculatedSubtotalNum = 0

  const processedLines: OrderLine[] = payload.lines.map((line, idx) => {
    const casePriceNum = parseFloat(line.casePrice)
    const exactLineTotalNum = Math.round(line.caseCount * casePriceNum * 100) / 100
    calculatedSubtotalNum += exactLineTotalNum

    return {
      id: `line_${Date.now()}_${idx}`,
      sku: line.sku,
      batchNumber: line.batchNumber,
      productName: line.productName,
      brand: line.brand,
      caseCount: line.caseCount,
      unitPrice: line.unitPrice,
      casePrice: line.casePrice,
      lineTotal: exactLineTotalNum.toFixed(2),
    }
  })

  const finalSubtotal = calculatedSubtotalNum.toFixed(2)

  // 2. Decrement inventory case count immediately!
  payload.lines.forEach((line) => {
    const invItem = store.inventory.find(
      (item) =>
        item.nabisId === line.batchNabisId ||
        item.sku === line.sku ||
        item.batchNumber === line.batchNumber
    )
    if (invItem) {
      invItem.qtyOnHand = Math.max(0, invItem.qtyOnHand - line.caseCount)
    }
  })

  // 3. Create order record
  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const orderNumber = `LBS-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    status: 'NEW',
    source: 'menu',
    buyerBusinessName: payload.buyerBusinessName,
    buyerLicenseNumber: payload.buyerLicenseNumber,
    buyerContactName: payload.buyerContactName,
    buyerEmail: payload.buyerEmail,
    buyerPhone: payload.buyerPhone ?? null,
    subtotal: finalSubtotal,
    notes: payload.notes ?? null,
    placedAt: new Date().toISOString(),
    confirmedAt: null,
    manifestedAt: null,
    deliveredAt: null,
    paidAt: null,
    lines: processedLines,
    sheetRowWritten: true,
    sheetRowError: null,
  }

  // Prepend to orders feed so it appears immediately at top of Order Desk
  store.orders.unshift(newOrder)

  return newOrder
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): Order | null {
  const order = store.orders.find((o) => o.id === orderId)
  if (!order) return null

  order.status = newStatus
  const nowIso = new Date().toISOString()

  if (newStatus === 'CONFIRMED' && !order.confirmedAt) order.confirmedAt = nowIso
  if (newStatus === 'MANIFESTED' && !order.manifestedAt) order.manifestedAt = nowIso
  if (newStatus === 'DELIVERED' && !order.deliveredAt) order.deliveredAt = nowIso
  if (newStatus === 'PAID' && !order.paidAt) order.paidAt = nowIso

  // Automatically add to AR Guard if DELIVERED and unpaid!
  if (newStatus === 'DELIVERED') {
    const existingAR = store.arAccounts.find((a) => a.orderNumber === order.orderNumber)
    if (!existingAR) {
      store.arAccounts.unshift({
        id: `ar_${Date.now()}`,
        orderNumber: order.orderNumber,
        buyerBusinessName: order.buyerBusinessName,
        buyerContactName: order.buyerContactName,
        buyerEmail: order.buyerEmail,
        buyerPhone: order.buyerPhone ?? '(916) 555-0100',
        buyerLicenseNumber: order.buyerLicenseNumber,
        amountOwed: parseFloat(order.subtotal),
        daysOverdue: 1,
        riskLevel: 'LOW',
        suggestedAction: 'Invoice sent upon delivery — monitor payment',
        status: 'UNPAID',
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      })
    }
  }

  return order
}
