/* Ube Halaya — cart, navigation and product page interactions */
(function () {
  "use strict";

  var FREE_SHIPPING = 45;
  var SHIPPING_COST = 4.9;
  var STORAGE_KEY = "ube-halaya-cart";

  var PRODUCTS = {
    "canette-1": { name: "Éclat d’Ubé — Une canette", meta: "1 canette · 50 g", price: 17.9, img: "assets/img/format-1.jpg" },
    "coffret-3": { name: "Coffret découverte", meta: "3 canettes · 150 g", price: 46.9, img: "assets/img/format-3.jpg" },
    "coffret-6": { name: "Coffret à partager", meta: "6 canettes · 300 g", price: 84.9, img: "assets/img/format-6.jpg" }
  };

  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  function money(n) { return euro.format(n).replace(/ /g, " "); }

  /* ---------- Storage (fails silently in private mode) ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }

  var cart = load();

  function count() {
    return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0);
  }
  function subtotal() {
    return Object.keys(cart).reduce(function (s, id) {
      return s + (PRODUCTS[id] ? PRODUCTS[id].price * cart[id] : 0);
    }, 0);
  }

  function add(id, qty) {
    if (!PRODUCTS[id]) return;
    cart[id] = Math.min(99, (cart[id] || 0) + (qty || 1));
    save();
    render();
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(99, qty);
    save();
    render();
  }

  /* ---------- Drawer ---------- */

  var drawer = document.getElementById("cart-drawer");
  var itemsEl = document.getElementById("cart-items");
  var lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    document.body.classList.add("cart-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.querySelector(".drawer__close").focus();
  }
  function closeCart() {
    document.body.classList.remove("cart-open");
    drawer.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  }

  function render() {
    var n = count();
    document.querySelectorAll(".cart-count").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    if (!drawer) return;

    var sub = subtotal();
    var remaining = Math.max(0, FREE_SHIPPING - sub);
    var ship = document.getElementById("ship-msg");
    ship.innerHTML = remaining > 0
      ? "Plus que <strong>" + money(remaining) + "</strong> pour la livraison offerte."
      : "Bonne nouvelle : <strong>la livraison est offerte</strong> !";
    document.getElementById("ship-bar").style.width = Math.min(100, (sub / FREE_SHIPPING) * 100) + "%";

    var ids = Object.keys(cart).filter(function (id) { return PRODUCTS[id]; });
    if (!ids.length) {
      itemsEl.innerHTML =
        '<li class="drawer__empty"><p class="script">Votre panier est vide…</p>' +
        '<a class="btn btn--sm" href="eclat-dube.html">Découvrir Éclat d’Ubé</a></li>';
    } else {
      itemsEl.innerHTML = ids.map(function (id) {
        var p = PRODUCTS[id];
        return (
          '<li class="line-item" data-id="' + id + '">' +
          '<img src="' + p.img + '" alt="" width="72" height="72">' +
          "<div><h3>" + p.name + '</h3><div class="line-item__meta">' + p.meta + "</div>" +
          '<div class="qty"><button type="button" data-act="dec" aria-label="Retirer une unité">−</button>' +
          '<input type="number" min="1" max="99" value="' + cart[id] + '" aria-label="Quantité" data-act="set">' +
          '<button type="button" data-act="inc" aria-label="Ajouter une unité">+</button></div></div>' +
          '<div class="line-item__right"><div class="line-item__price">' + money(p.price * cart[id]) + "</div>" +
          '<button type="button" class="line-item__remove" data-act="remove">Retirer</button></div>' +
          "</li>"
        );
      }).join("");
    }

    var shipping = sub === 0 || remaining === 0 ? 0 : SHIPPING_COST;
    document.getElementById("cart-subtotal").textContent = money(sub);
    document.getElementById("cart-shipping").textContent = sub === 0 ? "—" : shipping === 0 ? "Offerte" : money(shipping);
    document.getElementById("cart-total").textContent = money(sub + shipping);
    document.getElementById("checkout-btn").disabled = sub === 0;
  }

  if (itemsEl) {
    itemsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      var li = e.target.closest(".line-item");
      if (!btn || !li || btn.tagName === "INPUT") return;
      var id = li.dataset.id;
      if (btn.dataset.act === "inc") setQty(id, cart[id] + 1);
      if (btn.dataset.act === "dec") setQty(id, cart[id] - 1);
      if (btn.dataset.act === "remove") setQty(id, 0);
    });
    itemsEl.addEventListener("change", function (e) {
      var li = e.target.closest(".line-item");
      if (!li || e.target.dataset.act !== "set") return;
      var v = parseInt(e.target.value, 10);
      setQty(li.dataset.id, isNaN(v) ? 1 : v);
    });
  }

  document.querySelectorAll("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });
  document.querySelectorAll("[data-close-cart]").forEach(function (b) { b.addEventListener("click", closeCart); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("cart-open")) closeCart();
  });

  var checkout = document.getElementById("checkout-btn");
  if (checkout) {
    checkout.addEventListener("click", function () {
      toast("Paiement bientôt disponible — merci pour votre patience !");
    });
  }

  /* ---------- Add-to-cart buttons (home page cards, banners) ---------- */

  document.querySelectorAll("[data-add-to-cart]").forEach(function (b) {
    b.addEventListener("click", function () {
      add(b.dataset.addToCart, 1);
      toast("Ajouté au panier : " + PRODUCTS[b.dataset.addToCart].name);
      openCart();
    });
  });

  /* ---------- Toast ---------- */

  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  /* ---------- Mobile menu ---------- */

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Newsletter ---------- */

  var form = document.querySelector(".newsletter");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var msg = form.querySelector(".newsletter__msg");
      if (!input.checkValidity()) { msg.textContent = "Merci d’indiquer une adresse e-mail valide."; return; }
      msg.textContent = "Merci ! Votre première recette arrive bientôt.";
      input.value = "";
    });
  }

  /* ---------- Product page ---------- */

  var buyForm = document.getElementById("buy-form");
  if (buyForm) {
    var priceEl = document.getElementById("product-price");
    var btnPrice = document.getElementById("btn-price");
    var qtyInput = document.getElementById("qty");

    function selected() { return buyForm.querySelector('input[name="format"]:checked').value; }
    function qty() {
      var v = parseInt(qtyInput.value, 10);
      return isNaN(v) || v < 1 ? 1 : Math.min(99, v);
    }
    function updatePrice() {
      var p = PRODUCTS[selected()];
      priceEl.textContent = money(p.price);
      btnPrice.textContent = money(p.price * qty());
    }

    buyForm.addEventListener("change", updatePrice);
    buyForm.querySelectorAll("[data-qty]").forEach(function (b) {
      b.addEventListener("click", function () {
        qtyInput.value = Math.max(1, Math.min(99, qty() + parseInt(b.dataset.qty, 10)));
        updatePrice();
      });
    });
    qtyInput.addEventListener("input", updatePrice);
    buyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      add(selected(), qty());
      toast("Ajouté au panier : " + PRODUCTS[selected()].name);
      openCart();
    });

    // Preselect a format from the URL (?format=coffret-3)
    var fromUrl = new URLSearchParams(location.search).get("format");
    var radio = fromUrl && buyForm.querySelector('input[value="' + CSS.escape(fromUrl) + '"]');
    if (radio) radio.checked = true;
    updatePrice();

    // Gallery
    var mainImg = document.getElementById("gallery-img");
    var main = mainImg.parentElement;
    document.querySelectorAll(".gallery__thumbs button").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".gallery__thumbs button").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        t.setAttribute("aria-pressed", "true");
        mainImg.src = t.dataset.src;
        mainImg.alt = t.querySelector("img").alt;
        main.classList.remove("is-zoomed");
      });
    });
    document.querySelector(".gallery__zoom").addEventListener("click", function () {
      main.classList.toggle("is-zoomed");
    });
    mainImg.addEventListener("click", function () { main.classList.remove("is-zoomed"); });
  }

  /* ---------- Year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  render();
})();
