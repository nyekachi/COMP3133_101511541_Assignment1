import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async ({ req }) => {
  let user = null;

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id).select('-password');
    } catch {
      // Invalid/expired token — treat as unauthenticated
    }
  }

  return { user };
};

export default authMiddleware;