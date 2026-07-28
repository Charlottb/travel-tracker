const express = require('express');
const authService = require('./auth.service');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.registerUser({ email, password, name });
    return res.status(201).json({ user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'ConflictError') {
      return res.status(409).json({ error: error.message });
    }

    console.error('[Auth] register failed.');

    return res.status(500).json({ error: 'Registrierung fehlgeschlagen.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser({ email, password });
    authService.setAuthCookie(res, token);
    return res.json({ token, user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(401).json({ error: error.message });
    }

    console.error('[Auth] login failed.');

    return res.status(500).json({ error: 'Login fehlgeschlagen.' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('authToken', authService.getAuthCookieOptions());
  return res.json({ success: true });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('[Auth] me failed.');

    return res.status(500).json({ error: 'Profil konnte nicht geladen werden.' });
  }
});

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user.userId, req.body || {});
    const token = authService.createAuthToken(user);
    authService.setAuthCookie(res, token);
    return res.json({ user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'ConflictError') {
      return res.status(409).json({ error: error.message });
    }

    console.error('[Auth] profile update failed.');

    return res.status(500).json({ error: 'Profil konnte nicht gespeichert werden.' });
  }
});

module.exports = router;
