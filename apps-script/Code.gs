/**
 * Pine Country Landscape booking backend.
 * Runs as rowanbrandenberg@gmail.com, reads and writes that Google Calendar,
 * emails booking alerts, and logs every booking and snow signup to a Google Sheet.
 *
 * Deploy: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
 * Paste the /exec URL into config.js as bookingEndpoint.
 */

const OWNER_EMAIL = 'rowanbrandenberg@gmail.com';
const BUSINESS_NAME = 'Pine Country Landscape';
const BUSINESS_PHONE = '(928) 863-8198';
const CALENDAR_ID = 'primary';           // the calendar of the account that deploys this script
const TZ_OFFSET = '-07:00';              // Arizona, no daylight saving
const TZ = 'America/Phoenix';

const WORK_DAYS = [0, 1, 3, 5, 6];       // Sun, Mon, Wed, Fri, Sat
const DAY_START_MIN = 8 * 60;            // 8:00 am
const DAY_END_MIN = 17 * 60;             // 5:00 pm
const STEP_MIN = 30;                     // start times every 30 minutes
const TRAVEL_BUFFER_MIN = 30;            // kept clear before and after every calendar event
const MIN_NOTICE_HOURS = 24;
const HORIZON_DAYS = 28;
const MAX_BOOKINGS_PER_DAY = 4;          // website bookings per day, counted by tag

// All day events only block a day when their title starts with one of these words.
// Example: an all day event called "OFF" or "Block: family trip" closes that day for booking.
const ALL_DAY_BLOCK = /^\s*(off|block|blocked|busy|closed|vacation|pto|out)\b/i;

// Must match the ids in config.js
const SERVICES = {
  estimate:   { name: 'On-site estimate',          minutes: 60 },
  consult:    { name: 'Design consultation',       minutes: 90 },
  cleanup:    { name: 'Yard cleanup',              minutes: 180 },
  pruning:    { name: 'Pruning and shrub shaping', minutes: 120 },
  mowing:     { name: 'Mowing, first cut',         minutes: 120 },
  irrigation: { name: 'Irrigation repair',         minutes: 120 },
  winterize:  { name: 'Irrigation winterization',  minutes: 60 },
  watering:   { name: 'Winter watering',           minutes: 60 }
};

const FLAG_LAT = 35.1983, FLAG_LNG = -111.6513;

/* ---------------- HTTP ---------------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'slots') return json(getSlots_(p.service));
    return json({ ok: true, service: 'pcl-booking' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server' });
  }
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return json({ ok: false, message: 'Bad request.' }); }
  if (d.website) return json({ ok: true }); // honeypot, silently ignore bots
  try {
    if (d.action === 'book') return json(book_(d));
    if (d.action === 'snow') return json(snow_(d));
    return json({ ok: false, message: 'Unknown request.' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, message: 'Something went wrong on our side. Call or text ' + BUSINESS_PHONE + ' and we will book it for you.' });
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Availability ---------------- */

function cal_() { return CALENDAR_ID === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(CALENDAR_ID); }

