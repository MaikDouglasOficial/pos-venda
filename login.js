const LOGIN_TOKEN_KEY = "posVendaToken";

const form = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const userError = document.querySelector("#userError");
const passError = document.querySelector("#passError");
const loginError = document.querySelector("#loginError");
const submitBtn = document.querySelector("#submitBtn");
const authSubtitle = document.querySelector("#authSubtitle");
const authAltBtn = document.querySelector("#authAltBtn");

let mode = "register";

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  submitBtn.textContent = isRegister ? "Criar acesso" : "Entrar";
  authSubtitle.textContent = isRegister
    ? "Crie seu usuário e senha para guardar os clientes."
    : "Entre para ver seus clientes salvos.";
  authAltBtn.textContent = isRegister
    ? "Já tem acesso? Entrar"
    : "Ainda não tem acesso? Criar agora";
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
  loginError.textContent = "";
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

async function handleSubmit(event) {
  event.preventDefault();
  loginError.textContent = "";

  const okUser = validateUsername();
  const okPass = validatePassword();
  if (!okUser || !okPass) return;

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
      loginError.textContent = "Não foi possível criar o acesso.";
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

authAltBtn.addEventListener("click", () => setMode(mode === "register" ? "login" : "register"));
form.addEventListener("submit", handleSubmit);
setMode("register");
