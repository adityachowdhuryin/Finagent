import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../utils/analytics';

export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    track('page_view', { page: location.pathname });
  }, [location.pathname]);
}
