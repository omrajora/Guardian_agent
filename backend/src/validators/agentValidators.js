const { z } = require('zod');

const createAgentSchema = z.object({
  agentId: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, 'agentId can only contain letters, numbers, hyphens and underscores'),
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default(['weather_api']),
  baseline: z
    .object({
      normalCallsPerHour: z.number().default(100),
      normalRecordsPerRequest: z.number().default(50),
      typicalDestinations: z.array(z.string()).default([]),
      typicalActions: z.array(z.string()).default([]),
    })
    .optional(),
});

module.exports = {
  createAgentSchema,
};
