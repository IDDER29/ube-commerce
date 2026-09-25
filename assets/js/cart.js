/* Cart store — the single source of truth for what the visitor is buying.
   Persists to localStorage and keeps every open tab in sync.
   Exposes window.UbeCart. Depends on window.UBE_DATA (data.js). */
(function () {
  "use strict";

  var DATA = window.UBE_DATA;
  var KEY = "ube-halaya-cart-v2";
  var MAX_QTY = 20;
  var listeners = [];

  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  function money(n) { return euro.format(n).replace(/ /g, " "); }

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      var clean = {};
      Object.keys(raw || {}).forEach(function (id) {
        var q = parseInt(raw[id], 10);
        if (DATA.products[id] && q > 0) clean[id] = Math.min(MAX_QTY, q);
      });
      return clean;
    } catch (e) { return {}; }
  }

  var items = read();

  function persist(detail) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode: cart lives for this page only */ }
    emit(detail);
  }
  function emit(detail) {
    listeners.forEach(function (fn) { fn(api, detail || {}); });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { items = read(); emit({ external: true }); }
  });

  function clampQty(q) {
    q = parseInt(q, 10);
    if (isNaN(q)) return 1;
    return Math.max(0, Math.min(MAX_QTY, q));
  }

  var api = {
    MAX_QTY: MAX_QTY,
    money: money,
    product: function (id) { return DATA.products[id]; },
    lines: function () {
      return Object.keys(items).map(function (id) {
        var p = DATA.products[id];
        return { id: id, qty: items[id], product: p, total: p.price * items[id] };
      });
    },
    qty: function (id) { return items[id] || 0; },
    count: function () { return Object.keys(items).reduce(function (s, id) { return s + items[id]; }, 0); },
    subtotal: function () {
      return Object.keys(items).reduce(function (s, id) { return s + DATA.products[id].price * items[id]; }, 0);
    },
    shipping: function (subtotal) {
      var sub = subtotal == null ? api.subtotal() : subtotal;
      return sub === 0 || sub >= DATA.freeShipping ? 0 : DATA.shippingCost;
    },
    total: function () { var s = api.subtotal(); return s + api.shipping(s); },
    freeShippingLeft: function (extra) {
      return Math.max(0, DATA.freeShipping - api.subtotal() - (extra || 0));
    },
    add: function (id, qty) {
      if (!DATA.products[id]) return;
      items[id] = Math.min(MAX_QTY, (items[id] || 0) + (clampQty(qty) || 1));
      persist({ added: id });
    },
    set: function (id, qty) {
      if (!DATA.products[id]) return;
      qty = clampQty(qty);
      if (qty === 0) delete items[id];
      else items[id] = qty;
      persist();
    },
    remove: function (id) { delete items[id]; persist(); },
    clear: function () { items = {}; persist(); },
    onChange: function (fn) { listeners.push(fn); fn(api, { initial: true }); }
  };

  window.UbeCart = api;
})();
