/* FAQ page: instant search across questions and answers. */
(function () {
  "use strict";
  var UI = window.UbeUI;
  var input = UI.$("[data-faq-search]");
  if (!input) return;
  var groups = UI.$$("[data-faq-group]");
  var empty = UI.$("[data-faq-empty]");

  function normalize(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  input.addEventListener("input", function () {
    var q = normalize(input.value.trim());
    var total = 0;
    groups.forEach(function (group) {
      var visible = 0;
      UI.$$("details", group).forEach(function (d) {
        var match = !q || normalize(d.textContent).indexOf(q) !== -1;
        d.hidden = !match;
        if (q && match) d.open = true;
        if (!q) d.open = false;
        if (match) visible++;
      });
      group.hidden = visible === 0;
      total += visible;
    });
    empty.hidden = total !== 0;
  });

  // Open the question targeted by a link such as faq.html#livraison
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    var first = target && UI.$("details", target);
    if (first) first.open = true;
  }
})();
