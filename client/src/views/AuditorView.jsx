import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Activity, Radio, AlertTriangle, CheckCircle2, TrendingUp, Search, Lock, Zap, Check, Copy } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import LiveMap from '../components/LiveMap';

export default function AuditorView() {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSocketAlert, setActiveSocketAlert] = useState(null);
  
  // Seal Verification Tool State
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyFarmerId, setVerifyFarmerId] = useState('FRM-DEL-1049');
  const [verifyVol, setVerifyVol] = useState('20.0');
  const [verifyPayout, setVerifyPayout] = useState('878.60');
  const [verifyTimestamp, setVerifyTimestamp] = useState(new Date().toISOString());
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, alertsRes] = await Promise.all([
        api.getDistrictAnalytics(),
        api.getAlerts()
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (alertsRes.success) setAlerts(alertsRes.alerts);
    } catch (err) {
      console.error('Error loading auditor analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time WebSocket events (<100ms latency)
    const socket = getSocket();

    const handleAnomalyAlert = (newAlert) => {
      console.log('🚨 [Auditor Real-Time WSS] New Anomaly Alert Received:', newAlert);
      setAlerts(prev => [newAlert, ...prev]);
      setActiveSocketAlert(newAlert);
      loadData();

      // Play soft audio alert chirp if supported
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // audio ctx not permitted without user gesture
      }
    };

    const handleBatchQuarantine = (quarantineAlert) => {
      console.log('🛡️ [Auditor Real-Time WSS] Batch Quarantined:', quarantineAlert);
      setAlerts(prev => [quarantineAlert, ...prev]);
      setActiveSocketAlert(quarantineAlert);
      loadData();
    };

    const handleDepositRecorded = (data) => {
      loadData();
    };

    socket.on('anomaly-alert', handleAnomalyAlert);
    socket.on('batch-quarantined', handleBatchQuarantine);
    socket.on('deposit-recorded', handleDepositRecorded);

    return () => {
      socket.off('anomaly-alert', handleAnomalyAlert);
      socket.off('batch-quarantined', handleBatchQuarantine);
      socket.off('deposit-recorded', handleDepositRecorded);
    };
  }, []);

  const handleTestVerify = async (e) => {
    e?.preventDefault();
    if (!verifyHash) return;
    setVerifying(true);
    try {
      const res = await api.verifyReceipt({
        receiptHash: verifyHash.trim(),
        farmerCustomId: verifyFarmerId,
        volumeLiters: parseFloat(verifyVol),
        calculatedPayout: parseFloat(verifyPayout),
        timestamp: verifyTimestamp
      });
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ isValid: false, message: 'Verification Error: ' + err.message });
    } finally {
      setVerifying(false);
    }
  };

  const summary = analytics?.summary || {
    totalDailyBiologicalCapacity: 14500,
    totalVolumeProcured: 13240,
    capacityUtilizationPercent: 91.3,
    totalPayoutsDisbursed: 582490,
    totalRegisteredCattle: 124,
    lactatingCattleCount: 112,
    registeredFarmersCount: 3,
    totalDepositsCount: 12,
    flaggedDepositsCount: 1,
    quarantinedBatchesCount: 1
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Mission Control Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white font-display">
                Regulatory Auditor Command Center
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/40">
                WSS SUB-100MS STREAM
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              National Digital Livestock Mission (NDLM) • Mathematical Mass-Balance Surveillance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-surface-container border border-surface-border text-zinc-300">
            District: <strong className="text-white">NCT Delhi Agri-Zone 01</strong>
          </span>
        </div>
      </div>

      {/* Real-time Socket Flash Banner when anomaly is pushed */}
      {activeSocketAlert && (
        <div className="p-4 bg-crimson-alert/20 border border-crimson-alert/70 rounded-2xl flex items-center justify-between animate-glow-crimson">
          <div className="flex items-center space-x-3 text-red-200 text-xs font-mono">
            <ShieldAlert className="w-5 h-5 text-crimson-alert shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-sm text-white block">
                🚨 REAL-TIME WS ALERT RECEIVED [{activeSocketAlert.type}]
              </span>
              <span>{activeSocketAlert.message}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveSocketAlert(null)}
            className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-black/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">
            District Biological Cap
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-display text-white">
              {summary.totalDailyBiologicalCapacity.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-emerald-400">L / day</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {summary.totalRegisteredCattle} NDLM Tagged Cattle
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">
            Today Procured Intake
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-display text-blue-400">
              {summary.totalVolumeProcured.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-zinc-400">Liters</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {summary.capacityUtilizationPercent}% Biological Utilization
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">
            Mathematical Anomalies
          </span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-display ${summary.flaggedDepositsCount > 0 ? 'text-crimson-alert' : 'text-emerald-400'}`}>
              {summary.flaggedDepositsCount}
            </span>
            <span className="text-xs font-mono text-zinc-400">Flags Logged</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            100% Mathematical Detection
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">
            Quarantined Tankers
          </span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-display ${summary.quarantinedBatchesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {summary.quarantinedBatchesCount}
            </span>
            <span className="text-xs font-mono text-zinc-400">Locked Batches</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Mass-balance variance &gt; 1%
          </p>
        </div>

      </div>

      {/* Main Grid: Interactive GIS Map & Real-time Incident Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive GIS Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="font-display font-semibold text-sm text-white">
                  District Supply Chain Network & Node Threat Map
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Interactive GIS Map</span>
            </div>

            <LiveMap nodes={analytics?.nodes || []} alerts={alerts} />
          </div>

          {/* District Daily Procurement vs. Biological Limit Chart */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-semibold text-sm text-white">
                  District Intake vs. Biological Yield Safety Ceiling
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">7-Day Trajectory</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.trendData || []}>
                  <defs>
                    <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#71717A" tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <YAxis stroke="#71717A" tick={{ fontSize: 11, fill: '#A1A1AA' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131315',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="biologicalLimit"
                    name="Biological Capacity Ceiling (L)"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#capGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="intake"
                    name="Actual Intake Volume (L)"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#intakeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Real-time Incident Feed & Hash Seal Verifier */}
        <div className="space-y-6">
          
          {/* Incident Feed */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-crimson-alert" />
                <h3 className="font-display font-semibold text-sm text-white">
                  Real-time Incident Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {alerts.length} Incidents
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-mono space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                  <span>No active anomalies detected across supply chain.</span>
                </div>
              ) : (
                alerts.map((alt, i) => (
                  <div
                    key={alt.alertId || i}
                    className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 transition-all ${
                      alt.severity === 'CRITICAL'
                        ? 'bg-crimson-alert/10 border-crimson-alert/40 text-red-300'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-white/10">
                        {alt.type}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-200 leading-snug">
                      {alt.message}
                    </p>

                    <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
                      <span>Node: {alt.centerId || 'District'}</span>
                      {alt.farmerCustomId && <span>Farmer: {alt.farmerCustomId}</span>}
                      {alt.tankerNumber && <span>Tanker: {alt.tankerNumber}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cryptographic SHA-256 Receipt Seal Verifier Tool */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <h3 className="font-display font-semibold text-sm text-white">
                  Cryptographic Seal Validator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">SHA-256</span>
            </div>

            <form onSubmit={handleTestVerify} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  PASTE SHA-256 RECEIPT SEAL
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste 64-character hex hash..."
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  className="glass-input w-full p-2 rounded-lg text-[11px] text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">FARMER ID</label>
                  <input
                    type="text"
                    value={verifyFarmerId}
                    onChange={(e) => setVerifyFarmerId(e.target.value)}
                    className="glass-input w-full p-1.5 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">VOLUME (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={verifyVol}
                    onChange={(e) => setVerifyVol(e.target.value)}
                    className="glass-input w-full p-1.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || !verifyHash}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{verifying ? 'Validating...' : 'Verify Cryptographic Hash'}</span>
              </button>

              {verifyResult && (
                <div className={`p-2.5 rounded-xl border text-[11px] ${
                  verifyResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/50 text-red-300'
                }`}>
                  {verifyResult.message}
                </div>
              )}
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
