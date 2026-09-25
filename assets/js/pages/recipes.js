/* Recipes page: category filter. */
(function () {
  "use strict";
  var UI = window.UbeUI;
  var group = UI.$("[data-recipe-filter]");
  var cards = UI.$$("[data-recipe-list] .recipe-card");
  var count = UI.$("[data-recipe-count]");
  if (!group) return;

  group.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-filter]");
    if (!chip) return;
    var filter = chip.dataset.filter;
    UI.$$("[data-filter]", group).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
    var shown = 0;
    cards.forEach(function (card) {
      var match = filter === "all" || card.dataset.category === filter;
      card.hidden = !match;
      if (match) shown++;
    });
    count.textContent = shown + " recette" + (shown > 1 ? "s" : "");
  });
})();
