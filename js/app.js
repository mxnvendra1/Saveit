// SaveIt - Main App Logic
// Full Blinkit-like experience with fake purchasing

// ==================
// STATE
// ==================
let cart = {};
let location = "";
let totalSaved = 0;
let orderCount = 0;
let streak = 0;
let lastOrderDate = null;
let orders = [];
let currentPage = "home";

// ==================
// INIT
// ==================
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setTimeout(() => {
    document.querySelector(".splash-bar").style.animationDuration = "1.8s";
    setTimeout(() => {
      const splash = document.getElementById("splash");
      splash.classList.add("fade-out");
      setTimeout(() => {
        splash.style.display = "none";
        if (!location) {
          showLocationModal();
        } else {
          showApp();
        }
      }, 500);
    }, 1900);
  }, 100);
});

function loadState() {
  try {
    const saved = localStorage.getItem("saveit_state");
    if (saved) {
      const s = JSON.parse(saved);
      totalSaved = s.totalSaved || 0;
      orderCount = s.orderCount || 0;
      streak = s.streak || 0;
      lastOrderDate = s.lastOrderDate || null;
      orders = s.orders || [];
      location = s.location || "";
    }
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem("saveit_state", JSON.stringify({
      totalSaved, orderCount, streak, lastOrderDate, orders, location
    }));
  } catch(e) {}
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
  renderFeatured();
  renderCategorySections();
  updateCartBar();
}

// ==================
// LOCATION
// ==================
function showLocationModal() {
  document.getElementById("location-modal").classList.remove("hidden");
  document.getElementById("backdrop").classList.remove("hidden");
}

function setLocation(loc) {
  document.getElementById("location-input").value = loc;
}

function confirmLocation() {
  const input = document.getElementById("location-input").value.trim();
  location = input || "Koramangala, Bengaluru";
  document.getElementById("header-location").innerHTML =
    location.split(",")[0] + ` <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`;
  document.getElementById("checkout-address-text").textContent = location;
  closeAllModals();
  saveState();
  if (document.getElementById("app").classList.contains("hidden")) {
    showApp();
  }
}

// ==================
// RENDER PRODUCTS
// ==================
function createProductCard(product) {
  const inCart = cart[product.id];
  const qty = inCart ? inCart.qty : 0;

  const card = document.createElement("div");
  card.className = "product-card";
  card.id = `card-${product.id}`;

  card.innerHTML = `
    <div class="product-image">
      ${product.discount > 0 ? `<div class="discount-badge">${product.discount}% OFF</div>` : ""}
      <span style="font-size:52px">${product.emoji}</span>
    </div>
    <div class="product-weight">${product.weight}</div>
    <div class="product-name">${product.name}</div>
    <div class="product-price-row">
      <div class="price-group">
        <span class="price-main">₹${product.price}</span>
        ${product.mrp > product.price ? `<span class="price-mrp">₹${product.mrp}</span>` : ""}
      </div>
      <div id="btn-${product.id}">
        ${qty > 0 ? renderQtyControl(product.id, qty) : `<button class="add-btn" onclick="addToCart(${product.id})">+</button>`}
      </div>
    </div>
  `;

  return card;
}

function renderQtyControl(id, qty) {
  return `
    <div class="qty-control">
      <button class="qty-btn" onclick="decreaseQty(${id})">−</button>
      <span class="qty-num">${qty}</span>
      <button class="qty-btn" onclick="increaseQty(${id})">+</button>
    </div>
  `;
}

function renderFeatured() {
  const grid = document.getElementById("featured-grid");
  grid.innerHTML = "";
  const featured = PRODUCTS.filter(p => FEATURED_IDS.includes(p.id));
  featured.forEach(p => grid.appendChild(createProductCard(p)));
}

function renderCategorySections() {
  const container = document.getElementById("category-sections");
  container.innerHTML = "";

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const products = PRODUCTS.filter(p => p.category === key);
    if (!products.length) return;

    const section = document.createElement("div");
    section.className = "category-section";
    section.id = `section-${key}`;

    section.innerHTML = `
      <div class="section-title-row">
        <h2>${cat.emoji} ${cat.label}</h2>
        <span class="see-all" onclick="filterCategory('${key}')">See all</span>
      </div>
      <div class="products-grid" id="grid-${key}"></div>
    `;

    container.appendChild(section);
    const grid = section.querySelector(`#grid-${key}`);
    products.slice(0, 4).forEach(p => grid.appendChild(createProductCard(p)));
  });
}

