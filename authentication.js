const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

module.exports = authenticateToken; 