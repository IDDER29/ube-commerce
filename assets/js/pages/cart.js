/* Cart page: full list of items with the same controls as the drawer. */
(function () {
  "use strict";
  var Cart = window.UbeCart;
  var UI = window.UbeUI;
  var $ = UI.$, money = Cart.money;

  var list = $("[data-page-items]");
  if (!list) return;
  UI.bindLineControls(list);

  function render() {
    var lines = Cart.lines();
    var n = Cart.count();
    $("[data-cart-filled]").hidden = !lines.length;
    $("[data-cart-empty]").hidden = !!lines.length;
    $("[data-page-count]").textContent = n ? "(" + n + " article" + (n > 1 ? "s" : "") + ")" : "";
    if (!lines.length) return;

    list.innerHTML = lines.map(function (l) { return UI.lineItemHTML(l); }).join("");
    var sub = Cart.subtotal();
    var ship = Cart.shipping(sub);
    var savings = lines.reduce(function (s, l) {
      return s + (l.product.compareAt ? (l.product.compareAt - l.product.price) * l.qty : 0);
    }, 0);
    $("[data-page-subtotal]").textContent = money(sub);
    var shipEl = $("[data-page-shipping]");
    shipEl.textContent = ship === 0 ? "Offerte" : money(ship);
    shipEl.classList.toggle("is-free", ship === 0);
    $("[data-page-savings-row]").hidden = savings === 0;
    $("[data-page-savings]").textContent = "−" + money(savings);
    $("[data-page-total]").textContent = money(sub + ship);
    UI.shipMeterUpdate($("[data-page-ship]"));
  }

  Cart.onChange(render);
})();
