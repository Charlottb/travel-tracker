require('dotenv/config');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth');
const placesRouter = require('./routes/places');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

app.use('/api/auth', authRouter);
app.use('/places', placesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  console.log('   GET  /places');
  console.log('   POST /places');
  console.log('   DELETE /places/:id');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   CORS: Enabled');
  console.log('   Database: SQLite via Prisma');
});
