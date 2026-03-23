const fc = require('fast-check');
const express = require('express');
const supertest = require('supertest');

// Set environment before imports
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const { initDatabase, closeDb } = require('../../src/database');
const authRoutes = require('../../src/routes/auth');
const postRoutes = require('../../src/routes/posts');
const userRoutes = require('../../src/routes/users');

/**
 * Feature: local-development-setup
 * Property 9: User profile response data security
 *
 * For any user profile query, the returned JSON should NOT contain
 * passwordHash field.
 *
 * Validates: Requirements 4.4
 */
describe('Feature: local-development-setup, Property 9: User profile response data security', () => {
  let app;
  let token;
  const registeredUsers = [];

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/users', userRoutes);

    initDatabase();

    // Register 10 test users with varied data
    for (let i = 0; i < 10; i++) {
      const res = await supertest(app)
        .post('/auth/register')
        .send({
          username: `secuser${i}`,
          email: `secuser${i}@test.com`,
          password: `Pass${i}word!`,
          displayName: `Security User ${i}`,
        });

      expect(res.status).toBe(201);
      registeredUsers.push(res.body.user);
    }

    // Login as the first user to get a JWT token
    const loginRes = await supertest(app)
      .post('/auth/login')
      .send({ username: 'secuser0', password: 'Pass0word!' });

    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should never include passwordHash in user profile response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: registeredUsers.length - 1 }),
        async (userIndex) => {
          const userId = registeredUsers[userIndex].id;

          const res = await supertest(app)
            .get(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.user).toBeDefined();

          // passwordHash must NOT be present
          expect(res.body.user).not.toHaveProperty('passwordHash');

          // Expected fields SHOULD be present
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('username');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user).toHaveProperty('displayName');
          expect(res.body.user).toHaveProperty('bio');
          expect(res.body.user).toHaveProperty('avatarUrl');
          expect(res.body.user).toHaveProperty('createdAt');
          expect(res.body.user).toHaveProperty('updatedAt');
          expect(res.body.user).toHaveProperty('followersCount');
          expect(res.body.user).toHaveProperty('followingCount');
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});

/**
 * Feature: local-development-setup
 * Property 10: User profile update authorization and field restrictions
 *
 * User A updating User B's profile should return 403;
 * updating own profile should only change displayName/bio/avatarUrl,
 * other fields (username, email) unchanged.
 *
 * Validates: Requirements 4.5
 */
