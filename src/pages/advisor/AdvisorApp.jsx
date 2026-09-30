import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { usePageTracking } from '../../hooks/usePageTracking';

export default function AdvisorApp() {
  usePageTracking();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content" style={{ paddingBottom: '3rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
