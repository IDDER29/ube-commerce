/* Collection page: filters (format, price, offer), sorting, mobile drawer. */
(function () {
  "use strict";
  var UI = window.UbeUI;
  var DATA = window.UBE_DATA;
  var $ = UI.$, $$ = UI.$$;

  var list = $("[data-product-list]");
  var panel = $("[data-filters]");
  if (!list || !panel) return;
  var cards = $$("[data-product-card]", list);
  var sort = $("[data-sort]");
  var chips = $("[data-active-filters]");

  var sorters = {
    "order": function (a, b) { return a.dataset.order - b.dataset.order; },
    "price-asc": function (a, b) { return a.dataset.price - b.dataset.price; },
    "price-desc": function (a, b) { return b.dataset.price - a.dataset.price; },
    "per-latte": function (a, b) { return a.dataset.perLatte - b.dataset.perLatte; }
  };

  function checked(name) { return $$('input[name="' + name + '"]:checked', panel); }

  function apply() {
    var cans = checked("cans").map(function (i) { return i.value; });
    var prices = checked("price").map(function (i) { return i.value.split("-").map(Number); });
    var offers = checked("offer").map(function (i) { return i.value; });
    var shown = 0;
    cards.forEach(function (card) {
      var p = DATA.products[card.dataset.id];
      var ok = (!cans.length || cans.indexOf(String(p.cans)) !== -1) &&
        (!prices.length || prices.some(function (r) { return p.price >= r[0] && p.price < r[1]; })) &&
        (offers.indexOf("sale") === -1 || !!p.compareAt) &&
        (offers.indexOf("free-shipping") === -1 || p.price >= DATA.freeShipping);
      card.hidden = !ok;
      if (ok) shown++;
    });
    $("[data-product-count]").textContent = shown + " produit" + (shown > 1 ? "s" : "");
    $("[data-empty]").hidden = shown !== 0;
    var apply = $(".filters__apply");
    if (apply) apply.textContent = "Voir " + shown + " produit" + (shown > 1 ? "s" : "");

    var active = $$("input:checked", panel);
    chips.hidden = !active.length;
    chips.innerHTML = active.map(function (i) {
      return '<button type="button" data-uncheck="' + i.name + ":" + i.value + '" aria-label="Retirer le filtre ' + UI.esc(i.parentElement.textContent.trim()) + '">' + UI.esc(i.parentElement.textContent.replace(/\(\d+\)/, "").trim()) + "</button>";
    }).join("");
  }

  panel.addEventListener("change", apply);
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-uncheck]");
    if (!b) return;
    var parts = b.dataset.uncheck.split(":");
    $('input[name="' + parts[0] + '"][value="' + parts[1] + '"]', panel).checked = false;
    apply();
  });
  $$("[data-clear-filters]").forEach(function (b) {
    b.addEventListener("click", function () { $$("input:checked", panel).forEach(function (i) { i.checked = false; }); apply(); });
  });
  sort.addEventListener("change", function () {
    cards.slice().sort(sorters[sort.value] || sorters.order).forEach(function (c) { list.appendChild(c); });
  });

  // Mobile drawer
  var lastFocus = null;
  function openFilters() {
    lastFocus = document.activeElement;
    document.body.classList.add("filters-open");
    setTimeout(function () { $(".filters__close", panel).focus(); }, 60);
  }
  function closeFilters() {
    if (!document.body.classList.contains("filters-open")) return;
    document.body.classList.remove("filters-open");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$("[data-open-filters]").forEach(function (b) { b.addEventListener("click", openFilters); });
  $$("[data-close-filters]").forEach(function (b) { b.addEventListener("click", closeFilters); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeFilters(); });

  apply();
})();
