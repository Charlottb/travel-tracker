const jwt = require('jsonwebtoken');

const AUTH_COOKIE_NAME = 'authToken';
const UNAUTHORIZED_MESSAGE = 'Nicht authentifiziert.';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  return process.env.JWT_SECRET;
}

function authenticate(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.userId !== 'number' ||
      typeof payload.email !== 'string'
    ) {
      return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    return next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.error('[Auth] token verification failed:', {
        message: error.message,
        name: error.name,
      });
    }

    return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
  }
}

module.exports = authenticate;
