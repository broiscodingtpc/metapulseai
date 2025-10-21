export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          MetaPulse AI Bot — $PULSEAI
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Feel the pulse before the market does.
        </p>
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Status</h2>
          <p style={{ fontSize: '1.2rem' }}>✅ Online and Operational</p>
          <p style={{ fontSize: '1rem', opacity: 0.8 }}>
            AI-powered market intelligence system built on Solana
          </p>
        </div>
      </div>
    </div>
  );
}