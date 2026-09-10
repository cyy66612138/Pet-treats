(() => {
  const products = [
    { id: 'chicken-bites', name: '鸡胸肉小方', category: '训练奖励', price: 29, weight: '80g', tag: '人气款', desc: '纯鸡胸肉 · 低温慢烘', emoji: '🍗', visual: 'visual-orange' },
    { id: 'pumpkin-chew', name: '南瓜磨牙棒', category: '磨牙洁齿', price: 36, weight: '120g', tag: '洁齿推荐', desc: '南瓜纤维 · 耐咬解闷', emoji: '🥕', visual: 'visual-yellow' },
    { id: 'cod-skin', name: '鳕鱼皮脆片', category: '冻干肉脆', price: 42, weight: '60g', tag: '海味鲜香', desc: '整片鳕鱼皮 · 酥脆不腥', emoji: '🐟', visual: 'visual-blue' },
    { id: 'beef-training', name: '牛肉训练粒', category: '训练奖励', price: 32, weight: '90g', tag: '训练必备', desc: '鲜牛肉 · 一口大小', emoji: '🥩', visual: 'visual-cream' },
    { id: 'yogurt-freeze', name: '酸奶冻干粒', category: '冻干肉脆', price: 39, weight: '70g', tag: '轻盈小食', desc: '浓醇酸奶 · 入口即化', emoji: '🥛', visual: 'visual-navy' },
    { id: 'duck-twist', name: '鸭肉绕腮棒', category: '磨牙洁齿', price: 45, weight: '100g', tag: '耐咬之选', desc: '鸭肉包裹 · 越嚼越香', emoji: '🦴', visual: 'visual-coral' }
  ];

  const storageKey = 'tails-treats-cart';
  let activeCategory = '全部';
  let cart = loadCart();
  let toastTimer;

  const grid = document.querySelector('[data-product-grid]');
  const resultCount = document.querySelector('[data-result-count]');
  const cartCount = document.querySelector('[data-cart-count]');
  const cartDrawer = document.querySelector('[data-cart-drawer]');
  const cartOverlay = document.querySelector('[data-cart-overlay]');
  const cartBody = document.querySelector('[data-cart-body]');
  const cartFooter = document.querySelector('[data-cart-footer]');
  const cartSubtotal = document.querySelector('[data-cart-subtotal]');
  const toast = document.querySelector('[data-toast]');

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
  }

  function getVisibleProducts() {
    return activeCategory === '全部' ? products : products.filter((product) => product.category === activeCategory);
  }

  function renderProducts() {
    const visibleProducts = getVisibleProducts();
    resultCount.textContent = `${visibleProducts.length} 件好吃的`;
    grid.innerHTML = visibleProducts.map((product) => `
      <article class="product-card">
        <div class="product-visual ${product.visual}">
          <span class="product-tag">${product.tag}</span>
          <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-desc">${product.desc}</p>
          <div class="product-bottom">
            <div class="product-price"><strong>${formatPrice(product.price)}</strong><span>/ ${product.weight}</span></div>
            <button class="add-button" type="button" data-add-product="${product.id}" aria-label="将${product.name}加入购物车">加入 <span aria-hidden="true">＋</span></button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function cartEntries() {
    return Object.entries(cart).map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity })).filter((entry) => entry.product && entry.quantity > 0);
  }

  function renderCart() {
    const entries = cartEntries();
    const totalCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const subtotal = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
    cartCount.textContent = totalCount;
    cartCount.setAttribute('aria-label', `${totalCount} 件商品`);
    cartFooter.hidden = entries.length === 0;
    cartSubtotal.textContent = formatPrice(subtotal);

    if (!entries.length) {
      cartBody.innerHTML = '<div class="cart-empty"><div class="empty-icon" aria-hidden="true">🛒</div><div><h3>购物车还是空的</h3><p>去挑几样，让今天变得更好吃。</p></div></div>';
      return;
    }

    cartBody.innerHTML = entries.map(({ product, quantity }) => `
      <div class="cart-item">
        <div class="cart-item-visual ${product.visual}" aria-hidden="true">${product.emoji}</div>
        <div>
          <p class="cart-item-name">${product.name}</p>
          <p class="cart-item-meta">${product.weight} · ${formatPrice(product.price)}</p>
          <div class="cart-item-actions">
            <button class="qty-button" type="button" data-decrease="${product.id}" aria-label="减少${product.name}数量">−</button>
            <span class="cart-item-qty" aria-label="数量 ${quantity}">${quantity}</span>
            <button class="qty-button" type="button" data-increase="${product.id}" aria-label="增加${product.name}数量">＋</button>
            <button class="remove-button" type="button" data-remove="${product.id}">删除</button>
          </div>
        </div>
        <span class="cart-item-price">${formatPrice(product.price * quantity)}</span>
      </div>
    `).join('');
  }

  function changeQuantity(id, amount) {
    const next = (cart[id] || 0) + amount;
    if (next <= 0) delete cart[id];
    else cart[id] = next;
    saveCart();
    renderCart();
  }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    const product = products.find((item) => item.id === id);
    showToast(`${product.name} 已加入购物车`);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function openCart() {
    cartOverlay.hidden = false;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    setTimeout(() => cartDrawer.focus(), 50);
  }

  function closeCart() {
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
    setTimeout(() => { cartOverlay.hidden = true; }, 280);
  }

  document.addEventListener('click', (event) => {
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      activeCategory = categoryButton.dataset.category;
      document.querySelectorAll('[data-category]').forEach((button) => {
        const isActive = button === categoryButton;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
      });
      renderProducts();
      return;
    }
    const addButton = event.target.closest('[data-add-product]');
    if (addButton) { addToCart(addButton.dataset.addProduct); return; }
    const increaseButton = event.target.closest('[data-increase]');
    if (increaseButton) { changeQuantity(increaseButton.dataset.increase, 1); return; }
    const decreaseButton = event.target.closest('[data-decrease]');
    if (decreaseButton) { changeQuantity(decreaseButton.dataset.decrease, -1); return; }
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) { changeQuantity(removeButton.dataset.remove, -999); showToast('商品已移除'); return; }
    if (event.target.closest('[data-open-cart]')) { openCart(); return; }
    if (event.target.closest('[data-close-cart]') || event.target === cartOverlay) { closeCart(); return; }
    if (event.target.closest('[data-demo-checkout]')) { showToast('演示模式：结算功能即将上线'); }
    if (event.target.closest('.announcement-close')) { document.querySelector('.announcement').remove(); }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
  });

  renderProducts();
  renderCart();
})();
