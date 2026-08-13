import type { Metadata } from 'next'
import { DeskClient } from './desk-client'
import './desk.css'

export const metadata: Metadata = {
  title: 'Order Desk',
  description: 'lbs. Distribution internal order management.',
  robots: { index: false, follow: false },
}

export default function DeskPage() {
  return <DeskClient />
}
