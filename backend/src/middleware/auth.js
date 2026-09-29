const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or suspended' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = {
  authenticateUser,
  requireRoles,
};
