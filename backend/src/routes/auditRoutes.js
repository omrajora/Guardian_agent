const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticateUser, requireRoles } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', requireRoles('Security Reviewer', 'Admin', 'Developer'), getAuditLogs);

module.exports = router;
