import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const Layout = ({ activeTab, onNavigate, children }) => {
  return (
    <div className="layout-wrapper">
      <Sidebar activeTab={activeTab} onNavigate={onNavigate} />
      <div className="main-wrapper">
        <TopNav activeTab={activeTab} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
