/**
 * Drop Radar — Event Handler
 *
 * Consumes BATCH_NEW events from the Nabis polling worker.
 * Creates DropEvent records and stages tiered buyer notifications.
 *
 * Phase 3 of lbs. Revenue OS.
 *
 * KEY CONSTRAINT: A human always dispatches outbound email.
 * This module DRAFTS and STAGES — it NEVER auto-sends to buyers.
 */

export interface DropEventInput {
  nabisId: string
  batchNumber: string
  productName: string
  brand: string
  qtyOnHand: number
  casePrice: string
  nabisAccount: 'HOUSE_BRANDS' | 'CONNECTED_ALIEN_LABS'
}

export interface StagedDropEmail {
  tier: 'A' | 'B' | 'C'
  subject: string
  bodyText: string
  bodyHtml: string
  delayHours: number // Tier A: 0, Tier B: 2, Tier C: 24
}

/**
 * Generate tiered draft emails for a new drop event.
 * These are STAGED for human review — never auto-dispatched.
 *
 * Buyer tiers:
 * - Tier A: Gets 2-hour head start (0h delay)
 * - Tier B: 2-hour delay
 * - Tier C: 24-hour delay (or per Ross's config)
 */
export function generateDropDrafts(event: DropEventInput): StagedDropEmail[] {
  const isPremium =
    event.nabisAccount === 'CONNECTED_ALIEN_LABS' ||
    ['Connected', 'Alien Labs'].includes(event.brand)

  const qtyNote =
    event.qtyOnHand <= 4
      ? `Only ${event.qtyOnHand} case${event.qtyOnHand !== 1 ? 's' : ''} available.`
      : `${event.qtyOnHand} cases available.`

  const tiers: Array<{ tier: 'A' | 'B' | 'C'; delayHours: number; greeting: string }> = [
    { tier: 'A', delayHours: 0, greeting: 'First look for you.' },
    { tier: 'B', delayHours: 2, greeting: 'Now available.' },
    { tier: 'C', delayHours: 24, greeting: 'Available while supplies last.' },
  ]

  return tiers.map(({ tier, delayHours, greeting }) => {
    const subject = isPremium
      ? `[lbs.] ${event.brand} — ${event.productName} — New Allocation`
      : `[lbs.] New Drop: ${event.productName}`

    const bodyText = [
      greeting,
      '',
      `${event.brand} — ${event.productName}`,
      `Batch: ${event.batchNumber}`,
      `Case Price: $${parseFloat(event.casePrice).toFixed(2)}`,
      qtyNote,
      '',
      'Reply to this email or submit your order at the menu link.',
      '',
      '—',
      'lbs. Distribution',
    ].join('\n')

    const bodyHtml = `
<div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; color: #f5f5f0; background: #0d0d0d; padding: 32px; border-radius: 12px;">
  <p style="color: #c9a84c; font-size: 24px; font-weight: 900; margin: 0 0 24px;">lbs.</p>
  <p style="font-size: 14px; color: #9a9a95; margin-bottom: 16px;">${greeting}</p>
  <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #f5f5f0;">${event.productName}</h1>
  <p style="font-size: 14px; color: #9a9a95; margin: 0 0 16px;">${event.brand}</p>
  <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0 0 4px; font-size: 12px; color: #5a5a56; text-transform: uppercase; letter-spacing: 0.1em;">Batch</p>
    <p style="font-family: monospace; font-size: 13px; color: #c9a84c; margin: 0 0 12px;">${event.batchNumber}</p>
    <p style="margin: 0 0 4px; font-size: 12px; color: #5a5a56; text-transform: uppercase; letter-spacing: 0.1em;">Case Price</p>
    <p style="font-size: 18px; font-weight: 700; color: #c9a84c; margin: 0 0 12px;">$${parseFloat(event.casePrice).toFixed(2)}</p>
    <p style="font-size: 14px; color: ${event.qtyOnHand <= 4 ? '#e85c4a' : '#9a9a95'}; margin: 0; font-weight: ${event.qtyOnHand <= 4 ? '700' : '400'};">${qtyNote}</p>
  </div>
  <p style="font-size: 13px; color: #9a9a95;">Reply to this email or submit at your menu link.</p>
  <hr style="border-color: #2e2e2e; margin: 24px 0;" />
  <p style="font-size: 12px; color: #5a5a56; margin: 0;">lbs. Distribution · For licensed cannabis retailers only · 21+</p>
</div>
    `.trim()

    return { tier, subject, bodyText, bodyHtml, delayHours }
  })
}
