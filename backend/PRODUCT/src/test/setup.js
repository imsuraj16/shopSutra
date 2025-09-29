require('dotenv').config({ path: '../../.env' });

// Default secrets/keys for tests
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_jwt_secret_key';
if (!process.env.IMAGEKIT_PUBLIC_KEY) process.env.IMAGEKIT_PUBLIC_KEY = 'test_public_key';
if (!process.env.IMAGEKIT_PRIVATE_KEY) process.env.IMAGEKIT_PRIVATE_KEY = 'test_private_key';
if (!process.env.IMAGEKIT_ENDPOINT) process.env.IMAGEKIT_ENDPOINT = 'https://test.imagekit.io/test';

// Mocks: we won't hit real external services in tests
// Use real multer to parse multipart/form-data; mock imagekit to avoid network
jest.unmock('multer');
jest.mock('imagekit');
// Mock auth middleware to bypass JWT and role checks
jest.mock('../middlewares/auth.middleware', () => require('../__tests__/__mocks__/auth.middleware.js'));

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri; // used by db module
  await mongoose.connect(uri, { autoIndex: true });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) await mongo.stop();
  await mongoose.connection.close();
});
