export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStoreOrders, submitNewOrder, updateOrderStatus } from '../store'

// ─── Request Validation Schemas ──────────────────────────────────────────────

const OrderLineSchema = z.object({
  batchNabisId: z.string().min(1),
  sku: z.string().min(1),
  batchNumber: z.string().min(1),
  productName: z.string().min(1),
  brand: z.string().min(1),
  caseCount: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+\.\d{2}$/),
  casePrice: z.string().regex(/^\d+\.\d{2}$/),
  lineTotal: z.string().regex(/^\d+\.\d{2}$/),
})

const SubmitOrderSchema = z.object({
  buyerBusinessName: z.string().min(1).max(200),
  buyerLicenseNumber: z.string().min(1).max(100),
  buyerContactName: z.string().min(1).max(200),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  notes: z.string().max(1000).optional(),
  lines: z.array(OrderLineSchema).min(1).max(100),
})

const PatchStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['NEW', 'CONFIRMED', 'MANIFESTED', 'DELIVERED', 'PAID', 'CANCELLED']),
})

// ─── GET /api/orders ─────────────────────────────────────────────────────────

export async function GET() {
  const orders = getStoreOrders()
  return NextResponse.json({ orders, polledAt: new Date().toISOString() })
}

// ─── POST /api/orders ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = SubmitOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      },
      { status: 422 }
    )
  }

  const data = parsed.data

  try {
    // 1. Submit order in store (decrements inventory & creates order with exact math)
    const newOrder = submitNewOrder(data)

    // 2. Best-effort write to Google Sheets
    void writeToSheets(newOrder).catch((err) => {
      console.error('[POST /api/orders] Sheets write error:', err)
    })

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      order: newOrder,
      message: `Your order ${newOrder.orderNumber} has been received. Our team will confirm within 1 business day.`,
    })
  } catch (err) {
    console.error('[POST /api/orders] Creation error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'We were unable to record your order. Please try again or contact us directly.',
      },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/orders ───────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 422 })
  }

  const updated = updateOrderStatus(parsed.data.orderId, parsed.data.status)
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, order: updated })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function writeToSheets(order: ReturnType<typeof submitNewOrder>) {
  try {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL
    if (webhookUrl) {
      console.log('[Sheets Webhook] Posting order to Google Apps Script...', order.orderNumber)
      
      const payloadObj = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        placedAt: order.placedAt,
        status: order.status,
        source: order.source,
        buyerBusinessName: order.buyerBusinessName,
        buyerLicenseNumber: order.buyerLicenseNumber,
        buyerContactName: order.buyerContactName,
        buyerEmail: order.buyerEmail,
        buyerPhone: order.buyerPhone,
        subtotal: order.subtotal,
        notes: order.notes,
        lines: order.lines,
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `payload=${encodeURIComponent(JSON.stringify(payloadObj))}`,
        redirect: 'follow',
      })
      console.log('[Sheets Webhook] Response status:', response.status, order.orderNumber)
      return
    }

    const { createSheetsClient } = await import('@lbs/sheets')
    const client = createSheetsClient()
    await client.writeOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      placedAt: new Date(order.placedAt),
      status: order.status,
      source: order.source,
      buyerBusinessName: order.buyerBusinessName,
      buyerLicenseNumber: order.buyerLicenseNumber,
      buyerContactName: order.buyerContactName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      subtotal: order.subtotal,
      notes: order.notes,
      lines: order.lines,
    })
  } catch (err) {
    console.log('[Sheets Write] Error or logged:', err instanceof Error ? err.message : String(err))
  }
}
