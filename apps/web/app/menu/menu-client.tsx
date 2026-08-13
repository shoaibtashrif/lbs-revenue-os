'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { NabisInventoryItem } from '@lbs/nabis'
import './menu.css'

// ─── Brand Configuration ─────────────────────────────────────────────────────

const BRAND_CONFIG: Record<
  string,
  { color: string; glow: string; account: string; description: string }
> = {
  'West Coast Treez': {
    color: 'var(--color-brand-wct)',
    glow: 'var(--color-brand-wct-glow)',
    account: 'house',
    description: 'House flower, small-batch, single-source.',
  },
  PUFF: {
    color: 'var(--color-brand-puff)',
    glow: 'var(--color-brand-puff-glow)',
    account: 'house',
    description: 'Pre-rolls and vapes from our own crop.',
  },
  Connected: {
    color: 'var(--color-brand-connected)',
    glow: 'var(--color-gold-glow)',
    account: 'premium',
    description: 'Premium allocation. Limited quantity. Moves fast.',
  },
  'Alien Labs': {
    color: 'var(--color-brand-alien)',
    glow: 'var(--color-brand-alien-glow)',
    account: 'premium',
    description: 'Top-tier genetics. Scarce. Buyer-tier prioritized.',
  },
  'Simply Cannabis': {
    color: 'var(--color-brand-simply)',
    glow: 'rgba(107, 159, 212, 0.15)',
    account: 'house',
    description: 'Consistent quality, accessible price point.',
  },
  'Self Baked': {
    color: 'var(--color-brand-self-baked)',
    glow: 'rgba(212, 149, 107, 0.15)',
    account: 'house',
    description: 'Craft edibles and concentrates.',
  },
  'High Desert Pure': {
    color: 'var(--color-brand-hdp)',
    glow: 'rgba(157, 123, 200, 0.15)',
    account: 'house',
    description: 'Desert-grown, sun-kissed, pure expression.',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBatchAgeDays(item: NabisInventoryItem): number | null {
  const ref = item.labResultDate ?? item.harvestDate
  if (!ref) return null
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((Date.now() - new Date(ref).getTime()) / msPerDay)
}

function getScarcityLevel(qty: number): 'out' | 'scarce' | 'low' | 'ok' {
  if (qty === 0) return 'out'
  if (qty <= 3) return 'scarce'
  if (qty <= 8) return 'low'
  return 'ok'
}

function isNewDrop(item: NabisInventoryItem): boolean {
  // "New" = in stock and labResultDate within 21 days
  if (!item.labResultDate || item.qtyOnHand === 0) return false
  const age = getBatchAgeDays(item)
  return age !== null && age <= 21
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

interface CartLine {
  item: NabisInventoryItem
  caseCount: number
}

// ─── Order form state ─────────────────────────────────────────────────────────

interface BuyerInfo {
  businessName: string
  licenseNumber: string
  contactName: string
  email: string
  phone: string
  notes: string
}

// ─── Components ──────────────────────────────────────────────────────────────

function ScarcityBadge({ qty }: { qty: number }) {
  const level = getScarcityLevel(qty)
  if (level === 'out') return <span className="badge badge--out">Sold Out</span>
  if (level === 'scarce')
    return (
      <span className="badge badge--scarce">
        <span className="badge-dot" />
        {qty} {qty === 1 ? 'case' : 'cases'} left
      </span>
    )
  if (level === 'low')
    return (
      <span className="badge badge--low">{qty} cases</span>
    )
  return <span className="badge badge--ok">{qty} cases</span>
}

function BatchAgeBadge({ item }: { item: NabisInventoryItem }) {
  const age = getBatchAgeDays(item)
  if (age === null) return null

  if (isNewDrop(item)) {
    return <span className="badge badge--new-drop">NEW DROP</span>
  }

  if (age > 45) {
    return (
      <span className="badge badge--aged" title={`${age} days since lab result`}>
        {age}d
      </span>
    )
  }

  return null
}

function BrandAccentBar({ brand }: { brand: string }) {
  const config = BRAND_CONFIG[brand]
  if (!config) return null
  return (
    <div
      className="brand-accent-bar"
      style={{ background: config.color }}
      aria-hidden="true"
    />
  )
}

function ProductCard({
  item,
  cartCount,
  onAddToCart,
}: {
  item: NabisInventoryItem
  cartCount: number
  onAddToCart: (item: NabisInventoryItem, count: number) => void
}) {
  const [qty, setQty] = useState(1)
  const scarcity = getScarcityLevel(item.qtyOnHand)
  const config = BRAND_CONFIG[item.brand] ?? {
    color: 'var(--color-gold)',
    glow: 'var(--color-gold-glow)',
  }
  const age = getBatchAgeDays(item)
  const isNew = isNewDrop(item)

  const handleAdd = () => {
    if (qty < 1 || qty > item.qtyOnHand) return
    onAddToCart(item, qty)
    setQty(1)
  }

  const sold = scarcity === 'out'

  return (
    <article
      className={`product-card ${sold ? 'product-card--sold-out' : ''} ${isNew ? 'product-card--new-drop' : ''}`}
      style={
        isNew
          ? { '--brand-glow': config.glow } as React.CSSProperties
          : undefined
      }
      aria-label={`${item.productName} by ${item.brand}`}
    >
      <BrandAccentBar brand={item.brand} />

      <div className="product-card__body">
        <div className="product-card__top">
          <div className="product-card__badges">
            <BatchAgeBadge item={item} />
            <ScarcityBadge qty={item.qtyOnHand} />
          </div>
          {cartCount > 0 && (
            <span className="product-card__in-cart">
              {cartCount}c in cart
            </span>
          )}
        </div>

        <div className="product-card__info">
          <p className="product-card__brand" style={{ color: config.color }}>
            {item.brand}
          </p>
          <h3 className="product-card__name">{item.productName}</h3>

          <div className="product-card__meta">
            {item.batchNumber && (
              <span className="meta-chip">Batch {item.batchNumber}</span>
            )}
            {item.thcPct !== null && (
              <span className="meta-chip">THC {item.thcPct}%</span>
            )}
            {item.category && (
              <span className="meta-chip">{item.category}</span>
            )}
            {age !== null && !isNew && age > 0 && (
              <span
                className={`meta-chip ${age > 45 ? 'meta-chip--aged' : ''}`}
              >
                {age}d old
              </span>
            )}
          </div>
        </div>

        <div className="product-card__pricing">
          <div className="price-group">
            <span className="price-label">Case price</span>
            <span className="price-case">
              ${parseFloat(item.casePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="price-group">
            <span className="price-label">Unit price</span>
            <span className="price-unit">
              ${parseFloat(item.unitPrice).toFixed(2)}
            </span>
          </div>
          <div className="price-group">
            <span className="price-label">Case size</span>
            <span className="price-unit">{item.caseSize} units</span>
          </div>
        </div>

        {!sold && (
          <div className="product-card__order">
            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={() => setQty(Math.max(1, qty - 1))}
                aria-label="Decrease case count"
              >
                −
              </button>
              <input
                type="number"
                className="qty-input"
                value={qty}
                min={1}
                max={item.qtyOnHand}
                step={1}
                onChange={(e) => {
                  const val = Math.max(
                    1,
                    Math.min(item.qtyOnHand, parseInt(e.target.value) || 1)
                  )
                  setQty(val)
                }}
                aria-label="Case count"
                id={`qty-${item.nabisId}`}
              />
              <button
                className="qty-btn"
                onClick={() => setQty(Math.min(item.qtyOnHand, qty + 1))}
                aria-label="Increase case count"
              >
                +
              </button>
              <span className="qty-label">
                {qty === 1 ? 'case' : 'cases'}
              </span>
            </div>
            <button
              className="btn-add-to-order"
              onClick={handleAdd}
              aria-label={`Add ${qty} case${qty > 1 ? 's' : ''} of ${item.productName} to order`}
            >
              Add to Order
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function BrandSection({
  brand,
  items,
  cart,
  onAddToCart,
}: {
  brand: string
  items: NabisInventoryItem[]
  cart: CartLine[]
  onAddToCart: (item: NabisInventoryItem, count: number) => void
}) {
  const config = BRAND_CONFIG[brand]
  const inStock = items.filter((i) => i.qtyOnHand > 0).length
  const hasNewDrop = items.some(isNewDrop)

  return (
    <section className="brand-section" aria-label={`${brand} products`}>
      <div className="brand-section__header">
        <div className="brand-section__title-group">
          <div
            className="brand-section__dot"
            style={{ background: config?.color ?? 'var(--color-gold)' }}
            aria-hidden="true"
          />
          <h2
            className="brand-section__name"
            style={{ color: config?.color ?? 'var(--color-text-primary)' }}
          >
            {brand}
          </h2>
          {hasNewDrop && (
            <span className="badge badge--new-drop badge--sm">DROP</span>
          )}
        </div>
        <div className="brand-section__meta">
          {config?.description && (
            <p className="brand-section__desc">{config.description}</p>
          )}
          <span className="brand-section__count">
            {inStock} of {items.length} SKUs in stock
          </span>
        </div>
      </div>

      <div className="product-grid">
        {items.map((item) => {
          const cartLine = cart.find(
            (c) => c.item.nabisId === item.nabisId
          )
          return (
            <ProductCard
              key={item.nabisId}
              item={item}
              cartCount={cartLine?.caseCount ?? 0}
              onAddToCart={onAddToCart}
            />
          )
        })}
      </div>
    </section>
  )
}

function CartSidebar({
  cart,
  onUpdate,
  onRemove,
  onSubmit,
}: {
  cart: CartLine[]
  onUpdate: (nabisId: string, count: number) => void
  onRemove: (nabisId: string) => void
  onSubmit: () => void
}) {
  const subtotal = cart.reduce(
    (sum, line) =>
      sum + parseFloat(line.item.casePrice) * line.caseCount,
    0
  )

  if (cart.length === 0) {
    return (
      <aside className="cart-sidebar cart-sidebar--empty">
        <div className="cart-empty">
          <p className="cart-empty__icon">○</p>
          <p className="cart-empty__text">No items selected</p>
          <p className="cart-empty__sub">Add cases from the menu</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="cart-sidebar">
      <div className="cart-header">
        <h2 className="cart-title">Your Order</h2>
        <span className="cart-count">{cart.length} line{cart.length > 1 ? 's' : ''}</span>
      </div>

      <div className="cart-lines">
        {cart.map((line) => (
          <div className="cart-line" key={line.item.nabisId}>
            <div className="cart-line__info">
              <p className="cart-line__name">{line.item.productName}</p>
              <p className="cart-line__brand">{line.item.brand}</p>
            </div>
            <div className="cart-line__qty">
              <button
                className="qty-btn qty-btn--sm"
                onClick={() =>
                  line.caseCount > 1
                    ? onUpdate(line.item.nabisId, line.caseCount - 1)
                    : onRemove(line.item.nabisId)
                }
                aria-label="Decrease"
              >
                −
              </button>
              <span className="qty-display">{line.caseCount}c</span>
              <button
                className="qty-btn qty-btn--sm"
                onClick={() =>
                  onUpdate(
                    line.item.nabisId,
                    Math.min(line.item.qtyOnHand, line.caseCount + 1)
                  )
                }
                aria-label="Increase"
              >
                +
              </button>
            </div>
            <div className="cart-line__total">
              $
              {(
                parseFloat(line.item.casePrice) * line.caseCount
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <button
              className="cart-line__remove"
              onClick={() => onRemove(line.item.nabisId)}
              aria-label={`Remove ${line.item.productName}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <span className="cart-subtotal__amount">
            $
            {subtotal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <p className="cart-note">
          Final pricing confirmed by lbs. upon order review.
        </p>
        <button
          className="btn-checkout"
          onClick={onSubmit}
          id="btn-submit-order"
        >
          Submit Order
        </button>
      </div>
    </aside>
  )
}

function OrderForm({
  cart,
  onClose,
  onSuccess,
}: {
  cart: CartLine[]
  onClose: () => void
  onSuccess: (orderNumber: string) => void
}) {
  const [buyer, setBuyer] = useState<BuyerInfo>({
    businessName: '',
    licenseNumber: '',
    contactName: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = cart.reduce(
    (sum, line) => sum + parseFloat(line.item.casePrice) * line.caseCount,
    0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      buyerBusinessName: buyer.businessName,
      buyerLicenseNumber: buyer.licenseNumber,
      buyerContactName: buyer.contactName,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone || undefined,
      notes: buyer.notes || undefined,
      lines: cart.map((line) => ({
        batchNabisId: line.item.nabisId,
        sku: line.item.sku,
        batchNumber: line.item.batchNumber,
        productName: line.item.productName,
        brand: line.item.brand,
        caseCount: line.caseCount,
        unitPrice: line.item.unitPrice,
        casePrice: line.item.casePrice,
        lineTotal: (
          parseFloat(line.item.casePrice) * line.caseCount
        ).toFixed(2),
      })),
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // Always parse the response body — never assume success from HTTP status
      const json = (await res.json()) as {
        success: boolean
        orderNumber?: string
        error?: string
      }

      if (!res.ok || !json.success) {
        setError(
          json.error ??
            'Your order could not be placed. Please try again or call us directly.'
        )
        return
      }

      onSuccess(json.orderNumber ?? 'confirmed')
    } catch {
      setError(
        'A network error occurred. Please check your connection and try again. Your order has NOT been placed.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="order-form-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Submit your order"
    >
      <div className="order-form-panel">
        <div className="order-form-header">
          <h2 className="order-form-title">Submit Order</h2>
          <button
            className="order-form-close"
            onClick={onClose}
            aria-label="Close order form"
          >
            ×
          </button>
        </div>

        <div className="order-form-body">
          {/* Order summary */}
          <div className="order-summary-block">
            <p className="text-label" style={{ marginBottom: 'var(--space-3)' }}>
              Order Summary
            </p>
            {cart.map((line) => (
              <div className="order-summary-line" key={line.item.nabisId}>
                <span>
                  {line.item.productName}{' '}
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    ×{line.caseCount}c
                  </span>
                </span>
                <span>
                  $
                  {(
                    parseFloat(line.item.casePrice) * line.caseCount
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
            <div className="order-summary-total">
              <span>Total</span>
              <span>
                $
                {subtotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <form
            id="order-form"
            className="buyer-form"
            onSubmit={handleSubmit}
          >
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="businessName">
                  Business Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="businessName"
                  className="form-input"
                  type="text"
                  required
                  placeholder="Green Leaf Dispensary"
                  value={buyer.businessName}
                  onChange={(e) =>
                    setBuyer({ ...buyer, businessName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="licenseNumber">
                  License Number <span aria-hidden="true">*</span>
                </label>
                <input
                  id="licenseNumber"
                  className="form-input"
                  type="text"
                  required
                  placeholder="C10-0000000-LIC"
                  value={buyer.licenseNumber}
                  onChange={(e) =>
                    setBuyer({ ...buyer, licenseNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="contactName">
                  Contact Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="contactName"
                  className="form-input"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={buyer.contactName}
                  onChange={(e) =>
                    setBuyer({ ...buyer, contactName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  required
                  placeholder="orders@yourdispensary.com"
                  value={buyer.email}
                  onChange={(e) =>
                    setBuyer({ ...buyer, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  className="form-input"
                  type="tel"
                  placeholder="(916) 555-0100"
                  value={buyer.phone}
                  onChange={(e) =>
                    setBuyer({ ...buyer, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                className="form-input form-textarea"
                placeholder="Delivery instructions, preferred contact time, etc."
                rows={3}
                value={buyer.notes}
                onChange={(e) =>
                  setBuyer({ ...buyer, notes: e.target.value })
                }
              />
            </div>

            {error && (
              <div
                className="form-error"
                role="alert"
                aria-live="assertive"
              >
                <strong>Order not placed.</strong> {error}
              </div>
            )}
          </form>
        </div>

        <div className="order-form-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Back to Menu
          </button>
          <button
            type="submit"
            form="order-form"
            className="btn-primary"
            disabled={submitting}
            id="btn-confirm-order"
          >
            {submitting ? (
              <span className="spinner" aria-hidden="true" />
            ) : null}
            {submitting ? 'Placing Order…' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderSuccess({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  return (
    <div className="order-form-overlay" role="dialog" aria-modal="true" aria-label="Order confirmed">
      <div className="order-form-panel order-success">
        <div className="success-icon" aria-hidden="true">✓</div>
        <h2 className="success-title">Order Received</h2>
        <p className="success-order-number">
          Order <strong>{orderNumber}</strong>
        </p>
        <p className="success-message">
          Your order has been recorded. Our team will confirm it with you
          within 1 business day.
        </p>
        <button className="btn-primary" onClick={onClose} id="btn-order-done">
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Main Menu Component ──────────────────────────────────────────────────────

export function MenuClient({ inventory: initialInventory = [] }: { inventory?: NabisInventoryItem[] }) {
  const safeInitial = Array.isArray(initialInventory) ? initialInventory : []
  const [liveInventory, setLiveInventory] = useState<NabisInventoryItem[]>(safeInitial)
  const [cart, setCart] = useState<CartLine[]>([])
  const [showForm, setShowForm] = useState(false)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [filterBrand, setFilterBrand] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showInStockOnly, setShowInStockOnly] = useState(false)

  // Fetch live inventory from /api/inventory
  const fetchLiveInventory = useCallback(() => {
    fetch('/api/inventory')
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data: { items?: NabisInventoryItem[] } | null) => {
        if (data && data.items && data.items.length > 0) {
          setLiveInventory(data.items)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchLiveInventory()
    const interval = setInterval(fetchLiveInventory, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveInventory])

  const currentInventory = (liveInventory && liveInventory.length > 0) ? liveInventory : safeInitial

  // Group inventory by brand
  const brandGroups = useMemo(() => {
    const filtered = currentInventory.filter((item) => {
      if (filterBrand && item.brand !== filterBrand) return false
      if (filterCategory && item.category !== filterCategory) return false
      if (showInStockOnly && item.qtyOnHand === 0) return false
      return true
    })

    const groups: Record<string, NabisInventoryItem[]> = {}
    filtered.forEach((item) => {
      if (!groups[item.brand]) groups[item.brand] = []
      groups[item.brand].push(item)
    })

    // Premium brands first (Connected, Alien Labs), then house brands alphabetically
    const premiumOrder = ['Connected', 'Alien Labs']
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = premiumOrder.indexOf(a)
      const bi = premiumOrder.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.localeCompare(b)
    })
  }, [currentInventory, filterBrand, filterCategory, showInStockOnly])

  const brands = useMemo(
    () => [...new Set(currentInventory.map((i) => i.brand))].sort(),
    [currentInventory]
  )

  const categories = useMemo(
    () =>
      [
        ...new Set(
          currentInventory.map((i) => i.category).filter(Boolean)
        ),
      ].sort() as string[],
    [currentInventory]
  )

  const newDropCount = useMemo(
    () => currentInventory.filter(isNewDrop).length,
    [currentInventory]
  )

  const addToCart = useCallback(
    (item: NabisInventoryItem, count: number) => {
      setCart((prev) => {
        const existing = prev.findIndex(
          (c) => c.item.nabisId === item.nabisId
        )
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = {
            ...updated[existing],
            caseCount: Math.min(
              item.qtyOnHand,
              updated[existing].caseCount + count
            ),
          }
          return updated
        }
        return [...prev, { item, caseCount: count }]
      })
    },
    []
  )

  const updateCartLine = useCallback(
    (nabisId: string, count: number) => {
      setCart((prev) =>
        prev.map((line) =>
          line.item.nabisId === nabisId
            ? { ...line, caseCount: count }
            : line
        )
      )
    },
    []
  )

  const removeCartLine = useCallback((nabisId: string) => {
    setCart((prev) => prev.filter((line) => line.item.nabisId !== nabisId))
  }, [])

  const handleOrderSuccess = useCallback((orderNumber: string) => {
    setShowForm(false)
    setCart([])
    setSuccessOrder(orderNumber)
    fetchLiveInventory()
  }, [fetchLiveInventory])

  return (
    <div className="menu-root" suppressHydrationWarning>
      {/* ─ Header ─────────────────────────────────────────────────── */}
      <header className="menu-header">
        <div className="menu-header__inner">
          <a href="/" className="lbs-wordmark" aria-label="lbs. Distribution home">
            lbs.
          </a>
          <div className="menu-header__center">
            <span className="menu-header__title">Wholesale Menu</span>
            {newDropCount > 0 && (
              <span className="menu-header__drop-alert" role="status">
                {newDropCount} new drop{newDropCount > 1 ? 's' : ''} available
              </span>
            )}
          </div>
          <div className="menu-header__right">
            <a href="/desk" className="menu-nav-link" id="link-header-desk">
              Order Desk
            </a>
            {cart.length > 0 && (
              <button
                className="cart-trigger"
                onClick={() => setShowForm(true)}
                aria-label={`View order — ${cart.length} items`}
                id="btn-view-cart"
              >
                <span className="cart-trigger__count">{cart.length}</span>
                Review Order
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─ Filters ────────────────────────────────────────────────── */}
      <div className="menu-filters" role="search" aria-label="Filter products">
        <div className="menu-filters__inner">
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-brand">Brand</label>
            <select
              id="filter-brand"
              className="filter-select"
              value={filterBrand ?? ''}
              onChange={(e) =>
                setFilterBrand(e.target.value || null)
              }
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              className="filter-select"
              value={filterCategory ?? ''}
              onChange={(e) =>
                setFilterCategory(e.target.value || null)
              }
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <label className="filter-toggle" htmlFor="filter-in-stock">
            <input
              id="filter-in-stock"
              type="checkbox"
              checked={showInStockOnly}
              onChange={(e) => setShowInStockOnly(e.target.checked)}
            />
            <span>In Stock Only</span>
          </label>

          {(filterBrand || filterCategory || showInStockOnly) && (
            <button
              className="filter-clear"
              onClick={() => {
                setFilterBrand(null)
                setFilterCategory(null)
                setShowInStockOnly(false)
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ─ Main layout ────────────────────────────────────────────── */}
      <main className="menu-main" id="main-content">
        <div className="menu-catalog">
          {currentInventory.length === 0 ? (
            <div className="menu-empty" role="status">
              <p>Inventory is currently loading. Please refresh in a moment.</p>
            </div>
          ) : brandGroups.length === 0 ? (
            <div className="menu-empty" role="status">
              <p>No products match your current filters.</p>
            </div>
          ) : (
            brandGroups.map(([brand, items]) => (
              <BrandSection
                key={brand}
                brand={brand}
                items={items}
                cart={cart}
                onAddToCart={addToCart}
              />
            ))
          )}
        </div>

        <CartSidebar
          cart={cart}
          onUpdate={updateCartLine}
          onRemove={removeCartLine}
          onSubmit={() => setShowForm(true)}
        />
      </main>

      {/* ─ Footer ─────────────────────────────────────────────────── */}
      <footer className="menu-footer" role="contentinfo">
        <p>
          <strong>lbs. Distribution</strong> — For licensed cannabis retailers only.
          Must be 21+ with a valid California or New York cannabis retail license
          to place orders. Prices by the case. No partial cases.
          All orders subject to confirmation.
        </p>
      </footer>

      {/* ─ Modals ─────────────────────────────────────────────────── */}
      {showForm && !successOrder && (
        <OrderForm
          cart={cart}
          onClose={() => setShowForm(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {successOrder && (
        <OrderSuccess
          orderNumber={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}

      {/* Live region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      />
    </div>
  )
}
