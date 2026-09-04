const DEFAULT_MESSAGE =
  "Passando para agradecer pela sua compra! 🎉\nFoi um prazer atender você.\n\nEstou sempre à disposição! 🤝\n\nMaik Douglas\nLOJAS NOSSO LAR PARAÍSO\n\nSalve meu contato 📲 para receber nossas promoções!";
const DEFAULT_REOFFER_MESSAGE =
  "Lembrei de você! 😊\nVocê comprou [PRODUTO] com a gente e queria te avisar que temos novidades e condições especiais.\n\nSe quiser, posso te mostrar as opções.\n\nMaik Douglas\nLOJAS NOSSO LAR PARAÍSO\n\nSalve meu contato 📲 para receber nossas promoções!";
const DEFAULT_REOFFER_NO_PRODUCT =
  "Lembrei de você! 😊\nPassando para te avisar que temos novidades e condições especiais.\n\nSe quiser, posso te mostrar as opções.\n\nMaik Douglas\nLOJAS NOSSO LAR PARAÍSO\n\nSalve meu contato 📲 para receber nossas promoções!";
const STORAGE_KEY = "posVendaHistory";
const DEFAULT_MESSAGE_KEY = "posVendaDefaultMessage";
const AUTH_TOKEN_KEY = "posVendaToken";
const LOCAL_AUTH_KEY = "posVendaAuthMode";
const LOCAL_USER_KEY = "posVendaLocalUser";
const HISTORY_PAGE_SIZE = 10;

const form = document.querySelector("#messageForm");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const productInput = document.querySelector("#product");
const productSuggestions = document.querySelector("#productSuggestions");
const messageInput = document.querySelector("#message");
const nameError = document.querySelector("#nameError");
const phoneError = document.querySelector("#phoneError");
const copyBtn = document.querySelector("#copyBtn");
const historyList = document.querySelector("#historyList");
const historySearchInput = document.querySelector("#historySearch");
const historyDateInput = document.querySelector("#historyDate");
const historyPagination = document.querySelector("#historyPagination");
const logoutBtn = document.querySelector("#logoutBtn");
const toggleMessage = document.querySelector("#toggleMessage");
const messageField = messageInput.closest(".field");
const loggedUser = document.querySelector("#loggedUser");
const saveMessageBtn = document.querySelector("#saveMessageBtn");
const toast = document.querySelector("#toast");
const exportHistoryBtn = document.querySelector("#exportHistoryBtn");
const importHistoryInput = document.querySelector("#importHistoryInput");
const tabClients = document.querySelector("#tabClients");
const tabMessages = document.querySelector("#tabMessages");
const appContent = document.querySelector("#appContent");
const navCompose = document.querySelector("#navCompose");
const navClients = document.querySelector("#navClients");

let userEditedMessage = false;
let currentHistoryPage = 1;
let currentView = "clients";
let messageMode = "thanks";
let toastTimeout;

