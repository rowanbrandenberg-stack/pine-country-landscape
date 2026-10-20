(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TZ = "America/Phoenix";
  document.documentElement.classList.add("js");

  /* ---------- Old links: send retired homepage anchors to their new homes ---------- */
  (function () {
    var home = location.pathname === "/" || /\/index\.html$/.test(location.pathname);
    var map = { "#estimate": "/price-from-photos/", "#price": "/price-from-photos/", "#plant-doctor": "/plant-doctor/", "#snow": "/snow-removal-flagstaff/", "#plans": "/snow-removal-flagstaff/", "#facts": "#about" };
    var to = home && map[location.hash];
    if (to && to.charAt(0) === "/" && location.protocol !== "file:") location.replace(to);
    else if (to) location.hash = to;
  })();

  /* ---------- Measurement: privacy safe events into the PCL Website Leads sheet ----------
     Only the event name, a short label, the page path, the referring site, utm tags and phone/desktop are sent.
     Never names, contact details, addresses, photos or message text. Add ?internal=1 to any URL once to mark
     your own browser as internal so your visits can be filtered out. */
  var track = (function () {
    var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (x) { return null; } };
    var qs = new URLSearchParams(location.search);
    if (qs.get("internal") === "1") store("pcl_internal", "1");
    if (qs.get("internal") === "0") store("pcl_internal", "0");
    var refHost = ""; try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (x) {}
    if (refHost === location.hostname) refHost = "";
    // Remember the first campaign seen this visit so later events keep the source.
    var utm = { src: qs.get("utm_source") || "", med: qs.get("utm_medium") || "", cmp: qs.get("utm_campaign") || "" };
    try { if (utm.src) sessionStorage.setItem("pcl_utm", JSON.stringify(utm)); else utm = JSON.parse(sessionStorage.getItem("pcl_utm") || "null") || utm; } catch (x) {}
    var base = { page: location.pathname.slice(0, 80), refHost: refHost, src: utm.src, med: utm.med, cmp: utm.cmp,
      dev: window.matchMedia("(max-width: 820px)").matches ? "phone" : "desktop", internal: store("pcl_internal") === "1" || location.hostname !== "pinecountrylandscape.com" };
    function send(ev, label) {
      if (!C.bookingEndpoint || location.protocol === "file:") return;
      var body = JSON.stringify(Object.assign({ action: "ev", ev: ev, label: String(label || "").slice(0, 40) }, base));
      try { if (navigator.sendBeacon && navigator.sendBeacon(C.bookingEndpoint, new Blob([body], { type: "text/plain" }))) return; } catch (x) {}
      try { fetch(C.bookingEndpoint, { method: "POST", body: body, keepalive: true, mode: "no-cors" }); } catch (x) {}
    }
    send("page_view");
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a, button");
      if (!a) return;
      var ev = a.getAttribute("data-track"), label = a.getAttribute("data-label") || "";
      var href = a.getAttribute("href") || "";
      if (!ev && /^tel:/.test(href)) ev = "call_click";
      if (!ev && /^sms:/.test(href)) ev = "text_click";
      if (ev) send(ev, label);
    }, true);
    return send;
  })();

  /* ---------- Conversion helpers: one tap text, seasonal banner, review badge ---------- */
  (function () {
    var base = location.pathname === "/" || /index\.html$/.test(location.pathname) || location.protocol === "file:" ? "" : "/";
    var smsBody = C.smsBody || "Hi Rowan, I need a price on ";
    Array.prototype.forEach.call(document.querySelectorAll("[data-sms]"), function (a) { a.href = "sms:" + (C.phoneHref || "+19288638198") + "?&body=" + encodeURIComponent(smsBody); });
    var bar = document.querySelector("[data-season]");
    if (bar) {
      var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), t = null;
      if (m === 10 || m === 11) t = 'Snow removal season contracts are open for this winter. <a href="/snow-removal-flagstaff/">See details</a>';
      else if (m === 9 && day >= 15) t = 'Hard freeze is coming. Winterize sprinklers from $165 before it hits. <a href="/#inquiry">Book an estimate</a>';
      else if (m === 12 || m <= 2) t = 'Dry winter? New trees still need water. Winter watering visits $95. <a href="/#inquiry">Book an estimate</a>';
      else if (m <= 5) t = 'Spring cleanup season is here. <a href="/#inquiry">Book an estimate</a>';
      else if (m <= 8) t = 'Monsoon season: cleanups and irrigation fixes. <a href="/#inquiry">Book an estimate</a>';
      else t = 'Fall cleanup spots are filling up. <a href="/#inquiry">Book an estimate</a>';
      bar.innerHTML = t; bar.hidden = false;
    }
    var R = window.PCL_REVIEWS;
    if (C.showReviewCount && R && R.items && R.items.length) {
      var avg = R.items.reduce(function (s, r) { return s + (r.stars || 5); }, 0) / R.items.length;
      Array.prototype.forEach.call(document.querySelectorAll("[data-review-count]"), function (el) { el.textContent = avg.toFixed(1) + " from " + R.items.length + " reviews"; });
      Array.prototype.forEach.call(document.querySelectorAll("[data-review-badge]"), function (el) { el.hidden = false; });
    }
  })();

  /* ---------- Site settings ---------- */
  if (C.bonded) $$("[data-bonded]").forEach(function (el) { el.hidden = false; });
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
  if (C.phoneDisplay) $$("[data-phone]").forEach(function (a) { a.textContent = C.phoneDisplay; a.href = "tel:" + C.phoneHref; });
  if (C.rocNumber) {
    $$("[data-roc-number]").forEach(function (el) { el.textContent = C.rocNumber; });
    $$("[data-roc-badge]").forEach(function (el) { el.hidden = false; });
    var ul = $("[data-install-prices]");
    if (ul && C.installPricing) {
      ul.innerHTML = C.installPricing.map(function (p) { return "<li><span>" + esc(p.name) + "</span><b>" + esc(p.price) + "</b></li>"; }).join("");
      ul.hidden = false;
      var note = $("[data-install-note]");
      if (note) note.textContent = "Starting prices for typical Flagstaff lots. Bigger projects start with a 90 minute design consultation on site; the $150 is credited toward your project, and you sign the written proposal online before any work begins.";
    }
  }
  if (C.insured) $$("[data-insured]").forEach(function (el) { el.hidden = false; });
  if (C.snow && typeof C.snow.spotsLeft === "number") $$("[data-spots]").forEach(function (el) {
    el.textContent = C.snow.spotsLeft >= C.snow.spotsTotal ? "Only " + C.snow.spotsTotal + " route spots this winter. First come, first served." : C.snow.spotsLeft > 0 ? C.snow.spotsLeft + " of " + C.snow.spotsTotal + " route spots left" : "Route full for this winter. Reserve below and we will call if a spot opens.";
    el.hidden = false;
  });
  if (C.snow) $$("[data-snow]").forEach(function (el) { var v = C.snow[el.getAttribute("data-snow")]; if (v) el.textContent = v; });

  var head = $("#site-head");
  var onScroll = function () { if (head) head.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Reviews ---------- */
  var R = window.PCL_REVIEWS, rvTrack = $("#rv-track");
  if (rvTrack && R && R.items && R.items.length) {
    // Filled stars for the rating, hollow outline stars for the rest, so a 4 star review never reads as 5.
    var starStr = function (n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "\u2605" : '<span class="off">\u2606</span>'; return s; };
    var score = $("#rv-score");
    if (score) {
      var avg = R.items.reduce(function (t, r) { return t + r.stars; }, 0) / R.items.length;
      score.innerHTML = "<b>" + avg.toFixed(1) + '</b><span class="stars" aria-hidden="true">' + starStr(Math.round(avg)) + "</span><span>average from " + R.items.length + " customer reviews</span>";
    }
    rvTrack.innerHTML = R.items.map(function (r) {
      return '<figure class="rv"><span class="stars" role="img" aria-label="' + r.stars + ' out of 5 stars">' + starStr(r.stars) + "</span>" +
        "<blockquote>&ldquo;" + esc(r.text) + "&rdquo;</blockquote>" +
        '<figcaption><span class="rv-av" aria-hidden="true">' + esc(r.name.charAt(0)) + "</span><span><b>" + esc(r.name) + "</b>" + esc(r.place) + "</span></figcaption></figure>";
    }).join("");
    $$(".rv-arrow").forEach(function (b) {
      b.addEventListener("click", function () { rvTrack.scrollBy({ left: +b.getAttribute("data-dir") * rvTrack.clientWidth * 0.9, behavior: "smooth" }); });
    });
    if (R.googleReviewUrl) { var lv = $("#rv-leave"); lv.href = R.googleReviewUrl; lv.hidden = false; }
  } else if (rvTrack) { var sec = $("#reviews"); if (sec) sec.hidden = true; }

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox");
  $$("#gallery button[data-full], .proj button[data-full]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!lb || !lb.showModal) { window.open(b.getAttribute("data-full"), "_blank"); return; }
      var img = $("img", lb), sm = $("img", b);
      img.src = b.getAttribute("data-full"); img.alt = sm ? sm.alt : "";
      var cap = b.parentNode.querySelector("figcaption b") || b.parentNode.querySelector("figcaption"); $(".lb-cap", lb).textContent = cap ? cap.textContent : "";
      lb.showModal();
    });
  });
  if (lb) {
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtTime(hm) { var p = hm.split(":"), h = +p[0], m = p[1]; return (h % 12 || 12) + ":" + m + (h < 12 ? " am" : " pm"); }
  function parseDay(ds) { var p = ds.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
  function fmtDay(ds, opts) { return parseDay(ds).toLocaleDateString("en-US", Object.assign({ timeZone: "UTC" }, opts)); }
  function fmtLen(min) { return min < 60 ? min + " min" : (min % 60 ? (min / 60).toFixed(1) : min / 60) + (min === 60 ? " hour" : " hours"); }
  function todayParts() {
    var f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    var o = {}; f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function addDays(ds, n) { var d = parseDay(ds); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validPhone(v) { return v.replace(/\D/g, "").length >= 10; }
  function msg(el, text, kind) { el.textContent = text || ""; el.className = "form-msg" + (kind ? " " + kind : ""); }

  function contactCheck(form) {
    var ph = form.phone.value.trim(), em = form.email.value.trim();
    form.phone.removeAttribute("aria-invalid"); form.email.removeAttribute("aria-invalid");
    if (!ph && !em) { form.phone.setAttribute("aria-invalid", "true"); form.email.setAttribute("aria-invalid", "true"); return "Add a phone number or an email so we can confirm."; }
    if (ph && !validPhone(ph)) { form.phone.setAttribute("aria-invalid", "true"); return "That phone number looks short. Include the area code."; }
    if (em && !validEmail(em)) { form.email.setAttribute("aria-invalid", "true"); return "That email address looks incomplete."; }
    return "";
  }
  function requiredCheck(form, names) {
    for (var i = 0; i < names.length; i++) {
      var f = form[names[i]]; f.removeAttribute("aria-invalid");
      if (!f.value.trim()) { f.setAttribute("aria-invalid", "true"); f.focus(); return "Please add your " + (f.labels && f.labels[0] ? f.labels[0].textContent.toLowerCase() : names[i]) + "."; }
    }
    return "";
  }

  var LIVE = !!C.bookingEndpoint;
  function api(payload) {
    return fetch(C.bookingEndpoint, { method: "POST", body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }

  /* ---------- Short inquiry: Book an estimate ---------- */
  function shrinkPhoto(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  var iq = $("#inq-form");
  if (iq) {
    var iqShots = [], iqThumbs = $("#iq-thumbs"), iqStarted = false, iqBusy = false, iqRid = null;
    var drawIq = function () {
      iqThumbs.innerHTML = iqShots.map(function (src, i) { return '<figure><img src="' + src + '" alt="Photo ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo ' + (i + 1) + '">&times;</button></figure>'; }).join("");
      $$("[data-rm]", iqThumbs).forEach(function (b) { b.addEventListener("click", function () { iqShots.splice(+b.getAttribute("data-rm"), 1); drawIq(); }); });
    };
    $("#iq-photos").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, 6 - iqShots.length);
      Promise.all(files.map(function (f) { return shrinkPhoto(f).catch(function () { return null; }); })).then(function (list) {
        list.forEach(function (d) { if (d && iqShots.length < 6) iqShots.push(d); }); drawIq(); e.target.value = "";
      });
    });
    iq.addEventListener("input", function () { if (!iqStarted) { iqStarted = true; track("inquiry_start"); } iqRid = null; }, { once: false });
    iq.addEventListener("submit", function (e) {
      e.preventDefault();
      if (iqBusy) return;
      var out = $(".form-msg", iq);
      var f = { name: iq.name.value.trim(), phone: iq.phone.value.trim(), email: iq.email.value.trim(), area: iq.area.value.trim(), description: iq.description.value.trim() };
      $$("[aria-invalid]", iq).forEach(function (el) { el.removeAttribute("aria-invalid"); });
      var bad = function (el, text) { if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); } msg(out, text, "err"); };
      if (!f.name) return bad(iq.name, "Please add your name.");
      if (!f.phone && !f.email) { iq.email.setAttribute("aria-invalid", "true"); return bad(iq.phone, "Add a phone number or an email so we can reach you."); }
      if (f.phone && !validPhone(f.phone)) return bad(iq.phone, "That phone number looks short. Include the area code.");
      if (f.email && !validEmail(f.email)) return bad(iq.email, "That email address looks incomplete.");
      if (!f.area) return bad(iq.area, "Please add your neighborhood or ZIP code.");
      if (!f.description) return bad(iq.description, "Tell us a little about the work.");
      if (iq.website.value) return;
      // One request id per filled out form: a retry after a timeout or a double tap cannot create a second lead.
      if (!iqRid) iqRid = "iq-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      iqBusy = true;
      var btn = $('button[type="submit"]', iq); btn.disabled = true; btn.setAttribute("aria-busy", "true");
      msg(out, iqShots.length ? "Sending your request and photos..." : "Sending your request...");
      var utm = ""; try { var u = JSON.parse(sessionStorage.getItem("pcl_utm") || "null"); if (u) utm = [u.src, u.med, u.cmp].filter(Boolean).join(" / "); } catch (x) {}
      var payload = Object.assign({ action: "inquiry", rid: iqRid, service: iq.service.value, photos: iqShots, page: location.pathname, ref: document.referrer.slice(0, 200), utm: utm, website: iq.website.value }, f);
      var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 45000); });
      var req = LIVE ? Promise.race([api(payload), timeout]) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 700); });
      req.then(function (res) {
        if (!res || !res.ok) throw Object.assign(new Error("rejected"), { res: res });
        track("inquiry_success", payload.service || "none");
        var done = $("#inq-done");
        $("[data-inq-done-text]", done).textContent = (res.preview ? "Preview only, nothing was sent. " : "") + "Thanks, " + f.name.split(" ")[0] + ". Rowan has your request and will get back to you" + (f.phone ? " by text" : " by email") + (f.phone && f.email ? " or email" : "") + "." + (f.email ? " A confirmation is on its way to " + f.email + "." : "");
        iq.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      }).catch(function (err) {
        var res = err && err.res;
        track("inquiry_error", res ? (res.field || "rejected") : (err && err.message === "timeout" ? "timeout" : "network"));
        if (res && res.field && iq[res.field]) iq[res.field].setAttribute("aria-invalid", "true");
        // Everything typed stays in the form, so a retry is one tap.
        msg(out, (res && res.message) || "That did not go through. Your details are still here, so try again, or text " + C.phoneDisplay + " and we will take it from there.", "err");
        out.focus({ preventScroll: true });
      }).then(function () { iqBusy = false; btn.disabled = false; btn.removeAttribute("aria-busy"); });
    });
  }

  /* ---------- Demo availability (preview only) ---------- */
  function demoSlots(minutes) {
    var t = todayParts(), today = t.year + "-" + t.month + "-" + t.day, out = {};
    var start = toMin(C.dayStart || "08:00"), end = toMin(C.dayEnd || "17:00");
    for (var i = 1; i <= (C.horizonDays || 28); i++) {
      var ds = addDays(today, i), dow = parseDay(ds).getUTCDay();
      if ((C.workDays || [0, 1, 3, 5, 6]).indexOf(dow) < 0) continue;
      var seed = +ds.replace(/-/g, "") % 97, list = [];
      for (var m = start; m + minutes <= end; m += 30) {
        var blocked = ((m / 30 + seed) % 7 === 0) || ((m / 30 + seed) % 5 === 1);
        if (!blocked) list.push(fromMin(m));
      }
      if (seed % 11 === 0) list = [];
      out[ds] = list;
    }
    return Promise.resolve({ ok: true, days: out });
  }
  function toMin(hm) { var p = hm.split(":"); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }

  /* ---------- Booking ---------- */
  var booker = $("#booker");
  if (booker) {
    var S = { svc: null, day: null, time: null, days: {} };
    var services = C.services || [];
    var pick = $("#svc-pick");
    if (!LIVE) $("#preview-note").hidden = false;

    pick.innerHTML = services.map(function (s) {
      return '<button type="button" class="opt" role="radio" aria-checked="false" data-id="' + esc(s.id) + '">' +
        '<span class="opt-name">' + esc(s.name) + '</span><span class="opt-price">' + esc(s.price) + '</span>' +
        '<span class="opt-note">' + esc(s.note) + '</span><span class="opt-len">' + fmtLen(s.minutes) + '</span></button>';
    }).join("");

    $$(".opt", pick).forEach(function (b) { b.addEventListener("click", function () { chooseService(b.getAttribute("data-id")); }); });
    $$("[data-pick]").forEach(function (a) {
      a.addEventListener("click", function () { var id = a.getAttribute("data-pick"); setTimeout(function () { chooseService(id); }, 0); });
    });
    $$("[data-back]").forEach(function (b) { b.addEventListener("click", function () { go(+b.getAttribute("data-back")); }); });
    $("#bk-again").addEventListener("click", function () { S = { svc: null, day: null, time: null, days: {} }; $$(".opt", pick).forEach(function (o) { o.setAttribute("aria-checked", "false"); }); $("#bk-form").reset(); go(1); });

    function svcById(id) { for (var i = 0; i < services.length; i++) if (services[i].id === id) return services[i]; return null; }

    function go(n) {
      $$(".bk-panel", booker).forEach(function (p) { p.hidden = +p.getAttribute("data-panel") !== n; });
      $$(".bk-steps li", booker).forEach(function (li) {
        var s = +li.getAttribute("data-s");
        li.classList.toggle("on", s === n); li.classList.toggle("done", s < n || n === 4);
      });
      if (n === 3) renderSummary("#bk-sum-2", true);
    }

    function renderSummary(sel, withTime) {
      var s = S.svc, el = $(sel);
      var html = "<span><b>" + esc(s.name) + "</b> &middot; " + fmtLen(s.minutes) + " &middot; " + esc(s.price) + "</span>";
      if (withTime) html += "<span><b>" + fmtDay(S.day, { weekday: "long", month: "long", day: "numeric" }) + "</b> at <b>" + fmtTime(S.time) + "</b></span>";
      html += '<button type="button">Change</button>';
      el.innerHTML = html;
      $("button", el).addEventListener("click", function () { go(withTime ? 2 : 1); });
    }

    function chooseService(id) {
      var s = svcById(id); if (!s) return;
      S.svc = s; S.day = null; S.time = null;
      $$(".opt", pick).forEach(function (o) { o.setAttribute("aria-checked", String(o.getAttribute("data-id") === id)); });
      renderSummary("#bk-sum-1", false);
      go(2);
      loadSlots();
    }

    // Open times come from Google Calendar through Apps Script. Ask for every service at once
    // as soon as the page opens, so they are usually ready before anyone reaches the booking step.
    var slotCache = {}, allReq = null, allAt = 0;
    function fetchAll() {
      if (allReq && Date.now() - allAt < 55000) return allReq;
      allAt = Date.now();
      allReq = fetch(C.bookingEndpoint + "?action=allslots")
        .then(function (r) { return r.json(); })
        .then(function (res) { if (!res || !res.ok || !res.services) throw new Error("load"); return res.services; });
      allReq.catch(function () { allReq = null; });
      return allReq;
    }
    function fetchOne(id) {
      return fetch(C.bookingEndpoint + "?action=slots&service=" + encodeURIComponent(id))
        .then(function (r) { return r.json(); })
        .then(function (res) { if (!res || !res.ok) throw new Error(res && res.error || "load"); return res; });
    }
    function fetchSlots(id) {
      var hit = slotCache[id];
      if (hit && Date.now() - hit.at < 55000) return hit.p;
      var p = fetchAll().then(function (all) { if (all[id] && all[id].ok) return all[id]; throw new Error("missing"); })
        .catch(function () { return fetchOne(id); });
      p.catch(function () { if (slotCache[id] && slotCache[id].p === p) delete slotCache[id]; });
      slotCache[id] = { p: p, at: Date.now() };
      return p;
    }
    // Honest urgency: show the real next open visit from the live calendar.
    function showNextOpen(all) {
      var est = all && (all.estimate || all[Object.keys(all)[0]]); if (!est || !est.days) return;
      var keys = Object.keys(est.days).sort().filter(function (k) { return est.days[k].length; });
      if (!keys.length) return;
      var first = keys[0], t = est.days[first][0];
      var weekEnd = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      var thisWeek = keys.filter(function (k) { return k <= weekEnd; }).length;
      var txt = "Next open visit: " + fmtDay(first, { weekday: "short", month: "short", day: "numeric" }) + ", " + fmtTime(t);
      if (thisWeek > 0 && thisWeek <= 2) txt += " \u00b7 only " + thisWeek + " open day" + (thisWeek > 1 ? "s" : "") + " left this week";
      $$("[data-next-open-text]").forEach(function (el) { el.textContent = txt; });
      $$("[data-next-open]").forEach(function (el) { el.hidden = false; });
    }
    if (LIVE) {
      var warm = function () { fetchAll().then(showNextOpen).catch(function () {}); };
      if (document.readyState === "complete") warm(); else window.addEventListener("load", warm);
    }

    var loadTimers = [], loadSeq = 0;
    function clearLoadTimers() { loadTimers.forEach(clearTimeout); loadTimers = []; }

    function loadSlots(note) {
      var daysEl = $("#days"), slotsEl = $("#slots"), seq = ++loadSeq;
      clearLoadTimers();
      daysEl.innerHTML = '<div class="day-skel"></div><div class="day-skel"></div><div class="day-skel"></div><div class="day-skel"></div>';
      slotsEl.innerHTML = '<div class="slots-loading" role="status"><span class="spin" aria-hidden="true"></span><span class="sl-text">Checking Rowan\'s calendar for open times...</span></div>' +
        '<div class="skeleton" style="grid-column:1/-1"></div>';
      function say(t) { var el = $(".sl-text", slotsEl); if (el && seq === loadSeq) el.textContent = t; }
      loadTimers.push(setTimeout(function () { say("Still checking. Live times can take up to 15 seconds."); }, 4000));
      loadTimers.push(setTimeout(function () { say("Almost there, pulling the last few days..."); }, 11000));
      loadTimers.push(setTimeout(function () { say("This is taking longer than usual. Hang tight, or text " + C.phoneDisplay + " to book."); }, 22000));
      var req = LIVE ? fetchSlots(S.svc.id) : demoSlots(S.svc.minutes);
      req.then(function (res) {
        if (seq !== loadSeq) return;
        clearLoadTimers();
        if (!res || !res.ok) throw new Error(res && res.error || "load");
        S.days = res.days || {};
        var keys = Object.keys(S.days).sort();
        daysEl.innerHTML = keys.map(function (ds) {
          var n = S.days[ds].length;
          return '<button type="button" class="day" role="option" aria-selected="false" data-day="' + ds + '"' + (n ? "" : " disabled") + '>' +
            "<small>" + fmtDay(ds, { weekday: "short" }) + "</small><b>" + fmtDay(ds, { day: "numeric" }) + "</b><span>" + (n ? fmtDay(ds, { month: "short" }) : "Full") + "</span></button>";
        }).join("");
        $$(".day", daysEl).forEach(function (b) { b.addEventListener("click", function () { chooseDay(b.getAttribute("data-day")); }); });
        var first = keys.filter(function (k) { return S.days[k].length; })[0];
        if (first) chooseDay(first); else slotsEl.innerHTML = '<p class="slots-empty">No openings in the next few weeks. Call or text ' + esc(C.phoneDisplay) + " and we will fit you in.</p>";
        if (note) slotsEl.insertAdjacentHTML("afterbegin", '<p class="slots-empty">' + esc(note) + "</p>");
      }).catch(function () {
        if (seq !== loadSeq) return;
        clearLoadTimers();
        daysEl.innerHTML = "";
        slotsEl.innerHTML = '<p class="slots-empty">We could not load live times right now. Call or text ' + esc(C.phoneDisplay) + " to book.</p>";
      });
    }

    function chooseDay(ds) {
      S.day = ds;
      $$(".day", booker).forEach(function (d) { d.setAttribute("aria-selected", String(d.getAttribute("data-day") === ds)); });
      var list = S.days[ds] || [], slotsEl = $("#slots");
      slotsEl.innerHTML = list.length
        ? list.map(function (t) { return '<button type="button" class="slot" data-t="' + t + '">' + fmtTime(t) + "</button>"; }).join("")
        : '<p class="slots-empty">That day is full. Try another.</p>';
      $$(".slot", slotsEl).forEach(function (b) { b.addEventListener("click", function () { S.time = b.getAttribute("data-t"); go(3); $("#bk-name").focus({ preventScroll: true }); }); });
    }

    var form = $("#bk-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $(".form-msg", form);
      var err = requiredCheck(form, ["name", "address"]) || contactCheck(form);
      if (err) { msg(out, err, "err"); return; }
      if (form.website.value) return;
      var btn = $('button[type="submit"]', form); btn.disabled = true; msg(out, "Booking your visit...");
      var payload = {
        action: "book", service: S.svc.id, date: S.day, time: S.time,
        name: form.name.value.trim(), address: form.address.value.trim(),
        phone: form.phone.value.trim(), email: form.email.value.trim(), notes: form.notes.value.trim(), website: form.website.value, promo: form.promo ? form.promo.value.trim() : ""
      };
      var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 700); });
      req.then(function (res) {
        btn.disabled = false;
        slotCache = {}; allReq = null; // calendar changed, refetch next time
        if (res && res.ok) {
          msg(out, "");
          var when = fmtDay(S.day, { weekday: "long", month: "long", day: "numeric" }) + " at " + fmtTime(S.time);
          $("#bk-done-text").textContent = (res.preview ? "Preview only, nothing was sent. " : "") +
            S.svc.name + " on " + when + " at " + payload.address + ". " +
            (payload.email ? "A confirmation is on its way to " + payload.email + ". " : "") +
            "We will reach out before the visit. Need to change it? Call or text " + C.phoneDisplay + ".";
          go(4); track("booking_success", S.svc.id);
          booker.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (res && res.error === "taken") {
          msg(out, "");
          go(2); loadSlots("That time was just taken. Please pick another.");
        } else {
          track("booking_error", (res && res.error) || "server");
          msg(out, (res && res.message) || "Something went wrong saving your booking. Call or text " + C.phoneDisplay + " and we will book it for you.", "err");
        }
      }).catch(function () {
        btn.disabled = false;
        msg(out, "We could not reach the booking system. Call or text " + C.phoneDisplay + " and we will book it for you.", "err");
      });
    });
  }

  /* ---------- Snow contract: reserve, then sign online ---------- */
  var sf = $("#snow-form");
  if (sf && sf.plan) {
    var walksOpt = $("[data-walks-opt]", sf);
    var syncWalks = function () { if (walksOpt) walksOpt.hidden = sf.plan.value === "full"; };
    sf.plan.addEventListener("change", syncWalks); syncWalks();
  }
  if (sf) sf.addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $(".form-msg", sf);
    var err = requiredCheck(sf, ["name", "address"]) || contactCheck(sf);
    if (err) { msg(out, err, "err"); return; }
    if (sf.website.value) return;
    var btn = $('button[type="submit"]', sf); btn.disabled = true; msg(out, "Saving your spot...");
    var d = {
      action: "snow", name: sf.name.value.trim(), address: sf.address.value.trim(), phone: sf.phone.value.trim(),
      email: sf.email.value.trim(), plan: sf.plan.value, driveway: sf.driveway.value, walks: sf.walks.checked, notes: sf.notes.value.trim(), website: sf.website.value
    };
    var season = d.plan === "driveway" || d.plan === "full";
    if (d.plan === "full") d.walks = true;
    var planName = { driveway: "Driveway Season $800", full: "Full Clear Season $1,450", "per-push": "On call $125" }[d.plan] || d.plan;
    var canSign = season && d.driveway === "standard";
    var signUrl = "/contract/?t=snow&plan=" + d.plan + "&" + ["name", "address", "phone", "email", "notes"].map(function (k) { return k + "=" + encodeURIComponent(d[k]); }).join("&") + (d.walks && d.plan === "driveway" ? "&walks=1" : "");
    d.notes = ("[" + planName + "] " + d.notes).trim();
    if (season) d.plan = "season";
    var done = function (ok) {
      btn.disabled = false; if (ok) track("snow_success", d.plan);
      if (canSign) {
        msg(out, "Spot held. Taking you to your contract...", "ok");
        setTimeout(function () { location.href = signUrl; }, 700);
      } else if (ok) {
        sf.reset(); msg(out, "Got it. Rowan will text you a price, then send your contract to sign.", "ok");
      } else msg(out, "That did not go through. Text " + C.phoneDisplay + " and we will set you up.", "err");
    };
    var req = LIVE ? api(d) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 600); });
    req.then(function (res) { done(!!(res && res.ok)); }).catch(function () { done(false); });
  });

  /* ---------- Care plans ---------- */
  var pg = $("#plan-grid");
  if (pg && C.plans) {
    pg.innerHTML = C.plans.map(function (p) {
      return '<article class="plan' + (p.tag ? " plan-main" : "") + '">' + (p.tag ? '<p class="plan-tag">' + esc(p.tag) + "</p>" : "") +
        "<h3>" + esc(p.name) + '</h3><p class="plan-price">' + esc(p.price) + "</p>" +
        '<p class="plan-blurb">' + esc(p.blurb) + '</p><ul class="plan-list">' + p.visits.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>" +
        '<p class="plan-bill">' + esc(p.billing) + '</p><a class="btn ' + (p.tag ? "btn-gold" : "btn-line") + '" href="/contract/?t=plan&p=' + encodeURIComponent(p.id) + '">Start this plan</a></article>';
    }).join("");
  }

  /* ---------- Price from photos ---------- */
  var ef = $("#estimate");
  if (ef) {
    var shots = [], thumbs = $("#es-thumbs"), MAX = 6;
    // Shrink each photo to 1600px JPEG so uploads stay small on phones.
    function shrink(file) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var s = Math.min(1, 1600 / Math.max(img.width, img.height));
          var c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("img")); };
        img.src = url;
      });
    }
    function drawThumbs() {
      thumbs.innerHTML = shots.map(function (d, i) {
        return '<figure><img src="' + d + '" alt="Photo ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo ' + (i + 1) + '">&times;</button></figure>';
      }).join("");
    }
    thumbs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rm]"); if (!b) return;
      shots.splice(+b.getAttribute("data-rm"), 1); drawThumbs();
    });
    $("#es-photos").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, MAX - shots.length);
      Promise.all(files.map(function (f) { return shrink(f).catch(function () { return null; }); })).then(function (list) {
        list.forEach(function (d) { if (d && shots.length < MAX) shots.push(d); });
        drawThumbs(); e.target.value = "";
      });
    });
    var step2 = $(".est-step2", ef), nextBtn = $(".est-next", ef);
    if (nextBtn && step2) nextBtn.addEventListener("click", function () {
      var out = $(".form-msg", ef);
      if (!ef.description.value.trim()) { msg(out, "Tell us what you want done, even one line is fine.", "err"); ef.description.focus(); return; }
      msg(out, ""); step2.hidden = false; nextBtn.hidden = true; ef.name.focus();
    });
    ef.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $(".form-msg", ef);
      var err = requiredCheck(ef, ["description", "name", "address", "email"]);
      if (!err && !validEmail(ef.email.value.trim())) err = "Add an email so we can send your price.";
      if (err) { msg(out, err, "err"); return; }
      if (ef.website.value) return;
      var btn = $('button[type="submit"]', ef); btn.disabled = true; msg(out, shots.length ? "Uploading photos..." : "Sending...");
      var payload = {
        action: "estimate", service: ef.service.value, description: ef.description.value.trim(),
        name: ef.name.value.trim(), address: ef.address.value.trim(), email: ef.email.value.trim(), phone: ef.phone.value.trim(),
        photos: shots, website: ef.website.value, promo: ef.promo ? ef.promo.value.trim() : ""
      };
      var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 800); });
      req.then(function (res) {
        btn.disabled = false;
        if (res && res.ok) {
          track("photo_estimate_success", payload.service);
          ef.reset(); shots = []; drawThumbs();
          msg(out, (res.preview ? "Preview only, nothing was sent. " : "") + "Got it. Your ballpark price will come to your email. If we need anything else to price it, Rowan will reach out.", "ok");
        } else msg(out, (res && res.message) || "That did not go through. Text " + C.phoneDisplay + " and we will price it for you.", "err");
      }).catch(function () { btn.disabled = false; msg(out, "That did not go through. Text " + C.phoneDisplay + " and we will price it for you.", "err"); });
    });
  }

  /* ---------- Plant doctor ---------- */
  var pf = $("#plant-form");
  if (pf) {
    var pShots = [], pThumbs = $("#pd-thumbs"), PMAX = 6;
    var qs = new URLSearchParams(location.search), pid = qs.get("plant"), pkey = qs.get("k"), follow = !!(pid && pkey);
    var pShrink = function (file) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var sc = Math.min(1, 1600 / Math.max(img.width, img.height));
          var c = document.createElement("canvas"); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("img")); };
        img.src = url;
      });
    };
    var pDraw = function () {
      pThumbs.innerHTML = pShots.map(function (d, i) { return '<figure><img src="' + d + '" alt="Photo ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo ' + (i + 1) + '">&times;</button></figure>'; }).join("");
    };
    pThumbs.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; pShots.splice(+b.getAttribute("data-rm"), 1); pDraw(); });
    $("#pd-photos").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, PMAX - pShots.length);
      Promise.all(files.map(function (f) { return pShrink(f).catch(function () { return null; }); })).then(function (list) {
        list.forEach(function (d) { if (d && pShots.length < PMAX) pShots.push(d); }); pDraw(); e.target.value = "";
      });
    });
    var pOut = $(".form-msg", pf), questions = [];
    if (follow) {
      $("[data-plant-new]", pf).hidden = true;
      $("[data-plant-ask]", pf).hidden = false;
      $("[data-plant-submit]", pf).textContent = "Send it";
      msg(pOut, "Loading what we need...");
      if (LIVE) fetch(C.bookingEndpoint + "?action=plant_ask&id=" + encodeURIComponent(pid) + "&k=" + encodeURIComponent(pkey))
        .then(function (r) { return r.json(); }).then(function (res) {
          if (!res || !res.ok) { msg(pOut, (res && res.message) || "This link did not work. Text " + C.phoneDisplay + ".", "err"); return; }
          msg(pOut, "");
          $("[data-plant-ask-h]", pf).textContent = "Thanks " + res.first + ". A little more and I can tell you.";
          $("[data-plant-ask-list]", pf).innerHTML = (res.photos || []).map(function (p) { return "<li>&#128247; " + esc(p) + "</li>"; }).join("");
          questions = res.questions || [];
          var box = $("[data-plant-replies]", pf);
          box.innerHTML = questions.map(function (q, i) { return '<div class="field"><label for="pd-r' + i + '">' + esc(q) + '</label><input id="pd-r' + i + '" data-reply></div>'; }).join("");
          box.hidden = !questions.length;
        }).catch(function () { msg(pOut, "This link did not work. Text " + C.phoneDisplay + ".", "err"); });
      setTimeout(function () { var t = $("#plant-doctor"); if (t) t.scrollIntoView({ block: "start" }); }, 300);
    }
    pf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (pf.website.value) return;
      var payload;
      if (follow) {
        var replies = $$("[data-reply]", pf).map(function (i) { return i.value.trim(); });
        if (!pShots.length && !replies.join("")) { msg(pOut, "Add a photo or answer at least one question.", "err"); return; }
        payload = { action: "plant_more", id: pid, k: pkey, photos: pShots, replies: replies };
      } else {
        if (!pShots.length) { msg(pOut, "Add at least one photo of the plant.", "err"); return; }
        var err = requiredCheck(pf, ["description", "name", "email"]);
        if (!err && !validEmail(pf.email.value.trim())) err = "Add an email so we can send your answer.";
        if (err) { msg(pOut, err, "err"); return; }
        payload = { action: "plant", description: pf.description.value.trim(), name: pf.name.value.trim(), email: pf.email.value.trim(),
          phone: pf.phone.value.trim(), address: pf.address.value.trim(), photos: pShots, website: pf.website.value,
          answers: { plant: pf.plant.value.trim(), age: pf.age.value, water: pf.water.value.trim(), sun: pf.sun.value, when: pf.when.value.trim(), changes: pf.changes.value.trim() } };
      }
      var btn = $("[data-plant-submit]", pf); btn.disabled = true; msg(pOut, pShots.length ? "Uploading photos..." : "Sending...");
      var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 700); });
      req.then(function (res) {
        btn.disabled = false;
        if (res && res.ok) {
          var texted = !follow && !!payload.phone;
          pf.reset(); pShots = []; pDraw();
          if (follow) { $("[data-plant-replies]", pf).hidden = true; $("[data-plant-ask]", pf).hidden = true; btn.hidden = true; }
          msg(pOut, (res.preview ? "Preview only, nothing was sent. " : "") + (follow ? "Got it, thanks. Your answer is on its way." :
            "Got it. We will send your answer as soon as we have looked at your photos" + (texted ? ", by text or email." : ", by email.")), "ok");
        } else msg(pOut, (res && res.message) || "That did not go through. Text your photos to " + C.phoneDisplay + ".", "err");
      }).catch(function () { btn.disabled = false; msg(pOut, "That did not go through. Text your photos to " + C.phoneDisplay + ".", "err"); });
    });
  }

  /* ---------- 10% off first job ---------- */
  (function () {
    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (x) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (x) {} } };
    var fill = function (code) { if (code) $$("[data-promo]").forEach(function (i) { if (!i.value) i.value = code; }); };
    fill(store.get("pcl_promo"));
    var box = $("#offer"), of = $("#offer-form");
    if (!box || !of || !LIVE) return;
    if (store.get("pcl_promo") || store.get("pcl_offer_closed")) return;
    var shown = false;
    var phone = window.matchMedia("(max-width: 820px)").matches;
    var busy = function () { var f = document.activeElement; return f && /INPUT|TEXTAREA|SELECT/.test(f.tagName) && !box.contains(f); };
    var show = function () {
      if (shown) return;
      if (busy() || store.get("pcl_sent")) { clearTimeout(timer); timer = setTimeout(show, 15000); return; }
      shown = true; if (phone) box.classList.add("mini"); box.hidden = false; requestAnimationFrame(function () { box.classList.add("in"); });
    };
    var timer = setTimeout(show, phone ? 45000 : 30000);
    var onScroll = function () { if (window.scrollY > document.body.scrollHeight * 0.6) { show(); window.removeEventListener("scroll", onScroll); } };
    box.addEventListener("click", function (e) { if (box.classList.contains("mini") && !e.target.closest("[data-offer-close]")) { box.classList.remove("mini"); var i = of.email; if (i) setTimeout(function () { i.focus(); }, 50); } });
    $$("form").forEach(function (f) { if (f !== of) f.addEventListener("submit", function () { store.set("pcl_sent", "1"); }); });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget && e.clientY < 8) show(); });
    $("[data-offer-close]", box).addEventListener("click", function () { box.classList.remove("in"); box.hidden = true; store.set("pcl_offer_closed", "1"); clearTimeout(timer); });
    of.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $(".form-msg", of), email = of.email.value.trim();
      if (!validEmail(email)) { msg(out, "That email looks incomplete.", "err"); return; }
      var btn = $('button[type="submit"]', of); btn.disabled = true; msg(out, "Sending...");
      api({ action: "offer", email: email, website: of.website.value, source: location.pathname }).then(function (res) {
        btn.disabled = false;
        if (res && res.ok && res.code) {
          store.set("pcl_promo", res.code); fill(res.code);
          $(".offer-row", of).hidden = true;
          msg(out, "Your code is " + res.code + ". It's in your email and saved for when you book.", "ok");
          setTimeout(function () { box.classList.remove("in"); }, 9000);
        } else msg(out, (res && res.message) || "That did not go through. Try again in a minute.", "err");
      }).catch(function () { btn.disabled = false; msg(out, "That did not go through. Try again in a minute.", "err"); });
    });
  })();
})();
