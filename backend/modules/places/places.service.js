const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const authService = require('../auth/auth.service');
const { broadcastPlaceCreated } = require('../../lib/sse');
const { enqueuePlaceCreatedEmail } = require('../../lib/emailQueue');

const PUBLIC_SHARE_TOKEN_BYTES = 32;
const PUBLIC_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const PLACE_CATEGORY_VALUES = new Set([
  'Restaurant',
  'Hotel',
  'Sehensw\u00fcrdigkeit',
  'Natur',
  'Shopping',
  'Sonstiges',
]);
const PLACE_STATUS_VALUES = new Set(['want_to_visit', 'planned', 'visited', 'favorite']);
const PLACE_MOOD_TAG_VALUES = new Set([
  'ruhig',
  'aussicht',
  'guenstig',
  'romantisch',
  'kultur',
  'essen',
  'geheimtipp',
  'regenwetter',
  'sonnenuntergang',
]);
const MAX_TRIP_NAME_LENGTH = 80;
const SHARE_REQUEST_PROCESSED_RESPONSE = {
  success: true,
  message: 'Teilanfrage verarbeitet.',
};

function createValidationError(message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  return error;
}

function createPublicShareToken() {
  return crypto.randomBytes(PUBLIC_SHARE_TOKEN_BYTES).toString('base64url');
}

function hashPublicShareToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function validatePublicShareToken(token) {
  if (typeof token !== 'string' || !PUBLIC_SHARE_TOKEN_PATTERN.test(token)) {
    throw createValidationError('Ungueltiger Share-Link.');
  }
}

