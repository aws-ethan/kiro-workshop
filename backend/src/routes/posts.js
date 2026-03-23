const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { withAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Shared helper that queries posts from SQLite with filtering, sorting, and pagination.
 * Used by both GET /posts and GET /users/:userId/posts.
 *
 * @param {object} query - { limit, sortBy, userId, nextToken }
 * @returns {{ posts: object[], nextToken: string|null }}
 */
function getPosts(query) {
  const db = getDb();

  let limit = parseInt(query.limit, 10) || 20;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const sortBy = query.sortBy === 'popular' ? 'popular' : 'newest';
  const userId = query.userId || null;
  const offset = parseInt(query.nextToken, 10) || 0;

  const clauses = [];
  const params = [];

  if (userId) {
    clauses.push('userId = ?');
    params.push(userId);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy = sortBy === 'popular'
    ? 'ORDER BY likesCount DESC, createdAt DESC'
    : 'ORDER BY createdAt DESC';

  const sql = `SELECT * FROM posts ${where} ${orderBy} LIMIT ? OFFSET ?`;
  params.push(limit + 1, offset); // fetch one extra to detect next page

  const rows = db.prepare(sql).all(...params);

  let nextToken = null;
  if (rows.length > limit) {
    rows.pop();
    nextToken = String(offset + limit);
  }

  return { posts: rows, nextToken };
}

/**
 * POST /posts
 * Create a new post. Content must be non-empty (after trim) and ≤ 280 characters.
 */
router.post('/', withAuth, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty' });
    }

    if (content.length > 280) {
      return res.status(400).json({ message: 'Post content cannot exceed 280 characters' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const post = {
      id,
      userId: req.user.id,
      content,
      createdAt: now,
      updatedAt: now,
      likesCount: 0,
      commentsCount: 0,
    };

    db.prepare(
      `INSERT INTO posts (id, userId, content, createdAt, updatedAt, likesCount, commentsCount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.user.id, content, now, now, 0, 0);

    return res.status(201).json({ post });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /posts
 * List posts with optional filtering, sorting, and pagination.
 * Query params: limit, sortBy (newest|popular), userId, nextToken
 */
router.get('/', withAuth, (req, res) => {
  try {
    const result = getPosts(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /posts/:postId/like
 * Like a post. Prevents duplicate likes.
 */
router.post('/:postId/like', withAuth, (req, res) => {
  try {
    const db = getDb();
    const { postId } = req.params;
    const userId = req.user.id;

    // Check post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check duplicate like
    const existingLike = db.prepare('SELECT userId FROM likes WHERE userId = ? AND postId = ?').get(userId, postId);
    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }

    const now = new Date().toISOString();

    // Insert like and update count in a transaction
    const likeTx = db.transaction(() => {
      db.prepare('INSERT INTO likes (userId, postId, createdAt) VALUES (?, ?, ?)').run(userId, postId, now);
      db.prepare('UPDATE posts SET likesCount = likesCount + 1 WHERE id = ?').run(postId);
    });
    likeTx();

    return res.status(200).json({ message: 'Post liked successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Middleware that handles GET /users/:userId/posts.
 * Designed to be mounted on the users router: router.get('/:userId/posts', getUserPosts)
 */
function getUserPosts(req, res) {
  try {
    const result = getPosts({ ...req.query, userId: req.params.userId });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = router;
module.exports.getUserPosts = getUserPosts;
module.exports.getPosts = getPosts;
