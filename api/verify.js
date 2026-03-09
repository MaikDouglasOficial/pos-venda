const jwt = require("jsonwebtoken");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    res.statusCode = 500;
    res.json({ message: "Missing environment variables." });
    return;
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.statusCode = 401;
    res.json({ message: "Missing token." });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    res.statusCode = 200;
    res.json({ ok: true });
  } catch (error) {
    res.statusCode = 401;
    res.json({ message: "Invalid token." });
  }
};
