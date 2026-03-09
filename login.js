const LOGIN_TOKEN_KEY = "posVendaToken";
const LOCAL_AUTH_KEY = "posVendaAuthMode";
const LOCAL_USER_KEY = "posVendaLocalUser";
const LOCAL_PASS_KEY = "posVendaLocalPass";

const form = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const userError = document.querySelector("#userError");
const passError = document.querySelector("#passError");
const loginError = document.querySelector("#loginError");
const createUserBtn = document.querySelector("#createUserBtn");
const createHint = document.querySelector("#createHint");

function validateUsername() {
  if (!usernameInput.value.trim()) {
    userError.textContent = "Informe o usuario.";
    return false;
  }
  userError.textContent = "";
  return true;
}

function validatePassword() {
  if (!passwordInput.value.trim()) {
    passError.textContent = "Informe a senha.";
    return false;
  }
  passError.textContent = "";
  return true;
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";

  const isUserValid = validateUsername();
  const isPassValid = validatePassword();
  if (!isUserValid || !isPassValid) return;

  const localUser = localStorage.getItem(LOCAL_USER_KEY);
  const localPass = localStorage.getItem(LOCAL_PASS_KEY);
  const safeUser = usernameInput.value.trim();
  const safePass = passwordInput.value.trim();

  if (localUser && localPass) {
    if (safeUser === localUser && safePass === localPass) {
      localStorage.setItem(LOCAL_AUTH_KEY, "local");
      localStorage.setItem(LOGIN_TOKEN_KEY, "local");
      window.location.href = "/index.html";
      return;
    }
    loginError.textContent = "Usuario ou senha invalidos.";
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: safeUser,
        password: safePass,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      loginError.textContent = data.message || "Usuario ou senha invalidos.";
      return;
    }
    localStorage.setItem(LOGIN_TOKEN_KEY, data.token);
    localStorage.removeItem(LOCAL_AUTH_KEY);
    window.location.href = "/index.html";
  } catch (error) {
    loginError.textContent = "Erro ao conectar com o servidor.";
  }
}

function handleCreateUser() {
  loginError.textContent = "";
  const isUserValid = validateUsername();
  const isPassValid = validatePassword();
  if (!isUserValid || !isPassValid) return;

  const safeUser = usernameInput.value.trim();
  const safePass = passwordInput.value.trim();
  localStorage.setItem(LOCAL_USER_KEY, safeUser);
  localStorage.setItem(LOCAL_PASS_KEY, safePass);
  localStorage.setItem(LOCAL_AUTH_KEY, "local");
  localStorage.setItem(LOGIN_TOKEN_KEY, "local");
  window.location.href = "/index.html";
}

function toggleCreateUser() {
  const hasLocalUser =
    Boolean(localStorage.getItem(LOCAL_USER_KEY)) &&
    Boolean(localStorage.getItem(LOCAL_PASS_KEY));
  createUserBtn.style.display = hasLocalUser ? "none" : "inline-flex";
  createHint.style.display = hasLocalUser ? "none" : "block";
}

form.addEventListener("submit", handleLogin);
createUserBtn.addEventListener("click", handleCreateUser);
toggleCreateUser();
