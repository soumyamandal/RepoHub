const jwt = require("jsonwebtoken");

// Verifies the "Authorization: Bearer <token>" header and sets req.userId
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required!" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = String(payload.id);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
}

module.exports = authMiddleware;
