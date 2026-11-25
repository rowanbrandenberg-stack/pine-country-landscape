/*
  Christmas tree pricing for Pine Country Landscape.
  Pure functions, no network, no side effects. Used by the tree form (estimates),
  /tree-quote/ (Rowan's quote builder) and tests/pricing.test.js.

  Rates live in config.js (christmas.pricing). Nothing here hardcodes a price.

  Rules this enforces:
  - Quote = tree + stand if needed + install service + optional removal + reviewed extras + configured tax.
  - A result is only ever "final" when every cost is verified: the customer approved tree (supplier, species,
    actual height, price, availability, verification time), the stand, every extra reviewed, access reviewed
    when needed, and tax treatment reviewed. Anything else is an "estimate" or a "custom" quote.
  - Unknown stays unknown: a missing price is never filled in or guessed.
  - This module never books, buys, charges or messages anyone.
*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PCLTreePricing = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var cents = function (dollars) { return Math.round(Number(dollars) * 100); };
  var isNum = function (v) { return typeof v === "number" && isFinite(v); };
  var money = function (c) {
    if (!isNum(c)) return "";
    var neg = c < 0, s = (Math.abs(c) / 100).toFixed(2).replace(/\.00$/, "");
    var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "minus $" : "$") + p.join(".");
  };

  // Band for an actual tree height in feet. Boundaries are inclusive on the top: 4.0 is "up to 4", 4.01 is the next band.
  function bandForHeight(feet, P) {
    var h = Number(feet);
    if (!isFinite(h) || h <= 0) return null;
    var bands = P.bands || [];
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      if (b.upToFt == null || h <= b.upToFt + 1e-9) return b;
    }
    return null;
  }
  function bandById(id, P) {
    var bands = P.bands || [];
    for (var i = 0; i < bands.length; i++) if (bands[i].id === id) return bands[i];
    return null;
  }

  function hoursOld(iso, now) {
    var t = Date.parse(iso);
    if (!isFinite(t)) return Infinity;
    return (now - t) / 36e5;
  }

  /*
    input = {
      heightFt: 7.5,            // actual height, needed for a final quote
      bandId: "to8",            // a customer's picked band, used when heightFt is not known yet
      deliveryOnly: false,      // delivery with no install: always custom
      sourcing: "pine" | "customer" | "unsure",
      tree: { supplier, species, heightFt, price, availability: "available"|"unavailable"|"unknown", verifiedAt, customerApproved },
      pickupNeeded: true|false|null,   // customer supplied tree: does Pine still pick it up?
      stand: { mode: "pine"|"customer"|"unsure", model, price, availability, verifiedAt,
               suitability: { checked: bool, ok: bool, notes } },
      removal: false,
      accessFlags: ["Stairs: One flight"],  // things that need a review before a final quote
      accessReviewed: false,
      extras: [{ label, amount, reviewed: true }]
    }
  */
  function buildQuote(input, P, nowMs) {
    input = input || {}; P = P || {};
    var now = isNum(nowMs) ? nowMs : Date.now();
    var maxAge = isNum(P.verifyMaxAgeHours) ? P.verifyMaxAgeHours : 48;
    var gaps = [], lines = [], custom = [];
    var gap = function (msg) { if (gaps.indexOf(msg) < 0) gaps.push(msg); };

    // 1. Height band
    var actual = isNum(Number(input.heightFt)) && Number(input.heightFt) > 0 && input.heightFt !== "" && input.heightFt != null ? Number(input.heightFt) : null;
    var tree = input.tree || {};
    if (actual == null && input.sourcing === "pine" && isNum(Number(tree.heightFt)) && Number(tree.heightFt) > 0 && tree.heightFt !== "" && tree.heightFt != null) actual = Number(tree.heightFt);
    var band = actual != null ? bandForHeight(actual, P) : (input.bandId ? bandById(input.bandId, P) : null);
    if (actual == null) gap(band ? "Actual tree height not measured yet (estimate uses the picked size range)." : "Tree height not known yet.");
    if (actual != null && input.bandId && band && input.bandId !== band.id) gap("Actual height (" + actual + " ft) is in a different size range than the customer picked. Confirm with the customer.");

    if (input.deliveryOnly && P.deliveryOnlyCustom !== false) custom.push("Delivery only has no set rate yet.");
    if (band && band.custom) custom.push(band.label + " trees are quoted individually.");

    // 2. Service line
    if (band && !band.custom && !input.deliveryOnly) {
      lines.push({ key: "service", label: "Pickup, local delivery and install (" + band.label + ")", cents: cents(band.service), type: "service", status: "priced" });
      if (band.accessReview && !input.accessReviewed) gap(band.label + ": the install price holds after an access review.");
    } else if (!band) {
      lines.push({ key: "service", label: "Pickup, local delivery and install", cents: null, type: "service", status: "pending", note: "Depends on tree height" });
    } else {
      lines.push({ key: "service", label: input.deliveryOnly ? "Delivery only" : "Pickup, local delivery and install (" + band.label + ")", cents: null, type: "service", status: "custom", note: "Custom quote" });
    }

    // 3. Tree
    var src = input.sourcing || "unsure";
    if (src === "pine") {
      var tPrice = tree.price === "" || tree.price == null ? null : Number(tree.price);
      var tOk = isNum(tPrice) && tPrice >= 0;
      var desc = [tree.species, tree.heightFt ? tree.heightFt + " ft" : "", tree.supplier ? "from " + tree.supplier : ""].filter(Boolean).join(", ");
      lines.push({ key: "tree", label: "Tree" + (desc ? " (" + desc + ")" : ""), cents: tOk ? cents(tPrice) : null, type: "tree", status: tOk ? "priced" : "pending", note: tOk ? "" : "Priced individually" });
      if (!tree.supplier) gap("Tree supplier not recorded.");
      if (!tree.species) gap("Tree species not recorded.");
      if (!(Number(tree.heightFt) > 0)) gap("Tree actual height not recorded.");
      if (!tOk) gap("Tree price not confirmed with the supplier.");
      if (tree.availability !== "available") gap(tree.availability === "unavailable" ? "Tree is not available. Pick another tree with the customer (no substitutions without their approval)." : "Tree availability unknown.");
      if (!tree.verifiedAt) gap("Tree price and availability have no verification time.");
      else if (hoursOld(tree.verifiedAt, now) > maxAge) gap("Tree price was verified more than " + maxAge + " hours ago. Check it again.");
      if (!tree.customerApproved) gap("Customer has not approved this specific tree.");
    } else if (src === "customer") {
      lines.push({ key: "tree", label: "Tree", cents: 0, type: "tree", status: "omitted", note: "Customer supplies the tree" });
      if (input.pickupNeeded !== true && input.pickupNeeded !== false) gap("Customer has their own tree: confirm whether pickup is needed.");
    } else {
      lines.push({ key: "tree", label: "Tree", cents: null, type: "tree", status: "pending", note: "Priced individually" });
      gap("Not decided yet whether Pine sources the tree or the customer supplies it.");
    }

    // 4. Stand
    var st = input.stand || {};
    var stMode = st.mode || "unsure";
    var suit = st.suitability || {};
    if (stMode === "customer" && suit.checked && suit.ok === false) {
      gap("Customer stand is not suitable for this tree. Quote a stand instead.");
      lines.push({ key: "stand", label: "Stand", cents: null, type: "stand", status: "pending", note: "Customer stand not suitable" });
    } else if (stMode === "customer") {
      lines.push({ key: "stand", label: "Stand", cents: 0, type: "stand", status: "omitted", note: suit.checked && suit.ok ? "Customer stand, checked" : "Customer stand, needs a fit check" });
      if (!(suit.checked && suit.ok === true)) gap("Customer stand not checked yet against tree height, trunk diameter and the stand maker's specs.");
    } else if (stMode === "pine") {
      var sPrice = st.price === "" || st.price == null ? null : Number(st.price);
      var sOk = isNum(sPrice) && sPrice >= 0;
      lines.push({ key: "stand", label: "Stand" + (st.model ? " (" + st.model + ")" : ""), cents: sOk ? cents(sPrice) : null, type: "stand", status: sOk ? "priced" : "pending", note: sOk ? "" : "Priced individually" });
      if (!st.model) gap("Stand model not recorded.");
      if (!sOk) gap("Stand price not confirmed.");
      if (st.availability !== "available") gap(st.availability === "unavailable" ? "Stand is not available." : "Stand availability unknown.");
      if (!st.verifiedAt) gap("Stand price has no verification time.");
      else if (hoursOld(st.verifiedAt, now) > maxAge) gap("Stand price was verified more than " + maxAge + " hours ago. Check it again.");
    } else {
      lines.push({ key: "stand", label: "Stand", cents: null, type: "stand", status: "pending", note: "Priced individually if needed" });
      gap("Not decided yet whether a stand is needed.");
    }

    // 5. Optional removal: priced from the same band, scheduled separately, reserves nothing.
    if (input.removal) {
      var rOk = band && !band.custom && isNum(band.removal);
      lines.push({ key: "removal", label: "Later removal" + (band ? " (" + band.label + ")" : ""), cents: rOk ? cents(band.removal) : null, type: "removal",
        status: rOk ? "priced" : (band && band.custom ? "custom" : "pending"), note: "Scheduled separately. Not reserved." });
      if (band && band.custom) custom.push("Removal for " + band.label + " trees is quoted individually.");
    }

    // 6. Access and reviewed extras. Never priced automatically.
    var flags = (input.accessFlags || []).filter(Boolean);
    if (flags.length && !input.accessReviewed) gap("Access needs a review before the final quote: " + flags.join("; ") + ".");
    (input.extras || []).forEach(function (x, i) {
      var a = x && (x.amount === "" || x.amount == null ? null : Number(x.amount));
      var ok = x && x.reviewed === true && isNum(a) && String(x.label || "").trim();
      if (ok) lines.push({ key: "extra" + i, label: String(x.label).trim(), cents: cents(a), type: "extra", status: "priced" });
      else gap("Extra \"" + ((x && x.label) || "unnamed") + "\" is not reviewed or has no amount, so it is left out.");
    });

    // 7. Totals
    var known = 0, allKnown = true;
    lines.forEach(function (l) { if (isNum(l.cents)) known += l.cents; else allKnown = false; });

    var tax = P.tax || {}, taxCents = null, taxLines = [];
    if (tax.reviewed === true) {
      taxCents = 0;
      (tax.lines || []).forEach(function (t) {
        var base = 0, applies = t.appliesTo || [];
        lines.forEach(function (l) { if (isNum(l.cents) && applies.indexOf(l.type) >= 0) base += l.cents; });
        var amt = Math.round(base * Number(t.rate || 0));
        taxLines.push({ label: t.name || "Tax", rate: Number(t.rate || 0), baseCents: base, cents: amt });
        taxCents += amt;
      });
    } else gap("Tax treatment not reviewed yet (config.js christmas.pricing.tax).");

    var kind = custom.length ? "custom" : (gaps.length || !allKnown ? "estimate" : "final");
    var total = kind === "final" ? known + taxCents : null;

    return {
      kind: kind,
      label: kind === "final" ? "Final quote" : kind === "custom" ? "Custom quote" : "Estimate",
      band: band,
      heightFt: actual,
      lines: lines,
      knownCents: known,
      taxCents: taxCents,
      taxLines: taxLines,
      totalCents: total,
      custom: custom,
      gaps: gaps
    };
  }

  // Customer facing estimate from the tree form. Always "estimate" or "custom", never "final".
  function formEstimate(f, P) {
    var stand = f.stand === "I have a stand" ? { mode: "customer" } : f.stand === "I need a stand" ? { mode: "pine" } : { mode: "unsure" };
    var q = buildQuote({
      bandId: f.bandId || null,
      deliveryOnly: !!f.deliveryOnly,
      sourcing: f.hasTree === "Yes, I have it" ? "customer" : f.hasTree === "No, I still need one" ? "pine" : "unsure",
      stand: stand,
      removal: !!f.removal,
      accessFlags: f.accessFlags || []
    }, P);
    if (q.kind === "final") q.kind = "estimate"; // a form can never produce a final quote
    q.label = q.kind === "custom" ? "Custom quote" : "Estimate";
    return q;
  }

  // Plain text version for Rowan to copy into a text or email. Never says booked, charged or confirmed.
  function quoteText(q, opts) {
    opts = opts || {};
    var out = [q.label + (opts.customer ? " for " + opts.customer : "") + ": Christmas tree install"];
    q.lines.forEach(function (l) {
      out.push(l.label + ": " + (isNum(l.cents) && l.status !== "omitted" ? money(l.cents) : l.note || "To be confirmed") + (l.status === "priced" && l.note ? " (" + l.note + ")" : ""));
    });
    q.taxLines.forEach(function (t) { out.push(t.label + ": " + money(t.cents)); });
    if (q.kind === "final") out.push("Total: " + money(q.totalCents));
    else out.push("Known so far: " + money(q.knownCents) + ". Exact total confirmed before purchase.");
    if (q.lines.some(function (l) { return l.key === "removal"; })) out.push("Removal is scheduled separately. No date is reserved yet.");
    out.push("Nothing is purchased or scheduled until you approve.");
    return out.join("\n");
  }

  return { bandForHeight: bandForHeight, bandById: bandById, buildQuote: buildQuote, formEstimate: formEstimate, quoteText: quoteText, money: money, cents: cents };
});
