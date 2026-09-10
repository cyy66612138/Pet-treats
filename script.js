const products = [
  { id: "pumpkin-bites", name: "鸡肉南瓜小方", meta: "狗狗 · 训练奖励", pet: "dog", category: "training", description: "鸡胸肉与南瓜的温柔搭配，小小一颗刚刚好。", price: 29, emoji: "🍪", color: "orange", badge: "人气款" },
  { id: "salmon-seaweed", name: "三文鱼海苔脆片", meta: "猫咪 · 日常奖励", pet: "cat", category: "daily", description: "鲜香三文鱼遇上海苔，轻轻一捏就碎的酥脆。", price: 32, emoji: "🐟", color: "green", badge: "猫咪最爱" },
  { id: "beef-dental", name: "原切牛肉洁齿棒", meta: "狗狗 · 洁齿护理", pet: "dog", category: "dental", description: "耐嚼的原切牛肉香，陪它慢慢磨掉小烦恼。", price: 36, emoji: "🥨", color: "tan", badge: "洁齿" },
  { id: "freeze-dried", name: "鸡胸肉冻干粒", meta: "狗狗 · 高蛋白", pet: "dog", category: "nutrition", description: "只用一味鸡胸肉，冻干锁住自然鲜香。", price: 45, emoji: "🍗", color: "yellow", badge: "纯肉配方" },
  { id: "mousse-bites", name: "鹅肝慕斯夹心", meta: "猫咪 · 软糯口感", pet: "cat", category: "soft", description: "细腻慕斯藏进小小夹心里，给挑剔的它。", price: 39, emoji: "🍓", color: "pink", badge: "新品" },
  { id: "goat-cheese", name: "山羊奶酪小骨", meta: "狗狗 · 洁齿护理", pet: "dog", category: "dental", description: "淡淡奶香的低负担小骨，适合午后慢慢啃。", price: 33, emoji: "🦴", color: "purple", badge: "低负担" },
];

const categoryOptions = {
  dog: [
    { id: "all", label: "全部食品" },
    { id: "training", label: "训练奖励" },
    { id: "dental", label: "洁齿护理" },
    { id: "nutrition", label: "高蛋白" },
  ],
  cat: [
    { id: "all", label: "全部食品" },
    { id: "daily", label: "日常奖励" },
    { id: "soft", label: "软糯口感" },
  ],
};

const cartStorageKey = "tail-treat-cart-v1";
const usersStorageKey = "tail-treat-users-v1";
const sessionStorageKey = "tail-treat-session-v1";
let activeFilter = { pet: "all", category: "all" };
let cart = loadCart();
let users = loadUsers();
let session = loadSession();
let authMode = "login";
let toastTimer;
let lastFocusedElement;
let pendingCheckout = false;

const productGrid = document.querySelector("#productGrid");
const noResults = document.querySelector("#noResults");
const petFilters = document.querySelector("#petFilters");
const categoryFilters = document.querySelector("#categoryFilters");
const accountTrigger = document.querySelector("#accountTrigger");
const accountLabel = document.querySelector("#accountLabel");
const cartCount = document.querySelector("#cartCount");
const cartTrigger = document.querySelector("#cartTrigger");
const cartDrawer = document.querySelector("#cartDrawer");
const cartOverlay = document.querySelector("#cartOverlay");
const cartClose = document.querySelector("#cartClose");
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartFooter = document.querySelector("#cartFooter");
const cartSubtotal = document.querySelector("#cartSubtotal");
const checkoutButton = document.querySelector("#checkoutButton");
const checkoutSuccess = document.querySelector("#checkoutSuccess");
const continueShopping = document.querySelector("#continueShopping");
const emptyCartLink = document.querySelector("#emptyCartLink");
const toast = document.querySelector("#toast");
const accountModal = document.querySelector("#accountModal");
const checkoutModal = document.querySelector("#checkoutModal");
const authView = document.querySelector("#authView");
const accountView = document.querySelector("#accountView");
const authForm = document.querySelector("#authForm");
const authName = document.querySelector("#authName");
const authPhone = document.querySelector("#authPhone");
const authPassword = document.querySelector("#authPassword");
const authError = document.querySelector("#authError");
const authHint = document.querySelector("#authHint");
const authSubmit = document.querySelector("#authSubmit");
const nameField = document.querySelector("#nameField");
const accountModalTitle = document.querySelector("#accountModalTitle");
const accountName = document.querySelector("#accountName");
const accountPhone = document.querySelector("#accountPhone");
const accountAddressStatus = document.querySelector("#accountAddressStatus");
const accountAddressForm = document.querySelector("#accountAddressForm");
const accountAddressError = document.querySelector("#accountAddressError");
const logoutButton = document.querySelector("#logoutButton");
const checkoutSummary = document.querySelector("#checkoutSummary");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutError = document.querySelector("#checkoutError");

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 私有模式下仍保留当前页状态 */ }
}

