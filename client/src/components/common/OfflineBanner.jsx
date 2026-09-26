import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      backgroundColor: '#f59e0b',
      color: '#ffffff',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <WifiOff size={18} />
      <span>You're offline — reconnecting to SaathCare network...</span>
    </div>
  );
}
