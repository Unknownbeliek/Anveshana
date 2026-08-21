const BASE_URL = '/api';

async function fetchJSON(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Farmer endpoints
  getFarmers: () => fetchJSON('/farmers'),
  getFarmerById: (id) => fetchJSON(`/farmers/${id}`),
  createFarmer: (payload) => fetchJSON('/farmers', { method: 'POST', body: JSON.stringify(payload) }),

  // Milk deposit endpoints
  recordDeposit: (payload) => fetchJSON('/milk/deposit', { method: 'POST', body: JSON.stringify(payload) }),
  syncBatch: (payload) => fetchJSON('/milk/sync-batch', { method: 'POST', body: JSON.stringify(payload) }),
  getFarmerDeposits: (farmerId) => fetchJSON(`/milk/farmer/${farmerId}`),
  getRecentDeposits: () => fetchJSON('/milk/recent'),

  // Batch manifest endpoints
  getBatches: () => fetchJSON('/batch'),
  getBatchById: (batchId) => fetchJSON(`/batch/${batchId}`),
  createBatch: (payload) => fetchJSON('/batch/create', { method: 'POST', body: JSON.stringify(payload) }),
  reconcileBatch: (payload) => fetchJSON('/batch/reconcile', { method: 'POST', body: JSON.stringify(payload) }),

  // Analytics & Verification endpoints
  getDistrictAnalytics: () => fetchJSON('/analytics/district'),
  getAlerts: () => fetchJSON('/analytics/alerts'),
  verifyReceipt: (payload) => fetchJSON('/analytics/verify-receipt', { method: 'POST', body: JSON.stringify(payload) })
};
