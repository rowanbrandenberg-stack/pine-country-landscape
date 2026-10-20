/*
  Pine Country Landscape: online contracts.
  /contract/?t=snow            Snow season contract (prices from config.js snow)
  /contract/?t=plan&p=<id>     Care plan (plans in config.js)
  /contract/#p=<data>          Project contract built at /contract/new/
  Signing posts { action: "contract", ... } to the Apps Script endpoint, which emails the signed copy
  to the customer and to Rowan and logs it to the Contracts sheet.
*/
(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var Q = new URLSearchParams(location.search);
  var LEGAL = C.legalName || "Pine Country Landscape LLC";
  var ROC = C.rocNumber || "ROC 368709";

  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
  $$("[data-roc-number]").forEach(function (el) { el.textContent = ROC; });
  $$("[data-sms]").forEach(function (a) { a.href = "sms:" + (C.phoneHref || "+19288638198") + "?&body=" + encodeURIComponent("Hi Rowan, I have a question about my agreement. "); });

  function track(ev, label) {
    if (!C.bookingEndpoint || location.protocol === "file:") return;
    var body = JSON.stringify({ action: "ev", ev: ev, label: String(label || "").slice(0, 40), page: location.pathname, dev: window.matchMedia("(max-width: 820px)").matches ? "phone" : "desktop", internal: location.hostname !== "pinecountrylandscape.com" || (function () { try { return localStorage.getItem("pcl_internal") === "1"; } catch (x) { return false; } })() });
    try { navigator.sendBeacon(C.bookingEndpoint, new Blob([body], { type: "text/plain" })); } catch (x) {}
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { n = Number(n) || 0; return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function num(str) { return Number(String(str || "").replace(/[^0-9.]/g, "")) || 0; }
  function today() { return new Date().toLocaleDateString("en-US", { timeZone: "America/Phoenix", year: "numeric", month: "long", day: "numeric" }); }
  function decode(b64) {
    try {
      b64 = b64.replace(/-/g, "+").replace(/_/g, "/"); while (b64.length % 4) b64 += "=";
      var bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }
  function newId() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return "PCL-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* ---------- Shared terms ---------- */
  var ROC_NOTICE = "Pursuant to Arizona law, the property owner has the right to file a written complaint with the Arizona Registrar of Contractors for an alleged violation of A.R.S. 32-1154, subsection A. The Registrar can be reached at " +
    (C.rocPhone || "(602) 542-1525") + " or " + (C.rocSite || "roc.az.gov") + ". Complaints must be made within the applicable time period set forth in A.R.S. 32-1155, subsection A.";

  function partiesHtml() {
    return '<dl class="ct-parties">' +
      "<div><dt>Contractor</dt><dd><b>" + esc(LEGAL) + "</b><br>" + esc(C.businessAddress || "Flagstaff, AZ") + "<br>" + esc(ROC) + (C.rocClass ? ", " + esc(C.rocClass) : "") + "<br>" + esc(C.phoneDisplay || "(928) 863-8198") + "</dd></div>" +
      '<div><dt>Owner</dt><dd><b data-f="name">Your name</b><br><span data-f="mailing">Mailing address</span><br>Service address: <span data-f="address">Service address</span><br><span data-f="contact"></span></dd></div>' +
      "<div><dt>Date</dt><dd>" + esc(today()) + "<br>Agreement <span data-f=\"id\"></span></dd></div></dl>";
  }
  function generalTerms(extra) {
    return [
      "Access. You give our crew access to the work areas on the service address. Please mark sprinkler heads, low lighting, edging and anything else in the work area we could not see. We are not responsible for damage to items that are buried or unmarked.",
      "Changes. Any change to the scope or price is agreed in writing (text or email is fine) before the extra work is done.",
      "Our promise. If something we did is not right, tell us and we come back and make it right at no cost.",
      "Insurance and license. " + LEGAL + " carries general liability and workers' compensation insurance, is bonded, and is licensed by the Arizona Registrar of Contractors as " + ROC + ".",
      "Payment. Card or cash. Invoices are due when received. Prices include all applicable taxes."
    ].concat(extra || []).concat([
      "Electronic signature. Both parties agree to sign electronically, and an electronic signature has the same effect as a handwritten one. This agreement becomes binding when signed by both the owner and " + LEGAL + ". We countersign and email you the final copy."
    ]);
  }

  /* ---------- Agreement types ---------- */
  function snowDoc(planId) {
    var S = C.snow || {};
    var plans = S.plans || [{ id: "driveway", name: "Driveway Season", price: 800, walks: false }];
    var P = plans.filter(function (p) { return p.id === planId; })[0] || plans[0];
    var price = Number(P.price) || 800, walks = num(S.walks) || 35, n = S.payments || 4;
    var each = Math.round(price / n * 100) / 100, credit = S.missedCredit || "$125";
    return {
      type: "snow", planId: P.id, title: "Snow Removal Agreement: " + P.name, total: price, walksPrice: walks, walksIncluded: !!P.walks,
      summary: [["Plan", P.name], ["Season", (S.seasonStart || "November 1, 2026") + " to " + (S.seasonEnd || "April 15, 2027")], ["Season price", money(price)], ["Payment", n + " monthly payments of " + money(each) + ", no deposit"]],
      body: function (f) {
        return [
          ["What we do", "<p>We clear the driveway at the service address after every snowfall of " + esc(S.trigger || "2 inches") + " or more between " + esc(S.seasonStart || "November 1, 2026") + " and " + esc(S.seasonEnd || "April 15, 2027") + ". Season clients are on our priority route, and there is no limit on the number of storms. This price is for a standard residential driveway (2 car, up to 60 feet).</p><p>" +
            (P.walks ? "Included: the front walk, steps and entry cleared by hand on every visit, and your home is among the first stops on our route." : (f.walks ? "Added: the front walk, steps and entry cleared by hand on every visit for " + money(walks) + " per visit, billed monthly with your payment." : "Walks and steps are not included. You can add them any time for " + money(walks) + " per visit.")) + "</p>"],
          ["Price and payment", "<p>Season price: <b>" + money(price) + "</b>, including all applicable taxes.</p><p>Advance deposit: <b>$0</b>. Progress payments: <b>" + n + " equal payments of " + money(each) + "</b>. The first is invoiced when we countersign this agreement, and the rest on the 1st of each of the next " + (n - 1) + " months. Card or cash.</p>"],
          ["How the route works", "<ul><li>We start clearing once snowfall reaches the trigger depth. During long storms we may clear more than once.</li><li>Season clients are always cleared before on call requests.</li><li>Snow is piled where you tell us in your notes, or where it does the least harm.</li><li>Please park cars off the driveway when you can and mark the edges of your driveway before the first storm. We can stake it for you on request.</li></ul>"],
          ["Our promise", "<p>If we miss a qualifying storm, tell us and we credit " + esc(credit) + " on your next payment, or refund it if your payments are complete.</p>"],
          ["Cancellation", "<p>You can cancel within 3 business days of signing for a full refund. After that you can cancel any time with 14 days notice by text or email; payments not yet due are canceled and payments already made are not refunded, except for missed storm credits. Estimated completion of all work: " + esc(S.seasonEnd || "April 15, 2027") + ".</p>"]
        ];
      }
    };
  }
  function planDoc(id) {
    var P = (C.plans || []).filter(function (p) { return p.id === id; })[0] || (C.plans || [])[0];
    if (!P) return null;
    var off = Math.round((C.planDiscount || 0.1) * 100);
    return {
      type: "plan", title: "Care Plan Agreement: " + P.name, total: num(P.price), planId: P.id,
      summary: [["Plan", P.name], ["Plan price", P.price], ["Billing", P.billing]],
      body: function () {
        return [
          ["What is included", "<ul>" + P.visits.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul><p>" + esc(P.blurb) + "</p>"],
          ["Price and payment", "<p>Plan price: <b>" + esc(P.price) + "</b>, which is " + off + "% off our standard rates, including all applicable taxes. " + esc(P.billing) + ". No advance deposit. You only pay for visits we complete.</p><p>Plan prices are for a typical Flagstaff lot. If your property is larger than typical, we confirm your plan price in writing before the first visit, and you can cancel at no cost if it does not work for you.</p>"],
          ["Scheduling", "<p>We put every visit on the calendar and text you a day ahead. Weather can move a visit by a few days. Estimated completion of all work: the end of the plan season listed above, within 12 months of signing.</p>"],
          ["Cancellation", "<p>Cancel any time with 14 days notice by text or email. There is no cancellation fee. Visits already completed are billed at the plan rate.</p>"]
        ];
      }
    };
  }
  function projectDoc(d) {
    if (!d || !d.scope) return null;
    var total = num(d.total), dep = num(d.deposit);
    var pays = (d.payments || []).filter(function (p) { return p && (p.amount || p.stage); });
    return {
      type: "project", title: d.title || "Landscape Project Agreement", total: total, ref: d.ref || "", project: d,
      summary: [["Project", d.title || "Landscape project"], ["Total price", money(total)], ["Start", d.start || "To be scheduled"], ["Estimated completion", d.finish || "To be scheduled"]],
      body: function () {
        return [
          ["Scope of work", (d.ref ? "<p>Per proposal " + esc(d.ref) + ".</p>" : "") + "<ul>" + String(d.scope).split(/\n+/).filter(Boolean).map(function (l) { return "<li>" + esc(l.replace(/^[\s*•]+/, "")) + "</li>"; }).join("") + "</ul>" + (d.exclusions ? "<p><b>Not included:</b> " + esc(d.exclusions) + "</p>" : "")],
          ["Price and payment", "<p>Total price: <b>" + money(total) + "</b>, including all applicable taxes.</p><p>Advance deposit: <b>" + money(dep) + "</b>" + (dep ? " due at signing" : "") + ".</p>" +
            (pays.length ? '<table class="ct-pay"><thead><tr><th>Progress payment</th><th>Due at this stage</th></tr></thead><tbody>' + pays.map(function (p) { return "<tr><td>" + money(num(p.amount)) + "</td><td>" + esc(p.stage) + "</td></tr>"; }).join("") + "</tbody></table>" : "") +
            "<p>Final payment is due when the work is complete and we have done a final walkthrough together.</p>"],
          ["Schedule", "<p>Estimated start: <b>" + esc(d.start || "to be scheduled") + "</b>. Estimated completion of all work: <b>" + esc(d.finish || "to be scheduled") + "</b>. Weather, frozen ground and material delays can move these dates, and we keep you posted by text.</p>"],
          ["Plants and materials", "<p>Plants are chosen for Flagstaff conditions and planted to nursery standards. Plant survival depends on watering after we leave, so we give you a watering plan with every install. Materials stay our property until paid for in full.</p>" + (d.terms ? "<p>" + esc(d.terms) + "</p>" : "")]
        ];
      }
    };
  }

  var t = Q.get("t"), hash = new URLSearchParams(location.hash.slice(1));
  var D = hash.get("p") ? projectDoc(decode(hash.get("p"))) : t === "plan" ? planDoc(Q.get("p")) : t === "snow" ? snowDoc(Q.get("plan")) : null;
  var doc = $("#doc"), form = $("#sign");
  if (!D) {
    doc.innerHTML = '<h2>This agreement link is not complete.</h2><p class="lede">Text Rowan at ' + esc(C.phoneDisplay || "(928) 863-8198") + ' and he will send you a fresh link. Looking for snow or a care plan? <a href="/snow-removal-flagstaff/">Snow contracts</a> &middot; <a href="/#inquiry">Book an estimate</a></p>';
    form.hidden = true; return;
  }
  var ID = newId();
  track("contract_view", D.type);
  document.title = D.title + " | Pine Country Landscape";
  $("[data-title]").textContent = D.title;
  if (D.type === "snow" && !D.walksIncluded) { $("[data-walks-row]").hidden = false; $("[data-walks-price]").textContent = money(D.walksPrice); }

  // Prefill from link
  var pre = D.project || {};
  ["name", "phone", "email", "address", "notes"].forEach(function (k) { var v = Q.get(k) || pre["client_" + k] || ""; if (v && form[k]) form[k].value = v; });
  if (Q.get("walks") === "1") form.walks.checked = true;

  function fields() {
    return {
      name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
      address: form.address.value.trim(), mailing: form.mailing.value.trim() || form.address.value.trim(),
      notes: form.notes.value.trim(), walks: !!(form.walks && form.walks.checked)
    };
  }
  function render() {
    var f = fields();
    var sections = D.body(f);
    doc.innerHTML = '<header class="ct-head"><img src="/img/logo-badge.png" alt="" width="56" height="56"><div><p class="eyebrow">' + esc(LEGAL) + '</p><h2>' + esc(D.title) + "</h2></div></header>" +
      '<dl class="ct-summary">' + D.summary.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
      partiesHtml() +
      sections.map(function (s, i) { return "<section><h3>" + (i + 1) + ". " + esc(s[0]) + "</h3>" + s[1] + "</section>"; }).join("") +
      "<section><h3>" + (sections.length + 1) + ". General terms</h3><ol class=\"ct-terms\">" + generalTerms().map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></section>" +
      '<p class="ct-roc">' + esc(ROC_NOTICE) + "</p>" +
      '<div class="ct-sigs"><div><p class="ct-sig-k">Owner</p><div class="ct-sig-img" data-sig-out></div><p data-f="name2">Name</p><p class="ct-sig-d" data-signed-at></p></div>' +
      '<div><p class="ct-sig-k">' + esc(LEGAL) + '</p><div class="ct-sig-img ct-sig-pending">Countersigned by email</div><p>' + esc(C.signer || "Rowan Brandenberg, Manager") + "</p></div></div>";
    paint();
  }
  function paint() {
    var f = fields();
    var set = function (k, v) { $$('[data-f="' + k + '"]', doc).forEach(function (el) { el.textContent = v; }); };
    set("name", f.name || "Your name"); set("name2", f.name || "Name");
    set("address", f.address || "Service address"); set("mailing", f.mailing || "Mailing address");
    set("contact", [f.phone, f.email].filter(Boolean).join(" · ")); set("id", ID);
  }
  render();
  form.addEventListener("input", function (e) { if (e.target.name === "walks") render(); else paint(); });
  form.addEventListener("change", function (e) { if (e.target.name === "walks") render(); });

  /* ---------- Signature pad ---------- */
  var cv = $("#sig"), ctx = cv.getContext("2d"), drawing = false, inked = false, last = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  ctx.lineWidth = 4.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#13251b";
  cv.addEventListener("pointerdown", function (e) { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.5, 0, 7); ctx.fillStyle = "#13251b"; ctx.fill(); inked = true; cv.classList.add("inked"); });
  cv.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { cv.addEventListener(ev, function () { drawing = false; }); });
  $("#sig-clear").addEventListener("click", function () { ctx.clearRect(0, 0, cv.width, cv.height); inked = false; cv.classList.remove("inked"); });

  function plainText(f) {
    var tmp = doc.cloneNode(true);
    $$(".ct-sigs", tmp).forEach(function (n) { n.remove(); });
    return tmp.innerText.replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $(".form-msg", form), f = fields(), bad = function (el, m) { el.setAttribute("aria-invalid", "true"); el.focus(); out.className = "form-msg err"; out.textContent = m; };
    $$("[aria-invalid]", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
    if (!f.name) return bad(form.name, "Please add your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return bad(form.email, "Please add a valid email so we can send your signed copy.");
    if (!f.address) return bad(form.address, "Please add the service address.");
    if (!inked) { out.className = "form-msg err"; out.textContent = "Please sign in the box."; cv.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    if (form.typed.value.trim().toLowerCase().replace(/\s+/g, " ") !== f.name.toLowerCase().replace(/\s+/g, " ")) return bad(form.typed, "Type your full name exactly as above to confirm.");
    if (!form.agree.checked) return bad(form.agree, "Please check the box to agree.");
    if (form.website.value) return;
    var signedAt = new Date();
    var stamp = signedAt.toLocaleString("en-US", { timeZone: "America/Phoenix", dateStyle: "long", timeStyle: "short" }) + " (Arizona time)";
    var sigData = cv.toDataURL("image/png");
    var payload = {
      action: "contract", id: ID, type: D.type, title: D.title, total: D.total, plan: D.planId || "", ref: D.ref || "",
      name: f.name, phone: f.phone, email: f.email, address: f.address, mailing: f.mailing, notes: f.notes, walks: f.walks,
      typed: form.typed.value.trim(), signedAt: signedAt.toISOString(), signedAtText: stamp, text: plainText(f),
      signature: sigData, url: location.href, ua: navigator.userAgent, website: ""
    };
    var btn = $('button[type="submit"]', form); if (btn.disabled) return; btn.disabled = true; out.className = "form-msg"; out.textContent = "Signing...";
    var req = C.bookingEndpoint ? fetch(C.bookingEndpoint, { method: "POST", body: JSON.stringify(payload) }).then(function (r) { return r.json(); })
      : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 600); });
    req.then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.message) || "not ok");
      $("[data-sig-out]", doc).innerHTML = '<img alt="Owner signature" src="' + sigData + '">';
      $("[data-signed-at]", doc).textContent = "Signed electronically " + stamp;
      form.hidden = true; $("[data-intro]").hidden = true;
      var done = $("#done"); done.hidden = false;
      $("[data-done-text]").textContent = (res.preview ? "Preview only, nothing was sent. " : "") + "Agreement " + ID + " is signed. A copy is on its way to " + f.email + ". Rowan countersigns and confirms your schedule.";
      done.scrollIntoView({ behavior: "smooth", block: "start" });
      track("contract_signed", D.type);
    }).catch(function () {
      btn.disabled = false; out.className = "form-msg err";
      out.textContent = "That did not go through. Please try again, or text Rowan at " + (C.phoneDisplay || "(928) 863-8198") + " and he will get you signed up.";
    });
  });
  $("#print").addEventListener("click", function () { window.print(); });
})();