async function ensureAuthenticated() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.href = "/login.html";
    return false;
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
      return false;
    }

    const data = await response.json().catch(() => ({}));
    if (loggedUser && data.username) {
      loggedUser.textContent = data.username;
    }
    await syncHistoryFromServer();
    return true;
  } catch (error) {
    await syncHistoryFromServer();
    return true;
  }
}

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ""}`,
    "Content-Type": "application/json",
  };
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

function getActiveTemplate() {
  if (messageMode === "reoffer") {
    const product = productInput.value.trim();
    return product ? DEFAULT_REOFFER_MESSAGE : DEFAULT_REOFFER_NO_PRODUCT;
  }
  return localStorage.getItem(DEFAULT_MESSAGE_KEY) || DEFAULT_MESSAGE;
}

function buildMessage(name) {
  const safeName = name.trim();
  const greeting = safeName ? `Olá, ${safeName}!` : "Olá";
  const template = getActiveTemplate();
  const filledTemplate = applyPlaceholders(template, safeName, productInput.value.trim());
  const trimmedTemplate = filledTemplate.trim();
  if (templateHasGreeting(trimmedTemplate)) {
    const withName = applyGreetingName(trimmedTemplate, safeName);
    return dedupeGreeting(withName);
  }
  return dedupeGreeting(`${greeting}\n\n${filledTemplate}`);
}

function applyPlaceholders(template, safeName, product) {
  let text = template;
  if (safeName) {
    text = text
      .replaceAll("[NOME_DO_CLIENTE]", safeName)
      .replaceAll("[NOME]", safeName)
      .replaceAll("{{NOME}}", safeName)
      .replace("Olá, !", "Olá");
  }
  if (product) {
    text = text.replaceAll("[PRODUTO]", product).replaceAll("{{PRODUTO}}", product);
  } else {
    text = text.replaceAll("[PRODUTO]", "seu último produto").replaceAll("{{PRODUTO}}", "seu último produto");
  }
  return text;
}

function applyGreetingName(template, safeName) {
  if (!safeName) return template;
  const lines = template.split(/\r?\n/);
  const firstIndex = lines.findIndex((line) => line.trim());
  if (firstIndex === -1) return template;

  const firstLine = lines[firstIndex];
  if (!startsWithGreeting(firstLine)) return template;

  const normalizedName = safeName.toLowerCase();
  if (firstLine.toLowerCase().includes(normalizedName)) {
    return template;
  }

  const match = firstLine.match(/^[^a-z0-9]*ol[áa][,!:;\s-]*/i);
  if (!match) return template;
  const rest = firstLine.slice(match[0].length).trimStart();
  lines[firstIndex] = `Olá, ${safeName}!${rest ? " " + rest : ""}`;
  return lines.join("\n");
}

function templateHasGreeting(text) {
  return startsWithGreeting(text);
}

function startsWithGreeting(text) {
  const normalized = text
    .trimStart()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.startsWith("ola");
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
    startsWithGreeting(lines[firstIndex]) &&
    startsWithGreeting(lines[secondIndex])
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

function getPhoneDigits(value = phoneInput.value) {
  return String(value || "").replace(/\D/g, "");
}

function validateName() {
  const value = nameInput.value.trim();
  if (!value) {
    setInputError(nameInput, nameError, "Informe o nome do cliente.");
    return false;
  }
  if (value.length < 2) {
    setInputError(nameInput, nameError, "Nome muito curto.");
    return false;
  }
  clearInputError(nameInput, nameError);
  return true;
}

function validatePhone() {
  const digits = getPhoneDigits();
  if (digits.length !== 11) {
    setInputError(phoneInput, phoneError, "Informe um telefone válido com DDD.");
    return false;
  }
  clearInputError(phoneInput, phoneError);
  return true;
}

function validateForm() {
  const isNameValid = validateName();
  const isPhoneValid = validatePhone();
  if (!isNameValid) {
    nameInput.focus();
    return false;
  }
  if (!isPhoneValid) {
    phoneInput.focus();
    return false;
  }
  return true;
}

function setInputError(input, errorElement, message) {
  const field = input.closest(".field");
  if (field) {
    field.classList.add("has-error");
  }
  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
}

function clearInputError(input, errorElement) {
  const field = input.closest(".field");
  if (field) {
    field.classList.remove("has-error");
  }
  input.removeAttribute("aria-invalid");
  errorElement.textContent = "";
}

function showToast(message, variant = "success") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("success", "error", "show");
  toast.classList.add(variant, "show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  persistHistory(history);
  currentHistoryPage = 1;
  renderHistory();
  refreshProductSuggestions();
  fetch("/api/history", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(entry),
  }).catch(() => {
    showToast("Cliente salvo neste aparelho. Sem conexão com o servidor.", "error");
  });
}

async function syncHistoryFromServer() {
  try {
    const response = await fetch("/api/history", { headers: authHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    const remote = Array.isArray(data.history) ? data.history.map(normalizeHistoryItem) : [];
    const local = loadHistory();
    if (remote.length === 0 && local.length > 0) {
      await fetch("/api/history", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ history: local }),
      });
      return;
    }
    persistHistory(remote);
  } catch (error) {
    // Mantém o histórico local se o servidor estiver offline.
  }
}

function persistHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHistoryItem);
  } catch (error) {
    return [];
  }
}

function normalizeHistoryItem(item) {
  const phone = item.phone || "";
  return {
    id: item.id || createHistoryId(),
    name: item.name || "",
    phone,
    phoneDigits: item.phoneDigits || getPhoneDigits(phone),
    product: item.product || "",
    message: item.message || "",
    date: item.date || "",
    dateISO: item.dateISO || "",
  };
}

function matchesSearch(item, query) {
  if (!query) return true;
  const haystack = [item.name, item.phone, item.phoneDigits, item.product, item.message]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function getFilteredHistory() {
  const history = loadHistory();
  const selectedDate = historyDateInput.value;
  const query = historySearchInput.value.trim().toLowerCase();
  return history.filter((item) => {
    const matchesDate = selectedDate ? item.dateISO && item.dateISO.startsWith(selectedDate) : true;
    return matchesDate && matchesSearch(item, query);
  });
}

function getClients(history) {
  const clients = new Map();
  history.forEach((item) => {
    const digits = item.phoneDigits || getPhoneDigits(item.phone);
    if (!digits) return;
    const existing = clients.get(digits);
    if (!existing) {
      clients.set(digits, { ...item, phoneDigits: digits, count: 1 });
      return;
    }
    existing.count += 1;
    if (!existing.product && item.product) {
      existing.product = item.product;
    }
  });
  return Array.from(clients.values());
}

function renderHistory() {
  const filtered = getFilteredHistory();
  const items = currentView === "clients" ? getClients(filtered) : filtered;
  historyList.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(items.length / HISTORY_PAGE_SIZE));
  if (currentHistoryPage > totalPages) {
    currentHistoryPage = totalPages;
  }
  const startIndex = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const pageItems = items.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);

  if (pageItems.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item empty";
    empty.innerHTML = `<span class="empty-mark">💬</span><span></span>`;
    empty.querySelector("span:last-child").textContent = getEmptyHistoryMessage(filtered.length === 0);
    historyList.appendChild(empty);
    renderPagination(0);
    return;
  }

  pageItems.forEach((item) => {
    historyList.appendChild(currentView === "clients" ? createClientItem(item) : createMessageItem(item));
  });

  renderPagination(totalPages);
}

function getEmptyHistoryMessage(noRecords) {
  if (noRecords && !historySearchInput.value && !historyDateInput.value) {
    return currentView === "clients"
      ? "Nenhum cliente salvo ainda. Envie um pós-venda para começar."
      : "Sem atendimentos registrados ainda.";
  }
  return "Nenhum resultado para essa busca.";
}

function createClientItem(item) {
  const li = document.createElement("li");
  li.className = "history-item client-item";

  const avatar = document.createElement("span");
  avatar.className = "client-avatar";
  avatar.textContent = getInitial(item.name);

  const body = document.createElement("div");
  body.className = "client-body";

  const title = document.createElement("strong");
  title.textContent = item.name;

  const phone = document.createElement("span");
  phone.className = "history-meta";
  phone.textContent = item.phone;

  const product = document.createElement("span");
  product.className = "chip";
  product.textContent = item.product || "Produto não informado";

  const details = document.createElement("span");
  details.textContent = `${item.count} ${item.count === 1 ? "atendimento" : "atendimentos"} · ${item.date}`;

  body.append(title, phone, product, details);

  const actions = document.createElement("div");
  actions.className = "history-item-actions";

  const reofferBtn = document.createElement("button");
  reofferBtn.type = "button";
  reofferBtn.className = "btn primary compact";
  reofferBtn.textContent = "Reofertar";
  reofferBtn.addEventListener("click", () => fillFormForReoffer(item));

  actions.appendChild(reofferBtn);
  li.append(avatar, body, actions);
  return li;
}

function getInitial(name) {
  const safe = String(name || "").trim();
  return safe ? safe.charAt(0).toUpperCase() : "?";
}

function createMessageItem(item) {
  const li = document.createElement("li");
  li.className = "history-item";

  const title = document.createElement("strong");
  title.textContent = `${item.name} - ${item.phone}`;

  const date = document.createElement("span");
  date.textContent = item.date;

  if (item.product) {
    const product = document.createElement("span");
    product.className = "history-product";
    product.textContent = `Produto: ${item.product}`;
    li.appendChild(title);
    li.appendChild(date);
    li.appendChild(product);
  } else {
    li.appendChild(title);
    li.appendChild(date);
  }

  const message = document.createElement("p");
  message.textContent = item.message;

  const actions = document.createElement("div");
  actions.className = "history-item-actions";

  const reofferBtn = document.createElement("button");
  reofferBtn.type = "button";
  reofferBtn.className = "btn primary compact";
  reofferBtn.textContent = "Reofertar";
  reofferBtn.addEventListener("click", () => fillFormForReoffer(item));
  actions.appendChild(reofferBtn);

  li.appendChild(message);
  li.appendChild(actions);
  return li;
}

function fillFormForReoffer(item) {
  messageMode = "reoffer";
  userEditedMessage = false;
  nameInput.value = item.name || "";
  phoneInput.value = formatPhone(item.phone || item.phoneDigits || "");
  productInput.value = item.product || "";
  clearInputError(nameInput, nameError);
  clearInputError(phoneInput, phoneError);
  toggleMessage.checked = true;
  messageField.classList.remove("hidden");
  messageInput.disabled = false;
  setMessageIfNotEdited(nameInput.value);
  setMobileView("compose");
  nameInput.focus();
  showToast("Cliente carregado. Revise a mensagem e envie.", "success");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setMobileView(view) {
  if (!appContent) return;
  appContent.dataset.mobileView = view;
  navCompose?.classList.toggle("active", view === "compose");
  navClients?.classList.toggle("active", view === "clients");
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

function setHistoryView(view) {
  currentView = view;
  currentHistoryPage = 1;
  tabClients.classList.toggle("active", view === "clients");
  tabMessages.classList.toggle("active", view === "messages");
  renderHistory();
}

function refreshProductSuggestions() {
  if (!productSuggestions) return;
  const products = [
    ...new Set(
      loadHistory()
        .map((item) => item.product.trim())
        .filter(Boolean)
    ),
  ].slice(0, 20);
  productSuggestions.innerHTML = "";
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product;
    productSuggestions.appendChild(option);
  });
}

function exportHistory() {
  const history = loadHistory();
  if (history.length === 0) {
    showToast("Não há histórico para exportar.", "error");
    return;
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    history,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `pos-venda-clientes-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Backup do histórico baixado.", "success");
}

