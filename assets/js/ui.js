/* Shared UI for every page: announcement bar, header, mobile menu, cart
   drawer, add-to-cart buttons, toast, newsletter, scroll reveal.
   Exposes window.UbeUI for page scripts. */
(function () {
  "use strict";

  var Cart = window.UbeCart;
  var DATA = window.UBE_DATA;
  var money = Cart.money;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }

  var ICONS = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l.8 12.2a1 1 0 0 0 1 .8h6.4a1 1 0 0 0 1-.8L17 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/></svg>'
  };

  /* ---------- Focus trap for dialogs (menu, cart) ---------- */

  function trapFocus(container, e) {
    if (e.key !== "Tab") return;
    var f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  /* ---------- Announcement bar (rotates on narrow screens) ---------- */

  var announce = $("[data-announce]");
  if (announce && !reduceMotion) {
    var msgs = $$(".announce__item", announce);
    var idx = 0;
    var paused = false;
    announce.addEventListener("mouseenter", function () { paused = true; });
    announce.addEventListener("mouseleave", function () { paused = false; });
    setInterval(function () {
      if (paused || window.innerWidth >= 1000) return;
      msgs[idx].classList.remove("is-active");
      idx = (idx + 1) % msgs.length;
      msgs[idx].classList.add("is-active");
    }, 4000);
  }

  /* ---------- Sticky header shadow ---------- */

  var header = $("#site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */

  var nav = $("#main-nav");
  var menuToggle = $(".menu-toggle");
  var mobileQuery = window.matchMedia("(max-width: 960px)");

  function syncNavInert() {
    if (!nav) return;
    var hidden = mobileQuery.matches && !nav.classList.contains("is-open");
    if (hidden) nav.setAttribute("inert", ""); else nav.removeAttribute("inert");
  }
  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    syncNavInert();
    if (open) setTimeout(function () { $("[data-close-menu]", nav).focus(); }, 60);
    else menuToggle.focus({ preventScroll: true });
  }
  if (nav && menuToggle) {
    syncNavInert();
    (mobileQuery.addEventListener ? mobileQuery.addEventListener.bind(mobileQuery, "change") : mobileQuery.addListener.bind(mobileQuery))(function () {
      if (!mobileQuery.matches) { nav.classList.remove("is-open"); document.body.classList.remove("menu-open"); }
      syncNavInert();
    });
    menuToggle.addEventListener("click", function () { setMenu(true); });
    $$("[data-close-menu]").forEach(function (el) { el.addEventListener("click", function () { setMenu(false); }); });
    nav.addEventListener("keydown", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") setMenu(false);
      trapFocus(nav, e);
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
    toastEl.innerHTML = ICONS.check + "<span>" + esc(msg) + "</span>";
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3000);
  }

  /* ---------- Line items (shared by drawer, cart page, checkout) ---------- */

  function lineItemHTML(line, opts) {
    opts = opts || {};
    var p = line.product;
    var qtyControl = opts.readonly
      ? '<p class="line-item__meta">Quantité : ' + line.qty + "</p>"
      : '<div class="line-item__controls">' +
          '<div class="qty qty--sm">' +
            '<button type="button" data-line="dec" aria-label="Retirer une unité de ' + esc(p.name) + '">' + ICONS.minus + "</button>" +
            '<input type="number" inputmode="numeric" min="1" max="' + Cart.MAX_QTY + '" value="' + line.qty + '" data-line="set" aria-label="Quantité de ' + esc(p.name) + '">' +
            '<button type="button" data-line="inc" aria-label="Ajouter une unité de ' + esc(p.name) + '"' + (line.qty >= Cart.MAX_QTY ? " disabled" : "") + ">" + ICONS.plus + "</button>" +
          "</div>" +
          '<button type="button" class="line-item__remove" data-line="remove" aria-label="Supprimer ' + esc(p.name) + ' du panier">' + ICONS.trash + "</button>" +
        "</div>";
    var compare = p.compareAt ? "<s>" + money(p.compareAt * line.qty) + "</s>" : "";
    return (
      '<li class="line-item" data-id="' + p.id + '">' +
        '<img class="line-item__img" src="' + p.thumb + '" alt="" width="76" height="76" loading="lazy">' +
        "<div>" +
          '<h3 class="line-item__title"><a href="' + p.url + '">' + esc(p.name) + "</a></h3>" +
          '<p class="line-item__meta">' + esc(p.meta) + " · " + money(p.price) + (line.qty > 1 ? " l’unité" : "") + "</p>" +
          qtyControl +
        "</div>" +
        '<p class="line-item__price">' + money(line.total) + compare + "</p>" +
      "</li>"
    );
  }

  // Delegated quantity controls for any list of line items
  function bindLineControls(list) {
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-line]");
      if (!btn) return;
      var id = btn.closest(".line-item").dataset.id;
      var act = btn.dataset.line;
      if (act === "inc") Cart.set(id, Cart.qty(id) + 1);
      if (act === "dec") Cart.set(id, Cart.qty(id) - 1);
      if (act === "remove") { Cart.remove(id); toast("Article retiré du panier"); }
      // Rendering replaced the buttons: put focus back on the same control
      var again = $('.line-item[data-id="' + id + '"] [data-line="' + act + '"]', list);
      if (again && !again.disabled) again.focus();
      else if (!again) (list.closest("[role=dialog]") ? $("[data-close-cart]", list.closest("[role=dialog]")) : list).focus();
    });
    list.addEventListener("change", function (e) {
      if (e.target.dataset.line !== "set") return;
      var id = e.target.closest(".line-item").dataset.id;
      Cart.set(id, e.target.value || 1);
    });
  }

  function shipMeterUpdate(root, extra) {
    if (!root) return;
    var sub = Cart.subtotal() + (extra || 0);
    var left = Math.max(0, DATA.freeShipping - sub);
    var text = $("[data-ship-text]", root);
    root.classList.toggle("is-complete", sub > 0 && left === 0);
    text.innerHTML = sub === 0
      ? "Livraison offerte dès <strong>" + money(DATA.freeShipping) + "</strong> d’achat."
      : left > 0
        ? "Plus que <strong>" + money(left) + "</strong> pour profiter de la livraison offerte."
        : "La livraison vous est offerte.";
    $("[data-ship-bar]", root).style.width = Math.min(100, (sub / DATA.freeShipping) * 100) + "%";
  }

  /* ---------- Cart drawer ---------- */

  var drawer = $("#cart-drawer");
  var lastFocus = null;

  function openCart() {
    if (!drawer) { location.href = "cart.html"; return; }
    lastFocus = document.activeElement;
    drawer.removeAttribute("inert");
    document.body.classList.add("cart-open");
    setTimeout(function () { $("[data-close-cart]", drawer).focus(); }, 60);
  }
  function closeCart() {
    if (!drawer) return;
    document.body.classList.remove("cart-open");
    drawer.setAttribute("inert", "");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  if (drawer) {
    $$("[data-close-cart]").forEach(function (el) { el.addEventListener("click", closeCart); });
    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeCart();
      trapFocus(drawer, e);
    });
    bindLineControls($("[data-cart-items]", drawer));
  }
  $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });

  function renderDrawer() {
    if (!drawer) return;
    var lines = Cart.lines();
    var list = $("[data-cart-items]", drawer);
    var count = Cart.count();
    $("[data-cart-count-text]", drawer).textContent = count ? "(" + count + ")" : "";
    $("[data-cart-foot]", drawer).hidden = !lines.length;
    $("[data-ship-meter]", drawer).hidden = !lines.length;
    if (!lines.length) {
      list.innerHTML =
        '<li class="empty-state"><div class="empty-state__icon">' + ICONS.bag + "</div>" +
        "<h3>Votre panier est vide</h3>" +
        "<p>Une canette suffit pour préparer jusqu’à 25 lattes violets.</p>" +
        '<a class="btn" href="product.html">Découvrir Éclat d’Ubé</a></li>';
      return;
    }
    list.innerHTML = lines.map(function (l) { return lineItemHTML(l); }).join("");
    var sub = Cart.subtotal();
    var ship = Cart.shipping(sub);
    $("[data-cart-subtotal]", drawer).textContent = money(sub);
    var shipEl = $("[data-cart-shipping]", drawer);
    shipEl.textContent = ship === 0 ? "Offerte" : money(ship);
    shipEl.classList.toggle("is-free", ship === 0);
    $("[data-cart-total]", drawer).textContent = money(sub + ship);
    shipMeterUpdate($("[data-ship-meter]", drawer));
  }

  function renderCounts(detail) {
    var n = Cart.count();
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = n > 9 ? "9+" : n;
      el.hidden = n === 0;
      if (detail && detail.added) {
        el.classList.remove("is-bumping");
        void el.offsetWidth;
        el.classList.add("is-bumping");
      }
    });
    $$("[data-open-cart]").forEach(function (b) {
      b.setAttribute("aria-label", n ? "Ouvrir le panier, " + n + " article" + (n > 1 ? "s" : "") : "Ouvrir le panier");
    });
  }

  Cart.onChange(function (cart, detail) {
    renderCounts(detail);
    renderDrawer();
  });

  /* ---------- Add-to-cart buttons (cards, banners) ---------- */

  function confirmButton(btn) {
    if (!btn || btn.classList.contains("is-success")) return;
    var original = btn.innerHTML;
    btn.classList.add("is-success");
    btn.innerHTML = ICONS.check + "<span>Ajouté</span>";
    setTimeout(function () { btn.classList.remove("is-success"); btn.innerHTML = original; }, 1600);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add-to-cart]");
    if (!btn) return;
    e.preventDefault();
    Cart.add(btn.dataset.addToCart, 1);
    confirmButton(btn);
    setTimeout(openCart, 280);
  });

  /* ---------- Newsletter ---------- */

  $$("[data-newsletter]").forEach(function (form) {
    var msg = $("[data-newsletter-msg]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input[type=email]", form);
      msg.classList.remove("is-success", "is-error");
      if (!input.value.trim() || !input.checkValidity()) {
        msg.textContent = "Merci d’indiquer une adresse e-mail valide.";
        msg.classList.add("is-error");
        input.focus();
        return;
      }
      msg.textContent = "Merci ! Vous êtes bien inscrit·e à la newsletter.";
      msg.classList.add("is-success");
      form.reset();
    });
  });

  /* ---------- Scroll reveal (only for content below the fold) ---------- */

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal], [data-reveal-group] > *").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      var group = el.parentElement.hasAttribute("data-reveal-group");
      el.classList.add("reveal");
      if (group) el.style.transitionDelay = Array.prototype.indexOf.call(el.parentElement.children, el) % 4 * 90 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Misc ---------- */

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  window.UbeUI = {
    $: $,
    $$: $$,
    esc: esc,
    icons: ICONS,
    toast: toast,
    openCart: openCart,
    closeCart: closeCart,
    lineItemHTML: lineItemHTML,
    bindLineControls: bindLineControls,
    shipMeterUpdate: shipMeterUpdate,
    confirmButton: confirmButton,
    reduceMotion: reduceMotion
  };
})();
