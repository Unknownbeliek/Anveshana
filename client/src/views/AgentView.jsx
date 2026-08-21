import React, { useState, useEffect, useRef } from 'react';
import { Store, Plus, Send, AlertTriangle, ShieldCheck, WifiOff, RefreshCw, Truck, CheckCircle2, QrCode, Search, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { queueDepositLocally, getQueuedDeposits, getQueuedCount, syncOfflineQueue } from '../services/offlineQueue';
import ReceiptModal from '../components/ReceiptModal';

export default function AgentView({ isOfflineSimulated }) {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('FRM-DEL-1049');
  const [activeFarmer, setActiveFarmer] = useState(null);
  
  // Intake Form State
  const [volumeLiters, setVolumeLiters] = useState('');
  const [fat, setFat] = useState('4.2');
  const [snf, setSnf] = useState('8.6');
  const [clrDensity, setClrDensity] = useState('29.0');
  const [centerId, setCenterId] = useState('CENT-EAST-04');

  // Operational State
  const [submitting, setSubmitting] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [recentBoothDeposits, setRecentBoothDeposits] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [liveFlagAlert, setLiveFlagAlert] = useState(null);
  const [dispatchingBatch, setDispatchingBatch] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(null);

  // Form input refs for rapid keyboard navigation
  const farmerInputRef = useRef(null);
  const volumeInputRef = useRef(null);
  const fatInputRef = useRef(null);
  const snfInputRef = useRef(null);
  const clrInputRef = useRef(null);
  const submitBtnRef = useRef(null);

  // Load initial data
  const loadData = async () => {
    try {
      const [farmersRes, depositsRes] = await Promise.all([
        api.getFarmers(),
        api.getRecentDeposits()
      ]);
      if (farmersRes.success) {
        setFarmers(farmersRes.farmers);
        const current = farmersRes.farmers.find(f => f.farmerCustomId === selectedFarmerId) || farmersRes.farmers[0];
        setActiveFarmer(current);
      }
      if (depositsRes.success) {
        setRecentBoothDeposits(depositsRes.deposits);
      }
      const qCount = await getQueuedCount();
      setOfflineCount(qCount);
    } catch (err) {
      console.error('Error loading Agent data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleQueueUpdate = async () => {
      const count = await getQueuedCount();
      setOfflineCount(count);
    };
    window.addEventListener('offline-queue-updated', handleQueueUpdate);
    return () => window.removeEventListener('offline-queue-updated', handleQueueUpdate);
  }, []);

  // Update active farmer when ID changes
  useEffect(() => {
    if (farmers.length > 0) {
      const found = farmers.find(f => f.farmerCustomId === selectedFarmerId);
      setActiveFarmer(found || null);
    }
  }, [selectedFarmerId, farmers]);

  // Live Constraint Checking: Check if entered volume exceeds dynamic capacity limit
  const enteredVolNum = parseFloat(volumeLiters) || 0;
  const farmerMaxCap = activeFarmer?.dynamicCapacity || 24.0;
  const isVolumeBreached = enteredVolNum > farmerMaxCap;

  // Real-time Estimated Payout calculation
  const estFat = parseFloat(fat) || 4.0;
  const estSnf = parseFloat(snf) || 8.5;
  const bonus = (activeFarmer?.purityScore >= 90) ? 3.00 : 0.00;
  const estPayout = enteredVolNum > 0
    ? (enteredVolNum * 40.0 * (estFat / 4.0) * (estSnf / 8.5) + (enteredVolNum * bonus)).toFixed(2)
    : '0.00';

  const handleSubmitDeposit = async (e) => {
    e?.preventDefault();
    if (!selectedFarmerId || !volumeLiters) return;

    setSubmitting(true);
    setLiveFlagAlert(null);

    const payload = {
      farmerCustomId: selectedFarmerId,
      centerId,
      volumeLiters: parseFloat(volumeLiters),
      qualityMetrics: {
        fat: parseFloat(fat),
        snf: parseFloat(snf),
        clrDensity: parseFloat(clrDensity)
      }
    };

    try {
      if (isOfflineSimulated || !navigator.onLine) {
        // Queue locally in IndexedDB
        const queued = await queueDepositLocally(payload);
        const count = await getQueuedCount();
        setOfflineCount(count);
        
        // Add to local recent list
        const localDeposit = {
          depositId: queued.clientTempId,
          farmerCustomId: payload.farmerCustomId,
          farmerName: activeFarmer?.name || 'Local Farmer',
          volumeLiters: payload.volumeLiters,
          qualityMetrics: payload.qualityMetrics,
          calculatedPayout: parseFloat(estPayout),
          isFlagged: isVolumeBreached,
          flagReason: isVolumeBreached ? `Volume (${payload.volumeLiters}L) exceeds limit (${farmerMaxCap}L)` : null,
          receiptHash: 'QUEUED-OFFLINE-SHA256-PENDING',
          syncSource: 'OFFLINE_BUFFER_SYNC',
          timestamp: new Date().toISOString()
        };
        setRecentBoothDeposits(prev => [localDeposit, ...prev]);
        setSelectedReceipt(localDeposit);
      } else {
        // Direct Online API call
        const res = await api.recordDeposit(payload);
        if (res.success) {
          setRecentBoothDeposits(prev => [res.deposit, ...prev]);
          setSelectedReceipt(res.deposit);

          if (res.deposit.isFlagged) {
            setLiveFlagAlert(res.deposit.flagReason);
          }
        }
      }

      // Reset form volume & cycle focus back to volume
      setVolumeLiters('');
      volumeInputRef.current?.focus();
    } catch (err) {
      alert('Intake Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatchDispatch = async () => {
    setDispatchingBatch(true);
    setBatchSuccess(null);
    try {
      const res = await api.createBatch({
        centerId,
        centerName: 'East Delhi Aggregation Hub 04',
        tankerNumber: 'DL-1GB-' + Math.floor(1000 + Math.random() * 9000),
        driverName: 'Baldev Singh (+91 98990 11223)'
      });
      if (res.success) {
        setBatchSuccess(res.batch);
        loadData();
      }
    } catch (err) {
      alert('Batch Dispatch error: ' + err.message);
    } finally {
      setDispatchingBatch(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display flex items-center space-x-2">
                <span>Village Aggregator Rapid Intake Booth</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">PWA-OFFLINE-READY</span>
              </h1>
              <p className="text-xs text-zinc-400">Hub: {centerId} • Sub-15s Rapid Keyboard Flow</p>
            </div>
          </div>
        </div>

        {/* Offline Queue Badge & Batch Dispatch Trigger */}
        <div className="flex items-center space-x-3">
          {offlineCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-mono font-bold animate-pulse">
              <WifiOff className="w-4 h-4" />
              <span>Queued Offline: {offlineCount} Records</span>
            </div>
          )}

          <button
            onClick={handleCreateBatchDispatch}
            disabled={dispatchingBatch || recentBoothDeposits.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>{dispatchingBatch ? 'Sealing Batch...' : 'Seal & Dispatch Batch Manifest'}</span>
          </button>
        </div>
      </div>

      {/* Batch Manifest Seal Confirmation */}
      {batchSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-xs font-mono space-y-1 animate-fade-in">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>TRANSIT BATCH MANIFEST SEALED & DISPATCHED</span>
            </span>
            <span>{batchSuccess.batchId}</span>
          </div>
          <p className="text-zinc-300">
            Total Dispatched: <span className="text-white font-bold">{batchSuccess.dispatchedVolume}L</span> | 
            Tanker: <span className="text-white font-bold">{batchSuccess.tankerNumber}</span> | 
            Manifest SHA-256: <span className="text-blue-400">{batchSuccess.manifestHash.slice(0, 24)}...</span>
          </p>
        </div>
      )}

      {/* Main Grid: Rapid Keyboard Intake Form & Dynamic Capacity Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rapid Intake Form (2 Columns) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-display font-semibold text-sm text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Rapid Intake Form (Auto-Focus Cycling)</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              [Tab] to cycle inputs • [Enter] to submit
            </span>
          </div>

          <form onSubmit={handleSubmitDeposit} className="space-y-4">
            
            {/* Field 1: Farmer ID & Quick Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  1. FARMER ID / REGISTRY LOOKUP
                </label>
                <select
                  ref={farmerInputRef}
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && volumeInputRef.current?.focus()}
                  className="glass-input w-full p-2.5 rounded-xl text-xs font-mono text-white"
                >
                  {farmers.map((f) => (
                    <option key={f.farmerCustomId} value={f.farmerCustomId} className="bg-[#131315]">
                      {f.farmerCustomId} — {f.name} (Cap: {f.dynamicCapacity}L)
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Farmer Capacity Telemetry */}
              <div className="p-3 bg-surface-container rounded-xl border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">NDLM LIVESTOCK CAPACITY</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    Max: {farmerMaxCap} Liters / day
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 block">PURITY SCORE</span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {activeFarmer?.purityScore || 100} / 100 ({activeFarmer?.purityGrade || 'Grade A'})
                  </span>
                </div>
              </div>
            </div>

            {/* Field 2 & 3: Volume & Quality Readings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  2. VOLUME (L) <span className="text-red-400">*</span>
                </label>
                <input
                  ref={volumeInputRef}
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 20.0"
                  value={volumeLiters}
                  onChange={(e) => setVolumeLiters(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fatInputRef.current?.focus()}
                  className={`glass-input w-full p-2.5 rounded-xl text-sm font-mono font-bold ${
                    isVolumeBreached ? 'border-crimson-alert text-red-400' : 'text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  3. FAT % (2.5 - 12.0)
                </label>
                <input
                  ref={fatInputRef}
                  type="number"
                  step="0.1"
                  required
                  placeholder="4.2"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && snfInputRef.current?.focus()}
                  className="glass-input w-full p-2.5 rounded-xl text-sm font-mono text-blue-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  4. SNF % (7.0 - 11.5)
                </label>
                <input
                  ref={snfInputRef}
                  type="number"
                  step="0.1"
                  required
                  placeholder="8.6"
                  value={snf}
                  onChange={(e) => setSnf(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && clrInputRef.current?.focus()}
                  className="glass-input w-full p-2.5 rounded-xl text-sm font-mono text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  5. CLR DENSITY
                </label>
                <input
                  ref={clrInputRef}
                  type="number"
                  step="0.5"
                  required
                  placeholder="29.0"
                  value={clrDensity}
                  onChange={(e) => setClrDensity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitBtnRef.current?.focus()}
                  className="glass-input w-full p-2.5 rounded-xl text-sm font-mono text-amber-400 font-bold"
                />
              </div>
            </div>

            {/* LIVE CONSTRAINT CHECKING ALERT BANNER */}
            {isVolumeBreached && (
              <div className="p-3.5 bg-crimson-alert/15 border border-crimson-alert/50 rounded-xl flex items-start space-x-3 text-xs text-red-300 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-crimson-alert shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold font-mono text-red-200 block">
                    ⚠️ MATHEMATICAL CAPACITY LIMIT BREACH DETECTED
                  </span>
                  <span>
                    Entered volume ({enteredVolNum}L) exceeds farmer's registered dynamic biological capacity ({farmerMaxCap}L).
                    Logging this transaction will trigger an instant high-priority anomaly incident to the Auditor Command Map.
                  </span>
                </div>
              </div>
            )}

            {/* Calculated Estimated Payout & Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-zinc-300 flex items-center space-x-2">
                <span>Estimated Payout:</span>
                <span className="text-base font-bold text-emerald-400">₹{estPayout}</span>
                {bonus > 0 && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">+₹3/L Grade A+ Bonus</span>}
              </div>

              <button
                ref={submitBtnRef}
                type="submit"
                disabled={submitting || !volumeLiters}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Verifying & Hashing...' : 'Submit & Seal Deposit Slip'}</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right Column: Active Cattle Profile & Offline Resilience */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-display font-semibold text-sm text-white">
              Farmer Biological Card
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">NDLM Verified</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-surface-container p-3 rounded-xl border border-surface-border space-y-1">
              <span className="text-zinc-400 block text-[10px]">REGISTERED FARMER</span>
              <span className="font-bold text-white text-sm">{activeFarmer?.name}</span>
              <span className="text-zinc-400 block text-[11px]">{activeFarmer?.village}</span>
            </div>

            <div className="space-y-2">
              <span className="text-zinc-400 block text-[10px] font-mono">TAGGED LIVESTOCK ({activeFarmer?.cattle?.length || 0})</span>
              {activeFarmer?.cattle?.map((cow) => (
                <div key={cow.earTagId} className="p-2.5 bg-[#161618] rounded-lg border border-surface-border text-[11px] flex justify-between items-center font-mono">
                  <div>
                    <span className="text-blue-400 font-bold">🏷️ {cow.earTagId}</span>
                    <span className="text-zinc-400 block text-[10px]">{cow.breed} ({cow.type})</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{cow.baseDailyYield}L/d</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-zinc-900/80 rounded-xl border border-surface-border text-[11px] text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>Network Mode:</span>
              <span className={isOfflineSimulated ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isOfflineSimulated ? 'Offline Local Storage (idb)' : 'Direct Online (Atlas)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Offline Buffer:</span>
              <span className="text-white font-mono">{offlineCount} records pending sync</span>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Booth Intake Transactions */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-display font-semibold text-sm text-white">
            Recent Booth Intake Transactions ({recentBoothDeposits.length})
          </h3>
          <span className="text-xs font-mono text-zinc-400">Aggregator Hub: {centerId}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-surface-border text-zinc-400 bg-surface-container/50">
                <th className="py-2.5 px-3">Deposit ID</th>
                <th className="py-2.5 px-3">Farmer</th>
                <th className="py-2.5 px-3">Volume (L)</th>
                <th className="py-2.5 px-3">FAT / SNF / CLR</th>
                <th className="py-2.5 px-3">Payout</th>
                <th className="py-2.5 px-3">Validation Status</th>
                <th className="py-2.5 px-3">Sync Origin</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60 text-zinc-300">
              {recentBoothDeposits.map((d) => (
                <tr key={d.depositId} className="hover:bg-surface-high/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{d.depositId}</td>
                  <td className="py-3 px-3 text-zinc-200">{d.farmerCustomId} ({d.farmerName || 'Farmer'})</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">{d.volumeLiters} L</td>
                  <td className="py-3 px-3 text-zinc-300">{d.qualityMetrics?.fat}% / {d.qualityMetrics?.snf}% / {d.qualityMetrics?.clrDensity}</td>
                  <td className="py-3 px-3 font-bold text-white">₹{d.calculatedPayout}</td>
                  <td className="py-3 px-3">
                    {d.isFlagged ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-alert/20 text-red-400 border border-crimson-alert/40">
                        BREACH FLAGGED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        VERIFIED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{d.syncSource || 'DIRECT_ONLINE'}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedReceipt(d)}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[11px] font-semibold border border-blue-500/30 transition-all"
                    >
                      Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          deposit={selectedReceipt}
          farmer={activeFarmer}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
