import React from 'react';
import { Award, ShieldCheck, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function PurityGauge({ score = 100, grade = 'Grade A', details = null, size = 'md' }) {
  // Clamp score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0));
  
  // Radius and stroke calculation
  const radius = size === 'sm' ? 36 : 58;
  const stroke = size === 'sm' ? 6 : 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let strokeColor = '#10B981'; // Emerald
  let gradeBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let tierLabel = 'Standard Market Rate';

  if (normalizedScore >= 90) {
    strokeColor = '#3B82F6'; // Electric Blue / Grade A+
    gradeBadgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    tierLabel = 'Grade A+ (+₹3.00/L Premium Bonus Tier)';
  } else if (normalizedScore >= 75) {
    strokeColor = '#10B981'; // Emerald
    gradeBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    tierLabel = 'Grade A (Standard Market Rate)';
  } else if (normalizedScore >= 60) {
    strokeColor = '#F59E0B'; // Amber
    gradeBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    tierLabel = 'Grade B (Watchlist Monitoring)';
  } else {
    strokeColor = '#EF4444'; // Crimson
    gradeBadgeColor = 'bg-crimson-alert/20 text-red-400 border-crimson-alert/40';
    tierLabel = 'Grade C (Procurement Restricted)';
  }

  return (
    <div className="flex flex-col items-center">
      
      {/* Circular SVG Progress */}
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg] transition-all duration-700 ease-out"
        >
          {/* Background Track */}
          <circle
            stroke="rgba(255,255,255,0.06)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated Value Arc */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {normalizedScore.toFixed(0)}
          </span>
          <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
            Purity
          </span>
        </div>
      </div>

      {/* Grade Tier Badge */}
      <div className="mt-3 flex flex-col items-center space-y-1">
        <div className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono border ${gradeBadgeColor} flex items-center space-x-1 shadow-sm`}>
          <Award className="w-3.5 h-3.5" />
          <span>{grade || (normalizedScore >= 90 ? 'Grade A+' : normalizedScore >= 75 ? 'Grade A' : 'Grade B')}</span>
        </div>
        <span className="text-[11px] text-zinc-400 text-center font-medium">{tierLabel}</span>
      </div>

      {/* Breakdown Subscores if provided */}
      {details?.breakdown && (
        <div className="w-full mt-4 pt-3 border-t border-surface-border/60 space-y-2 text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Volume Stability (30 pts):</span>
            <span className="font-mono text-white font-semibold">{details.breakdown.volumeStability} / 30</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(details.breakdown.volumeStability / 30) * 100}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-zinc-400">
            <span>Quality Consistency (35 pts):</span>
            <span className="font-mono text-white font-semibold">{details.breakdown.qualityConsistency} / 35</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(details.breakdown.qualityConsistency / 35) * 100}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-zinc-400">
            <span>Clean Streak (20 pts):</span>
            <span className="font-mono text-white font-semibold">{details.breakdown.anomalyCleanStreak} / 20</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(details.breakdown.anomalyCleanStreak / 20) * 100}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-zinc-400">
            <span>NDLM Compliance (15 pts):</span>
            <span className="font-mono text-white font-semibold">{details.breakdown.ndlmCompliance} / 15</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${(details.breakdown.ndlmCompliance / 15) * 100}%` }}></div>
          </div>
        </div>
      )}

    </div>
  );
}
