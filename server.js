const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_USER || !ADMIN_PASSWORD || !JWT_SECRET) {
  console.error("Missing environment variables. Check .env file.");
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials." });
  }

  const isUserValid = username === ADMIN_USER;
  const isPasswordValid = bcrypt.compareSync(password, passwordHash);

  if (!isUserValid || !isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
});

app.get("/api/verify", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token." });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
