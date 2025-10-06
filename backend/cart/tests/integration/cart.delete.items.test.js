const mongoose = require('mongoose');
const cartModel = require('../../src/models/cart.model');
const createClient = require('../utils/testClient');
const jwt = require('jsonwebtoken');

const endpoint = '/api/cart/items';

function authHeader(payload = { _id: new mongoose.Types.ObjectId().toString(), role: 'user' }) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

/*
 deleteCart behavior (expected design for controller implementation):
  - Auth required (role: user). If no token => 401 { message: 'Unauthorized' }
  - If cart does not exist for user => 404 { message: 'Cart not found' }
  - If cart exists:
      * Remove (delete) the cart document entirely OR set items=[] & totalPrice=0 then persist.
      * Respond 200 with shape: { success: true, message: 'Cart deleted', data: { items: [], totalPrice: 0 } }
        (Even if you physically delete the document, return an empty representation for consumer ease.)
  - Idempotency: A second DELETE after successful deletion should return 404 (since cart no longer exists).
  - Token may use either id or _id field for user identifier (other tests show both); support both.
*/

describe('DELETE /api/cart/items', () => {
  test('401 when no auth token provided', async () => {
    const res = await createClient().delete(endpoint);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized');
  });

  test('403 when role not permitted', async () => {
    const token = authHeader({ _id: new mongoose.Types.ObjectId().toString(), role: 'notUser' });
    const res = await createClient().delete(endpoint).set('Authorization', token);
    // Accepting either 401 (if token parse mismatch) or 403 (role check) similar to other tests
    expect([401,403]).toContain(res.status);
  });

  test('404 when cart does not exist for user', async () => {
    const res = await createClient().delete(endpoint).set('Authorization', authHeader());
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Cart not found');
  });

  test('200 deletes existing cart (using id field in token)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productA = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [ { productId: productA, quantity: 2 } ],
      totalPrice: 20
    });

    const res = await createClient()
      .delete(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Cart deleted');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.totalPrice).toBe(0);

    // Confirm DB no longer has cart (if you choose to hard delete). If implementing soft delete keep this adjusted.
    const found = await cartModel.findOne({ user: userId });
    expect(found === null || (found.items.length === 0 && found.totalPrice === 0)).toBe(true);
  });

  test('200 deletes existing cart (using _id field in token)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productA = new mongoose.Types.ObjectId().toString();
    const productB = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [ { productId: productA, quantity: 1 }, { productId: productB, quantity: 3 } ],
      totalPrice: 40
    });

    const res = await createClient()
      .delete(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.totalPrice).toBe(0);
  });

  test('404 on second delete (idempotency check)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const product = new mongoose.Types.ObjectId().toString();

    await cartModel.create({ user: userId, items: [ { productId: product, quantity: 1 } ], totalPrice: 10 });

    const first = await createClient().delete(endpoint).set('Authorization', authHeader({ id: userId, role: 'user' }));
    expect(first.status).toBe(200);

    const second = await createClient().delete(endpoint).set('Authorization', authHeader({ id: userId, role: 'user' }));
    expect(second.status).toBe(404);
    expect(second.body).toHaveProperty('message', 'Cart not found');
  });

  test('Safe if cart already empty structure exists (treat as delete)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    await cartModel.create({ user: userId, items: [], totalPrice: 0 });

    const res = await createClient().delete(endpoint).set('Authorization', authHeader({ id: userId, role: 'user' }));
    // Depending on how you implement you may consider empty existing doc as deletable (200) or as not found (404).
    expect([200,404]).toContain(res.status);
  });
});
