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
  return {
    title: title.trim(),
    description: typeof description === 'string' ? description : null,
    category: typeof category === 'string' ? category : null,
    lat,
    lng,
    userId,
  };
}

async function getPlacesForUser(userId) {
  return prisma.place.findMany({
    where: { userId },
    orderBy: { id: 'asc' },
  });
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

  return newPlace;
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

  return prisma.place.update({
    where: { id },
    data: buildPlacePayload({ ...placeData, userId }),
  });
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

module.exports = {
  getPlacesForUser,
  createPlace,
  updatePlace,
  deletePlace,
};
