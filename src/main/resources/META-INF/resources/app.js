(function () {
  "use strict";

  var API_BASE = "/api"; 
  var LS_USERS = "savoria_users_v1";
  var LS_SESSION = "savoria_session_v1";
  var LS_RESERVATIONS = "savoria_reservations_demo_v1";
  var CART_KEY = "restaurant_cart";

  var CATEGORIES = ["All", "Biryani & Rice", "Karahi & Curry", "Kababs & BBQ", "Pizza & Breads", "Frozen & Takeaway", "Desserts & Chai"];

  var state = {
    menu: [],
    menuFilter: "All",
    menuSearch: "",
    usingDemoMenu: false,
    reservations: [],
    usingDemoReservations: false,
    user: null
  };

  // ---------- tiny helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return esc(n);
    return "£" + v.toFixed(2); // UK POUNDS
  }
  function toast(msg, kind) {
    var ctn = $("toastCtn");
    if (!ctn) return;
    var el = document.createElement("div");
    el.className = "toast" + (kind === "ok" ? " ok" : kind === "err" ? " err" : "");
    el.textContent = msg;
    ctn.appendChild(el);
    setTimeout(function () { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2600);
    setTimeout(function () { el.remove(); }, 3000);
  }
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ---------- CART LOGIC ----------
  function getCart() { return readJSON(CART_KEY, []); }
  function saveCart(cart) { writeJSON(CART_KEY, cart); updateCartUI(); }
  function cartTotal(cart) { return cart.reduce((s, i) => s + (i.price * i.qty), 0); }
  function cartCount(cart) { return cart.reduce((n, i) => n + i.qty, 0); }

  function addToCart(id, name, price) {
    const cart = getCart();
    const found = cart.find((i) => i.id === id);
    if (found) { found.qty += 1; } 
    else { cart.push({ id, name, price: Number(price), qty: 1 }); }
    saveCart(cart);
    toast(name + " added to cart!", "ok");
  }

  function updateCartUI() {
    const cart = getCart();
    const btn = $("viewCartBtn");
    if (!btn) return;
    
    if (cart.length > 0) {
      btn.hidden = false;
      btn.textContent = `View Cart • ${money(cartTotal(cart))} (${cartCount(cart)})`;
    } else {
      btn.hidden = true;
    }
  }

  // ---------- MENU ----------
  function renderCategoryPills() {
    var pills = $("categoryPills");
    if (!pills) return;
    pills.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pill" + (state.menuFilter === c ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        state.menuFilter = c;
        renderCategoryPills();
        renderMenu();
      });
      pills.appendChild(b);
    });
  }

  function filteredMenu() {
    var q = state.menuSearch.trim().toLowerCase();
    return state.menu.filter(function (m) {
      var okCat = state.menuFilter === "All" || m.category === state.menuFilter;
      var okQ = !q || (String(m.name).toLowerCase().indexOf(q) !== -1 || String(m.description || "").toLowerCase().indexOf(q) !== -1);
      return okCat && okQ;
    });
  }

  function renderMenu() {
    var grid = $("menuGrid");
    var count = $("menuCount");
    if (!grid) return;
    var items = filteredMenu();
    if (count) count.textContent = items.length + " item" + (items.length === 1 ? "" : "s") + (state.usingDemoMenu ? " · demo data" : " · live from backend");
    
    if (!items.length) {
      grid.innerHTML = '<div class="empty">No dishes match your search.</div>';
      return;
    }
    
    grid.innerHTML = items.map(function (m) {
      var thumb = m.img
        ? '<div class="thumb"><img src="' + esc(m.img) + '" alt="' + esc(m.name) + '"></div>'
        : '<div class="thumb emoji" aria-hidden="true">' + esc(m.emoji || "🍽️") + "</div>";
      
      return '<article class="card dish">' +
        thumb +
        '<div class="info">' +
        '<div class="cat">' + esc(m.category || "Menu") + "</div>" +
        "<h3>" + esc(m.name) + "</h3>" +
        "<p>" + esc(m.description || "") + "</p>" +
        '<div class="row">' +
          '<span class="price">' + money(m.price) + "</span>" +
          (m.tag ? '<span class="tag">' + esc(m.tag) + "</span>" : "") +
        "</div>" +
        // ADD TO CART BUTTON ADDED HERE
        '<button class="btn btn-primary btn-small add-to-cart-btn" style="margin-top: 10px; width: 100%;" data-id="'+m.id+'" data-name="'+esc(m.name)+'" data-price="'+m.price+'">Add to Cart</button>' +
        "</div></article>";
    }).join("");
  }

  async function loadMenu() {
    var status = $("menuStatus");
    if (status) status.innerHTML = '<span class="spinner"></span>Loading menu…';
    try {
      var res = await fetch(API_BASE + "/menu");
      var data = await res.json();
      var arr = Array.isArray(data) ? data : (data.items || data.menu || []);
      state.menu = arr.map(function (m, i) {
        return { id: m.id, name: m.name, category: m.category, price: m.price, description: m.description, emoji: m.emoji, tag: m.tag, img: m.img };
      });
      state.usingDemoMenu = false;
      if (status) status.textContent = "";
    } catch (err) {
      if (status) status.textContent = "Backend offline.";
    }
    renderCategoryPills();
    renderMenu();
  }

  // ---------- RESERVATIONS & AUTH (Kept exactly as they were) ----------
  function renderReservations() {
    // ... [Kept from previous code, no changes needed to this block] ...
    var list = $("bookingList"); if (!list) return;
    var items = state.reservations.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (!items.length) { list.innerHTML = '<div class="empty">No reservations yet.</div>'; return; }
    list.innerHTML = "";
    items.forEach(function (r) {
      var div = document.createElement("div"); div.className = "booking";
      div.innerHTML = '<div><div class="who">' + esc(r.name) + ' <span class="hint">· ' + esc(r.guests) + " guest(s)</span></div><div class=\"meta\">" + r.date + " at " + esc(r.time) + '</div></div><div class="actions"><button class="btn btn-danger btn-small" onclick="deleteReservation('+r.id+')">Delete</button></div>';
      list.appendChild(div);
    });
  }
  async function loadReservations() {
    try {
      var res = await fetch(API_BASE + "/reservations");
      state.reservations = await res.json();
    } catch (err) { state.reservations = []; }
    renderReservations();
  }
  window.deleteReservation = async function(id) {
    if(!confirm("Delete?")) return;
    await fetch(API_BASE + "/reservations/" + id, { method: "DELETE" });
    loadReservations();
  }

  // ---------- wire up DOM ----------
  function init() {
    // CART UI
    updateCartUI();
    const cartModal = $("cartModalBackdrop");
    
    $("viewCartBtn").onclick = () => {
        const cart = getCart();
        const list = $("cartItems");
        list.innerHTML = cart.length === 0 ? "<li>Empty</li>" : cart.map((i) => `<li style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #eee;"><span>${i.name} <small>x${i.qty}</small></span> <strong>${money(i.price * i.qty)}</strong></li>`).join("");
        $("cartTotalEl").textContent = "Total: " + money(cartTotal(cart));
        cartModal.hidden = false;
        cartModal.classList.add("show"); // using your existing modal CSS
    };
    
    $("closeCartBtn").onclick = () => { cartModal.hidden = true; cartModal.classList.remove("show"); };
    $("continueShoppingBtn").onclick = () => { cartModal.hidden = true; cartModal.classList.remove("show"); };

    // EVENT DELEGATION FOR ADD TO CART (Works on dynamically generated buttons)
    $("menuGrid").addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart-btn")) {
        const btn = e.target;
        addToCart(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.price));
      }
    });

    // CHECKOUT
    $("checkoutForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const cart = getCart();
      if (!cart.length) return;

      const payload = {
        customerName: $("customerNameInput").value.trim(),
        customerEmail: $("customerEmailInput").value.trim(),
        itemsJson: JSON.stringify(cart),
        totalAmount: cartTotal(cart),
        paymentMethod: $("paymentMethodInput").value
      };

      const statusEl = $("cartStatusEl");
      statusEl.textContent = "Processing order...";
      statusEl.style.color = "#333";

      try {
        const res = await fetch(API_BASE + "/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        
        statusEl.textContent = "Order placed! Ref: " + data.orderReference + ". Please transfer £" + data.totalAmount + " to Sort: 12-34-56, Acc: 12345678.";
        statusEl.style.color = "green";
        saveCart([]);
        $("checkoutForm").reset();
      } catch (err) {
        statusEl.textContent = "Order failed. Try again.";
        statusEl.style.color = "red";
      }
    });

    // Auth Modal Logic
    var authModal = $("authModal"); var authBtn = $("authBtn"); var navAuthBtn = $("navAuthBtn");
    if (authModal && authModal.querySelector('.modal-content')) {
        var closeBtn = document.createElement('span'); closeBtn.className = 'close-modal'; closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() { authModal.classList.remove('show'); };
        authModal.querySelector('.modal-content').prepend(closeBtn);
    }
    if (authBtn) authBtn.addEventListener("click", function (e) { e.preventDefault(); authModal.classList.add("show"); });
    if (navAuthBtn) navAuthBtn.addEventListener("click", function (e) { e.preventDefault(); authModal.classList.add("show"); });
    if (authModal) authModal.addEventListener("click", function (e) { if (e.target === authModal) authModal.classList.remove("show"); });

    // Load Data
    loadMenu();
    loadReservations();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();