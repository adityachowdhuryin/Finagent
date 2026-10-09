import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import HubSubNav from '../../components/layout/HubSubNav';
import CommandPalette from '../../components/common/CommandPalette';
import { useAuth } from '../../context/AuthContext';
import { usePageTracking } from '../../hooks/usePageTracking';

import ErrorBoundary from '../../components/ui/ErrorBoundary';
import AICopilotSidecar from '../../components/ai/AICopilotSidecar';
import SentinelBanner from '../../components/common/SentinelBanner';
import MobileBottomNav from '../../components/layout/MobileBottomNav';

export default function ConsumerApp() {
  usePageTracking();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const localDone = localStorage.getItem('finagent_onboarding_done') === 'true';
    if (currentUser && !currentUser.isDemo && userProfile && !userProfile.onboardingComplete && !localDone) {
      navigate('/onboarding');
    }
  }, [currentUser, userProfile, navigate]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
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
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <HubSubNav />
        <main className="page-content" style={{ paddingBottom: '3rem' }}>
          <SentinelBanner />
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ErrorBoundary>
        <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary>
        <AICopilotSidecar isOpen={copilotOpen} onToggle={() => setCopilotOpen(prev => !prev)} />
      </ErrorBoundary>
      <MobileBottomNav
        onToggleCopilot={() => setCopilotOpen(prev => !prev)}
        onOpenMenu={() => setSidebarOpen(true)}
      />
    </div>
  );
}
