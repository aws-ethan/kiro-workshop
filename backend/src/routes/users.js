const express = require('express');
const { getDb } = require('../database');
const { withAuth } = require('../middleware/auth');
const { getUserPosts } = require('./posts');

const router = express.Router();

/**
 * GET /users/:userId
 * Return user info (excluding passwordHash). 404 if not found.
 */
router.get('/:userId', withAuth, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /users/:userId
 * Update own profile only (displayName, bio, avatarUrl). 403 for others.
 */
router.put('/:userId', withAuth, (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const db = getDb();
    const { displayName, bio, avatarUrl } = req.body;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE users SET displayName = COALESCE(?, displayName), bio = COALESCE(?, bio), avatarUrl = COALESCE(?, avatarUrl), updatedAt = ? WHERE id = ?`
    ).run(displayName, bio, avatarUrl, now, req.params.userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /users/:userId/follow
 * Follow a user. Prevents self-follow and duplicate follows.
 * Uses a transaction to insert follow record and update both counters atomically.
 */
router.post('/:userId/follow', withAuth, (req, res) => {
  try {
    const db = getDb();
    const followerId = req.user.id;
    const followeeId = req.params.userId;

    if (followerId === followeeId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(followeeId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existing = db.prepare('SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?').get(followerId, followeeId);
    if (existing) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    const now = new Date().toISOString();

    const followTx = db.transaction(() => {
      db.prepare('INSERT INTO follows (followerId, followeeId, createdAt) VALUES (?, ?, ?)').run(followerId, followeeId, now);
      db.prepare('UPDATE users SET followersCount = followersCount + 1 WHERE id = ?').run(followeeId);
      db.prepare('UPDATE users SET followingCount = followingCount + 1 WHERE id = ?').run(followerId);
    });
    followTx();

    return res.status(200).json({ message: 'Followed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /users/:userId/unfollow
 * Unfollow a user. Checks that the follow relationship exists.
 * Uses a transaction to delete follow record and update both counters atomically.
 */
router.post('/:userId/unfollow', withAuth, (req, res) => {
  try {
    const db = getDb();
    const followerId = req.user.id;
    const followeeId = req.params.userId;

    const existing = db.prepare('SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?').get(followerId, followeeId);
    if (!existing) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    const unfollowTx = db.transaction(() => {
      db.prepare('DELETE FROM follows WHERE followerId = ? AND followeeId = ?').run(followerId, followeeId);
      db.prepare('UPDATE users SET followersCount = followersCount - 1 WHERE id = ?').run(followeeId);
      db.prepare('UPDATE users SET followingCount = followingCount - 1 WHERE id = ?').run(followerId);
    });
    unfollowTx();

    return res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /users/:userId/following
 * Check if the current user follows the specified user.
 */
router.get('/:userId/following', withAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?').get(req.user.id, req.params.userId);
    return res.status(200).json({ isFollowing: !!existing });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /users/:userId/posts
 * Return posts by the specified user. Delegates to getUserPosts from posts.js.
 */
router.get('/:userId/posts', withAuth, getUserPosts);

module.exports = router;
