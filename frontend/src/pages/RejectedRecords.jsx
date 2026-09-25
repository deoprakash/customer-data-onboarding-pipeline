import { useState, useEffect } from 'react';

export default function RejectedRecords({ customerName, jobId, customers = [], onCustomerChange }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterErrorType, setFilterErrorType] = useState('');
  const [filterField, setFilterField] = useState('');

  const [currentJobId, setCurrentJobId] = useState(jobId);

  useEffect(() => {
    if (jobId) {
      setCurrentJobId(jobId);
    }
  }, [jobId]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        let url;
        
        if (currentJobId) {
          url = `http://localhost:3000/jobs/${currentJobId}/rejected`;
        } else if (customerName) {
          url = `http://localhost:3000/jobs/customer/${customerName}/rejected`;
        } else {
          setLoading(false);
          return;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch rejected records');
        
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [currentJobId, customerName]);

  const filteredRecords = records.filter(record => {
    if (filterErrorType && !record.error.toLowerCase().includes(filterErrorType.toLowerCase())) return false;
    if (filterField && !record.field.toLowerCase().includes(filterField.toLowerCase())) return false;
    return true;
  });

  const uniqueErrorTypes = [...new Set(records.map(r => r.error))];
  const uniqueFields = [...new Set(records.map(r => r.field))];

  return (
    <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          Rejected Records {currentJobId ? `(Job: ${currentJobId})` : (customerName ? `(Customer: ${customerName})` : '')}
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
        <div className="flex gap-4">
          <button className="btn btn-secondary" onClick={() => alert('Generating CSV download...')}>Download CSV</button>
          <button className="btn btn-primary" onClick={() => alert('Retrying selected records...')}>Retry Selected</button>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px' }}>
        <div>
          <label className="input-label" style={{ fontSize: '0.85rem' }}>Error Type</label>
          <select 
            className="input-field" 
            style={{ width: '200px', padding: '8px' }}
            value={filterErrorType}
            onChange={(e) => setFilterErrorType(e.target.value)}
          >
            <option value="">All Errors</option>
            {uniqueErrorTypes.map(err => <option key={err} value={err}>{err}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label" style={{ fontSize: '0.85rem' }}>Field</label>
          <select 
            className="input-field" 
            style={{ width: '200px', padding: '8px' }}
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
          >
            <option value="">All Fields</option>
            {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="spinner"></div></div>
      ) : error ? (
        <div style={{ color: 'var(--error-color)', padding: '16px' }}>{error}</div>
      ) : records.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No rejected records found for this job.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Row</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Customer ID</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Field</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Error</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Value</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 8px' }}>{record.row}</td>
                  <td style={{ padding: '12px 8px' }}>{record.customer}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{record.field}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--error-color)' }}>{record.error}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <code style={{ background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>
                      {record.value || 'null'}
                    </code>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className="badge badge-failed">{record.status || 'Rejected'}</span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => {
                      const newVal = window.prompt(`Enter new value for ${record.field} (current: ${record.value}):`);
                      if (newVal) alert(`Value updated to: ${newVal}. Ready for retry.`);
                    }}>Fix</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredRecords.length} of {records.length} rejected records
          </div>
        </div>
      )}
    </div>
  );
}
