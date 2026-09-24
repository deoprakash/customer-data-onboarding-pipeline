import React, { useState, useEffect } from 'react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:3000/logs');
        if (!res.ok) throw new Error('Failed to fetch activity logs');
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '40px' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Activity Logs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          System-wide audit trail of all data operations and configuration changes.
        </p>
      </div>

      <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : error ? (
          <div style={{ color: 'var(--error-color)', padding: '16px' }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent activity found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>Time</th>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>User</th>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>Action</th>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>Entity Type</th>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>Entity ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '500' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(log.created_at)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-neutral">{log.user_name}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{log.action}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{log.entity_type}</td>
                    <td style={{ padding: '12px 8px' }}>{log.entity_id}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <pre style={{ margin: 0, fontSize: '0.8rem', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {JSON.stringify(log.details)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
