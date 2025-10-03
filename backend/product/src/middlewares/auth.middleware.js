const jwt = require("jsonwebtoken");

function createAuthMiddleware(roles = ["user"]) {
  return async function authMiddleware(req, res, next) {
    try {
      const token =
        req.cookies?.token || req.header("Authorization")?.split(" ")[1];
         // microservices m token cookies k andar bhi a sakta hai or headers k andar bhi
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  };
}

module.exports = createAuthMiddleware;
