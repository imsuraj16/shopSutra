const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');

// We rely on global setup hooking up in-memory DB via setup.js (configured in package.json jest.setup)

describe('/api/auth/register', () => {
  test('creates a user when valid payload provided', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: { firstName: 'John', lastName: 'Doe' },
        userName: 'johndoe',
        email: 'john@example.com',
        password: 'secret123'
      })
      .expect(201);

  expect(res.body.success).toBe(true);
  expect(res.body.user).toBeDefined();
  expect(res.body.user.email).toBe('john@example.com');
  expect(res.body.user.userName).toBe('johndoe');
  });

  test('rejects duplicate email', async () => {
    const payload = {
      fullName: { firstName: 'Jane', lastName: 'Smith' },
      userName: 'janesmith',
      email: 'jane@example.com',
      password: 'abc12345'
    };

    await request(app).post('/api/auth/register').send(payload).expect(201);
  const dup = await request(app).post('/api/auth/register').send({ ...payload, userName: 'differentname' }).expect(409);
    expect(dup.body.message).toMatch(/already exists/i);
  });

  test('requires mandatory fields (validator errors)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ userName: 'x', email: 'x@example.com', password: '123456' })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    // Expect at least firstName and lastName missing errors
    const fields = res.body.errors.map(e => e.path);
    expect(fields).toEqual(expect.arrayContaining(['fullName.firstName','fullName.lastName']));
  });
});
