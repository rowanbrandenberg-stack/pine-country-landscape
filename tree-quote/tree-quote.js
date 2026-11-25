(function () {
  "use strict";
  var P = window.PCL_CONFIG.christmas.pricing, T = window.PCLTreePricing;
  var form = document.getElementById("tq-form"), KEY = "pcl_tree_quote_draft";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  $("[data-bands]").insertAdjacentHTML("beforeend", P.bands.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.label) + "</option>"; }).join(""));

  var localNow = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  var toIso = function (v) { if (!v) return ""; var t = new Date(v); return isNaN(t) ? "" : t.toISOString(); };

  var addExtra = function (x) {
    x = x || {};
    var row = document.createElement("div"); row.className = "x-row";
    row.innerHTML = '<input data-x="label" placeholder="Extra, e.g. second floor carry" value="' + esc(x.label) + '">' +
      '<input data-x="amount" type="number" step="0.01" placeholder="$" value="' + esc(x.amount) + '">' +
      '<label class="chk"><input data-x="reviewed" type="checkbox"' + (x.reviewed ? " checked" : "") + '> Reviewed</label>' +
      '<button type="button" data-x-rm aria-label="Remove extra">&times;</button>';
    $("[data-extras]").appendChild(row);
    $("[data-x-rm]", row).addEventListener("click", function () { row.remove(); update(); });
  };

  var read = function () {
    var v = function (n) { var el = form.elements[n]; return el.type === "checkbox" ? el.checked : el.value; };
    var extras = $$("[data-extras] .x-row").map(function (r) { return { label: $('[data-x="label"]', r).value, amount: $('[data-x="amount"]', r).value, reviewed: $('[data-x="reviewed"]', r).checked }; });
    var stOk = v("s_okHeight") && v("s_okTrunk") && v("s_okSpec");
    return {
      customer: v("customer"),
      input: {
        bandId: v("bandId") || null,
        heightFt: v("heightFt") === "" ? null : Number(v("heightFt")),
        deliveryOnly: v("deliveryOnly"),
        sourcing: v("sourcing"),
        tree: { supplier: v("t_supplier").trim(), species: v("t_species").trim(), heightFt: v("t_heightFt") === "" ? null : Number(v("t_heightFt")), price: v("t_price"),
          availability: v("t_availability"), verifiedAt: toIso(v("t_verifiedAt")), customerApproved: v("t_customerApproved") },
        pickupNeeded: v("pickupNeeded") === "yes" ? true : v("pickupNeeded") === "no" ? false : null,
        stand: { mode: v("s_mode"), model: v("s_model").trim(), price: v("s_price"), availability: v("s_availability"), verifiedAt: toIso(v("s_verifiedAt")),
          suitability: v("s_bad") ? { checked: true, ok: false, notes: v("s_notes") } : { checked: stOk, ok: stOk ? true : null, notes: v("s_notes") } },
        removal: v("removal"),
        accessFlags: v("accessFlags").split(";").map(function (s) { return s.trim(); }).filter(Boolean),
        accessReviewed: v("accessReviewed"),
        extras: extras
      }
    };
  };

  var save = function () {
    var d = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) d[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    d._extras = $$("[data-extras] .x-row").map(function (r) { return { label: $('[data-x="label"]', r).value, amount: $('[data-x="amount"]', r).value, reviewed: $('[data-x="reviewed"]', r).checked }; });
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (x) {}
  };
  var load = function () {
    var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (x) {}
    if (!d) return;
    Object.keys(d).forEach(function (k) { var el = form.elements[k]; if (!el || k === "_extras") return; if (el.type === "checkbox") el.checked = !!d[k]; else el.value = d[k]; });
    (d._extras || []).forEach(addExtra);
  };

  var last = null;
  var update = function () {
    $$("[data-if]", form).forEach(function (box) { var p = box.getAttribute("data-if").split("="); box.hidden = form.elements[p[0]].value !== p[1]; });
    var r = read(), q = T.buildQuote(r.input, P);
    last = { r: r, q: q };
    var k = $("[data-kind]"); k.textContent = q.label; k.className = "tq-kind " + q.kind;
    $("[data-lines]").innerHTML = q.lines.map(function (l) {
      var amt = l.status === "priced" ? T.money(l.cents) : l.status === "omitted" ? l.note : (l.status === "custom" ? "Custom" : "To confirm");
      return "<li><span>" + esc(l.label) + "</span><b>" + esc(amt) + "</b></li>";
    }).join("") + q.taxLines.map(function (t) { return "<li><span>" + esc(t.label) + " (" + (t.rate * 100).toFixed(3).replace(/\.?0+$/, "") + "%)</span><b>" + esc(T.money(t.cents)) + "</b></li>"; }).join("");
    $("[data-total]").textContent = q.kind === "final" ? "Total " + T.money(q.totalCents) : "Known so far " + T.money(q.knownCents) + " (not a total)";
    var gaps = q.custom.concat(q.gaps);
    $("[data-gaps-wrap]").hidden = !gaps.length;
    $("[data-gaps]").innerHTML = gaps.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("");
    $("[data-text]").value = T.quoteText(q, { customer: r.customer.trim() });
    save();
  };

  $$("[data-now]").forEach(function (b) { b.addEventListener("click", function () { form.elements[b.getAttribute("data-now")].value = localNow(); update(); }); });
  $("[data-add-extra]").addEventListener("click", function () { addExtra({}); update(); });
  form.addEventListener("input", update); form.addEventListener("change", update);
  $("[data-reset]").addEventListener("click", function () { if (!confirmReset()) return; try { localStorage.removeItem(KEY); } catch (x) {} form.reset(); $("[data-extras]").innerHTML = ""; update(); });
  // No browser dialogs: a second click within 4 seconds confirms the reset.
  var armed = 0; function confirmReset() { var b = $("[data-reset]"); if (Date.now() - armed < 4000) { b.textContent = "Start over"; return true; } armed = Date.now(); b.textContent = "Click again to clear"; setTimeout(function () { b.textContent = "Start over"; }, 4000); return false; }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!last) return;
      var what = b.getAttribute("data-copy");
      var txt = what === "text" ? last.q && $("[data-text]").value : JSON.stringify({
        recordedAt: new Date().toISOString(), customer: last.r.customer, quoteKind: last.q.kind, heightFt: last.q.heightFt, band: last.q.band && last.q.band.id,
        tree: last.r.input.sourcing === "pine" ? last.r.input.tree : { sourcing: last.r.input.sourcing, pickupNeeded: last.r.input.pickupNeeded },
        stand: last.r.input.stand, removal: last.r.input.removal, extras: last.r.input.extras,
        lines: last.q.lines.map(function (l) { return { item: l.label, cents: l.cents, status: l.status }; }), taxCents: last.q.taxCents, totalCents: last.q.totalCents, openItems: last.q.custom.concat(last.q.gaps)
      }, null, 2);
      var done = function () { $("[data-copied]").textContent = (what === "text" ? "Quote text" : "Record") + " copied."; };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { $("[data-text]").select(); });
      else { $("[data-text]").select(); }
    });
  });

  load(); update();
})();
