const products = [
  { id: "pumpkin-bites", name: "鸡肉南瓜小方", meta: "狗狗 · 训练奖励", description: "鸡胸肉与南瓜的温柔搭配，小小一颗刚刚好。", price: 29, emoji: "🍪", color: "orange", badge: "人气款", tags: ["dog", "training"] },
  { id: "salmon-seaweed", name: "三文鱼海苔脆片", meta: "猫咪 · 日常奖励", description: "鲜香三文鱼遇上海苔，轻轻一捏就碎的酥脆。", price: 32, emoji: "🐟", color: "green", badge: "猫咪最爱", tags: ["cat", "training"] },
  { id: "beef-dental", name: "原切牛肉洁齿棒", meta: "狗狗 · 洁齿护理", description: "耐嚼的原切牛肉香，陪它慢慢磨掉小烦恼。", price: 36, emoji: "🥨", color: "tan", badge: "洁齿", tags: ["dog", "dental"] },
  { id: "freeze-dried", name: "鸡胸肉冻干粒", meta: "狗狗 · 高蛋白", description: "只用一味鸡胸肉，冻干锁住自然鲜香。", price: 45, emoji: "🍗", color: "yellow", badge: "纯肉配方", tags: ["dog", "training"] },
  { id: "mousse-bites", name: "鹅肝慕斯夹心", meta: "猫咪 · 软糯口感", description: "细腻慕斯藏进小小夹心里，给挑剔的它。", price: 39, emoji: "🍓", color: "pink", badge: "新品", tags: ["cat"] },
  { id: "goat-cheese", name: "山羊奶酪小骨", meta: "狗狗 · 洁齿护理", description: "淡淡奶香的低负担小骨，适合午后慢慢啃。", price: 33, emoji: "🦴", color: "purple", badge: "低负担", tags: ["dog", "dental"] },
];

const cartStorageKey = "tail-treat-cart-v1";
let activeFilter = "all";
let cart = loadCart();
let toastTimer;

const productGrid = document.querySelector("#productGrid");
const noResults = document.querySelector("#noResults");
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

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => products.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0));
  } catch {
    return {};
  }
}

function saveCart() {
  try { localStorage.setItem(cartStorageKey, JSON.stringify(cart)); } catch { /* file:// 私有模式下可能不可用，仍保留当前页状态 */ }
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

function renderProducts() {
  const visibleProducts = activeFilter === "all" ? products : products.filter((product) => product.tags.includes(activeFilter));
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
  if (entries.length > 0) checkoutSuccess.hidden = true;
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
  document.body.classList.add("no-scroll");
  cartClose.focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.classList.remove("is-visible");
  document.body.classList.remove("no-scroll");
  window.setTimeout(() => { cartOverlay.hidden = true; }, 300);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    renderProducts();
  });
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

cartTrigger.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("is-open")) closeCart();
});

checkoutButton.addEventListener("click", () => {
  cart = {};
  saveCart();
  cartItems.innerHTML = "";
  cartItems.hidden = true;
  cartEmpty.hidden = true;
  cartFooter.hidden = true;
  checkoutSuccess.hidden = false;
  cartCount.textContent = "0";
  showToast("演示订单已提交");
});

function continueShoppingAndClose() {
  checkoutSuccess.hidden = true;
  renderCart();
  closeCart();
}

continueShopping.addEventListener("click", continueShoppingAndClose);
emptyCartLink.addEventListener("click", closeCart);

renderProducts();
renderCart();
