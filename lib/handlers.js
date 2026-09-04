const bcrypt = require("bcryptjs");
const { sendJson, getJsonBody } = require("./http");
const { signUser, readUserFromRequest } = require("./auth");
const store = require("./store");

function normalizeUsername(value) {
  return String(value || "").trim();
}

function validateUsername(username) {
  if (username.length < 3) return "Use pelo menos 3 caracteres no usuário.";
  if (username.length > 32) return "Usuário muito longo.";
  if (!/^[\p{L}0-9._\-\s]+$/u.test(username)) {
    return "Use letras, números, ponto, hífen ou underline.";
  }
  return "";
}

function validatePassword(password) {
  if (String(password || "").length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  return "";
}

async function handleRegister(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  try {
    const body = await getJsonBody(req);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const userError = validateUsername(username);
    const passError = validatePassword(password);
    if (userError) return sendJson(res, 400, { message: userError });
    if (passError) return sendJson(res, 400, { message: passError });

    const existing = await store.findUserByUsername(username);
    if (existing) {
      return sendJson(res, 409, { message: "Esse usuário já existe. Tente entrar." });
    }

    const user = await store.createUser(username, bcrypt.hashSync(password, 10));
    return sendJson(res, 201, {
      token: signUser(user),
      username: user.username,
    });
  } catch (error) {
    console.error("Register failed:", error);
    return sendJson(res, 500, { message: error.message || "Não foi possível criar a conta." });
  }
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  try {
    const body = await getJsonBody(req);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    if (!username || !password) {
      return sendJson(res, 400, { message: "Informe usuário e senha." });
    }

    const user = await store.findUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return sendJson(res, 401, { message: "Usuário ou senha inválidos." });
    }

    return sendJson(res, 200, {
      token: signUser(user),
      username: user.username,
    });
  } catch (error) {
    return sendJson(res, 500, { message: "Não foi possível entrar." });
  }
}

async function handleVerify(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  const user = readUserFromRequest(req);
  if (!user || !user.userId) {
    return sendJson(res, 401, { message: "Sessão inválida." });
  }

  return sendJson(res, 200, {
    ok: true,
    username: user.username,
    userId: user.userId,
  });
}

async function handleHistory(req, res) {
  const user = readUserFromRequest(req);
  if (!user || !user.userId) {
    return sendJson(res, 401, { message: "Faça login para continuar." });
  }

  try {
    if (req.method === "GET") {
      const history = await store.listHistory(user.userId);
      return sendJson(res, 200, { history });
    }

    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const entry = await store.addHistory(user.userId, body);
      return sendJson(res, 201, { entry });
    }

    if (req.method === "PUT") {
      const body = await getJsonBody(req);
      const history = await store.replaceHistory(user.userId, body.history || []);
      return sendJson(res, 200, { history });
    }

    return sendJson(res, 405, { message: "Método não permitido." });
  } catch (error) {
    return sendJson(res, 500, { message: "Não foi possível salvar o histórico." });
  }
}

module.exports = {
  handleRegister,
  handleLogin,
  handleVerify,
  handleHistory,
};
