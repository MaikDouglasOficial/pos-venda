const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function getJsonBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const { ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD || !JWT_SECRET) {
    res.statusCode = 500;
    res.json({ message: "Missing environment variables." });
    return;
  }

  try {
    const body = await getJsonBody(req);
    const { username, password } = body;

    if (!username || !password) {
      res.statusCode = 400;
      res.json({ message: "Missing credentials." });
      return;
    }

    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    const isUserValid = username === ADMIN_USER;
    const isPasswordValid = bcrypt.compareSync(password, passwordHash);

    if (!isUserValid || !isPasswordValid) {
      res.statusCode = 401;
      res.json({ message: "Invalid credentials." });
      return;
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });
    res.statusCode = 200;
    res.json({ token });
  } catch (error) {
    res.statusCode = 500;
    res.json({ message: "Failed to process login." });
  }
};
