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
  submitBtn.disabled = true;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      loginError.textContent = data.message || "Não foi possível continuar.";
      return;
    }

    localStorage.setItem(LOGIN_TOKEN_KEY, data.token);
    window.location.href = "/index.html";
  } catch (error) {
    loginError.textContent = "Erro ao conectar com o servidor.";
  } finally {
    submitBtn.disabled = false;
  }
}

authAltBtn.addEventListener("click", () => setMode(mode === "register" ? "login" : "register"));
form.addEventListener("submit", handleSubmit);
setMode("login");
