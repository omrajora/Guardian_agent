/**
 * Contextual LLM Security Analysis Service (Phase 15)
 * Analyzes intent, detects prompt-injection attempts, and provides human-readable explanations.
 * LLM output is strictly non-authoritative (cannot override deterministic security policies).
 */

const INJECTION_INDICATORS = [
  /ignore (?:all )?(?:previous|above|prior) (?:instructions|rules|prompts)/i,
  /system override/i,
  /act as an unrestricted/i,
  /developer mode/i,
  /disregard security guidelines/i,
  /dump (?:all )?(?:records|database|users|passwords)/i,
  /drop table/i,
];

class LLMSecurityService {
  async analyzeContext({ toolId, action, parameters = {}, context = {} }) {
    const rawText = JSON.stringify({ parameters, context });
    let injectionSuspicion = 'NONE';
    let suspicionCount = 0;

    for (const pattern of INJECTION_INDICATORS) {
      if (pattern.test(rawText)) {
        suspicionCount++;
      }
    }

    if (suspicionCount >= 2) {
      injectionSuspicion = 'HIGH';
    } else if (suspicionCount === 1) {
      injectionSuspicion = 'MEDIUM';
    }

    // Determine semantic intent
    let intent = 'Routine task execution';
    if (action === 'delete') intent = 'Database record modification / deletion';
    else if (action === 'export') intent = 'Bulk data retrieval / export';
    else if (action === 'send') intent = 'Outbound communication dispatch';

    let explanation = `Action '${action}' on tool '${toolId}' requested with ${
      parameters.limit ? parameters.limit + ' items' : 'default volume'
    }.`;
    if (injectionSuspicion !== 'NONE') {
      explanation += ` Alert: Potential prompt-injection phrase matched in request payload.`;
    }

    let rationale = 'Evaluated under standard agent operational boundary';
    if (injectionSuspicion === 'HIGH') {
      rationale = 'Suspicious override patterns detected in parameters or context intent.';
    }

    return {
      intent,
      injectionSuspicion,
      contextExplanation: explanation,
      riskRationale: rationale,
    };
  }
}

module.exports = new LLMSecurityService();
