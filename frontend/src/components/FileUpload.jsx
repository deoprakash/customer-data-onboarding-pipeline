import { useState, useRef } from 'react';

export default function FileUpload({ onJobCreated }) {
  const [customer, setCustomer] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [approvalData, setApprovalData] = useState(null);
  const [mappingJson, setMappingJson] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customer.trim()) {
      setError('Customer name is required.');
      return;
    }
    
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const jobId = crypto.randomUUID();
    
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('customer', customer);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/jobs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const data = await response.json();
      
      if (data.requires_approval) {
        setApprovalData(data);
        setMappingJson(JSON.stringify(data.generated_mapping, null, 2));
        setIsUploading(false);
        return;
      }
      
      // Reset form
      setCustomer('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent
      onJobCreated(jobId);
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
      setIsUploading(false);
    }
  };

  const handleApprove = async () => {
    setIsUploading(true);
    try {
      // 1. Save config
      const configRes = await fetch(`http://localhost:3000/configs/${approvalData.customer}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mappingJson
      });
      if (!configRes.ok) throw new Error('Failed to save mapping');

      // 2. Queue job
      const approveRes = await fetch('http://localhost:3000/jobs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: approvalData.job_id,
          customer: approvalData.customer,
          file: approvalData.file
        })
      });
      if (!approveRes.ok) throw new Error('Failed to queue job');

      setApprovalData(null);
      setCustomer('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onJobCreated(approvalData.job_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (approvalData) {
    return (
      <div>
        <h2 className="mb-6" style={{ fontSize: '1.25rem' }}>Review AI Schema Mapping</h2>
        <p className="mb-4 text-muted">A mapping for <strong>{approvalData.customer}</strong> did not exist, so our AI generated one based on the file headers.</p>
        <textarea
          style={{ width: '100%', height: '300px', padding: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '16px' }}
          value={mappingJson}
          onChange={(e) => setMappingJson(e.target.value)}
        />
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={() => setApprovalData(null)}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleApprove} disabled={isUploading}>
            {isUploading ? 'Processing...' : 'Approve & Run Job'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6" style={{ fontSize: '1.25rem' }}>Start New Onboarding</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label" htmlFor="customer">Customer Name</label>
          <input
            id="customer"
            type="text"
            className="input-field"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Acme Corp"
            disabled={isUploading}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Data File (CSV)</label>
          <div 
            className={`drop-zone ${isDragging ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            
            {file ? (
              <div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', color: 'var(--text-muted)' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Drag and drop your CSV file here, or click to browse</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4" style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isUploading || !customer || !file}
        >
          {isUploading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            'Upload & Queue Job'
          )}
        </button>
      </form>
    </div>
  );
}
