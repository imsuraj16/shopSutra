// src/__tests__/product/getProductById.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app'); // path to Express app
const productModel = require('../../models/product.model');

// Mock auth middleware to bypass authentication in tests
jest.mock('../../middlewares/auth.middleware', () => () => (req, res, next) => next());

// Mock paramsValidation middleware to bypass it in tests
jest.mock('../../middlewares/validator.middleware', () => ({
  // Bypass only paramsValidation for this test suite
  paramsValidation: (req, res, next) => next(),
  // Provide no-op validators to satisfy route wiring when app loads
  productValidation: [(req, res, next) => next()],
  updateProductvalidation: [(req, res, next) => next()],
}));

describe('GET /api/products/:productId', () => {
  let product;

  beforeEach(async () => {
    // Ensure we're connected (global setup connects already)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    // Seed a fresh product for each test (global beforeEach cleans the DB)
    product = await productModel.create({
      title: 'Test Product',
      description: 'Test description',
      price: { amount: 1000, currency: 'INR' },
      images: [],
      seller: new mongoose.Types.ObjectId(),
    });
  });

  test('should return a product by id', async () => {
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product._id).toBe(product._id.toString());
  });

  test('should return 404 if product not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  test('should return 400 for invalid id', async () => {
    const res = await request(app).get(`/api/products/123invalid`);
    expect(res.statusCode).toBe(400);
    // Since we bypassed paramsValidation, controller handles it
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Invalid product ID');
  });
});
