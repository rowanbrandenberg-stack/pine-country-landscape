/*
  Pine Country Landscape site settings.
  Edit this file only. Everything else reads from here.
*/
window.PCL_CONFIG = {
  // Paste your Google Apps Script web app URL here after deploying apps-script/Code.gs.
  // Leave empty and the booking form runs in preview mode (nothing is sent).
  bookingEndpoint: "https://script.google.com/macros/s/AKfycbz1WbbEgPfjD0fyKZF-4iaELQZ5_GWeBRERWhsRrM8lNS16P09_Wk3Ee7TyUYyYNFo45w/exec",

  // The day your ROC license issues, put the number here, for example "ROC 123456".
  // That one change: shows the license badge, and turns on install/hardscape "starting at" pricing.
  // Leave it empty until the license is actually issued.
  rocNumber: "",

  // Only set true once general liability coverage is actually in force.
  insured: false,

  phoneDisplay: "(928) 863-8198",
  phoneHref: "+19288638198",

  // Booking rules (the Apps Script enforces the same rules server side).
  workDays: [0, 1, 3, 5, 6], // Sun, Mon, Wed, Fri, Sat
  dayStart: "08:00",
  dayEnd: "17:00",
  minNoticeHours: 24,
  horizonDays: 28,

  // Bookable services. id must match SERVICES in apps-script/Code.gs.
  services: [
    { id: "estimate", name: "On-site estimate", minutes: 60, price: "Free", note: "Walk the property together and get a written quote for cleanups, care plans or snow." },
    { id: "consult", name: "Design consultation", minutes: 90, price: "$150", note: "Planting, trees, beds and full-yard plans. Fee is credited toward your project." },
    { id: "cleanup", name: "Yard cleanup", minutes: 180, price: "From $450", note: "Needles, cones, leaves, weeds and debris, hauled away." },
    { id: "pruning", name: "Pruning and shrub shaping", minutes: 120, price: "From $295", note: "Shrubs, small trees and hedges shaped for health and form." },
    { id: "mowing", name: "Mowing, first cut", minutes: 120, price: "From $350", note: "Reset cut, trim and edge. Recurring visits from $170." },
    { id: "irrigation", name: "Irrigation repair", minutes: 120, price: "From $185", note: "Leaks, heads, drip lines and zones. Includes the first hour." },
    { id: "winterize", name: "Irrigation winterization", minutes: 60, price: "From $165", note: "Blow out lines before the hard freeze." },
    { id: "watering", name: "Winter watering", minutes: 60, price: "$95 / visit", note: "Deep watering for trees and shrubs through dry winter months." }
  ],

  // Snow pricing shown on the site.
  snow: {
    season: "$1,450",
    seasonNote: "Nov 1 to Apr 15. Every storm over 2 inches, on a priority route.",
    perPush: "$125",
    walks: "$35"
  },

  // Install pricing only shows once rocNumber is set.
  installPricing: [
    { name: "Tree and shrub planting", price: "From $1,200" },
    { name: "Full bed and landscape installs", price: "From $6,500" },
    { name: "Paver patios and hardscape", price: "From $12,000" }
  ]
};
