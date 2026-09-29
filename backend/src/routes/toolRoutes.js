const express = require('express');
const router = express.Router();
const { listTools, registerTool, seedDefaultTools } = require('../controllers/toolController');
const { authenticateUser, requireRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerToolSchema } = require('../validators/toolValidators');

router.use(authenticateUser);

router.get('/', listTools);
router.post('/', requireRoles('Admin', 'Developer'), validate(registerToolSchema), registerTool);
router.post('/seed', requireRoles('Admin'), seedDefaultTools);

module.exports = router;
