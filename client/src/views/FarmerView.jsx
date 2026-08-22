import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ShieldCheck, Award, Calendar, Receipt, Info, Tag, User, Sparkles, AlertTriangle, Languages } from 'lucide-react';
import { api } from '../services/api';
import { speakDepositSummary, stopSpeaking } from '../services/tts';
import PurityGauge from '../components/PurityGauge';
import ReceiptModal from '../components/ReceiptModal';

// Comprehensive Bilingual UI Translations
const I18N = {
  en: {
    langLabel: 'English',
    voiceSummary: 'Voice Summary',
    speaking: 'Speaking...',
    selectFarmer: 'Select Farmer Profile',
    purityCardTitle: 'Dynamic Farm Purity Score',
    rollingPeriod: 'Rolling 30-Day',
    dailyCap: 'Dynamic Daily Cap',
    seasonalMult: 'Seasonal Multiplier',
    litersPerDay: 'L / day',
    cattleCardTitle: 'NDLM Registered Cattle',
    standardBadge: '12-Digit Indian Standard',
    lactating: 'Lactating',
    dry: 'Dry / Gestating',
    breed: 'Breed',
    baseYield: 'Base Daily Yield',
    bioValidationTip: 'Mathematical validation prevents procurement quantities beyond verified biological capacity.',
    passbookTitle: 'Farmer Milk Passbook & Transaction Ledger',
    recordsLogged: 'Records Logged',
    noRecords: 'No milk deposits recorded yet for this farmer.',
    thDepositId: 'Deposit ID',
    thTimestamp: 'Timestamp',
    thVolume: 'Volume (L)',
    thFat: 'FAT %',
    thSnf: 'SNF %',
    thClr: 'CLR',
    thPayout: 'Payout (₹)',
    thStatus: 'Integrity Status',
    thReceipt: 'Receipt',
    btnViewSlip: 'View Slip',
    statusSealed: 'SHA-256 SEALED',
    statusFlagged: 'FLAGGED ANOMALY'
  },
  hi: {
    langLabel: 'हिन्दी',
    voiceSummary: 'ऑडियो सारांश',
    speaking: 'बोल रहा है...',
    selectFarmer: 'किसान प्रोफ़ाइल चुनें',
    purityCardTitle: 'फार्म शुद्धता एवं गुणवत्ता स्कोर',
    rollingPeriod: '30-दिन का औसत',
    dailyCap: 'दैनिक अधिकतम दूध सीमा',
    seasonalMult: 'मौसमी गुणक',
    litersPerDay: 'लीटर / दिन',
    cattleCardTitle: 'एनडीएलएम पंजीकृत पशुधन',
    standardBadge: '12-अंक भारत पशुधन मानक',
    lactating: 'दूध देने वाली',
    dry: 'सूखी / गर्भकालीन',
    breed: 'नस्ल',
    baseYield: 'दैनिक दूध उत्पादन क्षमता',
    bioValidationTip: 'जैविक क्षमता से अधिक अनुचित दूध प्रविष्टि को रोकने के लिए स्वचालित गणितीय जांच।',
    passbookTitle: 'किसान दुग्ध पासबुक एवं डिजिटल खाता',
    recordsLogged: 'रिकॉर्ड दर्ज',
    noRecords: 'इस किसान के लिए अभी कोई दुग्ध प्रविष्टि रिकॉर्ड उपलब्ध नहीं है।',
    thDepositId: 'जमा रसीद संख्या',
    thTimestamp: 'दिनांक व समय',
    thVolume: 'मात्रा (लीटर)',
    thFat: 'फैट %',
    thSnf: 'एस एन एफ %',
    thClr: 'घनत्व (CLR)',
    thPayout: 'कुल भुगतान (₹)',
    thStatus: 'सत्यापन स्थिति',
    thReceipt: 'डिजिटल पर्ची',
    btnViewSlip: 'पर्ची देखें',
    statusSealed: 'सुरक्षित सील (SHA-256)',
    statusFlagged: 'असंगति चिह्नित'
  }
};