describe('Feature: local-development-setup, Property 10: User profile update authorization and field restrictions', () => {
  let app;
  let userA, userB;
  let tokenA, tokenB;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/users', userRoutes);

    initDatabase();

    // Register userA
    const resA = await supertest(app)
      .post('/auth/register')
      .send({
        username: 'profileuserA',
        email: 'profileuserA@test.com',
        password: 'PasswordA1!',
        displayName: 'Profile User A',
      });
    expect(resA.status).toBe(201);
    userA = resA.body.user;

    // Register userB
    const resB = await supertest(app)
      .post('/auth/register')
      .send({
        username: 'profileuserB',
        email: 'profileuserB@test.com',
        password: 'PasswordB2!',
        displayName: 'Profile User B',
      });
    expect(resB.status).toBe(201);
    userB = resB.body.user;

    // Login as userA
    const loginA = await supertest(app)
      .post('/auth/login')
      .send({ username: 'profileuserA', password: 'PasswordA1!' });
    expect(loginA.status).toBe(200);
    tokenA = loginA.body.token;

    // Login as userB
    const loginB = await supertest(app)
      .post('/auth/login')
      .send({ username: 'profileuserB', password: 'PasswordB2!' });
    expect(loginB.status).toBe(200);
    tokenB = loginB.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should return 403 when user A tries to update user B profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        async (randomDisplayName, randomBio, randomAvatarUrl) => {
          const res = await supertest(app)
            .put(`/users/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
              displayName: randomDisplayName,
              bio: randomBio,
              avatarUrl: randomAvatarUrl,
            });

          expect(res.status).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  it('should only update displayName/bio/avatarUrl on own profile, username and email unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.includes('@')),
        async (newDisplayName, newBio, newAvatarUrl, randomUsername, randomEmail) => {
          // Fetch original profile before update
          const before = await supertest(app)
            .get(`/users/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(before.status).toBe(200);
          const originalUsername = before.body.user.username;
          const originalEmail = before.body.user.email;

          // Send update with allowed fields AND disallowed fields (username, email)
          const res = await supertest(app)
            .put(`/users/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
              displayName: newDisplayName,
              bio: newBio,
              avatarUrl: newAvatarUrl,
              username: randomUsername,
              email: randomEmail,
            });

          expect(res.status).toBe(200);

          // Verify allowed fields are updated
          expect(res.body.user.displayName).toBe(newDisplayName);
          expect(res.body.user.bio).toBe(newBio);
          expect(res.body.user.avatarUrl).toBe(newAvatarUrl);

          // Verify disallowed fields remain unchanged
          expect(res.body.user.username).toBe(originalUsername);
          expect(res.body.user.email).toBe(originalEmail);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});


/**
 * Feature: local-development-setup
 * Property 11: Follow-unfollow round-trip consistency
 *
 * For any two different users A and B, A follows B then unfollows B,
 * both followersCount and followingCount restore to original values.
 * Self-follow is rejected with 400.
 *
 * Validates: Requirements 2.6, 4.6, 4.7
 */
describe('Feature: local-development-setup, Property 11: Follow-unfollow round-trip consistency', () => {
  let app;
  const users = [];
  const tokens = [];

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/users', userRoutes);

    initDatabase();

    // Register 5 test users
    for (let i = 0; i < 5; i++) {
      const res = await supertest(app)
        .post('/auth/register')
        .send({
          username: `followuser${i}`,
          email: `followuser${i}@test.com`,
          password: `FollowPass${i}!`,
          displayName: `Follow User ${i}`,
        });
      expect(res.status).toBe(201);
      users.push(res.body.user);
    }

    // Login all users to get tokens
    for (let i = 0; i < 5; i++) {
      const loginRes = await supertest(app)
        .post('/auth/login')
        .send({ username: `followuser${i}`, password: `FollowPass${i}!` });
      expect(loginRes.status).toBe(200);
      tokens.push(loginRes.body.token);
    }
  });

  afterAll(() => {
    closeDb();
  });

  it('should restore counters after follow then unfollow round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 0, max: 4 }),
        async (indexA, indexB) => {
          // Ensure A and B are different users
          fc.pre(indexA !== indexB);

          const userA = users[indexA];
          const userB = users[indexB];
          const tokenA = tokens[indexA];

          // Clean up any existing follow relationship first
          const db = require('../../src/database').getDb();
          const existingFollow = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);
          if (existingFollow) {
            await supertest(app)
              .post(`/users/${userB.id}/unfollow`)
              .set('Authorization', `Bearer ${tokenA}`);
          }

          // Record counters before follow
          const beforeA = await supertest(app)
            .get(`/users/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(beforeA.status).toBe(200);
          const beforeFollowingA = beforeA.body.user.followingCount;

          const beforeB = await supertest(app)
            .get(`/users/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(beforeB.status).toBe(200);
          const beforeFollowersB = beforeB.body.user.followersCount;

          // A follows B
          const followRes = await supertest(app)
            .post(`/users/${userB.id}/follow`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(followRes.status).toBe(200);

          // Verify counters increased
          const afterFollowA = await supertest(app)
            .get(`/users/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterFollowA.status).toBe(200);
          expect(afterFollowA.body.user.followingCount).toBe(beforeFollowingA + 1);

          const afterFollowB = await supertest(app)
            .get(`/users/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterFollowB.status).toBe(200);
          expect(afterFollowB.body.user.followersCount).toBe(beforeFollowersB + 1);

          // A unfollows B
          const unfollowRes = await supertest(app)
            .post(`/users/${userB.id}/unfollow`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(unfollowRes.status).toBe(200);

          // Verify counters restored to original values
          const afterUnfollowA = await supertest(app)
            .get(`/users/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterUnfollowA.status).toBe(200);
          expect(afterUnfollowA.body.user.followingCount).toBe(beforeFollowingA);

          const afterUnfollowB = await supertest(app)
            .get(`/users/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterUnfollowB.status).toBe(200);
          expect(afterUnfollowB.body.user.followersCount).toBe(beforeFollowersB);
        }
      ),
      { numRuns: 100 }
    );
  }, 180000);

  it('should reject self-follow with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 4 }),
        async (userIndex) => {
          const user = users[userIndex];
          const token = tokens[userIndex];

          const res = await supertest(app)
            .post(`/users/${user.id}/follow`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('You cannot follow yourself');
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});


/**
 * Feature: local-development-setup
 * Property 12: Follow status query consistency
 *
 * checkFollowing returns true if and only if follows table has the corresponding record.
 * The API response should always be consistent with the database state.
 *
 * Validates: Requirements 4.8
 */
describe('Feature: local-development-setup, Property 12: Follow status query consistency', () => {
  let app;
  const users = [];
  const tokens = [];

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/users', userRoutes);

    initDatabase();

    // Register 4 test users
    for (let i = 0; i < 4; i++) {
      const res = await supertest(app)
        .post('/auth/register')
        .send({
          username: `followstatususer${i}`,
          email: `followstatususer${i}@test.com`,
          password: `FollowStatus${i}!`,
          displayName: `Follow Status User ${i}`,
        });
      expect(res.status).toBe(201);
      users.push(res.body.user);
    }

    // Login all users to get tokens
    for (let i = 0; i < 4; i++) {
      const loginRes = await supertest(app)
        .post('/auth/login')
        .send({ username: `followstatususer${i}`, password: `FollowStatus${i}!` });
      expect(loginRes.status).toBe(200);
      tokens.push(loginRes.body.token);
    }
  });

  afterAll(() => {
    closeDb();
  });

  it('should return isFollowing consistent with follows table state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        async (indexA, indexB) => {
          // Ensure A and B are different users
          fc.pre(indexA !== indexB);

          const userA = users[indexA];
          const userB = users[indexB];
          const tokenA = tokens[indexA];

          // Step 1: Check the follows table directly for (A, B) record
          const { getDb } = require('../../src/database');
          const db = getDb();
          const dbRecord = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);

          // Step 2: Call GET /users/:userBId/following with A's token
          const res = await supertest(app)
            .get(`/users/${userB.id}/following`)
            .set('Authorization', `Bearer ${tokenA}`);

          expect(res.status).toBe(200);

          // Step 3: Verify isFollowing matches whether the record exists in the DB
          const expectedIsFollowing = !!dbRecord;
          expect(res.body.isFollowing).toBe(expectedIsFollowing);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  it('should reflect follow/unfollow state changes accurately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        async (indexA, indexB) => {
          fc.pre(indexA !== indexB);

          const userA = users[indexA];
          const userB = users[indexB];
          const tokenA = tokens[indexA];
          const { getDb } = require('../../src/database');
          const db = getDb();

          // Ensure A is not following B (clean state)
          const existing = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);
          if (existing) {
            await supertest(app)
              .post(`/users/${userB.id}/unfollow`)
              .set('Authorization', `Bearer ${tokenA}`);
          }

          // Verify isFollowing is false before follow
          const beforeFollow = await supertest(app)
            .get(`/users/${userB.id}/following`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(beforeFollow.status).toBe(200);
          expect(beforeFollow.body.isFollowing).toBe(false);

          // DB should have no record
          const dbBefore = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);
          expect(dbBefore).toBeUndefined();

          // Follow B
          const followRes = await supertest(app)
            .post(`/users/${userB.id}/follow`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(followRes.status).toBe(200);

          // Verify isFollowing is true after follow
          const afterFollow = await supertest(app)
            .get(`/users/${userB.id}/following`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterFollow.status).toBe(200);
          expect(afterFollow.body.isFollowing).toBe(true);

          // DB should have the record
          const dbAfterFollow = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);
          expect(dbAfterFollow).toBeDefined();

          // Unfollow B
          const unfollowRes = await supertest(app)
            .post(`/users/${userB.id}/unfollow`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(unfollowRes.status).toBe(200);

          // Verify isFollowing is false after unfollow
          const afterUnfollow = await supertest(app)
            .get(`/users/${userB.id}/following`)
            .set('Authorization', `Bearer ${tokenA}`);
          expect(afterUnfollow.status).toBe(200);
          expect(afterUnfollow.body.isFollowing).toBe(false);

          // DB should have no record
          const dbAfterUnfollow = db.prepare(
            'SELECT followerId FROM follows WHERE followerId = ? AND followeeId = ?'
          ).get(userA.id, userB.id);
          expect(dbAfterUnfollow).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
