import React, { useState, useEffect } from 'react';
import { Factory, ShieldAlert, CheckCircle2, AlertTriangle, Lock, Unlock, ArrowRight, RefreshCw, Truck, QrCode, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function FactoryView() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('BATCH-DEL-20260821-01');
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Gate Measurement Inputs
  const [gateVolume, setGateVolume] = useState('5400.0');
  const [gateFat, setGateFat] = useState('4.1');
  const [gateSnf, setGateSnf] = useState('8.4');
  const [gateClr, setGateClr] = useState('28.0');
  const [qcOfficerId, setQcOfficerId] = useState('QC-OFFICER-88');

  // Reconciliation Outcome State
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      if (res.success) {
        setBatches(res.batches);
        const current = res.batches.find(b => b.batchId === selectedBatchId) || res.batches[0];
        setSelectedBatch(current || null);
        if (current && !reconcileResult) {
          // Default test values (+8% dilution for demo)
          setGateVolume((current.dispatchedVolume * 1.08).toFixed(1));
          setGateFat((current.dispatchedWeightedFat - 0.15).toFixed(2));
          setGateSnf((current.dispatchedWeightedSnf - 0.25).toFixed(2));
          setGateClr((current.dispatchedClr ? current.dispatchedClr - 1.2 : 28.0).toFixed(1));
        }
      }
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [selectedBatchId]);

  // Real-time live variance calculation on input change
  const dispVol = selectedBatch ? Number(selectedBatch.dispatchedVolume) : 5000;
  const measVol = Number(gateVolume) || 0;
  const liveVariance = dispVol > 0 ? Number((((measVol - dispVol) / dispVol) * 100).toFixed(2)) : 0;
  const isVarianceExceeded = Math.abs(liveVariance) > 1.0;

  const handleReconcile = async (e) => {
    e?.preventDefault();
    if (!selectedBatchId || !gateVolume) return;

    setReconciling(true);
    setReconcileResult(null);

    try {
      const res = await api.reconcileBatch({
        batchId: selectedBatchId,
        qcOfficerId,
        receivedVolume: parseFloat(gateVolume),
        receivedFat: parseFloat(gateFat),
        receivedSnf: parseFloat(gateSnf),
        receivedClr: parseFloat(gateClr)
      });

      setReconcileResult(res);
      loadBatches();
    } catch (err) {
      alert('Reconciliation error: ' + err.message);
    } finally {
      setReconciling(false);
    }
  };

  const handleLoadPreset = (type) => {
    if (!selectedBatch) return;
    if (type === 'compliant') {
      // Set to 4990L (-0.2% variance, compliant)
      setGateVolume((selectedBatch.dispatchedVolume * 0.998).toFixed(1));
      setGateFat(selectedBatch.dispatchedWeightedFat.toString());
      setGateSnf(selectedBatch.dispatchedWeightedSnf.toString());
      setGateClr((selectedBatch.dispatchedClr || 29.2).toString());
    } else if (type === 'dilution') {
      // Set to 5400L (+8.0% variance, water addition quarantine)
      setGateVolume((selectedBatch.dispatchedVolume * 1.08).toFixed(1));
      setGateFat((selectedBatch.dispatchedWeightedFat - 0.2).toFixed(2));
      setGateSnf((selectedBatch.dispatchedWeightedSnf - 0.3).toFixed(2));
      setGateClr('27.0');
    }
  };

  const isQuarantined = selectedBatch?.status === 'QUARANTINED' || reconcileResult?.status === 'QUARANTINED';
  const isVerified = selectedBatch?.status === 'VERIFIED_AT_FACTORY' || reconcileResult?.status === 'VERIFIED_AT_FACTORY';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display flex items-center space-x-2">
              <span>Chilling Center QC & Mass-Balance Audit Station</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">SILO-MAIN-01</span>
            </h1>
            <p className="text-xs text-zinc-400">Side-by-side Transit Reconciliation & Automated Digital Quarantine</p>
          </div>
        </div>

        {/* Batch Manifest Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-zinc-400">Incoming Tanker:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setReconcileResult(null);
            }}
            className="glass-input text-xs rounded-xl px-3 py-2 text-white font-mono"
          >
            {batches.map((b) => (
              <option key={b.batchId} value={b.batchId} className="bg-[#131315]">
                {b.batchId} ({b.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AUTOMATED QUARANTINE / ACCEPTANCE BANNER */}
      {reconcileResult && (
        <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 animate-fade-in ${
          reconcileResult.status === 'QUARANTINED'
            ? 'glass-card-crimson text-red-300'
            : 'glass-card-emerald text-emerald-300'
        }`}>
          <div className="flex items-center justify-between font-bold text-sm">
            <span className="flex items-center space-x-2">
              {reconcileResult.status === 'QUARANTINED' ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-crimson-alert animate-bounce" />
                  <span className="text-red-300 font-display">AUTOMATED DIGITAL QUARANTINE TRIGGERED</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-display">TRANSIT MASS-BALANCE AUDIT VERIFIED</span>
                </>
              )}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-black/40 border border-white/20">
              ΔV: {reconcileResult.variancePercent > 0 ? `+${reconcileResult.variancePercent}` : reconcileResult.variancePercent}%
            </span>
          </div>
          <p className="text-xs text-zinc-200">{reconcileResult.message}</p>
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-zinc-300">
            <span>Silo Unloading Status: <strong className={reconcileResult.status === 'QUARANTINED' ? 'text-red-400' : 'text-emerald-400'}>
              {reconcileResult.status === 'QUARANTINED' ? '⛔ LOCKED & ACCESS BLOCKED' : '✅ AUTHORIZED FOR TRANSFER'}
            </strong></span>
            <span>Auditor Feed: <strong className="text-blue-400">Real-time WebSocket Alert Dispatched (&lt;100ms)</strong></span>
          </div>
        </div>
      )}

      {/* Side-by-Side Reconciliation Matrix (Dispatched vs. Gate Measured) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Dispatched Manifest Data (Immutable Hash Sealed) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-display font-semibold text-sm text-white">
                1. Dispatched Manifest Data (Hub Sealed)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              SHA-256 SEALED
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-surface-container rounded-xl border border-surface-border space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Batch Manifest ID:</span>
                <span className="text-white font-bold">{selectedBatch?.batchId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Origin Hub:</span>
                <span className="text-zinc-200">{selectedBatch?.centerName || selectedBatch?.centerId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tanker Registration:</span>
                <span className="text-blue-400 font-bold">{selectedBatch?.tankerNumber}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Driver:</span>
                <span className="text-zinc-200">{selectedBatch?.driverName}</span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-[#131315] rounded-xl border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">DISPATCH VOL</span>
                <span className="text-base font-bold text-white">{selectedBatch?.dispatchedVolume} L</span>
              </div>
              <div className="p-2.5 bg-[#131315] rounded-xl border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">WEIGHTED FAT</span>
                <span className="text-base font-bold text-blue-400">{selectedBatch?.dispatchedWeightedFat}%</span>
              </div>
              <div className="p-2.5 bg-[#131315] rounded-xl border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">WEIGHTED SNF</span>
                <span className="text-base font-bold text-emerald-400">{selectedBatch?.dispatchedWeightedSnf}%</span>
              </div>
              <div className="p-2.5 bg-[#131315] rounded-xl border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">CLR DENSITY</span>
                <span className="text-base font-bold text-amber-400">{selectedBatch?.dispatchedClr || 29.2}</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#09090B] rounded-xl border border-surface-border text-[10px] text-zinc-400 break-all space-y-1">
              <span className="block text-zinc-500">MANIFEST HASH CHAIN:</span>
              <span className="text-zinc-300 font-mono">{selectedBatch?.manifestHash}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Gate Measured Data & Live Mass-Balance Audit */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-semibold text-sm text-white">
                2. Factory Gate Physical QC Measurements
              </h3>
            </div>
            {/* Quick Preset Buttons for Testing */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleLoadPreset('compliant')}
                className="text-[10px] px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded border border-emerald-500/30 transition-all"
              >
                Compliant Preset
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('dilution')}
                className="text-[10px] px-2 py-0.5 bg-crimson-alert/20 hover:bg-crimson-alert text-red-300 hover:text-white rounded border border-crimson-alert/30 transition-all"
              >
                +8% Dilution Preset
              </button>
            </div>
          </div>

          <form onSubmit={handleReconcile} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  GATE MEASURED VOLUME (L) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={gateVolume}
                  onChange={(e) => setGateVolume(e.target.value)}
                  className={`glass-input w-full p-2.5 rounded-xl text-base font-mono font-bold ${
                    isVarianceExceeded ? 'border-crimson-alert text-red-400' : 'text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  QC OFFICER ID
                </label>
                <input
                  type="text"
                  required
                  value={qcOfficerId}
                  onChange={(e) => setQcOfficerId(e.target.value)}
                  className="glass-input w-full p-2.5 rounded-xl text-xs font-mono text-zinc-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  GATE FAT %
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={gateFat}
                  onChange={(e) => setGateFat(e.target.value)}
                  className="glass-input w-full p-2 rounded-xl text-sm font-mono text-blue-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  GATE SNF %
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={gateSnf}
                  onChange={(e) => setGateSnf(e.target.value)}
                  className="glass-input w-full p-2 rounded-xl text-sm font-mono text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  GATE CLR DENSITY
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={gateClr}
                  onChange={(e) => setGateClr(e.target.value)}
                  className="glass-input w-full p-2 rounded-xl text-sm font-mono text-amber-400 font-bold"
                />
              </div>
            </div>

            {/* Mass-Balance Live Variance Formula Card */}
            <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
              isVarianceExceeded
                ? 'bg-crimson-alert/15 border-crimson-alert/50 text-red-300 animate-pulse'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex justify-between items-center font-bold">
                <span>Mass-Balance Variance (ΔV):</span>
                <span className="text-base">{liveVariance > 0 ? `+${liveVariance}%` : `${liveVariance}%`}</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Acceptance Range:</span>
                <span>[-1.0%, +1.0%]</span>
              </div>
              <div className="text-[11px] pt-1 border-t border-white/10 text-zinc-300">
                {liveVariance > 1.0 && '⚠️ REJECTION REASON: Unauthorized volume expansion (Liquid/water adulteration in transit).'}
                {liveVariance < -1.0 && '⚠️ REJECTION REASON: Transit volume deficit (Physical leakage or diversion).'}
                {Math.abs(liveVariance) <= 1.0 && '✅ ACCEPTANCE: Fluid conservation verified within permissible tolerance.'}
              </div>
            </div>

            <button
              type="submit"
              disabled={reconciling}
              className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                isVarianceExceeded
                  ? 'bg-crimson-alert hover:bg-red-600 text-white shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              {isVarianceExceeded ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{reconciling ? 'Executing Audit...' : 'Execute Audit & Lock Tanker Quarantine'}</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>{reconciling ? 'Executing Audit...' : 'Execute Audit & Authorize Silo Unloading'}</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>

      {/* Manifest Log Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-display font-semibold text-sm text-white">
            Historical Tanker Batch Manifests & Reconciliation Log
          </h3>
          <span className="text-xs font-mono text-zinc-400">{batches.length} Batches Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-surface-border text-zinc-400 bg-surface-container/50">
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Hub Origin</th>
                <th className="py-2.5 px-3">Dispatched</th>
                <th className="py-2.5 px-3">Received Gate</th>
                <th className="py-2.5 px-3">Variance (ΔV)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">QC Officer</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60 text-zinc-300">
              {batches.map((b) => (
                <tr key={b.batchId} className="hover:bg-surface-high/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{b.batchId}</td>
                  <td className="py-3 px-3 text-zinc-200">{b.centerName || b.centerId}</td>
                  <td className="py-3 px-3 font-bold text-blue-400">{b.dispatchedVolume} L</td>
                  <td className="py-3 px-3 font-bold text-white">
                    {b.reconciliationData ? `${b.reconciliationData.receivedVolume} L` : 'Pending'}
                  </td>
                  <td className="py-3 px-3">
                    {b.reconciliationData ? (
                      <span className={`font-bold ${
                        Math.abs(b.reconciliationData.volumeVariancePercent) > 1.0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {b.reconciliationData.volumeVariancePercent > 0 ? `+${b.reconciliationData.volumeVariancePercent}` : b.reconciliationData.volumeVariancePercent}%
                      </span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {b.status === 'QUARANTINED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-alert/20 text-red-400 border border-crimson-alert/40">
                        ⛔ QUARANTINED
                      </span>
                    ) : b.status === 'VERIFIED_AT_FACTORY' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ✅ VERIFIED & ACCEPTED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                        🚛 IN TRANSIT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {b.reconciliationData?.qcOfficerId || '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedBatchId(b.batchId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 bg-surface-high hover:bg-surface-highest text-zinc-200 hover:text-white rounded-lg text-[11px] font-semibold border border-surface-border transition-all"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