function loadCart() {
  const saved = readStorage(cartStorageKey, {});
  return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => products.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0));
}

function saveCart() { writeStorage(cartStorageKey, cart); }

function loadUsers() {
  const saved = readStorage(usersStorageKey, {});
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
}

function loadSession() {
  const saved = readStorage(sessionStorageKey, {});
  return saved && typeof saved.phone === "string" ? saved : null;
}

function saveUsers() { writeStorage(usersStorageKey, users); }

function saveSession() {
  if (session) writeStorage(sessionStorageKey, session);
  else {
    try { localStorage.removeItem(sessionStorageKey); } catch { /* 忽略不可用的本地存储 */ }
  }
}

function getCurrentUser() {
  return session?.phone && users[session.phone] ? users[session.phone] : null;
}

function formatPrice(value) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(value);
}

function getCartCount() {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function getCartTotal() {
  return products.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
}

function getVisibleProducts() {
  return products.filter((product) => {
    const petMatches = activeFilter.pet === "all" || product.pet === activeFilter.pet;
    const categoryMatches = activeFilter.category === "all" || product.category === activeFilter.category;
    return petMatches && categoryMatches;
  });
}

function renderFilters() {
  petFilters.querySelectorAll("[data-pet]").forEach((button) => {
    const isActive = button.dataset.pet === activeFilter.pet;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  const options = activeFilter.pet === "all" ? [{ id: "all", label: "全部食品" }] : categoryOptions[activeFilter.pet];
  categoryFilters.innerHTML = options.map((option) => `
    <button class="filter-button ${option.id === activeFilter.category ? "is-active" : ""}" type="button" data-category="${option.id}" role="tab" aria-selected="${option.id === activeFilter.category}">${option.label}</button>
  `).join("");
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-visual ${product.color}">
        <span class="product-badge">${product.badge}</span>
        <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
      </div>
      <div class="product-info">
        <div class="product-meta">${product.meta}</div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <strong class="price">${formatPrice(product.price)}</strong>
          <button class="add-button" type="button" data-add="${product.id}" aria-label="将${product.name}加入购物车">加入购物车 <span aria-hidden="true">＋</span></button>
        </div>
      </div>
    </article>
  `).join("");
  noResults.hidden = visibleProducts.length > 0;
}

function renderCart() {
  const entries = products.filter((product) => cart[product.id]);
  const count = getCartCount();
  cartCount.textContent = count;
  cartSubtotal.textContent = formatPrice(getCartTotal());
  checkoutButton.disabled = entries.length === 0;
  cartEmpty.hidden = entries.length !== 0;
  cartItems.hidden = entries.length === 0;
  cartFooter.hidden = entries.length === 0;
  checkoutSuccess.hidden = true;
  cartItems.innerHTML = entries.map((product) => `
    <div class="cart-line">
      <div class="cart-line-visual" aria-hidden="true">${product.emoji}</div>
      <div>
        <h3>${product.name}</h3>
        <small>${formatPrice(product.price)} / 份</small>
        <div class="quantity-control" aria-label="调整${product.name}数量">
          <button type="button" data-decrease="${product.id}" aria-label="减少${product.name}数量">−</button>
          <span>${cart[product.id]}</span>
          <button type="button" data-increase="${product.id}" aria-label="增加${product.name}数量">＋</button>
        </div>
        <button class="remove-button" type="button" data-remove="${product.id}">移除</button>
      </div>
      <strong class="cart-line-price">${formatPrice(product.price * cart[product.id])}</strong>
    </div>
  `).join("");
}

function renderAccountTrigger() {
  const user = getCurrentUser();
  accountLabel.textContent = user ? (user.name || `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`) : "登录/注册";
  accountTrigger.setAttribute("aria-label", user ? "打开个人中心" : "打开登录或个人中心");
}

function setValue(id, value = "") {
  const field = document.querySelector(`#${id}`);
  if (field) field.value = value;
}

function renderAddressFields(prefix, address) {
  setValue(`${prefix}Recipient`, address?.recipient);
  setValue(`${prefix}AddressPhone`, address?.phone);
  setValue(`${prefix}Region`, address?.region);
  setValue(`${prefix}Detail`, address?.detail);
}

function renderAccountView() {
  const user = getCurrentUser();
  if (!user) return;
  accountName.textContent = user.name || "尾巴朋友";
  accountPhone.textContent = `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`;
  accountAddressStatus.textContent = user.address ? "已保存" : "还没有地址";
  accountAddressStatus.classList.toggle("has-address", Boolean(user.address));
  renderAddressFields("account", user.address);
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  authView.hidden = false;
  accountView.hidden = true;
  nameField.hidden = !isRegister;
  authName.required = isRegister;
  authPassword.autocomplete = isRegister ? "new-password" : "current-password";
  authSubmit.innerHTML = `${isRegister ? "注册并登录" : "登录"} <span aria-hidden="true">→</span>`;
  authHint.textContent = isRegister ? "注册后即可保存收货地址，下次结算更方便。" : "登录后即可保存收货地址，下次结算更方便。";
  authError.hidden = true;
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    const isActive = button.dataset.authMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  accountModalTitle.textContent = isRegister ? "创建你的账号" : "登录尾巴食集";
}

function showAccountView() {
  authView.hidden = true;
  accountView.hidden = false;
  accountModalTitle.textContent = "我的尾巴食集";
  renderAccountView();
}

function validatePhone(value) {
  return /^1\d{10}$/.test(value);
}

function showFormError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

async function hashPassword(password) {
  try {
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(password);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* file:// 页面可能无法使用 Web Crypto，使用演示回退值 */ }
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `demo-${(hash >>> 0).toString(16)}`;
}

function getAddressFromForm(prefix) {
  return {
    recipient: document.querySelector(`#${prefix}Recipient`).value.trim(),
    phone: document.querySelector(`#${prefix}AddressPhone`).value.trim(),
    region: document.querySelector(`#${prefix}Region`).value.trim(),
    detail: document.querySelector(`#${prefix}Detail`).value.trim(),
    isDefault: true,
  };
}

function validateAddress(address) {
  if (!address.recipient || !address.phone || !address.region || !address.detail) return "请把收货信息填写完整。";
  if (!validatePhone(address.phone)) return "请输入正确的 11 位手机号。";
  return "";
}

function updateBodyScrollLock() {
  const modalOpen = [accountModal, checkoutModal].some((modal) => !modal.hidden);
  const cartOpen = cartDrawer.classList.contains("is-open");
  document.body.classList.toggle("no-scroll", modalOpen || cartOpen);
}

function openModal(modal) {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("is-visible"));
  updateBodyScrollLock();
  const focusTarget = modal.querySelector(".auth-view:not([hidden]) input, .account-view:not([hidden]) input, form:not([hidden]) input, button:not([data-close-modal])");
  focusTarget?.focus();
}

function closeModal(modal) {
  modal.classList.remove("is-visible");
  window.setTimeout(() => { modal.hidden = true; updateBodyScrollLock(); }, 220);
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
}

function openAccountModal() {
  const user = getCurrentUser();
  if (user) showAccountView();
  else setAuthMode("login");
  openModal(accountModal);
}

function renderCheckoutSummary() {
  const entries = products.filter((product) => cart[product.id]);
  checkoutSummary.innerHTML = `
    <div><span>${getCartCount()} 件小零食</span><strong>${formatPrice(getCartTotal())}</strong></div>
    <p>${entries.map((product) => `${product.name} × ${cart[product.id]}`).join("、")}</p>
  `;
}

function openCheckoutModal() {
  const user = getCurrentUser();
  if (!user || getCartCount() === 0) return;
  renderCheckoutSummary();
  renderAddressFields("checkout", user.address);
  showFormError(checkoutError, "");
  openModal(checkoutModal);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  showToast("已加入购物车，慢慢挑～");
}

function updateQuantity(id, change) {
  cart[id] = (cart[id] || 0) + change;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
  showToast("已从购物车移除");
}

function openCart() {
  cartOverlay.hidden = false;
  requestAnimationFrame(() => cartOverlay.classList.add("is-visible"));
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  updateBodyScrollLock();
  cartClose.focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.classList.remove("is-visible");
  updateBodyScrollLock();
  window.setTimeout(() => { cartOverlay.hidden = true; }, 300);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function showCheckoutSuccess() {
  cartItems.innerHTML = "";
  cartItems.hidden = true;
  cartEmpty.hidden = true;
  cartFooter.hidden = true;
  checkoutSuccess.hidden = false;
  cartCount.textContent = "0";
}

petFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pet]");
  if (!button) return;
  activeFilter = { pet: button.dataset.pet, category: "all" };
  renderFilters();
  renderProducts();
});

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeFilter.category = button.dataset.category;
  renderFilters();
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});

