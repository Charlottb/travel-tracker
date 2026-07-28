const express = require('express');
const placesService = require('./places.service');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

router.get('/public-shares/:token', async (req, res) => {
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

    console.error('[Places] GET /places/public-shares/:token Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Geteilter Ort konnte nicht geladen werden', details: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const places = await placesService.getPlacesForUser(req.user.userId);
    return res.json(places);
  } catch (error) {
    console.error('[Places] GET /places Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to load places', details: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const newPlace = await placesService.createPlace(req.body, req.user.userId);
    return res.status(201).json(newPlace);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    console.error('[Places] POST /places Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to save place', details: error.message });
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

    console.error('[Places] PUT /places/:id Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Speichern fehlgeschlagen', details: error.message });
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
    console.error('[Places] DELETE /places/:id Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Loeschen fehlgeschlagen', details: error.message });
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

    console.error('[Places] POST /places/:id/share Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Teilen fehlgeschlagen', details: error.message });
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
    console.error('[Places] POST /places/:id/public-share Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Share-Link konnte nicht erstellt werden', details: error.message });
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
    console.error('[Places] DELETE /places/:id/public-share Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Share-Link konnte nicht deaktiviert werden', details: error.message });
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
    console.error('[Places] DELETE /places/:id/share/:shareId Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Freigabe entfernen fehlgeschlagen', details: error.message });
  }
});

module.exports = router;
