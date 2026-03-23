const fc = require('fast-check');

// Set DB_PATH to in-memory before importing database module
process.env.DB_PATH = ':memory:';

const { getDb, initDatabase, closeDb } = require('../../src/database');

/**
 * Feature: local-development-setup
 * Property 2: Database initialization idempotency
 *
 * For any number of initDatabase() calls (1-10), the database should always
 * have four tables (users, posts, likes, follows) and produce no errors.
 *
 * Validates: Requirements 2.7
 */
describe('Feature: local-development-setup, Property 2: Database initialization idempotency', () => {
  afterEach(() => {
    closeDb();
  });

  it('should always have exactly 4 tables after any number of initDatabase() calls (1-10)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (callCount) => {
          // Reset database connection for each iteration
          closeDb();

          // Call initDatabase() the generated number of times
          for (let i = 0; i < callCount; i++) {
            initDatabase();
          }

          // Verify all 4 tables exist
          const db = getDb();
          const tables = db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            .all()
            .map((row) => row.name);

          const expectedTables = ['follows', 'likes', 'posts', 'users'];
          expect(tables).toEqual(expectedTables);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Set JWT_SECRET before importing server
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../../src/server');

/**
 * Feature: local-development-setup
 * Property 1: CORS header presence
 *
 * For any HTTP method and valid route, the response should include
 * Access-Control-Allow-Origin header.
 *
 * Validates: Requirements 1.3
 */
describe('Feature: local-development-setup, Property 1: CORS header presence', () => {
  const validRoutes = ['/auth/register', '/auth/login', '/posts', '/users/test-id'];
  const httpMethods = ['get', 'post', 'put', 'options'];

  afterAll(() => {
    closeDb();
  });

  it('should include Access-Control-Allow-Origin header for any HTTP method and valid route', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...httpMethods),
        fc.constantFrom(...validRoutes),
        async (method, route) => {
          const res = await request(app)[method](route)
            .set('Origin', 'http://localhost:5173')
            .send({});

          expect(res.headers).toHaveProperty('access-control-allow-origin');
        }
      ),
      { numRuns: 100 }
    );
  });
});