function refreshProductCard(id) {
  const existing = document.getElementById(`card-${id}`);
  if (!existing) return;

  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const newCard = createProductCard(product);
  existing.replaceWith(newCard);
}

// ==================
// CART LOGIC
// ==================
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  cart[id] = { product, qty: 1 };
  refreshProductCard(id);
  updateCartBar();
  refreshCartIfOpen();
}

function increaseQty(id) {
  if (cart[id]) {
    cart[id].qty++;
    refreshProductCard(id);
    updateCartBar();
    refreshCartIfOpen();
  }
}

function decreaseQty(id) {
  if (cart[id]) {
    cart[id].qty--;
    if (cart[id].qty <= 0) {
      delete cart[id];
    }
    refreshProductCard(id);
    updateCartBar();
    refreshCartIfOpen();
  }
}

function getCartCount() {
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return Object.values(cart).reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function updateCartBar() {
  const count = getCartCount();
  const total = getCartTotal();
  const bar = document.getElementById("cart-bar");

  if (count === 0) {
    bar.classList.add("hidden");
    return;
  }

  bar.classList.remove("hidden");
  document.getElementById("cart-count-badge").textContent = count;
  document.getElementById("cart-bar-text").textContent = `item${count !== 1 ? "s" : ""} in cart`;
  document.getElementById("cart-bar-total").textContent = `₹${total}`;
}

// ==================
// CART OVERLAY
// ==================
function showCart() {
  const overlay = document.getElementById("cart-overlay");
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 10);
  renderCart();
}

function hideCart() {
  const overlay = document.getElementById("cart-overlay");
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 300);
}

