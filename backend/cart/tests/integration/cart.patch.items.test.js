const mongoose = require('mongoose');
const cartModel = require('../../src/models/cart.model');
const createClient = require('../utils/testClient');
const jwt = require('jsonwebtoken');

const endpoint = '/api/cart/items';

function authHeader(payload = { _id: new mongoose.Types.ObjectId().toString(), role: 'user' }) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

// updateItemsInCart behavior summary:
// - Requires auth (role user)
// - Returns 404 if no existing cart for user
// - For each item in body.items:
//     * if productId exists and quantity <= 0 => remove it
//     * if productId exists and quantity > 0 => set new quantity
//     * if productId not exists and quantity > 0 => add new line
// - Recomputes totalPrice based on mocked product price (10) * quantity
// - Responds 200 with updated cart

describe('PATCH /api/cart/items', () => {
  test('401 when no auth token sent', async () => {
    const res = await createClient().patch(endpoint).send({});
    expect(res.status).toBe(401);
  });

  test('403 when role not permitted', async () => {
    const token = authHeader({ _id: new mongoose.Types.ObjectId().toString(), role: 'notUser' });
    const res = await createClient().patch(endpoint).set('Authorization', token).send({ items: [] });
    expect([401,403]).toContain(res.status); // Accept 401 if token decode fails
  });

  test('404 when cart does not exist for user', async () => {
    const res = await createClient().patch(endpoint).set('Authorization', authHeader()).send({ items: [] });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Cart not found');
  });

  test('200 updates quantity of existing item', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productId = new mongoose.Types.ObjectId().toString();
    await cartModel.create({ user: userId, items: [{ productId, quantity: 2 }], totalPrice: 20 });

    const res = await createClient()
      .patch(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }))
      .send({ items: [{ productId, quantity: 5 }] });

    expect(res.status).toBe(200);
    const updated = res.body.data.items.find(i => i.productId.toString() === productId);
    expect(updated.quantity).toBe(5);
    expect(res.body.data.totalPrice).toBe(50); // 5 * mocked 10
  });

  test('200 removes item when quantity <= 0', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productA = new mongoose.Types.ObjectId().toString();
    const productB = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [
        { productId: productA, quantity: 3 },
        { productId: productB, quantity: 1 }
      ],
      totalPrice: 40 // (3+1)*10; not critical because controller recalculates
    });

    const res = await createClient()
      .patch(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }))
      .send({ items: [ { productId: productA, quantity: 0 } ] });

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map(i => i.productId.toString());
    expect(ids).not.toContain(productA);
    expect(ids).toContain(productB);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.totalPrice).toBe(10); // only productB remains quantity 1
  });

  test('200 adds new item when not present and quantity > 0', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const existingProduct = new mongoose.Types.ObjectId().toString();
    const newProduct = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [ { productId: existingProduct, quantity: 2 } ],
      totalPrice: 20
    });

    const res = await createClient()
      .patch(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }))
      .send({ items: [ { productId: newProduct, quantity: 4 } ] });

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map(i => i.productId.toString());
    expect(ids).toEqual(expect.arrayContaining([existingProduct, newProduct]));
    const newItem = res.body.data.items.find(i => i.productId.toString() === newProduct);
    expect(newItem.quantity).toBe(4);
    expect(res.body.data.totalPrice).toBe(60); // (2+4)*10
  });

  test('200 mixed operations add / update / remove in one request', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const toUpdate = new mongoose.Types.ObjectId().toString();
    const toRemove = new mongoose.Types.ObjectId().toString();
    const toAdd = new mongoose.Types.ObjectId().toString();

    await cartModel.create({
      user: userId,
      items: [
        { productId: toUpdate, quantity: 1 },
        { productId: toRemove, quantity: 2 }
      ],
      totalPrice: 30
    });

    const res = await createClient()
      .patch(endpoint)
      .set('Authorization', authHeader({ id: userId, role: 'user' }))
      .send({
        items: [
          { productId: toUpdate, quantity: 5 }, // update quantity
          { productId: toRemove, quantity: 0 }, // remove
          { productId: toAdd, quantity: 3 }     // add new
        ]
      });

    expect(res.status).toBe(200);
    const ids = res.body.data.items.map(i => i.productId.toString());
    expect(ids).toContain(toUpdate);
    expect(ids).toContain(toAdd);
    expect(ids).not.toContain(toRemove);

    const updated = res.body.data.items.find(i => i.productId.toString() === toUpdate);
    expect(updated.quantity).toBe(5);
    const added = res.body.data.items.find(i => i.productId.toString() === toAdd);
    expect(added.quantity).toBe(3);

    // totalPrice = (5 + 3) * 10 = 80
    expect(res.body.data.totalPrice).toBe(80);
  });
});
