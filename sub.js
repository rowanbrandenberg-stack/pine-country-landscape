(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
  if (C.phoneDisplay) $$("[data-phone]").forEach(function (a) { if (a.classList.contains("btn")) { a.href = "tel:" + C.phoneHref; return; } a.textContent = C.phoneDisplay; a.href = "tel:" + C.phoneHref; });
  if (C.rocNumber) { $$("[data-roc-number]").forEach(function (el) { el.textContent = C.rocNumber; }); $$("[data-roc-badge]").forEach(function (el) { el.hidden = false; }); }
  if (C.insured) $$("[data-insured]").forEach(function (el) { el.hidden = false; });
  if (C.snow) $$("[data-snow]").forEach(function (el) { var v = C.snow[el.getAttribute("data-snow")]; if (v) el.textContent = v; });
  /* ---------- Conversion helpers: one tap text, seasonal banner, review badge ---------- */
  (function () {
    var base = location.pathname === "/" || /index\.html$/.test(location.pathname) || location.protocol === "file:" ? "" : "/";
    var smsBody = C.smsBody || "Hi Rowan, I need a price on ";
    Array.prototype.forEach.call(document.querySelectorAll("[data-sms]"), function (a) { a.href = "sms:" + (C.phoneHref || "+19288638198") + "?&body=" + encodeURIComponent(smsBody); });
    var bar = document.querySelector("[data-season]");
    if (bar) {
      var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), t = null;
      if (m === 10 || (m === 11 && day <= 20)) t = 'Before the snow: needle cleanups from $450, sprinkler blowouts from $165. <a href="' + base + '#estimate">Get an instant price</a>';
      else if ((m === 9 && day >= 15) || m === 11) t = 'Hard freeze is coming. Winterize sprinklers from $165 before it hits. <a href="' + base + '#book">Book a time</a>';
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

  var head = document.getElementById("site-head");
  var onScroll = function () { if (head) head.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
