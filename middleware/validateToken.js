const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(400).json({ error: "User not authenticated" });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(400).json({ error: "User not authenticated" });
    }
    const valid_token = jwt.verify(token, process.env.JWT_SECRET);
    req.user = valid_token;
    if (valid_token) {
      next();
    }
  } catch (error) {
    return res.status(400).json({ error });
  }
};
module.exports = validateToken;
