const request = require('supertest');
const app = require('../../app');

// Helper to register a user first (re-using API) so password hashing logic remains consistent
const registerUser = async (overrides = {}) => {
  const base = {
    fullName: { firstName: 'Test', lastName: 'User' },
    userName: 'testuser' + Math.random().toString(16).slice(2,8),
    email: 'test' + Math.random().toString(16).slice(2,8) + '@example.com',
    password: 'password123'
  };
  const payload = { ...base, ...overrides };
  const res = await request(app).post('/api/auth/register').send(payload).expect(201);
  return { payload, res };
};

describe('/api/auth/login', () => {
  test('logs in successfully with correct credentials', async () => {
    const { payload } = await registerUser({ userName: 'loginuser', email: 'login@example.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(payload.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('fails with wrong password', async () => {
    const { payload } = await registerUser({ userName: 'wrongpwuser', email: 'wrongpw@example.com' });
    await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'incorrect' })
      .expect(401);
  });

  test('fails with non-existing user', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@example.com', password: 'somepassword' })
      .expect(401);
  });

  test('validator error when missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
