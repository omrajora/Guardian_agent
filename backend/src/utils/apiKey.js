const crypto = require('crypto');

function generateApiKey() {
  const rawSecret = crypto.randomBytes(24).toString('hex');
  const apiKey = `ga_live_${rawSecret}`;
  const apiKeyPrefix = apiKey.substring(0, 12);
  const apiKeyHash = hashApiKey(apiKey);
  return { apiKey, apiKeyPrefix, apiKeyHash };
}

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

module.exports = {
  generateApiKey,
  hashApiKey,
};
