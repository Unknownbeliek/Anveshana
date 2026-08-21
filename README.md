# Anveshana (अन्वेषण) — Preventative Dairy Supply Chain Intelligence

> **Production Spec**: `2.0.0-PRODUCTION-SPEC`  
> **Track**: Open Innovation / Social Impact & Agri-Tech (Data-Driven Anomaly Detection)  
> **Architecture**: Monolithic MERN Stack + PWA IndexedDB Offline Queue + Socket.io Real-Time Pipeline  

---

## 🚀 Overview

Conventional dairy QA relies on reactive chemical screening at collection booths, which synthetic milk syndicates consistently bypass using precision cocktails of urea, maltodextrin, neutralized detergents, and vegetable oils tuned to standard Fat/SNF levels.

**Anveshana** shifts from reactive testing to **Preventative Mathematical Validation and Supply-Chain Mass-Balance Auditing**:
- Enforces livestock biological capacity limits using the **Bharat Pashudhan / NDLM 12-digit ear tag registry**.
- Seals transactions with **SHA-256 cryptographic receipts**.
- Reconciles transit mass-balance at factory chilling centers ($\Delta V \in [-1.0\%, +1.0\%]$) with automated **Digital Quarantine**.
- Streams high-priority anomaly incidents to an **Auditor Command Center** via WebSockets (<100ms propagation).

---

## 👥 Personas & Routes

| Route | Persona | Key Features |
| :--- | :--- | :--- |
| `/farmer` | **Smallholder Farmer** | Passbook ledger, Circular Purity Score Gauge (0–100), Voice Synthesis (Hindi/English TTS), NDLM cattle profiles. |
| `/agent` | **Village Aggregator** | Sub-15s rapid keyboard intake, Live capacity breach warning banner, IndexedDB (`idb`) offline queue with auto-sync, Batch Manifest dispatch. |
| `/factory` | **Chilling Center QC** | Incoming tanker manifest selector, Side-by-side mass-balance audit, Automated Digital Quarantine lock on $>1\%$ variance or CLR density drop. |
| `/auditor` | **Auditor Command** | Real-time Socket.io incident feed, Interactive GIS District Threat Map with pulsing crimson nodes, Biological capacity vs. intake charts, SHA-256 seal verifier. |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Run full-stack dev servers (Backend on :5000, Vite Client on :5173)
npm run dev
```

Open `http://localhost:5173/` in your browser. Click **"Judge Demo Guide"** in the top navigation bar to execute or walk through the 4-step live demonstration script with one-click triggers!

---

## 🧮 Mathematical Formulas Implemented

1. **Dynamic Yield Limit**:
   $$\text{Capacity}_{\text{max}} = \left( \sum_{i=1}^{N} \text{BaseYield}(\text{Breed}_i) \times \text{LactationStatus}_i \right) \times S_{\text{multiplier}}$$
2. **Quality-Composition Payout**:
   $$\text{Payout (₹)} = \text{Volume (L)} \times \text{BaseRate (₹40)} \times \left( \frac{\text{FAT \%}}{4.0} \right) \times \left( \frac{\text{SNF \%}}{8.5} \right) + (\text{Bonus})$$
3. **Farm Purity Score (0–100)**:
   $$\text{Purity Score} = 0.30(S_{\text{volume}}) + 0.35(S_{\text{quality}}) + 0.20(S_{\text{anomaly}}) + 0.15(S_{\text{compliance}})$$
4. **Transit Mass-Balance Variance**:
   $$\Delta V = \left( \frac{V_{\text{factory}} - V_{\text{manifest}}}{V_{\text{manifest}}} \right) \times 100$$
