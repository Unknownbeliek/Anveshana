import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DemoScriptGuide from './components/DemoScriptGuide';
import FarmerView from './views/FarmerView';
import AgentView from './views/AgentView';
import FactoryView from './views/FactoryView';
import AuditorView from './views/AuditorView';
import LoginView from './views/LoginView';
import HomeView from './views/HomeView';
import { getSocket } from './services/socket';
import { ShieldAlert, X } from 'lucide-react';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

export default function App() {
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);
  const location = useLocation();
  // HomeView and LoginView render their own layout — suppress the app shell on those routes
  const isShellless = location.pathname === '/' || location.pathname === '/login';

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleAlert = (data) => {
      setGlobalToast({
        title: `🚨 ANOMALY FLAGGED: ${data.type || 'CAPACITY_BREACH'}`,
        message: data.message,
        severity: data.severity || 'CRITICAL'
      });
      setTimeout(() => setGlobalToast(null), 7000);
    };

    const handleQuarantine = (data) => {
      setGlobalToast({
        title: `⛔ TANKER QUARANTINE: ${data.batchId || 'BATCH'}`,
        message: data.message,
        severity: 'CRITICAL'
      });
      setTimeout(() => setGlobalToast(null), 8000);
    };

    if (socket.connected) setSocketConnected(true);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('anomaly-alert', handleAlert);
    socket.on('batch-quarantined', handleQuarantine);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('anomaly-alert', handleAlert);
      socket.off('batch-quarantined', handleQuarantine);
    };
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0A0A0B] text-[#E5E1E4] flex flex-col selection:bg-blue-600 selection:text-white">
        
        {/* Top Navbar — hidden on home/login which have their own nav */}
        {!isShellless && (
          <Navbar
            isOfflineSimulated={isOfflineSimulated}
            setIsOfflineSimulated={setIsOfflineSimulated}
            onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
            socketConnected={socketConnected}
          />
        )}

      {/* Global Real-Time Alert Toast */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-red-950/90 border border-crimson-alert text-red-200 shadow-2xl backdrop-blur-xl animate-fade-in flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-crimson-alert shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 text-xs font-mono space-y-1">
            <span className="font-bold text-white block">{globalToast.title}</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed">{globalToast.message}</p>
          </div>
          <button
            onClick={() => setGlobalToast(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/farmer" element={<FarmerView />} />
          <Route path="/agent" element={<AgentView isOfflineSimulated={isOfflineSimulated} />} />
          <Route path="/factory" element={<FactoryView />} />
          <Route path="/auditor" element={<AuditorView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Interactive Hackathon Judge Demo Modal */}
      <DemoScriptGuide
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        isOfflineSimulated={isOfflineSimulated}
        setIsOfflineSimulated={setIsOfflineSimulated}
      />

      {/* Footer — hidden on home/login which have their own footer */}
      {!isShellless && (
        <footer className="border-t border-surface-border py-4 bg-[#0A0A0B] text-center text-xs text-zinc-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Anveshana (अन्वेषण) • Preventative Dairy Supply Chain Intelligence</span>
            <span>Bharat Pashudhan NDLM 12-Digit Livestock Ear Tag Validation</span>
          </div>
        </footer>
      )}

    </div>
    </AuthProvider>
  );
}
