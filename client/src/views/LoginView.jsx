import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Store, Factory, Lock, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Portal configuration — single source of truth for all four portals.
const PORTALS = {
  farmer: {
    id: 'farmer',
    title: 'Farmer Portal',
    subtitle: 'Primary Access',
    Icon: UserCheck,
    accentBorder: 'border-t-2 border-t-blue-500',
    accentShadow: 'shadow-blue-900/20',
    iconBg: 'bg-blue-500/20 border-blue-500/30',
    iconColor: 'text-blue-400',
    bgBlur: 'bg-blue-600/20',
    btnClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25 border-blue-400/20',
    idLabel: 'Farmer ID',
    idPlaceholder: 'e.g. FRM-DEL-1049',
    errorLabel: 'farmer'
  },
  agent: {
    id: 'agent',
    title: 'Village Intake',
    subtitle: 'Supply Chain Operations',
    Icon: Store,
    accentBorder: 'border-t-2 border-t-amber-500',
    accentShadow: 'shadow-amber-900/20',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-400',
    bgBlur: 'bg-amber-600/20',
    btnClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25 border-amber-400/20',
    idLabel: 'Operator ID',
    idPlaceholder: 'e.g. OPR-CENT-EAST-04',
    errorLabel: 'village intake'
  },
  factory: {
    id: 'factory',
    title: 'Chilling Center QC',
    subtitle: 'Supply Chain Operations',
    Icon: Factory,
    accentBorder: 'border-t-2 border-t-amber-500',
    accentShadow: 'shadow-amber-900/20',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-400',
    bgBlur: 'bg-amber-600/20',
    btnClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25 border-amber-400/20',
    idLabel: 'Operator ID',
    idPlaceholder: 'e.g. OPR-SILO-MAIN-01',
    errorLabel: 'chilling center'
  },
  auditor: {
    id: 'auditor',
    title: 'Auditor Command Center',
    subtitle: 'Regulatory Access',
    Icon: ShieldCheck,
    accentBorder: 'border-t-2 border-t-emerald-500',
    accentShadow: 'shadow-emerald-900/20',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    bgBlur: 'bg-emerald-600/20',
    btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25 border-emerald-400/20',
    idLabel: 'Auditor ID',
    idPlaceholder: 'e.g. AUD-NCT-001',
    errorLabel: 'auditor'
  }
};

