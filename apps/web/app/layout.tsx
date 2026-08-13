import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'lbs. Distribution',
    template: '%s | lbs. Distribution',
  },
  description:
    'lbs. Distribution — premium cannabis wholesale distribution. West Coast Treez, PUFF, Connected, and Alien Labs.',
  robots: {
    index: false, // Internal system — not for public indexing
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
