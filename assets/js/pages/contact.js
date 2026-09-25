/* Contact form: validates, then opens the visitor's e-mail app with the
   message pre-filled (no server needed). Swap for a form service later. */
(function () {
  "use strict";
  var UI = window.UbeUI;
  var form = UI.$("[data-contact-form]");
  if (!form) return;
  var status = UI.$("[data-contact-status]", form);

  function check(el) {
    var field = el.closest(".field");
    var ok = el.checkValidity() && el.value.trim() !== "";
    field.classList.toggle("is-invalid", !ok);
    el.setAttribute("aria-invalid", String(!ok));
    return ok;
  }
  UI.$$("[required]", form).forEach(function (el) {
    el.addEventListener("blur", function () { if (el.value) check(el); });
    el.addEventListener("input", function () { if (el.closest(".field").classList.contains("is-invalid")) check(el); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalid = UI.$$("[required]", form).filter(function (el) { return !check(el); });
    if (invalid.length) { invalid[0].focus(); return; }
    var f = form.elements;
    var body = f.message.value + "\n\n— " + f.name.value + " (" + f.email.value + ")" + (f.order.value ? "\nCommande : " + f.order.value : "");
    var href = "mailto:" + form.dataset.email +
      "?subject=" + encodeURIComponent("[" + f.subject.value + "] " + f.name.value) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    status.hidden = false;
    status.innerHTML = '<p class="note">' + UI.icons.check +
      "<span><strong>Votre messagerie s’ouvre avec votre message prêt à partir.</strong> Rien ne s’est ouvert ? Écrivez-nous directement à " +
      '<a href="mailto:' + form.dataset.email + '">' + form.dataset.email + "</a>.</span></p>";
  });
})();
