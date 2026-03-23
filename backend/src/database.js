const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/local.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      displayName TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatarUrl TEXT DEFAULT '',
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      followersCount INTEGER DEFAULT 0,
      followingCount INTEGER DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      likesCount INTEGER DEFAULT 0,
      commentsCount INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);

    CREATE TABLE IF NOT EXISTS likes (
      userId TEXT NOT NULL,
      postId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (userId, postId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (postId) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      followerId TEXT NOT NULL,
      followeeId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (followerId, followeeId),
      FOREIGN KEY (followerId) REFERENCES users(id),
      FOREIGN KEY (followeeId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_follows_followeeId ON follows(followeeId);
  `);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDatabase, closeDb };
