export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStoreARAccounts } from '../store'

export async function GET() {
  const arAccounts = getStoreARAccounts()
  return NextResponse.json({
    arAccounts,
    polledAt: new Date().toISOString(),
  })
}
