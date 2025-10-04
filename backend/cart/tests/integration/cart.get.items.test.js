const mongoose = require('mongoose');
const cartModel = require('../../src/models/cart.model');
const createClient = require('../utils/testClient');
const jwt = require('jsonwebtoken');

const endpoint = '/api/cart/items';

function authHeader(payload = { _id: new mongoose.Types.ObjectId().toString(), role: 'user' }) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

describe('GET /api/cart/items', () => {
  test('401 if no token provided', async () => {
    const res = await createClient().get(endpoint);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized');
  });

  test('403 if role not permitted', async () => {
    const token = authHeader({ _id: new mongoose.Types.ObjectId().toString(), role: 'adminNotAllowed' });
    const res = await createClient().get(endpoint).set('Authorization', token);
    expect([401,403]).toContain(res.status);
  });

  test('200 returns empty cart when none exists yet', async () => {
    const res = await createClient().get(endpoint).set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.totalPrice).toBe(0);
  });

  test('200 returns existing cart with items', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productA = new mongoose.Types.ObjectId().toString();
    const productB = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [
        { productId: productA, quantity: 2 },
        { productId: productB, quantity: 1 }
      ],
      totalPrice: 30 // 3 items * mocked price 10 each
    });

    const res = await createClient().get(endpoint).set('Authorization', authHeader({ id: userId, role: 'user' }));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    const ids = res.body.data.items.map(i => i.productId.toString());
    expect(ids).toEqual(expect.arrayContaining([productA, productB]));
    expect(res.body.data.totalPrice).toBe(30);
  });

  test('200 consistent when cart exists but token uses _id field', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productA = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [ { productId: productA, quantity: 1 } ],
      totalPrice: 10
    });

    const res = await createClient().get(endpoint).set('Authorization', authHeader({ _id: userId, role: 'user' }));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });
});
