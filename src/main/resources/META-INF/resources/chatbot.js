/* Savoria customer-service chatbot — plain Vanilla JS, no backend.
 * Rule-based + guided table booking. Talks to window.Savoria (exposed by src/app.js)
 * for live menu + real reservations (POST /api/reservations with offline fallback).
 */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function todayISO(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    return d.toISOString().slice(0, 10);
  }
  function prettyDate(iso) {
    var dt = new Date(iso + "T00:00:00");
    if (isNaN(dt.getTime())) return iso;
    return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function scrollChat() {
    var log = $("chatLog");
    if (log) log.scrollTop = log.scrollHeight;
  }
  function money(n) {
    var v = Number(n);
    return isFinite(v) ? "$" + v.toFixed(2) : String(n);
  }

  var booking = null; // { step, name, date, time, guests }

  function addMsg(text, who, html) {
    var log = $("chatLog");
    if (!log) return null;
    var row = document.createElement("div");
    row.className = "chat-row " + (who === "user" ? "from-user" : "from-bot");
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    if (html) bubble.innerHTML = text;
    else bubble.textContent = text;
    row.appendChild(bubble);
    log.appendChild(row);
    scrollChat();
    return row;
  }

  function showTyping() {
    var log = $("chatLog");
    if (!log) return null;
    var row = document.createElement("div");
    row.className = "chat-row from-bot";
    row.id = "chatTyping";
    row.innerHTML = '<div class="chat-bubble typing"><span></span><span></span><span></span></div>';
    log.appendChild(row);
    scrollChat();
    return row;
  }
  function hideTyping() {
    var t = $("chatTyping");
    if (t) t.remove();
  }
  function botSay(text, opts) {
    opts = opts || {};
    var delay = opts.instant ? 0 : 350 + Math.min(900, String(text).length * 6);
    showTyping();
    setTimeout(function () {
      hideTyping();
      addMsg(text, "bot", opts.html);
      if (opts.chips) showChips(opts.chips);
      bumpUnread();
    }, delay);
  }
  function showChips(chips) {
    var ctn = $("chatChips");
    if (!ctn) return;
    ctn.innerHTML = "";
    chips.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chat-chip";
      b.textContent = c;
      b.addEventListener("click", function () { sendUser(c); });
      ctn.appendChild(b);
    });
  }

  function openChat() {
    var panel = $("chatPanel"), fab = $("chatFab");
    if (panel) panel.hidden = false;
    if (fab) fab.classList.add("open");
    clearUnread();
    setTimeout(function () { var i = $("chatInput"); if (i) i.focus(); }, 60);
  }
  function closeChat() {
    var panel = $("chatPanel"), fab = $("chatFab");
    if (panel) panel.hidden = true;
    if (fab) fab.classList.remove("open");
  }
  function toggleChat() {
    var panel = $("chatPanel");
    if (!panel) return;
    if (panel.hidden) openChat();
    else closeChat();
  }
  var unread = 0;
  function bumpUnread() {
    var panel = $("chatPanel"), dot = $("chatDot");
    if (panel && !panel.hidden) return;
    unread++;
    if (dot) { dot.hidden = false; dot.textContent = unread > 9 ? "9+" : String(unread); }
  }
  function clearUnread() {
    unread = 0;
    var dot = $("chatDot");
    if (dot) dot.hidden = true;
  }

  // ---------- intent engine ----------
  function getMenu() {
    try { if (window.Savoria) return window.Savoria.getMenu() || []; } catch (e) {}
    return [];
  }
  function findDishes(keywords) {
    var menu = getMenu();
    var q = String(keywords).toLowerCase();
    return menu.filter(function (m) {
      return (String(m.name) + " " + String(m.description || "") + " " + String(m.category || "") + " " + String(m.tag || "")).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 3);
  }
  function menuSummary() {
    var menu = getMenu();
    if (!menu.length) return "Our menu is 100% halal: Chicken Biryani, Mandi Rice, Chicken Karahi, Shami Kababs, Halal Pizza, Naan, Frozen Parathas and Samosas, Puff Pastries, Kheer and Doodh Pati Chaii. Scroll to the Menu section to browse everything.";
    var picks = menu.slice(0, 4).map(function (m) { return m.name + " (" + money(m.price) + ")"; });
    return "A few customer favourites: " + picks.join(" · ") + ". Scroll to the Menu section to see all " + menu.length + " dishes with search and categories. Everything is 100% halal.";
  }

  function answer(raw) {
    var t = String(raw || "").trim();
    var s = t.toLowerCase();
    if (!s) return;

    // booking flow in progress takes priority (except cancel)
    if (booking && !/^(cancel|stop|never mind|nevermind|quit)$/i.test(t)) {
      return bookingStep(t);
    }
    if (/^(cancel|stop|never mind|nevermind|quit)$/i.test(t) && booking) {
      booking = null;
      botSay("No problem — I cancelled that booking. Let me know if you need anything else.", {
        chips: ["View menu", "Book a table", "Opening hours"]
      });
      return;
    }

    if (/^(hi|hey|hello|yo|good morning|good afternoon|good evening)\b/.test(s) || s.length < 3) {
      botSay("Hello! Welcome to Savoria. I can help with the menu, hours, location, or booking a table. What do you need?", {
        chips: ["View menu", "Book a table", "Opening hours", "Where are you?"]
      });
      return;
    }
    if (/(human|staff|manager|phone|call|contact|email|owner|complaint|speak to)/.test(s)) {
      botSay("You can reach the owner on +44 7465 239428 (call or WhatsApp), or find us at HRRX+RR Wolverhampton, United Kingdom. For anything urgent, calling is fastest — otherwise tell me here and I will help right away.", {
        chips: ["Book a table", "Opening hours"]
      });
      return;
    }
    if (/(hour|open|close|when.*(open|close)|sunday|monday|kitchen)/.test(s)) {
      botSay("We cook fresh daily. For today's hours and delivery slots, call or WhatsApp +44 7465 239428. Weekends get busy, so I recommend booking ahead.", {
        chips: ["Book a table", "View menu"]
      });
      return;
    }
    if (/(where|address|location|parking|find you|direction|wolverhampton|plus code|HRRX)/.test(s)) {
      botSay("Find us at HRRX+RR Wolverhampton, United Kingdom. Delivery is available across Wolverhampton — call or WhatsApp +44 7465 239428. Need a table when you visit? I can book one now.", {
        chips: ["Book a table", "Opening hours"]
      });
      return;
    }
    if (/(deliver|takeaway|take away|take-away|takeout|doordash|whatsapp)/.test(s)) {
      botSay("Yes — delivery is available in Wolverhampton. Call or WhatsApp +44 7465 239428 and food is usually ready in 15–20 minutes. We also take orders for all occasions: parties, gatherings and events.");
      return;
    }
    if (/(halal|100%|muslim)/.test(s)) {
      botSay("Everything we serve is 100% halal — homemade, authentic desi taste, made with love. Our specialties are Shami Kababs, Chicken Biryani, Chicken Karahi, Frozen Parathas and Whole Chicken Mandi Rice.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(biryani|mandi|rice|pilau)/.test(s)) {
      botSay("Our rice dishes: Chicken Biryani (£12.50) — aromatic rice with perfectly spiced chicken — and Whole Chicken Mandi Rice (£14.00), traditional taste. The biryani is our most loved dish.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(karahi|curry)/.test(s)) {
      botSay("Chicken Karahi (£12.50) — rich, spicy and full of taste, served with fresh lemon. A true specialty alongside our biryani.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(kabab|kebab|pakora|platter|wings|bbq)/.test(s)) {
      botSay("From the grill: Shami Kababs (£8.00) — soft, juicy, full of flavour — Chicken Pakoras with homemade green chutney (£7.00), and the Chicken, Chips and Rice Platter (£10.00).", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(pizza)/.test(s)) {
      botSay("Our Homemade Halal Pizza (£11.00) is made fresh with your choice of toppings — 100% halal, as always.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(naan|paratha|bread|roti)/.test(s)) {
      botSay("Breads: Alu Cheese Naan (£4.50) — soft, golden, stuffed with potato and cheese — plus Frozen Parathas (£6.00 a pack), homemade, soft and flaky, ready to cook.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(frozen|samosa|spring roll|puff|pastry)/.test(s)) {
      botSay("To cook at home: Frozen Parathas (£6.00), Frozen Samosas and Spring Rolls (£5.50), and Puff Pastries (£5.00) in different types, fresh or frozen. Just call or WhatsApp +44 7465 239428 to order.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(chai|chaii|tea|kheer|doodh|pati)/.test(s)) {
      botSay("Finish with creamy homemade Kheer (£4.00) topped with almonds and pistachio, or a flask of Dhood Pati Chaii (£16.00 on offer) — the best chaii in Wolverhampton.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(price|cost|how much|cheap|expensive|offer)/.test(s)) {
      botSay("Most mains are £10–£14: Chicken Biryani £12.50, Chicken Karahi £12.50, the chicken platter £10.00. Naan £4.50, Kheer £4.00, and a Dhood Pati Chaii flask is £16.00 on offer. Want a recommendation?", {
        chips: ["Vegetarian options", "View menu", "Book a table"]
      });
      return;
    }
    if (/(vegetarian|vegan|veggie|veg |gluten|allergy)/.test(s)) {
      var v = findDishes("naan");
      void v;
      botSay("Meat-free picks: Alu Cheese Naan (£4.50), Frozen Parathas (£6.00), Puff Pastries (£5.00), creamy Kheer (£4.00) and Dhood Pati Chaii (£16.00 a flask). Everything is 100% halal — mention any allergy when you order and we will take care.", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(dessert|sweet|kheer|cake|pudding)/.test(s)) {
      botSay("Save room! Creamy homemade Kheer (£4.00) with almonds and pistachio, plus Dhood Pati Chaii by the flask (£16.00 on offer).", {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(recommend|best|popular|favorite|favourite|special|chef)/.test(s)) {
      botSay("Customer favourites: Chicken Biryani (£12.50), Chicken Karahi (£12.50), Shami Kababs (£8.00) and the Chicken, Chips and Rice Platter (£10.00). " + menuSummary(), {
        chips: ["View menu", "Book a table"]
      });
      return;
    }
    if (/(menu|food|dish|eat|biryani|karahi|pizza|kabab|naan)/.test(s)) {
      botSay(menuSummary(), { chips: ["Vegetarian options", "Book a table", "Opening hours"] });
      var hits = findDishes(s.replace(/[^a-z ]/g, ""));
      void hits;
      return;
    }
    if (/(book|reserve|table|seat|party of|anniversary|birthday)/.test(s) || /my booking|my reservation/.test(s)) {
      startBooking(t);
      return;
    }
    if (/(cancel|delete).*(book|reserv|table)|my reservations|my bookings|show.*(book|reserv)/.test(s)) {
      var list = [];
      try { list = window.Savoria ? window.Savoria.getReservations() : []; } catch (e) {}
      if (!list.length) {
        botSay("You have no saved reservations in this browser yet. Want me to book one now?", { chips: ["Book a table", "View menu"] });
      } else {
        var lines = list.slice(-3).map(function (r) { return "• " + r.name + ", " + r.date + " at " + r.time + " (" + r.guests + " guests)"; });
        botSay("Your recent bookings: " + lines.join("  ") + ". To cancel one, scroll to All Reservations and press Delete next to it.", {
          chips: ["Book a table"]
        });
      }
      return;
    }
    if (/(sign|login|log in|account|register)/.test(s)) {
      botSay("You can create an account in the Account section above — it takes 10 seconds and pre-fills your name on reservations. Want me to take you there?", {
        chips: ["Book a table", "View menu"]
      });
      return;
    }
    if (/(thank|thanks|great|awesome|perfect)/.test(s)) {
      botSay("Anytime! Enjoy Savoria — anything else I can do for you?", { chips: ["Book a table", "View menu"] });
      return;
    }
    if (/(bye|goodbye|see you|good night)/.test(s)) {
      botSay("Goodbye! Hope to see you at Savoria soon. Your table will be waiting.");
      return;
    }
    // fallback
    botSay("I can help with the menu, prices, hours, location, accounts, and booking or cancelling a table. What would you like to do?", {
      chips: ["View menu", "Book a table", "Opening hours", "Where are you?"]
    });
  }

  // ---------- guided booking ----------
  function startBooking(firstMsg) {
    var user = null;
    try { user = window.Savoria ? window.Savoria.getUser() : null; } catch (e) {}
    booking = { step: user && user.name ? "date" : "name", name: user && user.name ? user.name : "", date: "", time: "19:00", guests: 2 };
    // try to parse a one-shot request like "book table for 4 tomorrow at 7pm"
    var parsed = parseOneShot(firstMsg || "");
    if (parsed.guests) booking.guests = parsed.guests;
    if (parsed.date) booking.date = parsed.date;
    if (parsed.time) booking.time = parsed.time;
    if (booking.step === "name") {
      botSay("Great — let's book you a table. First, what name should the reservation be under?" + (parsed.guests ? " (I caught " + parsed.guests + " guests — nice.)" : ""));
    } else {
      botSay("Great " + booking.name.split(" ")[0] + " — let's book your table. Which date? Use YYYY-MM-DD, or say today or tomorrow.", {
        chips: ["Today " + todayISO(0), "Tomorrow " + todayISO(1), todayISO(2)]
      });
      booking.step = "date";
    }
  }
  function parseOneShot(s) {
    var out = {};
    var g = s.match(/(\d{1,2})\s*(guest|people|person|pax)/i) || s.match(/for\s+(\d{1,2})\b/i) || s.match(/party of\s+(\d{1,2})/i);
    if (g) { var n = parseInt(g[1], 10); if (n >= 1 && n <= 30) out.guests = n; }
    if (/tomorrow/i.test(s)) out.date = todayISO(1);
    else if (/today/i.test(s)) out.date = todayISO(0);
    else {
      var d = s.match(/(\d{4}-\d{2}-\d{2})/);
      if (d) out.date = d[1];
    }
    var tm = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tm && /book|table|at |reserve/i.test(s)) {
      var h = parseInt(tm[1], 10);
      var ap = (tm[3] || "").toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      if (h >= 11 && h <= 23) out.time = ("0" + h).slice(-2) + ":" + (tm[2] || "00");
    }
    return out;
  }
  function validDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    var dt = new Date(iso + "T00:00:00");
    if (isNaN(dt.getTime())) return false;
    return iso >= todayISO(0);
  }
  function bookingStep(t) {
    if (booking.step === "name") {
      if (t.length < 2) { botSay("Please tell me the name for the reservation (2+ characters)."); return; }
      booking.name = t;
      booking.step = "date";
      botSay("Thanks " + t.split(" ")[0] + "! Which date? Reply YYYY-MM-DD, today, or tomorrow.", {
        chips: ["Today " + todayISO(0), "Tomorrow " + todayISO(1), todayISO(2)]
      });
      return;
    }
    if (booking.step === "date") {
      var d = t.trim();
      var low = d.toLowerCase().replace(/^today\s*/, todayISO(0)).replace(/^tomorrow\s*/, todayISO(1));
      var m = low.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) d = m[1];
      if (!validDate(d)) { botSay("That date doesn't look valid (use YYYY-MM-DD, not in the past). Try again — e.g. " + todayISO(1) + "."); return; }
      booking.date = d;
      booking.step = "time";
      botSay("Got it — " + prettyDate(d) + ". What time? We're open 11:00–22:30 (kitchen closes 22:30).", {
        chips: ["12:30", "18:00", "19:00", "20:30"]
      });
      return;
    }
    if (booking.step === "time") {
      var tm = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!tm) { botSay("Please give a time like 19:00 or 7pm."); return; }
      var h = parseInt(tm[1], 10);
      var ap = (tm[3] || "").toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      var mm = tm[2] || "00";
      var hh = ("0" + h).slice(-2);
      if (h < 11 || h > 22 || (h === 22 && parseInt(mm, 10) > 30)) { botSay("We're open 11:00–22:30. Pick a time inside that window."); return; }
      booking.time = hh + ":" + mm;
      booking.step = "guests";
      botSay("Perfect — " + booking.time + ". How many guests? (1–30)", { chips: ["1", "2", "4", "6"] });
      return;
    }
    if (booking.step === "guests") {
      var g = parseInt(t, 10);
      if (!g || g < 1 || g > 30) { botSay("Guests must be a number between 1 and 30. How many?"); return; }
      booking.guests = g;
      booking.step = "confirm";
      botSay("Please confirm: table for " + booking.name + ", " + booking.guests + " guest(s), " + prettyDate(booking.date) + " at " + booking.time + ". Reply yes to book or no to start over.", {
        html: false, chips: ["Yes, book it", "No, start over"]
      });
      return;
    }
    if (booking.step === "confirm") {
      if (/^(yes|yep|yeah|confirm|book it|yes, book it)/i.test(t)) {
        var payload = { name: booking.name, date: booking.date, time: booking.time, guests: booking.guests };
        var done = { name: payload.name, date: payload.date, time: payload.time, guests: payload.guests };
        booking = null;
        botSay("Booking it now… one moment.");
        try {
          var p = window.Savoria ? window.Savoria.createReservation(payload) : Promise.resolve(true);
          Promise.resolve(p).then(function () {
            botSay("Done! Table for " + done.name + " on " + prettyDate(done.date) + " at " + done.time + " (" + done.guests + " guests) is booked. See it under All Reservations below. Anything else?", {
              chips: ["View menu", "Opening hours", "Book another table"]
            });
          });
        } catch (e) {
          botSay("Something hiccuped — please use the Book a Table form below and it will go through.");
        }
      } else if (/^(no|nope|restart|start over|no, start over)/i.test(t)) {
        booking = null;
        botSay("No worries — let's start fresh. Say book a table whenever you're ready.", { chips: ["Book a table", "View menu"] });
      } else {
        botSay("Just reply yes to confirm the booking, or no to start over.");
      }
      return;
    }
  }

  // ---------- input ----------
  function sendUser(text) {
    var v = String(text == null ? "" : text).trim();
    if (!v) return;
    var ctn = $("chatChips");
    if (ctn) ctn.innerHTML = "";
    addMsg(v, "user");
    // quick navigation shortcuts
    var low = v.toLowerCase();
    if (/^(view menu|menu)$/i.test(v)) {
      answer("menu please");
      var el = document.getElementById("menu");
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth" }); }, 900);
      return;
    }
    if (/^opening hours$/i.test(v)) { answer("what are your hours"); return; }
    if (/^where are you/.test(low)) { answer("where are you located"); return; }
    if (/^vegetarian options$/i.test(v)) { answer("vegetarian options"); return; }
    if (/^book (a table|another table)$/i.test(v)) { answer("book a table"); return; }
    if (/^yes, book it$/i.test(v)) { answer("yes"); return; }
    if (/^no, start over$/i.test(v)) { answer("no"); return; }
    if (/^today /.test(low) || /^tomorrow /.test(low)) {
      var d = v.match(/(\d{4}-\d{2}-\d{2})/);
      answer(d ? d[1] : v);
      return;
    }
    answer(v);
  }

  function init() {
    var fab = $("chatFab"), panel = $("chatPanel"), form = $("chatForm"),
        input = $("chatInput"), closeBtn = $("chatClose");
    if (!fab || !panel) return;
    fab.addEventListener("click", toggleChat);
    if (closeBtn) closeBtn.addEventListener("click", closeChat);
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input ? input.value : "";
      if (input) input.value = "";
      sendUser(v);
    });
    // greet once after a beat
    setTimeout(function () {
      if (!$("chatLog") || $("chatLog").children.length) return;
      botSay("Hi there! I'm Saba, Homemade Halal Food Wolverhampton's helper. Ask me about the menu, delivery, or say book a table and I'll walk you through it.", {
        chips: ["View menu", "Book a table", "Opening hours"]
      });
    }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
