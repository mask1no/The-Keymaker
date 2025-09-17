export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>The Keymaker</h1>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          System Status
        </h2>
        <p>✅ App is running</p>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Endpoints
        </h2>
        <ul>
          <li>
            <a href="/api/health" style={{ color: 'blue', textDecoration: 'underline' }}>
              Health
            </a>
          </li>
          <li>
            <a href="/api/jito/tipfloor" style={{ color: 'blue', textDecoration: 'underline' }}>
              Jito Tipfloor
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
