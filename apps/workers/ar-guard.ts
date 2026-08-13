/**
 * AR Guard — Receivables Management
 *
 * Tracks delivered orders as receivables, ages into buckets,
 * and stages escalating follow-up drafts in lbs.'s voice.
 *
 * Phase 4 of lbs. Revenue OS.
 *
 * KEY CONSTRAINTS:
 * - A human always dispatches any outbound to buyers about money.
 * - Jurisdiction deadlines are surfaced as informational — never legal advice.
 * - Draft cadence: friendly (30d) → firmer (60d) → formal (90d+).
 */

export type ARBucket = 'CURRENT' | 'DAYS_30' | 'DAYS_60' | 'DAYS_90'

export interface ARRecord {
  orderId: string
  orderNumber: string
  buyerBusinessName: string
  buyerContactName: string
  buyerEmail: string
  buyerLicenseNumber: string
  invoicedAt: Date
  dueDate: Date
  amountDue: number
  amountPaid: number
  chaseCount: number
  lastChaseAt: Date | null
}

export interface ARSummary {
  record: ARRecord
  bucket: ARBucket
  daysOverdue: number
  amountOutstanding: number
  riskScore: number // daysOverdue * amountOutstanding — for prioritization
  suggestedAction: string
  draftEmail: { subject: string; bodyText: string } | null
}

function getBucket(daysOverdue: number): ARBucket {
  if (daysOverdue <= 0) return 'CURRENT'
  if (daysOverdue <= 30) return 'DAYS_30'
  if (daysOverdue <= 60) return 'DAYS_60'
  return 'DAYS_90'
}

function getDaysOverdue(record: ARRecord): number {
  return Math.floor(
    (Date.now() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Draft a follow-up email in lbs.'s voice.
 * Tone escalates with time. All drafts are staged — never auto-sent.
 * No legal positions stated. No SMS. Voice or email only.
 */
function draftChaseEmail(
  record: ARRecord,
  bucket: ARBucket,
  daysOverdue: number
): { subject: string; bodyText: string } | null {
  const outstanding = (record.amountDue - record.amountPaid).toFixed(2)

  if (bucket === 'CURRENT') return null

  if (bucket === 'DAYS_30') {
    return {
      subject: `lbs. Distribution — Invoice reminder — ${record.orderNumber}`,
      bodyText: [
        `Hi ${record.buyerContactName},`,
        '',
        `Wanted to touch base on order ${record.orderNumber} — we have $${outstanding} outstanding from ${record.buyerBusinessName}.`,
        '',
        'If payment has already been sent, please disregard this note. If you have any questions, I\'m happy to help.',
        '',
        'Thanks,',
        'lbs. Distribution',
      ].join('\n'),
    }
  }

  if (bucket === 'DAYS_60') {
    return {
      subject: `lbs. Distribution — Overdue balance — ${record.orderNumber}`,
      bodyText: [
        `Hi ${record.buyerContactName},`,
        '',
        `Following up again on order ${record.orderNumber}. We have a balance of $${outstanding} from ${record.buyerBusinessName} that is now ${daysOverdue} days past due.`,
        '',
        'Please let us know when we can expect payment, or if there\'s anything we can resolve on our end to facilitate it.',
        '',
        'Best,',
        'lbs. Distribution',
      ].join('\n'),
    }
  }

  // DAYS_90 — firm but professional
  return {
    subject: `lbs. Distribution — Urgent: ${record.orderNumber} — $${outstanding} outstanding`,
    bodyText: [
      `Hi ${record.buyerContactName},`,
      '',
      `This is a follow-up regarding order ${record.orderNumber}. The outstanding balance of $${outstanding} from ${record.buyerBusinessName} is now ${daysOverdue} days past due.`,
      '',
      'We value our relationship and would like to resolve this promptly. Please respond with a payment timeline or reach out directly to discuss.',
      '',
      'lbs. Distribution',
    ].join('\n'),
  }
}

/**
 * Rank AR records by urgency.
 * Returns a sorted list with the most critical at the top.
 */
export function rankARRecords(records: ARRecord[]): ARSummary[] {
  return records
    .map((record) => {
      const daysOverdue = getDaysOverdue(record)
      const amountOutstanding = record.amountDue - record.amountPaid
      const bucket = getBucket(daysOverdue)
      const riskScore = daysOverdue * amountOutstanding

      let suggestedAction = 'Monitor — not yet due.'
      if (bucket === 'DAYS_30')
        suggestedAction = 'Send friendly reminder — draft staged.'
      if (bucket === 'DAYS_60')
        suggestedAction = 'Send firmer follow-up — draft staged.'
      if (bucket === 'DAYS_90')
        suggestedAction =
          'Escalate — send formal notice and consider Nabis factoring.'

      return {
        record,
        bucket,
        daysOverdue,
        amountOutstanding,
        riskScore,
        suggestedAction,
        draftEmail: draftChaseEmail(record, bucket, daysOverdue),
      }
    })
    .filter((s) => s.amountOutstanding > 0)
    .sort((a, b) => {
      // Critical first, then by risk score
      const bucketOrder = { DAYS_90: 0, DAYS_60: 1, DAYS_30: 2, CURRENT: 3 }
      const bA = bucketOrder[a.bucket]
      const bB = bucketOrder[b.bucket]
      if (bA !== bB) return bA - bB
      return b.riskScore - a.riskScore
    })
}
