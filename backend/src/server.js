require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

// Warn about JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using default dev key.');
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
try {
  initDatabase();
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Mount routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

// Only listen when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
