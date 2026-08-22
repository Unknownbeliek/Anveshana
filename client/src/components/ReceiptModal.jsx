import React, { useState } from 'react';
import { X, ShieldCheck, Printer, Copy, Check, QrCode, Sparkles, Languages } from 'lucide-react';
import { api } from '../services/api';

const RECEIPT_I18N = {
  en: {
    modalTitle: 'Cryptographic Deposit Receipt',
    subHeader: 'Bharat Pashudhan NDLM Preventative Validation Slip',
    lblFarmerId: 'FARMER ID',
    lblFarmerName: 'FARMER NAME',
    lblCenter: 'COLLECTION CENTER',
    lblSync: 'SYNC STATUS',
    lblDeliveredVol: 'Delivered Volume:',
    lblFat: 'FAT %',
    lblSnf: 'SNF %',
    lblClr: 'CLR DENSITY',
    lblFormula: 'Formula:',
    lblTotalPayout: 'Total Disbursed Payout:',
    lblCryptoSeal: 'SHA-256 Cryptographic Seal:',
    lblCopied: 'Copied',
    lblCopy: 'Copy',
    btnVerify: 'Verify Cryptographic Seal',
    btnVerifying: 'Verifying...',
    btnPrint: 'Print Slip'
  },
  hi: {
    modalTitle: 'डिजिटल दुग्ध जमा रसीद',
    subHeader: 'भारत पशुधन एनडीएलएम दुग्ध प्रमाणीकरण पर्ची',
    lblFarmerId: 'किसान आईडी',
    lblFarmerName: 'किसान का नाम',
    lblCenter: 'संग्रह केंद्र',
    lblSync: 'सिंक स्थिति',
    lblDeliveredVol: 'कुल जमा दूध मात्रा:',
    lblFat: 'फैट %',
    lblSnf: 'एस एन एफ %',
    lblClr: 'घनत्व (CLR)',
    lblFormula: 'गणना सूत्र:',
    lblTotalPayout: 'कुल देय भुगतान:',
    lblCryptoSeal: 'सुरक्षित डिजिटल सील (SHA-256):',
    lblCopied: 'कॉपी हो गया',
    lblCopy: 'कॉपी करें',
    btnVerify: 'डिजिटल सील सत्यापित करें',
    btnVerifying: 'जांच हो रही है...',
    btnPrint: 'रसीद प्रिंट करें'
  }
};

export default function ReceiptModal({ deposit, farmer, onClose, initialLang = 'hi' }) {
  const [lang, setLang] = useState(initialLang);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const t = RECEIPT_I18N[lang] || RECEIPT_I18N.en;

  if (!deposit) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(deposit.receiptHash || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifySeal = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyReceipt({
        receiptHash: deposit.receiptHash,
        farmerCustomId: deposit.farmerCustomId || farmer?.farmerCustomId,
        volumeLiters: deposit.volumeLiters,
        calculatedPayout: deposit.calculatedPayout,
        timestamp: deposit.timestamp
      });
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ isValid: false, message: 'Verification error: ' + err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#131315] border border-blue-500/40 rounded-2xl w-full max-w-lg shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#1B1B1D] border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm text-white">{t.modalTitle}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-border">
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  lang === 'hi' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ENG
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-high transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 space-y-4 text-xs font-mono bg-[#0F0F11]">
          
          {/* Header Title */}
          <div className="text-center pb-3 border-b border-dashed border-zinc-700">
            <h2 className="font-bold text-base text-white tracking-wide">ANVESHANA DAIRY INTELLIGENCE</h2>
            <p className="text-[10px] text-zinc-400">{t.subHeader}</p>
            <div className="mt-1 text-[11px] text-blue-400 font-bold">
              ID: {deposit.depositId}
            </div>
            <div className="text-[10px] text-zinc-500">
              {new Date(deposit.timestamp).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
            </div>
          </div>

          {/* Farmer & Collection Center Info */}
          <div className="grid grid-cols-2 gap-2 text-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[10px]">{t.lblFarmerId}</span>
              <span className="font-bold text-white">{deposit.farmerCustomId || farmer?.farmerCustomId}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">{t.lblFarmerName}</span>
              <span className="font-bold text-white">{deposit.farmerName || farmer?.name || 'Registered Farmer'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">{t.lblCenter}</span>
              <span className="font-bold text-white">{deposit.centerId || 'CENT-EAST-04'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">{t.lblSync}</span>
              <span className="text-emerald-400 font-bold">{deposit.syncSource || 'DIRECT_ONLINE'}</span>
            </div>
          </div>

          {/* Quality Composition & Volume */}
          <div className="p-3 bg-surface-container rounded-xl border border-surface-border space-y-2">
            <div className="flex justify-between items-center text-sm border-b border-surface-border/60 pb-1.5">
              <span className="text-zinc-400 font-sans">{t.lblDeliveredVol}</span>
              <span className="text-white font-bold text-base">{deposit.volumeLiters} Liters</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-[#131315] p-2 rounded-lg border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">{t.lblFat}</span>
                <span className="text-sm font-bold text-blue-400">{deposit.qualityMetrics?.fat}%</span>
              </div>
              <div className="bg-[#131315] p-2 rounded-lg border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">{t.lblSnf}</span>
                <span className="text-sm font-bold text-emerald-400">{deposit.qualityMetrics?.snf}%</span>
              </div>
              <div className="bg-[#131315] p-2 rounded-lg border border-surface-border">
                <span className="text-[10px] text-zinc-400 block">{t.lblClr}</span>
                <span className="text-sm font-bold text-amber-400">{deposit.qualityMetrics?.clrDensity}</span>
              </div>
            </div>
          </div>

          {/* Payout Calculation Engine */}
          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1">
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span>{t.lblFormula}</span>
              <span>Vol × ₹40 × (FAT/4.0) × (SNF/8.5)</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-white pt-1">
              <span className="font-sans">{t.lblTotalPayout}</span>
              <span className="text-emerald-400 text-lg">₹{deposit.calculatedPayout}</span>
            </div>
          </div>

          {/* SHA-256 Integrity Seal */}
          <div className="p-2.5 bg-[#09090B] border border-surface-border rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>{t.lblCryptoSeal}</span>
              </span>
              <button
                onClick={handleCopyHash}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-0.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t.lblCopied : t.lblCopy}</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-300 break-all leading-tight">
              {deposit.receiptHash}
            </p>
          </div>

          {/* Verification Status */}
          {verifyResult && (
            <div className={`p-2.5 rounded-xl border text-[11px] ${
              verifyResult.isValid
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              {verifyResult.message}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1B1B1D] border-t border-surface-border flex items-center justify-between">
          <button
            onClick={handleVerifySeal}
            disabled={verifying}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-high hover:bg-surface-highest text-white rounded-lg text-xs font-semibold border border-surface-border transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{verifying ? t.btnVerifying : t.btnVerify}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.btnPrint}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