function buildPublicShareUrl(token) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${frontendUrl}/share/${token}`;
}

function serializePublicShare(publicShare, token = null) {
  if (!publicShare || publicShare.disabledAt) {
    return null;
  }

  return {
    enabled: true,
    createdAt: publicShare.createdAt,
    ...(token ? { url: buildPublicShareUrl(token), token } : {}),
  };
}

function normalizeRequiredText(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw createValidationError(`Invalid data: ${fieldName} must be a string`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw createValidationError(`Invalid data: ${fieldName} is required`);
  }

  if (trimmedValue.length > maxLength) {
    throw createValidationError(`Invalid data: ${fieldName} must be at most ${maxLength} characters`);
  }

  return trimmedValue;
}

function normalizeOptionalText(value, fieldName, maxLength) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw createValidationError(`Invalid data: ${fieldName} must be a string`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > maxLength) {
    throw createValidationError(`Invalid data: ${fieldName} must be at most ${maxLength} characters`);
  }

  return trimmedValue;
}

function normalizeCategory(category) {
  if (category == null || category === '') {
    return null;
  }

  if (typeof category !== 'string') {
    throw createValidationError('Invalid data: category must be a string');
  }

  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    return null;
  }

  if (!PLACE_CATEGORY_VALUES.has(trimmedCategory)) {
    throw createValidationError('Invalid data: category is not allowed');
  }

  return trimmedCategory;
}

function normalizeCoordinate(value, fieldName, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw createValidationError(`Invalid data: ${fieldName} must be a finite number`);
  }

  if (value < min || value > max) {
    throw createValidationError(`Invalid data: ${fieldName} is out of range`);
  }

  return value;
}

function validatePlaceData(placeData) {
  return {
    ...placeData,
    title: normalizeRequiredText(placeData?.title, 'title', MAX_TITLE_LENGTH),
    description: normalizeOptionalText(placeData?.description, 'description', MAX_DESCRIPTION_LENGTH),
    category: normalizeCategory(placeData?.category),
    lat: normalizeCoordinate(placeData?.lat, 'lat', -90, 90),
    lng: normalizeCoordinate(placeData?.lng, 'lng', -180, 180),
  };
}

function normalizeTripName(tripName) {
  if (tripName == null || tripName === '') {
    return null;
  }

  if (typeof tripName !== 'string') {
    throw createValidationError('Invalid data: tripName must be a string');
  }

  const trimmedTripName = tripName.trim();

  if (!trimmedTripName) {
    return null;
  }

  if (trimmedTripName.length > MAX_TRIP_NAME_LENGTH) {
    throw createValidationError(`Invalid data: tripName must be at most ${MAX_TRIP_NAME_LENGTH} characters`);
  }

  return trimmedTripName;
}

function normalizeStatus(status) {
  if (status == null || status === '') {
    return null;
  }

  if (typeof status !== 'string' || !PLACE_STATUS_VALUES.has(status)) {
    throw createValidationError('Invalid data: status is not allowed');
  }

  return status;
}

function parseMoodTags(moodTags) {
  if (moodTags == null || moodTags === '') {
    return [];
  }

  if (Array.isArray(moodTags)) {
    return moodTags;
  }

  if (typeof moodTags !== 'string') {
    throw createValidationError('Invalid data: moodTags must be a JSON string');
  }

  try {
    const parsedMoodTags = JSON.parse(moodTags);
    return Array.isArray(parsedMoodTags) ? parsedMoodTags : null;
  } catch (_error) {
    return null;
  }
}

function normalizeMoodTags(moodTags) {
  const parsedMoodTags = parseMoodTags(moodTags);

  if (!Array.isArray(parsedMoodTags)) {
    throw createValidationError('Invalid data: moodTags must be a JSON array');
  }

  const normalizedMoodTags = [...new Set(parsedMoodTags)];

  if (normalizedMoodTags.length === 0) {
    return null;
  }

  const hasInvalidMoodTag = normalizedMoodTags.some(
    (tag) => typeof tag !== 'string' || !PLACE_MOOD_TAG_VALUES.has(tag),
  );

  if (hasInvalidMoodTag) {
    throw createValidationError('Invalid data: moodTags contains an unknown tag');
  }

  return JSON.stringify(normalizedMoodTags);
}

function buildPlacePayload({ title, description, category, tripName, status, moodTags, lat, lng, userId }) {
  return {
    title,
    description,
    category,
    tripName: normalizeTripName(tripName),
    status: normalizeStatus(status),
    moodTags: normalizeMoodTags(moodTags),
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
      publicShare: true,
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
    tripName: place.tripName,
    status: place.status,
    moodTags: place.moodTags,
    lat: place.lat,
    lng: place.lng,
    userId: place.userId,
    owner,
    shares: place.userId === userId ? ownShares : [],
    publicShare: place.userId === userId ? serializePublicShare(place.publicShare) : null,
    sharedWithMe: place.userId !== userId,
    sharedBy: place.userId !== userId ? shareForCurrentUser?.sharedBy || owner : null,
    canEdit: place.userId === userId,
  };
}

function decoratePublicPlace(place) {
  return {
    title: place.title,
    description: place.description,
    category: place.category,
    tripName: place.tripName,
    status: place.status,
    moodTags: place.moodTags,
    lat: place.lat,
    lng: place.lng,
    owner: place.user
      ? {
          name: place.user.name,
        }
      : null,
    canEdit: false,
  };
}

async function createPlace(placeData, userId) {
  const validatedPlaceData = validatePlaceData(placeData);

  const newPlace = await prisma.place.create({
    data: buildPlacePayload({ ...validatedPlaceData, userId }),
  });

  const recipient = await authService.getUserNotificationRecipient(userId);

  await broadcastPlaceCreated(newPlace).catch(() => {
    console.error('[Places] SSE place-created broadcast failed.');
  });

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
  const validatedPlaceData = validatePlaceData(placeData);

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
    data: buildPlacePayload({ ...validatedPlaceData, userId }),
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
    return SHARE_REQUEST_PROCESSED_RESPONSE;
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

  return SHARE_REQUEST_PROCESSED_RESPONSE;
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

async function createPublicShareLink(id, ownerId) {
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

  const token = createPublicShareToken();
  const tokenHash = hashPublicShareToken(token);

  const publicShare = await prisma.publicPlaceShare.upsert({
    where: {
      placeId: id,
    },
    update: {
      tokenHash,
      disabledAt: null,
      createdAt: new Date(),
    },
    create: {
      placeId: id,
      tokenHash,
    },
  });

  const place = await getPlaceForOwner(id, ownerId);

  return {
    ...place,
    publicShare: serializePublicShare(publicShare, token),
  };
}

async function disablePublicShareLink(id, ownerId) {
  const publicShare = await prisma.publicPlaceShare.findFirst({
    where: {
      placeId: id,
      place: {
        userId: ownerId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!publicShare) {
    return null;
  }

  await prisma.publicPlaceShare.update({
    where: {
      id: publicShare.id,
    },
    data: {
      disabledAt: new Date(),
    },
  });

  return getPlaceForOwner(id, ownerId);
}

async function getPublicSharedPlace(token) {
  validatePublicShareToken(token);

  const publicShare = await prisma.publicPlaceShare.findUnique({
    where: {
      tokenHash: hashPublicShareToken(token),
    },
    include: {
      place: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!publicShare || publicShare.disabledAt || !publicShare.place) {
    return null;
  }

  return decoratePublicPlace(publicShare.place);
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
      publicShare: true,
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
  createPublicShareLink,
  disablePublicShareLink,
  getPublicSharedPlace,
};
