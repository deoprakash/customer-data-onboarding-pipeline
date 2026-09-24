import React, { useState, useEffect } from 'react';

const TopNav = ({ activeTab }) => {
  const [userInfo, setUserInfo] = useState({ environment: '...', user: { initials: '..' } });

  useEffect(() => {
    fetch('http://localhost:3000/user')
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
      })
      .catch(err => {
        console.error('Failed to fetch user info:', err);
      });
  }, []);

  // Simple breadcrumb logic based on active tab
  const getBreadcrumb = () => {
    switch(activeTab) {
      case 'dashboard': return 'Overview / Dashboard';
      case 'customers': return 'Overview / Customers';
      case 'track': return 'Overview / Jobs';
      case 'upload': return 'Data Operations / Upload Data';
      case 'schema': return 'Data Operations / Schema Mapping';
      case 'quality': return 'Data Operations / Data Quality';
      case 'config': return 'Configuration / Customer Config';
      case 'integrations': return 'Configuration / Integrations';
      case 'logs': return 'System / Activity Logs';
      case 'settings': return 'System / Settings';
      default: return 'Overview / Dashboard';
    }
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <div className="breadcrumbs">{getBreadcrumb()}</div>
      </div>
      
      <div className="topnav-right">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Global search..." className="search-input" />
        </div>
        
        <div className="env-badge">{userInfo.environment}</div>
        
        <button className="icon-button" title="Notifications" onClick={() => alert('You have no new notifications.')}>
          🔔
        </button>
        
        <button className="icon-button" title="Help/documentation" onClick={() => alert('Opening documentation portal...')}>
          ❓
        </button>
        
        <div className="user-profile">
          <div className="avatar" title={userInfo.user?.name}>{userInfo.user?.initials}</div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
