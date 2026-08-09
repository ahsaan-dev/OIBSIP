// app.js
// Configures the Express application: global middleware, routes, and
// error handling. Kept separate from server.js so the app can be
// imported directly in tests without starting a real HTTP listener.

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --- Security & parsing middleware -----------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5500',
    credentials: true // allows the refresh-token cookie to be sent
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- Health check -------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// --- Routes ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// --- Error handling (must be last) -----------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