function dayString_(date) { return Utilities.formatDate(date, TZ, 'yyyy-MM-dd'); }
function at_(ds, minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0'), mm = String(minutes % 60).padStart(2, '0');
  return new Date(ds + 'T' + hh + ':' + mm + ':00' + TZ_OFFSET);
}
function hm_(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
function dow_(ds) { return new Date(ds + 'T12:00:00' + TZ_OFFSET).getUTCDay(); }
function addDays_(ds, n) { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

function busyIntervals_(from, to) {
  const events = cal_().getEvents(from, to);
  const busy = [], perDay = {};
  events.forEach(function (ev) {
    try { if (ev.getMyStatus && ev.getMyStatus() === CalendarApp.GuestStatus.NO) return; } catch (x) {}
    if (ev.isAllDayEvent()) {
      if (ALL_DAY_BLOCK.test(ev.getTitle())) busy.push([ev.getAllDayStartDate().getTime(), ev.getAllDayEndDate().getTime()]);
      return;
    }
    busy.push([ev.getStartTime().getTime() - TRAVEL_BUFFER_MIN * 60000, ev.getEndTime().getTime() + TRAVEL_BUFFER_MIN * 60000]);
    if (ev.getTag('pcl') === 'booking') {
      const k = dayString_(ev.getStartTime()); perDay[k] = (perDay[k] || 0) + 1;
    }
  });
  return { busy: busy, perDay: perDay };
}

function freeTimesForDay_(ds, minutes, busyInfo, earliestMs) {
  if (WORK_DAYS.indexOf(dow_(ds)) < 0) return [];
  if ((busyInfo.perDay[ds] || 0) >= MAX_BOOKINGS_PER_DAY) return [];
  const out = [];
  for (let m = DAY_START_MIN; m + minutes <= DAY_END_MIN; m += STEP_MIN) {
    const s = at_(ds, m).getTime(), e = s + minutes * 60000;
    if (s < earliestMs) continue;
    const clash = busyInfo.busy.some(function (b) { return s < b[1] && e > b[0]; });
    if (!clash) out.push(hm_(m));
  }
  return out;
}

function getSlots_(serviceId) {
  const svc = SERVICES[serviceId];
  if (!svc) return { ok: false, error: 'service' };
  const cache = CacheService.getScriptCache(), key = 'slots_' + serviceId;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const today = dayString_(new Date());
  const from = at_(today, 0), to = at_(addDays_(today, HORIZON_DAYS + 1), 0);
  const info = busyIntervals_(from, to);
  const earliest = Date.now() + MIN_NOTICE_HOURS * 3600000;
  const days = {};
  for (let i = 1; i <= HORIZON_DAYS; i++) {
    const ds = addDays_(today, i);
    if (WORK_DAYS.indexOf(dow_(ds)) < 0) continue;
    days[ds] = freeTimesForDay_(ds, svc.minutes, info, earliest);
  }
  const res = { ok: true, days: days };
  cache.put(key, JSON.stringify(res), 60); // one minute, keeps the calendar fresh
  return res;
}

/* ---------------- Booking ---------------- */

function clean_(s, max) { return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }
function validEmail_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function validPhone_(v) { return v.replace(/\D/g, '').length >= 10; }

function book_(d) {
  const svc = SERVICES[d.service];
  const ds = clean_(d.date, 10), tm = clean_(d.time, 5);
  const name = clean_(d.name, 80), address = clean_(d.address, 200);
  const phone = clean_(d.phone, 30), email = clean_(d.email, 120), notes = clean_(d.notes, 1000);

  if (!svc || !/^\d{4}-\d{2}-\d{2}$/.test(ds) || !/^\d{2}:\d{2}$/.test(tm)) return { ok: false, message: 'Please pick a service and a time.' };
  if (!name || !address) return { ok: false, message: 'Please add your name and the service address.' };
  if (!phone && !email) return { ok: false, message: 'Add a phone number or an email so we can confirm.' };
  if (phone && !validPhone_(phone)) return { ok: false, message: 'That phone number looks short. Include the area code.' };
  if (email && !validEmail_(email)) return { ok: false, message: 'That email address looks incomplete.' };

  // Light rate limit per contact
  const cache = CacheService.getScriptCache(), rk = 'rl_' + (email || phone.replace(/\D/g, ''));
  const count = Number(cache.get(rk) || 0);
  if (count >= 3) return { ok: false, message: 'You have booked a few visits already. Call or text ' + BUSINESS_PHONE + ' and we will sort it out.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const startMin = Number(tm.slice(0, 2)) * 60 + Number(tm.slice(3));
    const info = busyIntervals_(at_(ds, 0), at_(addDays_(ds, 1), 0));
    const free = freeTimesForDay_(ds, svc.minutes, info, Date.now() + MIN_NOTICE_HOURS * 3600000);
    if (free.indexOf(tm) < 0) return { ok: false, error: 'taken' };

    const start = at_(ds, startMin), end = new Date(start.getTime() + svc.minutes * 60000);
    const distance = milesFromFlagstaff_(address);
    const desc = [
      'Booked on pinecountrylandscape.com',
      '',
      'Service: ' + svc.name,
      'Name: ' + name,
      'Phone: ' + (phone || 'none given'),
      'Email: ' + (email || 'none given'),
      'Address: ' + address,
      distance != null ? 'Distance: about ' + distance + ' miles from downtown Flagstaff' : '',
      '',
      'Notes: ' + (notes || 'none')
    ].filter(function (l) { return l !== null; }).join('\n');

    const ev = cal_().createEvent('PCL | ' + svc.name + ' | ' + name, start, end, { location: address, description: desc });
    ev.setTag('pcl', 'booking');
    try { ev.setColor(CalendarApp.EventColor.GREEN); } catch (x) {}
    try { ev.removeAllReminders(); ev.addPopupReminder(60); ev.addPopupReminder(24 * 60); } catch (x) {}

    CacheService.getScriptCache().remove('slots_' + d.service);
    Object.keys(SERVICES).forEach(function (k) { CacheService.getScriptCache().remove('slots_' + k); });
    cache.put(rk, String(count + 1), 3600);

    const when = Utilities.formatDate(start, TZ, "EEEE, MMMM d 'at' h:mm a");
    logRow_('Bookings', ['Booked', new Date(), svc.name, when, name, address, phone, email, notes, distance, 'Website']);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: 'New booking: ' + svc.name + ', ' + when,
      body: desc + '\n\nIt is on your Google Calendar.',
      replyTo: email || OWNER_EMAIL,
      name: BUSINESS_NAME + ' website'
    });
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: 'Your ' + BUSINESS_NAME + ' visit is booked',
        name: BUSINESS_NAME,
        replyTo: OWNER_EMAIL,
        body: 'Hi ' + name.split(' ')[0] + ',\n\n' +
          'You are booked for ' + svc.name.toLowerCase() + ' on ' + when + ' at ' + address + '.\n\n' +
          'We will reach out before the visit. If anything changes, just reply to this email or call or text ' + BUSINESS_PHONE + '.\n\n' +
          'Thank you,\n' + BUSINESS_NAME + '\nFlagstaff, Arizona'
      });
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Snow route signup ---------------- */

