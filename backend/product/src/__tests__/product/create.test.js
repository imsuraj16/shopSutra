const request = require('supertest');
const path = require('path');
const app = require('../../app');

describe('POST /api/products', () => {

  test('201 Created: creates a product with images', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('description', 'Nice product')
      .field('price[amount]', '199')
      .field('price[currency]', 'INR')
      .attach('images', path.join(__dirname, '../fixtures/sample.png')); // PNG image

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product.title).toBe('Test Product');
    expect(res.body.product.images[0].url).toMatch(/^https:\/\/fakecdn\.com/);
  });

  test('400 Bad Request: missing title', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('description', 'Nice product')
      .field('price[amount]', '100');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

});
