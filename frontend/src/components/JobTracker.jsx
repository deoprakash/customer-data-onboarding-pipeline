import { useState, useEffect } from 'react';

export default function JobTracker({ initialJobId, customerName }) {
  const [jobId, setJobId] = useState(initialJobId || '');
  const [jobDetails, setJobDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Auto-fetch if initialJobId is provided or changes
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      fetchJobDetails(initialJobId);
    }
  }, [initialJobId]);

  // Fetch jobs (either for all customers or specific customer)
  useEffect(() => {
    if (!initialJobId && !jobDetails) {
      fetchJobsList();
    }
  }, [customerName, initialJobId, jobDetails]);

  const fetchJobsList = async () => {
    setIsLoadingList(true);
    try {
      const endpoint = customerName 
        ? `http://localhost:3000/jobs/customer/${encodeURIComponent(customerName)}`
        : `http://localhost:3000/jobs`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Poll for updates if job is pending or processing, or if we have an active jobId but no details yet
  useEffect(() => {
    let intervalId;
    const shouldPoll = 
      (jobId && !jobDetails) || // Poll if we have an ID but it hasn't loaded (e.g. queued in redis)
      (jobDetails && ['pending', 'queued', 'processing', 'in_progress'].includes(jobDetails.status?.toLowerCase()));

    if (shouldPoll) {
      intervalId = setInterval(() => {
        fetchJobDetails(jobId, false); // false = don't show loading spinner for background polling
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobDetails, jobId]);

  const fetchJobDetails = async (idToFetch, showLoading = true) => {
    if (!idToFetch) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/jobs/${idToFetch}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found. It might be queued but not yet saved in the database.');
        }
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      setJobDetails(data);
    } catch (err) {
      setError(err.message);
      // We don't clear job details here so user can see last known state
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleRerun = async (idToRerun) => {
    if (window.confirm("Are you sure you want to rerun this job with the original file?")) {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/jobs/${idToRerun}/rerun`, { method: 'POST' });
        if (!res.ok) throw new Error("Failed to queue rerun");
        const data = await res.json();
        setJobId(data.job.job_id);
        fetchJobDetails(data.job.job_id);
      } catch (err) {
        alert(err.message);
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobId.trim()) {
      fetchJobDetails(jobId.trim());
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'badge-completed';
    if (s === 'failed' || s === 'error') return 'badge-failed';
    if (s === 'processing' || s === 'in_progress') return 'badge-processing';
    return 'badge-pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderJobsList = () => {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.25rem' }}>{customerName ? `Jobs for ${customerName}` : 'All Recent Jobs'}</h2>
          <button className="btn btn-outline" onClick={fetchJobsList}>Refresh List</button>
        </div>
        {isLoadingList ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : jobsList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No jobs found in history.</p>
        ) : (
          <div style={{ background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', overflow: 'hidden', marginBottom: '40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-muted)' }}>Job ID</th>
                  {!customerName && <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-muted)' }}>Customer</th>}
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobsList.map(job => (
                  <tr key={job.job_id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{job.job_id.substring(0,8)}...</td>
                    {!customerName && <td style={{ padding: '12px 16px', fontWeight: '500' }}>{job.customer}</td>}
                    <td style={{ padding: '12px 16px' }}>{formatDate(job.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${getStatusBadgeClass(job.status)}`}>{job.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => { setJobId(job.job_id); fetchJobDetails(job.job_id); }}>View</button>
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleRerun(job.job_id)}>Rerun</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (!jobDetails) {
    return (
      <div>
        <h2 className="mb-6" style={{ fontSize: '1.25rem' }}>Track Specific Job</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="input-group">
            <div className="flex">
              <input
                id="jobId"
                type="text"
                className="input-field"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter Job ID"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                disabled={isLoading || !jobId.trim()}
              >
                {isLoading ? <div className="spinner"></div> : 'Track'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-6" style={{ color: 'var(--warning-color)', fontSize: '0.875rem', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {renderJobsList()}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: '1.25rem' }}>Track Job Status</h2>
        {jobDetails && (
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => { setJobDetails(null); setJobId(''); fetchJobsList(); }}>&larr; Back to List</button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="input-group">
          <label className="input-label" htmlFor="jobId">Job ID</label>
          <div className="flex">
            <input
              id="jobId"
              type="text"
              className="input-field"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter Job ID"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              disabled={isLoading || !jobId.trim()}
            >
              {isLoading ? <div className="spinner"></div> : 'Track'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-6" style={{ color: 'var(--warning-color)', fontSize: '0.875rem', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {jobDetails && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="flex justify-between items-center mb-6" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{jobDetails.customer}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{jobDetails.file_name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => handleRerun(jobId)}
              >
                Rerun Job
              </button>
              <span className={`badge ${getStatusBadgeClass(jobDetails.status)}`}>
                {jobDetails.status}
              </span>
            </div>
          </div>
          
          <div className="stat-grid mb-6">
            <div className="stat-card">
              <div className="stat-value">{jobDetails.records_received || 0}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success-color)' }}>{jobDetails.records_valid || 0}</div>
              <div className="stat-label">Valid</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--error-color)' }}>{jobDetails.records_rejected || 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="dashboard-panel mb-6">
            <h3 className="panel-title mb-4">Pipeline Progress</h3>
            
            <div className="pipeline-container" style={{ paddingLeft: '8px' }}>
              {[
                { id: 'upload', label: 'Upload' },
                { id: 'profile', label: 'Profile' },
                { id: 'schema_mapping', label: 'Schema Mapping' },
                { id: 'validation', label: 'Validation' },
                { id: 'transformation', label: 'Transformation' },
                { id: 'load', label: 'Load' }
              ].map((step, index, array) => {
                
                const steps = array.map(s => s.id);
                const currentIndex = steps.indexOf(jobDetails.current_step || 'upload');
                
                let status = 'pending';
                if (jobDetails.status?.toLowerCase() === 'completed') {
                  status = 'completed';
                } else if (jobDetails.status?.toLowerCase() === 'failed') {
                  status = index < currentIndex ? 'completed' : (index === currentIndex ? 'failed' : 'pending');
                } else {
                  if (index < currentIndex) status = 'completed';
                  else if (index === currentIndex) status = 'processing';
                  else status = 'pending';
                }

                return (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column', minHeight: index === array.length - 1 ? 'auto' : '60px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
                        {status === 'completed' && <div style={{ color: 'var(--success-color)', fontSize: '1.2rem', lineHeight: 1 }}>✓</div>}
                        {status === 'processing' && <div style={{ color: 'var(--primary-color)', fontSize: '1.2rem', lineHeight: 1 }}>●</div>}
                        {status === 'failed' && <div style={{ color: 'var(--error-color)', fontSize: '1.2rem', lineHeight: 1 }}>✗</div>}
                        {status === 'pending' && <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>○</div>}
                        
                        {index < array.length - 1 && (
                          <div style={{ width: '2px', flexGrow: 1, minHeight: '30px', background: status === 'completed' ? 'var(--success-color)' : 'var(--surface-border)', margin: '4px 0' }}></div>
                        )}
                      </div>
                      
                      <div style={{ paddingBottom: index < array.length - 1 ? '16px' : '0' }}>
                        <div style={{ fontWeight: status === 'processing' ? '600' : '500', color: status === 'pending' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                          {step.label}
                          {status === 'processing' && <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--primary-color)' }}>Processing...</span>}
                          {status === 'failed' && <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--error-color)' }}>Failed</span>}
                        </div>
                        
                        {status === 'processing' && jobDetails.status_message && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {jobDetails.status_message}
                          </div>
                        )}
                        {status === 'failed' && jobDetails.error_message && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--error-color)', marginTop: '4px' }}>
                            {jobDetails.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Created: {formatDate(jobDetails.created_at)}</span>
            <span>Last Updated: {formatDate(jobDetails.updated_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
