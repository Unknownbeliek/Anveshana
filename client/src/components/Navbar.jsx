import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Store, Factory, PlayCircle, Wifi, WifiOff, RefreshCw, Radio, LogOut, ArrowLeft, Home } from 'lucide-react';
import { getQueuedCount, syncOfflineQueue } from '../services/offlineQueue';
import { useAuth } from '../auth/AuthContext';

export default function Navbar({
  isOfflineSimulated,
  setIsOfflineSimulated,
  onOpenDemoGuide,
  socketConnected
}) {
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const updateCount = async () => {
    try {
      const count = await getQueuedCount();
      setOfflineCount(count);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    updateCount();
    const handleUpdate = () => updateCount();
    window.addEventListener('offline-queue-updated', handleUpdate);
    return () => window.removeEventListener('offline-queue-updated', handleUpdate);
  }, []);

  const handleManualSync = async () => {
    if (offlineCount === 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
      await updateCount();
    } catch (err) {
      alert('Sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const navLinks = [
    { to: '/farmer', label: 'Farmer Passbook', icon: UserCheck, badge: null, role: 'farmer' },
    { to: '/agent', label: 'Village Intake PWA', icon: Store, badge: offlineCount > 0 ? `${offlineCount} Queued` : null, role: 'agent' },
    { to: '/factory', label: 'Chilling Center QC', icon: Factory, badge: null, role: 'factory' },
    { to: '/auditor', label: 'Auditor Command', icon: ShieldCheck, badge: 'Live WSS', role: 'auditor' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-[#0A0A0B]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title & Home Hub Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              title="Return to Main Platform Hub"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/30 text-zinc-400 hover:text-blue-300 transition-all text-xs font-mono group"
            >
              <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Main Hub</span>
            </button>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-display font-bold text-base text-white tracking-tight">Anveshana</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">अन्वेषण</span>
                </div>
                <p className="text-[10px] text-zinc-400 hidden lg:block">Dairy Supply Chain Intelligence</p>
              </div>
            </div>
          </div>

          {/* Persona Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-surface-container p-1 rounded-xl border border-surface-border">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-high'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      link.badge.includes('Queued')
                        ? 'bg-amber-500 text-black'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Offline Simulator Toggle + Demo Script Launcher */}
          <div className="flex items-center space-x-2.5">
            
            {/* Offline Simulation Switch */}
            <button
              onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
              title={isOfflineSimulated ? "Network Disconnected (Simulated Offline Buffer Mode)" : "Network Connected (Direct Online Sync)"}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                isOfflineSimulated
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20 animate-pulse'
                  : 'bg-surface-container text-zinc-300 border-surface-border hover:border-zinc-500'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-[11px]">OFFLINE SIM</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">ONLINE</span>
                </>
              )}
            </button>

            {/* Offline Sync Button if items queued */}
            {offlineCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-all shadow-md shadow-amber-500/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync ({offlineCount})</span>
              </button>
            )}

            {/* Judge Demo Script Trigger */}
            <button
              onClick={onOpenDemoGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/25 border border-blue-400/30 transition-all hover:scale-105"
            >
              <PlayCircle className="w-4 h-4 text-blue-200" />
              <span className="hidden sm:inline">Judge Demo Guide</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Realtime WebSocket Status Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 bg-surface-container rounded-lg border border-surface-border text-[11px] font-mono text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-crimson-alert'}`}></span>
              <span>{socketConnected ? 'WSS LIVE' : 'DISCONNECTED'}</span>
            </div>

            {/* Logout Button */}
            {isAuthenticated && (
              <button
                onClick={() => logout()}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-zinc-400 hover:text-red-400 bg-surface-container hover:bg-red-500/10 border border-surface-border hover:border-red-500/30 rounded-lg text-xs font-semibold transition-all"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-surface-border text-xs">
          <NavLink
            to="/"
            className="flex flex-col items-center py-1 px-2 text-zinc-400 hover:text-white"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Hub</span>
          </NavLink>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 rounded-lg ${
                    isActive ? 'text-blue-400 font-bold' : 'text-zinc-400'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">{link.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>

      </div>
    </header>
  );
}
