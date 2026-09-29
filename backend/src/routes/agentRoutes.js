const express = require('express');
const router = express.Router();
const { createAgent, listAgents, rotateApiKey, getAgent } = require('../controllers/agentController');
const { authenticateUser, requireRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAgentSchema } = require('../validators/agentValidators');

router.use(authenticateUser);

router.get('/', listAgents);
router.post('/', requireRoles('Admin', 'Developer'), validate(createAgentSchema), createAgent);
router.get('/:agentId', getAgent);
router.post('/:agentId/rotate-key', requireRoles('Admin', 'Developer'), rotateApiKey);

module.exports = router;
