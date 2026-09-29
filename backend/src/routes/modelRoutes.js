const express = require('express');
const router = express.Router();
const { listModels, registerModel, activateModel } = require('../controllers/modelController');
const { authenticateUser, requireRoles } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', listModels);
router.post('/', requireRoles('Admin', 'Developer'), registerModel);
router.post('/:version/activate', requireRoles('Admin'), activateModel);

module.exports = router;
