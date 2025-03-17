// app/page.js - Homepage
export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5' 
    }}>
      <div style={{
        maxWidth: '800px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#0070f3', marginTop: 0 }}>Tierd - Product Ranking App</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
          This is a minimal deployment version of the Tierd application.
        </p>
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/test-app-router" 
            style={{
              display: 'inline-block',
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Test App Router
          </a>
        </div>
      </div>
    </div>
  )
}
