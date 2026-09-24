import React from 'react';

export default function Integrations() {
  const [connectedSources, setConnectedSources] = React.useState([]);
  const [availableIntegrations, setAvailableIntegrations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('http://localhost:3000/integrations')
      .then(res => res.json())
      .then(data => {
        setConnectedSources(data.connectedSources || []);
        setAvailableIntegrations(data.availableIntegrations || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch integrations:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="dashboard-panel" style={{ padding: '60px', textAlign: 'center' }}>Loading integrations...</div>;
  }

  return (
    <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="panel-title">Source Integrations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage connections to external data sources.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Starting integration OAuth flow...')}>
          <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>+</span> 
          Add Integration
        </button>
      </div>

      <div className="mb-8">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '2px solid var(--surface-border)', paddingBottom: '8px' }}>
          Connected Sources
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {connectedSources.map((source, idx) => (
            <div key={idx} style={{ 
              background: 'var(--bg-color)', 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{source.icon}</span>
                <span style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: '500' }}>✓ {source.status}</span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{source.name}</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type: {source.type}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Available Integrations (Coming Soon)
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableIntegrations.map((int, idx) => (
            <span key={idx} style={{ 
              padding: '6px 12px', 
              background: 'var(--surface-color)', 
              border: '1px solid var(--surface-border)', 
              borderRadius: '20px', 
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              {int}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
