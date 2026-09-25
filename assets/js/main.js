/* Ube Halaya — cart, navigation and product page interactions */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var FREE_SHIPPING = 45;
  var SHIPPING_COST = 4.9;
  var LATTES_PER_CAN = 25;
  var STORAGE_KEY = "ube-halaya-cart";

  var PRODUCTS = {
    "canette-1": { name: "Éclat d’Ubé — Une canette", meta: "1 canette · 50 g", cans: 1, price: 17.9, img: "assets/img/format-1.webp", photo: "assets/img/product-main.webp" },
    "coffret-3": { name: "Coffret découverte", meta: "3 canettes · 150 g", cans: 3, price: 46.9, img: "assets/img/format-3.webp", photo: "assets/img/gift-pyramid.webp" },
    "coffret-6": { name: "Coffret à partager", meta: "6 canettes · 300 g", cans: 6, price: 84.9, img: "assets/img/format-6.webp", photo: "assets/img/format-6.webp" }
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  function money(n) { return euro.format(n).replace(/ /g, " "); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Storage (fails silently in private mode) ---------- */

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }

  var cart = load();
  // Keep other open tabs in sync
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) { cart = load(); render(); }
  });

  function count() {
    return Object.keys(cart).reduce(function (s, id) { return s + (PRODUCTS[id] ? cart[id] : 0); }, 0);
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
    $$(".cart-count").forEach(function (el) {
      el.classList.remove("bump");
      void el.offsetWidth; // restart the animation
      el.classList.add("bump");
    });
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(99, qty);
    save();
    render();
  }

  /* ---------- Drawer (with focus trap) ---------- */

  var drawer = document.getElementById("cart-drawer");
  var itemsEl = document.getElementById("cart-items");
  var lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    drawer.removeAttribute("inert");
    document.body.classList.add("cart-open");
    setTimeout(function () { $(".drawer__close", drawer).focus(); }, 50);
  }
  function closeCart() {
    document.body.classList.remove("cart-open");
    drawer.setAttribute("inert", "");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function isCartOpen() { return document.body.classList.contains("cart-open"); }

  document.addEventListener("keydown", function (e) {
    if (!isCartOpen()) return;
    if (e.key === "Escape") { closeCart(); return; }
    if (e.key !== "Tab") return;
    var focusables = $$("button:not([disabled]), a[href], input", drawer);
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function render() {
    var n = count();
    $$(".cart-count").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$(".cart-btn").forEach(function (b) {
      b.setAttribute("aria-label", n ? "Ouvrir le panier (" + n + " article" + (n > 1 ? "s" : "") + ")" : "Ouvrir le panier");
    });
    if (!drawer) return;

    var sub = subtotal();
    var remaining = Math.max(0, FREE_SHIPPING - sub);
    $("#ship-msg").innerHTML = sub === 0
      ? "Livraison offerte dès <strong>" + money(FREE_SHIPPING) + "</strong> d’achat."
      : remaining > 0
        ? "Plus que <strong>" + money(remaining) + "</strong> pour la livraison offerte."
        : "Bonne nouvelle : <strong>la livraison est offerte</strong> !";
    $("#ship-bar").style.width = Math.min(100, (sub / FREE_SHIPPING) * 100) + "%";

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
          '<input type="number" inputmode="numeric" min="1" max="99" value="' + cart[id] + '" aria-label="Quantité : ' + p.name + '" data-act="set">' +
          '<button type="button" data-act="inc" aria-label="Ajouter une unité">+</button></div></div>' +
          '<div class="line-item__right"><div class="line-item__price">' + money(p.price * cart[id]) + "</div>" +
          '<button type="button" class="line-item__remove" data-act="remove">Retirer</button></div>' +
          "</li>"
        );
      }).join("");
    }

    var shipping = sub === 0 || remaining === 0 ? 0 : SHIPPING_COST;
    $("#cart-subtotal").textContent = money(sub);
    $("#cart-shipping").textContent = sub === 0 ? "—" : shipping === 0 ? "Offerte" : money(shipping);
    $("#cart-total").textContent = money(sub + shipping);
    $("#checkout-btn").disabled = sub === 0;
  }

  if (itemsEl) {
    itemsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      var li = e.target.closest(".line-item");
      if (!btn || !li || btn.tagName === "INPUT") return;
      var id = li.dataset.id;
      var act = btn.dataset.act;
      if (act === "inc") setQty(id, cart[id] + 1);
      if (act === "dec") setQty(id, cart[id] - 1);
      if (act === "remove") setQty(id, 0);
      // Re-rendering replaces the buttons: keep keyboard focus in the same place
      var again = $('.line-item[data-id="' + id + '"] [data-act="' + act + '"]', itemsEl);
      (again || $(".drawer__close", drawer)).focus();
    });
    itemsEl.addEventListener("change", function (e) {
      var li = e.target.closest(".line-item");
      if (!li || e.target.dataset.act !== "set") return;
      var v = parseInt(e.target.value, 10);
      setQty(li.dataset.id, isNaN(v) ? 1 : v);
    });
  }

  $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });
  $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", closeCart); });

  var checkout = document.getElementById("checkout-btn");
  if (checkout) {
    checkout.addEventListener("click", function () {
      toast("Paiement bientôt disponible — merci pour votre patience !");
    });
  }

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
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2800);
  }

  /* ---------- Sticky header ---------- */

  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */

  var toggle = $(".menu-toggle");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !e.target.closest("#site-nav, .menu-toggle")) setMenu(false);
    });
  }

  /* ---------- Newsletter ---------- */

  var form = $(".newsletter");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input", form);
      var msg = $(".newsletter__msg", form);
      if (!input.value || !input.checkValidity()) {
        msg.textContent = "Merci d’indiquer une adresse e-mail valide.";
        input.focus();
        return;
      }
      msg.textContent = "Merci ! Votre première recette arrive bientôt.";
      input.value = "";
    });
  }

  /* ---------- Reveal on scroll ---------- */

  var revealTargets = $$(".h-section, .format-card, .step, .recipe, .journey article, .discover-card, .story__copy, .gift__inner, .faq, .specs, .final-cta__inner");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el, i) {
      // Only animate what starts below the fold, so nothing visible on load flickers
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal");
        el.style.transitionDelay = (i % 3) * 80 + "ms";
        io.observe(el);
      }
    });
  }

  /* ---------- Product page ---------- */

  var buyForm = document.getElementById("buy-form");
  if (buyForm) {
    var priceEl = document.getElementById("product-price");
    var btnPrice = document.getElementById("btn-price");
    var addBtn = document.getElementById("add-btn");
    var unitEl = document.getElementById("unit-price");
    var qtyInput = document.getElementById("qty");
    var mainImg = document.getElementById("gallery-img");
    var main = mainImg.parentElement;
    var thumbs = $$(".gallery__thumbs button");

    var selected = function () { return $('input[name="format"]:checked', buyForm).value; };
    var qty = function () {
      var v = parseInt(qtyInput.value, 10);
      return isNaN(v) || v < 1 ? 1 : Math.min(99, v);
    };

    var showPhoto = function (src, alt) {
      if (mainImg.getAttribute("src") === src) return;
      main.classList.remove("is-zoomed");
      thumbs.forEach(function (t) { t.setAttribute("aria-pressed", String(t.dataset.src === src)); });
      if (reduceMotion) { mainImg.src = src; if (alt) mainImg.alt = alt; return; }
      mainImg.classList.add("is-swapping");
      setTimeout(function () {
        mainImg.src = src;
        if (alt) mainImg.alt = alt;
        mainImg.classList.remove("is-swapping");
      }, 180);
    };

    var update = function () {
      var p = PRODUCTS[selected()];
      priceEl.textContent = money(p.price);
      btnPrice.textContent = money(p.price * qty());
      unitEl.textContent = money(p.price / (p.cans * LATTES_PER_CAN));
      $("#mobile-buy-price").textContent = money(p.price * qty());
      $("#mobile-buy-format").textContent = p.meta + (qty() > 1 ? " × " + qty() : "");
    };

    var selectFormat = function (id) {
      var radio = $('input[name="format"][value="' + id + '"]', buyForm);
      if (!radio) return;
      radio.checked = true;
      update();
      showPhoto(PRODUCTS[id].photo);
    };

    buyForm.addEventListener("change", function (e) {
      if (e.target.name === "format") showPhoto(PRODUCTS[selected()].photo);
      update();
    });
    $$("[data-qty]", buyForm).forEach(function (b) {
      b.addEventListener("click", function () {
        qtyInput.value = Math.max(1, Math.min(99, qty() + parseInt(b.dataset.qty, 10)));
        update();
      });
    });
    qtyInput.addEventListener("input", update);
    qtyInput.addEventListener("blur", function () { qtyInput.value = qty(); update(); });

    var addSelected = function () {
      add(selected(), qty());
      var label = addBtn.innerHTML;
      addBtn.classList.add("is-added");
      addBtn.textContent = "Ajouté au panier ✓";
      setTimeout(function () {
        addBtn.classList.remove("is-added");
        addBtn.innerHTML = label;
        btnPrice = document.getElementById("btn-price");
        update();
      }, 1400);
      setTimeout(openCart, 350);
    };
    buyForm.addEventListener("submit", function (e) { e.preventDefault(); addSelected(); });

    // Preselect a format from the URL (?format=coffret-3)
    var fromUrl = new URLSearchParams(location.search).get("format");
    if (fromUrl && PRODUCTS[fromUrl]) {
      $('input[name="format"][value="' + fromUrl + '"]', buyForm).checked = true;
      mainImg.src = PRODUCTS[fromUrl].photo;
      thumbs.forEach(function (t) { t.setAttribute("aria-pressed", String(t.dataset.src === PRODUCTS[fromUrl].photo)); });
    }
    update();

    // Links on the page that pick a format ("Découvrir le trio")
    $$("[data-select-format]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        selectFormat(a.dataset.selectFormat);
        buyForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        toast("Format sélectionné : " + PRODUCTS[a.dataset.selectFormat].name);
      });
    });

    // Gallery
    thumbs.forEach(function (t) {
      t.addEventListener("click", function () { showPhoto(t.dataset.src, $("img", t).alt); });
    });
    $(".gallery__zoom").addEventListener("click", function () {
      var zoomed = main.classList.toggle("is-zoomed");
      this.setAttribute("aria-label", zoomed ? "Réduire l’image" : "Agrandir l’image");
    });
    mainImg.addEventListener("click", function () { main.classList.remove("is-zoomed"); });
    main.addEventListener("mousemove", function (e) {
      if (!main.classList.contains("is-zoomed")) return;
      var r = main.getBoundingClientRect();
      mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width) * 100 + "% " + ((e.clientY - r.top) / r.height) * 100 + "%";
    });

    // Sticky add-to-cart bar on phones: visible once the main button is off screen
    var bar = document.getElementById("mobile-buy");
    var barBtn = document.getElementById("mobile-buy-btn");
    barBtn.addEventListener("click", addSelected);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var hidden = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        bar.classList.toggle("is-visible", hidden);
        bar.setAttribute("aria-hidden", String(!hidden));
        barBtn.tabIndex = hidden ? 0 : -1;
      }).observe(addBtn);
    }

    // Full recipe panel
    var recipe = document.getElementById("latte-signature");
    var openRecipe = function () {
      recipe.open = true;
      setTimeout(function () { recipe.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }, 30);
    };
    $$("[data-open-recipe]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openRecipe(); history.replaceState(null, "", "#latte-signature"); });
    });
    if (location.hash === "#latte-signature") openRecipe();
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  render();
})();
