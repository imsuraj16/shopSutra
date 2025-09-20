# Testing Guide

This backend uses **Jest**, **Supertest**, and **mongodb-memory-server** to run isolated tests without touching the real MongoDB instance.

## What is covered
Currently, there are tests for the `/auth/register` endpoint:
- Successful user registration
- Duplicate email rejection
- Missing required fields validation

## How it works
`mongodb-memory-server` spins up an ephemeral in-memory MongoDB instance for the duration of the Jest test run. Collections are wiped between tests to ensure isolation.

The Jest config (inline in `package.json`) points `setupFilesAfterEnv` to `src/test/setup.js`, which:
1. Starts the in-memory MongoDB
2. Sets `process.env.MONGO_URI` to the generated URI
3. Connects Mongoose
4. Cleans collections before each test
5. Stops the server and closes the connection after all tests

## Running tests
From the `backend` directory run:

```bash
npm test
```

## Adding more tests
Place test files under `src/__tests__/` (e.g. `src/__tests__/feature/feature.test.js`). Ensure you:
- Use `request(app)` from Supertest
- Seed any necessary data inside the test or a `beforeEach`

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| Tests hang after completion | Ensure no stray open handles (avoid starting real server with `app.listen` in tests). |
| Duplicate key errors unexpectedly | A previous test leaked data; confirm collections are cleared in `beforeEach`. |
| Connection errors | Make sure you are not overriding `process.env.MONGO_URI` in tests. |

## Future Improvements
- Add password hashing (e.g. bcrypt) and adjust tests accordingly
- Add more validation and negative tests
- Add coverage reporting: `"test:coverage": "jest --coverage"`
