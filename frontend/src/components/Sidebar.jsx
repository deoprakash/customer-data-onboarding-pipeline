import React, { useState, useEffect } from 'react';

const Sidebar = ({ activeTab, onNavigate }) => {
  const [systemStatus, setSystemStatus] = useState('Checking...');
  const [isOperational, setIsOperational] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') {
          setSystemStatus('System Operational');
          setIsOperational(true);
        } else {
          setSystemStatus('System Degraded');
          setIsOperational(false);
        }
      })
      .catch(err => {
        setSystemStatus('System Offline');
        setIsOperational(false);
      });
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>◈ DataOnboard</h2>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">OVERVIEW</h3>
          <ul className="sidebar-nav">
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                ▣ Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => onNavigate('customers')}
              >
                ◉ Customers
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'track' ? 'active' : ''}`}
                onClick={() => onNavigate('track')}
              >
                ⚡ Jobs
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">DATA OPERATIONS</h3>
          <ul className="sidebar-nav">
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => onNavigate('upload')}
              >
                ⇧ Upload Data
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'schemaMapping' ? 'active' : ''}`}
                onClick={() => onNavigate('schemaMapping')}
              >
                ⤢ Schema Mapping
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'dataQuality' ? 'active' : ''}`}
                onClick={() => onNavigate('dataQuality')}
              >
                ✓ Data Quality
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">CONFIGURATION</h3>
          <ul className="sidebar-nav">
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => onNavigate('config')}
              >
                ⚙ Customer Config
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'integrations' ? 'active' : ''}`}
                onClick={() => onNavigate('integrations')}
              >
                ⛓ Integrations
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">SYSTEM</h3>
          <ul className="sidebar-nav">
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => onNavigate('logs')}
              >
                ◌ Activity Logs
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => onNavigate('settings')}
              >
                ⚙ Settings
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot" style={{ color: isOperational ? 'var(--success-color)' : 'var(--error-color)' }}>●</span> {systemStatus}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
