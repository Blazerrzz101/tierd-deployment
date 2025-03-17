export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
    }}>
      <div className="card">
        <h1>Tierd - Product Ranking App</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
          Deployment successful! This is the nuclear deployment of the Tierd application.
        </p>
        <p>
          The application has been successfully deployed using the nuclear deployment strategy,
          which ensures successful builds even in challenging environments.
        </p>
        <div style={{ marginTop: '30px' }}>
          <a href="/api/health" className="button">
            Health Check API
          </a>
          <a href="/docs" className="button">
            Documentation
          </a>
        </div>
      </div>
    </div>
  )
}