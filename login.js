const LOGIN_TOKEN_KEY = "posVendaToken";

const form = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const userError = document.querySelector("#userError");
const passError = document.querySelector("#passError");
const loginError = document.querySelector("#loginError");

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
  const safeUser = usernameInput.value.trim();
  const safePass = passwordInput.value.trim();

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
    window.location.href = "/index.html";
  } catch (error) {
    loginError.textContent = "Erro ao conectar com o servidor.";
  }
}

form.addEventListener("submit", handleLogin);
