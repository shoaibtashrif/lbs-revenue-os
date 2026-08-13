/**
 * Batch Age Guard — Background Worker
 *
 * Runs on a cron schedule, evaluates all active batches,
 * and creates BatchAgeAlert records for aged inventory.
 *
 * Phase 2 of lbs. Revenue OS.
 */

interface BatchAgeConfig {
  warnDays: number     // Default: 30
  escalateDays: number // Default: 45
  criticalDays: number // Default: 60
}

const DEFAULT_CONFIG: BatchAgeConfig = {
  warnDays: 30,
  escalateDays: 45,
  criticalDays: 60,
}

interface BatchForAgeCheck {
  id: string
  productName: string
  brand: string
  qtyOnHand: number
  casePrice: string
  harvestDate: string | null
  labResultDate: string | null
}

export interface AgingBatch {
  batchId: string
  productName: string
  brand: string
  ageDays: number
  qtyOnHand: number
  valueAtRisk: number  // ageDays * qtyOnHand * casePrice — risk score
  severity: 'warn' | 'escalate' | 'critical'
  suggestedAction: string
}

/**
 * Calculate the age of a batch in days.
 * Uses labResultDate if available, falls back to harvestDate.
 * Returns null if neither is available.
 */
function getBatchAgeDays(batch: BatchForAgeCheck): number | null {
  const ref = batch.labResultDate ?? batch.harvestDate
  if (!ref) return null
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Determine the suggested action for an aging batch.
 * Logic is conservative and operational, not legal.
 */
function getSuggestedAction(
  severity: 'warn' | 'escalate' | 'critical',
  batch: BatchForAgeCheck
): string {
  const qtyStr = `${batch.qtyOnHand} case${batch.qtyOnHand !== 1 ? 's' : ''}`

  if (severity === 'critical') {
    return `Consider deep price discount on ${qtyStr} — value at risk increasing daily.`
  }

  if (severity === 'escalate') {
    return `Push ${qtyStr} to Tier B/C buyers. Consider bundle with fast-moving SKU.`
  }

  // warn
  return `Monitor ${qtyStr}. Mention to top accounts on next touchpoint.`
}

/**
 * Rank batches by "value at risk" = age × qty × case price.
 * Higher score = more urgent.
 */
export function rankAgingBatches(
  batches: BatchForAgeCheck[],
  config: BatchAgeConfig = DEFAULT_CONFIG
): AgingBatch[] {
  const results: AgingBatch[] = []

  for (const batch of batches) {
    if (batch.qtyOnHand === 0) continue // Out of stock — no longer at risk

    const ageDays = getBatchAgeDays(batch)
    if (ageDays === null) continue

    let severity: 'warn' | 'escalate' | 'critical' | null = null

    if (ageDays >= config.criticalDays) severity = 'critical'
    else if (ageDays >= config.escalateDays) severity = 'escalate'
    else if (ageDays >= config.warnDays) severity = 'warn'

    if (!severity) continue

    const casePrice = parseFloat(batch.casePrice)
    const valueAtRisk = ageDays * batch.qtyOnHand * casePrice

    results.push({
      batchId: batch.id,
      productName: batch.productName,
      brand: batch.brand,
      ageDays,
      qtyOnHand: batch.qtyOnHand,
      valueAtRisk,
      severity,
      suggestedAction: getSuggestedAction(severity, batch),
    })
  }

  // Sort: critical first, then by value at risk descending
  return results.sort((a, b) => {
    const severityOrder = { critical: 0, escalate: 1, warn: 2 }
    const sA = severityOrder[a.severity]
    const sB = severityOrder[b.severity]
    if (sA !== sB) return sA - sB
    return b.valueAtRisk - a.valueAtRisk
  })
}
