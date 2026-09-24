import React, { useState, useEffect } from 'react';

const CustomerDetail = ({ initialCustomerName }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState(initialCustomerName || '');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch list of all customers
  useEffect(() => {
    fetch('http://localhost:3000/customers')
      .then(res => res.json())
      .then(data => {
        setCustomersList(data);
        if (data.length > 0 && !selectedCustomerName) {
          setSelectedCustomerName(data[0].name);
        } else if (data.length === 0) {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch customers list:', err);
        setLoading(false);
      });
  }, [selectedCustomerName]);

  // Fetch specific customer details when selectedCustomerName changes
  useEffect(() => {
    if (!selectedCustomerName) return;
    
    setLoading(true);
    fetch(`http://localhost:3000/customers/${selectedCustomerName}`)
      .then(res => res.json())
      .then(data => {
        setCustomer(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch customer:', err);
        setLoading(false);
      });
  }, [selectedCustomerName]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'schema', label: 'Schema' },
    { id: 'quality', label: 'Data Quality' },
    { id: 'config', label: 'Configuration' },
    { id: 'activity', label: 'Activity' }
  ];

  if (loading && customersList.length === 0) {
    return <div className="customer-detail-container" style={{ padding: '60px', textAlign: 'center' }}>Loading customer data...</div>;
  }

  if (customersList.length === 0) {
    return <div className="customer-detail-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      No customers found in the database.
    </div>;
  }

  return (
    <div className="customer-detail-container">
      {/* Header */}
      <div className="customer-header">
        <div className="customer-header-main">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
              <select 
                className="input-field" 
                style={{ fontSize: '1.25rem', fontWeight: '600', width: 'auto', padding: '4px 8px', border: 'none', background: 'transparent', borderBottom: '2px solid var(--surface-border)', borderRadius: 0, color: 'var(--primary-color)', cursor: 'pointer', outline: 'none' }}
                value={selectedCustomerName}
                onChange={(e) => setSelectedCustomerName(e.target.value)}
              >
                {customersList.map(c => (
                  <option key={c.id} value={c.name} style={{ fontSize: '1rem', fontWeight: '400', textTransform: 'capitalize' }}>
                    {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {loading ? (
              <div className="customer-meta" style={{ color: 'var(--text-muted)' }}>Loading details...</div>
            ) : customer && !customer.error ? (
              <div className="customer-meta">
                <span className="customer-id">Customer ID: {customer.id}</span>
                <span className="customer-status"><span className="status-dot">●</span> {customer.status}</span>
              </div>
            ) : (
              <div className="customer-meta" style={{ color: 'var(--error-color)' }}>{customer?.error || 'Customer data unavailable'}</div>
            )}
          </div>
          <div className="customer-actions">
            <button className="btn btn-primary" onClick={() => alert('Starting a new manual onboarding job...')}>Start Onboarding</button>
            <button className="btn btn-outline" onClick={() => alert('Opening full configuration JSON...')}>Configuration</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="customer-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`customer-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="customer-content">
        {activeTab === 'overview' && !loading && customer && !customer.error && (
          <div className="customer-overview-layout">
            <div className="overview-main">
              <div className="dashboard-panel">
                <h3 className="panel-title">Overview</h3>
                <div className="customer-stats-grid">
                  <div className="customer-stat">
                    <span className="stat-label">Total records</span>
                    <span className="stat-value">{customer.totalRecords.toLocaleString()}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Last successful ingestion</span>
                    <span className="stat-value">{customer.lastSuccessful ? new Date(customer.lastSuccessful).toLocaleString() : 'None'}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Last failed ingestion</span>
                    <span className="stat-value">{customer.lastFailed ? new Date(customer.lastFailed).toLocaleString() : 'None'}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Average quality</span>
                    <span className="stat-value text-success">{customer.avgQuality}%</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Source systems</span>
                    <span className="stat-value">{customer.sourceSystems.join(', ')}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Current schema version</span>
                    <span className="stat-value">{customer.schemaVersion}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-label">Customer health</span>
                    <span className="stat-value text-success">{customer.health}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-sidebar">
              <div className="dashboard-panel">
                <h3 className="panel-title">Data Pipeline Health</h3>
                <div className="health-indicators">
                  <div className="health-item">
                    <span className="health-label">Ingestion</span>
                    <span className="health-status healthy"><span className="status-dot">●</span> {customer.pipelineHealth.ingestion}</span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Schema</span>
                    <span className="health-status healthy"><span className="status-dot">●</span> {customer.pipelineHealth.schema}</span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Validation</span>
                    <span className="health-status healthy"><span className="status-dot">●</span> {customer.pipelineHealth.validation}</span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Database</span>
                    <span className="health-status healthy"><span className="status-dot">●</span> {customer.pipelineHealth.database}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="dashboard-panel">
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>{tabs.find(t => t.id === activeTab)?.label} placeholder</h3>
              <p>This view is under construction.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
