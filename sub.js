(function () {
  "use strict";
  var C = window.PCL_CONFIG || {};
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
  if (C.phoneDisplay) $$("[data-phone]").forEach(function (a) { if (a.classList.contains("btn")) { a.href = "tel:" + C.phoneHref; return; } a.textContent = C.phoneDisplay; a.href = "tel:" + C.phoneHref; });
  if (C.rocNumber) { $$("[data-roc-number]").forEach(function (el) { el.textContent = C.rocNumber; }); $$("[data-roc-badge]").forEach(function (el) { el.hidden = false; }); }
  if (C.insured) $$("[data-insured]").forEach(function (el) { el.hidden = false; });
  if (C.snow) $$("[data-snow]").forEach(function (el) { var v = C.snow[el.getAttribute("data-snow")]; if (v) el.textContent = v; });
  var head = document.getElementById("site-head");
  var onScroll = function () { if (head) head.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
