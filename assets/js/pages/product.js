/* Product page: format selector, gallery, quantity, add to cart and the
   sticky add-to-cart bar on phones. */
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
  var zoomBtn = $("[data-gallery-zoom]", gallery);
  var ALTS = ["", "Latte à l’ube marbré", "Bol de poudre d’ube", "Canettes Éclat d’Ubé"];
  var images = [];
  var current = 0;

  function setZoom(on) {
    mainWrap.classList.toggle("is-zoomed", on);
    zoomBtn.setAttribute("aria-label", on ? "Réduire l’image" : "Agrandir l’image");
  }
  function show(i, instant) {
    current = (i + images.length) % images.length;
    var img = images[current];
    setZoom(false);
    $$("button", thumbsWrap).forEach(function (b, n) { b.setAttribute("aria-pressed", String(n === current)); });
    if (mainImg.getAttribute("src") === img.src) return;
    if (instant || UI.reduceMotion) { mainImg.src = img.src; mainImg.alt = img.alt; return; }
    mainImg.classList.add("is-fading");
    setTimeout(function () {
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      if (mainImg.complete) mainImg.classList.remove("is-fading");
      else mainImg.onload = function () { mainImg.classList.remove("is-fading"); };
    }, 160);
  }
  function setGallery(p, instant) {
    images = p.gallery.map(function (src, n) {
      return { src: src, alt: n === 0 ? p.fullName : ALTS[n] || p.name };
    });
    thumbsWrap.innerHTML = images.map(function (img, n) {
      return '<button type="button" aria-pressed="' + (n === 0) + '"><img src="' + img.src + '" alt="' + UI.esc(img.alt) + '" width="120" height="120"></button>';
    }).join("");
    show(0, instant);
  }

  thumbsWrap.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) show($$("button", thumbsWrap).indexOf(b));
  });
  zoomBtn.addEventListener("click", function () { setZoom(!mainWrap.classList.contains("is-zoomed")); });
  mainImg.addEventListener("click", function () { setZoom(!mainWrap.classList.contains("is-zoomed")); });
  mainWrap.addEventListener("mousemove", function (e) {
    if (!mainWrap.classList.contains("is-zoomed")) return;
    var r = mainWrap.getBoundingClientRect();
    mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width) * 100 + "% " + ((e.clientY - r.top) / r.height) * 100 + "%";
  });
  // Swipe between photos on touch screens
  var touchX = null;
  mainWrap.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  mainWrap.addEventListener("touchend", function (e) {
    if (touchX === null || mainWrap.classList.contains("is-zoomed")) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Selection & pricing ---------- */

  function update() {
    var p = product();
    var q = qty();
    $("[data-price]").textContent = money(p.price);
    var saving = $("[data-saving]");
    saving.hidden = !p.compareAt;
    if (p.compareAt) saving.textContent = "Économisez " + money(p.compareAt - p.price);
    $("[data-per-latte]").textContent = money(p.perLatte);
    $("[data-spec-content]").textContent = p.cans === 1
      ? "1 canette de poudre d’ube de 50 g"
      : p.cans + " canettes de poudre d’ube de 50 g (" + p.cans * 50 + " g)";
    $("[data-spec-yield]").textContent = "Jusqu’à " + p.lattes + " lattes à 2 g";
    var btnPrice = $("[data-button-price]", addBtn);
    if (btnPrice) btnPrice.textContent = money(p.price * q);
    $("[data-sticky-name]").textContent = p.variantLabel + (q > 1 ? " × " + q : "");
    $("[data-sticky-price]").textContent = money(p.price * q);
    $('[data-qty-step="-1"]', form).disabled = q <= 1;
    $('[data-qty-step="1"]', form).disabled = q >= Cart.MAX_QTY;
  }

  function selectFormat(id, opts) {
    var radio = $('input[name="format"][value="' + id + '"]', form);
    if (!radio) return;
    radio.checked = true;
    setGallery(DATA.products[id], opts && opts.instant);
    update();
    if (!(opts && opts.keepUrl)) {
      var url = new URL(location.href);
      url.searchParams.set("format", id);
      history.replaceState(null, "", url);
    }
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "format") selectFormat(e.target.value);
    else update();
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
    Cart.add(selectedId(), qty());
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

  // "Découvrir le trio": pick the 3-can box without reloading the page
  $$("[data-select-format]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      selectFormat(a.dataset.selectFormat);
      form.scrollIntoView({ behavior: UI.reduceMotion ? "auto" : "smooth", block: "center" });
      UI.toast("Format sélectionné : " + DATA.products[a.dataset.selectFormat].variantLabel);
    });
  });

  // Initial format from the URL (?format=coffret-3)
  var fromUrl = new URLSearchParams(location.search).get("format");
  selectFormat(fromUrl && DATA.products[fromUrl] ? fromUrl : selectedId(), { instant: true, keepUrl: true });

  /* ---------- Sticky bar (phones) ---------- */

  var bar = $("[data-sticky-buy]");
  var barBtn = $("[data-sticky-add]");
  barBtn.addEventListener("click", addSelection);
  // A scroll check (not an IntersectionObserver) so a fast fling past the
  // button still reveals the bar.
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
