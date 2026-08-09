// server.js
// Entry point: loads environment variables, connects to MongoDB, and
// starts the HTTP server. Run with `npm start` or `npm run dev`.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // Fail loudly instead of leaving the process in a broken state.
  process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

start();
