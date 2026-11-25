// Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const T = require("../pricing.js");

// Load the real config.js so tests check the live rate card.
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8"), sandbox);
const P = JSON.parse(JSON.stringify(sandbox.window.PCL_CONFIG.christmas.pricing));
const NOW = Date.parse("2026-12-01T18:00:00Z");
const fresh = "2026-12-01T16:00:00Z";
const stale = "2026-11-25T16:00:00Z";
const reviewedTax = Object.assign({}, P, { tax: { reviewed: true, lines: [] } });

const verified = (over = {}) => Object.assign({
  heightFt: 7,
  sourcing: "pine",
  tree: { supplier: "Test Lot", species: "Noble fir", heightFt: 7, price: 90, availability: "available", verifiedAt: fresh, customerApproved: true },
  stand: { mode: "pine", model: "Test Stand 2", price: 40, availability: "available", verifiedAt: fresh },
  removal: false
}, over);

test("rate card matches the approved table", () => {
  const rows = P.bands.map(b => [b.id, b.upToFt, b.service, b.removal, !!b.custom, !!b.accessReview]);
  assert.deepEqual(rows, [
    ["to4", 4, 99, 59, false, false],
    ["to6", 6, 149, 79, false, false],
    ["to8", 8, 199, 99, false, false],
    ["to10", 10, 299, 149, false, false],
    ["to11", 11, 399, 199, false, true],
    ["over11", null, undefined, undefined, true, false].map(v => v === undefined ? undefined : v)
  ]);
});

test("every height boundary lands in the right band", () => {
  const cases = [[0.5, "to4"], [4, "to4"], [4.01, "to6"], [6, "to6"], [6.01, "to8"], [8, "to8"], [8.01, "to10"],
    [10, "to10"], [10.01, "to11"], [11, "to11"], [11.01, "over11"], [16, "over11"]];
  for (const [h, id] of cases) assert.equal(T.bandForHeight(h, P).id, id, h + " ft");
  for (const bad of [0, -1, NaN, "abc", null]) assert.equal(T.bandForHeight(bad, P), null);
});

test("service and removal prices per band", () => {
  const want = { 3: [9900, 5900], 5: [14900, 7900], 7.5: [19900, 9900], 9: [29900, 14900], 10.5: [39900, 19900] };
  for (const h of Object.keys(want)) {
    const q = T.buildQuote(verified({ heightFt: +h, tree: Object.assign(verified().tree, { heightFt: +h }), removal: true, accessReviewed: true }), reviewedTax, NOW);
    assert.equal(q.lines.find(l => l.key === "service").cents, want[h][0]);
    assert.equal(q.lines.find(l => l.key === "removal").cents, want[h][1]);
  }
});

test("fully verified quote is final with an itemized total", () => {
  const q = T.buildQuote(verified({ removal: true, extras: [{ label: "Second floor carry", amount: 25, reviewed: true }] }), reviewedTax, NOW);
  assert.equal(q.kind, "final", q.gaps.join(" | "));
  assert.deepEqual(q.lines.map(l => [l.key, l.cents]), [["service", 19900], ["tree", 9000], ["stand", 4000], ["removal", 9900], ["extra0", 2500]]);
  assert.equal(q.totalCents, 19900 + 9000 + 4000 + 9900 + 2500);
});

test("configured tax applies only to the listed line types", () => {
  const P2 = Object.assign({}, P, { tax: { reviewed: true, lines: [{ name: "Test tax", rate: 0.1, appliesTo: ["tree", "stand"] }] } });
  const q = T.buildQuote(verified(), P2, NOW);
  assert.equal(q.kind, "final");
  assert.equal(q.taxCents, 1300);
  assert.equal(q.totalCents, 19900 + 9000 + 4000 + 1300);
});

test("unreviewed tax keeps it an estimate with no total", () => {
  const q = T.buildQuote(verified(), P, NOW);
  assert.equal(q.kind, "estimate");
  assert.equal(q.totalCents, null);
  assert.ok(q.gaps.some(g => /Tax treatment/.test(g)));
});

test("missing or stale supplier data blocks a final quote", () => {
  const variants = [
    { price: null }, { price: "" }, { supplier: "" }, { species: "" }, { availability: "unknown" },
    { availability: "unavailable" }, { verifiedAt: "" }, { verifiedAt: stale }, { customerApproved: false }
  ];
  for (const v of variants) {
    const q = T.buildQuote(verified({ tree: Object.assign({}, verified().tree, v) }), reviewedTax, NOW);
    assert.equal(q.kind, "estimate", JSON.stringify(v));
    assert.equal(q.totalCents, null);
  }
  const q = T.buildQuote(verified({ tree: Object.assign({}, verified().tree, { price: null }) }), reviewedTax, NOW);
  assert.equal(q.lines.find(l => l.key === "tree").cents, null, "unknown price stays unknown");
});

