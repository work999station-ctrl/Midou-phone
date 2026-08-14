const Admin = require('../../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const admin = await Admin.findOne({ username: username.trim() });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'hanout_kinetic_cybernetic_secret_2026',
      { expiresIn: '7d' } // Token is valid for 7 days
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      username: admin.username
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};
