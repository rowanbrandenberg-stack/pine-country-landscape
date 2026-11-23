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
  rocNumber: "ROC 368709",

  // License classification shown next to the number.
  rocClass: "CR-21 Hardscaping and Irrigation Systems",

  // Only set true once general liability coverage is actually in force.
  insured: true,

  // Surety bond in place.
  bonded: true,

  // Show "5.0 from N reviews" next to the buttons. Only turn on when every review in reviews.js is a real customer review.
  showReviewCount: true,

  // Text us button opens the customer's messages with this already typed.
  smsBody: "Hi Rowan, I need a price on ",

  // Printed on every contract (Arizona law requires the contractor's business address on contracts over $1,000).
  legalName: "Pine Country Landscape LLC",
  businessAddress: "11600 North Onika Lane, Flagstaff, AZ 86004",
  signer: "Rowan Brandenberg, Manager",
  rocPhone: "(602) 542-1525",
  rocSite: "roc.az.gov",

  phoneDisplay: "(928) 863-8198",
  phoneHref: "+19288638198",

  // Booking rules (the Apps Script enforces the same rules server side).
  workDays: [0, 1, 3, 5, 6], // Sun, Mon, Wed, Fri, Sat
  dayStart: "08:00",
  dayEnd: "17:00",
  minNoticeHours: 24,
  horizonDays: 28,

  // Bookable services. id must match SERVICES in apps-script/Code.gs.
  // Holiday season: only estimates and cleanups are on the live calendar. Regular landscape work is on the spring waitlist.
  // Tree installs, junk removal and the snow list come in through the short form.
  services: [
    { id: "estimate", name: "On site estimate", minutes: 60, price: "Free", note: "Cleanups and junk hauls: we look at it together and you get a written price. No charge." },
    { id: "cleanup", name: "Yard cleanup", minutes: 180, price: "From $450", note: "Needles, cones, leaves, weeds and debris, hauled away." }
  ],

  // Snow pricing shown on the site.
  // Snow contracts for the 2026-27 season. These numbers also fill the online snow contract.
  snow: {
    seasonStart: "November 1, 2026",
    seasonEnd: "April 15, 2027",
    trigger: "2 inches",
    plans: [
      { id: "driveway", name: "Driveway Season", price: 800, tag: "Most popular", walks: false,
        note: "Your driveway cleared after every storm of 2 inches or more, Nov 1 to Apr 15. No limit on storms." },
      { id: "full", name: "Full Clear Season", price: 1450, tag: "", walks: true,
        note: "Driveway plus front walk, steps and entry by hand, every storm. First stops on our route." }
    ],
    perPush: "$125",
    walks: "$35",
    // Payment and cancellation terms printed on the snow contract.
    payments: 4,
    payment: "Paid in 4 equal monthly payments. No deposit to sign up.",
    missedCredit: "$125",
    // Route spots. Update spotsLeft as contracts sign; set to null to hide the counter.
    spotsTotal: 25,
    spotsLeft: 25
  },


  // Install pricing only shows once rocNumber is set.
  installPricing: [
    { name: "Tree and shrub planting", price: "From $1,200" },
    { name: "Full bed and landscape installs", price: "From $6,500" },
    { name: "Paver patios and walkways", price: "From $12,000" },
    { name: "Paver driveways", price: "By proposal" },
    { name: "New irrigation and drip systems", price: "By proposal" }
  ],

  // Christmas by Pine Country: seasonal campaign settings.
  // To retire the season: set enabled to false. That turns off the seasonal strip, the Christmas text
  // message wording and the Christmas look on service pages. Then restore the year round homepage
  // (see the note at the top of index.html).
  // All dates are calendar dates in America/Phoenix.
  christmas: {
    enabled: true,
    campaign: "Christmas by Pine Country",
    // The strip and Christmas text wording only show between these dates.
    showFrom: "2026-11-01",
    showUntil: "2026-12-25",
    // The tree form only offers preferred dates and weekends in this range, and never a date before today.
    // These are dates a customer can ASK for. They are not availability and nothing is reserved.
    requestFrom: "2026-11-22",
    requestUntil: "2026-12-24",
    // Earliest preferred day offered, in days after today. 1 means tomorrow at the soonest.
    minNoticeDays: 1,
    // Slim strip under the header. Keep it to verified facts: the cookies offer is confirmed.
    announcement: "Christmas tree installs are open, and every install comes with cookies on us.",
    announcementLink: "/#inquiry",
    announcementCta: "Request a tree install",
    // Text links marked data-sms="tree" open messages with this already typed.
    smsBody: "Hi Rowan, I'd like a Christmas tree install. My area: "
  }
};
