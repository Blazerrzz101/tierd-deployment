// app/test-app-router/page.js - Test page
export default function TestPage() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f9ff' 
    }}>
      <div style={{
        maxWidth: '800px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#0070f3', marginTop: 0 }}>🎉 App Router is Working!</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
          This page confirms that the App Router is functioning correctly.
          The app is using Next.js 14 with the App Router architecture.
        </p>
        <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Environment Info:</h3>
          <p style={{ margin: 0 }}>Next.js 14.2.23</p>
          <p style={{ margin: 0 }}>Node {process.env.NODE_VERSION || '18.x'}</p>
          <p style={{ margin: 0 }}>Deployment: Vercel</p>
        </div>
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/" 
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
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
