const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/analyticsController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/overview', getOverview);

module.exports = router;
