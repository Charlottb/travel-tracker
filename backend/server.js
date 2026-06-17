const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const authRouter = require('./modules/auth/auth.routes');
const placesRouter = require('./modules/places/places.routes');
const { registerClient, removeClient } = require('./lib/sse');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.flushHeaders?.();
  res.write('retry: 10000\n\n');

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  registerClient(res);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(res);
  });
});

app.use('/api/auth', authRouter);
app.use('/places', placesRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('[socket.io] Client connected:', socket.id);

  socket.on('new-place', (placeData) => {
    console.log('[socket.io] Received new-place from client', socket.id, placeData?.id || 'unknown');
    socket.broadcast.emit('place-created', placeData);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket.io] Client disconnected:', socket.id, reason);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  console.log('   GET  /places');
  console.log('   POST /places');
  console.log('   DELETE /places/:id');
  console.log('   GET  /api/events');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/logout');
  console.log('   CORS: Enabled');
  console.log('   socket.io: Enabled');
  console.log('   Database: SQLite via Prisma');
});
