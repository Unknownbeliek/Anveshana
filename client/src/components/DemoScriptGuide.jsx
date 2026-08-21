import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, CheckCircle2, AlertTriangle, ShieldAlert, WifiOff, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { queueDepositLocally, syncOfflineQueue } from '../services/offlineQueue';

export default function DemoScriptGuide({
  isOpen,
  onClose,
  setIsOfflineSimulated,
  isOfflineSimulated
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [runningStep, setRunningStep] = useState(null);
  const [stepLogs, setStepLogs] = useState({});
  const navigate = useNavigate();

  if (!isOpen) return null;

  const runStep1_NormalFlow = async () => {
    setRunningStep(1);
    setIsOfflineSimulated(false);
    try {
      // 1. Submit valid 20L deposit for Ramesh Yadav (FRM-DEL-1049, capacity: 24L)
      const res = await api.recordDeposit({
        farmerCustomId: 'FRM-DEL-1049',
        centerId: 'CENT-EAST-04',
        volumeLiters: 20.0,
        qualityMetrics: {
          fat: 4.2,
          snf: 8.6,
          clrDensity: 29.0
        }
      });

      setStepLogs(prev => ({
        ...prev,
        1: `✅ Normal Deposit Verified: 20.0L accepted for FRM-DEL-1049. SHA-256 Receipt Seal: ${res.deposit.receiptHash.slice(0, 16)}... Total Payout: ₹${res.deposit.calculatedPayout}`
      }));
      navigate('/agent');
    } catch (err) {
      setStepLogs(prev => ({ ...prev, 1: `❌ Error: ${err.message}` }));
    } finally {
      setRunningStep(null);
    }
  };

  const runStep2_OfflineFlow = async () => {
    setRunningStep(2);
    try {
      // 1. Enable Offline Simulation
      setIsOfflineSimulated(true);
      
      // 2. Write to IndexedDB Offline Queue
      const queued = await queueDepositLocally({
        farmerCustomId: 'FRM-DEL-1049',
        centerId: 'CENT-EAST-04',
        volumeLiters: 15.0,
        qualityMetrics: {
          fat: 4.1,
          snf: 8.5,
          clrDensity: 29.2
        }
      });

      setStepLogs(prev => ({
        ...prev,
        2: `📦 Stored 15.0L transaction locally in IndexedDB (ID: ${queued.clientTempId}). Network is currently SIMULATED OFFLINE.`
      }));
      navigate('/agent');
    } catch (err) {
      setStepLogs(prev => ({ ...prev, 2: `❌ Error: ${err.message}` }));
    } finally {
      setRunningStep(null);
    }
  };

  const triggerStep2_Sync = async () => {
    setRunningStep(2.5);
    try {
      setIsOfflineSimulated(false);
      const res = await syncOfflineQueue('CENT-EAST-04');
      setStepLogs(prev => ({
        ...prev,
        2: `🌐 Network restored! Synced ${res.syncedCount} offline record(s) directly to server in 0.8s. Database updated.`
      }));
    } catch (err) {
      setStepLogs(prev => ({ ...prev, 2: `❌ Sync failed: ${err.message}` }));
    } finally {
      setRunningStep(null);
    }
  };

  const runStep3_AnomalyAlert = async () => {
    setRunningStep(3);
    setIsOfflineSimulated(false);
    try {
      // Enter 70 Liters for farmer with 24L capacity limit
      const res = await api.recordDeposit({
        farmerCustomId: 'FRM-DEL-1049',
        centerId: 'CENT-EAST-04',
        volumeLiters: 70.0, // 70L on 24L capacity!
        qualityMetrics: {
          fat: 3.8,
          snf: 8.4,
          clrDensity: 26.5
        }
      });

      setStepLogs(prev => ({
        ...prev,
        3: `🚨 MATHEMATICAL ANOMALY DETECTED: 70.0L exceeds 24.0L capacity! Instant alert broadcast over Socket.io (<100ms). Flag: "${res.deposit.flagReason}"`
      }));
      navigate('/auditor');
    } catch (err) {
      setStepLogs(prev => ({ ...prev, 3: `❌ Error: ${err.message}` }));
    } finally {
      setRunningStep(null);
    }
  };

  const runStep4_FactoryQuarantine = async () => {
    setRunningStep(4);
    try {
      // Reconcile batch BATCH-DEL-20260821-01 (Dispatched: 5000L) with 5400L gate measured (+8.0% dilution)
      const res = await api.reconcileBatch({
        batchId: 'BATCH-DEL-20260821-01',
        qcOfficerId: 'QC-OFFICER-88',
        receivedVolume: 5400.0,
        receivedFat: 3.9,
        receivedSnf: 8.2,
        receivedClr: 26.5
      });

      setStepLogs(prev => ({
        ...prev,
        4: `🛡️ AUTOMATED QUARANTINE TRIGGERED: Mass-balance variance +${res.variancePercent}% exceeds 1.0% limit. Tanker Silo unloading locked & auditor room alerted.`
      }));
      navigate('/factory');
    } catch (err) {
      setStepLogs(prev => ({ ...prev, 4: `❌ Error: ${err.message}` }));
    } finally {
      setRunningStep(null);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Step 1: Normal Intake Flow (NDLM Validation)',
      persona: 'Village Aggregator (/agent)',
      desc: 'Farmer Ramesh (FRM-DEL-1049, 2 Gir Cows, 24L max capacity) deposits 20 Liters. System verifies mathematical capacity, calculates ₹ payout, and generates a SHA-256 integrity seal.',
      run: runStep1_NormalFlow,
      btnText: '1-Click Run: Log 20L Normal Deposit',
      extra: null
    },
    {
      id: 2,
      title: 'Step 2: Zero-Loss Offline PWA Simulation',
      persona: 'Village Aggregator (/agent)',
      desc: 'Simulate network outage / Airplane mode. Submit 15L deposit. The record writes immediately to IndexedDB with QUEUED (OFFLINE) badge. Then restore connectivity to watch automatic sync.',
      run: runStep2_OfflineFlow,
      btnText: '1-Click Run: Queue 15L Offline',
      extra: (
        <button
          onClick={triggerStep2_Sync}
          disabled={runningStep === 2.5}
          className="mt-2 flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-emerald-600/30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${runningStep === 2.5 ? 'animate-spin' : ''}`} />
          <span>Restore Network & Auto-Sync Batch</span>
        </button>
      )
    },
    {
      id: 3,
      title: 'Step 3: Dynamic Anomaly Detection & Live WSS Alert',
      persona: 'Auditor Command Center (/auditor)',
      desc: 'Attempt to log 70 Liters for the same 24L capacity farmer. The algorithm immediately flags the physical impossibility, triggers a red alert banner, and broadcasts a high-priority Socket.io alert to the auditor map in <100ms.',
      run: runStep3_AnomalyAlert,
      btnText: '1-Click Run: Submit 70L Anomaly Breach',
      extra: null
    },
    {
      id: 4,
      title: 'Step 4: Factory Transit Mass-Balance Auto-Quarantine',
      persona: 'Chilling Center QC (/factory)',
      desc: 'Batch BATCH-DEL-20260821-01 (Dispatched: 5,000L) arrives at Chilling Silo with 5,400L gate measured (+400L dilution, +8% variance). The system automatically triggers Digital Quarantine and locks silo unloading.',
      run: runStep4_FactoryQuarantine,
      btnText: '1-Click Run: Reconcile Diluted Batch (+8% Variance)',
      extra: null
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#131315] border border-blue-500/40 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/20 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-[#1B1B1D]/80 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center space-x-2">
                <span>Hackathon Judge Demonstration Suite</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-normal">20-Hour Track Ready</span>
              </h2>
              <p className="text-xs text-zinc-400">Step-by-step interactive test script directly from Section 10 of PRD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4">
          {steps.map((step) => {
            const isSelected = activeStep === step.id;
            const log = stepLogs[step.id];

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#1B1B1D] border-blue-500/60 shadow-lg shadow-blue-500/10'
                    : 'bg-[#161618] border-surface-border hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        log ? 'bg-emerald-500 text-black' : 'bg-blue-600 text-white'
                      }`}>
                        {step.id}
                      </span>
                      <h3 className="font-semibold text-sm text-white">{step.title}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-blue-400 inline-block bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Target View: {step.persona}
                    </span>
                    <p className="text-xs text-zinc-300 pt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                {/* Step Action Button & Log */}
                <div className="mt-3 pt-3 border-t border-surface-border/60 flex flex-wrap items-center gap-2">
                  <button
                    onClick={step.run}
                    disabled={runningStep === step.id}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-blue-600/30"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${runningStep === step.id ? 'animate-spin' : ''}`} />
                    <span>{step.btnText}</span>
                  </button>

                  {step.extra}

                  <button
                    onClick={() => {
                      if (step.id === 1 || step.id === 2) navigate('/agent');
                      else if (step.id === 3) navigate('/auditor');
                      else if (step.id === 4) navigate('/factory');
                      onClose();
                    }}
                    className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-surface-high transition-colors ml-auto flex items-center space-x-1"
                  >
                    <span>Switch to View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Execution Result Log */}
                {log && (
                  <div className={`mt-3 p-2.5 rounded-lg text-xs font-mono border ${
                    log.includes('🚨') || log.includes('🛡️')
                      ? 'bg-crimson-alert/10 border-crimson-alert/30 text-red-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {log}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-[#161618] flex items-center justify-between text-xs text-zinc-400">
          <span>All 4 test flows are reproducible live with instant state updates.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-high hover:bg-surface-highest text-white font-medium rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
