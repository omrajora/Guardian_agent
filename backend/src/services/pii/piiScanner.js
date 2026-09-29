/**
 * Deterministic PII and Secret Scanner & Payload Redactor
 */

const PII_PATTERNS = {
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
};

const SECRET_PATTERNS = {
  AWS_KEY: /\b(AKIA[0-9A-Z]{16})\b/g,
  GITHUB_PAT: /\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/g,
  JWT_TOKEN: /\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g,
  PRIVATE_KEY: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  GENERIC_SECRET: /\b(?:password|passwd|secret|api_key|token)\s*[:=]\s*["']?([A-Za-z0-9_\-!@#$%^&*]{8,})["']?/gi,
};

function scanString(text) {
  if (typeof text !== 'string') return { piiTypes: [], secretTypes: [] };

  const piiTypes = [];
  const secretTypes = [];

  for (const [key, regex] of Object.entries(PII_PATTERNS)) {
    regex.lastIndex = 0;
    if (regex.test(text)) {
      piiTypes.push(key);
    }
  }

  for (const [key, regex] of Object.entries(SECRET_PATTERNS)) {
    regex.lastIndex = 0;
    if (regex.test(text)) {
      secretTypes.push(key);
    }
  }

  return { piiTypes, secretTypes };
}

function scanObject(obj) {
  const piiSet = new Set();
  const secretSet = new Set();

  function walk(val) {
    if (val === null || val === undefined) return;
    if (typeof val === 'string') {
      const res = scanString(val);
      res.piiTypes.forEach((t) => piiSet.add(t));
      res.secretTypes.forEach((t) => secretSet.add(t));
    } else if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        // check key name for secrets
        if (/(password|secret|apikey|token|credential)/i.test(k)) {
          secretSet.add('SENSITIVE_KEY_NAME');
        }
        walk(v);
      }
    }
  }

  walk(obj);

  return {
    piiDetected: piiSet.size > 0,
    piiTypes: Array.from(piiSet),
    secretsDetected: secretSet.size > 0,
    secretTypes: Array.from(secretSet),
  };
}

function redactString(text) {
  if (typeof text !== 'string') return text;
  let redacted = text;

  for (const [key, regex] of Object.entries(PII_PATTERNS)) {
    regex.lastIndex = 0;
    redacted = redacted.replace(regex, `***REDACTED_${key}***`);
  }

  for (const [key, regex] of Object.entries(SECRET_PATTERNS)) {
    regex.lastIndex = 0;
    redacted = redacted.replace(regex, `***REDACTED_${key}***`);
  }

  return redacted;
}

function redactPayload(payload) {
  if (payload === null || payload === undefined) return payload;

  if (typeof payload === 'string') {
    return redactString(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map(redactPayload);
  }

  if (typeof payload === 'object') {
    const copy = {};
    for (const [k, v] of Object.entries(payload)) {
      if (/(password|secret|apikey|token|credential|private_key)/i.test(k)) {
        copy[k] = '***REDACTED_SECRET***';
      } else {
        copy[k] = redactPayload(v);
      }
    }
    return copy;
  }

  return payload;
}

module.exports = {
  scanObject,
  scanString,
  redactPayload,
  redactString,
};
