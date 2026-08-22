import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, UserCheck, Store, Factory, ChevronDown, Search,
  ArrowRight, Milk, Map, Activity, BarChart3, Wifi, Lock,
  CheckCircle2, AlertTriangle, Database, Radio, TrendingUp,
  Layers, Eye, Leaf, Globe, ChevronRight, Package, X,
  Sparkles, ExternalLink, RefreshCw, Cpu
} from 'lucide-react';

// ─── Demo data reusing project's actual seed values ───────────────────────────
const DEMO_TRACES = {
  'FRM-DEL-1049': {
    type: 'farmer',
    farmerName: 'Ramesh Kumar Yadav',
    farmerId: 'FRM-DEL-1049',
    village: 'Alipur Village, Delhi North',
    cattle: 2,
    breed: 'Gir Cow',
    ndlmTags: ['100482910384', '100482910385'],
    latestDeposit: {
      depositId: 'DEP-1771651200001',
      date: '2026-08-20',
      volume: '19.5 L',
      fat: '4.3%',
      snf: '8.7%',
      clr: '29.5',
      payout: '₹878.60',
      center: 'East Delhi Aggregation Hub 04',
      receiptHash: 'a718b2c4...f3'
    },
    status: 'VERIFIED'
  },
  'BATCH-DEL-20260821-01': {
    type: 'batch',
    batchId: 'BATCH-DEL-20260821-01',
    center: 'East Delhi Aggregation Hub 04',
    centerId: 'CENT-EAST-04',
    tanker: 'DL-1GB-8842',
    driver: 'Baldev Singh',
    volume: '5,000 L',
    fat: '4.25%',
    snf: '8.65%',
    clr: '29.2',
    dispatchDate: '2026-08-21 05:30',
    status: 'DISPATCHED',
    manifestHash: 'e4d3c2b1...45'
  }
};

const SEARCH_TYPES = [
  { id: 'farmer', label: 'Farmer / NDLM ID', placeholder: 'e.g. FRM-DEL-1049', icon: UserCheck },
  { id: 'batch', label: 'Batch ID', placeholder: 'e.g. BATCH-DEL-20260821-01', icon: Package },
];

const QUICK_DEMOS = ['FRM-DEL-1049', 'BATCH-DEL-20260821-01'];

// ─── Supply Chain Steps with Direct Dashboard Links ───────────────────────────
const SUPPLY_CHAIN_STEPS = [
  {
    num: '01',
    id: 'farmer',
    label: 'FARMER',
    sub: 'NDLM-verified livestock & milk entry',
    icon: Leaf,
    color: 'blue',
    route: '/farmer',
    badge: 'Passbook'
  },
  {
    num: '02',
    id: 'agent',
    label: 'VILLAGE INTAKE',
    sub: 'Measurement, receipt & offline dispatch',
    icon: Store,
    color: 'amber',
    route: '/agent',
    badge: 'Intake PWA'
  },
  {
    num: '03',
    id: 'factory',
    label: 'CHILLING CENTER',
    sub: 'Mass-balance QC & reconciliation',
    icon: Factory,
    color: 'purple',
    route: '/factory',
    badge: 'Factory QC'
  },
  {
    num: '04',
    id: 'auditor',
    label: 'REGULATORY AUDIT',
    sub: 'District surveillance & anomaly alerts',
    icon: ShieldCheck,
    color: 'emerald',
    route: '/auditor',
    badge: 'Auditor WSS'
  },
  {
    num: '05',
    id: 'consumer',
    label: 'CONSUMER',
    sub: 'Source traceability & verified quality',
    icon: Eye,
    color: 'cyan',
    route: '#traceability',
    badge: 'Traceability'
  },
];

