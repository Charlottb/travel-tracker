const clients = new Set();

function registerClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcastPlaceCreated(place) {
  const payload = JSON.stringify({ place });
  const event = `event: place-created\ndata: ${payload}\n\n`;

  for (const client of clients) {
    try {
      client.write(event);
    } catch (error) {
      console.error('[SSE] Failed to write event to client:', error);
      removeClient(client);
    }
  }
}

module.exports = {
  registerClient,
  removeClient,
  broadcastPlaceCreated,
};
