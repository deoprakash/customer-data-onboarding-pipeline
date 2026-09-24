import React, { useState, useEffect } from 'react';

export default function SchemaHistory({ customerName, customers = [], onCustomerChange }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [viewingVersion, setViewingVersion] = useState(null);
  const [comparingVersion, setComparingVersion] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/configs/${customerName}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerName) fetchHistory();
  }, [customerName]);

  const handleRollback = async (version) => {
    if (!window.confirm(`Are you sure you want to roll back to Version ${version}?`)) return;
    try {
      setIsRollingBack(true);
      const res = await fetch(`http://localhost:3000/configs/${customerName}/rollback/${version}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to rollback');
      await fetchHistory();
      alert(`Successfully rolled back to Version ${version}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  if (error) return <div style={{ color: 'var(--error-color)', padding: '16px' }}>{error}</div>;

  const publishedVersion = history.find(h => h.status === 'Published');

  return (
    <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease', position: 'relative' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {customers && customers.length > 0 && onCustomerChange && (
              <select 
                className="input-field" 
                style={{ fontSize: '0.9rem', padding: '4px 8px', minWidth: '150px' }}
                value={customerName || ''}
                onChange={(e) => onCustomerChange(e.target.value)}
              >
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>
                ))}
              </select>
            )}
          </h2>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
          No version history found. Save a schema mapping to create history.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((item, idx) => (
            <div key={idx} style={{ 
              background: 'var(--bg-color)', 
              padding: '20px', 
              borderRadius: '12px', 
              border: item.status === 'Published' ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Version {item.version}</h3>
                  <span className={`badge ${item.status === 'Published' ? 'badge-success' : 'badge-neutral'}`}>
                    {item.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Updated by <strong>{item.author}</strong> on {item.date}
                </p>
                
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {item.changes && item.changes.map((change, cIdx) => (
                    <li key={cIdx}>{change}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.status !== 'Published' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => handleRollback(item.version)}
                    disabled={isRollingBack}
                  >
                    Roll back to this
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--surface-border)' }}
                  onClick={() => setComparingVersion(item)}
                  disabled={!publishedVersion || item.version === publishedVersion.version}
                >
                  Compare with Published
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--surface-border)' }}
                  onClick={() => setViewingVersion(item)}
                >
                  View JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewingVersion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Version {viewingVersion.version} Configuration</h3>
              <button onClick={() => setViewingVersion(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem' }}>
              {JSON.stringify(viewingVersion.config, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {comparingVersion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '1000px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Comparing Version {comparingVersion.version} with Published (Version {publishedVersion?.version})</h3>
              <button onClick={() => setComparingVersion(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '8px', color: 'var(--error-color)' }}>Version {comparingVersion.version}</h4>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
                  {JSON.stringify(comparingVersion.config, null, 2)}
                </pre>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '8px', color: 'var(--success-color)' }}>Published Version</h4>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
                  {JSON.stringify(publishedVersion?.config, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
