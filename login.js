const LOGIN_TOKEN_KEY = "posVendaToken";

const form = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const confirmInput = document.querySelector("#confirmPassword");
const confirmField = document.querySelector("#confirmField");
const userError = document.querySelector("#userError");
const passError = document.querySelector("#passError");
const confirmError = document.querySelector("#confirmError");
const loginError = document.querySelector("#loginError");
const submitBtn = document.querySelector("#submitBtn");
const authSubtitle = document.querySelector("#authSubtitle");
const authAltBtn = document.querySelector("#authAltBtn");

let mode = "login";

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  confirmField.classList.toggle("hidden", !isRegister);
  submitBtn.textContent = isRegister ? "Criar acesso" : "Entrar";
  authSubtitle.textContent = isRegister
    ? "Crie seu usuário e senha para guardar os clientes."
    : "Entre para ver seus clientes salvos.";
  authAltBtn.textContent = isRegister
    ? "Já tem acesso? Entrar"
    : "Ainda não tem acesso? Criar agora";
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
  loginError.textContent = "";
  confirmError.textContent = "";
}

function validateUsername() {
  const value = usernameInput.value.trim();
  if (!value) {
    userError.textContent = "Informe o usuário.";
    return false;
  }
  if (value.length < 3) {
    userError.textContent = "Usuário muito curto.";
    return false;
  }
  userError.textContent = "";
  return true;
}

function validatePassword() {
  const value = passwordInput.value.trim();
  if (!value) {
    passError.textContent = "Informe a senha.";
    return false;
  }
  if (mode === "register" && value.length < 6) {
    passError.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    return false;
  }
  passError.textContent = "";
  return true;
}

function validateConfirm() {
  if (mode !== "register") {
    confirmError.textContent = "";
    return true;
  }
  if (!confirmInput.value.trim()) {
    confirmError.textContent = "Confirme a senha.";
    return false;
  }
  if (confirmInput.value.trim() !== passwordInput.value.trim()) {
    confirmError.textContent = "As senhas não coincidem.";
    return false;
  }
  confirmError.textContent = "";
  return true;
}

async function handleSubmit(event) {
  event.preventDefault();
  loginError.textContent = "";

  const okUser = validateUsername();
  const okPass = validatePassword();
  const okConfirm = validateConfirm();
  if (!okUser || !okPass || !okConfirm) return;

  const endpoint = mode === "register" ? "/api/register" : "/api/login";
  const idleLabel = mode === "register" ? "Criar acesso" : "Entrar";
  submitBtn.disabled = true;
  submitBtn.textContent = mode === "register" ? "Criando..." : "Entrando...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim(),
      }),
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      loginError.textContent = "O servidor não respondeu certo. Tente de novo.";
      return;
    }

    if (!response.ok) {
      loginError.textContent = data.message || "Não foi possível continuar.";
      return;
    }

    if (!data.token) {
      loginError.textContent = "Não foi possível continuar.";
      return;
    }

    localStorage.setItem(LOGIN_TOKEN_KEY, data.token);
    window.location.href = "/index.html";
  } catch (error) {
    loginError.textContent = "Erro ao conectar com o servidor.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = idleLabel;
  }
}

if (localStorage.getItem(LOGIN_TOKEN_KEY)) {
  window.location.href = "/index.html";
}

authAltBtn.addEventListener("click", () => setMode(mode === "register" ? "login" : "register"));
form.addEventListener("submit", handleSubmit);
setMode("login");
