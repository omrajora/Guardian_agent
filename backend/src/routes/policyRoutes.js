const express = require('express');
const router = express.Router();
const {
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  seedDefaultPolicies,
} = require('../controllers/policyController');
const { authenticateUser, requireRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createPolicySchema } = require('../validators/policyValidators');

router.use(authenticateUser);

router.get('/', listPolicies);
router.post('/', requireRoles('Admin'), validate(createPolicySchema), createPolicy);
router.put('/:policyId', requireRoles('Admin'), updatePolicy);
router.delete('/:policyId', requireRoles('Admin'), deletePolicy);
router.post('/seed', requireRoles('Admin'), seedDefaultPolicies);

module.exports = router;
