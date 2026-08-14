import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'greenzet_super_secret_jwt_key_2026_safe_and_secure';

/**
 * Authentication Middleware: Verifies the JWT token from the Authorization header.
 * (Equivalent to Spring Security's JwtAuthenticationFilter or FastAPI's Depends(get_current_user))
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
    }

    // Fetch live user from database
    const user = db.prepare('SELECT id, name, email, phone, role, wallet_balance, avatar FROM users WHERE id = ?').get(userPayload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  });
}

/**
 * Role-Based Access Control (RBAC) Middleware: Restricts access to specific roles.
 * (Equivalent to Spring's @PreAuthorize("hasRole('ADMIN')") or Python decorators @require_role('seller'))
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