function importHistory(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const imported = Array.isArray(parsed) ? parsed : parsed.history;
      if (!Array.isArray(imported) || imported.length === 0) {
        showToast("Arquivo sem clientes para importar.", "error");
        return;
      }
      const current = loadHistory();
      const seen = new Set(current.map(historyKey));
      const merged = [...current];
      imported.forEach((item) => {
        const normalized = normalizeHistoryItem(item);
        const key = historyKey(normalized);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(normalized);
      });
      merged.sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)));
      persistHistory(merged);
      currentHistoryPage = 1;
      renderHistory();
      refreshProductSuggestions();
      fetch("/api/history", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ history: merged }),
      }).catch(() => {});
      showToast("Histórico importado com sucesso!", "success");
    } catch (error) {
      showToast("Não foi possível ler esse arquivo.", "error");
    }
  };
  reader.readAsText(file);
}

function historyKey(item) {
  return [item.dateISO, item.phoneDigits, item.message].join("|");
}

async function handleCopy() {
  if (!validateForm()) {
    showToast("Corrija os campos destacados.", "error");
    return;
  }
  if (!navigator.clipboard?.writeText) {
    showToast("Seu navegador não permite copiar automaticamente.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(messageInput.value.trim());
    showToast("Mensagem copiada com sucesso!", "success");
  } catch (error) {
    showToast("Não foi possível copiar a mensagem.", "error");
  }
}

function handleSubmit(event) {
  event.preventDefault();
  if (!validateForm()) {
    showToast("Corrija os campos destacados.", "error");
    return;
  }

  const name = nameInput.value.trim();
  const phoneDigits = getPhoneDigits();
  const product = productInput.value.trim();
  const message = messageInput.value.trim();
  const encodedMessage = encodeURIComponent(message.normalize("NFC"));
  const url = `https://api.whatsapp.com/send?phone=55${phoneDigits}&text=${encodedMessage}`;

  saveHistory({
    id: createHistoryId(),
    name,
    phone: phoneInput.value.trim(),
    phoneDigits,
    product,
    message,
    date: new Date().toLocaleString("pt-BR"),
    dateISO: new Date().toISOString(),
  });

  window.open(url, "_blank", "noopener,noreferrer");
  showToast("Mensagem pronta no WhatsApp!", "success");
  resetFormAfterSubmit();
}

function resetFormAfterSubmit() {
  form.reset();
  nameInput.value = "";
  phoneInput.value = "";
  productInput.value = "";
  clearInputError(nameInput, nameError);
  clearInputError(phoneInput, phoneError);
  userEditedMessage = false;
  messageMode = "thanks";
  toggleMessage.checked = false;
  messageField.classList.add("hidden");
  messageInput.disabled = true;
  setMessageIfNotEdited("");
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

productInput.addEventListener("input", () => {
  if (messageMode === "reoffer") {
    setMessageIfNotEdited(nameInput.value);
  }
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
  messageMode = "thanks";
  setMessageIfNotEdited(nameInput.value);
  toggleMessage.checked = false;
  messageField.classList.add("hidden");
  messageInput.disabled = true;
  showToast("Mensagem padrão salva.", "success");
});

copyBtn.addEventListener("click", handleCopy);
form.addEventListener("submit", handleSubmit);
historyDateInput.addEventListener("change", () => {
  currentHistoryPage = 1;
  renderHistory();
});
historySearchInput.addEventListener("input", () => {
  currentHistoryPage = 1;
  renderHistory();
});
tabClients.addEventListener("click", () => setHistoryView("clients"));
tabMessages.addEventListener("click", () => setHistoryView("messages"));
navCompose?.addEventListener("click", () => setMobileView("compose"));
navClients?.addEventListener("click", () => setMobileView("clients"));
exportHistoryBtn.addEventListener("click", exportHistory);
importHistoryInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  importHistory(file);
  event.target.value = "";
});
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = "/login.html";
});

messageField.classList.add("hidden");
messageInput.disabled = true;
setMessageIfNotEdited("");
ensureAuthenticated().then((ok) => {
  if (!ok) return;
  refreshProductSuggestions();
  renderHistory();
});
