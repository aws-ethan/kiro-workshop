const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { signToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/register
 * Registers a new user with bcrypt-hashed password.
 * Returns 201 with user info on success.
 */
router.post('/register', (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = getDb();

    // Check if username already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const userDisplayName = displayName || username;

    db.prepare(
      `INSERT INTO users (id, username, email, displayName, bio, avatarUrl, passwordHash, createdAt, updatedAt, followersCount, followingCount)
       VALUES (?, ?, ?, ?, '', '', ?, ?, ?, 0, 0)`
    ).run(id, username, email, userDisplayName, passwordHash, now, now);

    return res.status(201).json({
      user: { id, username, email, displayName: userDisplayName },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Authenticates a user and returns a JWT token + user info.
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, username: user.username });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
