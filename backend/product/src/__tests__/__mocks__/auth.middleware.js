// factory function mock
function createAuthMiddleware(roles = []) {
  return (req, res, next) => {
    // bypass JWT, always authorize
    req.user = { id: '507f1f77bcf86cd799439011', role: 'seller' };
    next();
  };
}

module.exports = createAuthMiddleware;
