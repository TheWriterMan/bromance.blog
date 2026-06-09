'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    // Initial check
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setShowSynced(true);
      setTimeout(() => setShowSynced(false), 3000);
    }
    function handleOffline() {
      setOnline(false);
      setShowSynced(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && !showSynced) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium shadow-md transition-all ${
        online
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
      role="status"
      aria-live="polite"
    >
      {online ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Synced</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline — changes saved locally</span>
        </>
      )}
    </div>
  );
}
