import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, UserCheck, Store, Factory, ChevronDown, Search,
  ArrowRight, Milk, Map, Activity, BarChart3, Wifi, Lock,
  CheckCircle2, AlertTriangle, Database, Radio, TrendingUp,
  Layers, Eye, Leaf, Globe, ChevronRight, Package, X
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

const SUPPLY_CHAIN_STEPS = [
  { num: '01', id: 'farmer', label: 'FARMER', sub: 'NDLM-verified livestock & milk entry', icon: Leaf, color: 'blue' },
  { num: '02', id: 'agent', label: 'VILLAGE INTAKE', sub: 'Measurement, receipt & offline dispatch', icon: Store, color: 'amber' },
  { num: '03', id: 'factory', label: 'CHILLING CENTER', sub: 'Mass-balance QC & reconciliation', icon: Factory, color: 'amber' },
  { num: '04', id: 'auditor', label: 'REGULATORY AUDIT', sub: 'District surveillance & anomaly alerts', icon: ShieldCheck, color: 'emerald' },
  { num: '05', id: 'consumer', label: 'CONSUMER', sub: 'Source traceability & verified quality', icon: Eye, color: 'cyan' },
];

const ROLE_CARDS = [
  {
    role: 'Farmers',
    accent: 'border-blue-500/40',
    iconBg: 'bg-blue-500/15 border-blue-500/30',
    iconColor: 'text-blue-400',
    Icon: UserCheck,
    tag: 'PRIMARY PRODUCERS',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    route: '/farmer',
    features: [
      'Digital farmer passbook',
      'NDLM 12-digit livestock IDs',
      'Milk deposit history',
      'Purity & quality score',
      'Transaction visibility'
    ]
  },
  {
    role: 'Operators',
    accent: 'border-amber-500/40',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconColor: 'text-amber-400',
    Icon: Store,
    tag: 'SUPPLY CHAIN OPS',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    route: '/agent',
    features: [
      'Offline-ready village intake',
      'Milk volume & quality entry',
      'Batch creation & dispatch',
      'Chilling center QC',
      'Mass-balance validation'
    ]
  },
  {
    role: 'Regulators',
    accent: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    Icon: ShieldCheck,
    tag: 'REGULATORY',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    route: '/auditor',
    features: [
      'District-level surveillance',
      'Real-time anomaly detection',
      'Quarantine alert system',
      'Cryptographic receipt audit',
      'Supply-chain monitoring'
    ]
  },
  {
    role: 'Consumers',
    accent: 'border-cyan-500/40',
    iconBg: 'bg-cyan-500/15 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    Icon: Eye,
    tag: 'PUBLIC TRUST',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    route: null,
    features: [
      'Source traceability',
      'Farmer-to-shelf journey',
      'Verified batch records',
      'Quality snapshot',
      'Supply-chain transparency'
    ]
  }
];

