const DEFAULT_MESSAGE =
  "Passando para agradecer pela sua compra! 🎉\nFoi um prazer atender você.\n\nEstou sempre à disposição! 🤝\n\nMaik Douglas\nLOJAS NOSSO LAR PARAÍSO\n\nSalve meu contato 📲 para receber nossas promoções!";
const STORAGE_KEY = "posVendaHistory";
const DEFAULT_MESSAGE_KEY = "posVendaDefaultMessage";
const HISTORY_LIMIT = 10;
const AUTH_TOKEN_KEY = "posVendaToken";
const HISTORY_PAGE_SIZE = 10;

const form = document.querySelector("#messageForm");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const messageInput = document.querySelector("#message");
const nameError = document.querySelector("#nameError");
const phoneError = document.querySelector("#phoneError");
const copyBtn = document.querySelector("#copyBtn");
const historyList = document.querySelector("#historyList");
const historyDateInput = document.querySelector("#historyDate");
const historyPagination = document.querySelector("#historyPagination");
const logoutBtn = document.querySelector("#logoutBtn");
const toggleMessage = document.querySelector("#toggleMessage");
const messageField = messageInput.closest(".field");
const loggedUser = document.querySelector("#loggedUser");
const saveMessageBtn = document.querySelector("#saveMessageBtn");

let userEditedMessage = false;
let currentHistoryPage = 1;

async function ensureAuthenticated() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const username = getUsernameFromToken(token);
  if (loggedUser && username) {
    loggedUser.textContent = username;
  }

  try {
    const response = await fetch("/api/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = "/login.html";
    }
  } catch (error) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = "/login.html";
  }
}

function getUsernameFromToken(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const data = JSON.parse(decoded);
    return data.username || "";
  } catch (error) {
    return "";
  }
}

function buildMessage(name) {
  const safeName = name.trim();
  const greeting = safeName ? `Olá, ${safeName}!` : "Olá";
  const template = localStorage.getItem(DEFAULT_MESSAGE_KEY) || DEFAULT_MESSAGE;
  if (template.includes("[NOME_DO_CLIENTE]")) {
    const filled = template
      .replace("[NOME_DO_CLIENTE]", safeName || "")
      .replace("Olá, !", "Olá");
    return dedupeGreeting(filled);
  }
  const trimmedTemplate = template.trim();
  if (/^olá\b/i.test(trimmedTemplate)) {
    return dedupeGreeting(template);
  }
  return dedupeGreeting(`${greeting}\n\n${template}`);
}

function dedupeGreeting(message) {
  const lines = message.split(/\r?\n/);
  let firstIndex = -1;
  let secondIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim()) {
      if (firstIndex === -1) {
        firstIndex = i;
      } else {
        secondIndex = i;
        break;
      }
    }
  }

  if (
    firstIndex !== -1 &&
    secondIndex !== -1 &&
    /^olá\b/i.test(lines[firstIndex].trim()) &&
    /^olá\b/i.test(lines[secondIndex].trim())
  ) {
    lines.splice(secondIndex, 1);
  }

  return lines.join("\n");
}

function setMessageIfNotEdited(name) {
  if (!userEditedMessage) {
    messageInput.value = buildMessage(name);
  }
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getPhoneDigits() {
  return phoneInput.value.replace(/\D/g, "");
}

function validateName() {
  nameError.textContent = "";
  return true;
}

function validatePhone() {
  const digits = getPhoneDigits();
  if (digits.length !== 11) {
    phoneError.textContent = "Informe um telefone valido com DDD.";
    return false;
  }
  phoneError.textContent = "";
  return true;
}

function validateForm() {
  const isPhoneValid = validatePhone();
  validateName();
  return isPhoneValid;
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, HISTORY_LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  renderHistory();
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function renderHistory() {
  const history = loadHistory();
  const selectedDate = historyDateInput.value;
  const filtered = selectedDate
    ? history.filter((item) => item.dateISO && item.dateISO.startsWith(selectedDate))
    : history;
  historyList.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
  if (currentHistoryPage > totalPages) {
    currentHistoryPage = totalPages;
  }
  const startIndex = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);

  if (pageItems.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.textContent = selectedDate
      ? "Nenhuma mensagem encontrada para esta data."
      : "Sem atendimentos registrados ainda.";
    historyList.appendChild(empty);
    renderPagination(0);
    return;
  }

  pageItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = `${item.name} - ${item.phone}`;

    const date = document.createElement("span");
    date.textContent = item.date;

    const message = document.createElement("p");
    message.textContent = item.message;

    li.appendChild(title);
    li.appendChild(date);
    li.appendChild(message);
    historyList.appendChild(li);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  historyPagination.innerHTML = "";
  if (totalPages <= 1) return;

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-btn";
    if (page === currentHistoryPage) {
      button.classList.add("active");
    }
    button.textContent = String(page);
    button.addEventListener("click", () => {
      currentHistoryPage = page;
      renderHistory();
    });
    historyPagination.appendChild(button);
  }
}

function handleCopy() {
  if (!validateForm()) return;
  navigator.clipboard.writeText(messageInput.value.trim());
}

function handleSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const name = nameInput.value.trim();
  const phoneDigits = getPhoneDigits();
  const message = messageInput.value.trim();
  const encodedMessage = encodeURIComponent(message.normalize("NFC"));
  const url = `https://api.whatsapp.com/send?phone=55${phoneDigits}&text=${encodedMessage}`;

  saveHistory({
    name,
    phone: phoneInput.value.trim(),
    message,
    date: new Date().toLocaleString("pt-BR"),
    dateISO: new Date().toISOString(),
  });

  window.open(url, "_blank", "noopener,noreferrer");
}

nameInput.addEventListener("input", () => {
  validateName();
  setMessageIfNotEdited(nameInput.value);
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);
  phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
  validatePhone();
});

messageInput.addEventListener("input", () => {
  userEditedMessage = true;
});

toggleMessage.addEventListener("change", () => {
  const shouldShow = toggleMessage.checked;
  messageField.classList.toggle("hidden", !shouldShow);
  messageInput.disabled = !shouldShow;
  if (!shouldShow) {
    userEditedMessage = false;
    setMessageIfNotEdited(nameInput.value);
  }
});

saveMessageBtn.addEventListener("click", () => {
  const nextTemplate = messageInput.value.trim();
  if (!nextTemplate) return;
  localStorage.setItem(DEFAULT_MESSAGE_KEY, nextTemplate);
  userEditedMessage = false;
  setMessageIfNotEdited(nameInput.value);
  toggleMessage.checked = false;
  messageField.classList.add("hidden");
  messageInput.disabled = true;
});

copyBtn.addEventListener("click", handleCopy);
form.addEventListener("submit", handleSubmit);
historyDateInput.addEventListener("change", renderHistory);
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = "/login.html";
});

ensureAuthenticated();
if (historyDateInput && !historyDateInput.value) {
  historyDateInput.value = new Date().toISOString().slice(0, 10);
}
messageField.classList.add("hidden");
messageInput.disabled = true;
setMessageIfNotEdited("");
renderHistory();
