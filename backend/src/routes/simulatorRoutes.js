const express = require('express');
const router = express.Router();
const { getScenarios, executeScenario } = require('../controllers/simulatorController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', getScenarios);
router.post('/run', executeScenario);

module.exports = router;
