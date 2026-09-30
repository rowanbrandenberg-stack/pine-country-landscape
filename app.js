(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TZ = "America/Phoenix";
  document.documentElement.classList.add("js");

  /* ---------- Site settings ---------- */
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

    function loadSlots() {
      var daysEl = $("#days"), slotsEl = $("#slots");
      daysEl.innerHTML = ""; slotsEl.innerHTML = '<div class="skeleton" style="grid-column:1/-1"></div>';
      var req = LIVE
        ? fetch(C.bookingEndpoint + "?action=slots&service=" + encodeURIComponent(S.svc.id)).then(function (r) { return r.json(); })
        : demoSlots(S.svc.minutes);
      req.then(function (res) {
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
      }).catch(function () {
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
          go(2); loadSlots();
          setTimeout(function () { var s = $("#slots"); s.insertAdjacentHTML("afterbegin", '<p class="slots-empty">That time was just taken. Please pick another.</p>'); }, 900);
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
      email: sf.email.value.trim(), plan: sf.plan.value, driveway: sf.driveway.value, walks: sf.walks.checked, notes: sf.notes.value.trim(), website: sf.website.value
    };
    var req = LIVE ? api(payload) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 600); });
    req.then(function (res) {
      btn.disabled = false;
      if (res && res.ok) { sf.reset(); msg(out, (res.preview ? "Preview only, nothing was sent. " : "") + "You are on the list. We will confirm your spot and price within one business day.", "ok"); }
      else msg(out, (res && res.message) || "That did not go through. Call or text " + C.phoneDisplay + ".", "err");
    }).catch(function () { btn.disabled = false; msg(out, "That did not go through. Call or text " + C.phoneDisplay + ".", "err"); });
  });
})();
