/* Product page: format selector, gallery, quantity, add to cart,
   free-shipping preview and the sticky add-to-cart bar on phones. */
(function () {
  "use strict";

  var Cart = window.UbeCart;
  var UI = window.UbeUI;
  var DATA = window.UBE_DATA;
  var $ = UI.$, $$ = UI.$$, money = Cart.money;

  var form = $("[data-buy-form]");
  if (!form) return;

  var qtyInput = $("#qty", form);
  var addBtn = $("[data-add-button]", form);
  var addBtnHTML = addBtn.innerHTML;

  function selectedId() { return $('input[name="format"]:checked', form).value; }
  function product() { return DATA.products[selectedId()]; }
  function qty() {
    var q = parseInt(qtyInput.value, 10);
    return isNaN(q) || q < 1 ? 1 : Math.min(Cart.MAX_QTY, q);
  }

  /* ---------- Gallery ---------- */

  var gallery = $("[data-gallery]");
  var mainWrap = $(".gallery__main", gallery);
  var mainImg = $("[data-gallery-main]", gallery);
  var thumbsWrap = $("[data-gallery-thumbs]", gallery);
  var images = [];
  var current = 0;

  function readThumbs() {
    images = $$("button img", thumbsWrap).map(function (img) { return { src: img.getAttribute("src"), alt: img.alt }; });
  }
  function show(i, instant) {
    if (!images.length) return;
    current = (i + images.length) % images.length;
    var img = images[current];
    mainWrap.classList.remove("is-zoomed");
    $$("button", thumbsWrap).forEach(function (b, n) { b.setAttribute("aria-pressed", String(n === current)); });
    if (mainImg.getAttribute("src") === img.src) return;
    if (instant || UI.reduceMotion) { mainImg.src = img.src; mainImg.alt = img.alt; return; }
    mainImg.classList.add("is-fading");
    setTimeout(function () {
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      mainImg.onload = function () { mainImg.classList.remove("is-fading"); };
      if (mainImg.complete) mainImg.classList.remove("is-fading");
    }, 160);
  }
  function setGallery(p, instant) {
    var alts = [p.name + " — Éclat d’Ubé", "Latte à l’ube marbré", "Bol de poudre d’ube", "Préparation de la poudre"];
    thumbsWrap.innerHTML = p.gallery.map(function (src, n) {
      return '<button type="button" aria-pressed="' + (n === 0) + '"><img src="' + src + '" alt="' + UI.esc(alts[n] || p.name) + '" width="120" height="120"></button>';
    }).join("");
    readThumbs();
    show(0, instant);
  }

  thumbsWrap.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) show($$("button", thumbsWrap).indexOf(b));
  });
  $("[data-gallery-prev]", gallery).addEventListener("click", function () { show(current - 1); });
  $("[data-gallery-next]", gallery).addEventListener("click", function () { show(current + 1); });
  $("[data-gallery-zoom]", gallery).addEventListener("click", function () {
    var z = mainWrap.classList.toggle("is-zoomed");
    this.setAttribute("aria-label", z ? "Réduire l’image" : "Agrandir l’image");
  });
  mainImg.addEventListener("click", function () { mainWrap.classList.toggle("is-zoomed"); });
  mainWrap.addEventListener("mousemove", function (e) {
    if (!mainWrap.classList.contains("is-zoomed")) return;
    var r = mainWrap.getBoundingClientRect();
    mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width) * 100 + "% " + ((e.clientY - r.top) / r.height) * 100 + "%";
  });
  // Swipe on touch screens
  var touchX = null;
  mainWrap.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  mainWrap.addEventListener("touchend", function (e) {
    if (touchX === null || mainWrap.classList.contains("is-zoomed")) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Pricing & selection ---------- */

  var shipBox = $("[data-product-ship]");

  function updateShipPreview() {
    var p = product();
    var inCart = Cart.subtotal();
    var withSelection = inCart + p.price * qty();
    var text = $("[data-ship-text]", shipBox);
    var left = Math.max(0, DATA.freeShipping - withSelection);
    shipBox.classList.toggle("is-complete", left === 0);
    if (inCart >= DATA.freeShipping) text.innerHTML = "Votre livraison est déjà offerte.";
    else if (left === 0) text.innerHTML = "Avec cet ajout, <strong>la livraison vous est offerte</strong>.";
    else text.innerHTML = "Plus que <strong>" + money(left) + "</strong> après cet ajout pour la livraison offerte.";
    $("[data-ship-bar]", shipBox).style.width = Math.min(100, (withSelection / DATA.freeShipping) * 100) + "%";
  }

  function update() {
    var p = product();
    var q = qty();
    $("[data-price]").textContent = money(p.price);
    var compare = $("[data-compare]");
    var saving = $("[data-saving]");
    compare.hidden = saving.hidden = !p.compareAt;
    if (p.compareAt) {
      compare.textContent = money(p.compareAt);
      saving.textContent = "Économisez " + money(p.compareAt - p.price);
    }
    var badge = $("[data-gallery-badge]");
    badge.hidden = !p.savingPct;
    badge.className = "badge badge--save gallery__badge";
    badge.textContent = "−" + p.savingPct + " %";
    $("[data-per-latte]").textContent = money(p.perLatte);
    $("[data-variant-name]").textContent = "· " + p.name;
    var btnPrice = $("[data-button-price]", addBtn);
    if (btnPrice) btnPrice.textContent = money(p.price * q);
    $("[data-sticky-name]").textContent = p.name + (q > 1 ? " × " + q : "");
    $("[data-sticky-price]").textContent = money(p.price * q);
    $('[data-qty-step="-1"]', form).disabled = q <= 1;
    $('[data-qty-step="1"]', form).disabled = q >= Cart.MAX_QTY;
    updateShipPreview();
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "format") {
      setGallery(product());
      var url = new URL(location.href);
      url.searchParams.set("format", selectedId());
      history.replaceState(null, "", url);
    }
    update();
  });
  $$("[data-qty-step]", form).forEach(function (b) {
    b.addEventListener("click", function () {
      qtyInput.value = Math.max(1, Math.min(Cart.MAX_QTY, qty() + parseInt(b.dataset.qtyStep, 10)));
      update();
    });
  });
  qtyInput.addEventListener("input", update);
  qtyInput.addEventListener("blur", function () { qtyInput.value = qty(); update(); });

  function addSelection() {
    var p = product();
    Cart.add(p.id, qty());
    addBtn.classList.add("is-success");
    addBtn.innerHTML = UI.icons.check + "<span>Ajouté au panier</span>";
    setTimeout(function () {
      addBtn.classList.remove("is-success");
      addBtn.innerHTML = addBtnHTML;
      update();
    }, 1600);
    setTimeout(UI.openCart, 300);
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); addSelection(); });
  Cart.onChange(function () { updateShipPreview(); });

  // Initial format from the URL (?format=coffret-3)
  var fromUrl = new URLSearchParams(location.search).get("format");
  if (fromUrl && DATA.products[fromUrl]) {
    $('input[name="format"][value="' + fromUrl + '"]', form).checked = true;
  }
  setGallery(product(), true);
  update();

  /* ---------- Sticky bar (phones) ---------- */

  var bar = $("[data-sticky-buy]");
  var barBtn = $("[data-sticky-add]");
  barBtn.addEventListener("click", addSelection);
  // A scroll check (not an IntersectionObserver) so fast flings past the
  // button still reveal the bar.
  var barShown = null;
  var ticking = false;
  function syncBar() {
    ticking = false;
    var visible = addBtn.getBoundingClientRect().bottom < 0;
    if (visible === barShown) return;
    barShown = visible;
    bar.classList.toggle("is-visible", visible);
    bar.setAttribute("aria-hidden", String(!visible));
    barBtn.tabIndex = visible ? 0 : -1;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(syncBar); }
  }, { passive: true });
  window.addEventListener("resize", syncBar);
  syncBar();
})();
