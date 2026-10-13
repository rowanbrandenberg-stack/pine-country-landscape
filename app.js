(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TZ = "America/Phoenix";
  document.documentElement.classList.add("js");

  /* ---------- Conversion helpers: one tap text, seasonal banner, review badge ---------- */
  (function () {
    var base = location.pathname === "/" || /index\.html$/.test(location.pathname) || location.protocol === "file:" ? "" : "/";
    var smsBody = C.smsBody || "Hi Rowan, I need a price on ";
    Array.prototype.forEach.call(document.querySelectorAll("[data-sms]"), function (a) { a.href = "sms:" + (C.phoneHref || "+19288638198") + "?&body=" + encodeURIComponent(smsBody); });
    var bar = document.querySelector("[data-season]");
    if (bar) {
      var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), t = null;
      if ((m === 9 && day >= 15) || m === 10 || m === 11) t = 'Hard freeze is coming. Winterize sprinklers from $165 before it hits. <a href="' + base + '#book">Book a time</a>';
      else if (m === 12 || m <= 2) t = 'Dry winter? New trees still need water. Winter watering visits $95. <a href="' + base + '#book">Book a visit</a>';
      else if (m <= 5) t = 'Spring cleanup season is here. <a href="' + base + '#estimate">Get an instant price</a>';
      else if (m <= 8) t = 'Monsoon season: cleanups and irrigation fixes. <a href="' + base + '#estimate">Get an instant price</a>';
      else t = 'Fall cleanup spots are filling up. <a href="' + base + '#estimate">Get an instant price</a>';
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
      if (note) note.textContent = "Starting prices for typical Flagstaff lots. Every project gets a written, itemized proposal after a design consultation.";
    }
  }
  if (C.insured) $$("[data-insured]").forEach(function (el) { el.hidden = false; });
  if (C.snow && typeof C.snow.spotsLeft === "number") $$("[data-spots]").forEach(function (el) {
    el.textContent = C.snow.spotsLeft >= C.snow.spotsTotal ? "Only " + C.snow.spotsTotal + " route spots this season" : C.snow.spotsLeft > 0 ? C.snow.spotsLeft + " of " + C.snow.spotsTotal + " route spots left" : "Route full for this season. Join the waitlist below";
    el.hidden = false;
  });
  if (C.snow) $$("[data-snow]").forEach(function (el) { var v = C.snow[el.getAttribute("data-snow")]; if (v) el.textContent = v; });

  var head = $("#site-head");
  var onScroll = function () { if (head) head.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Reviews ---------- */
  var R = window.PCL_REVIEWS, track = $("#rv-track");
  if (track && R && R.items && R.items.length) {
    var starStr = function (n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "\u2605" : '<span class="off">\u2605</span>'; return s; };
    var avg = R.items.reduce(function (t, r) { return t + r.stars; }, 0) / R.items.length;
    $("#rv-score").innerHTML = "<b>" + avg.toFixed(1) + '</b><span class="stars" aria-hidden="true">' + starStr(Math.round(avg)) + "</span><span>average from " + R.items.length + " customer reviews</span>";
    track.innerHTML = R.items.map(function (r) {
      return '<figure class="rv"><span class="stars" role="img" aria-label="' + r.stars + ' out of 5 stars">' + starStr(r.stars) + "</span>" +
        "<blockquote>&ldquo;" + esc(r.text) + "&rdquo;</blockquote>" +
        '<figcaption><span class="rv-av" aria-hidden="true">' + esc(r.name.charAt(0)) + "</span><span><b>" + esc(r.name) + "</b>" + esc(r.place) + "</span></figcaption></figure>";
    }).join("");
    $$(".rv-arrow").forEach(function (b) {
      b.addEventListener("click", function () { track.scrollBy({ left: +b.getAttribute("data-dir") * track.clientWidth * 0.9, behavior: "smooth" }); });
    });
    if (R.googleReviewUrl) { var lv = $("#rv-leave"); lv.href = R.googleReviewUrl; lv.hidden = false; }
  } else if (track) { var sec = $("#reviews"); if (sec) sec.hidden = true; }

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox");
  $$("#gallery button[data-full]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!lb || !lb.showModal) { window.open(b.getAttribute("data-full"), "_blank"); return; }
      var img = $("img", lb), sm = $("img", b);
      img.src = b.getAttribute("data-full"); img.alt = sm ? sm.alt : "";
      $(".lb-cap", lb).textContent = (b.parentNode.querySelector("figcaption") || {}).textContent || "";
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
        phone: form.phone.value.trim(), email: form.email.value.trim(), notes: form.notes.value.trim(), website: form.website.value
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
          go(4);
          booker.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (res && res.error === "taken") {
          msg(out, "");
          go(2); loadSlots("That time was just taken. Please pick another.");
        } else {
          msg(out, (res && res.message) || "Something went wrong saving your booking. Call or text " + C.phoneDisplay + " and we will book it for you.", "err");
        }
      }).catch(function () {
        btn.disabled = false;
        msg(out, "We could not reach the booking system. Call or text " + C.phoneDisplay + " and we will book it for you.", "err");
      });
    });
  }

  /* ---------- Snow contract ---------- */
  var sf = $("#snow-form");
  if (sf) sf.addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $(".form-msg", sf);
    var err = requiredCheck(sf, ["name", "address"]) || contactCheck(sf);
    if (err) { msg(out, err, "err"); return; }
    if (sf.website.value) return;
    var btn = $('button[type="submit"]', sf); btn.disabled = true; msg(out, "Sending...");
    var payload = {
      action: "snow", name: sf.name.value.trim(), address: sf.address.value.trim(), phone: sf.phone.value.trim(),
      email: sf.email.value.trim(), plan: sf.plan.value, driveway: sf.driveway.value, walks: sf.walks.checked, notes: ("[2027 WAITLIST] " + sf.notes.value.trim()).trim(), website: sf.website.value
    };
    var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 600); });
    req.then(function (res) {
      btn.disabled = false;
      if (res && res.ok) { sf.reset(); msg(out, (res.preview ? "Preview only, nothing was sent. " : "") + "You are on the 2027 snow waitlist. We will reach out before next season.", "ok"); }
      else msg(out, (res && res.message) || "That did not go through. Text " + C.phoneDisplay + ".", "err");
    }).catch(function () { btn.disabled = false; msg(out, "That did not go through. Text " + C.phoneDisplay + ".", "err"); });
  });

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
        photos: shots, website: ef.website.value
      };
      var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 800); });
      req.then(function (res) {
        btn.disabled = false;
        if (res && res.ok) {
          var texted = !!payload.phone;
          ef.reset(); shots = []; drawThumbs();
          msg(out, (res.preview ? "Preview only, nothing was sent. " : "") + "Got it. Your price is on its way" + (texted ? " by text and email" : " to your email") + ", usually within 10 minutes. Want it locked in? Book a free visit below.", "ok");
        } else msg(out, (res && res.message) || "That did not go through. Text " + C.phoneDisplay + " and we will price it for you.", "err");
      }).catch(function () { btn.disabled = false; msg(out, "That did not go through. Text " + C.phoneDisplay + " and we will price it for you.", "err"); });
    });
  }
})();
