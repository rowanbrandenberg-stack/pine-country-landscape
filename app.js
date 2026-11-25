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
    var X = xmasState();
    // Season off: drop the Christmas look everywhere. Season over: drop it on service pages (the homepage is restored by hand).
    if (!X.enabled || (!X.inWindow && document.body.classList.contains("sub"))) document.documentElement.classList.remove("xmas");
    Array.prototype.forEach.call(document.querySelectorAll("[data-sms]"), function (a) {
      var body = a.getAttribute("data-sms") === "tree" && X.inWindow && X.cfg.smsBody ? X.cfg.smsBody : smsBody;
      a.href = "sms:" + (C.phoneHref || "+19288638198") + "?&body=" + encodeURIComponent(body);
    });
    var bar = document.querySelector("[data-season]");
    if (bar) {
      var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), t = null;
      if (X.inWindow && X.cfg.announcement) t = esc(X.cfg.announcement) + ' <a href="' + esc(X.cfg.announcementLink || "/#inquiry") + '" data-holiday-pick="tree">' + esc(X.cfg.announcementCta || "Request a tree install") + "</a>";
      else if (!C.christmas && (m === 11 || m === 12)) t = 'Holiday season is here: Christmas tree installs, and the cookies are on us. <a href="/#inquiry">Book yours</a>';
      else if (m === 10) t = 'Fall cleanup spots are filling up. <a href="/#inquiry">Book an estimate</a>';
      else if (m === 9 && day >= 15) t = 'Hard freeze is coming. Winterize sprinklers from $165 before it hits. <a href="/#inquiry">Book an estimate</a>';
      else if (m <= 2) t = 'Dry winter? New trees still need water. Winter watering visits $95. <a href="/#inquiry">Book an estimate</a>';
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
  // Today's calendar date in Flagstaff (America/Phoenix), as YYYY-MM-DD.
  function phxToday() { var t = todayParts(); return t.year + "-" + t.month + "-" + t.day; }
  // Christmas by Pine Country season settings from config.js, resolved against today's Phoenix date.
  function xmasState() {
    var cfg = C.christmas || {}, today = phxToday();
    var enabled = !!cfg.enabled;
    var inWindow = enabled && (!cfg.showFrom || today >= cfg.showFrom) && (!cfg.showUntil || today <= cfg.showUntil);
    var soonest = addDays(today, cfg.minNoticeDays || 0);
    var from = cfg.requestFrom && cfg.requestFrom > soonest ? cfg.requestFrom : soonest;
    var until = cfg.requestUntil || "";
    return { cfg: cfg, enabled: enabled, inWindow: inWindow, today: today, reqFrom: from, reqUntil: until, datesOpen: enabled && !!until && from <= until };
  }
  // Weekends a customer can ask for, between the request dates. Never a day before today.
  function xmasWeekends(from, until) {
    var out = [], d = from, dow = parseDay(d).getUTCDay();
    var sat = dow === 6 ? d : dow === 0 ? addDays(d, -1) : addDays(d, 6 - dow);
    for (; sat <= until; sat = addDays(sat, 7)) {
      var sun = addDays(sat, 1), days = [];
      if (sat >= from) days.push(sat);
      if (sun >= from && sun <= until) days.push(sun);
      if (!days.length) continue;
      out.push({ value: days.join(" or "), label: days.map(function (x) { return fmtDay(x, { weekday: "short", month: "short", day: "numeric" }); }).join(" or ") });
    }
    return out;
  }
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
  // Which calendar service fits what someone just asked for in the short form.
  function bookFor(service, desc) {
    var d = String(desc || "").toLowerCase(), winter = /winteri|blow ?out|blowout|freez|shut ?off|drain/.test(d);
    if (service === "irrigation") return winter ? "winterize" : "irrigation";
    var map = { cleanup: "cleanup", pruning: "pruning", mowing: "mowing", hardscape: "consult", planting: "estimate" };
    var id = map[service] || (winter ? "winterize" : "estimate");
    return (C.services || []).some(function (s) { return s.id === id; }) ? id : "estimate";
  }
  var iq = $("#inq-form");
  var TP = window.PCLTreePricing, TPC = (C.christmas && C.christmas.pricing) || null;
  var money = function (c) { return TP ? TP.money(c) : ""; };

  // Tree install rate card on the page, built from config.js so prices live in one place.
  (function () {
    var box = $("[data-tree-rates]"); if (!box) return;
    if (!TP || !TPC || !TPC.bands) { box.hidden = true; return; }
    var n = $("[data-tree-notice]", box); if (n && TPC.notice) n.textContent = TPC.notice;
    $("[data-rate-rows]", box).innerHTML = TPC.bands.map(function (b) {
      var svc = b.custom ? "Custom quote" : esc(money(TP.cents(b.service))) + (b.accessReview ? "<small>after an access review</small>" : "");
      var rem = b.custom ? "Custom quote" : money(TP.cents(b.removal));
      return "<tr><th scope=\"row\">" + esc(b.label) + "</th><td>" + svc + "</td><td>" + esc(rem) + "</td></tr>";
    }).join("");
  })();

  // Pick a request type on the form: from a button (data-holiday-pick) or a link like /?pick=cleanup#inquiry.
  var qzJumpPastKind = null;
  function pickKind(k) {
    if (!iq || !k) return false;
    var hit = false;
    Array.prototype.forEach.call(iq.service.options, function (o, i) { if (!hit && o.getAttribute("data-key") === k) { iq.service.selectedIndex = i; hit = true; } });
    if (hit) {
      var r = iq.querySelector('input[name="kindPick"][value="' + k + '"]'); if (r) r.checked = true;
      iq.service.dispatchEvent(new Event("change", { bubbles: true }));
      if (qzJumpPastKind) qzJumpPastKind();
    }
    return hit;
  }
  if (iq) $$("[data-holiday-pick]").forEach(function (b) {
    b.addEventListener("click", function () { pickKind(b.getAttribute("data-holiday-pick")); });
  });

  if (iq) {
    var iqShots = [], iqThumbs = $("#iq-thumbs"), iqStarted = false, iqBusy = false, iqRid = null;
    var XS = xmasState();
    var kindNow = function () { var o = iq.service.options[iq.service.selectedIndex]; return (o && o.getAttribute("data-key")) || ""; };
    var radioVal = function (name) { var r = iq.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; };
    var steps = $$(".qs", iq), cur = null, out = $(".form-msg", iq);

    // Preferred date choices: only today onward (Phoenix time) and inside the request dates from config.js.
    var dIn = iq.treeDate, wSel = iq.treeWeekend;
    if (XS.datesOpen) {
      dIn.min = XS.reqFrom; dIn.max = XS.reqUntil;
      xmasWeekends(XS.reqFrom, XS.reqUntil).forEach(function (w) { var o = document.createElement("option"); o.value = w.value; o.textContent = w.label; wSel.appendChild(o); });
      if (wSel.options.length < 2) { var wr = iq.querySelector('input[name="when"][value="weekend"]'); if (wr) wr.closest("label").hidden = true; }
    } else {
      ["date", "weekend"].forEach(function (v) { var r = iq.querySelector('input[name="when"][value="' + v + '"]'); if (r) r.closest("label").hidden = true; });
      var closed = $("[data-dates-closed]", iq); if (closed) closed.hidden = false;
    }

    // Which questions apply right now. Inactive ones are disabled so they are never sent or checked.
    var isActive = function (st) {
      var tree = kindNow() === "tree";
      if (st.getAttribute("data-for") === "tree" && !tree) return false;
      var show = st.getAttribute("data-show");
      if (show) {
        var neg = show.indexOf("!=") > 0, p = show.split(neg ? "!=" : "="), v = iq[p[0]] && iq[p[0]].tagName === "SELECT" ? iq[p[0]].value : radioVal(p[0]);
        if (neg ? v === p[1] : v !== p[1]) return false;
      }
      return true;
    };
    var isOptional = function (st) {
      var id = st.getAttribute("data-step");
      if (st.hasAttribute("data-optional")) return true;
      if (id === "description") return kindNow() === "tree";
      return ["treeStand", "removal", "stairs"].indexOf(id) >= 0;
    };
    // Non tree requests ask what needs doing right after the first question.
    var active = function () {
      var list = steps.filter(isActive);
      if (kindNow() !== "tree") { var d = steps.filter(function (s) { return s.getAttribute("data-step") === "description"; })[0], i = list.indexOf(d); if (i > 1) { list.splice(i, 1); list.splice(1, 0, d); } }
      return list;
    };
    var hasValue = function (st) {
      return $$("input, select, textarea", st).some(function (el) {
        if (el.type === "radio" || el.type === "checkbox") return el.checked;
        if (el.type === "file") return iqShots.length > 0;
        return !!String(el.value || "").trim();
      });
    };

    // Labels that change with the request type.
    var syncLabels = function () {
      var tree = kindNow() === "tree";
      var lab = $("[data-desc-label]", iq); if (lab) lab.textContent = tree ? "Anything else Rowan should know?" : "What do you need done?";
      iq.description.placeholder = tree ? "The room it goes in, the kind of tree you like, questions for Rowan" : "Example: pine needle cleanup in the front and side yard, and an old couch to haul off";
      var al = $("[data-area-label]", iq); if (al) al.textContent = tree ? "Where is the tree going?" : "Where is the work?";
      var ah = $("[data-area-help]", iq); if (ah) ah.textContent = tree ? "Your street address lets Rowan confirm delivery. A neighborhood is fine for now." : "A street address, or a neighborhood and ZIP.";
      var pl = $("[data-photos-label]", iq); if (pl) pl.textContent = tree ? "Add a photo of the spot or the doorway" : "Add a few photos of the work";
      var sb = $("[data-submit-label]", iq); if (sb) sb.textContent = tree ? "Send my tree request" : "Send my request";
      var hbx = iq.querySelector('input[name="treeHeight"]:checked'), band = hbx ? hbx.getAttribute("data-band") : "";
      var rp = $("[data-removal-price]", iq);
      if (rp && TP && TPC) {
        var b = band ? TP.bandById(band, TPC) : null;
        rp.textContent = b ? (b.custom ? "(quoted individually)" : "(" + money(TP.cents(b.removal)) + ")") : "";
      }
    };

    // Live estimate from the rate card. Always an estimate: the tree, stand and extras are confirmed by Rowan.
    var estimateNow = function () {
      if (kindNow() !== "tree" || !TP || !TPC) return null;
      var hb = iq.querySelector('input[name="treeHeight"]:checked');
      var flags = [], stairs = radioVal("stairs"), acc = iq.access.value.trim();
      if (stairs && stairs !== "No stairs") flags.push("Stairs: " + stairs);
      if (acc) flags.push("Access: " + acc);
      return TP.formEstimate({
        bandId: hb ? hb.getAttribute("data-band") : "", hasTree: radioVal("hasTree"), stand: radioVal("treeStand"),
        removal: radioVal("removal") === "yes", deliveryOnly: radioVal("svcType") === "delivery", accessFlags: flags
      }, TPC);
    };
    var drawEstimate = function () {
      var box = $("[data-est-box]", iq), q = estimateNow();
      if (!box) return;
      if (!q) { box.hidden = true; return; }
      box.hidden = false;
      $("[data-est-kind]", box).textContent = q.label;
      $("[data-est-notice]", box).textContent = TPC.notice || "";
      $("[data-est-lines]", box).innerHTML = q.lines.map(function (l) {
        var amt = l.status === "priced" ? money(l.cents) : (l.status === "omitted" ? "" : "");
        var note = l.status === "custom" ? "Quoted individually" : l.note || "";
        return "<li><span>" + esc(l.label) + (l.status === "priced" && l.note ? "<small>" + esc(l.note) + "</small>" : "") + "</span><b>" + esc(amt || note) + "</b></li>";
      }).join("");
      var known = $("[data-est-known]", box);
      known.textContent = q.kind === "custom" ? "Rowan sends you a custom quote for this one." : (q.knownCents ? "Service so far: " + money(q.knownCents) + ". Not a final total." : "");
      var fine = [];
      if (q.band && q.band.accessReview) fine.push("Trees over 10 ft are priced after an access review.");
      if (q.lines.some(function (l) { return l.key === "removal"; })) fine.push("Removal is scheduled separately and no date is reserved.");
      if (radioVal("stairs") && radioVal("stairs") !== "No stairs" || iq.access.value.trim()) fine.push("Rowan reviews stairs and access before your price is final. Nothing is added without your OK.");
      fine.push("Decorating and lights are not included.");
      $("[data-est-fine]", box).textContent = fine.join(" ");
    };

    // Field level errors: the message sits under the question and is read with it. Everything typed stays put.
    var clearErrs = function () {
      $$("[aria-invalid]", iq).forEach(function (el) { el.removeAttribute("aria-invalid"); });
      $$(".field-err", iq).forEach(function (el) { el.textContent = ""; el.hidden = true; });
      $$("[data-invalid]", iq).forEach(function (el) { el.removeAttribute("data-invalid"); });
      msg(out, "");
    };
    var fieldErr = function (el, errId, text) {
      var e = errId && document.getElementById(errId);
      if (e) { e.textContent = text; e.hidden = false; }
      if (el) {
        if (el.tagName === "FIELDSET") { el.setAttribute("data-invalid", ""); var first = el.querySelector("input:not([disabled])"); if (first) first.focus(); }
        else { el.setAttribute("aria-invalid", "true"); el.focus(); }
      }
      return false;
    };
    // Checks one question. Returns true when it is OK to move on.
    var checkStep = function (st) {
      var id = st.getAttribute("data-step"), prefer = radioVal("prefer") || "Text";
      switch (id) {
        case "hasTree": return radioVal("hasTree") ? true : fieldErr(st, "iq-has-err", "Let us know if you already have your tree.");
        case "treeHeight": return radioVal("treeHeight") ? true : fieldErr(st, "iq-height-err", "Pick a height, or choose Not sure, help me choose.");
        case "when": return radioVal("when") ? true : fieldErr(st, "iq-when-err", "Pick a day, a weekend, or I'm flexible.");
        case "treeDate":
          var dv = iq.treeDate.value;
          if (!dv) return fieldErr(iq.treeDate, "iq-date-err", "Pick the day you would like.");
          if (dv < XS.reqFrom || dv > XS.reqUntil) return fieldErr(iq.treeDate, "iq-date-err", "Pick a day between " + fmtDay(XS.reqFrom, { month: "short", day: "numeric" }) + " and " + fmtDay(XS.reqUntil, { month: "short", day: "numeric" }) + ".");
          return true;
        case "treeWeekend": return iq.treeWeekend.value ? true : fieldErr(iq.treeWeekend, "iq-weekend-err", "Pick the weekend you would like.");
        case "area": return iq.area.value.trim() ? true : fieldErr(iq.area, "iq-area-err", kindNow() === "tree" ? "Add the address or neighborhood where the tree is going." : "Please add your neighborhood or ZIP code.");
        case "description": return kindNow() === "tree" || iq.description.value.trim() ? true : fieldErr(iq.description, "iq-desc-err", "Tell us a little about the work.");
        case "name": return iq.name.value.trim() ? true : fieldErr(iq.name, "iq-name-err", "Please add your name.");
        case "prefer": return radioVal("prefer") ? true : fieldErr(st, "iq-prefer-err", "Pick how you would like to hear back.");
        case "phone":
          var ph = iq.phone.value.trim();
          if (!ph) return fieldErr(iq.phone, "iq-phone-err", "Add a mobile number so Rowan can " + (prefer === "Call" ? "call" : "text") + " you.");
          return validPhone(ph) ? true : fieldErr(iq.phone, "iq-phone-err", "That phone number looks short. Include the area code.");
        case "email":
          var em = iq.email.value.trim();
          if (!em) return fieldErr(iq.email, "iq-email-err", "Add your email, since that is how you would like to hear back.");
          return validEmail(em) ? true : fieldErr(iq.email, "iq-email-err", "That email address looks incomplete.");
      }
      return true;
    };

    // One question at a time.
    var navBack = $("[data-qz-back]", iq), navNext = $("[data-qz-next]", iq), navSkip = $("[data-qz-skip]", iq);
    var refresh = function () {
      var list = active();
      steps.forEach(function (st) {
        var on = list.indexOf(st) >= 0;
        $$("input, select, textarea", st).forEach(function (el) { el.disabled = !on; });
        st.hidden = st !== cur;
      });
      var i = list.indexOf(cur), n = list.length;
      var cnt = $("[data-qz-count]", iq); if (cnt) cnt.textContent = cur && cur.getAttribute("data-step") === "review" ? "Last step" : "Question " + (i + 1) + " of " + (n - 1);
      var bar = $("[data-qz-bar]", iq); if (bar) bar.style.width = Math.round(((i + 1) / n) * 100) + "%";
      var last = cur && cur.getAttribute("data-step") === "review";
      navBack.hidden = i <= 0;
      var opt = cur && isOptional(cur) && !hasValue(cur);
      navSkip.hidden = last || !opt;
      navNext.hidden = last || opt;
      syncLabels();
      if (last) drawEstimate();
    };
    var goTo = function (st, how) {
      if (!st) return;
      cur = st; clearErrs(); refresh();
      if (how === "silent") return;
      var top = iq.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) iq.scrollIntoView({ behavior: "smooth", block: "start" });
      var field = st.querySelector("input:not([type=radio]):not([type=file]):not([disabled]), textarea:not([disabled])");
      if (field && how === "type") field.focus({ preventScroll: true });
      else { st.setAttribute("tabindex", "-1"); st.focus({ preventScroll: true }); }
    };
    var stepAfter = function (st, dir) {
      var list = active(), i = list.indexOf(st);
      return list[i + dir] || null;
    };
    var advTimer = null;
    var next = function () {
      clearTimeout(advTimer);
      if (!cur || !checkStep(cur)) return;
      var nx = stepAfter(cur, 1); if (!nx) return;
      var typed = nx.querySelector("input:not([type=radio]):not([type=file]), textarea");
      goTo(nx, typed ? "type" : "step");
    };
    navNext.addEventListener("click", next);
    navSkip.addEventListener("click", function () { var nx = stepAfter(cur, 1); if (nx) goTo(nx, "step"); });
    navBack.addEventListener("click", function () { clearTimeout(advTimer); var pv = stepAfter(cur, -1); if (pv) goTo(pv, "step"); });

    // Tapping an answer moves straight on to the next question.
    iq.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "kindPick") {
        var o = Array.prototype.filter.call(iq.service.options, function (x) { return x.getAttribute("data-key") === t.value; })[0];
        if (o) iq.service.selectedIndex = o.index;
      }
      iqRid = null;
      refresh();
      if (!cur || !cur.contains(t) || !cur.hasAttribute("data-auto")) return;
      if (t.type === "radio" || (t.tagName === "SELECT" && t.value)) { clearTimeout(advTimer); advTimer = setTimeout(next, 260); }
    });
    // A tap on the answer that is already picked also moves on.
    iq.addEventListener("click", function (e) {
      var lab = e.target.closest && e.target.closest(".seg label");
      if (!lab || !cur || !cur.contains(lab) || !cur.hasAttribute("data-auto")) return;
      var r = lab.querySelector("input[type=radio]");
      if (r && r.checked) { clearTimeout(advTimer); advTimer = setTimeout(next, 260); }
    });
    iq.addEventListener("input", function () {
      if (!iqStarted) { iqStarted = true; track("inquiry_start"); }
      iqRid = null;
      if (cur && isOptional(cur)) { var opt = !hasValue(cur); navSkip.hidden = !opt; navNext.hidden = opt; }
    });
    // Enter on a typed answer goes to the next question instead of sending the form early.
    iq.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !cur || cur.getAttribute("data-step") === "review") return;
      var t = e.target; if (t.tagName === "TEXTAREA" || t.tagName === "BUTTON") return;
      e.preventDefault(); if (isOptional(cur) && !hasValue(cur)) navSkip.click(); else next();
    });

    var start = steps[0];
    qzJumpPastKind = function () { if (cur === start) goTo(stepAfter(start, 1), "silent"); };
    goTo(start, "silent");
    try { pickKind(new URLSearchParams(location.search).get("pick")); } catch (x) {}

    var drawIq = function () {
      iqThumbs.innerHTML = iqShots.map(function (src, i) { return '<figure><img src="' + src + '" alt="Photo ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo ' + (i + 1) + '">&times;</button></figure>'; }).join("");
      $$("[data-rm]", iqThumbs).forEach(function (b) { b.addEventListener("click", function () { iqShots.splice(+b.getAttribute("data-rm"), 1); drawIq(); refresh(); }); });
      refresh();
    };
    $("#iq-photos").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, 6 - iqShots.length);
      Promise.all(files.map(function (f) { return shrinkPhoto(f).catch(function () { return null; }); })).then(function (list) {
        list.forEach(function (d) { if (d && iqShots.length < 6) iqShots.push(d); }); drawIq(); e.target.value = "";
      });
    });

    // Every tree answer goes into the description the backend already saves and emails to Rowan,
    // and also as a separate "tree" object for when the Apps Script learns the new columns.
    var treeDetails = function () {
      var when = radioVal("when"), hb = iq.querySelector('input[name="treeHeight"]:checked'), d = {
        hasTree: radioVal("hasTree"), treeWhere: iq.treeWhere.disabled ? "" : iq.treeWhere.value.trim(),
        height: radioVal("treeHeight"), bandId: hb ? hb.getAttribute("data-band") : "", ceiling: iq.ceiling.value.trim(), stand: radioVal("treeStand"),
        service: radioVal("svcType") === "delivery" ? "Delivery only" : "Pickup, delivery and install",
        removal: radioVal("removal") === "yes",
        when: when, date: when === "date" ? iq.treeDate.value : "", weekend: when === "weekend" ? iq.treeWeekend.value : "",
        stairs: radioVal("stairs"), access: iq.access.value.trim()
      };
      var whenText = when === "date" && d.date ? fmtDay(d.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : when === "weekend" && d.weekend ? "Weekend of " + d.weekend.split(" or ").map(function (x) { return fmtDay(x, { weekday: "short", month: "short", day: "numeric" }); }).join(" or ")
        : "Flexible";
      d.whenText = whenText + " (requested, not confirmed)";
      var q = estimateNow();
      d.estimate = q ? { label: q.label, kind: q.kind, knownCents: q.knownCents, lines: q.lines.map(function (l) { return { key: l.key, label: l.label, cents: l.cents, status: l.status }; }), notice: TPC.notice } : null;
      d.lines = [
        "Christmas tree install request",
        "Has a tree: " + d.hasTree + (d.treeWhere ? " (now at: " + d.treeWhere + ")" : ""),
        "Tree height: " + d.height + (d.ceiling ? ", ceiling " + d.ceiling : ""),
        "Service: " + d.service,
        "Stand: " + (d.stand || "not said"),
        "Removal after the holidays: " + (d.removal ? "yes (scheduled separately)" : "no"),
        "Preferred date: " + d.whenText,
        "Stairs: " + (d.stairs || "not said"),
        "Access notes: " + (d.access || "none")
      ];
      if (q) d.lines.push(q.label + " shown to customer: " + q.lines.map(function (l) { return l.label + " " + (l.status === "priced" ? money(l.cents) : l.status === "omitted" ? "(customer supplies)" : "(to confirm)"); }).join("; ") + (q.kind === "custom" ? ". Custom quote needed." : ". Service so far " + money(q.knownCents) + "."));
      return d;
    };

    iq.addEventListener("submit", function (e) {
      e.preventDefault();
      if (iqBusy) return;
      var tree = kindNow() === "tree";
      // Check every question that applies. Jump back to the first one that needs an answer.
      var list = active();
      clearErrs();
      for (var i = 0; i < list.length; i++) {
        cur = list[i]; refresh();
        if (!checkStep(list[i])) { var em = $(".field-err:not([hidden])", list[i]); msg(out, em ? em.textContent : "Please finish this question.", "err"); return; }
      }
      cur = list[list.length - 1]; refresh();
      var prefer = radioVal("prefer") || "Text";
      var f = { name: iq.name.value.trim(), phone: iq.phone.disabled ? "" : iq.phone.value.trim(), email: iq.email.disabled ? "" : iq.email.value.trim(), area: iq.area.value.trim(), description: iq.description.value.trim() };
      var td = null;
      if (tree) {
        td = treeDetails();
        f.description = (td.lines.join("\n") + (f.description ? "\nNotes: " + f.description : "")).slice(0, 1800);
      }
      if (iq.website.value) return;
      // One request id per filled out form: a retry after a timeout or a double tap cannot create a second lead.
      if (!iqRid) iqRid = "iq-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      iqBusy = true;
      var btn = $('button[type="submit"]', iq), btnText = btn.textContent;
      btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = "Sending...";
      msg(out, iqShots.length ? "Sending your request and photos..." : "Sending your request...");
      var utm = ""; try { var u = JSON.parse(sessionStorage.getItem("pcl_utm") || "null"); if (u) utm = [u.src, u.med, u.cmp].filter(Boolean).join(" / "); } catch (x) {}
      var opt = iq.service.options[iq.service.selectedIndex], tag = opt && opt.getAttribute("data-tag");
      if (tag) f.description = "[" + tag + "] " + f.description;
      var payload = Object.assign({ action: "inquiry", rid: iqRid, service: iq.service.value, kind: (opt && opt.getAttribute("data-key")) || "", prefer: prefer, photos: iqShots, page: location.pathname, ref: document.referrer.slice(0, 200), utm: utm, website: iq.website.value }, f);
      if (td) {
        payload.tree = { hasTree: td.hasTree, treeWhere: td.treeWhere, height: td.height, bandId: td.bandId, ceiling: td.ceiling, stand: td.stand, service: td.service, removal: td.removal, when: td.when, date: td.date, weekend: td.weekend, stairs: td.stairs, access: td.access };
        payload.estimate = td.estimate;
      }
      var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 45000); });
      var req = LIVE ? Promise.race([api(payload), timeout]) : new Promise(function (r) { setTimeout(function () { r({ ok: true, preview: true }); }, 700); });
      req.then(function (res) {
        if (!res || !res.ok) throw Object.assign(new Error("rejected"), { res: res });
        track("inquiry_success", payload.kind || payload.service || "none");
        var done = $("#inq-done"), first = f.name.split(" ")[0];
        var how = prefer === "Email" ? "by email" : prefer === "Call" ? "with a call" : "by text";
        var title = $("[data-inq-done-title]", done), nxt = $("[data-inq-next]", done);
        if (tree) {
          if (title) title.textContent = "Your tree request is in.";
          $("[data-inq-done-text]", done).textContent = (res.preview ? "Preview only, nothing was sent. " : "") + "Thanks, " + first + ". Rowan will reply " + how + " with your tree and stand options and the exact total. Nothing is bought, charged or scheduled until you approve." + (f.email ? " A copy of your request is on its way to " + f.email + "." : "");
          if (nxt) nxt.hidden = false;
        } else {
          $("[data-inq-done-text]", done).textContent = (res.preview ? "Preview only, nothing was sent. " : "") + "Thanks, " + first + ". Rowan has your request and will get back to you " + how + "." + (f.email ? " A confirmation is on its way to " + f.email + "." : "");
        }
        var bookId = bookFor(payload.service, f.description), bookA = $("[data-inq-book]", done);
        if (payload.kind === "tree" || payload.kind === "waitlist" || payload.kind === "junk") { if (bookA) bookA.parentNode.hidden = true; var bn = $(".inq-book-note", done); if (bn) bn.hidden = true; bookA = null; }
        if (bookA) {
          if (payload.service === "snow") { bookA.href = "/snow-removal-flagstaff/"; bookA.textContent = "See how the snow list works"; }
          else {
            bookA.href = "?book=" + bookId + "#book";
            bookA.addEventListener("click", function (ev) {
              if (window.pclPickService && window.pclPickService(bookId)) { ev.preventDefault(); track("inquiry_book_click", bookId); var bk = $("#book"); if (bk) bk.scrollIntoView({ behavior: "smooth", block: "start" }); }
            });
          }
        }
        iq.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      }).catch(function (err) {
        var res = err && err.res;
        track("inquiry_error", res ? (res.field || "rejected") : (err && err.message === "timeout" ? "timeout" : "network"));
        var fld = res && res.field && (res.field === "contact" ? iq.phone : iq[res.field]);
        if (fld && fld.setAttribute) { fld.setAttribute("aria-invalid", "true"); var st = fld.closest && fld.closest(".qs"); if (st && st !== cur) goTo(st, "silent"); }
        // Everything typed stays in the form, so a retry is one tap.
        msg(out, (res && res.message) || "That did not go through. Your details are still here, so try again, or text " + C.phoneDisplay + " and we will take it from there.", "err");
        out.focus({ preventScroll: true });
      }).then(function () { iqBusy = false; btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = btnText; });
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

    // Links in texts and emails: ?book=winterize opens the calendar with that service already picked.
    window.pclPickService = function (id) { if (svcById(id)) { chooseService(id); return true; } return false; };
    try {
      var wantSvc = new URLSearchParams(location.search).get("book");
      if (wantSvc && svcById(wantSvc)) setTimeout(function () {
        chooseService(wantSvc); var bk = $("#book"); if (bk) bk.scrollIntoView({ block: "start" }); track("book_link", wantSvc);
      }, 0);
    } catch (x) {}

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
    var planName = { "per-push": "Snow list, on call" }[d.plan] || d.plan;
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
        sf.reset(); msg(out, "You are on the snow list. A standard driveway and walks is $99 a snowfall. Rowan will text you to confirm.", "ok");
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
