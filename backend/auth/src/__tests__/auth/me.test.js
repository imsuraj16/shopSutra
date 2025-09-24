const request = require('supertest');
const app = require('../../app');

// NOTE: The actual /api/auth/me endpoint is not yet implemented. These tests
// describe the expected contract. Once the route/controller exist, the tests
// should pass without modification (aside from any differing field names).
//
// Assumed behaviour:
// GET /api/auth/me
//  - Requires a valid JWT auth cookie named "token".
//  - Responds 200 with shape: { success: true, user: { id, fullName, email, userName, role } }
//  - Responds 401 when missing cookie or when token invalid/expired.
//
// We re-use the public register + login endpoints to obtain a real signed cookie
// so hashing / JWT signing logic stays consistent with production behaviour.

// Helper to register & login returning auth cookie
const createAndLoginUser = async (overrides = {}) => {
  const base = {
    fullName: { firstName: 'Me', lastName: 'Tester' },
    userName: 'meuser' + Math.random().toString(16).slice(2,8),
    email: 'me' + Math.random().toString(16).slice(2,8) + '@example.com',
    password: 'password123'
  };
  const payload = { ...base, ...overrides };
  await request(app).post('/api/auth/register').send(payload).expect(201);
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password })
    .expect(200);
  const cookie = loginRes.headers['set-cookie'];
  return { payload, cookie };
};

describe('/api/auth/me (contract)', () => {
  test('returns current user when valid auth cookie provided', async () => {
    const { payload, cookie } = await createAndLoginUser();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.userName).toBe(payload.userName);
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('401 when no auth cookie present', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  test('401 when invalid token cookie provided', async () => {
    // Build a clearly invalid token cookie (malformed / signed with nothing)
    const fakeCookie = ['token=fake.invalid.signature; Path=/; HttpOnly'];
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', fakeCookie)
      .expect(401);
  });
});
