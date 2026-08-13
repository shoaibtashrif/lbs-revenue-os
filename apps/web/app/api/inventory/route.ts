export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStoreInventory } from '../store'
import { createNabisClient } from '@lbs/nabis'

export async function GET() {
  const isMock = process.env.MOCK_NABIS !== 'false'

  if (isMock) {
    // Return live inventory from shared store (with updated decremented case counts!)
    const items = getStoreInventory()
    return NextResponse.json({
      items,
      fromCache: false,
      isMock: true,
      polledAt: new Date().toISOString(),
    })
  }

  try {
    const client = createNabisClient()
    const { allItems } = await client.pollBothAccounts()

    return NextResponse.json({
      items: allItems,
      fromCache: false,
      isMock: false,
      polledAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[/api/inventory] Poll error:', err)
    const items = getStoreInventory()
    return NextResponse.json({ items, degraded: true }, { status: 200 })
  }
}
