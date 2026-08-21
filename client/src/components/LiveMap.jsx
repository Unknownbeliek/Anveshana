import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Factory, Store, MapPin, Radio, Activity, Truck, AlertTriangle } from 'lucide-react';

export default function LiveMap({ nodes = [], alerts = [], onSelectNode }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const defaultNodes = [
    {
      id: 'SILO-MAIN-01',
      name: 'Central Dairy Silo & Chilling Terminal',
      type: 'PROCESSING_PLANT',
      x: 50,
      y: 45,
      status: alerts.some(a => a.type === 'FACTORY_BATCH_QUARANTINED') ? 'QUARANTINE_ALERT' : 'OPERATIONAL',
      capacityLiters: 50000,
      currentStockLiters: 28450,
      address: 'G.T. Karnal Road Industrial Complex, Delhi'
    },
    {
      id: 'CENT-EAST-04',
      name: 'East Delhi Aggregation Hub 04',
      type: 'COLLECTION_CENTER',
      x: 75,
      y: 65,
      status: alerts.some(a => a.centerId === 'CENT-EAST-04' && !a.isResolved) ? 'ANOMALY_DETECTED' : 'HEALTHY',
      dailyIntakeLiters: 5420,
      registeredFarmers: 42,
      address: 'Anand Vihar Co-op Zone, Delhi East'
    },
    {
      id: 'CENT-NORTH-02',
      name: 'North Delhi Aggregation Hub 02',
      type: 'COLLECTION_CENTER',
      x: 35,
      y: 20,
      status: 'HEALTHY',
      dailyIntakeLiters: 4890,
      registeredFarmers: 38,
      address: 'Alipur Block Village Center, Delhi North'
    },
    {
      id: 'CENT-WEST-01',
      name: 'West Delhi Collection Post 01',
      type: 'COLLECTION_CENTER',
      x: 20,
      y: 65,
      status: 'HEALTHY',
      dailyIntakeLiters: 3150,
      registeredFarmers: 29,
      address: 'Najafgarh Dairy Belt, Delhi West'
    },
    {
      id: 'FARM-NODE-1049',
      name: 'Ramesh Yadav Farm (2 Gir Cows)',
      type: 'NDLM_FARM_NODE',
      x: 82,
      y: 82,
      farmerCustomId: 'FRM-DEL-1049',
      status: alerts.some(a => a.farmerCustomId === 'FRM-DEL-1049' && !a.isResolved) ? 'BREACH_CRITICAL' : 'VERIFIED_OPTIMAL',
      capacityMax: 24.0,
      purityScore: 94.5
    }
  ];

  const mapNodes = nodes.length > 0 ? nodes.map((n, i) => ({
    ...n,
    x: defaultNodes[i]?.x || (25 + (i * 20)),
    y: defaultNodes[i]?.y || (30 + (i * 15))
  })) : defaultNodes;

  const selectedNode = mapNodes.find(n => n.id === selectedNodeId) || mapNodes[0];

  return (
    <div className="relative w-full h-[480px] bg-[#0E0E10] border border-surface-border rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Background HUD Grid */}
      <div className="absolute inset-0 hud-grid opacity-60 pointer-events-none"></div>

      {/* Radar Overlay Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent pointer-events-none"></div>

      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3 bg-[#131315]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-surface-border shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-display font-bold text-xs text-white">GIS Supply Chain Telemetry</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono border-l border-zinc-700 pl-2.5">
          District: NCT Delhi Agri-Zone
        </span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center space-x-3 bg-[#131315]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-surface-border text-[11px] font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-zinc-300">Optimal</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-zinc-300">Warning</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-crimson-alert node-pulse-crimson"></span>
          <span className="text-red-300 font-bold">Anomaly / Quarantine</span>
        </div>
      </div>

      {/* SVG Supply Chain Network Lines & Transit Arrows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="alertRouteLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Route: East Hub to Silo */}
        <line
          x1="75%" y1="65%"
          x2="50%" y2="45%"
          stroke="url(#routeLine)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="opacity-80"
        />

        {/* Route: North Hub to Silo */}
        <line
          x1="35%" y1="20%"
          x2="50%" y2="45%"
          stroke="url(#routeLine)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="opacity-80"
        />

        {/* Route: West Hub to Silo */}
        <line
          x1="20%" y1="65%"
          x2="50%" y2="45%"
          stroke="url(#routeLine)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="opacity-60"
        />

        {/* Route: Farm Node to East Hub */}
        <line
          x1="82%" y1="82%"
          x2="75%" y2="65%"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeDasharray="4 3"
          className="opacity-75"
        />
      </svg>

      {/* Interactive Map Nodes */}
      {mapNodes.map((node) => {
        const isAnomaly = node.status.includes('ANOMALY') || node.status.includes('BREACH') || node.status.includes('QUARANTINE');
        const isSilo = node.type === 'PROCESSING_PLANT';
        const isFarm = node.type === 'NDLM_FARM_NODE';
        const isSelected = selectedNodeId === node.id;

        return (
          <div
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-300 ${
              isSelected ? 'scale-125 z-30' : 'hover:scale-115'
            }`}
          >
            {/* Pulsing Aura if Anomaly */}
            <div className={`relative flex items-center justify-center p-2 rounded-full border transition-all ${
              isAnomaly
                ? 'bg-red-950/80 border-crimson-alert node-pulse-crimson text-red-400'
                : isSilo
                ? 'bg-blue-950/80 border-blue-400 text-blue-300 shadow-lg shadow-blue-500/30'
                : isFarm
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900 border-zinc-500 text-zinc-300 hover:border-blue-400'
            }`}>
              {isSilo ? (
                <Factory className="w-5 h-5" />
              ) : isFarm ? (
                <Store className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </div>

            {/* Label Tag */}
            <div className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-mono border backdrop-blur-md transition-all ${
              isAnomaly
                ? 'bg-red-950/90 text-red-200 border-red-500/50'
                : 'bg-zinc-900/90 text-zinc-300 border-surface-border'
            }`}>
              {node.id}
            </div>
          </div>
        );
      })}

      {/* Selected Node Details Side Panel (Floating Glass Panel) */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-20 w-72 bg-[#131315]/95 backdrop-blur-xl border border-surface-border p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <span className="font-mono text-[10px] text-blue-400 uppercase tracking-wider">{selectedNode.type}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              selectedNode.status.includes('ANOMALY') || selectedNode.status.includes('BREACH') || selectedNode.status.includes('QUARANTINE')
                ? 'bg-crimson-alert/20 text-red-400 border border-crimson-alert/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {selectedNode.status}
            </span>
          </div>

          <h4 className="font-semibold text-white text-sm">{selectedNode.name}</h4>
          <p className="text-[11px] text-zinc-400">{selectedNode.address || 'NDLM Verified Farm Node'}</p>

          <div className="pt-2 border-t border-surface-border/60 space-y-1.5 font-mono text-[11px]">
            {selectedNode.capacityLiters && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Silo Capacity:</span>
                <span className="text-white font-bold">{selectedNode.capacityLiters.toLocaleString()} L</span>
              </div>
            )}
            {selectedNode.currentStockLiters && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Silo Stock:</span>
                <span className="text-blue-400 font-bold">{selectedNode.currentStockLiters.toLocaleString()} L</span>
              </div>
            )}
            {selectedNode.dailyIntakeLiters && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Today Intake:</span>
                <span className="text-emerald-400 font-bold">{selectedNode.dailyIntakeLiters.toLocaleString()} L</span>
              </div>
            )}
            {selectedNode.capacityMax && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Biological Cap Limit:</span>
                <span className="text-amber-400 font-bold">{selectedNode.capacityMax} L/day</span>
              </div>
            )}
            {selectedNode.purityScore && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Farm Purity Rating:</span>
                <span className="text-emerald-400 font-bold">{selectedNode.purityScore} / 100</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
