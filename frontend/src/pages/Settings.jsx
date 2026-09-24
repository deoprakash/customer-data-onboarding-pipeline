import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    slackIntegration: false,
    autoRetryJobs: true,
    dataRetentionDays: 30,
    theme: localStorage.getItem('theme') || 'light'
  });

  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '40px' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          System Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage global preferences, notifications, and system parameters.
        </p>
      </div>

      <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '600px' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="panel-title">General Settings</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>Email Notifications</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive alerts for failed ingestion jobs.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.emailNotifications} 
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>Slack Integration</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send pipeline alerts to a Slack channel.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.slackIntegration} 
                onChange={(e) => handleChange('slackIntegration', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>Auto-Retry Failed Jobs</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically attempt to reprocess failed records once.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.autoRetryJobs} 
                onChange={(e) => handleChange('autoRetryJobs', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '10px 0' }} />

          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Data Retention (Days)</h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>How long to keep raw uploaded files before auto-deletion.</p>
            <select 
              className="input-field" 
              style={{ width: '100%', padding: '10px' }}
              value={settings.dataRetentionDays}
              onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value))}
            >
              <option value={7}>7 Days</option>
              <option value={15}>15 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>UI Theme</h4>
            <select 
              className="input-field" 
              style={{ width: '100%', padding: '10px' }}
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <option value="light">Light Theme (Default)</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>
          
        </div>

        <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
          {saveMessage && <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>{saveMessage}</span>}
        </div>
      </div>
    </div>
  );
}
