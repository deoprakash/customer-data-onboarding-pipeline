import React, { useState, useEffect } from 'react';

const CustomerList = ({ onViewCustomer, onNavigate }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Add Customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    fetch('http://localhost:3000/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch customers:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    
    setIsSubmitting(true);
    setAddError(null);
    
    try {
      const res = await fetch('http://localhost:3000/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName.trim() })
      });
      
      if (!res.ok) throw new Error('Failed to add customer');
      
      setShowAddModal(false);
      setNewCustomerName('');
      fetchCustomers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableCustomer = async (customerName) => {
    if (!window.confirm(`Are you sure you want to disable ${customerName}? This will hide them from this view.`)) return;
    
    try {
      const res = await fetch(`http://localhost:3000/customers/${encodeURIComponent(customerName)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to disable customer');
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleDropdown = (id) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(id);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading customers...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Customer Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            View and manage your data onboarding customers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Add Customer</button>
      </div>

      <div className="customer-list-grid">
        {customers.map(customer => (
          <div key={customer.id} className="customer-list-card">
            <div className="customer-card-header">
              <div>
                <h3 className="customer-card-title">{customer.name}</h3>
                <span className="customer-status"><span className="status-dot">●</span> {customer.status}</span>
              </div>
              <div className="customer-card-actions">
                <button 
                  className="icon-button" 
                  onClick={() => toggleDropdown(customer.id)}
                  title="Actions"
                >
                  ⋮
                </button>
                {openDropdown === customer.id && (
                  <div className="action-dropdown">
                    <button className="dropdown-item" onClick={() => onViewCustomer(customer.name)}>View customer</button>
                    <button className="dropdown-item" onClick={() => onNavigate('upload', customer.name)}>Start onboarding</button>
                    <button className="dropdown-item" onClick={() => onNavigate('track', customer.name)}>View jobs</button>
                    <button className="dropdown-item" onClick={() => onNavigate('schemaMapping', customer.name)}>View schema</button>
                    <button className="dropdown-item" onClick={() => onNavigate('config', customer.name)}>View configuration</button>
                    <button className="dropdown-item" onClick={() => onNavigate('config', customer.name)}>Edit configuration</button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-error" onClick={() => handleDisableCustomer(customer.name)}>Disable customer</button>
                  </div>
                )}
              </div>
            </div>

            <div className="customer-card-body">
              <div className="customer-card-stat">
                <span className="stat-label">Last sync</span>
                <span className="stat-value text-accent">{customer.lastSync ? new Date(customer.lastSync).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Never'}</span>
              </div>
              <div className="customer-card-stat">
                <span className="stat-label">Records</span>
                <span className="stat-value">{customer.totalRecords.toLocaleString()}</span>
              </div>
              <div className="customer-card-stat">
                <span className="stat-label">Quality</span>
                <span className="stat-value text-success">{customer.avgQuality}%</span>
              </div>
              <div className="customer-card-stat">
                <span className="stat-label">Source</span>
                <span className="stat-value">{customer.source}</span>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>No customers found.</div>
        )}
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Add New Customer</h3>
            <form onSubmit={handleAddCustomer}>
              <div className="input-group">
                <label className="input-label">Customer Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Globex Corp"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {addError && <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '16px' }}>{addError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newCustomerName.trim()}>
                  {isSubmitting ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
