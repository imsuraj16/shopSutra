# Cart Service Testing

## Overview
This document describes the test setup and how to add/enable tests for the `POST /api/cart/items` endpoint.

## Stack
- Jest (test runner)
- Supertest (HTTP assertions against Express app)
- mongodb-memory-server (ephemeral MongoDB for isolated tests)

## File Structure
```
/tests
  /integration
    cart.post.items.test.js   # Integration tests for POST /api/cart/items
  /setup
    jest.setup.js             # Global Jest hooks & in-memory Mongo
  /utils
    testClient.js             # Supertest app factory
TESTING.md
```

## Scripts
Run full test suite:
```
npm test
```
Watch mode:
```
npm run test:watch
```
Coverage report:
```
npm run test:coverage
```

## Global Helpers
`global.signJwt(payload)` - creates a signed JWT using `process.env.JWT_SECRET` (defaulted in test env). Use to authenticate requests.

## Enabling Validation Tests
Currently the route does not include validation middleware. To make the 400 validation tests pass, modify `src/routes/cart.routes.js`:
```
router.post('/items', createAuthMiddleware(['user']), cartValidationRules, addItemToCart);
```

## Implementing Controller Expectations
Unskip success tests after implementing logic in `addItemToCart` controller:
1. Extract `userId` from `req.user._id`.
2. Validate each product by optionally calling product service (mock with axios in tests if needed).
3. Find existing cart: `let cart = await cartModel.findOne({ user: userId });`
4. If not found, create new cart setting `items` from payload mapping to schema fields: `{ productId: item.product, quantity: item.quantity }`.
5. If found, for each incoming item:
   - If product already exists in cart, increment quantity.
   - Else push new item.
6. Recalculate `totalPrice` (if product prices available) or leave for later.
7. Save and respond:
   - New cart: 201
   - Updated cart: 200
   - Body shape suggestion:
```
{
  "message": "Cart created" | "Cart updated",
  "data": cart
}
```

## Mocking External Product Service
If controller uses `axios.get('http://product-service/products/:id')`:
```
jest.mock('axios');
const axios = require('axios');
axios.get.mockResolvedValue({ data: { _id: productId, price: 100 } });
```
For not found case:
```
axios.get.mockRejectedValue({ response: { status: 404 } });
```

## Adding More Tests
Edge cases to consider:
- Large quantity additions causing integer overflow (validate upper bounds)
- Multiple different items in one payload
- Duplicate items in payload (aggregate before persistence)
- Race conditions (future: use transactions or findOneAndUpdate with atomic operators)

## Troubleshooting
- If tests hang: ensure nothing else is bound to port; we test the app directly, not the server listener.
- If Mongo fails to start: delete cached binaries `rm -rf ~/.cache/mongodb-binaries` and re-run.
- Ensure `process.env.JWT_SECRET` is defined (jest.setup sets a default).

## Next Steps
- Add unit tests for auth middleware separately.
- Add performance tests for cart merge logic if cart can become large.
- Add contract tests once product service API stabilizes.