const DIFFERENTIATORS = [
  { Icon: Layers, title: 'End-to-End Traceability', desc: 'Every litre is tracked from farmer collection to consumer delivery across linked supply-chain nodes.', color: 'blue' },
  { Icon: BarChart3, title: 'Mathematical Validation', desc: 'Impossible or suspicious quantities are flagged automatically through mass-balance cross-checks.', color: 'amber' },
  { Icon: Database, title: 'NDLM Livestock Linking', desc: 'Milk production context is anchored to registered 12-digit Bharat Pashudhan livestock ear tags.', color: 'blue' },
  { Icon: TrendingUp, title: 'Mass-Balance Surveillance', desc: 'Dispatched and received volumes are reconciled at every transfer point to expose transit discrepancies.', color: 'emerald' },
  { Icon: Wifi, title: 'Offline-Ready Operations', desc: 'Village intake continues in low-connectivity environments with automatic sync when connectivity is restored.', color: 'amber' },
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

// ─── Login Dropdown ────────────────────────────────────────────────────────────
function LoginDropdown({ navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 border border-blue-400/20"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Login</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl">
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] font-mono text-zinc-500 px-3 pt-2 pb-1 uppercase tracking-widest">Farmer Portal</p>
            <button onClick={() => go('/farmer')} className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-blue-500/10 hover:text-blue-300 rounded-xl text-sm text-zinc-200 transition-all text-left group">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Farmer Passbook</span>
              <ChevronRight className="w-3 h-3 ml-auto text-zinc-600 group-hover:text-blue-400" />
            </button>

            <p className="text-[10px] font-mono text-zinc-500 px-3 pt-2 pb-1 uppercase tracking-widest">Supply Chain Portal</p>
            <button onClick={() => go('/agent')} className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-amber-500/10 hover:text-amber-300 rounded-xl text-sm text-zinc-200 transition-all text-left group">
              <Store className="w-4 h-4 text-amber-400" />
              <span>Village Intake PWA</span>
              <ChevronRight className="w-3 h-3 ml-auto text-zinc-600 group-hover:text-amber-400" />
            </button>
            <button onClick={() => go('/factory')} className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-amber-500/10 hover:text-amber-300 rounded-xl text-sm text-zinc-200 transition-all text-left group">
              <Factory className="w-4 h-4 text-amber-400" />
              <span>Chilling Center QC</span>
              <ChevronRight className="w-3 h-3 ml-auto text-zinc-600 group-hover:text-amber-400" />
            </button>

            <p className="text-[10px] font-mono text-zinc-500 px-3 pt-2 pb-1 uppercase tracking-widest">Regulatory Portal</p>
            <button onClick={() => go('/auditor')} className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl text-sm text-zinc-200 transition-all text-left group">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Auditor Command</span>
              <ChevronRight className="w-3 h-3 ml-auto text-zinc-600 group-hover:text-emerald-400" />
            </button>

            <div className="border-t border-white/5 mt-1 pt-1">
              <button onClick={() => go('/login')} className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-white/5 rounded-xl text-sm text-zinc-400 transition-all text-left group">
                <Activity className="w-4 h-4 text-zinc-500" />
                <span>Secure Login Gateway</span>
                <ChevronRight className="w-3 h-3 ml-auto text-zinc-600 group-hover:text-zinc-400" />
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
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Traceability', href: '#traceability' },
    { label: 'Impact', href: '#impact' },
  ];

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0A0A0B]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button onClick={() => scrollTo('#hero')} className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 p-[1.5px]">
              <div className="w-full h-full bg-[#0A0A0B] rounded-[9px] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-white" style={{ width: '1.1rem', height: '1.1rem' }} />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-white text-sm tracking-wide">ANVESHANA</div>
              <div className="text-[10px] text-zinc-500 font-mono">अन्वेषण · Dairy Intelligence</div>
            </div>
          </button>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => scrollTo('#traceability')}
              className="hidden sm:flex items-center px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="Track Milk"
            >
              <Search className="w-4 h-4" />
            </button>
            <LoginDropdown navigate={navigate} />
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
          <div className="md:hidden border-t border-white/[0.07] py-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {item.label}
              </button>
            ))}
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
    <div className="mt-6 glass-panel rounded-2xl border border-emerald-500/30 overflow-hidden animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest">TRACEABILITY VERIFIED</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono text-zinc-500">Query: {query}</span>
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
                  <span className="text-zinc-500 font-mono">{k}</span>
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
                  <span className="text-zinc-500 font-mono">{k}</span>
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
                  <span className="text-zinc-500 font-mono">{k}</span>
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
                  <span className="text-zinc-500 font-mono">{k}</span>
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
                  <div className={`w-2 h-2 rounded-full ${c.dot}`}></div>
                  <span className={`text-[10px] font-mono font-bold ${c.label}`}>{step.label}</span>
                  <span className="text-[9px] text-zinc-600">VERIFIED</span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-px min-w-[24px] ${c.line}`}></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main HomeView ─────────────────────────────────────────────────────────────
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
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E1E4] overflow-x-hidden">
      <PublicNavbar />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative hud-grid min-h-[88vh] flex items-center">
        {/* Background glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-blue-400 tracking-widest font-semibold">DAIRY INTELLIGENCE PLATFORM · INDIA</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight">
                  Building India's<br />
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Most Trusted
                  </span>
                  <br />Dairy Supply Chain
                </h1>
                <p className="text-xl text-blue-300 font-semibold tracking-wide">Verified. Traceable. Transparent.</p>
                <p className="text-zinc-400 text-base leading-relaxed max-w-lg">
                  Anveshana connects farmers, collection centers, chilling facilities, regulators and consumers through one traceable dairy intelligence network — anchored to NDLM-registered livestock.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => document.querySelector('#traceability')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] border border-blue-400/20"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Your Milk</span>
                </button>
                <button
                  onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20"
                >
                  <span>How It Works</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-3 pt-2">
                {['SECURE', 'TRACEABLE', 'NDLM VERIFIED', 'REAL-TIME'].map(tag => (
                  <span key={tag} className="text-[10px] font-mono text-zinc-500 border border-white/8 px-2.5 py-1 rounded-full tracking-widest">{tag}</span>
                ))}
              </div>
            </div>

            {/* Right — supply chain visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                {/* Central network SVG diagram */}
                <div className="glass-panel rounded-3xl p-6 space-y-3 border-blue-500/20">
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Live Supply Chain Monitor</span>
                  </div>
                  {SUPPLY_CHAIN_STEPS.map((step, i) => {
                    const c = stepColor(step.color);
                    const StepIcon = step.icon;
                    return (
                      <div key={step.id} className="flex items-start space-x-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-8 h-8 rounded-xl ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center`}>
                            <StepIcon className={`w-4 h-4 ${c.label}`} />
                          </div>
                          {i < SUPPLY_CHAIN_STEPS.length - 1 && (
                            <div className={`w-px h-4 ${c.line} mt-1`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <div className={`text-xs font-mono font-bold ${c.label}`}>{step.label}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{step.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-600">NDLM · BHARAT PASHUDHAN</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 node-pulse-emerald" />
                      <span className="text-[10px] font-mono text-emerald-500">ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ────────────────────────────────────────────────────────── */}
      <section id="impact" className="border-y border-white/[0.06] bg-[#0D0D0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {METRICS.map(m => (
              <div key={m.label} className="text-center space-y-1">
                <div className={`text-3xl font-display font-bold ${m.color} tabular-nums`}>{m.value}</div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{m.label}</div>
                <div className="text-[10px] text-zinc-600">{m.unit} · demo dataset</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE CARDS ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-3">Platform Overview</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">What Anveshana Does</h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">A unified intelligence layer for every participant in the dairy supply chain.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {ROLE_CARDS.map(card => {
            const CardIcon = card.Icon;
            return (
              <div key={card.role} className={`glass-panel rounded-2xl p-6 border ${card.accent} flex flex-col group hover:-translate-y-1 transition-transform duration-200`}>
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-2.5 rounded-xl border ${card.iconBg}`}>
                    <CardIcon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${card.tagColor}`}>{card.tag}</span>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-4">For {card.role}</h3>
                <ul className="space-y-2 flex-1">
                  {card.features.map(f => (
                    <li key={f} className="flex items-start space-x-2 text-xs text-zinc-400">
                      <ChevronRight className={`w-3 h-3 ${card.iconColor} shrink-0 mt-0.5`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {card.route && (
                  <button
                    onClick={() => navigate(card.route)}
                    className={`mt-5 flex items-center justify-center space-x-1.5 text-xs font-semibold py-2 px-4 rounded-lg border ${card.iconBg} ${card.iconColor} hover:opacity-80 transition-opacity`}
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#0D0D0F] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-3">Supply Chain Intelligence</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">How It Works</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">Every litre of milk follows a verified, auditable path from farm to consumer.</p>
          </div>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:flex items-start justify-between gap-3 relative">
            {SUPPLY_CHAIN_STEPS.map((step, i) => {
              const c = stepColor(step.color);
              const StepIcon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex-1 flex flex-col items-center text-center group">
                    <div className={`relative w-14 h-14 rounded-2xl ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <StepIcon className={`w-6 h-6 ${c.label}`} />
                      <div className={`absolute -top-2 -right-2 text-[10px] font-mono font-bold ${c.num} bg-[#0D0D0F] px-1.5 rounded-full border ${c.ring.replace('ring-', 'border-')}`}>{step.num}</div>
                    </div>
                    <h3 className={`text-sm font-mono font-bold ${c.label} mb-1`}>{step.label}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-[120px]">{step.sub}</p>
                  </div>
                  {i < SUPPLY_CHAIN_STEPS.length - 1 && (
                    <div className="flex items-center pt-6 shrink-0">
                      <div className={`w-8 h-px ${c.line}`} />
                      <ChevronRight className="w-3 h-3 text-zinc-700" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile: vertical flow */}
          <div className="md:hidden space-y-4">
            {SUPPLY_CHAIN_STEPS.map((step, i) => {
              const c = stepColor(step.color);
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.ring.replace('ring-', 'border-')} flex items-center justify-center`}>
                      <StepIcon className={`w-5 h-5 ${c.label}`} />
                    </div>
                    {i < SUPPLY_CHAIN_STEPS.length - 1 && <div className={`w-px h-8 ${c.line} mt-1`} />}
                  </div>
                  <div className="pt-1.5">
                    <span className={`text-[10px] font-mono ${c.label} tracking-widest`}>{step.num}</span>
                    <h3 className={`text-sm font-bold ${c.label} mt-0.5`}>{step.label}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRACEABILITY SEARCH ─────────────────────────────────────────────── */}
      <section id="traceability" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 tracking-widest font-semibold">CONSUMER TRACEABILITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Track Your Milk.</h2>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Know Your Source.</h2>
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
              Enter a traceability identifier to discover the verified journey of your milk across the supply chain.
            </p>
          </div>

          {/* Search card */}
          <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20">
            {/* Type selector */}
            <div className="flex space-x-2 mb-5">
              {SEARCH_TYPES.map(t => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSearchType(t.id); setSearchQuery(''); setTraceResult(null); setTraceError(''); }}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${searchType === t.id ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300' : 'bg-white/3 border-white/8 text-zinc-400 hover:border-white/15'}`}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleTrace} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setTraceError(''); setTraceResult(null); }}
                  placeholder={currentType.placeholder}
                  className="w-full glass-input pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono tracking-wide"
                />
              </div>

              {traceError && (
                <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{traceError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={traceLoading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/20 border border-cyan-400/20 hover:scale-[1.01] disabled:opacity-60"
              >
                {traceLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Tracing...</span></>
                ) : (
                  <><Search className="w-4 h-4" /><span>TRACE SUPPLY CHAIN</span></>
                )}
              </button>
            </form>

            {/* Quick demos */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Demo examples</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_DEMOS.map(d => (
                  <button
                    key={d}
                    onClick={() => { setSearchQuery(d); setSearchType(d.startsWith('BATCH') ? 'batch' : 'farmer'); setTraceResult(null); setTraceError(''); }}
                    className="text-[11px] font-mono px-2.5 py-1 bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/8 hover:border-cyan-500/30 rounded-lg text-zinc-400 transition-all"
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
      <section className="bg-[#0D0D0F] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">Differentiators</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Why Anveshana</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">Purpose-built for the complexity of India's dairy supply chain.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DIFFERENTIATORS.map(d => {
              const c = diffColor(d.color);
              const DIcon = d.Icon;
              return (
                <div key={d.title} className="glass-panel-interactive rounded-2xl p-5 group">
                  <div className={`inline-flex p-2.5 rounded-xl border ${c.bg} mb-4`}>
                    <DIcon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <h3 className="text-sm font-display font-bold text-white mb-2">{d.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONSUMER TRUST ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-600/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-4">Consumer Transparency</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-5">
              From Source to Shelf,<br />Visibility Matters.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Consumers should not have to blindly trust a label. Anveshana provides a digital trail across the dairy supply chain — connecting the registered livestock, the collection center, the chilling facility, and the distribution network in one auditable record.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { label: 'TRACE THE SOURCE', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
                { label: 'UNDERSTAND THE JOURNEY', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
                { label: 'VERIFY THE RECORD', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
              ].map(t => (
                <span key={t.label} className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg border ${t.color}`}>{t.label}</span>
              ))}
            </div>
            <button
              onClick={() => document.querySelector('#traceability')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] border border-emerald-400/20"
            >
              <Eye className="w-4 h-4" />
              <span>Track Your Milk</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-[#0D0D0F] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">Know where your milk comes from.</h2>
          <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">Anveshana brings visibility, verification, and trust to every litre of milk in India's dairy chain.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => document.querySelector('#traceability')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] border border-blue-400/20"
            >
              <Search className="w-4 h-4" />
              <span>Track Your Milk</span>
            </button>
            <button
              onClick={() => document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <span>Explore Anveshana</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 p-[1.5px]">
                  <div className="w-full h-full bg-[#0A0A0B] rounded-[7px] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <div className="font-display font-bold text-white text-sm">ANVESHANA</div>
                  <div className="text-[10px] text-zinc-600 font-mono">अन्वेषण</div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">Preventative Dairy Supply Chain Intelligence</p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Platform</p>
              <div className="space-y-2">
                {[['Farmer Passbook', '/farmer'], ['Village Intake', '/agent'], ['Chilling Center QC', '/factory'], ['Auditor Command', '/auditor']].map(([label, path]) => (
                  <button key={label} onClick={() => navigate(path)} className="block text-xs text-zinc-500 hover:text-zinc-200 transition-colors text-left">{label}</button>
                ))}
              </div>
            </div>

            {/* Consumer */}
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Consumer</p>
              <div className="space-y-2">
                {[['Track Milk', '#traceability'], ['How It Works', '#how-it-works'], ['Supply Chain', '#how-it-works']].map(([label, href]) => (
                  <button key={label} onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })} className="block text-xs text-zinc-500 hover:text-zinc-200 transition-colors text-left">{label}</button>
                ))}
              </div>
            </div>

            {/* Demo */}
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Demo</p>
              <div className="space-y-2">
                <button onClick={() => navigate('/login')} className="block text-xs text-zinc-500 hover:text-zinc-200 transition-colors text-left">Login Gateway</button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-mono text-zinc-600">NDLM · Bharat Pashudhan</p>
                <p className="text-[10px] font-mono text-zinc-700">Livestock Ear Tag Validation</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-700 font-mono">Anveshana (अन्वेषण) · Preventative Dairy Supply Chain Intelligence</span>
            <span className="text-[11px] text-zinc-700 font-mono">Demo dataset — not real production data</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
