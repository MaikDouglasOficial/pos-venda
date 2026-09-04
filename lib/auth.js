const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const secretPath = path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), ".jwtsecret");
  try {
    return fs.readFileSync(secretPath, "utf8").trim();
  } catch (error) {
    const generated = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      fs.mkdirSync(path.dirname(secretPath), { recursive: true });
      fs.writeFileSync(secretPath, generated);
    } catch (writeError) {
      return generated;
    }
    return generated;
  }
}

function signUser(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

function readUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

module.exports = { getJwtSecret, signUser, readUserFromRequest };
