const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const INVALID_CREDENTIALS_MESSAGE = 'E-Mail oder Passwort ungültig.';
const EMAIL_TAKEN_MESSAGE = 'E-Mail ist bereits vergeben.';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  return process.env.JWT_SECRET;
}

function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
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

function isEmailAlreadyTaken(error) {
  return error.code === 'P2002' && error.meta?.target?.includes('email');
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.trim() === '' ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: 'E-Mail und Passwort sind erforderlich. Das Passwort muss mindestens 8 Zeichen lang sein.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: EMAIL_TAKEN_MESSAGE });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
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

    return res.status(201).json({ user });
  } catch (error) {
    if (isEmailAlreadyTaken(error)) {
      return res.status(409).json({ error: EMAIL_TAKEN_MESSAGE });
    }

    console.error('[Auth] register failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return res.status(500).json({ error: 'Registrierung fehlgeschlagen.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      getJwtSecret(),
      { expiresIn: '24h' },
    );

    setAuthCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[Auth] login failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return res.status(500).json({ error: 'Login fehlgeschlagen.' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('authToken', getAuthCookieOptions());
  return res.json({ success: true });
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
