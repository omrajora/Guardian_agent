const { z } = require('zod');

const createPolicySchema = z.object({
  policyId: z.string().min(2).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(3),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(1000).default(50),
  conditions: z.object({
    actionTypes: z.array(z.string()).optional(),
    toolIds: z.array(z.string()).optional(),
    destinations: z.array(z.string()).optional(),
    sensitivityLevels: z.array(z.string()).optional(),
    containsPii: z.boolean().optional(),
    containsSecrets: z.boolean().optional(),
    volumeThreshold: z.number().optional(),
  }),
  decision: z.enum(['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  isHardDeny: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

module.exports = {
  createPolicySchema,
};
