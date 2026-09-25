/* Checkout: order summary + client-side validation of the delivery form.
   Payment is handed off to a payment provider (to be connected); until then
   a valid form shows an explanatory message instead of charging anything. */
(function () {
  "use strict";
  var Cart = window.UbeCart;
  var UI = window.UbeUI;
  var $ = UI.$, $$ = UI.$$, money = Cart.money;

  var form = $("[data-checkout-form]");
  if (!form) return;

  function render() {
    var lines = Cart.lines();
    $("[data-checkout-filled]").hidden = !lines.length;
    $("[data-checkout-empty]").hidden = !!lines.length;
    if (!lines.length) return;
    $("[data-checkout-items]").innerHTML = lines.map(function (l) { return UI.lineItemHTML(l, { readonly: true }); }).join("");
    var sub = Cart.subtotal();
    var ship = Cart.shipping(sub);
    var shipText = ship === 0 ? "Offerte" : money(ship);
    $("[data-checkout-subtotal]").textContent = money(sub);
    $("[data-checkout-shipping]").textContent = shipText;
    $("[data-checkout-ship-price]").textContent = shipText;
    $("[data-checkout-total]").textContent = money(sub + ship);
    $("[data-checkout-pay]").textContent = money(sub + ship);
  }
  Cart.onChange(render);

  // Keep what the visitor typed if they go back to the cart
  var KEY = "ube-halaya-checkout";
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    Object.keys(saved).forEach(function (name) {
      var el = form.elements[name];
      if (el && el.type !== "checkbox") el.value = saved[name];
    });
  } catch (e) { /* ignore */ }
  form.addEventListener("input", function () {
    var data = {};
    $$("input:not([type=checkbox]), select", form).forEach(function (el) { data[el.name] = el.value; });
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  });

  function validateField(input) {
    var field = input.closest(".field");
    if (!field) return true;
    var ok = input.checkValidity() && (!input.required || input.value.trim() !== "");
    field.classList.toggle("is-invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }
  $$(".field .input, .field .select", form).forEach(function (input) {
    input.addEventListener("blur", function () { if (input.value) validateField(input); });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("is-invalid")) validateField(input);
    });
  });

  var terms = form.elements.terms;
  var termsError = $("[data-terms-error]");
  terms.addEventListener("change", function () { termsError.classList.toggle("is-visible", !terms.checked); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    $$(".field .input[required], .field .input[pattern]", form).forEach(function (input) {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    termsError.classList.toggle("is-visible", !terms.checked);
    if (!terms.checked && !firstInvalid) firstInvalid = terms;
    var status = $("[data-checkout-status]");
    if (firstInvalid) {
      firstInvalid.focus();
      status.hidden = true;
      return;
    }
    status.hidden = false;
    status.innerHTML =
      '<p class="note">' + UI.icons.check +
      "<span><strong>Vos informations sont prêtes.</strong> Le paiement en ligne sera activé très prochainement : votre panier et vos coordonnées sont conservés d’ici là. Besoin de commander dès maintenant ? " +
      '<a href="contact.html">Écrivez-nous</a>.</span></p>';
    status.scrollIntoView({ behavior: UI.reduceMotion ? "auto" : "smooth", block: "center" });
  });
})();
