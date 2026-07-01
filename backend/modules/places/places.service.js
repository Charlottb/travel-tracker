const prisma = require('../../lib/prisma');
const authService = require('../auth/auth.service');
const { broadcastPlaceCreated } = require('../../lib/sse');
const { enqueuePlaceCreatedEmail } = require('../../lib/emailQueue');

function validatePlaceData({ lat, lng, title }) {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    typeof title !== 'string' ||
    title.trim() === ''
  ) {
    const error = new Error('Invalid data: lat and lng must be numbers, title must be a non-empty string');
    error.name = 'ValidationError';
    throw error;
  }
}

function buildPlacePayload({ title, description, category, lat, lng, userId }) {
  const trimmedDescription = typeof description === 'string' ? description.trim() : '';

  return {
    title: title.trim(),
    description: trimmedDescription || null,
    category: typeof category === 'string' ? category : null,
    lat,
    lng,
    userId,
  };
}

async function getPlacesForUser(userId) {
  const places = await prisma.place.findMany({
    where: {
      OR: [
        { userId },
        {
          shares: {
            some: {
              recipientId: userId,
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      shares: {
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  return places.map((place) => decoratePlaceForUser(place, userId));
}

function decoratePlaceForUser(place, userId) {
  const owner = place.user;
  const ownShares = Array.isArray(place.shares)
    ? place.shares.map((share) => ({
        id: share.id,
        createdAt: share.createdAt,
        recipient: share.recipient,
        sharedBy: share.sharedBy,
      }))
    : [];
  const shareForCurrentUser = ownShares.find((share) => share.recipient?.id === userId);

  return {
    id: place.id,
    title: place.title,
    description: place.description,
    category: place.category,
    lat: place.lat,
    lng: place.lng,
    userId: place.userId,
    owner,
    shares: place.userId === userId ? ownShares : [],
    sharedWithMe: place.userId !== userId,
    sharedBy: place.userId !== userId ? shareForCurrentUser?.sharedBy || owner : null,
    canEdit: place.userId === userId,
  };
}

async function createPlace(placeData, userId) {
  validatePlaceData(placeData);

  const newPlace = await prisma.place.create({
    data: buildPlacePayload({ ...placeData, userId }),
  });

  const recipient = await authService.getUserNotificationRecipient(userId);

  broadcastPlaceCreated(newPlace);

  if (recipient) {
    enqueuePlaceCreatedEmail({
      recipientEmail: recipient.email,
      userName: recipient.name,
      place: newPlace,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });
  }

  return getPlaceForOwner(newPlace.id, userId);
}

async function updatePlace(id, placeData, userId) {
  validatePlaceData(placeData);

  const existingPlace = await prisma.place.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingPlace) {
    return null;
  }

  const updatedPlace = await prisma.place.update({
    where: { id },
    data: buildPlacePayload({ ...placeData, userId }),
  });

  return getPlaceForOwner(updatedPlace.id, userId);
}

async function deletePlace(id, userId) {
  const result = await prisma.place.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return result.count;
}

async function sharePlace(id, ownerId, recipientEmail) {
  const existingPlace = await prisma.place.findFirst({
    where: {
      id,
      userId: ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!existingPlace) {
    return null;
  }

  const recipient = await authService.findUserByEmail(recipientEmail);

  if (!recipient) {
    const error = new Error('Kein registrierter Nutzer mit dieser E-Mail gefunden.');
    error.name = 'ValidationError';
    throw error;
  }

  if (recipient.id === ownerId) {
    const error = new Error('Du kannst einen Ort nicht mit dir selbst teilen.');
    error.name = 'ValidationError';
    throw error;
  }

  await prisma.sharedPlace.upsert({
    where: {
      placeId_recipientId: {
        placeId: id,
        recipientId: recipient.id,
      },
    },
    update: {
      sharedById: ownerId,
    },
    create: {
      placeId: id,
      recipientId: recipient.id,
      sharedById: ownerId,
    },
  });

  return getPlaceForOwner(id, ownerId);
}

async function unsharePlace(id, ownerId, shareId) {
  const result = await prisma.sharedPlace.deleteMany({
    where: {
      id: shareId,
      place: {
        id,
        userId: ownerId,
      },
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getPlaceForOwner(id, ownerId);
}

async function getPlaceForOwner(id, ownerId) {
  const place = await prisma.place.findFirst({
    where: {
      id,
      userId: ownerId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      shares: {
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return place ? decoratePlaceForUser(place, ownerId) : null;
}

module.exports = {
  getPlacesForUser,
  createPlace,
  updatePlace,
  deletePlace,
  sharePlace,
  unsharePlace,
};
