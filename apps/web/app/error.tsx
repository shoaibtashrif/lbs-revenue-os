'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Revenue OS Error Boundary]', error)
  }, [error])

  return (
    <div style={{ padding: '40px', background: '#0d0d0d', color: '#fff', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#ffd700' }}>lbs. Revenue OS</h2>
      <p style={{ margin: '16px 0', color: '#a0a0a0' }}>Something unexpected occurred. Click below to reload.</p>
      <button
        onClick={() => reset()}
        style={{
          background: '#ffd700',
          color: '#000',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Refresh Application
      </button>
    </div>
  )
}