export default function LoginView() {
  const [selectedPortalId, setSelectedPortalId] = useState('farmer');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const portal = PORTALS[selectedPortalId];
  const { Icon } = portal;

  // Switch portal and clear form state.
  const switchPortal = (portalId) => {
    setSelectedPortalId(portalId);
    setLoginId('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginId || !password) {
      setError(`Please enter your credentials to access the ${portal.errorLabel} portal.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await login(loginId, password);
      // Backend role is always authoritative.
      const actualRole = res.user.role;
      navigate(`/${actualRole}`);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 p-[2px] shadow-lg shadow-blue-500/20 mb-2">
          <div className="w-full h-full bg-[#131315] rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">ANVESHANA</h1>
        <p className="text-sm text-zinc-400">Preventative Dairy Supply Chain Intelligence</p>
        <div className="inline-block mt-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full">
          <p className="text-xs font-mono text-blue-400 tracking-widest font-semibold uppercase">Secure Access Gateway</p>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT: Dynamic login card — updates based on selectedPortalId */}
        <div className="lg:col-span-5 flex flex-col">
          <div className={`glass-panel p-8 rounded-3xl flex-1 ${portal.accentBorder} shadow-2xl ${portal.accentShadow} relative overflow-hidden`}>
            
            {/* Background Accent */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 ${portal.bgBlur} rounded-full blur-3xl`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <div className={`p-3 ${portal.iconBg} rounded-xl border`}>
                  <Icon className={`w-6 h-6 ${portal.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">{portal.title}</h2>
                  <p className="text-xs text-zinc-400 font-mono">{portal.subtitle}</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-semibold">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-300 ml-1">{portal.idLabel}</label>
                  <input 
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={portal.idPlaceholder}
                    className="w-full glass-input px-4 py-3.5 rounded-xl text-sm font-mono tracking-wide"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-300 ml-1">PIN / Password</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input px-4 py-3.5 rounded-xl text-sm font-mono tracking-widest"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-4 flex items-center justify-center space-x-2 ${portal.btnClass} text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-lg border hover:scale-[1.02] disabled:opacity-50`}
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT: Portal selection cards */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Supply Chain Portal */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-l-2 border-l-amber-500">
            <div className="mb-6">
              <h2 className="text-lg font-display font-bold text-white">SUPPLY CHAIN PORTAL</h2>
              <p className="text-xs text-zinc-400 font-mono">Operational Access</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => switchPortal('agent')}
                className={`text-left group glass-panel-interactive p-5 rounded-2xl flex flex-col justify-between min-h-[140px] transition-all ${selectedPortalId === 'agent' ? 'border-amber-500/70 bg-amber-500/5' : 'hover:border-amber-500/50'}`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Store className={`w-5 h-5 ${selectedPortalId === 'agent' ? 'text-amber-300' : 'text-amber-400'}`} />
                    <span className="font-semibold text-white">Village Intake</span>
                    {selectedPortalId === 'agent' && (
                      <span className="ml-auto text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full">SELECTED</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">Collection operations, offline intake, and dispatch.</p>
                </div>
                <div className="flex justify-end mt-4">
                  <ArrowRight className={`w-4 h-4 transition-colors ${selectedPortalId === 'agent' ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'}`} />
                </div>
              </button>

              <button 
                onClick={() => switchPortal('factory')}
                className={`text-left group glass-panel-interactive p-5 rounded-2xl flex flex-col justify-between min-h-[140px] transition-all ${selectedPortalId === 'factory' ? 'border-amber-500/70 bg-amber-500/5' : 'hover:border-amber-500/50'}`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Factory className={`w-5 h-5 ${selectedPortalId === 'factory' ? 'text-amber-300' : 'text-amber-400'}`} />
                    <span className="font-semibold text-white">Chilling Center QC</span>
                    {selectedPortalId === 'factory' && (
                      <span className="ml-auto text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full">SELECTED</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">Mass-balance, reconciliation, and quarantine.</p>
                </div>
                <div className="flex justify-end mt-4">
                  <ArrowRight className={`w-4 h-4 transition-colors ${selectedPortalId === 'factory' ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Regulatory Portal */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-l-2 border-l-emerald-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-white">REGULATORY PORTAL</h2>
                <p className="text-xs text-zinc-400 font-mono">Authorized regulatory access</p>
              </div>
              
              <button 
                onClick={() => switchPortal('auditor')}
                className={`flex items-center space-x-2 px-5 py-3 border rounded-xl transition-all group ${
                  selectedPortalId === 'auditor'
                    ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300'
                    : 'bg-surface-container hover:bg-surface-high border-surface-border hover:border-emerald-500/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedPortalId === 'auditor' ? 'bg-emerald-400' : 'bg-emerald-500 node-pulse-emerald'}`}></div>
                <span className="text-sm font-semibold text-white">Auditor Command</span>
                {selectedPortalId === 'auditor' && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full ml-1">SELECTED</span>
                )}
                <ArrowRight className={`w-4 h-4 ml-2 transition-colors ${selectedPortalId === 'auditor' ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-emerald-400'}`} />
              </button>
            </div>
          </div>

          {/* Farmer Portal shortcut — allows re-selecting from the right side */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-l-2 border-l-blue-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-white">FARMER PORTAL</h2>
                <p className="text-xs text-zinc-400 font-mono">Primary farmer access</p>
              </div>
              
              <button
                onClick={() => switchPortal('farmer')}
                className={`flex items-center space-x-2 px-5 py-3 border rounded-xl transition-all group ${
                  selectedPortalId === 'farmer'
                    ? 'bg-blue-500/10 border-blue-500/60 text-blue-300'
                    : 'bg-surface-container hover:bg-surface-high border-surface-border hover:border-blue-500/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedPortalId === 'farmer' ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                <span className="text-sm font-semibold text-white">Farmer Login</span>
                {selectedPortalId === 'farmer' && (
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded-full ml-1">SELECTED</span>
                )}
                <ArrowRight className={`w-4 h-4 ml-2 transition-colors ${selectedPortalId === 'farmer' ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400'}`} />
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
