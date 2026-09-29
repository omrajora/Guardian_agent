const express = require('express');
const router = express.Router();
const { evaluateAction, executeAction } = require('../controllers/guardianController');
const { authenticateAgent } = require('../middleware/agentAuth');

// All Guardian gateway calls require Agent authentication via headers
router.use(authenticateAgent);

router.post('/evaluate', evaluateAction);
router.post('/execute', executeAction);

module.exports = router;