test("customer supplied tree omits the tree charge and needs a pickup decision", () => {
  const base = verified({ sourcing: "customer", tree: {}, heightFt: 7 });
  let q = T.buildQuote(base, reviewedTax, NOW);
  assert.equal(q.lines.find(l => l.key === "tree").cents, 0);
  assert.equal(q.kind, "estimate");
  assert.ok(q.gaps.some(g => /pickup/.test(g)));
  q = T.buildQuote(Object.assign({}, base, { pickupNeeded: false }), reviewedTax, NOW);
  assert.equal(q.kind, "final");
  assert.equal(q.totalCents, 19900 + 4000);
});

test("customer stand needs a suitability check", () => {
  const mk = s => T.buildQuote(verified({ stand: Object.assign({ mode: "customer" }, s) }), reviewedTax, NOW);
  assert.equal(mk({}).kind, "estimate");
  assert.equal(mk({ suitability: { checked: true, ok: false } }).kind, "estimate");
  assert.ok(mk({ suitability: { checked: true, ok: false } }).gaps.some(g => /not suitable/.test(g)));
  const ok = mk({ suitability: { checked: true, ok: true } });
  assert.equal(ok.kind, "final");
  assert.equal(ok.totalCents, 19900 + 9000);
});

test("custom quote conditions", () => {
  const over = T.buildQuote(verified({ heightFt: 12, tree: Object.assign({}, verified().tree, { heightFt: 12 }), removal: true }), reviewedTax, NOW);
  assert.equal(over.kind, "custom");
  assert.equal(over.totalCents, null);
  assert.equal(over.lines.find(l => l.key === "service").cents, null);
  assert.equal(over.lines.find(l => l.key === "removal").cents, null);
  const del = T.buildQuote(verified({ deliveryOnly: true }), reviewedTax, NOW);
  assert.equal(del.kind, "custom");
  assert.equal(del.lines.find(l => l.key === "service").cents, null);
});

test("10 to 11 ft needs an access review", () => {
  const t = Object.assign({}, verified().tree, { heightFt: 10.5 });
  assert.equal(T.buildQuote(verified({ heightFt: 10.5, tree: t }), reviewedTax, NOW).kind, "estimate");
  assert.equal(T.buildQuote(verified({ heightFt: 10.5, tree: t, accessReviewed: true }), reviewedTax, NOW).kind, "final");
});

test("access flags and unreviewed extras are never auto priced", () => {
  let q = T.buildQuote(verified({ accessFlags: ["Stairs: One flight"] }), reviewedTax, NOW);
  assert.equal(q.kind, "estimate");
  q = T.buildQuote(verified({ extras: [{ label: "Stairs", amount: 40, reviewed: false }] }), reviewedTax, NOW);
  assert.equal(q.kind, "estimate");
  assert.ok(!q.lines.some(l => l.type === "extra"));
  q = T.buildQuote(verified({ extras: [{ label: "Stairs", amount: "", reviewed: true }] }), reviewedTax, NOW);
  assert.ok(!q.lines.some(l => l.type === "extra"));
});

test("form estimate is never final and labels service pricing only", () => {
  const q = T.formEstimate({ bandId: "to8", hasTree: "No, I still need one", stand: "I need a stand", removal: true }, reviewedTax);
  assert.equal(q.kind, "estimate");
  assert.equal(q.totalCents, null);
  assert.equal(q.knownCents, 19900 + 9900);
  assert.equal(q.lines.find(l => l.key === "tree").cents, null);
  assert.equal(q.lines.find(l => l.key === "stand").cents, null);
  const own = T.formEstimate({ bandId: "to6", hasTree: "Yes, I have it", stand: "I have a stand" }, reviewedTax);
  assert.equal(own.knownCents, 14900);
  assert.equal(T.formEstimate({ bandId: "over11", hasTree: "Yes, I have it" }, P).kind, "custom");
  assert.equal(T.formEstimate({ bandId: "to6", deliveryOnly: true }, P).kind, "custom");
  assert.equal(T.formEstimate({ bandId: "", hasTree: "Not sure yet" }, P).knownCents, 0);
});

test("customer text never claims a booking or charge", () => {
  const txt = T.quoteText(T.buildQuote(verified({ removal: true }), reviewedTax, NOW), { customer: "Pat" });
  assert.match(txt, /Final quote for Pat/);
  assert.match(txt, /Total: \$/);
  assert.match(txt, /No date is reserved/);
  assert.doesNotMatch(txt, /\b(booked|charged|confirmed for|reserved for)\b/i);
  const est = T.quoteText(T.formEstimate({ bandId: "to8", hasTree: "No, I still need one" }, P));
  assert.match(est, /^Estimate/);
  assert.doesNotMatch(est, /Total:/);
});

test("no hardcoded supplier prices in shipped code", () => {
  for (const f of ["pricing.js", "config.js", "app.js", "index.html"]) {
    const s = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    assert.doesNotMatch(s, /home ?depot/i, f);
  }
});
