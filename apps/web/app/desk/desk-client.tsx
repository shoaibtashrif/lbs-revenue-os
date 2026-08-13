'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import './desk.css'

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderStatus = 'NEW' | 'CONFIRMED' | 'MANIFESTED' | 'DELIVERED' | 'PAID' | 'CANCELLED'

interface OrderLine {
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

interface Order {
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

interface InventoryItem {
  nabisId: string
  brand: string
  productName: string
  qtyOnHand: number
  casePrice: string
  nabisAccount: string
  labResultDate: string | null
}

interface ARAccount {
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

interface DropEvent {
  id: string
  batchNumber: string
  productName: string
  brand: string
  qtyOnHand: number
  casePrice: number
  detectedAt: string
  stagedDrafts: {
    tier: 'A' | 'B' | 'C'
    greeting: string
    delayHours: number
    subject: string
    body: string
    status: 'DRAFT' | 'APPROVED' | 'DISPATCHED'
  }[]
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
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
    subtotal: '4404.00',
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
  {
    id: 'order_003',
    orderNumber: 'LBS-2024-10239',
    status: 'DELIVERED',
    source: 'concierge',
    buyerBusinessName: 'Desert Rose Cannabis',
    buyerLicenseNumber: 'C10-0000789-LIC',
    buyerContactName: 'Alex Kim',
    buyerEmail: 'alex@desertrose.co',
    buyerPhone: '(760) 555-0200',
    subtotal: '1680.00',
    notes: null,
    placedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
    manifestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    paidAt: null,
    sheetRowWritten: false,
    sheetRowError: 'Google Sheets API quota exceeded — pending retry',
    lines: [
      {
        id: 'line_003a',
        sku: 'WCT-GELZ-3.5-002',
        batchNumber: 'WCT-2024-GZ-002',
        productName: 'Gelato 41 3.5g',
        brand: 'West Coast Treez',
        caseCount: 2,
        unitPrice: '42.00',
        casePrice: '504.00',
        lineTotal: '1008.00',
      },
    ],
  },
]

const MOCK_AR_ACCOUNTS: ARAccount[] = [
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
  {
    id: 'ar_004',
    orderNumber: 'LBS-2024-10229',
    buyerBusinessName: 'High Sierra Wellness',
    buyerContactName: 'Taylor Reed',
    buyerEmail: 'orders@highsierrawellness.com',
    buyerPhone: '(530) 555-0312',
    buyerLicenseNumber: 'C10-0000992-LIC',
    amountOwed: 4000,
    daysOverdue: 12,
    riskLevel: 'LOW',
    suggestedAction: 'Monitor — invoice sent',
    status: 'UNPAID',
    invoiceDate: '2024-06-25',
    dueDate: '2024-07-25',
  },
]

const MOCK_DROPS: DropEvent[] = [
  {
    id: 'drop_001',
    batchNumber: 'AL-2024-ZTZ-D01',
    productName: 'Ztartz 3.5g — NEW DROP',
    brand: 'Alien Labs',
    qtyOnHand: 8,
    casePrice: 1020,
    detectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    stagedDrafts: [
      {
        tier: 'A',
        greeting: 'First look for you (Tier A head start)',
        delayHours: 0,
        subject: '[lbs.] Alien Labs — Ztartz 3.5g — New Allocation',
        body: 'Hi Maria,\n\nFirst look for Green Leaf Dispensary. Alien Labs Ztartz 3.5g is live in Nabis. Only 8 cases available.\n\nCase Price: $1,020.00.\n\nReply directly or order on the wholesale menu.\n\n— lbs. Distribution',
        status: 'DRAFT',
      },
      {
        tier: 'B',
        greeting: 'Available now (Tier B - 2h delay)',
        delayHours: 2,
        subject: '[lbs.] New Drop: Alien Labs Ztartz 3.5g',
        body: 'Hi Derek,\n\nNew allocation of Alien Labs Ztartz 3.5g now available. 8 cases ready for dispatch.\n\nCase Price: $1,020.00.\n\n— lbs. Distribution',
        status: 'DRAFT',
      },
      {
        tier: 'C',
        greeting: 'Available while supplies last (Tier C - 24h delay)',
        delayHours: 24,
        subject: '[lbs.] Allocation Update: Alien Labs Ztartz 3.5g',
        body: 'Hi Alex,\n\nAlien Labs Ztartz 3.5g is available for order while supplies last.\n\n— lbs. Distribution',
        status: 'DRAFT',
      },
    ],
  },
]

const STATUS_ORDER: OrderStatus[] = [
  'NEW', 'CONFIRMED', 'MANIFESTED', 'DELIVERED', 'PAID', 'CANCELLED'
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  MANIFESTED: 'Manifested',
  DELIVERED: 'Delivered',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: 'CONFIRMED',
  CONFIRMED: 'MANIFESTED',
  MANIFESTED: 'DELIVERED',
  DELIVERED: 'PAID',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatCurrency(val: string | number): string {
  return `$${parseFloat(String(val)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-pill status-pill--${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function OrderRow({
  order,
  isSelected,
  onClick,
}: {
  order: Order
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <tr
      className={`order-row ${isSelected ? 'order-row--selected' : ''} ${
        order.sheetRowError ? 'order-row--alert' : ''
      }`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-selected={isSelected}
      aria-label={`Order ${order.orderNumber} from ${order.buyerBusinessName}`}
    >
      <td className="order-row__cell order-row__number">
        <span className="order-number">{order.orderNumber}</span>
        {order.sheetRowError && (
          <span className="sheet-error-dot" title="Google Sheets write failed" aria-label="Sheets sync error" />
        )}
      </td>
      <td className="order-row__cell">
        <div className="buyer-cell">
          <span className="buyer-cell__name">{order.buyerBusinessName}</span>
          <span className="buyer-cell__contact">{order.buyerContactName}</span>
        </div>
      </td>
      <td className="order-row__cell">
        <StatusPill status={order.status} />
      </td>
      <td className="order-row__cell order-row__amount">
        {formatCurrency(order.subtotal)}
      </td>
      <td className="order-row__cell order-row__lines">
        {order.lines.length} line{order.lines.length > 1 ? 's' : ''}
      </td>
      <td className="order-row__cell order-row__time" suppressHydrationWarning>
        <span className={`order-source-badge order-source-badge--${order.source}`}>
          {order.source}
        </span>
        <span suppressHydrationWarning>{timeAgo(order.placedAt)}</span>
      </td>
    </tr>
  )
}

function OrderDetail({
  order,
  onStatusAdvance,
  onClose,
}: {
  order: Order
  onStatusAdvance: (orderId: string, newStatus: OrderStatus) => void
  onClose: () => void
}) {
  const nextStatus = STATUS_NEXT[order.status]

  return (
    <aside className="order-detail" aria-label={`Order detail: ${order.orderNumber}`}>
      <div className="order-detail__header">
        <div>
          <p className="text-label">Order</p>
          <h2 className="order-detail__number">{order.orderNumber}</h2>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close detail panel">
          ×
        </button>
      </div>

      {order.sheetRowError && (
        <div className="desk-alert desk-alert--warning" role="alert">
          <strong>Sheets sync failed.</strong> Order is captured in database.
          Sheets write error: {order.sheetRowError}
        </div>
      )}

      <div className="order-detail__status-row">
        <StatusPill status={order.status} />
        <div className="lifecycle-dots">
          {STATUS_ORDER.filter(s => s !== 'CANCELLED').map((s, i) => (
            <span
              key={s}
              className={`lifecycle-dot ${
                STATUS_ORDER.indexOf(order.status) >= i
                  ? 'lifecycle-dot--done'
                  : ''
              }`}
              title={STATUS_LABELS[s]}
            />
          ))}
        </div>
      </div>

      {nextStatus && (
        <button
          className="btn-advance-status"
          onClick={() => onStatusAdvance(order.id, nextStatus)}
          id={`btn-advance-${order.id}`}
        >
          Mark as {STATUS_LABELS[nextStatus]}
        </button>
      )}

      <div className="detail-section">
        <p className="text-label" style={{ marginBottom: 'var(--space-3)' }}>
          Buyer
        </p>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">Business</span>
            <span className="detail-field__value">{order.buyerBusinessName}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">License</span>
            <span className="detail-field__value detail-field__value--mono">
              {order.buyerLicenseNumber}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Contact</span>
            <span className="detail-field__value">{order.buyerContactName}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Email</span>
            <a
              href={`mailto:${order.buyerEmail}`}
              className="detail-field__value detail-field__value--link"
            >
              {order.buyerEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <p className="text-label" style={{ marginBottom: 'var(--space-3)' }}>
          Line Items
        </p>
        <div className="line-items-table">
          <div className="line-items-header">
            <span>Product</span>
            <span>Cases</span>
            <span>Case Price</span>
            <span>Total</span>
          </div>
          {order.lines.map((line) => (
            <div className="line-item-row" key={line.id}>
              <div>
                <p className="line-item__name">{line.productName}</p>
                <p className="line-item__meta">
                  {line.brand} · {line.sku} · Batch {line.batchNumber}
                </p>
              </div>
              <span className="line-item__number">{line.caseCount}</span>
              <span className="line-item__number">{formatCurrency(line.casePrice)}</span>
              <span className="line-item__number line-item__total">
                {formatCurrency(line.lineTotal)}
              </span>
            </div>
          ))}
          <div className="line-items-subtotal">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
        </div>

        <div className="order-detail-actions" style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={async () => {
              const linesSummary = order.lines
                .map(
                  (l) =>
                    `- ${l.productName} (${l.brand}): ${l.caseCount} case(s) @ ${formatCurrency(l.casePrice)} = ${formatCurrency(l.lineTotal)}`
                )
                .join('\n')
              const bodyText = `Hi ${order.buyerContactName},\n\nHere is your itemized invoice for order ${order.orderNumber} placed by ${order.buyerBusinessName}.\n\nOrder Line Items:\n${linesSummary}\n\nTotal Amount: ${formatCurrency(order.subtotal)}\nStatus: ${order.status}\n\nThank you,\nlbs. Distribution\n(916) 555-0199 | orders@lbsdist.com`

              try {
                const res = await fetch('/api/email/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: order.buyerEmail,
                    subject: `lbs. Distribution — Invoice ${order.orderNumber}`,
                    text: bodyText,
                  }),
                })
                const data = await res.json()
                if (data.success) {
                  alert(`✓ Invoice email sent to ${order.buyerBusinessName} (${order.buyerEmail})!`)
                } else {
                  alert(`Email error: ${data.error}`)
                }
              } catch (err) {
                alert(`Error: ${err}`)
              }
            }}
          >
            ✉ Send Invoice Email to Buyer
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── AR Guard UI ─────────────────────────────────────────────────────────────

function ARGuardPanel() {
  const [arAccounts, setArAccounts] = useState<ARAccount[]>(MOCK_AR_ACCOUNTS)
  const [selectedAccount, setSelectedAccount] = useState<ARAccount | null>(null)
  const [draftApproved, setDraftApproved] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSentMsg, setEmailSentMsg] = useState<string | null>(null)

  const fetchAR = useCallback(() => {
    fetch('/api/ar')
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data: { arAccounts?: ARAccount[] } | null) => {
        if (data && data.arAccounts && data.arAccounts.length > 0) {
          setArAccounts(data.arAccounts)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAR()
    const interval = setInterval(fetchAR, 3000)
    return () => clearInterval(interval)
  }, [fetchAR])

  const stats = useMemo(() => {
    const totalOwed = arAccounts.reduce((sum, a) => sum + a.amountOwed, 0)
    const overdue30 = arAccounts
      .filter((a) => a.daysOverdue >= 30)
      .reduce((sum, a) => sum + a.amountOwed, 0)
    const overdue60 = arAccounts
      .filter((a) => a.daysOverdue >= 60)
      .reduce((sum, a) => sum + a.amountOwed, 0)
    const atRiskHigh = arAccounts.filter((a) => a.riskLevel === 'HIGH')
    const atRiskTotal = atRiskHigh.reduce((sum, a) => sum + a.amountOwed, 0)

    return {
      totalOwed,
      overdue30,
      overdue60,
      atRiskTotal,
      atRiskCount: atRiskHigh.length,
    }
  }, [arAccounts])

  const generateDraftText = (acc: ARAccount) => {
    const isHigh = acc.daysOverdue >= 60
    const subject = isHigh
      ? `lbs. Distribution — Urgent: Invoice Payment Past Due (${acc.orderNumber})`
      : `lbs. Distribution — Invoice Reminder (${acc.orderNumber})`

    const body = `Hi ${acc.buyerContactName},

Following up regarding outstanding invoice ${acc.orderNumber} for ${acc.buyerBusinessName}.

Amount Owed: ${formatCurrency(acc.amountOwed)}
Days Past Due: ${acc.daysOverdue} days
Invoice Date: ${acc.invoiceDate}
License: ${acc.buyerLicenseNumber}

${isHigh ? 'This account is currently 60+ days past due and flagged for executive review. Please confirm payment dispatch date.' : 'Please confirm when payment will be processed or if you need an updated invoice copy.'}

Thank you,
Ross Haley — lbs. Distribution
(916) 555-0199 | orders@lbsdist.com`

    return { subject, body }
  }

  const handleApproveDraft = (accId: string) => {
    setArAccounts((prev) =>
      prev.map((a) =>
        a.id === accId ? { ...a, status: 'STAGED_REMINDER' } : a
      )
    )
    setDraftApproved(accId)
    setTimeout(() => setDraftApproved(null), 4000)
  }

  const sendReminderEmail = async (acc: ARAccount) => {
    const { subject, body } = generateDraftText(acc)
    setSendingEmail(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: acc.buyerEmail,
          subject,
          text: body,
        }),
      })
      const data = await res.json()
      if (data.success) {
        handleApproveDraft(acc.id)
        setEmailSentMsg(`✓ Email successfully sent to ${acc.buyerBusinessName} (${acc.buyerEmail})!`)
        setTimeout(() => setEmailSentMsg(null), 6000)
        setSelectedAccount(null)
      } else {
        alert(`Failed to send email: ${data.error}`)
      }
    } catch (err) {
      alert(`Email error: ${err}`)
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="ar-guard-surface">
      {/* Metrics Banner */}
      <div className="ar-metrics-grid">
        <div className="ar-metric-card">
          <span className="ar-metric-card__label">Total Owed</span>
          <span className="ar-metric-card__val">{formatCurrency(stats.totalOwed)}</span>
          <span className="ar-metric-card__sub">{arAccounts.length} unpaid accounts</span>
        </div>

        <div className="ar-metric-card ar-metric-card--warning">
          <span className="ar-metric-card__label">Overdue 30+ Days</span>
          <span className="ar-metric-card__val">{formatCurrency(stats.overdue30)}</span>
          <span className="ar-metric-card__sub">Needs follow-up</span>
        </div>

        <div className="ar-metric-card ar-metric-card--danger">
          <span className="ar-metric-card__label">Overdue 60+ Days</span>
          <span className="ar-metric-card__val">{formatCurrency(stats.overdue60)}</span>
          <span className="ar-metric-card__sub">High priority collection</span>
        </div>

        <div className="ar-metric-card ar-metric-card--risk">
          <span className="ar-metric-card__label">At Risk</span>
          <span className="ar-metric-card__val">{formatCurrency(stats.atRiskTotal)}</span>
          <span className="ar-metric-card__sub">{stats.atRiskCount} high risk account</span>
        </div>
      </div>

      {emailSentMsg && (
        <div className="desk-toast-success" role="status">
          {emailSentMsg}
        </div>
      )}

      {draftApproved && !emailSentMsg && (
        <div className="desk-toast-success" role="status">
          ✓ Draft reminder staged! Human operator can dispatch via email. (Nothing auto-sent)
        </div>
      )}

      {/* Unpaid Accounts Table */}
      <div className="ar-accounts-table-container">
        <div className="ar-table-header">
          <div>
            <h3 className="panel-title">Receivables & Unpaid Accounts</h3>
            <p className="panel-subtitle">
              Ranked by risk and age · Human approves every outbound touchpoint
            </p>
          </div>
          <span className="ar-badge-non-negotiable">
            ✉ Gmail SMTP Active — shoaib.tashrif@gmail.com
          </span>
        </div>

        <div className="table-scroll">
          <table className="orders-table ar-table">
            <thead>
              <tr>
                <th>Account / Buyer</th>
                <th>Amount Owed</th>
                <th>Days Overdue</th>
                <th>Risk Level</th>
                <th>Suggested Action</th>
                <th>Reminder Action</th>
              </tr>
            </thead>
            <tbody>
              {arAccounts.map((acc) => (
                <tr key={acc.id} className="ar-account-row">
                  <td>
                    <div className="buyer-cell">
                      <span className="buyer-cell__name">{acc.buyerBusinessName}</span>
                      <span className="buyer-cell__contact">
                        {acc.buyerContactName} ({acc.buyerEmail})
                      </span>
                    </div>
                  </td>
                  <td className="ar-amount-cell">{formatCurrency(acc.amountOwed)}</td>
                  <td>
                    <span
                      className={`ar-days-badge ar-days-badge--${
                        acc.daysOverdue >= 60
                          ? 'critical'
                          : acc.daysOverdue >= 30
                          ? 'warning'
                          : 'normal'
                      }`}
                    >
                      {acc.daysOverdue} days overdue {acc.daysOverdue >= 60 ? '🔴' : acc.daysOverdue >= 30 ? '🟡' : '🟢'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`ar-risk-pill ar-risk-pill--${acc.riskLevel.toLowerCase()}`}
                    >
                      {acc.riskLevel}
                    </span>
                  </td>
                  <td className="ar-action-cell">{acc.suggestedAction}</td>
                  <td>
                    <button
                      className="btn-ar-draft"
                      onClick={() => setSelectedAccount(acc)}
                    >
                      {acc.status === 'STAGED_REMINDER'
                        ? 'View / Send Email ✓'
                        : 'Generate Reminder Draft'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Draft Modal */}
      {selectedAccount && (
        <div className="order-form-overlay" onClick={() => setSelectedAccount(null)}>
          <div className="order-form-panel ar-draft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-form-header">
              <div>
                <span className="text-label">AR Guard — Send Reminder Email</span>
                <h3 className="order-form-title">{selectedAccount.buyerBusinessName}</h3>
              </div>
              <button className="order-form-close" onClick={() => setSelectedAccount(null)}>
                ×
              </button>
            </div>

            <div className="order-form-body">
              <div className="ar-draft-alert-banner">
                <span className="ar-draft-alert-icon">✉</span>
                <div>
                  <strong>Live Email Dispatch</strong>
                  <p>
                    Clicking "Send Email to Buyer" will dispatch this message directly from
                    <code>shoaib.tashrif@gmail.com</code> to <strong>{selectedAccount.buyerEmail}</strong>.
                  </p>
                </div>
              </div>

              <div className="ar-draft-meta-grid">
                <div>
                  <span className="detail-field__label">Recipient</span>
                  <p className="detail-field__value">
                    {selectedAccount.buyerContactName} &lt;{selectedAccount.buyerEmail}&gt;
                  </p>
                </div>
                <div>
                  <span className="detail-field__label">Amount Owed</span>
                  <p className="detail-field__value ar-gold-text">
                    {formatCurrency(selectedAccount.amountOwed)} ({selectedAccount.daysOverdue}d overdue)
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject Line</label>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={generateDraftText(selectedAccount).subject}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Draft Body (lbs. Voice)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={10}
                  readOnly
                  value={generateDraftText(selectedAccount).body}
                />
              </div>
            </div>

            <div className="order-form-footer">
              <button
                type="button"
                className="btn-primary"
                disabled={sendingEmail}
                onClick={() => sendReminderEmail(selectedAccount)}
              >
                {sendingEmail ? 'Sending Email…' : '✉ Send Email to Buyer'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  handleApproveDraft(selectedAccount.id)
                  setSelectedAccount(null)
                }}
              >
                Approve & Mark Staged
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(generateDraftText(selectedAccount).body)
                  alert('Draft copied to clipboard!')
                }}
              >
                Copy Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Batch-Age Guard Component ──────────────────────────────────────────────

function BatchAgeGuardPanel({ items }: { items: InventoryItem[] }) {
  const agedItems = useMemo(() => {
    return items
      .map((item) => {
        const ref = item.labResultDate
        const ageDays = ref
          ? Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24))
          : 45 // fallback mock age for demo
        const casePrice = parseFloat(item.casePrice)
        const valueAtRisk = ageDays * item.qtyOnHand * casePrice

        let severity: 'critical' | 'escalate' | 'warn' = 'warn'
        if (ageDays >= 60) severity = 'critical'
        else if (ageDays >= 45) severity = 'escalate'

        let suggestedAction = 'Monitor qty'
        if (severity === 'critical') suggestedAction = 'Deep price discount — value at risk increasing daily'
        else if (severity === 'escalate') suggestedAction = 'Push to Tier B/C buyers; bundle with fast mover'
        else suggestedAction = 'Mention to top accounts on next touchpoint'

        return { ...item, ageDays, valueAtRisk, severity, suggestedAction }
      })
      .filter((i) => i.qtyOnHand > 0 && i.ageDays >= 30)
      .sort((a, b) => b.valueAtRisk - a.valueAtRisk)
  }, [items])

  return (
    <div className="batch-age-panel">
      <div className="batch-age-header">
        <div>
          <h3 className="panel-title">Batch-Age Guard — "Move These Now"</h3>
          <p className="panel-subtitle">
            Inventory older than 30 days ranked by value at risk · Prevents dead stock write-downs
          </p>
        </div>
      </div>

      <div className="table-scroll">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Product / Brand</th>
              <th>Qty On Hand</th>
              <th>Batch Age</th>
              <th>Value at Risk</th>
              <th>Severity</th>
              <th>Suggested Operational Action</th>
            </tr>
          </thead>
          <tbody>
            {agedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  No aging inventory detected (&gt;30d). All active batches fresh!
                </td>
              </tr>
            ) : (
              agedItems.map((item) => (
                <tr key={item.nabisId} className="order-row">
                  <td>
                    <div className="buyer-cell">
                      <span className="buyer-cell__name">{item.productName}</span>
                      <span className="buyer-cell__contact">{item.brand}</span>
                    </div>
                  </td>
                  <td>
                    <span className="inventory-qty inventory-qty--scarce">{item.qtyOnHand} cases</span>
                  </td>
                  <td>
                    <span className="inventory-age inventory-age--aged">{item.ageDays} days old</span>
                  </td>
                  <td className="ar-amount-cell">{formatCurrency(item.valueAtRisk)}</td>
                  <td>
                    <span className={`badge badge--${item.severity === 'critical' ? 'scarce' : 'low'}`}>
                      {item.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="ar-action-cell">{item.suggestedAction}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Drop Radar Panel ────────────────────────────────────────────────────────

function DropRadarPanel() {
  const [drops, setDrops] = useState<DropEvent[]>(MOCK_DROPS)
  const [activeDrop, setActiveDrop] = useState<DropEvent | null>(null)

  return (
    <div className="drop-radar-surface">
      <div className="view-header">
        <h2 className="view-title">Drop Radar</h2>
        <p className="view-subtitle">
          Detects new Nabis inventory drops & stages tiered buyer notifications. (Human-send only)
        </p>
      </div>

      <div className="drop-radar-grid">
        {drops.map((drop) => (
          <div key={drop.id} className="drop-event-card">
            <div className="drop-event-card__header">
              <span className="badge badge--new-drop">NEW DROP DETECTED</span>
              <span className="drop-time">{timeAgo(drop.detectedAt)}</span>
            </div>

            <h3 className="drop-product-name">{drop.productName}</h3>
            <p className="drop-product-meta">{drop.brand} · Batch {drop.batchNumber}</p>

            <div className="drop-stats-row">
              <div>
                <span className="detail-field__label">Available Qty</span>
                <p className="detail-field__value">{drop.qtyOnHand} cases</p>
              </div>
              <div>
                <span className="detail-field__label">Case Price</span>
                <p className="detail-field__value ar-gold-text">{formatCurrency(drop.casePrice)}</p>
              </div>
            </div>

            <div className="drop-drafts-list">
              <p className="text-label">Staged Tiered Buyer Notifications:</p>
              {drop.stagedDrafts.map((draft) => (
                <div key={draft.tier} className="drop-draft-item">
                  <div className="drop-draft-item__top">
                    <span className="badge badge--ok">Tier {draft.tier}</span>
                    <span className="drop-delay">{draft.delayHours === 0 ? 'Immediate Head Start' : `+${draft.delayHours}h Delay`}</span>
                  </div>
                  <p className="drop-subject">{draft.subject}</p>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 'var(--space-4)', width: '100%' }}
              onClick={() => setActiveDrop(drop)}
            >
              Review & Approve Staged Blast
            </button>
          </div>
        ))}
      </div>

      {activeDrop && (
        <div className="order-form-overlay" onClick={() => setActiveDrop(null)}>
          <div className="order-form-panel" onClick={(e) => e.stopPropagation()}>
            <div className="order-form-header">
              <div>
                <span className="text-label">Drop Radar — Tiered Blast Approval</span>
                <h3 className="order-form-title">{activeDrop.productName}</h3>
              </div>
              <button className="order-form-close" onClick={() => setActiveDrop(null)}>×</button>
            </div>
            <div className="order-form-body">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Reviewing staged emails for {activeDrop.brand}. Tier A buyers get an immediate head start before Tier B and C are notified.
              </p>
              {activeDrop.stagedDrafts.map((draft) => (
                <div key={draft.tier} className="order-summary-block">
                  <div className="order-summary-line">
                    <strong>Tier {draft.tier} Email ({draft.greeting})</strong>
                    <span className="badge badge--ok">{draft.delayHours}h Delay</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-gold)', marginTop: '8px' }}>
                    Subject: {draft.subject}
                  </p>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-3)', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                    {draft.body}
                  </pre>
                </div>
              ))}
            </div>
            <div className="order-form-footer">
              <button className="btn-primary" onClick={() => { alert('Blast approved and staged for dispatch!'); setActiveDrop(null) }}>
                Approve All Staged Drafts
              </button>
              <button className="btn-secondary" onClick={() => setActiveDrop(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Desk Component ──────────────────────────────────────────────────────

type DeskView = 'orders' | 'inventory' | 'ar' | 'drops'

export function DeskClient() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<DeskView>('orders')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLive, setIsLive] = useState(false)
  const [lastPollTime, setLastPollTime] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  )

  const filteredOrders = useMemo(
    () =>
      statusFilter === 'ALL'
        ? orders
        : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  )

  // Fetch orders live from API store
  const fetchOrders = useCallback(() => {
    fetch('/api/orders')
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data: { orders?: Order[] } | null) => {
        if (data && data.orders) setOrders(data.orders)
      })
      .catch(() => {})
  }, [])

  // Poll orders and inventory periodically
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Fetch inventory live
  const fetchInventory = useCallback(() => {
    fetch('/api/inventory')
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data: { items: InventoryItem[]; polledAt?: string } | null) => {
        if (data) {
          setInventory(data.items ?? [])
          setLastPollTime(data.polledAt ?? null)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchInventory()
    const interval = setInterval(fetchInventory, 3000)
    return () => clearInterval(interval)
  }, [fetchInventory])

  useEffect(() => {
    setIsLive(true)
  }, [])

  const advanceStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                confirmedAt:
                  newStatus === 'CONFIRMED' && !o.confirmedAt
                    ? new Date().toISOString()
                    : o.confirmedAt,
                manifestedAt:
                  newStatus === 'MANIFESTED' && !o.manifestedAt
                    ? new Date().toISOString()
                    : o.manifestedAt,
                deliveredAt:
                  newStatus === 'DELIVERED' && !o.deliveredAt
                    ? new Date().toISOString()
                    : o.deliveredAt,
                paidAt:
                  newStatus === 'PAID' && !o.paidAt
                    ? new Date().toISOString()
                    : o.paidAt,
              }
            : o
        )
      )

      try {
        await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus }),
        })
        fetchOrders()
      } catch (err) {
        console.error('Failed to update status on server:', err)
      }
    },
    [fetchOrders]
  )

  const counters = useMemo(() => {
    const c: Partial<Record<OrderStatus | 'ALL', number>> = { ALL: orders.length }
    STATUS_ORDER.forEach((s) => {
      c[s] = orders.filter((o) => o.status === s).length
    })
    return c
  }, [orders])

  return (
    <div className="desk-root" suppressHydrationWarning>
      {/* ─ Sidebar Nav ──────────────────────────────────────────── */}
      <nav className="desk-nav" aria-label="Order desk navigation">
        <a href="/menu" className="lbs-wordmark desk-wordmark" aria-label="lbs. Distribution">
          lbs.
        </a>

        <div className="desk-nav__links">
          <button
            className={`desk-nav__item ${activeView === 'orders' ? 'desk-nav__item--active' : ''}`}
            onClick={() => setActiveView('orders')}
            aria-current={activeView === 'orders' ? 'page' : undefined}
          >
            <span className="desk-nav__icon" aria-hidden="true">≡</span>
            Orders
            {(counters.NEW ?? 0) > 0 && (
              <span className="desk-nav__badge">{counters.NEW}</span>
            )}
          </button>

          <button
            className={`desk-nav__item ${activeView === 'ar' ? 'desk-nav__item--active' : ''}`}
            onClick={() => setActiveView('ar')}
            aria-current={activeView === 'ar' ? 'page' : undefined}
          >
            <span className="desk-nav__icon" aria-hidden="true">$</span>
            AR Guard
            <span className="desk-nav__badge desk-nav__badge--warning">!</span>
          </button>

          <button
            className={`desk-nav__item ${activeView === 'inventory' ? 'desk-nav__item--active' : ''}`}
            onClick={() => setActiveView('inventory')}
            aria-current={activeView === 'inventory' ? 'page' : undefined}
          >
            <span className="desk-nav__icon" aria-hidden="true">◇</span>
            Inventory & Age
          </button>

          <button
            className={`desk-nav__item ${activeView === 'drops' ? 'desk-nav__item--active' : ''}`}
            onClick={() => setActiveView('drops')}
            aria-current={activeView === 'drops' ? 'page' : undefined}
          >
            <span className="desk-nav__icon" aria-hidden="true">⚡</span>
            Drop Radar
          </button>
        </div>

        <div className="desk-nav__footer">
          <div className={`live-indicator ${isLive ? 'live-indicator--active' : ''}`}>
            <span className="live-dot" aria-hidden="true" />
            {isLive ? 'Live Stream' : 'Connecting'}
          </div>
          <a href="/menu" className="desk-nav__menu-link">
            ← Wholesale Menu
          </a>
          <span className="desk-nav__menu-link" style={{ opacity: 0.6, cursor: 'default', fontSize: 'var(--text-xs)' }}>
            Ross Haley — CEO
          </span>
        </div>
      </nav>

      {/* ─ Main Content ─────────────────────────────────────────── */}
      <main className="desk-main" id="main-content">
        {activeView === 'orders' && (
          <div className="orders-view">
            {/* Money Today */}
            <div className="money-panel">
              <h3 className="panel-title">Money Today</h3>
              <div className="money-grid">
                <div className="money-card">
                  <span className="money-card__label">New Orders</span>
                  <span className="money-card__count">{counters.NEW ?? 0}</span>
                  <span className="money-card__value">
                    {formatCurrency(
                      orders
                        .filter((o) => o.status === 'NEW')
                        .reduce((s, o) => s + parseFloat(o.subtotal), 0)
                    )}
                  </span>
                </div>
                <div className="money-card money-card--confirmed">
                  <span className="money-card__label">Confirmed</span>
                  <span className="money-card__count">{counters.CONFIRMED ?? 0}</span>
                  <span className="money-card__value">
                    {formatCurrency(
                      orders
                        .filter((o) => o.status === 'CONFIRMED')
                        .reduce((s, o) => s + parseFloat(o.subtotal), 0)
                    )}
                  </span>
                </div>
                <div className="money-card money-card--danger">
                  <span className="money-card__label">Delivered Unpaid</span>
                  <span className="money-card__count">{counters.DELIVERED ?? 0}</span>
                  <span className="money-card__value">
                    {formatCurrency(
                      orders
                        .filter((o) => o.status === 'DELIVERED')
                        .reduce((s, o) => s + parseFloat(o.subtotal), 0)
                    )}
                  </span>
                </div>
                <div className="money-card money-card--success">
                  <span className="money-card__label">Collected</span>
                  <span className="money-card__count">{counters.PAID ?? 0}</span>
                  <span className="money-card__value">
                    {formatCurrency(
                      orders
                        .filter((o) => o.status === 'PAID')
                        .reduce((s, o) => s + parseFloat(o.subtotal), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
              <div className="orders-table-header">
                <h2 className="orders-table-title">Orders Desk Feed</h2>
                <div className="status-filter-tabs" role="tablist">
                  {(['ALL', ...STATUS_ORDER] as const).map((s) => (
                    <button
                      key={s}
                      className={`status-tab ${statusFilter === s ? 'status-tab--active' : ''}`}
                      onClick={() => setStatusFilter(s as OrderStatus | 'ALL')}
                      role="tab"
                    >
                      {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
                      {(counters[s] ?? 0) > 0 && (
                        <span className="status-tab__count">{counters[s]}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-scroll">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Buyer</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Lines</th>
                      <th>Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="table-empty">
                          No orders in this status.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          isSelected={selectedOrderId === order.id}
                          onClick={() =>
                            setSelectedOrderId(
                              selectedOrderId === order.id ? null : order.id
                            )
                          }
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'ar' && <ARGuardPanel />}

        {activeView === 'inventory' && (
          <div className="inventory-view">
            <BatchAgeGuardPanel items={inventory} />
          </div>
        )}

        {activeView === 'drops' && <DropRadarPanel />}
      </main>

      {/* ─ Order Detail Panel ───────────────────────────────────── */}
      {selectedOrder && activeView === 'orders' && (
        <OrderDetail
          order={selectedOrder}
          onStatusAdvance={advanceStatus}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}
