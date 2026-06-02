const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const DEFAULT_USER = {
  email: 'demo@example.com',
  name: 'Demo User',
};

async function getDefaultUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    update: {},
    create: {
      ...DEFAULT_USER,
      passwordHash: '',
    },
  });
}

router.get('/', async (_req, res) => {
  try {
    console.log('[Backend] GET /places - Fetching from SQLite via Prisma...');

    const places = await prisma.place.findMany({
      orderBy: { id: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Backend] Found ${places.length} places`);
    res.json(places);
  } catch (error) {
    console.error('[Backend] GET /places Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to load places', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('[Backend] POST /places - Body:', req.body);

    const { lat, lng, title, description, category } = req.body;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      typeof title !== 'string' ||
      title.trim() === ''
    ) {
      console.error('[Backend] POST /places - Validation failed');
      return res.status(400).json({
        error: 'Invalid data: lat and lng must be numbers, title must be a non-empty string',
      });
    }

    const user = await getDefaultUser();
    const newPlace = await prisma.place.create({
      data: {
        lat,
        lng,
        title: title.trim(),
        description: typeof description === 'string' ? description : null,
        category: typeof category === 'string' ? category : null,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Backend] POST /places - Saved in SQLite: ${newPlace.id}`);
    res.status(201).json(newPlace);
  } catch (error) {
    console.error('[Backend] POST /places Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to save place', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log('[Backend] DELETE /places/:id -', id);

    if (Number.isNaN(id)) {
      console.error('[Backend] DELETE /places - Invalid ID:', req.params.id);
      return res.status(400).json({ error: 'Ungueltige ID' });
    }

    await prisma.place.delete({
      where: { id },
    });

    console.log(`[Backend] DELETE /places - Deleted from SQLite: ${id}`);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('[Backend] DELETE /places - Not found:', req.params.id);
      return res.status(404).json({ error: 'Ort nicht gefunden' });
    }

    console.error('[Backend] DELETE /places Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Loeschen fehlgeschlagen', details: error.message });
  }
});

module.exports = router;
