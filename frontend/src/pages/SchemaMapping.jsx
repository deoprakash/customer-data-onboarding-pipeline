import React, { useState, useEffect, Fragment } from 'react';

export default function SchemaMapping({ customerName, customers = [], onCustomerChange }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Default fallback if we can't load the config
  const fetchDefaultSchema = async () => {
    try {
      const res = await fetch('http://localhost:3000/configs/defaultSchema');
      return await res.json();
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!customerName) {
            setLoading(false);
            return;
        }
        
        const response = await fetch(`http://localhost:3000/configs/${customerName}`);
        
        if (response.status === 404) {
            const def = await fetchDefaultSchema();
            setConfig(def);
            setLoading(false);
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch config');
        
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err.message);
        const def = await fetchDefaultSchema();
        setConfig(def); // Use fallback if backend fails
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [customerName]);

  const handleSourceChange = (targetField, newSource) => {
    setConfig(prev => ({
      ...prev,
      [targetField]: {
        ...prev[targetField],
        source: newSource
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');
      
      const response = await fetch(`http://localhost:3000/configs/${customerName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) throw new Error('Failed to save config');
      
      setSaveMessage('Mapping saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-panel" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Schema Mapping
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
        <div className="flex items-center gap-4">
          {saveMessage && <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>{saveMessage}</span>}
          <button 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={async () => {
              if (!customerName) return;
              setIsSaving(true);
              setSaveMessage('');
              try {
                const res = await fetch(`http://localhost:3000/configs/${customerName}/generate`, { method: 'POST' });
                if (!res.ok) throw new Error('Failed to auto-generate mapping');
                const newMapping = await res.json();
                setConfig(newMapping);
                setSaveMessage('✨ Auto-generated successfully! Please review.');
                setTimeout(() => setSaveMessage(''), 4000);
              } catch (err) {
                alert(err.message);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || !customerName}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            Auto-Generate with AI
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={isSaving || !customerName}
          >
            {isSaving ? 'Saving...' : 'Save Mapping'}
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 60px 1fr', 
        gap: '16px', 
        alignItems: 'center',
        background: 'var(--bg-color)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--surface-border)'
      }}>
        
        {/* Headers */}
        <h3 style={{ gridColumn: 1, fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--surface-border)', paddingBottom: '8px', margin: 0, alignSelf: 'end' }}>
          Source field
        </h3>
        <h3 style={{ gridColumn: 3, fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--surface-border)', paddingBottom: '8px', margin: 0, alignSelf: 'end' }}>
          Canonical field
        </h3>

        {/* Rows */}
        {config && Object.entries(config).map(([target, mapping], idx) => (
          <Fragment key={idx}>
            {/* Source Field Cell */}
            <div style={{ gridColumn: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                value={mapping.source || ''} 
                onChange={(e) => handleSourceChange(target, e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '12px', background: 'var(--surface-color)', border: '1px dashed var(--primary-color)' }}
                placeholder="e.g. email_address"
              />
            </div>

            {/* Arrow Cell */}
            <div style={{ gridColumn: 2, display: 'flex', justifyContent: 'center', color: 'var(--primary-color)', opacity: 0.5 }}>
              ───────→
            </div>

            {/* Canonical Field Cell */}
            <div style={{ gridColumn: 3, display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{target}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={mapping.required || false}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        [target]: { ...prev[target], required: e.target.checked }
                      }));
                    }}
                  />
                  Required
                </label>
              </div>
              
              {/* Advanced Transformation Settings */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {(target === 'created_at' || target === 'updated_at' || mapping.format) && (
                  <input 
                    type="text" 
                    placeholder="Source format (e.g. %d/%m/%Y)" 
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', flex: 1 }}
                    value={mapping.format || ''}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        [target]: { ...prev[target], format: e.target.value }
                      }));
                    }}
                  />
                )}
                {(mapping.transformation || target === 'first_name' || target === 'last_name') && (
                  <input 
                    type="text" 
                    placeholder="Transformation rule" 
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', flex: 1 }}
                    value={mapping.transformation || ''}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        [target]: { ...prev[target], transformation: e.target.value }
                      }));
                    }}
                  />
                )}
              </div>
            </div>
          </Fragment>
        ))}

      </div>
    </div>
  );
}