// ─── Primary Role Dashboards Hub ──────────────────────────────────────────────
const DASHBOARDS = [
  {
    id: 'farmer',
    title: 'Farmer Passbook',
    hindi: 'किसान पासबुक',
    subtitle: 'Primary Dairy Producers',
    description: 'Digital passbook linked to 12-digit Bharat Pashudhan NDLM cattle tags. View daily collection receipts, live purity grade scores, instant UPI payouts, and listen to bilingual audio summaries.',
    icon: UserCheck,
    route: '/farmer',
    badge: 'PRIMARY PRODUCER',
    color: 'blue',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
    glowColor: 'from-blue-600/20 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 border-blue-400/30',
    features: [
      'Digital milk deposit passbook',
      'NDLM 12-digit livestock ear tag linking',
      'Milk fat %, SNF % & CLR transparency',
      'Instant UPI payout calculation',
      'Hindi & English voice readout synthesis'
    ],
    telemetry: '3 Live Profiles • 7 Ear Tags'
  },
  {
    id: 'agent',
    title: 'Village Intake Agent PWA',
    hindi: 'ग्राम दुग्ध संग्रह केंद्र',
    subtitle: 'Field Operations & Aggregation',
    description: 'Offline-ready Progressive Web App for village collection centers. Records farmer deposits, validates cattle ear tags, prints cryptographically hashed receipts, and queues dispatches offline with auto-sync.',
    icon: Store,
    route: '/agent',
    badge: 'COLLECTION INTAKE',
    color: 'amber',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    glowColor: 'from-amber-600/20 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    btnColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 border-amber-400/30',
    features: [
      'Offline-ready IndexedDB queue & auto-sync',
      'NDLM cattle biometric & yield cross-check',
      'Live density & fat analyzer intake',
      'Cryptographic SHA-256 digital seal receipt',
      'Bulk tanker batch manifest creation'
    ],
    telemetry: 'Offline Buffer Ready • Auto Sync'
  },
  {
    id: 'factory',
    title: 'Chilling Center QC',
    hindi: 'शीतलन केंद्र एवं गुणवत्ता जांच',
    subtitle: 'Processing & Reconciliation',
    description: 'Plant gate intake terminal performing real-time mass-balance reconciliation. Detects transit milk dilution, water additions, or missing volume with instant automated batch quarantine protocols.',
    icon: Factory,
    route: '/factory',
    badge: 'PROCESSING & QC',
    color: 'purple',
    borderColor: 'border-purple-500/30 hover:border-purple-500/60',
    glowColor: 'from-purple-600/20 via-purple-500/5 to-transparent',
    iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 border-purple-400/30',
    features: [
      'Mass-balance transit volume verification',
      'Weighted fat & SNF tolerance checks',
      'Automated dilution & water fraud detection',
      'Instant tanker quarantine triggers',
      'Audit log with immutable manifest seals'
    ],
    telemetry: 'Automated QC • Quarantine Gate'
  },
  {
    id: 'auditor',
    title: 'Regulatory Auditor Command',
    hindi: 'नियामक निगरानी केंद्र',
    subtitle: 'Food Safety & Surveillance',
    description: 'District regulatory surveillance center with interactive live map telemetry, sub-100ms real-time WebSocket anomaly detection, tanker quarantine controls, and cryptographic receipt audits.',
    icon: ShieldCheck,
    route: '/auditor',
    badge: 'REGULATORY SURVEILLANCE',
    color: 'emerald',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    glowColor: 'from-emerald-600/20 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border-emerald-400/30',
    features: [
      'District-wide live telemetry & geospatial map',
      'Real-time sub-100ms WebSocket anomaly alerts',
      'Cryptographic receipt tamper verification',
      'Emergency tanker quarantine controls',
      'Mass-balance supply chain integrity audits'
    ],
    telemetry: 'Sub-100ms WSS • Live Map Active'
  }
];

const DIFFERENTIATORS = [
  { Icon: Layers, title: 'End-to-End Traceability', desc: 'Every single litre is tracked from farmer collection to consumer delivery across linked supply-chain nodes.', color: 'blue' },
  { Icon: BarChart3, title: 'Mathematical Validation', desc: 'Impossible or suspicious quantities are flagged automatically through mass-balance cross-checks.', color: 'amber' },
  { Icon: Database, title: 'NDLM Livestock Linking', desc: 'Milk production context is anchored to registered 12-digit Bharat Pashudhan livestock ear tags.', color: 'blue' },
  { Icon: TrendingUp, title: 'Mass-Balance Surveillance', desc: 'Dispatched and received volumes are reconciled at every transfer point to expose transit discrepancies.', color: 'emerald' },
  { Icon: Wifi, title: 'Offline-Ready Operations', desc: 'Village intake continues in zero-connectivity environments with automatic sync when connectivity is restored.', color: 'amber' },
  { Icon: Radio, title: 'Real-Time Auditability', desc: 'Regulators receive live network-level anomaly alerts and can initiate quarantine workflows instantly.', color: 'emerald' },
];

