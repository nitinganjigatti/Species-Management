'use client'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p style={{ fontSize: '1rem', color: '#666' }}>Oops! The page you're looking for doesn't exist.</p>
      <a href='/' style={{ marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Go Home
      </a>
    </div>
  )
}