function renderCart() {
  const list = document.getElementById("cart-items-list");
  list.innerHTML = "";

  const items = Object.values(cart);
  items.forEach(({ product, qty }) => {
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <div class="cart-item-img">${product.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-weight">${product.weight}</div>
        <div class="cart-item-price">₹${product.price * qty}</div>
      </div>
      <div class="qty-control" style="height:36px">
        <button class="qty-btn" onclick="decreaseQty(${product.id}); renderCart()">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" onclick="increaseQty(${product.id}); renderCart()">+</button>
      </div>
    `;
    list.appendChild(item);
  });

  const total = getCartTotal();
  document.getElementById("bill-item-total").textContent = `₹${total}`;
  document.getElementById("bill-total").textContent = `₹${total}`;
}

function refreshCartIfOpen() {
  const overlay = document.getElementById("cart-overlay");
  if (overlay.classList.contains("show")) renderCart();
}

// ==================
// CHECKOUT
// ==================
function proceedToCheckout() {
  hideCart();
  setTimeout(() => {
    const overlay = document.getElementById("checkout-overlay");
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("show"), 10);
    renderCheckout();
  }, 300);
}

function hideCheckout() {
  const overlay = document.getElementById("checkout-overlay");
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 300);
}

function renderCheckout() {
  const itemsContainer = document.getElementById("checkout-items");
  itemsContainer.innerHTML = "";
  const total = getCartTotal();

  Object.values(cart).forEach(({ product, qty }) => {
    const item = document.createElement("div");
    item.className = "checkout-item";
    item.innerHTML = `
      <div class="checkout-item-left">
        <span class="checkout-item-qty">${qty}×</span>
        <span>${product.name}</span>
      </div>
      <span>₹${product.price * qty}</span>
    `;
    itemsContainer.appendChild(item);
  });

  document.getElementById("checkout-address-text").textContent = location || "Koramangala, Bengaluru";
  document.getElementById("checkout-item-total").textContent = `₹${total}`;
  document.getElementById("checkout-total").textContent = `₹${total}`;
}

function selectPayment(el, method) {
  document.querySelectorAll(".payment-option").forEach(opt => {
    opt.classList.remove("selected");
    opt.querySelector(".radio-dot").classList.remove("selected");
  });
  el.classList.add("selected");
  el.querySelector(".radio-dot").classList.add("selected");
}

function placeOrder() {
  const total = getCartTotal();
  const items = Object.values(cart).map(({ product, qty }) => `${product.name} × ${qty}`);

  hideCheckout();

  setTimeout(() => {
    // Update savings
    totalSaved += total;
    orderCount++;
    updateStreak();

    // Save order
    orders.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      items: items,
      saved: total
    });

    saveState();

    // Clear cart
    cart = {};
    updateCartBar();
    refreshAllCards();

    // Show order modal
    showOrderModal(total);
  }, 300);
}

function updateStreak() {
  const today = new Date().toDateString();
  if (lastOrderDate === today) {
    // Already ordered today, streak stays
  } else if (lastOrderDate === new Date(Date.now() - 86400000).toDateString()) {
    // Yesterday, streak continues
    streak++;
  } else {
    // New streak
    streak = 1;
  }
  lastOrderDate = today;
}

function showOrderModal(amount) {
  document.getElementById("order-saved-amount").textContent = `₹${amount}`;
  document.getElementById("total-saved-display").textContent = `₹${totalSaved}`;
  document.getElementById("streak-count").textContent = streak;

  const modal = document.getElementById("order-modal");
  modal.classList.remove("hidden");
  document.getElementById("backdrop").classList.remove("hidden");
}

function closeOrderModal() {
  document.getElementById("order-modal").classList.add("hidden");
  document.getElementById("backdrop").classList.add("hidden");
}

function refreshAllCards() {
  PRODUCTS.forEach(p => {
    const card = document.getElementById(`card-${p.id}`);
    if (card) {
      const newCard = createProductCard(p);
      card.replaceWith(newCard);
    }
  });
}

// ==================
// PAGES
// ==================
function showHome() {
  setNavActive(0);
  document.getElementById("main-content").scrollTo(0, 0);
  hideAllOverlays();
}

function showCategoriesPage() {
  setNavActive(1);
  hideAllOverlays();
  document.getElementById("main-content").scrollIntoView();
  const section = document.getElementById("section-vegetables");
  if (section) section.scrollIntoView({ behavior: "smooth" });
}

function showOrdersPage() {
  setNavActive(2);
  const overlay = document.getElementById("orders-overlay");
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 10);
  renderOrders();
}

function hideOrdersPage() {
  const overlay = document.getElementById("orders-overlay");
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 300);
  setNavActive(0);
}

function renderOrders() {
  document.getElementById("orders-total-saved").textContent = `₹${totalSaved}`;
  document.getElementById("orders-count").textContent = orderCount;

  const list = document.getElementById("orders-list");
  const empty = document.getElementById("orders-empty");

  list.innerHTML = "";

  if (orders.length === 0) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  list.classList.remove("hidden");
  empty.classList.add("hidden");

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="order-card-header">
        <div>
          <div style="font-weight:700;font-size:14px">Order #${String(order.id).slice(-6)}</div>
          <div class="order-card-date">${order.date}</div>
        </div>
        <div class="order-card-saved">₹${order.saved} saved</div>
      </div>
      <div class="order-card-items">${order.items.slice(0, 4).join(" • ")}${order.items.length > 4 ? ` + ${order.items.length - 4} more` : ""}</div>
      <div class="order-card-badge">✓ Not Purchased – Money Saved!</div>
    `;
    list.appendChild(card);
  });
}

function showProfilePage() {
  setNavActive(3);
  hideAllOverlays();

  // Inject profile content dynamically
  let overlay = document.getElementById("profile-overlay-page");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "profile-overlay-page";
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlay-content profile-overlay">
        <div class="overlay-header">
          <button class="back-btn" onclick="hideProfilePage()">
            <svg width="22" height="22" fill="none" stroke="#1a1a1a" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <h2>Profile</h2>
          <span></span>
        </div>
        <div style="padding:20px 16px">
          <div class="profile-header">
            <div class="profile-avatar">🙂</div>
            <div>
              <div class="profile-name">SaveIt User</div>
              <div class="profile-sub">Saving money, one order at a time</div>
            </div>
          </div>
          <div class="savings-card" style="margin-bottom:20px">
            <div class="savings-label">Total Saved</div>
            <div class="savings-amount" style="font-size:36px">₹${totalSaved}</div>
            <div class="savings-sub">across ${orderCount} fake orders · 🔥 ${streak} day streak</div>
          </div>
          <div class="profile-menu">
            <div class="profile-menu-item" onclick="showOrdersPage(); hideProfilePage()">
              <span>📦</span><span>Orders Not Placed</span><span class="arrow">›</span>
            </div>
            <div class="profile-menu-item" onclick="showSavingsModal(); hideProfilePage()">
              <span>💰</span><span>My Savings</span><span class="arrow">›</span>
            </div>
            <div class="profile-menu-item" onclick="showLocationModal()">
              <span>📍</span><span>Change Location</span><span class="arrow">›</span>
            </div>
            <div class="profile-menu-item" onclick="resetData()" style="color:#e23744">
              <span>🗑️</span><span>Reset All Data</span><span class="arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    // Refresh savings
    overlay.querySelector(".savings-amount").textContent = `₹${totalSaved}`;
    overlay.querySelector(".savings-sub").textContent = `across ${orderCount} fake orders · 🔥 ${streak} day streak`;
  }

  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 10);
}

