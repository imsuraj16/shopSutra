const request = require('supertest');
const app = require('../../app');

// Contract tests for POST /api/auth/logout
// Assumptions:
// - Cookie name is "token" (as used by register/login controllers)
// - Endpoint should be idempotent: always responds 200 with { success: true, message }
// - It should clear the cookie by setting Set-Cookie with token=; Max-Age=0 or an expired Date
// - If a token store/blacklist is used (e.g., Redis), API still returns 200 in tests without asserting external effects

const getAuthCookie = async () => {
  const payload = {
    fullName: { firstName: 'Log', lastName: 'Out' },
    userName: 'logout' + Math.random().toString(16).slice(2,8),
    email: 'logout' + Math.random().toString(16).slice(2,8) + '@example.com',
    password: 'password123'
  };
  await request(app).post('/api/auth/register').send(payload).expect(201);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password })
    .expect(200);
  return res.headers['set-cookie'];
};

const cookieCleared = (setCookieHeader) => {
  if (!setCookieHeader) return false;
  const header = Array.isArray(setCookieHeader) ? setCookieHeader.join(';') : String(setCookieHeader);
  // Check both common patterns for clearing
  return /token=;/i.test(header) && (/max-age=0/i.test(header) || /expires=/i.test(header));
};

describe('/api/auth/logout (contract)', () => {
  test('clears auth cookie and returns 200 when logged in', async () => {
    const cookie = await getAuthCookie();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body).toMatchObject({ success: true });
    expect(cookieCleared(res.headers['set-cookie'])).toBe(true);
  });

  test('is idempotent: returns 200 and no cookie required', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    expect(res.body).toMatchObject({ success: true });
    // Even without prior cookie, server may still send a clearing cookie
    // but we don't require it strictly for idempotence
  });

  test('returns 200 and clears cookie even if token is invalid', async () => {
    const fakeCookie = ['token=bad.invalid.sig; Path=/; HttpOnly'];
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', fakeCookie)
      .expect(200);

    expect(res.body).toMatchObject({ success: true });
    expect(cookieCleared(res.headers['set-cookie'])).toBe(true);
  });
});
