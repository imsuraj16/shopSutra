# Testing Guide for Product Backend

## Running Tests

Run all tests with:

```bash
npm test
```

This uses Jest and runs all files matching `src/__tests__/**/*.test.js`.

## Test Structure
- Tests are in `src/__tests__/`
- Mocks for external dependencies (auth, multer, imagekit) are in `src/__tests__/__mocks__`
- Fixtures (sample images) are in `src/__tests__/fixtures/`

## Debugging Failures
- If a test fails, check the error message and stack trace.
- You can add `console.log` in your test or source code to inspect request/response data.
- Common issues:
  - Multipart form fields not parsed: ensure real `multer` is used, not mocked.
  - Field names mismatch: validator expects nested fields (e.g., `price.amount`).
  - Auth issues: use the provided mock to bypass JWT and roles.

## Extending Tests
- Add new test files in `src/__tests__/product/` for product features.
- Use `supertest` to simulate HTTP requests.
- Use the existing mocks for external services.
- For new multipart fields, update the normalization middleware if needed.

## Example: Create Product Test
See `src/__tests__/product/create.test.js` for a sample test that:
- Sends a multipart POST request with fields and an image
- Asserts the response and product shape

## Environment
- Tests use an in-memory MongoDB (no real database needed)
- Secrets and keys are set in `src/test/setup.js` for isolation

## Tips
- Run a single test file:
  ```bash
  npx jest src/__tests__/product/create.test.js
  ```
- Use `.only` in a test block to focus on one test:
  ```js
  test.only('should ...', async () => { ... })
  ```

---
For more help, see the Jest docs: https://jestjs.io/docs/getting-started
