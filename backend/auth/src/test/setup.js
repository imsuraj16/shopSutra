require('dotenv').config({path : "../../.env"})
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key';
}
// Ensure any Redis usage during tests does not touch production by mocking ioredis
// Jest will automatically use src/__mocks__/ioredis.js
jest.mock('ioredis');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri; // our db module reads this
  await mongoose.connect(uri, { autoIndex: true });
});

beforeEach(async () => {
  // Clean all collections
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) await mongo.stop();
  await mongoose.connection.close();
});
