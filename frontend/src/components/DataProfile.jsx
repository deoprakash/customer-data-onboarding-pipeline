import { useState, useEffect } from 'react';

export default function DataProfile({ jobId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        if (!jobId) {
          setError("No job selected to profile.");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:3000/jobs/${jobId}/profile`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch data profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [jobId]);

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  if (error) return <div style={{ color: 'var(--error-color)', padding: '16px' }}>{error}</div>;
  if (!profile) return null;

  return (
    <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="mb-6">
        <h2 className="panel-title">Data Profiling</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Job ID: {jobId}</p>
      </div>

      <div className="mb-6">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Dataset summary</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
            <div className="stat-label">Rows</div>
            <div className="stat-value">{profile.row_count.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
            <div className="stat-label">Columns</div>
            <div className="stat-value">{profile.column_count}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
            <div className="stat-label">File size</div>
            <div className="stat-value">{profile.file_size_mb} MB</div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Column profile</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Column</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Type</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Nulls</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Unique</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Example</th>
              </tr>
            </thead>
            <tbody>
              {profile.columns.map((col, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--primary-color)' }}>{col.name}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {col.data_type === 'object' ? 'String' : col.data_type === 'int64' ? 'Integer' : col.data_type === 'float64' ? 'Float' : col.data_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ color: col.null_count > 0 ? 'var(--error-color)' : 'var(--text-main)' }}>
                      {col.null_count.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{col.unique_count.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
