const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hanout_kinetic_cybernetic_secret_2026');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Access denied. Invalid or expired token.' });
  }
};
