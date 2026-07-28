const prisma = require('./prisma');

const clients = new Set();

function registerClient(res, user) {
  clients.add({
    res,
    userId: user.userId,
  });
}

function removeClient(res) {
  for (const client of clients) {
    if (client.res === res) {
      clients.delete(client);
      return;
    }
  }
}

async function getAllowedUserIdsForPlace(place) {
  const allowedUserIds = new Set();

  if (typeof place?.userId === 'number') {
    allowedUserIds.add(place.userId);
  }

  if (Array.isArray(place?.shares)) {
    for (const share of place.shares) {
      if (typeof share.recipientId === 'number') {
        allowedUserIds.add(share.recipientId);
      }

      if (typeof share.recipient?.id === 'number') {
        allowedUserIds.add(share.recipient.id);
      }
    }
  }

  if (typeof place?.id === 'number') {
    const shares = await prisma.sharedPlace.findMany({
      where: { placeId: place.id },
      select: { recipientId: true },
    });

    for (const share of shares) {
      allowedUserIds.add(share.recipientId);
    }
  }

  return allowedUserIds;
}

async function broadcastPlaceCreated(place) {
  const allowedUserIds = await getAllowedUserIdsForPlace(place);
  const payload = JSON.stringify({ place });
  const event = `event: place-created\ndata: ${payload}\n\n`;

  for (const client of clients) {
    if (!allowedUserIds.has(client.userId)) {
      continue;
    }

    try {
      client.res.write(event);
    } catch (error) {
      console.error('[SSE] Failed to write event to client:', error);
      removeClient(client.res);
    }
  }
}

module.exports = {
  registerClient,
  removeClient,
  broadcastPlaceCreated,
};
