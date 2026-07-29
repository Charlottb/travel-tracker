const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const AUTH_COOKIE_NAME = 'authToken';
const UNAUTHORIZED_MESSAGE = 'Nicht authentifiziert.';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  if (process.env.NODE_ENV === 'production') {
    if (secret === 'dev-secret-change-me' || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('JWT_SECRET is insecure for production.');
    }
  }

  return secret;
}

async function getAuthenticatedUserFromToken(token) {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.userId !== 'number' ||
    typeof payload.email !== 'string' ||
    typeof payload.tokenVersion !== 'number'
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      tokenVersion: true,
    },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion,
  };
}

async function authenticate(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
  }

  try {
    const user = await getAuthenticatedUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
    }

    req.user = user;

    return next();
  } catch (_error) {
    return res.status(401).json({ error: UNAUTHORIZED_MESSAGE });
  }
}

module.exports = authenticate;
module.exports.AUTH_COOKIE_NAME = AUTH_COOKIE_NAME;
module.exports.getAuthenticatedUserFromToken = getAuthenticatedUserFromToken;
