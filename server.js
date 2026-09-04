const fs = require("fs");
const path = require("path");
const express = require("express");
require("dotenv").config();

const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const {
  handleLogin,
  handleRegister,
  handleVerify,
  handleHistory,
} = require("./lib/handlers");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", handleLogin);
app.post("/api/register", handleRegister);
app.get("/api/verify", handleVerify);
app.all("/api/history", handleHistory);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
