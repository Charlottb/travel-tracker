const express = require('express');
const rateLimit = require('express-rate-limit');
const placesService = require('./places.service');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();
const createPlaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.userId),
  message: { error: 'Zu viele neue Orte. Bitte versuche es spaeter erneut.' },
});
const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es spaeter erneut.' },
});

router.get('/public-shares/:token', publicShareLimiter, async (req, res) => {
  try {
    const place = await placesService.getPublicSharedPlace(req.params.token);

    if (!place) {
      return res.status(404).json({ error: 'Geteilter Ort nicht gefunden' });
    }

    return res.json(place);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Geteilter Ort konnte nicht geladen werden' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const places = await placesService.getPlacesForUser(req.user.userId);
    return res.json(places);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load places' });
  }
});

router.post('/', authenticate, createPlaceLimiter, async (req, res) => {
  try {
    const newPlace = await placesService.createPlace(req.body, req.user.userId);
    return res.status(201).json(newPlace);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to save place' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const updatedPlace = await placesService.updatePlace(id, req.body, req.user.userId);

    if (!updatedPlace) {
      return res.status(404).json({ error: 'Ort nicht gefunden' });
    }

    return res.json(updatedPlace);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const deletedCount = await placesService.deletePlace(id, req.user.userId);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Ort nicht gefunden' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Loeschen fehlgeschlagen' });
  }
});

router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const sharedPlace = await placesService.sharePlace(id, req.user.userId, req.body?.email);

    if (!sharedPlace) {
      return res.status(404).json({ error: 'Ort nicht gefunden' });
    }

    return res.json(sharedPlace);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Teilen fehlgeschlagen' });
  }
});

router.post('/:id/public-share', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const place = await placesService.createPublicShareLink(id, req.user.userId);

    if (!place) {
      return res.status(404).json({ error: 'Ort nicht gefunden' });
    }

    return res.status(201).json(place);
  } catch (error) {
    return res.status(500).json({ error: 'Share-Link konnte nicht erstellt werden' });
  }
});

router.delete('/:id/public-share', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const place = await placesService.disablePublicShareLink(id, req.user.userId);

    if (!place) {
      return res.status(404).json({ error: 'Share-Link nicht gefunden' });
    }

    return res.json(place);
  } catch (error) {
    return res.status(500).json({ error: 'Share-Link konnte nicht deaktiviert werden' });
  }
});

router.delete('/:id/share/:shareId', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const shareId = Number(req.params.shareId);
    if (Number.isNaN(id) || Number.isNaN(shareId)) {
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    const sharedPlace = await placesService.unsharePlace(id, req.user.userId, shareId);

    if (!sharedPlace) {
      return res.status(404).json({ error: 'Freigabe nicht gefunden' });
    }

    return res.json(sharedPlace);
  } catch (error) {
    return res.status(500).json({ error: 'Freigabe entfernen fehlgeschlagen' });
  }
});

module.exports = router;