function snow_(d) {
  const name = clean_(d.name, 80), address = clean_(d.address, 200);
  const phone = clean_(d.phone, 30), email = clean_(d.email, 120), notes = clean_(d.notes, 1000);
  const plan = d.plan === 'per-push' ? 'On call, per push' : 'Season contract';
  const driveway = ({ standard: 'Standard', long: 'Long', rural: 'Rural or over 150 ft' })[d.driveway] || 'Standard';
  const walks = d.walks ? 'Yes' : 'No';
  if (!name || !address) return { ok: false, message: 'Please add your name and the service address.' };
  if (!phone && !email) return { ok: false, message: 'Add a phone number or an email so we can confirm.' };
  if (email && !validEmail_(email)) return { ok: false, message: 'That email address looks incomplete.' };

  const distance = milesFromFlagstaff_(address);
  logRow_('Snow', ['New', new Date(), plan, driveway, walks, name, address, phone, email, notes, distance]);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Snow route signup: ' + name + ' (' + plan + ')',
    replyTo: email || OWNER_EMAIL,
    name: BUSINESS_NAME + ' website',
    body: ['Plan: ' + plan, 'Driveway: ' + driveway, 'Walks and steps: ' + walks, 'Name: ' + name, 'Address: ' + address,
      distance != null ? 'Distance: about ' + distance + ' miles from downtown Flagstaff' : '',
      'Phone: ' + (phone || 'none given'), 'Email: ' + (email || 'none given'), 'Notes: ' + (notes || 'none'),
      '', 'Logged in the PCL Website Leads sheet.'].join('\n')
  });
  if (email) {
    MailApp.sendEmail({
      to: email, name: BUSINESS_NAME, replyTo: OWNER_EMAIL,
      subject: 'You are on the ' + BUSINESS_NAME + ' snow route list',
      body: 'Hi ' + name.split(' ')[0] + ',\n\nThanks for signing up for snow removal at ' + address + '. We will confirm your spot and price within one business day.\n\n' +
        'Questions? Reply here or call or text ' + BUSINESS_PHONE + '.\n\n' + BUSINESS_NAME + '\nFlagstaff, Arizona'
    });
  }
  return { ok: true };
}

/* ---------------- Utilities ---------------- */

function milesFromFlagstaff_(address) {
  try {
    const r = Maps.newGeocoder().setBounds(34.6, -112.6, 35.8, -110.9).geocode(address);
    if (!r || r.status !== 'OK' || !r.results.length) return null;
    const loc = r.results[0].geometry.location;
    const toRad = function (x) { return x * Math.PI / 180; };
    const dLat = toRad(loc.lat - FLAG_LAT), dLng = toRad(loc.lng - FLAG_LNG);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(FLAG_LAT)) * Math.cos(toRad(loc.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(3958.8 * 2 * Math.asin(Math.sqrt(a)));
  } catch (x) { return null; }
}

function sheet_(tab) {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID'), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (x) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('PCL Website Leads'); props.setProperty('SHEET_ID', ss.getId()); }
  let sh = ss.getSheetByName(tab);
  if (!sh) {
    sh = ss.insertSheet(tab);
    const headers = tab === 'Snow'
      ? ['Status', 'Received', 'Plan', 'Driveway', 'Walks', 'Name', 'Address', 'Phone', 'Email', 'Notes', 'Miles from Flagstaff']
      : ['Status', 'Received', 'Service', 'Appointment', 'Name', 'Address', 'Phone', 'Email', 'Notes', 'Miles from Flagstaff', 'Lead source'];
    sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    const blank = ss.getSheetByName('Sheet1'); if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);
  }
  return sh;
}
function logRow_(tab, row) { try { sheet_(tab).appendRow(row); } catch (x) { console.error(x); } }

/**
 * Run this once from the editor (select setup, click Run) to grant permissions
 * and create the PCL Website Leads sheet. It prints what it found.
 */
function setup() {
  const cal = cal_();
  console.log('Calendar: ' + cal.getName());
  const res = getSlots_('estimate');
  const days = Object.keys(res.days || {});
  console.log('Bookable days in the next ' + HORIZON_DAYS + ': ' + days.filter(function (k) { return res.days[k].length; }).length);
  sheet_('Bookings'); sheet_('Snow');
  console.log('Leads sheet: ' + SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getUrl());
  console.log('Distance test: ' + milesFromFlagstaff_('Doney Park, AZ') + ' miles');
}
