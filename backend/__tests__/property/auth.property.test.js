const fc = require('fast-check');
const jwt = require('jsonwebtoken');

// Set JWT_SECRET before importing auth module
process.env.JWT_SECRET = 'test-secret';

const { signToken } = require('../../src/middleware/auth');

/**
 * Feature: local-development-setup
 * Property 5: JWT token round-trip integrity
 *
 * For any user id/username, a signed JWT should decode back to the same
 * id and username, with expiry approximately 24 hours from now.
 *
 * Validates: Requirements 3.4, 3.5
 */
describe('Feature: local-development-setup, Property 5: JWT token round-trip integrity', () => {
  it('should decode to the same id and username with ~24h expiry for any user', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9]{1,30}$/),
        fc.stringMatching(/^[a-zA-Z0-9]{1,30}$/),
        (id, username) => {
          const beforeSign = Math.floor(Date.now() / 1000);
          const token = signToken({ id, username });
          const afterSign = Math.floor(Date.now() / 1000);

          const decoded = jwt.verify(token, 'test-secret');

          // id and username round-trip intact
          expect(decoded.id).toBe(id);
          expect(decoded.username).toBe(username);

          // expiry is approximately 24 hours (86400 seconds) from iat
          const expectedExpiry = 24 * 60 * 60; // 86400
          const actualExpiry = decoded.exp - decoded.iat;
          expect(actualExpiry).toBe(expectedExpiry);

          // iat is within the signing window
          expect(decoded.iat).toBeGreaterThanOrEqual(beforeSign);
          expect(decoded.iat).toBeLessThanOrEqual(afterSign);
        }
      ),
      { numRuns: 100 }
    );
  });
});

const express = require('express');
const supertest = require('supertest');
const { initDatabase, closeDb } = require('../../src/database');
const authRoutes = require('../../src/routes/auth');

/**
 * Feature: local-development-setup
 * Property 3: Register-login round-trip consistency
 *
 * For any valid username/email/password, register then login should succeed
 * and return a JWT containing the correct id and username.
 *
 * Validates: Requirements 3.1, 3.3
 */
describe('Feature: local-development-setup, Property 3: Register-login round-trip consistency', () => {
  let app;

  beforeAll(() => {
    process.env.DB_PATH = ':memory:';
    process.env.JWT_SECRET = 'test-secret';

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    initDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  it('should register then login successfully and return JWT with correct id and username', async () => {
    let counter = 0;

    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,19}$/),
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,9}@[a-z]{3,8}\.[a-z]{2,4}$/),
        fc.stringMatching(/^[a-zA-Z0-9!@#$%]{6,30}$/),
        async (baseUsername, email, password) => {
          const username = `${baseUsername}_${counter++}`;

          // Step 1: Register
          const registerRes = await supertest(app)
            .post('/auth/register')
            .send({ username, email, password });

          expect(registerRes.status).toBe(201);
          expect(registerRes.body.user).toBeDefined();
          expect(registerRes.body.user.username).toBe(username);

          const registeredId = registerRes.body.user.id;

          // Step 2: Login with same credentials
          const loginRes = await supertest(app)
            .post('/auth/login')
            .send({ username, password });

          expect(loginRes.status).toBe(200);
          expect(loginRes.body.token).toBeDefined();

          // Step 3: Decode JWT and verify id and username match
          const decoded = jwt.verify(loginRes.body.token, 'test-secret');
          expect(decoded.id).toBe(registeredId);
          expect(decoded.username).toBe(username);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});

/**
 * Feature: local-development-setup
 * Property 4: Username uniqueness constraint
 *
 * For any already-registered username, duplicate registration should return
 * 409, and the database should still have exactly 1 record for that username.
 *
 * Validates: Requirements 2.3, 3.2
 */
describe('Feature: local-development-setup, Property 4: Username uniqueness constraint', () => {
  let app;

  beforeAll(() => {
    process.env.DB_PATH = ':memory:';
    process.env.JWT_SECRET = 'test-secret';

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    initDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  it('should return 409 for duplicate username and keep exactly 1 record', async () => {
    let counter = 0;

    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,19}$/),
        async (baseUsername) => {
          const username = `dup_${counter++}_${baseUsername}`;
          const email1 = `first_${counter}@test.com`;
          const email2 = `second_${counter}@test.com`;
          const password = 'Password123!';

          // Step 1: Register the user (expect 201)
          const registerRes = await supertest(app)
            .post('/auth/register')
            .send({ username, email: email1, password });

          expect(registerRes.status).toBe(201);
          expect(registerRes.body.user.username).toBe(username);

          // Step 2: Try to register again with the same username but different email (expect 409)
          const duplicateRes = await supertest(app)
            .post('/auth/register')
            .send({ username, email: email2, password });

          expect(duplicateRes.status).toBe(409);

          // Step 3: Verify only 1 record exists for that username in the database
          const { getDb } = require('../../src/database');
          const db = getDb();
          const count = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE username = ?').get(username);
          expect(count.cnt).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
