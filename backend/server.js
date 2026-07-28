const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const authRouter = require('./modules/auth/auth.routes');
const placesRouter = require('./modules/places/places.routes');
const authenticate = require('./middleware/authenticate');
const { registerClient, removeClient } = require('./lib/sse');

const app = express();
const configuredFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = new Set([configuredFrontendUrl, 'http://localhost:3000', 'http://localhost:3002']);
const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin);
}

function parseCookieHeader(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
}

function rejectCrossSiteMutations(req, res, next) {
  if (!mutatingMethods.has(req.method)) {
    return next();
  }

  if (!req.path.startsWith('/api/') && !req.path.startsWith('/places')) {
    return next();
  }

  const origin = req.get('origin');
  if (!origin && process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (origin && allowedOrigins.has(origin)) {
    return next();
  }

  return res.status(403).json({ error: 'Ungueltige Anfrage.' });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es spaeter erneut.' },
});

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es spaeter erneut.' },
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(rejectCrossSiteMutations);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/profile', profileLimiter);

app.get('/api/events', authenticate, (req, res) => {
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

  registerClient(res, req.user);

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
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const cookies = parseCookieHeader(socket.handshake.headers.cookie);
    const token = cookies[authenticate.AUTH_COOKIE_NAME];
    const user = token ? authenticate.getAuthenticatedUserFromToken(token) : null;

    if (!user) {
      return next(new Error('Unauthorized'));
    }

    socket.data.user = user;
    socket.join(`user:${user.userId}`);
    return next();
  } catch (_error) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('new-place', (placeData) => {
    const userId = socket.data.user?.userId;

    if (typeof placeData?.userId !== 'number' || placeData.userId !== userId) {
      return;
    }

    socket.to(`user:${userId}`).emit('place-created', placeData);
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
