const crypto = require('crypto');

const SECRET_SALT = process.env.RECEIPT_SECRET || 'ANVESHANA_NDLM_CRYPTO_SEAL_2026';

/**
 * Generates cryptographic SHA-256 integrity seal for a milk deposit transaction
 * Formula: SHA256(farmerCustomId + volumeLiters + calculatedPayout + timestamp + secretKey)
 */
function generateReceiptHash({ farmerCustomId, volumeLiters, calculatedPayout, timestamp }) {
  const tsString = typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString();
  const rawString = `${farmerCustomId}|${Number(volumeLiters).toFixed(2)}|${Number(calculatedPayout).toFixed(2)}|${tsString}|${SECRET_SALT}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Verifies if a given receipt hash matches the transaction payload
 */
function verifyReceiptHash({ receiptHash, farmerCustomId, volumeLiters, calculatedPayout, timestamp }) {
  const expected = generateReceiptHash({ farmerCustomId, volumeLiters, calculatedPayout, timestamp });
  return expected === receiptHash;
}

/**
 * Generates cryptographic SHA-256 seal for transit batch manifests
 * Chains previous manifest or deposit hashes
 */
function generateManifestHash({ batchId, centerId, dispatchedVolume, depositIds, timestamp }) {
  const rawString = `${batchId}|${centerId}|${Number(dispatchedVolume).toFixed(2)}|${(depositIds || []).join(',')}|${timestamp}|${SECRET_SALT}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

module.exports = {
  generateReceiptHash,
  verifyReceiptHash,
  generateManifestHash
};
