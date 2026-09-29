const { z } = require('zod');

const registerToolSchema = z.object({
  toolId: z.string().min(2).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(2),
  category: z.enum(['READ', 'WRITE', 'DELETE', 'EXECUTE', 'EXPORT', 'COMMUNICATION']),
  description: z.string().optional(),
  sensitivity: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  schema: z.record(z.any()).default({}),
  destinations: z.array(z.string()).default([]),
  isSensitive: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

module.exports = {
  registerToolSchema,
};
