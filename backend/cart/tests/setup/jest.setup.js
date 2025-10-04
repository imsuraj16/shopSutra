const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  await mongoose.connect(uri);
});

beforeEach(async () => {
  // Clean all collections
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  }
});

// Helper to create auth token
global.signJwt = (payload = { _id: new mongoose.Types.ObjectId().toString(), role: 'user' }) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Mock axios.get for product service so tests aren't dependent on external service
jest.mock('axios');

axios.get.mockImplementation((url) => {
  // Extract last segment as productId
  const parts = url.split('/');
  const productId = parts[parts.length - 1];

  // Simulate error cases based on special productId values if needed later
  if (productId === 'missing') {
    const err = new Error('Not Found');
    err.response = { status: 404 };
    return Promise.reject(err);
  }
  if (productId === 'explode') {
    return Promise.reject(new Error('Service unavailable'));
  }

  // Return minimal shape expected by controller: product.product.price.amount
  return Promise.resolve({
    data: {
      product: {
        _id: productId,
        price: { amount: 10 },
      },
    },
  });
});
