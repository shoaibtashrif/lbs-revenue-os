'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0d0d0d', color: '#fff', fontFamily: 'sans-serif', margin: 0, padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ffd700' }}>lbs. Revenue OS System Alert</h2>
        <p style={{ color: '#a0a0a0' }}>Application state reloaded cleanly.</p>
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
          Reload App
        </button>
      </body>
    </html>
  )
}
