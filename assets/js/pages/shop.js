/* Shop page: sort the product list. */
(function () {
  "use strict";
  var UI = window.UbeUI;
  var select = UI.$("[data-sort]");
  var list = UI.$("[data-product-list]");
  if (!select || !list) return;

  var sorters = {
    "order": function (a, b) { return a.dataset.order - b.dataset.order; },
    "price-asc": function (a, b) { return a.dataset.price - b.dataset.price; },
    "price-desc": function (a, b) { return b.dataset.price - a.dataset.price; },
    "per-latte": function (a, b) { return a.dataset.perLatte - b.dataset.perLatte; }
  };

  select.addEventListener("change", function () {
    UI.$$("[data-product-card]", list)
      .sort(sorters[select.value] || sorters.order)
      .forEach(function (card) { list.appendChild(card); });
  });
})();
