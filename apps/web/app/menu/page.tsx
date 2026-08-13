import type { Metadata } from 'next'
import { MenuClient } from './menu-client'
import './menu.css'

export const metadata: Metadata = {
  title: 'Wholesale Menu',
  description: 'lbs. Distribution wholesale ordering menu.',
  robots: { index: false, follow: false },
}

export default function MenuPage() {
  return <MenuClient />
}