export default function FarmerView({ activeFarmerId = 'FRM-DEL-1049' }) {
  const [farmerId, setFarmerId] = useState(activeFarmerId);
  const [farmersList, setFarmersList] = useState([]);
  const [farmerData, setFarmerData] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [ttsLang, setTtsLang] = useState('hi');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = I18N[ttsLang] || I18N.en;

  const loadData = async () => {
    try {
      setLoading(true);
      const [farmersRes, farmerRes, depositsRes] = await Promise.all([
        api.getFarmers(),
        api.getFarmerById(farmerId),
        api.getFarmerDeposits(farmerId)
      ]);

      if (farmersRes.success) setFarmersList(farmersRes.farmers);
      if (farmerRes.success) setFarmerData(farmerRes.farmer);
      if (depositsRes.success) setDeposits(depositsRes.deposits);
    } catch (err) {
      console.error('Error loading farmer view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmerId]);

  const handleSpeakLatest = () => {
    if (deposits.length === 0) return;
    const latest = deposits[0];
    setIsSpeaking(true);
    speakDepositSummary({
      farmerName: farmerData?.name,
      volumeLiters: latest.volumeLiters,
      fat: latest.qualityMetrics?.fat,
      snf: latest.qualityMetrics?.snf,
      payout: latest.calculatedPayout,
      purityGrade: farmerData?.purityGrade,
      language: ttsLang
    });
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  if (loading && !farmerData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Profile Header & Switcher */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-emerald-500/30 border border-blue-500/40 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/10">
            {farmerData?.name?.charAt(0) || 'F'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white font-display">{farmerData?.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
                {farmerData?.farmerCustomId}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center space-x-2">
              <span>📍 {farmerData?.village}</span>
              <span>•</span>
              <span className="font-mono">UPI: {farmerData?.upiId}</span>
            </p>
          </div>
        </div>

        {/* Farmer Switcher & Language Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Language Selector + Audio Speech Button */}
          <div className="flex items-center bg-surface-container rounded-xl p-1 border border-surface-border">
            <button
              onClick={() => setTtsLang('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                ttsLang === 'hi'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setTtsLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                ttsLang === 'en'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ENG
            </button>
            <button
              onClick={handleSpeakLatest}
              disabled={deposits.length === 0}
              title={ttsLang === 'hi' ? 'ताज़ा दूध जमा पर्ची का ऑडियो सारांश सुनें' : 'Listen to latest deposit voice summary'}
              className={`ml-1 flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-600/30 ${
                isSpeaking ? 'animate-pulse' : ''
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? t.speaking : t.voiceSummary}</span>
            </button>
          </div>

          {/* Farmer Switcher Dropdown */}
          <select
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 border-surface-border text-zinc-200"
          >
            {farmersList.map((f) => (
              <option key={f.farmerCustomId} value={f.farmerCustomId} className="bg-[#131315]">
                {f.name} ({f.farmerCustomId})
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Main Grid: Farm Purity Gauge + Registered Cattle + Latest Deposit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Farm Purity Rating (0-100) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-semibold text-sm text-white">{t.purityCardTitle}</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">{t.rollingPeriod}</span>
          </div>

          <div className="py-4">
            <PurityGauge
              score={farmerData?.purityScore}
              grade={farmerData?.purityGrade}
              details={farmerData?.purityDetails}
            />
          </div>

          <div className="bg-surface-container/60 p-3 rounded-xl border border-surface-border/60 text-[11px] text-zinc-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">{t.dailyCap}:</span>
              <span className="font-mono font-bold text-emerald-400">{farmerData?.dynamicCapacity} {t.litersPerDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{t.seasonalMult}:</span>
              <span className="font-mono text-white">{farmerData?.seasonalMultiplier || 1.0}x</span>
            </div>
          </div>
        </div>

        {/* Card 2: Registered Cattle Inventory (Bharat Pashudhan NDLM Ear Tags) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <h3 className="font-display font-semibold text-sm text-white">
                {t.cattleCardTitle} ({farmerData?.cattle?.length || 0})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {t.standardBadge}
            </span>
          </div>

          {/* Cattle List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {farmerData?.cattle?.map((cow) => (
              <div
                key={cow.earTagId}
                className="bg-[#18181B] p-3.5 rounded-xl border border-surface-border hover:border-blue-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400">
                    🏷️ {cow.earTagId}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    cow.isLactating !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {cow.isLactating !== false ? t.lactating : t.dry}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t.breed}:</span>
                    <span className="font-semibold text-white">{cow.breed} ({cow.type})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t.baseYield}:</span>
                    <span className="font-mono text-emerald-400 font-bold">{cow.baseDailyYield} {t.litersPerDay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-500/20 text-[11px] text-zinc-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{t.bioValidationTip}</span>
          </div>
        </div>

      </div>

      {/* Historical Passbook Ledger */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-sm text-white">
              {t.passbookTitle}
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {deposits.length} {t.recordsLogged}
          </span>
        </div>

        {deposits.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs font-mono">
            {t.noRecords}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-border text-zinc-400 bg-surface-container/50">
                  <th className="py-2.5 px-3">{t.thDepositId}</th>
                  <th className="py-2.5 px-3">{t.thTimestamp}</th>
                  <th className="py-2.5 px-3">{t.thVolume}</th>
                  <th className="py-2.5 px-3">{t.thFat}</th>
                  <th className="py-2.5 px-3">{t.thSnf}</th>
                  <th className="py-2.5 px-3">{t.thClr}</th>
                  <th className="py-2.5 px-3">{t.thPayout}</th>
                  <th className="py-2.5 px-3">{t.thStatus}</th>
                  <th className="py-2.5 px-3 text-right">{t.thReceipt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60 text-zinc-300">
                {deposits.map((dep) => (
                  <tr key={dep.depositId} className="hover:bg-surface-high/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{dep.depositId}</td>
                    <td className="py-3 px-3 text-zinc-400">{new Date(dep.timestamp).toLocaleDateString()} {new Date(dep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{dep.volumeLiters} L</td>
                    <td className="py-3 px-3 text-blue-400">{dep.qualityMetrics?.fat}%</td>
                    <td className="py-3 px-3 text-emerald-400">{dep.qualityMetrics?.snf}%</td>
                    <td className="py-3 px-3 text-amber-400">{dep.qualityMetrics?.clrDensity}</td>
                    <td className="py-3 px-3 font-bold text-white">₹{dep.calculatedPayout}</td>
                    <td className="py-3 px-3">
                      {dep.isFlagged ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-alert/20 text-red-400 border border-crimson-alert/30">
                          {t.statusFlagged}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {t.statusSealed}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(dep)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[11px] font-semibold border border-blue-500/30 transition-all"
                      >
                        {t.btnViewSlip}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cryptographic Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          deposit={selectedReceipt}
          farmer={farmerData}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
