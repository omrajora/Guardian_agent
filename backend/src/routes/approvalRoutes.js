const express = require('express');
const router = express.Router();
const { getPendingApprovals, approve, reject } = require('../controllers/approvalController');
const { authenticateUser, requireRoles } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/pending', requireRoles('Approver', 'Admin', 'Security Reviewer'), getPendingApprovals);
router.post('/:id/approve', requireRoles('Approver', 'Admin'), approve);
router.post('/:id/reject', requireRoles('Approver', 'Admin'), reject);

module.exports = router;
