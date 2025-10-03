const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const productModel = require('../../models/product.model');

// Auth middleware mock (from setup) sets this user as the requester
const MOCK_USER_ID = '507f1f77bcf86cd799439011';

describe('PATCH /api/products/:productId', () => {
  test('200 OK: updates own product fields', async () => {
    // Seed a product owned by the mocked user
    const product = await productModel.create({
      title: 'Old Title',
      description: 'Old description',
      price: { amount: 100, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(MOCK_USER_ID),
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({
        title: 'Updated Product',
        description: 'New description',
        price: { amount: 250, currency: 'USD' },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Product updated successfully');
    expect(res.body).toHaveProperty('product');
    expect(res.body.product.title).toBe('Updated Product');
    expect(res.body.product.description).toBe('New description');
    expect(res.body.product.price.amount).toBe(250);
    expect(res.body.product.price.currency).toBe('USD');
  });

  test('404 Not Found: cannot edit others\' product', async () => {
    // Seed a product owned by someone else
    const product = await productModel.create({
      title: 'Alien Product',
      description: 'Not mine',
      price: { amount: 500, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(),
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({ title: 'Hacked Title' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty(
      'message',
      'Product not found or you are not authorized to edit this product'
    );
  });

  test('400 Bad Request: invalid productId format', async () => {
    const res = await request(app)
      .patch('/api/products/not-a-valid-id')
      .send({ title: 'Whatever' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    // express-validator response shape
    const messages = res.body.errors.map(e => e.msg);
    expect(messages).toContain('Invalid product ID');
  });

  test('400 Bad Request: price must be an object', async () => {
    // Seed a product owned by the mocked user
    const product = await productModel.create({
      title: 'Valid Product',
      description: 'Desc',
      price: { amount: 100, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(MOCK_USER_ID),
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({ price: 'not-an-object' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    const messages = res.body.errors.map(e => e.msg);
    expect(messages).toContain('Price must be an object with amount and currency fields');
  });
});