cartItems.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-increase]");
  const decrease = event.target.closest("[data-decrease]");
  const remove = event.target.closest("[data-remove]");
  if (increase) updateQuantity(increase.dataset.increase, 1);
  if (decrease) updateQuantity(decrease.dataset.decrease, -1);
  if (remove) removeFromCart(remove.dataset.remove);
});

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});

accountTrigger.addEventListener("click", openAccountModal);
cartTrigger.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.querySelector(`#${button.dataset.closeModal}`);
    if (modal) closeModal(modal);
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const phone = authPhone.value.trim();
  const password = authPassword.value;
  showFormError(authError, "");
  if (!validatePhone(phone)) {
    showFormError(authError, "请输入正确的 11 位手机号。");
    authPhone.focus();
    return;
  }
  if (password.length < 6) {
    showFormError(authError, "密码至少需要 6 位。");
    authPassword.focus();
    return;
  }
  const passwordHash = await hashPassword(password);
  if (authMode === "register") {
    const name = authName.value.trim();
    if (!name) {
      showFormError(authError, "请先填写怎么称呼你。");
      authName.focus();
      return;
    }
    if (users[phone]) {
      showFormError(authError, "这个手机号已经注册过了，请直接登录。");
      authPhone.focus();
      return;
    }
    users[phone] = { phone, passwordHash, name, address: null };
  } else if (!users[phone] || users[phone].passwordHash !== passwordHash) {
    showFormError(authError, "手机号或密码不正确，请再试一次。");
    return;
  }
  if (authMode === "register") saveUsers();
  session = { phone };
  saveSession();
  renderAccountTrigger();
  showToast(authMode === "register" ? "账号创建成功，欢迎回来～" : "登录成功，欢迎回来～");
  if (pendingCheckout) {
    pendingCheckout = false;
    closeModal(accountModal);
    window.setTimeout(openCheckoutModal, 240);
  } else {
    showAccountView();
  }
});

accountAddressForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const address = getAddressFromForm("account");
  const error = validateAddress(address);
  showFormError(accountAddressError, error);
  if (error) return;
  user.address = address;
  users[user.phone] = user;
  saveUsers();
  renderAccountView();
  showToast("收货地址已保存");
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const address = getAddressFromForm("checkout");
  const error = validateAddress(address);
  showFormError(checkoutError, error);
  if (error) return;
  user.address = address;
  users[user.phone] = user;
  saveUsers();
  cart = {};
  saveCart();
  closeModal(checkoutModal);
  showCheckoutSuccess();
  showToast("演示订单已提交");
});

logoutButton.addEventListener("click", () => {
  session = null;
  saveSession();
  renderAccountTrigger();
  closeModal(accountModal);
  showToast("已退出当前账号");
});

checkoutButton.addEventListener("click", () => {
  if (getCartCount() === 0) return;
  if (!getCurrentUser()) {
    pendingCheckout = true;
    setAuthMode("login");
    authHint.textContent = "登录后即可填写收货地址并完成结算。";
    openModal(accountModal);
    return;
  }
  openCheckoutModal();
});

function continueShoppingAndClose() {
  checkoutSuccess.hidden = true;
  renderCart();
  closeCart();
}

continueShopping.addEventListener("click", continueShoppingAndClose);
emptyCartLink.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!accountModal.hidden) closeModal(accountModal);
  else if (!checkoutModal.hidden) closeModal(checkoutModal);
  else if (cartDrawer.classList.contains("is-open")) closeCart();
});

renderFilters();
renderProducts();
renderCart();
renderAccountTrigger();
