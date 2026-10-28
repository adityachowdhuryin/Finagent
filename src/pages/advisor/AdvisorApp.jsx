import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { usePageTracking } from '../../hooks/usePageTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import AICopilotSidecar from '../../components/ai/AICopilotSidecar';

export default function AdvisorApp() {
  usePageTracking();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCopilotOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content" style={{ paddingBottom: '3rem' }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ErrorBoundary>
        <AICopilotSidecar isOpen={copilotOpen} onToggle={() => setCopilotOpen(prev => !prev)} />
      </ErrorBoundary>
    </div>
  );
}
