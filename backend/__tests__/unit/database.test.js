/**
 * Unit tests for database table structure verification.
 * Requirements: 2.2, 2.3, 2.5, 2.6
 */

process.env.DB_PATH = ':memory:';

const { getDb, initDatabase, closeDb } = require('../../src/database');

afterEach(() => {
  closeDb();
});

describe('initDatabase() table creation', () => {
  test('creates all four tables: users, posts, likes, follows', () => {
    initDatabase();
    const db = getDb();

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all()
      .map((r) => r.name);

    expect(tables).toEqual(
      expect.arrayContaining(['users', 'posts', 'likes', 'follows'])
    );
    expect(tables).toHaveLength(4);
  });
});

describe('users table unique index on username', () => {
  test('idx_users_username index exists and is unique', () => {
    initDatabase();
    const db = getDb();

    const index = db
      .prepare(
        "SELECT * FROM sqlite_master WHERE type='index' AND name='idx_users_username'"
      )
      .get();

    expect(index).toBeDefined();
    expect(index.tbl_name).toBe('users');

    // Verify uniqueness via PRAGMA
    const indexInfo = db.prepare('PRAGMA index_list(users)').all();
    const usernameIdx = indexInfo.find(
      (i) => i.name === 'idx_users_username'
    );
    expect(usernameIdx).toBeDefined();
    expect(usernameIdx.unique).toBe(1);
  });

  test('rejects duplicate username inserts', () => {
    initDatabase();
    const db = getDb();

    const now = new Date().toISOString();
    const insert = db.prepare(
      `INSERT INTO users (id, username, email, displayName, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    insert.run('u1', 'alice', 'a@test.com', 'Alice', 'hash1', now, now);

    expect(() => {
      insert.run('u2', 'alice', 'b@test.com', 'Alice2', 'hash2', now, now);
    }).toThrow(/UNIQUE constraint failed/);
  });
});

describe('likes table composite primary key (userId, postId)', () => {
  test('rejects duplicate (userId, postId) inserts', () => {
    initDatabase();
    const db = getDb();

    const now = new Date().toISOString();

    // Insert prerequisite user and post (foreign keys are ON)
    db.prepare(
      `INSERT INTO users (id, username, email, displayName, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('u1', 'alice', 'a@test.com', 'Alice', 'hash', now, now);

    db.prepare(
      `INSERT INTO posts (id, userId, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`
    ).run('p1', 'u1', 'Hello', now, now);

    const insertLike = db.prepare(
      `INSERT INTO likes (userId, postId, createdAt) VALUES (?, ?, ?)`
    );

    insertLike.run('u1', 'p1', now);

    expect(() => {
      insertLike.run('u1', 'p1', now);
    }).toThrow(/UNIQUE constraint failed/);
  });
});

describe('follows table composite primary key (followerId, followeeId)', () => {
  test('rejects duplicate (followerId, followeeId) inserts', () => {
    initDatabase();
    const db = getDb();

    const now = new Date().toISOString();

    // Insert two users
    const insertUser = db.prepare(
      `INSERT INTO users (id, username, email, displayName, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    insertUser.run('u1', 'alice', 'a@test.com', 'Alice', 'hash', now, now);
    insertUser.run('u2', 'bob', 'b@test.com', 'Bob', 'hash', now, now);

    const insertFollow = db.prepare(
      `INSERT INTO follows (followerId, followeeId, createdAt) VALUES (?, ?, ?)`
    );

    insertFollow.run('u1', 'u2', now);

    expect(() => {
      insertFollow.run('u1', 'u2', now);
    }).toThrow(/UNIQUE constraint failed/);
  });
});
