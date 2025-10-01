const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const productModel = require('../../models/product.model');

// Auth middleware mock (from global setup) sets this user as the requester
const MOCK_USER_ID = '507f1f77bcf86cd799439011';

describe('DELETE /api/products/:productId', () => {
  test('200 OK: deletes own product successfully', async () => {
    // Seed a product owned by the mocked user
    const product = await productModel.create({
      title: 'Deletable Product',
      description: 'To be removed',
      price: { amount: 999, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(MOCK_USER_ID),
    });

    const res = await request(app).delete(`/api/products/${product._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Product deleted successfully');
    expect(res.body).toHaveProperty('product');
    expect(res.body.product._id).toBe(product._id.toString());

    // Ensure it is actually gone
    const found = await productModel.findById(product._id);
    expect(found).toBeNull();
  });

  test("404 Not Found: cannot delete someone else's product", async () => {
    // Seed a product owned by a different seller
    const product = await productModel.create({
      title: 'Alien Product',
      description: 'Not mine',
      price: { amount: 500, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(),
    });

    const res = await request(app).delete(`/api/products/${product._id}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty(
      'message',
      'Product not found or you are not authorized to delete this product'
    );

    // Still exists
    const stillThere = await productModel.findById(product._id);
    expect(stillThere).not.toBeNull();
  });

  test('404 Not Found: valid id but no product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/products/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty(
      'message',
      'Product not found or you are not authorized to delete this product'
    );
  });

  test('400 Bad Request: invalid productId format', async () => {
    const res = await request(app).delete('/api/products/not-a-valid-id');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    const messages = res.body.errors.map(e => e.msg);
    expect(messages).toContain('Invalid product ID');
  });
});