function hideProfilePage() {
  const overlay = document.getElementById("profile-overlay-page");
  if (overlay) {
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 300);
  }
  setNavActive(0);
}

function hideAllOverlays() {
  ["cart-overlay", "checkout-overlay", "orders-overlay"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("show");
      setTimeout(() => el.classList.add("hidden"), 300);
    }
  });
  const profilePage = document.getElementById("profile-overlay-page");
  if (profilePage) {
    profilePage.classList.remove("show");
    setTimeout(() => profilePage.classList.add("hidden"), 300);
  }
}

function setNavActive(index) {
  document.querySelectorAll(".nav-item").forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });
}

// ==================
// CATEGORY FILTER
// ==================
function filterCategory(category) {
  const section = document.getElementById(`section-${category}`);
  if (section) {
    // Close any search/overlays
    closeSearch();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showAllProducts() {
  const container = document.getElementById("category-sections");
  container.scrollIntoView({ behavior: "smooth" });
}

// ==================
// SEARCH
// ==================
function openSearch() {
  const overlay = document.getElementById("search-overlay");
  overlay.classList.remove("hidden");
  setTimeout(() => document.getElementById("search-input").focus(), 100);
}

function closeSearch() {
  const overlay = document.getElementById("search-overlay");
  overlay.classList.add("hidden");
  document.getElementById("search-input").value = "";
  document.getElementById("search-results").innerHTML = "";
  document.getElementById("search-empty").classList.add("hidden");
  document.getElementById("clear-btn").style.display = "none";
}

function clearSearch() {
  document.getElementById("search-input").value = "";
  document.getElementById("search-results").innerHTML = "";
  document.getElementById("search-empty").classList.add("hidden");
  document.getElementById("clear-btn").style.display = "none";
  document.getElementById("search-input").focus();
}

function handleSearch(query) {
  const clearBtn = document.getElementById("clear-btn");
  clearBtn.style.display = query ? "block" : "none";

  if (!query.trim()) {
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("search-empty").classList.add("hidden");
    return;
  }

  const results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  const container = document.getElementById("search-results");
  const empty = document.getElementById("search-empty");

  if (results.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  container.innerHTML = "";

  results.forEach(p => {
    const item = document.createElement("div");
    item.className = "search-product-item";
    const qty = cart[p.id]?.qty || 0;
    item.innerHTML = `
      <div class="search-product-icon">${p.emoji}</div>
      <div class="search-product-info">
        <div class="search-product-name">${p.name}</div>
        <div class="search-product-meta">${p.weight} · ${CATEGORIES[p.category].label}</div>
        <div class="search-product-price">₹${p.price}</div>
      </div>
      <div id="search-btn-${p.id}">
        ${qty > 0 ? `
          <div class="qty-control">
            <button class="qty-btn" onclick="decreaseQty(${p.id}); handleSearch(document.getElementById('search-input').value)">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="increaseQty(${p.id}); handleSearch(document.getElementById('search-input').value)">+</button>
          </div>
        ` : `<button class="add-btn" onclick="addToCart(${p.id}); handleSearch(document.getElementById('search-input').value)">+</button>`}
      </div>
    `;
    container.appendChild(item);
  });
}

// ==================
// SAVINGS MODAL
// ==================
function showSavingsModal() {
  document.getElementById("stat-total").textContent = `₹${totalSaved}`;
  document.getElementById("stat-orders").textContent = orderCount;
  document.getElementById("stat-streak").textContent = `${streak}🔥`;
  document.getElementById("savings-modal").classList.remove("hidden");
  document.getElementById("backdrop").classList.remove("hidden");
}

function hideSavingsModal() {
  document.getElementById("savings-modal").classList.add("hidden");
  document.getElementById("backdrop").classList.add("hidden");
}

// ==================
// MISC
// ==================
function closeAllModals() {
  document.getElementById("location-modal").classList.add("hidden");
  document.getElementById("savings-modal").classList.add("hidden");
  document.getElementById("order-modal").classList.add("hidden");
  document.getElementById("backdrop").classList.add("hidden");
}

function resetData() {
  if (confirm("Reset all savings data?")) {
    totalSaved = 0; orderCount = 0; streak = 0; lastOrderDate = null; orders = [];
    saveState();
    location = "";
    cart = {};
    updateCartBar();
    alert("Data reset! Reloading...");
    window.location.reload();
  }
}
