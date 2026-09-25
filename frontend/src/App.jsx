import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import JobTracker from './components/JobTracker';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomerDetail from './pages/CustomerDetail';
import CustomerList from './pages/CustomerList';
import SchemaMapping from './pages/SchemaMapping';
import RejectedRecords from './pages/RejectedRecords';
import SchemaHistory from './pages/SchemaHistory';
import DataProfile from './components/DataProfile';
import Integrations from './pages/Integrations';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeJobId, setActiveJobId] = useState('');
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error('Failed to fetch customers:', err));
  }, []);

  const CustomerSelector = () => (
    <div className="dashboard-panel" style={{ textAlign: 'center', padding: '40px' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Please select a customer to continue.</p>
      <select 
        className="input-field" 
        style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }}
        value=""
        onChange={(e) => setSelectedCustomerForDetail(e.target.value)}
      >
        <option value="" disabled>Select Customer...</option>
        {customers.map(c => (
          <option key={c.id} value={c.name}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>
        ))}
      </select>
    </div>
  );
  const handleJobCreated = (jobId) => {
    setActiveJobId(jobId);
    setActiveTab('track');
  };

  const handleNavigateToCustomer = (customerName) => {
    setSelectedCustomerForDetail(customerName);
    setActiveTab('customerDetail');
  };

  const handleTabChange = (tab) => {
    if (tab === 'customers') {
      setSelectedCustomerForDetail(null); // Reset detail view when clicking 'Customers' tab
    } else if (tab === 'dataQuality') {
      setActiveJobId(''); // Reset job ID to show all rejected records for the customer
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerList onViewCustomer={handleNavigateToCustomer} onNavigate={(tab, customer) => {
          setSelectedCustomerForDetail(customer);
          setActiveTab(tab);
        }} />;
      case 'customerDetail':
        return <CustomerDetail initialCustomerName={selectedCustomerForDetail} />;
      case 'schemaMapping':
        return (
          <div className="container">
            <div style={{ marginBottom: '40px' }}>
              <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Schema Mapping
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Map customer source fields to your canonical schema.
              </p>
            </div>
            {selectedCustomerForDetail ? (
              <SchemaMapping 
                customerName={selectedCustomerForDetail} 
                customers={customers}
                onCustomerChange={setSelectedCustomerForDetail}
              />
            ) : (
              <CustomerSelector />
            )}
          </div>
        );
      case 'dataQuality':
        return (
          <div className="container">
            <div style={{ marginBottom: '40px' }}>
              <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Data Quality
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Inspect rejected records and correct data quality issues.
              </p>
            </div>
            {selectedCustomerForDetail ? (
              <RejectedRecords 
                customerName={selectedCustomerForDetail} 
                jobId={activeJobId} 
                customers={customers}
                onCustomerChange={setSelectedCustomerForDetail}
              />
            ) : (
              <CustomerSelector />
            )}
          </div>
        );
      case 'config':
        return (
          <div className="container">
            <div style={{ marginBottom: '40px' }}>
              <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Customer Config History
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                View and manage configuration version history.
              </p>
            </div>
            {selectedCustomerForDetail ? (
              <SchemaHistory 
                customerName={selectedCustomerForDetail} 
                customers={customers}
                onCustomerChange={setSelectedCustomerForDetail}
              />
            ) : (
              <CustomerSelector />
            )}
          </div>
        );
      case 'integrations':
        return (
          <div className="container">
            <Integrations />
          </div>
        );
      case 'upload':
        return (
          <div className="container">
            <div style={{ marginBottom: '40px' }}>
              <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Upload Data
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Upload customer data and start the ingestion pipeline.
              </p>
            </div>
            <div className="panel">
              <FileUpload onJobCreated={handleJobCreated} />
            </div>
          </div>
        );
      case 'track':
        return (
          <div className="container">
            <div style={{ marginBottom: '40px' }}>
              <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Jobs
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Monitor pipeline execution and job status.
              </p>
            </div>
            <div className="panel" style={{ marginBottom: '40px' }}>
              <JobTracker 
                initialJobId={activeJobId} 
                customerName={selectedCustomerForDetail} 
              />
            </div>
            {activeJobId && (
              <DataProfile jobId={activeJobId} />
            )}
          </div>
        );
      case 'logs':
        return <ActivityLogs />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="container">
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Placeholder</h3>
              <p>This view is under construction.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab === 'customerDetail' ? 'customers' : activeTab} onNavigate={handleTabChange}>
      {renderContent()}
    </Layout>
  );
}

export default App;
