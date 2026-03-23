const fc = require('fast-check');
const express = require('express');
const supertest = require('supertest');

// Set environment before imports
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const { initDatabase, closeDb, getDb } = require('../../src/database');
const authRoutes = require('../../src/routes/auth');
const postRoutes = require('../../src/routes/posts');

/**
 * Feature: local-development-setup
 * Property 6: Post content validation boundaries
 *
 * For any string, if trim is non-empty and length ≤ 280 chars then create
 * succeeds (201), otherwise rejected (400) and post count unchanged.
 *
 * Validates: Requirements 4.1
 */
describe('Feature: local-development-setup, Property 6: Post content validation boundaries', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);

    initDatabase();

    // Register a test user and get a JWT token
    const registerRes = await supertest(app)
      .post('/auth/register')
      .send({ username: 'posttest', email: 'posttest@test.com', password: 'Password123!' });

    expect(registerRes.status).toBe(201);

    const loginRes = await supertest(app)
      .post('/auth/login')
      .send({ username: 'posttest', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should accept valid content and reject empty/too-long content, preserving post count', async () => {
    const contentArb = fc.oneof(
      // Valid: non-empty after trim and ≤ 280 chars
      fc.string({ minLength: 1, maxLength: 280 }).filter(s => s.trim().length > 0),
      // Empty / whitespace-only
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\n\t'),
      // Too long: > 280 chars
      fc.string({ minLength: 281, maxLength: 500 })
    );

    await fc.assert(
      fc.asyncProperty(contentArb, async (content) => {
        const db = getDb();

        // Count posts before
        const before = db.prepare('SELECT COUNT(*) as cnt FROM posts').get().cnt;

        // Attempt to create post
        const res = await supertest(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ content });

        const isValid = content.trim().length > 0 && content.length <= 280;

        if (isValid) {
          expect(res.status).toBe(201);
          const after = db.prepare('SELECT COUNT(*) as cnt FROM posts').get().cnt;
          expect(after).toBe(before + 1);
        } else {
          expect(res.status).toBe(400);
          const after = db.prepare('SELECT COUNT(*) as cnt FROM posts').get().cnt;
          expect(after).toBe(before);
        }
      }),
      { numRuns: 100 }
    );
  }, 120000);
});


/**
 * Feature: local-development-setup
 * Property 7: Post list sorting correctness
 *
 * For any set of posts, newest sorts by createdAt descending, popular sorts
 * by likesCount descending, and returned count ≤ limit.
 *
 * Validates: Requirements 4.2
 */
describe('Feature: local-development-setup, Property 7: Post list sorting correctness', () => {
  let app;
  let token;
  let userId;

  beforeAll(async () => {
    // Close any previous DB connection so we get a fresh in-memory DB
    closeDb();

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);

    initDatabase();

    // Register a test user
    const registerRes = await supertest(app)
      .post('/auth/register')
      .send({ username: 'sortuser', email: 'sortuser@test.com', password: 'Password123!' });
    expect(registerRes.status).toBe(201);
    userId = registerRes.body.user.id;

    const loginRes = await supertest(app)
      .post('/auth/login')
      .send({ username: 'sortuser', password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;

    // Create 15 posts with staggered createdAt timestamps and varying likesCount.
    // We insert directly into the DB so we can control createdAt and likesCount.
    const db = getDb();
    for (let i = 0; i < 15; i++) {
      const id = `post-sort-${i}`;
      // Spread createdAt by 1 second each so ordering is deterministic
      const createdAt = new Date(Date.now() - (15 - i) * 1000).toISOString();
      const likesCount = (i * 7 + 3) % 13; // pseudo-random but deterministic spread
      db.prepare(
        `INSERT INTO posts (id, userId, content, createdAt, updatedAt, likesCount, commentsCount)
         VALUES (?, ?, ?, ?, ?, ?, 0)`
      ).run(id, userId, `Sort test post ${i}`, createdAt, createdAt, likesCount);
    }
  });

  afterAll(() => {
    closeDb();
  });

  it('should return posts sorted correctly by newest or popular, with count ≤ limit', async () => {
    const sortByArb = fc.constantFrom('newest', 'popular');
    const limitArb = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(sortByArb, limitArb, async (sortBy, limit) => {
        const res = await supertest(app)
          .get('/posts')
          .query({ sortBy, limit: String(limit) })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);

        const posts = res.body.posts;

        // Returned count must not exceed limit
        expect(posts.length).toBeLessThanOrEqual(limit);

        // Verify sorting order
        for (let i = 0; i < posts.length - 1; i++) {
          if (sortBy === 'newest') {
            // createdAt descending: each post's createdAt >= next post's createdAt
            expect(new Date(posts[i].createdAt).getTime())
              .toBeGreaterThanOrEqual(new Date(posts[i + 1].createdAt).getTime());
          } else {
            // popular: likesCount descending
            expect(posts[i].likesCount).toBeGreaterThanOrEqual(posts[i + 1].likesCount);
          }
        }
      }),
      { numRuns: 100 }
    );
  }, 120000);
});


/**
 * Feature: local-development-setup
 * Property 8: Like operation correctness
 *
 * For any post and user, the first like should increase likesCount by 1;
 * a duplicate like should return an error and likesCount should remain unchanged.
 *
 * Validates: Requirements 2.5, 4.3
 */
describe('Feature: local-development-setup, Property 8: Like operation correctness', () => {
  let app;
  let token;
  let postCounter = 0;

  beforeAll(async () => {
    // Close any previous DB connection so we get a fresh in-memory DB
    closeDb();

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);

    initDatabase();

    // Register a test user and get a JWT token
    const registerRes = await supertest(app)
      .post('/auth/register')
      .send({ username: 'likeuser', email: 'likeuser@test.com', password: 'Password123!' });
    expect(registerRes.status).toBe(201);

    const loginRes = await supertest(app)
      .post('/auth/login')
      .send({ username: 'likeuser', password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should increase likesCount by 1 on first like and return error with unchanged likesCount on duplicate', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        postCounter++;
        const db = getDb();

        // 1. Create a new post with unique content
        const createRes = await supertest(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Like test post ${postCounter}` });
        expect(createRes.status).toBe(201);

        const postId = createRes.body.post.id;

        // 2. Verify initial likesCount is 0
        const postBefore = db.prepare('SELECT likesCount FROM posts WHERE id = ?').get(postId);
        expect(postBefore.likesCount).toBe(0);

        // 3. First like - should succeed with 200, likesCount becomes 1
        const firstLikeRes = await supertest(app)
          .post(`/posts/${postId}/like`)
          .set('Authorization', `Bearer ${token}`);
        expect(firstLikeRes.status).toBe(200);

        const postAfterFirst = db.prepare('SELECT likesCount FROM posts WHERE id = ?').get(postId);
        expect(postAfterFirst.likesCount).toBe(1);

        // 4. Duplicate like - should return 400 with error message, likesCount still 1
        const secondLikeRes = await supertest(app)
          .post(`/posts/${postId}/like`)
          .set('Authorization', `Bearer ${token}`);
        expect(secondLikeRes.status).toBe(400);
        expect(secondLikeRes.body.message).toBe('You have already liked this post');

        const postAfterSecond = db.prepare('SELECT likesCount FROM posts WHERE id = ?').get(postId);
        expect(postAfterSecond.likesCount).toBe(1);
      }),
      { numRuns: 100 }
    );
  }, 120000);
});
