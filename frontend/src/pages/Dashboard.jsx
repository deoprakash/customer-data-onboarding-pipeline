import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState({
    kpis: { totalCustomers: 0, activeJobs: 0, recordsProcessed: 0, dataQuality: 0 },
    additionalKpis: { jobsToday: 0, successfulJobs: 0, failedJobs: 0, recordsRejected: 0 },
    chartData: [],
    recentJobs: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="dashboard-container" style={{ padding: '60px', textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  const { kpis, additionalKpis, chartData, recentJobs, alerts } = data;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          What's happening with customer data onboarding right now?
        </p>
      </div>

      {/* Main KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Customers</div>
          <div className="kpi-value">{kpis.totalCustomers}</div>
          {additionalKpis.customersTrend && <div className="kpi-trend positive">{additionalKpis.customersTrend}</div>}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Jobs</div>
          <div className="kpi-value">{kpis.activeJobs}</div>
          <div className="kpi-trend neutral">{kpis.activeJobs} processing</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Records Processed</div>
          <div className="kpi-value">{kpis.recordsProcessed.toLocaleString()}</div>
          {additionalKpis.recordsTrend && <div className="kpi-trend positive">{additionalKpis.recordsTrend}</div>}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Data Quality</div>
          <div className="kpi-value">{kpis.dataQuality}%</div>
          {additionalKpis.qualityTrend && <div className="kpi-trend positive">{additionalKpis.qualityTrend}</div>}
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          {/* Charts */}
          <div className="dashboard-panel">
            <h3 className="panel-title">Job Activity</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--processing-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--processing-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" name="Records Processed" dataKey="records" stroke="var(--processing-color)" fillOpacity={1} fill="url(#colorRecords)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Jobs Table */}
          <div className="dashboard-panel">
            <h3 className="panel-title">Recent Onboarding Jobs</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Source</th>
                    <th>Records</th>
                    <th>Status</th>
                    <th>Quality</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.length > 0 ? recentJobs.map(job => (
                    <tr key={job.id}>
                      <td className="font-medium">{job.customer}</td>
                      <td>{job.source}</td>
                      <td>{job.records}</td>
                      <td>
                        <span className={`badge badge-${job.status.toLowerCase()}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{job.quality}</td>
                      <td><span className="text-muted">{new Date(job.started).toLocaleString()}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" style={{textAlign: 'center'}}>No recent jobs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          {/* Alerts */}
          <div className="dashboard-panel">
            <h3 className="panel-title">Alerts</h3>
            <div className="alerts-list">
              {alerts.length > 0 ? alerts.map(alert => (
                <div key={alert.id} className="alert-item">
                  <span className="alert-icon">{alert.icon}</span>
                  <span className="alert-text">{alert.text}</span>
                </div>
              )) : (
                <div className="text-muted">No active alerts</div>
              )}
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="dashboard-panel">
            <h3 className="panel-title">Additional KPIs</h3>
            <div className="secondary-kpis">
              <div className="sec-kpi">
                <span className="sec-kpi-label">Jobs today</span>
                <span className="sec-kpi-value">{additionalKpis.jobsToday}</span>
              </div>
              <div className="sec-kpi">
                <span className="sec-kpi-label">Successful jobs</span>
                <span className="sec-kpi-value text-success">{additionalKpis.successfulJobs}</span>
              </div>
              <div className="sec-kpi">
                <span className="sec-kpi-label">Failed jobs</span>
                <span className="sec-kpi-value text-error">{additionalKpis.failedJobs}</span>
              </div>
              <div className="sec-kpi">
                <span className="sec-kpi-label">Records rejected</span>
                <span className="sec-kpi-value">{additionalKpis.recordsRejected.toLocaleString()}</span>
              </div>
              {additionalKpis.avgProcessingTime && (
                <div className="sec-kpi">
                  <span className="sec-kpi-label">Avg processing time</span>
                  <span className="sec-kpi-value">{additionalKpis.avgProcessingTime}</span>
                </div>
              )}
              <div className="sec-kpi">
                <span className="sec-kpi-label">Avg data-quality</span>
                <span className="sec-kpi-value">{kpis.dataQuality}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
