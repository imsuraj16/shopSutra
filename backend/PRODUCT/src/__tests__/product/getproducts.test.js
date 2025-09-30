// src/__tests__/product/getProducts.test.js
const request = require('supertest');
const app = require('../../app'); // apne app ka path set kar

describe('GET /api/products - Catalog Listing', () => {

  // Basic fetch without query
  test('should return all products with default pagination', async () => {
    const res = await request(app).get('/api/products'); // prefix included
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  // Search query
  test('should return products matching search query', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ q: 'laptop' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(p => p.name.toLowerCase().includes('laptop'))).toBe(true);
  });

  // Filter by category
  test('should return products filtered by category', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ category: 'electronics' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(p => p.category === 'electronics')).toBe(true);
  });

  // Filter by price range
  test('should return products filtered by price range', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ minPrice: 1000, maxPrice: 5000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(p => p.price.amount >= 1000 && p.price.amount <= 5000)).toBe(true);
  });

  // Pagination
  test('should return paginated results', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ page: 2, limit: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  // Sorting
  test('should return products sorted by price descending', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ sortBy: 'price.amount', order: 'desc' });
    expect(res.statusCode).toBe(200);
    const prices = res.body.data.map(p => p.price.amount);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i - 1]).toBeGreaterThanOrEqual(prices[i]);
    }
  });

  // Combined query
  test('should handle combined query parameters', async () => {
    const res = await request(app)
      .get('/api/products')
      .query({ 
        q: 'phone', 
        category: 'electronics', 
        minPrice: 500, 
        maxPrice: 2000,
        page: 1,
        limit: 3,
        sortBy: 'name',
        order: 'asc'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    expect(res.body.data.every(p => p.category === 'electronics')).toBe(true);
    expect(res.body.data.every(p => p.name.toLowerCase().includes('phone'))).toBe(true);

    // Ascending check for name
    const names = res.body.data.map(p => p.name.toLowerCase());
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1] <= names[i]).toBe(true);
    }
  });
});
