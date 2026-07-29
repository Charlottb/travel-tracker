const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { normalizeEmail, isValidEmail, isValidPassword } = require('../../lib/validation');

const INVALID_CREDENTIALS_MESSAGE = 'E-Mail oder Passwort ungültig.';
const EMAIL_TAKEN_MESSAGE = 'E-Mail ist bereits vergeben.';
const dummyPasswordHashPromise = process.env.DUMMY_PASSWORD_HASH
  ? Promise.resolve(process.env.DUMMY_PASSWORD_HASH)
  : bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

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

function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie('authToken', token, {
    ...getAuthCookieOptions(),
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function createAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '24h' },
  );
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}

function validateRegisterData({ email, password }) {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    const error = new Error('E-Mail und Passwort sind erforderlich. Das Passwort muss mindestens 8 Zeichen lang sein.');
    error.name = 'ValidationError';
    throw error;
  }
}

function createConflictError(message) {
  const error = new Error(message);
  error.name = 'ConflictError';
  return error;
}

async function getDummyPasswordHash() {
  return dummyPasswordHashPromise;
}

async function registerUser({ email, password, name }) {
  validateRegisterData({ email, password });

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw createConflictError(EMAIL_TAKEN_MESSAGE);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: typeof name === 'string' && name.trim() ? name.trim() : normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

async function loginUser({ email, password }) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    const error = new Error(INVALID_CREDENTIALS_MESSAGE);
    error.name = 'ValidationError';
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const passwordHash = user?.passwordHash || await getDummyPasswordHash();
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!user || !user.passwordHash || !passwordMatches) {
    const error = new Error(INVALID_CREDENTIALS_MESSAGE);
    error.name = 'ValidationError';
    throw error;
  }

  const token = createAuthToken(user);

  return {
    token,
    user: serializeUser(user),
  };
}

async function getUserNotificationRecipient(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
    },
  });
}

async function getUserProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
}

async function updateUserProfile(userId, { email, name, currentPassword, newPassword }) {
  const updates = {};
  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
  const trimmedName = typeof name === 'string' ? name.trim() : null;
  const isPasswordChanging = typeof newPassword === 'string' && newPassword.length > 0;
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      tokenVersion: true,
    },
  });

  if (!currentUser) {
    const error = new Error('Profil konnte nicht geladen werden.');
    error.name = 'ValidationError';
    throw error;
  }

  const isEmailChanging = Boolean(normalizedEmail && normalizedEmail !== currentUser.email);
  const requiresCurrentPassword = isEmailChanging || isPasswordChanging;

  if (typeof name === 'string') {
    if (!trimmedName) {
      const error = new Error('Der Name darf nicht leer sein.');
      error.name = 'ValidationError';
      throw error;
    }

    if (trimmedName !== currentUser.name) {
      updates.name = trimmedName;
    }
  }

  if (requiresCurrentPassword) {
    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      const error = new Error('Bitte gib dein aktuelles Passwort ein.');
      error.name = 'ValidationError';
      throw error;
    }

    const passwordMatches = currentUser.passwordHash
      ? await bcrypt.compare(currentPassword, currentUser.passwordHash)
      : false;

    if (!passwordMatches) {
      const error = new Error('Das aktuelle Passwort ist falsch.');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (normalizedEmail) {
    if (!isValidEmail(normalizedEmail)) {
      const error = new Error('Bitte gib eine gültige E-Mail-Adresse ein.');
      error.name = 'ValidationError';
      throw error;
    }

    if (isEmailChanging) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw createConflictError(EMAIL_TAKEN_MESSAGE);
      }

      updates.email = normalizedEmail;
    }
  }

  if (isPasswordChanging) {
    if (!isValidPassword(newPassword)) {
      const error = new Error('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      error.name = 'ValidationError';
      throw error;
    }

    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (requiresCurrentPassword) {
    updates.tokenVersion = { increment: 1 };
  }

  if (Object.keys(updates).length === 0) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        tokenVersion: true,
      },
    });
  }

  return prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      tokenVersion: true,
    },
  });
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

module.exports = {
  registerUser,
  loginUser,
  createAuthToken,
  getUserProfile,
  updateUserProfile,
  getUserNotificationRecipient,
  findUserByEmail,
  setAuthCookie,
  getAuthCookieOptions,
  serializeUser,
};