const METRICS = [
  { label: 'Demo Farmers', value: '3', unit: 'profiles', color: 'text-blue-400' },
  { label: 'NDLM Ear Tags', value: '7', unit: 'livestock', color: 'text-blue-400' },
  { label: 'Batch Records', value: '2', unit: 'batches', color: 'text-amber-400' },
  { label: 'Deposit Receipts', value: '2', unit: 'records', color: 'text-amber-400' },
  { label: 'Alert Events', value: '1', unit: 'active', color: 'text-emerald-400' },
  { label: 'Chain Nodes', value: '5', unit: 'verified', color: 'text-emerald-400' },
];

// ─── Color helpers ─────────────────────────────────────────────────────────────
function stepColor(color) {
  const map = {
    blue: { dot: 'bg-blue-500', line: 'bg-blue-500/30', label: 'text-blue-400', ring: 'ring-blue-500/40', num: 'text-blue-400', bg: 'bg-blue-500/10' },
    amber: { dot: 'bg-amber-500', line: 'bg-amber-500/30', label: 'text-amber-400', ring: 'ring-amber-500/40', num: 'text-amber-400', bg: 'bg-amber-500/10' },
    purple: { dot: 'bg-purple-500', line: 'bg-purple-500/30', label: 'text-purple-400', ring: 'ring-purple-500/40', num: 'text-purple-400', bg: 'bg-purple-500/10' },
    emerald: { dot: 'bg-emerald-500', line: 'bg-emerald-500/30', label: 'text-emerald-400', ring: 'ring-emerald-500/40', num: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    cyan: { dot: 'bg-cyan-500', line: 'bg-cyan-500/30', label: 'text-cyan-400', ring: 'ring-cyan-500/40', num: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  };
  return map[color] || map.blue;
}

function diffColor(color) {
  const map = {
    blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  };
  return map[color] || map.blue;
}

// ─── Dashboards Quick Dropdown ────────────────────────────────────────────────
function DashboardsDropdown({ navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (path) => {
    setOpen(false);
    if (path.startsWith('#')) {
      const el = document.querySelector(path);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        <span>Dashboards</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl border border-white/15 overflow-hidden z-50 shadow-2xl backdrop-blur-2xl">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">Select Dashboard</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Live 4 Nodes</span>
            </div>

            <button
              onClick={() => go('/farmer')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-blue-500/10 rounded-xl text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-blue-300 flex items-center justify-between">
                  <span>Farmer Passbook</span>
                  <span className="text-[9px] font-mono text-zinc-500">/farmer</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">NDLM Ear Tags & Receipts</p>
              </div>
            </button>

            <button
              onClick={() => go('/agent')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-amber-500/10 rounded-xl text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 flex items-center justify-between">
                  <span>Village Intake PWA</span>
                  <span className="text-[9px] font-mono text-zinc-500">/agent</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">Offline Collection Terminal</p>
              </div>
            </button>

            <button
              onClick={() => go('/factory')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-purple-500/10 rounded-xl text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Factory className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-purple-300 flex items-center justify-between">
                  <span>Chilling Center QC</span>
                  <span className="text-[9px] font-mono text-zinc-500">/factory</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">Mass-Balance & Quarantine</p>
              </div>
            </button>

            <button
              onClick={() => go('/auditor')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-emerald-500/10 rounded-xl text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-emerald-300 flex items-center justify-between">
                  <span>Auditor Command</span>
                  <span className="text-[9px] font-mono text-zinc-500">/auditor</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">Live Map & WSS Alerts</p>
              </div>
            </button>

            <div className="border-t border-white/5 pt-1 mt-1">
              <button
                onClick={() => go('#traceability')}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-cyan-500/10 rounded-xl text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-300">Consumer Traceability</div>
                  <p className="text-[10px] text-zinc-400">Track source & milk path</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Public Navbar ─────────────────────────────────────────────────────────────
function PublicNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { label: 'Home', href: '#hero' },
    { label: 'Live Dashboards', href: '#dashboards' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Traceability', href: '#traceability' },
    { label: 'Why Anveshana', href: '#why-anveshana' },
  ];

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0A0A0B]/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Header */}
          <button onClick={() => scrollTo('#hero')} className="flex items-center space-x-2.5 text-left group">
            <div className="leading-tight">
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-white text-base tracking-wide">ANVESHANA</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">अन्वेषण</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">Dairy Supply Chain Intelligence</div>
            </div>
          </button>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center space-x-2">
            <DashboardsDropdown navigate={navigate} />

            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-blue-600/25 border border-blue-400/30"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login Gateway</span>
              <span className="sm:hidden">Login</span>
            </button>

            <button
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.08] py-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-white/5 pt-2 mt-2 space-y-1">
              <p className="text-[10px] font-mono text-zinc-500 px-3 uppercase tracking-wider">Direct Dashboards</p>
              <button onClick={() => navigate('/farmer')} className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:bg-white/5 rounded-lg">🌾 Farmer Passbook</button>
              <button onClick={() => navigate('/agent')} className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-white/5 rounded-lg">🏪 Village Intake PWA</button>
              <button onClick={() => navigate('/factory')} className="w-full text-left px-3 py-1.5 text-xs text-purple-400 hover:bg-white/5 rounded-lg">🏭 Chilling Center QC</button>
              <button onClick={() => navigate('/auditor')} className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-white/5 rounded-lg">🛡️ Auditor Command</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Traceability Result ───────────────────────────────────────────────────────
function TraceResult({ query, result, onClose }) {
  if (!result) return null;
  const isFarmer = result.type === 'farmer';

  return (
    <div className="mt-6 glass-panel rounded-2xl border border-emerald-500/30 overflow-hidden animate-fade-in shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest">TRACEABILITY VERIFIED</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono text-zinc-400">Query: {query}</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {isFarmer ? (
          <>
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">Farmer Record</h3>
              {[
                ['Farmer Name', result.farmerName],
                ['Farmer ID', result.farmerId],
                ['Village / Cluster', result.village],
                ['Registered Livestock', `${result.cattle} head (${result.breed})`],
                ['NDLM Ear Tags', result.ndlmTags.join(' · ')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-mono">{k}</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">Latest Deposit</h3>
              {[
                ['Deposit ID', result.latestDeposit.depositId],
                ['Date', result.latestDeposit.date],
                ['Volume', result.latestDeposit.volume],
                ['Fat / SNF / CLR', `${result.latestDeposit.fat} / ${result.latestDeposit.snf} / ${result.latestDeposit.clr}`],
                ['Payout', result.latestDeposit.payout],
                ['Collection Center', result.latestDeposit.center],
                ['Receipt Hash', result.latestDeposit.receiptHash],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-mono">{k}</span>
                  <span className="text-white font-semibold text-right max-w-[55%] break-all">{v}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">Batch Manifest</h3>
              {[
                ['Batch ID', result.batchId],
                ['Collection Center', result.center],
                ['Center ID', result.centerId],
                ['Dispatch Date', result.dispatchDate],
                ['Volume', result.volume],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-mono">{k}</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">Quality & Transit</h3>
              {[
                ['Fat / SNF / CLR', `${result.fat} / ${result.snf} / ${result.clr}`],
                ['Tanker', result.tanker],
                ['Driver', result.driver],
                ['Status', result.status],
                ['Manifest Hash', result.manifestHash],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-mono">{k}</span>
                  <span className={`font-semibold ${v === 'DISPATCHED' ? 'text-amber-400' : 'text-white'}`}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Journey strip */}
      <div className="px-5 pb-5">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {SUPPLY_CHAIN_STEPS.slice(0, isFarmer ? 3 : 4).map((step, i, arr) => {
            const c = stepColor(step.color);
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></div>
                  <span className={`text-[10px] font-mono font-bold ${c.label}`}>{step.label}</span>
                  <span className="text-[9px] text-emerald-400">VERIFIED</span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-px min-w-[28px] ${c.line}`}></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main HomeView ─────────────────────────────────────────────────────
export default function HomeView() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const [traceResult, setTraceResult] = useState(null);
  const [traceError, setTraceError] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);

  const currentType = SEARCH_TYPES.find(t => t.id === searchType);

  const handleTrace = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setTraceError('Please enter a traceability identifier.');
      return;
    }
    setTraceError('');
    setTraceLoading(true);
    setTraceResult(null);
    setTimeout(() => {
      const result = DEMO_TRACES[searchQuery.trim()];
      if (result) {
        setTraceResult(result);
      } else {
        setTraceError(`No demo record found for "${searchQuery.trim()}". Try: FRM-DEL-1049 or BATCH-DEL-20260821-01`);
      }
      setTraceLoading(false);
    }, 500);
  };

  const handleStepClick = (route) => {
    if (route.startsWith('#')) {
      const el = document.querySelector(route);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E1E4] overflow-x-hidden">
      <PublicNavbar />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-[90vh] flex items-center">
        {/* Background glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left — copy (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-blue-300 tracking-widest font-semibold">PREVENTATIVE DAIRY INTELLIGENCE · INDIA</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.08] tracking-tight">
                  Building India's<br />
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                    Most Trusted
                  </span>
                  <br />Dairy Supply Chain
                </h1>
                <p className="text-lg sm:text-xl text-blue-200 font-semibold tracking-wide flex items-center space-x-2">
                  <span>Verified.</span>
                  <span>•</span>
                  <span>Traceable.</span>
                  <span>•</span>
                  <span>Mathematically Proven.</span>
                </p>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl">
                  Anveshana bridges dairy farmers, collection centers, chilling facilities, and food regulators through unified live intelligence — anchored directly to Bharat Pashudhan 12-digit NDLM ear tags.
                </p>
              </div>

              {/* Main CTAs */}
              <div className="flex flex-wrap gap-3.5 pt-1">
                <button
                  onClick={() => document.querySelector('#dashboards')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] border border-blue-400/30"
                >
                  <Activity className="w-4 h-4 text-blue-200" />
                  <span>Explore Live Dashboards</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </button>

                <button
                  onClick={() => document.querySelector('#traceability')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center space-x-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all border border-white/10 hover:border-white/25"
                >
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Track Milk Source</span>
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 px-4 py-3.5 bg-white/5 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-300 font-mono text-xs rounded-xl transition-all border border-white/10 hover:border-emerald-500/30"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Portal Login</span>
                </button>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {['NDLM LIVESTOCK LINKING', 'MASS-BALANCE AUDIT', 'OFFLINE PWA QUEUE', 'SUB-100MS TELEMETRY'].map(tag => (
                  <span key={tag} className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Interactive Supply Chain Monitor (5 cols) */}
            <div className="lg:col-span-5">
              <div className="glass-panel rounded-3xl p-6 border border-blue-500/30 shadow-2xl relative">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">Live Supply Chain Pipeline</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    CLICK TO LAUNCH
                  </span>
                </div>

                {/* Clickable Pipeline Nodes */}
                <div className="space-y-2.5">
                  {SUPPLY_CHAIN_STEPS.map((step, i) => {
                    const c = stepColor(step.color);
                    const StepIcon = step.icon;
                    return (
                      <button
                        key={step.id}
                        onClick={() => handleStepClick(step.route)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <StepIcon className={`w-4 h-4 ${c.label}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-mono font-bold ${c.label}`}>{step.label}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5">{step.num}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">{step.sub}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 text-zinc-500 group-hover:text-white shrink-0 pl-2">
                          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">{step.badge}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">BHARAT PASHUDHAN NDLM</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>NETWORK ACTIVE</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ───────────────────────────────────────────────────── */}
      <section id="impact" className="border-y border-white/[0.08] bg-[#0D0D0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {METRICS.map(m => (
              <div key={m.label} className="text-center space-y-1 p-2 rounded-xl bg-white/[0.02]">
                <div className={`text-3xl font-display font-bold ${m.color} tabular-nums`}>{m.value}</div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">{m.label}</div>
                <div className="text-[10px] text-zinc-500">{m.unit} · demo network</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE LIVE DASHBOARDS HUB ─────────────────────────────────── */}
      <section id="dashboards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-mono text-blue-300 tracking-widest font-semibold uppercase">Interactive Platform Hub</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
            Role-Based Intelligence Dashboards
          </h2>
          <p className="mt-2 text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Click any dashboard below to enter its specialized workspace. Every view is fully functional and synchronized across the milk supply chain.
          </p>
        </div>

        {/* 4 Primary Dashboards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {DASHBOARDS.map((dash) => {
            const DashIcon = dash.icon;
            return (
              <div
                key={dash.id}
                className={`glass-panel rounded-3xl p-7 border ${dash.borderColor} bg-gradient-to-br ${dash.glowColor} flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl border ${dash.iconBg} group-hover:scale-110 transition-transform`}>
                      <DashIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${dash.tagColor}`}>
                        {dash.badge}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-baseline space-x-2">
                      <h3 className="text-xl font-display font-bold text-white group-hover:text-blue-300 transition-colors">
                        {dash.title}
                      </h3>
                      <span className="text-xs font-mono text-zinc-500">{dash.hindi}</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{dash.subtitle}</p>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-6">
                    {dash.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Core Capabilities</p>
                    <ul className="space-y-1.5">
                      {dash.features.map(f => (
                        <li key={f} className="flex items-start space-x-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{dash.telemetry}</span>
                  <button
                    onClick={() => navigate(dash.route)}
                    className={`flex items-center space-x-2 text-xs font-bold py-2.5 px-5 rounded-xl border transition-all ${dash.btnColor}`}
                  >
                    <span>Launch Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Consumer & Gateway Quick Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consumer Traceability Card */}
          <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-600/15 to-transparent flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                  PUBLIC TRANSPARENCY
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-white">Consumer Traceability Engine</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Scan or input milk batch numbers to see the full verified provenance trail from registered farm cattle to retail packaging.
              </p>
            </div>
            <button
              onClick={() => document.querySelector('#traceability')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-5 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 border border-cyan-400/30"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Milk Batch Now</span>
            </button>
          </div>

          {/* Login Gateway Card */}
          <div className="glass-panel rounded-3xl p-6 border border-indigo-500/30 bg-gradient-to-br from-indigo-600/15 to-transparent flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-indigo-400 bg-indigo-500/10 border border-indigo-500/30">
                  SECURE AUTHENTICATION
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-white">Role Login Gateway</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Centralized authentication for registered farmers, aggregation operators, chilling center managers, and district regulatory officers.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-5 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 border border-indigo-400/30"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Open Login Gateway</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS PIPELINE ────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#0D0D0F] border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16 space-y-2">
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-semibold">End-to-End Supply Chain</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">How the Network Works</h2>
            <p className="mt-2 text-zinc-400 max-w-xl mx-auto text-sm">
              Every litre of milk follows a verified, auditable path with cryptographic validation at every transfer.
            </p>
          </div>

          {/* Desktop: horizontal interactive flow */}
          <div className="hidden md:flex items-start justify-between gap-3 relative">
            {SUPPLY_CHAIN_STEPS.map((step, i) => {
              const c = stepColor(step.color);
              const StepIcon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepClick(step.route)}
                    className="flex-1 flex flex-col items-center text-center group p-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className={`relative w-16 h-16 rounded-2xl ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                      <StepIcon className={`w-7 h-7 ${c.label}`} />
                      <div className={`absolute -top-2 -right-2 text-[10px] font-mono font-bold ${c.num} bg-[#0D0D0F] px-2 py-0.5 rounded-full border ${c.ring.replace('ring-', 'border-')}`}>
                        {step.num}
                      </div>
                    </div>
                    <h3 className={`text-sm font-mono font-bold ${c.label} mb-1 group-hover:underline`}>{step.label}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-[130px] mb-2">{step.sub}</p>
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-white flex items-center space-x-1">
                      <span>Open {step.badge}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                  {i < SUPPLY_CHAIN_STEPS.length - 1 && (
                    <div className="flex items-center pt-8 shrink-0">
                      <div className={`w-8 h-px ${c.line}`} />
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile: vertical flow */}
          <div className="md:hidden space-y-3">
            {SUPPLY_CHAIN_STEPS.map((step) => {
              const c = stepColor(step.color);
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.route)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center shrink-0`}>
                      <StepIcon className={`w-5 h-5 ${c.label}`} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono ${c.label} tracking-widest font-bold`}>STEP {step.num}</span>
                      <h3 className="text-sm font-bold text-white">{step.label}</h3>
                      <p className="text-xs text-zinc-400">{step.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRACEABILITY SEARCH ─────────────────────────────────────────────── */}
      <section id="traceability" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-2">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300 tracking-widest font-semibold">CONSUMER TRACEABILITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Track Your Milk Source</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Enter any farmer or batch identifier below to inspect the mathematical provenance and quality checks.
            </p>
          </div>

          {/* Search card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl">
            {/* Type selector */}
            <div className="flex space-x-2 mb-5">
              {SEARCH_TYPES.map(t => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSearchType(t.id); setSearchQuery(''); setTraceResult(null); setTraceError(''); }}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${searchType === t.id ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'}`}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleTrace} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setTraceError(''); setTraceResult(null); }}
                  placeholder={currentType.placeholder}
                  className="w-full glass-input pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono tracking-wide placeholder:text-zinc-600 focus:border-cyan-400"
                />
              </div>

              {traceError && (
                <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{traceError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={traceLoading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/25 border border-cyan-400/30 hover:scale-[1.01] disabled:opacity-60"
              >
                {traceLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Tracing Provenance...</span></>
                ) : (
                  <><Search className="w-4 h-4" /><span>TRACE SUPPLY CHAIN</span></>
                )}
              </button>
            </form>

            {/* Quick demo pills */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-semibold">Try sample IDs:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_DEMOS.map(d => (
                  <button
                    key={d}
                    onClick={() => { setSearchQuery(d); setSearchType(d.startsWith('BATCH') ? 'batch' : 'farmer'); setTraceResult(null); setTraceError(''); }}
                    className="text-[11px] font-mono px-3 py-1 bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 rounded-lg text-zinc-300 transition-all"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <TraceResult query={searchQuery} result={traceResult} onClose={() => setTraceResult(null)} />
        </div>
      </section>

      {/* ── WHY ANVESHANA ───────────────────────────────────────────────────── */}
      <section id="why-anveshana" className="bg-[#0D0D0F] border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-mono text-amber-400 tracking-widest uppercase font-semibold">Key Differentiators</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Why Anveshana Works</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              Purpose-built for the operational and regulatory realities of India's dairy ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DIFFERENTIATORS.map(d => {
              const c = diffColor(d.color);
              const DIcon = d.Icon;
              return (
                <div key={d.title} className="glass-panel-interactive rounded-2xl p-6 group">
                  <div className={`inline-flex p-3 rounded-xl border ${c.bg} mb-4`}>
                    <DIcon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <h3 className="text-base font-display font-bold text-white mb-2">{d.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-display font-bold text-white text-base">ANVESHANA</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">अन्वेषण</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Dairy Supply Chain Intelligence</div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Preventative Dairy Supply Chain Intelligence with 12-Digit Bharat Pashudhan NDLM Ear Tag Validation.
              </p>
            </div>

            {/* Platform Dashboards */}
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 font-semibold">Dashboards</p>
              <div className="space-y-2">
                {[
                  ['🌾 Farmer Passbook', '/farmer'],
                  ['🏪 Village Intake PWA', '/agent'],
                  ['🏭 Chilling Center QC', '/factory'],
                  ['🛡️ Auditor Command', '/auditor']
                ].map(([label, path]) => (
                  <button key={label} onClick={() => navigate(path)} className="block text-xs text-zinc-400 hover:text-white transition-colors text-left">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consumer & Actions */}
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 font-semibold">Consumer</p>
              <div className="space-y-2">
                {[
                  ['🔍 Track Milk Batch', '#traceability'],
                  ['⚡ Live Supply Pipeline', '#how-it-works'],
                  ['💡 Platform Differentiators', '#why-anveshana']
                ].map(([label, href]) => (
                  <button key={label} onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })} className="block text-xs text-zinc-400 hover:text-white transition-colors text-left">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gateways */}
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 font-semibold">Authentication</p>
              <div className="space-y-2">
                <button onClick={() => navigate('/login')} className="block text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors text-left">
                  🔐 Multi-Role Login Gateway →
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-mono text-zinc-500">NDLM · Bharat Pashudhan</p>
                <p className="text-[10px] font-mono text-zinc-600">Digital Livestock Seal Protocol</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">Anveshana (अन्वेषण) · Dairy Supply Chain Intelligence System</span>
            <span className="text-[11px] text-zinc-600 font-mono">Real-Time Mass-Balance & Traceability Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
