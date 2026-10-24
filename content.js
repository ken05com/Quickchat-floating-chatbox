/*
 * Lakbayon — floating travel companion (Chrome extension, Manifest V3)
 * ------------------------------------------------------------------
 * Injects a floating launcher + panel into every page. The panel is split
 * into five tabbed sections: Chat, Media, Groups, Shares and Tools.
 *
 * Everything is rendered from plain DOM built here. All visual styling
 * lives in styles.css so the host page's own CSS cannot leak in and the
 * widget keeps its own design language.
 */
(function () {
  "use strict";

  var ROOT_ID = "fc-root";

  // Bail out if already injected (script re-run) or if there is no body yet.
  if (document.getElementById(ROOT_ID) || !document.body) return;

  /* ==================================================================
   * Icons — minimal 24px line set drawn with currentColor
   * ================================================================== */
  function svg(inner) {
    return (
      '<svg class="fc-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' +
      inner +
      "</svg>"
    );
  }

  var I = {
    chat: svg(
      '<path d="M20.5 11.7a8.2 8.2 0 0 1-8.5 8.2 9 9 0 0 1-3.6-.8l-4.9 1.4 1.5-4.8a8.2 8.2 0 0 1-.8-3.6 8.2 8.2 0 0 1 8.2-8.5 8.2 8.2 0 0 1 8.1 8.1Z"/>'
    ),
    media: svg(
      '<rect x="3" y="4.5" width="18" height="15" rx="3"/>' +
        '<circle cx="8.6" cy="9.8" r="1.5"/>' +
        '<path d="m3.8 17.4 4.9-4.3 3.6 2.9 3.2-2.3 4.7 3.4"/>'
    ),
    groups: svg(
      '<path d="M15.5 20v-1.4a3.8 3.8 0 0 0-3.8-3.8H6.8A3.8 3.8 0 0 0 3 18.6V20"/>' +
        '<circle cx="9.2" cy="7.6" r="3.4"/>' +
        '<path d="M16.6 11.6a3.4 3.4 0 0 0 0-6.8"/>' +
        '<path d="M21 20v-1.4a3.8 3.8 0 0 0-2.8-3.7"/>'
    ),
    shares: svg(
      '<circle cx="18" cy="5.5" r="2.7"/>' +
        '<circle cx="6" cy="12" r="2.7"/>' +
        '<circle cx="18" cy="18.5" r="2.7"/>' +
        '<path d="m8.4 10.8 7.2-3.7M8.4 13.2l7.2 3.7"/>'
    ),
    tools: svg(
      '<path d="M4 7h16M4 12h16M4 17h16"/>' +
        '<circle cx="9.5" cy="7" r="2"/>' +
        '<circle cx="15" cy="12" r="2"/>' +
        '<circle cx="8" cy="17" r="2"/>'
    ),
    close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    send: svg('<path d="M12 19V6M6 12l6-6 6 6"/>'),
    pin: svg(
      '<path d="M12 21.2s7-5.7 7-11.2a7 7 0 1 0-14 0c0 5.5 7 11.2 7 11.2Z"/>' +
        '<circle cx="12" cy="9.8" r="2.4"/>'
    ),
    doc: svg(
      '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/>' +
        '<path d="M14 3v5h5"/>'
    ),
    link: svg(
      '<path d="M10.2 13.6a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7l-1.2 1.2"/>' +
        '<path d="M13.8 10.4a4 4 0 0 0-5.7 0l-2.5 2.5a4 4 0 1 0 5.7 5.7l1.2-1.2"/>'
    ),
    chevron: svg('<path d="m9.5 6.5 5.5 5.5-5.5 5.5"/>'),
    compact: svg(
      '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/>' +
        '<path d="M8 9.5h8M8 14.5h8"/>'
    ),
    contrast: svg(
      '<circle cx="12" cy="12" r="8.5"/>' +
        '<path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none"/>'
    ),
    keyboard: svg(
      '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/>' +
        '<path d="M7 10h.01M11 10h.01M15 10h.01M8.5 14h7"/>'
    ),
    bell: svg('<path d="M18 15.6V11a6 6 0 0 0-12 0v4.6L4.4 18h15.2Z"/><path d="M10 21h4"/>'),
    trash: svg(
      '<path d="M4 7h16M10 4h4M6.5 7l1 13h9l1-13"/><path d="M10.5 11v5.5M13.5 11v5.5"/>'
    ),
    undo: svg('<path d="M4.5 10.5H13a5 5 0 0 1 0 10h-3"/><path d="m8 7-3.5 3.5L8 14"/>'),
    /* Geometric provider marks — abstractions, not trademarked logos. */
    yt: svg('<rect x="2.5" y="5" width="19" height="14" rx="4.5"/><path d="M10.2 9.3v5.4l4.6-2.7Z" fill="currentColor" stroke="none"/>'),
    vimeo: svg('<circle cx="12" cy="12" r="9"/><path d="M10.4 9.1v5.8l4.4-2.9Z" fill="currentColor" stroke="none"/>'),
    ig: svg('<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>'),
    shot: svg('<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.4" cy="9.6" r="1.6"/><path d="m4 17.6 4.8-4.4 3.5 2.8 3.1-2.2 4.6 3.3"/>'),
    search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>'),
    run: svg('<path d="M13.5 3.5a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z"/><path d="m9 21 2.2-5.4-2-2.1-1.3 3.6M13.6 9.6 10 11.4l-2.6 3.1M13.6 9.6l3.1 1.5 1.4 2.6M12.2 15.6l.6 3.1 2.4 2.3"/>'),
    page: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>'),
    down: svg('<path d="M12 4v11M7 11l5 5 5-5M4.5 20h15"/>'),
    up: svg('<path d="M12 20V9M7 13l5-5 5 5M4.5 4h15"/>'),
    timer: svg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.2 1.4M9.8 2.5h4.4"/>'),
    play2: svg('<path d="M7 4.8v14.4l12-7.2Z" fill="currentColor" stroke="none"/>'),
    play: svg('<path d="M7 4.8v14.4l12-7.2Z" fill="currentColor" stroke="none"/>'),
    film: svg(
      '<rect x="2.5" y="4.5" width="19" height="15" rx="3"/>' +
        "<path d=\"M7.5 4.5v15M16.5 4.5v15M2.5 12h19M2.5 8.2h5M2.5 15.8h5M16.5 8.2h5M16.5 15.8h5\"/>"
    )
  };

  /* ==================================================================
   * Content
   * ================================================================== */
  var TABS = [
    { id: "chat", label: "Chat", icon: I.chat },
    { id: "media", label: "Media", icon: I.media },
    { id: "groups", label: "Groups", icon: I.groups },
    { id: "shares", label: "Shares", icon: I.shares },
    { id: "tools", label: "Tools", icon: I.tools },
    { id: "run", label: "Run", icon: I.run }
  ];

  var CHIPS = ["Island hopping", "Best time to visit", "Budget-friendly", "Family trip"];

  // Editorial-style header for every non-chat section.
  var VIEW_HEADS = {
    media: { eyebrow: "Library", title: "Shared media", lede: "Photos and clips your circle sent over." },
    groups: { eyebrow: "Circles", title: "Your groups", lede: "Trips and meetups you are part of." },
    shares: { eyebrow: "Library", title: "Recent shares", lede: "Drag a link, image or video here to save it." },
    tools: { eyebrow: "Preferences", title: "Tools", lede: "Tune how the companion behaves." },
    run: { eyebrow: "Arcade", title: "Lakbayon Run", lede: "Jump the shards. Duck the gliders." }
  };

  /* ==================================================================
 * Generative destination artwork
 *
 * Each Media tile is drawn as a small layered landscape — graded sky, a low
 * sun, two ridge silhouettes and, for water scenes, a reflective band. Pure
 * SVG so it stays crisp at any size, costs nothing to download, and never
 * touches the network. Ridges come from a seeded PRNG so a given place always
 * looks the same.
 * ================================================================== */
  var ART = {
    lagoon: { sky: ["#c6e8ee", "#5ea4b5"], sun: "#fff4d8", back: "#4e8b9c", front: "#2a5b6a", water: "#7fc4d2" },
    hills: { sky: ["#eaf1da", "#a6c489"], sun: "#fdf7dc", back: "#7d9a63", front: "#495f39", water: null },
    terrace: { sky: ["#ecf4d8", "#a8c97f"], sun: "#fffbea", back: "#87ab5f", front: "#4d6a34", water: "#9cc27a" },
    sand: { sky: ["#fdf1da", "#e7c48d"], sun: "#fffdf4", back: "#d9ab74", front: "#a67a4b", water: "#f0dcb8" },
    dusk: { sky: ["#e5dbf0", "#8d81ab"], sun: "#ffe9cb", back: "#6e6490", front: "#453e62", water: "#9a90bb" },
    reef: { sky: ["#fbe4de", "#d89a91"], sun: "#fff3e8", back: "#b8776f", front: "#7c4642", water: "#e0a79d" }
  };

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededRandom(seed) {
    var h = hashString(seed);
    return function () {
      h ^= h << 13; h >>>= 0;
      h ^= h >> 17;
      h ^= h << 5; h >>>= 0;
      return h / 4294967296;
    };
  }

  function ridgePath(rnd, w, h, baseY, amp) {
    var steps = 5;
    var d = "M0," + h;
    for (var i = 0; i <= steps; i++) {
      var x = (w / steps) * i;
      var y = baseY + (rnd() - 0.5) * amp;
      d += " L" + x.toFixed(1) + "," + y.toFixed(1);
    }
    return d + " L" + w + "," + h + " Z";
  }

  function artTile(key, seed) {
    var p = ART[key] || ART.lagoon;
    var rnd = seededRandom(String(seed || key));
    var uid = "g" + hashString(String(seed || key)).toString(36);
    var sunX = Math.round(28 + rnd() * 104);
    var horizon = p.water ? 96 : 108;

    return (
      '<svg class="fc-art" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" ' +
      'aria-hidden="true" focusable="false">' +
      "<defs>" +
      '<linearGradient id="sky' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + p.sky[0] + '"/>' +
      '<stop offset="1" stop-color="' + p.sky[1] + '"/>' +
      "</linearGradient>" +
      '<linearGradient id="sun' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + p.sun + '" stop-opacity="0.95"/>' +
      '<stop offset="1" stop-color="' + p.sun + '" stop-opacity="0.35"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<rect width="160" height="120" fill="url(#sky' + uid + ')"/>' +
      '<circle cx="' + sunX + '" cy="52" r="18" fill="url(#sun' + uid + ')"/>' +
      '<circle cx="' + sunX + '" cy="52" r="9" fill="' + p.sun + '" opacity="0.9"/>' +
      '<path d="' + ridgePath(rnd, 160, 120, 62, 18) + '" fill="' + p.back + '" opacity="0.9"/>' +
      '<path d="' + ridgePath(rnd, 160, 120, horizon - 16, 22) + '" fill="' + p.front + '"/>' +
      (p.water
        ? '<rect y="' + horizon + '" width="160" height="' + (120 - horizon) + '" fill="' + p.water + '"/>' +
          '<rect y="' + horizon + '" width="160" height="1.4" fill="' + p.front + '" opacity="0.35"/>' +
          '<ellipse cx="' + sunX + '" cy="' + (horizon + 9) + '" rx="26" ry="3.4" fill="' + p.sun + '" opacity="0.5"/>' +
          '<ellipse cx="' + (sunX - 34) + '" cy="' + (horizon + 17) + '" rx="15" ry="2" fill="#ffffff" opacity="0.35"/>'
        : "") +
      "</svg>"
    );
  }

  var MEDIA = [
    { cls: "lagoon", title: "Big Lagoon", meta: "El Nido, Palawan", count: "128" },
    { cls: "hills", title: "Chocolate Hills", meta: "Bohol", count: "64" },
    { cls: "terrace", title: "Rice Terraces", meta: "Banaue, Ifugao", count: "96" },
    { cls: "sand", title: "White Island", meta: "Boracay, Aklan", count: "212" },
    { cls: "dusk", title: "City Skylines", meta: "Makati City", count: "47" },
    { cls: "reef", title: "Reef Break", meta: "Coron, Palawan", count: "83" }
  ];

  var GROUPS = [
    { in: "IH", cls: "a", name: "Island Hoppers PH", members: "128 members", msg: "Anyone joining the Palawan trip?" },
    { in: "FC", cls: "b", name: "Manila Food Crawl", members: "64 members", msg: "New stalls in Binondo this Saturday" },
    { in: "BW", cls: "c", name: "Baguio Weekenders", members: "41 members", msg: "Room for two more, dates flexible" },
    { in: "PC", cls: "d", name: "Photo Club PH", members: "212 members", msg: "Golden hour at Sirao this Sunday" }
  ];

  var SHARES = [
    { ico: "doc", kind: "Document", title: "Palawan 5-Day Itinerary", meta: "Shared by Aria · 2 min ago" },
    { ico: "link", kind: "Link", title: "Boracay Ferry Schedule", meta: "Shared by Miguel · 18 min ago" },
    { ico: "doc", kind: "PDF", title: "Chocolate Hills Guide", meta: "Shared by Ken · 1 hour ago" }
  ];

  var TOOLS = [
    { id: "compact", ico: "compact", label: "Compact mode", desc: "Denser rows, tighter spacing", type: "toggle", on: false },
    { id: "contrast", ico: "contrast", label: "High contrast", desc: "Stronger text and borders", type: "toggle", on: false },
    { id: "enter", ico: "keyboard", label: "Enter to send", desc: "Send without the arrow button", type: "toggle", on: true },
    { id: "notify", ico: "bell", label: "Notifications", desc: "Badge for new group replies", type: "toggle", on: false },
    { id: "clear", ico: "trash", label: "Clear chat", desc: "Remove every message", type: "action" },
    { id: "reset", ico: "undo", label: "Reset settings", desc: "Restore the default look", type: "action" }
  ];

  var REPLIES = [
    {
      match: /island|hopp|palawan|el nido|coron|boracay/,
      text: "Palawan works best November to May. I can lay out a 5-day El Nido and Coron route with island-hopping slots."
    },
    {
      match: /baguio|weather|temperature|cold|summer/,
      text: "Baguio sits around 15–22°C all year. August is peak strawberry season and the mestizo markets are busy."
    },
    {
      match: /budget|cheap|affordable|cost/,
      text: "For a lean trip: sleeper buses, budget stays in Coron, and island-hopping packages booked locally. Roughly 2,400 pesos a day."
    },
    {
      match: /family|kids|children/,
      text: "Family-friendly picks: Boracay's White Island, Baguio's Mines View Park, and the Caliraya spring lakes in Laguna."
    },
    {
      match: /best time|when|month|season/,
      text: "Dry season runs December to May. Siargao surfs September to March, while Bohol stays pleasant almost year-round."
    }
  ];

  var FALLBACK =
    "I can help with destinations, tour packages, or building an itinerary. Which island or city are you eyeing?";

  var TIMER_PRESETS = [1, 5, 10, 25, 60];

  var timerHtml =
    '<section class="fc-timer" id="fc-timer" aria-label="Countdown timer">' +
    '<div class="fc-timer-head">' +
    '<span class="fc-timer-ic">' + I.timer + "</span>" +
    "<span>" +
    '<p class="fc-timer-title">Countdown</p>' +
    '<p class="fc-timer-sub" id="fc-timer-sub">Pick a duration to begin</p>' +
    "</span>" +
    "</div>" +
    '<p class="fc-timer-clock" id="fc-timer-clock" role="timer" aria-live="off">25:00</p>' +
    '<div class="fc-timer-bar"><span class="fc-timer-fill" id="fc-timer-fill"></span></div>' +
    '<div class="fc-timer-presets" id="fc-timer-presets">' +
    TIMER_PRESETS.map(function (m) {
      return '<button type="button" class="fc-tchip" data-min="' + m + '">' + m + "m</button>";
    }).join("") +
    "</div>" +
    '<div class="fc-timer-actions">' +
    '<button type="button" class="fc-btn fc-btn--primary" id="fc-timer-toggle">Start</button>' +
    '<button type="button" class="fc-btn" id="fc-timer-reset">Reset</button>' +
    "</div>" +
    "</section>";

  var THEMES = [
    { id: "auto", label: "Auto" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" }
  ];

  var themeHtml =
    '<section class="fc-theme" aria-label="Appearance">' +
    '<p class="fc-theme-label">Appearance</p>' +
    '<div class="fc-seg" id="fc-theme-seg" role="group">' +
    THEMES.map(function (t) {
      return (
        '<button type="button" class="fc-seg-btn" data-theme="' + t.id + '" ' +
        'aria-pressed="false">' + t.label + "</button>"
      );
    }).join("") +
    "</div>" +
    "</section>";

  /* Social media shortcuts (Tools tab). Hard-coded https links only. */
  var SOCIALS = [
    { id: "facebook",  label: "Facebook",  mark: "FB", url: "https://www.facebook.com/" },
    { id: "instagram", label: "Instagram", mark: "IG", url: "https://www.instagram.com/" },
    { id: "youtube",   label: "YouTube",   mark: "YT", url: "https://www.youtube.com/" },
    { id: "tiktok",    label: "TikTok",    mark: "TT", url: "https://www.tiktok.com/" },
    { id: "x",         label: "X",         mark: "X",  url: "https://x.com/" },
    { id: "messenger", label: "Messenger", mark: "MS", url: "https://www.messenger.com/" }
  ];

  var socialHtml =
    '<section class="fc-social" aria-label="Social shortcuts">' +
    '<p class="fc-theme-label">Social shortcuts</p>' +
    '<div class="fc-social-grid" id="fc-social-grid">' +
    SOCIALS.map(function (s) {
      return (
        '<button type="button" class="fc-social-btn" data-url="' + s.url + '" ' +
        'aria-label="Open ' + s.label + ' in a new tab">' +
        '<span class="fc-social-mark">' + s.mark + "</span>" +
        '<span class="fc-social-label">' + s.label + "</span>" +
        "</button>"
      );
    }).join("") +
    "</div>" +
    "</section>";

  var sharesToolbarHtml =
    '<div class="fc-bar">' +
    '<label class="fc-search">' +
    I.search +
    '<input class="fc-search-input" id="fc-share-search" type="search" ' +
    'placeholder="Search saved links" aria-label="Search saved links" />' +
    "</label>" +
    '<div class="fc-bar-row">' +
    '<button type="button" class="fc-mini" id="fc-share-page">' + I.page + "<span>Save this page</span></button>" +
    '<button type="button" class="fc-mini" id="fc-share-export">' + I.down + "<span>Export</span></button>" +
    '<button type="button" class="fc-mini" id="fc-share-import">' + I.up + "<span>Import</span></button>" +
    '<button type="button" class="fc-mini fc-mini--danger" id="fc-share-clear">' + I.trash + "<span>Clear</span></button>" +
    "</div>" +
    '<input type="file" id="fc-share-file" accept="application/json,.json" hidden />' +
    "</div>";

  /* Original endless runner, drawn on a canvas in the widget's palette. */
  var runHtml =
    '<div class="fc-game">' +
    '<canvas class="fc-canvas" id="fc-canvas" width="360" height="240" tabindex="0" ' +
    'role="img" aria-label="Endless runner game. Use the up arrow to jump and the down arrow to duck."></canvas>' +
    '<div class="fc-game-hud" id="fc-game-hud">' +
    '<span class="fc-hud-score" id="fc-game-score">0</span>' +
    '<span class="fc-hud-best" id="fc-game-best">Best 0</span>' +
    "</div>" +
    '<div class="fc-game-overlay" id="fc-game-overlay">' +
    '<p class="fc-game-kicker">Lakbayon Run</p>' +
    '<h2 class="fc-display fc-display--sm" id="fc-game-title">Ready?</h2>' +
    '<p class="fc-lede" id="fc-game-sub">Use the arrow keys, or tap the scene to jump.</p>' +
    '<button type="button" class="fc-btn fc-btn--primary fc-game-btn" id="fc-game-start">Start running</button>' +
    '<p class="fc-game-keys"><kbd>&uarr;</kbd> jump · <kbd>&darr;</kbd> duck · <kbd>P</kbd> pause</p>' +
    "</div>" +
    '<p class="fc-game-live" id="fc-game-live" role="status" aria-live="polite"></p>' +
    "</div>";

  var BRAND_NAME = "Quickchat";

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ==================================================================
   * Markup
   * ================================================================== */
  var tabsHtml = TABS.map(function (t, i) {
    return (
      '<button type="button" class="fc-tab' + (i === 0 ? " is-active" : "") + '" role="tab" id="fc-tab-' + t.id + '" ' +
      'data-tab="' + t.id + '" aria-controls="fc-view-' + t.id + '" ' +
      'aria-selected="' + (i === 0 ? "true" : "false") + '" tabindex="' + (i === 0 ? "0" : "-1") + '">' +
      t.icon + '<span class="fc-tab-label">' + t.label + "</span>" +
      '<span class="fc-tab-pip"></span>' +
      "</button>"
    );
  }).join("");

  var viewsHtml = TABS.map(function (t) {
    var body = "";
    if (t.id === "chat") {
      body =
        '<div class="fc-messages" id="fc-messages"></div>' +
        '<div class="fc-composer">' +
        '<div class="fc-attach" id="fc-attach" hidden>' +
        '<div class="fc-attach-thumb" id="fc-attach-thumb">' +
        '<img id="fc-attach-img" alt="" />' +
        '<span class="fc-attach-badge" id="fc-attach-badge"></span>' +
        "</div>" +
        '<div class="fc-attach-meta">' +
        '<p class="fc-attach-title" id="fc-attach-title"></p>' +
        '<p class="fc-attach-sub" id="fc-attach-sub"></p>' +
        "</div>" +
        '<button type="button" class="fc-attach-x" id="fc-attach-x" aria-label="Remove video">' + I.close + "</button>" +
        "</div>" +
        '<div class="fc-input-row">' +
        '<input class="fc-input" id="fc-input" type="text" placeholder="Paste a video link or ask…" ' +
        'autocomplete="off" aria-label="Message" />' +
        '<button type="button" class="fc-send" id="fc-send" aria-label="Send message">' + I.send + "</button>" +
        "</div>" +
        '<p class="fc-hint">Paste or drop a video link, image or media file to preview it.</p>' +
        "</div>";
    } else if (t.id === "run") {
      /* The game fills its view, so it skips the scrolling editorial header. */
      body = runHtml;
    } else {
      var h = VIEW_HEADS[t.id];
      body =
        '<div class="fc-view-scroll">' +
        '<div class="fc-view-head">' +
        '<p class="fc-eyebrow">' + esc(h.eyebrow) + "</p>" +
        '<h2 class="fc-display">' + esc(h.title) + "</h2>" +
        '<p class="fc-lede">' + esc(h.lede) + "</p>" +
        "</div>" +
        (t.id === "tools" ? timerHtml + themeHtml + socialHtml : "") +
        (t.id === "shares" ? sharesToolbarHtml : "") +
        '<div class="fc-list-wrap" id="fc-' + t.id + '-list"></div>' +
        "</div>";
    }

    return (
      '<section class="fc-view" role="tabpanel" id="fc-view-' + t.id + '" ' +
      'aria-labelledby="fc-tab-' + t.id + '" tabindex="0"' + (t.id === "chat" ? "" : " hidden") + ">" +
      body +
      "</section>"
    );
  }).join("");

  var root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("data-lakbayon", "1");
  root.innerHTML =
    '<div class="fc-fab-wrap" id="fc-fab-wrap">' +
    '<button type="button" class="fc-fab" id="fc-fab" aria-label="Open ' + BRAND_NAME + ' companion" ' +
    'aria-expanded="false" aria-controls="fc-panel">' + I.chat + "</button>" +
    '<svg class="fc-ring" id="fc-ring" viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle class="fc-ring-track" cx="32" cy="32" r="29"></circle>' +
    '<circle class="fc-ring-bar" id="fc-ring-bar" cx="32" cy="32" r="29"></circle>' +
    "</svg>" +
    '<span class="fc-fab-badge" id="fc-fab-badge" aria-hidden="true" hidden></span>' +
    "</div>" +

    '<section class="fc-panel" id="fc-panel" aria-label="' + BRAND_NAME + ' companion" aria-hidden="true">' +
    '<span class="fc-aurora" aria-hidden="true">' +
    '<span class="fc-aurora-blob fc-aurora-blob--a"></span>' +
    '<span class="fc-aurora-blob fc-aurora-blob--b"></span>' +
    '<span class="fc-aurora-blob fc-aurora-blob--c"></span>' +
    "</span>" +
    '<header class="fc-head">' +
    '<div class="fc-brand">' +
    '<span class="fc-mark">' + I.pin + "</span>" +
    '<span class="fc-brand-text">' +
    '<strong class="fc-brand-name">' + BRAND_NAME + "</strong>" +
    '<span class="fc-brand-sub">Floating travel companion</span>' +
    "</span>" +
    "</div>" +
    '<div class="fc-head-actions">' +
    '<span class="fc-live" title="Online"><span class="fc-live-dot"></span>Online</span>' +
    '<button type="button" class="fc-icon-btn" id="fc-close" aria-label="Close companion">' + I.close + "</button>" +
    "</div>" +
    "</header>" +

    '<nav class="fc-tabs" role="tablist" aria-label="Companion sections">' + tabsHtml + "</nav>" +
    '<div class="fc-body">' + viewsHtml + "</div>" +
    '<div class="fc-toast" id="fc-toast" role="status" aria-live="polite"></div>' +
    '<div class="fc-drop" id="fc-drop" aria-hidden="true">' +
    '<span class="fc-drop-inner">' + I.film + "<b>Drop to preview</b>" +
    "<small>A link, image or video file</small></span>" +
    "</div>" +
    "</section>";

  document.body.appendChild(root);

  /* ==================================================================
   * Elements
   * ================================================================== */
  var fab = root.querySelector("#fc-fab");
  var panel = root.querySelector("#fc-panel");
  var closeBtn = root.querySelector("#fc-close");
  var tabBar = root.querySelector(".fc-tabs");
  var tabBtns = Array.prototype.slice.call(root.querySelectorAll(".fc-tab"));
  var views = Array.prototype.slice.call(root.querySelectorAll(".fc-view"));
  var messagesEl = root.querySelector("#fc-messages");
  var input = root.querySelector("#fc-input");
  var sendBtn = root.querySelector("#fc-send");
  var toast = root.querySelector("#fc-toast");
  var dropZone = root.querySelector("#fc-drop");
  /* Set once the runner has finished initialising. selectTab()/setOpen() run
     earlier during startup, so they must be able to skip the game safely —
     otherwise an unguarded read of the game state aborts the rest of the
     script and every later tab renders empty. */
  var runReady = false;
  var attachEl = root.querySelector("#fc-attach");
  var attachImg = root.querySelector("#fc-attach-img");
  var attachBadge = root.querySelector("#fc-attach-badge");
  var attachTitle = root.querySelector("#fc-attach-title");
  var attachSub = root.querySelector("#fc-attach-sub");
  var attachClear = root.querySelector("#fc-attach-x");

  /* ==================================================================
   * Panel open / close
   * ================================================================== */
  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    fab.classList.toggle("is-hidden", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      endDrag();
      panel.classList.remove("is-dragover");
    }
    syncRunVisibility();
    if (open) {
      window.setTimeout(function () {
        if (root.querySelector(".fc-view:not([hidden])").id === "fc-view-chat") input.focus();
      }, 180);
    }
  }

  /* ==================================================================
   * Tabs
   * ================================================================== */
  function setViewVisible(view, on) {
    /* The attribute keeps ARIA semantics and `:not([hidden])` selectors honest. */
    view.hidden = !on;
    /* The inline !important declaration is what actually guarantees the visual
       result: it outranks every author rule, including other !important ones,
       so no host-page cascade can leave an inactive view painted. */
    view.style.setProperty("display", on ? "flex" : "none", "important");
  }

  function selectTab(id, focus) {
    tabBtns.forEach(function (btn) {
      var on = btn.dataset.tab === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
      if (on && focus) btn.focus();
    });
    views.forEach(function (view) {
      setViewVisible(view, view.id === "fc-view-" + id);
    });
    if (settings.tab !== id) {
      settings.tab = id;
      saveSettings();
    }
    panel.scrollTop = 0;
    syncRunVisibility();
  }

  tabBar.addEventListener("click", function (e) {
    var btn = e.target.closest(".fc-tab");
    if (btn) selectTab(btn.dataset.tab, false);
  });

  tabBar.addEventListener("keydown", function (e) {
    var idx = tabBtns.indexOf(document.activeElement);
    if (idx < 0) return;
    var next = null;
    if (e.key === "ArrowRight") next = (idx + 1) % tabBtns.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabBtns.length) % tabBtns.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabBtns.length - 1;
    if (next !== null) {
      e.preventDefault();
      selectTab(tabBtns[next].dataset.tab, true);
    }
  });

  /* ==================================================================
   * Video link previews
   *
   * Metadata is resolved by the background service worker rather than here,
   * because a content script's fetch() is blocked by the host page's CSP.
   * Direct video files are handled locally via a <video> frame grab.
   * ================================================================== */

  function parseVideoUrl(raw) {
    var url = String(raw || "").trim();
    if (!url) return null;

    var m = url.match(
      /(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (m) {
      return {
        provider: "YouTube",
        page: "https://www.youtube.com/watch?v=" + m[1],
        poster: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg"
      };
    }

    m = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{6,})/);
    if (m) return { provider: "Vimeo", page: "https://vimeo.com/" + m[1], poster: null };

    /* Instagram reels, video posts and IGTV. Instagram publishes no public
       oEmbed API, so metadata comes from the page's og: tags instead — hence
       the normalised /p/ permalink, which serves the same og: tags as /reel/. */
    m = url.match(/(?:www\.|dd\.)?instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (m) {
      return {
        provider: "Instagram",
        page: "https://www.instagram.com/p/" + m[1] + "/",
        poster: null
      };
    }

    m = url.match(/\.(mp4|webm|mov|m4v|ogv)(?:$|[?#\s])/i);
    if (m) return { provider: "Direct", page: url, poster: null };

    return null;
  }

  /* Grabs a single frame from a direct video file so previews work without
     any network permission. Cross-origin files taint the canvas, so the
     try/catch falls back to the placeholder. */
  function grabVideoFrame(src) {
    return new Promise(function (resolve) {
      var v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.crossOrigin = "anonymous";
      v.style.display = "none";

      var settled = false;
      var finish = function (poster) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        v.removeAttribute("src");
        v.load();
        if (v.parentNode) v.parentNode.removeChild(v);
        resolve(poster);
      };
      var timer = window.setTimeout(function () { finish(null); }, 6000);

      v.addEventListener("loadeddata", function () {
        try { v.currentTime = Math.min(1, (v.duration || 2) / 2); } catch (e) { /* ignore */ }
      });
      v.addEventListener("seeked", function () {
        try {
          var ratio = (v.videoHeight && v.videoWidth) ? v.videoHeight / v.videoWidth : 9 / 16;
          var c = document.createElement("canvas");
          c.width = 320;
          c.height = Math.max(1, Math.round(320 * ratio));
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          finish(c.toDataURL("image/jpeg", 0.72));
        } catch (e) {
          finish(null); // tainted canvas
        }
      });
      v.addEventListener("error", function () { finish(null); });

      document.body.appendChild(v);
      v.src = src;
    });
  }

  var pending = null;   // in-flight resolve, so we can ignore stale results
  var attachment = null;

  function clearAttachment() {
    attachment = null;
    pending = null;
    attachEl.hidden = true;
    attachImg.removeAttribute("src");
  }

  function showAttachment(media) {
    attachment = media;

    /* The fallback paths hand us the parsed URL, which has no title yet. */
    var title = media.title || media.page || (media.provider + " video");
    media.title = title;

    attachTitle.textContent = title;
    attachSub.textContent = [media.provider, media.author].filter(Boolean).join(" · ");
    attachBadge.textContent = media.provider;
    attachImg.alt = title;
    if (media.poster) {
      attachImg.src = media.poster;
      attachImg.parentNode.classList.remove("is-placeholder");
    } else {
      attachImg.removeAttribute("src");
      attachImg.parentNode.classList.add("is-placeholder");
    }
    attachEl.hidden = false;
  }

  /* Saved shares. A resolve can target the composer ("attach") or this list
     ("share") — same pipeline, different destination. */
  var sharesWrap = root.querySelector("#fc-shares-list");

  /* Base64 data URLs are ~4/3 the byte size; cap what we persist per item so a
     handful of photos cannot exhaust the storage quota. */
  var MAX_POSTER_CHARS = 400 * 1024;

  function seedShares() {
    return SHARES.map(function (s, i) {
      return {
        id: "seed-" + i,
        title: s.title,
        provider: s.kind,
        page: "",
        poster: null,
        stamp: s.meta,
        seeded: true
      };
    });
  }

  function addShare(media, quiet) {
    if (!Array.isArray(settings.shares)) settings.shares = seedShares();

    if (media.page && settings.shares.some(function (s) { return s.page === media.page; })) {
      if (!quiet) showToast("Already saved");
      return false;
    }

    /* A data-URL poster from a large photo can run to megabytes and blow the
       storage quota, which would silently break every later save. Trim it and
       fall back to the icon tile rather than risk that. */
    var poster = media.poster || null;
    if (poster && poster.indexOf("data:") === 0 && poster.length > MAX_POSTER_CHARS) {
      poster = null;
      if (!quiet) showToast("Saved without a thumbnail — file too large");
    }

    settings.shares.unshift({
      id: "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      title: media.title || media.page || media.provider,
      provider: media.provider || "Link",
      author: media.author || "",
      page: media.page || "",
      poster: poster,
      at: Date.now(),
      stamp: "Saved just now",
      seeded: false
    });

    if (settings.shares.length > 40) settings.shares.length = 40;

    renderShares();
    saveSettings();
    if (!quiet) showToast("Saved to Shares");
    return true;
  }

  function removeShare(id) {
    if (!Array.isArray(settings.shares)) return;
    settings.shares = settings.shares.filter(function (s) { return s.id !== id; });
    renderShares();
    saveSettings();
  }

  /* ---- Share list: filtering, timestamps, toolbar -------------------- */
  var shareQuery = "";

  function timeAgo(ts) {
    if (!ts) return "";
    var secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 45) return "just now";
    if (secs < 3600) return Math.round(secs / 60) + "m ago";
    if (secs < 86400) return Math.round(secs / 3600) + "h ago";
    if (secs < 604800) return Math.round(secs / 86400) + "d ago";
    return new Date(ts).toLocaleDateString();
  }

  function visibleShares() {
    var items = Array.isArray(settings.shares) ? settings.shares : seedShares();
    var q = shareQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(function (s) {
      return (
        (s.title || "").toLowerCase().indexOf(q) >= 0 ||
        (s.provider || "").toLowerCase().indexOf(q) >= 0 ||
        (s.author || "").toLowerCase().indexOf(q) >= 0
      );
    });
  }

  /* Maps a saved item's provider to a geometric mark, so a list reads as a
     timeline of sources rather than a row of identical document icons. */
  function providerIcon(provider, seeded) {
    var p = String(provider || "").toLowerCase();
    if (p.indexOf("youtube") >= 0 || p.indexOf("youtu.be") >= 0) return I.yt;
    if (p.indexOf("vimeo") >= 0) return I.vimeo;
    if (p.indexOf("instagram") >= 0) return I.ig;
    if (p.indexOf("image") >= 0 || /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(p)) return I.shot;
    if (p.indexOf("video") >= 0 || /\.(mp4|webm|mov|m4v|ogv)$/i.test(p)) return I.film;
    return seeded ? I.doc : I.link;
  }

  function renderShares() {
    if (!sharesWrap) return;
    var all = Array.isArray(settings.shares) ? settings.shares : seedShares();
    var items = visibleShares();

    if (!all.length) {
      sharesWrap.innerHTML =
        '<div class="fc-empty">' +
        '<span class="fc-empty-ic">' + I.link + "</span>" +
        '<p class="fc-empty-title">Nothing saved yet</p>' +
        '<p class="fc-empty-sub">Drag a link, image or video here to keep it.</p>' +
        "</div>";
      return;
    }

    /* Filtering hid everything, but the list itself is not empty. */
    if (!items.length) {
      sharesWrap.innerHTML =
        '<div class="fc-empty">' +
        '<span class="fc-empty-ic">' + I.search + "</span>" +
        '<p class="fc-empty-title">No matches</p>' +
        '<p class="fc-empty-sub">Nothing saved matches "' + esc(shareQuery.trim()) + '".</p>' +
        "</div>";
      return;
    }

    sharesWrap.innerHTML =
      '<ul class="fc-rows">' +
      items.map(function (s, i) {
        var thumb = s.poster
          ? '<span class="fc-file fc-file--img"><img src="' + esc(s.poster) + '" alt="" /></span>'
          : '<span class="fc-file">' + providerIcon(s.provider, s.seeded) + "</span>";
        var when = s.at ? timeAgo(s.at) : s.stamp;
        var msg = s.author ? s.author + " · " + when : when;
        /* Only rows with a real source URL are tappable; dropped files and
           seeded demo rows have none, so they must not look clickable. */
        var tappable = !!s.page;
        return (
          '<li class="fc-row' + (tappable ? " fc-row--tap" : "") + '"' +
          (tappable ? ' data-page="' + esc(s.page) + '"' : "") + ">" +
          thumb +
          '<span class="fc-row-main">' +
          '<span class="fc-row-top">' +
          '<span class="fc-row-title">' + esc(s.title) + "</span>" +
          '<span class="fc-row-sub">' + esc(s.provider) + "</span>" +
          "</span>" +
          '<span class="fc-row-msg">' + esc(msg) + "</span>" +
          "</span>" +
          (tappable ? '<span class="fc-chev">' + I.chevron + "</span>" : "") +
          '<button type="button" class="fc-row-x" data-remove="' + esc(s.id) + '" ' +
          'aria-label="Remove ' + esc(s.title) + '">' + I.close + "</button>" +
          "</li>"
        );
      }).join("") +
      "</ul>";

    /* Set via CSSOM rather than a style="" attribute: inline style attributes
       are blocked by strict page CSP, CSSOM writes are not. The cap keeps a
       long list from feeling sluggish. */
    Array.prototype.forEach.call(sharesWrap.querySelectorAll(".fc-row"), function (row, i) {
      row.style.setProperty("--fc-i", String(Math.min(i, 12)));
    });
  }

  function setBusy(on) {
    attachEl.classList.toggle("is-busy", !!on);
  }

  function resolveVideo(rawUrl, sink) {
    var parsed = parseVideoUrl(rawUrl);
    /* Silently ignore anything unrecognised. Dragging an article link should
       not nag the user with an error toast. */
    if (!parsed) return;

    /* Where the finished card should land. */
    var deliver = sink === "share"
      ? function (m) { addShare(withPage(m, parsed.page)); }
      : showAttachment;

    pending = rawUrl;
    setBusy(true);
    showToast("Fetching preview…");

    /* Direct files skip the service worker entirely. */
    if (parsed.provider === "Direct") {
      grabVideoFrame(parsed.page).then(function (poster) {
        if (pending !== rawUrl) return;
        setBusy(false);
        deliver({
          provider: "Direct file",
          title: parsed.page.split("/").pop().split(/[?#]/)[0] || "Video file",
          author: "",
          poster: poster
        });
      });
      return;
    }

    var msg = { type: "lakbayon:resolve-video", url: parsed.page };

    /* Guarded so the widget still works if the service worker is asleep,
       unreachable, or the extension context was invalidated. */
    var replied = false;
    var fallback = window.setTimeout(function () {
      if (replied) return;
      replied = true;
      if (pending !== rawUrl) return;
      setBusy(false);
      deliver(parsed); // poster URL still works without oEmbed metadata
      showToast("Showing thumbnail only");
    }, 4000);

    try {
      chrome.runtime.sendMessage(msg, function (res) {
        if (replied) return;
        replied = true;
        window.clearTimeout(fallback);
        if (pending !== rawUrl) return;
        setBusy(false);

        if (chrome.runtime.lastError || !res || !res.ok) {
          deliver(parsed);
          showToast("Showing thumbnail only");
          return;
        }
        var info = res.info || {};
        deliver({
          provider: info.provider || parsed.provider,
          title: info.title || parsed.page,
          author: info.author || "",
          poster: info.thumbnail || parsed.poster || null
        });
      });
    } catch (e) {
      window.clearTimeout(fallback);
      replied = true;
      setBusy(false);
      deliver(parsed);
    }
  }

  /* Ensures a card carries its source URL, which addShare needs for
     duplicate detection. */
  function withPage(media, page) {
    if (!media.page) media.page = page || "";
    return media;
  }

  attachClear.addEventListener("click", function () {
    clearAttachment();
    input.focus();
  });

  /* True when a pasted/dropped string is something we can preview rather than
     something the user wants to keep as literal text. */
  function isPreviewable(text) {
    if (!text) return false;
    var trimmed = String(text).trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    return !!parseVideoUrl(trimmed) || isImageUrl(trimmed);
  }

  /* Shared by paste and drop so both behave identically. */
  function handleCandidate(raw, sink) {
    var text = String(raw || "").trim();
    if (parseVideoUrl(text)) {
      resolveVideo(text, sink);
      return true;
    }
    if (isImageUrl(text)) {
      attachImage(text, fileNameFrom(text), "Image", sink, text);
      return true;
    }
    return false;
  }

  /* Which destination a drop should use: the Shares list when that tab is
     open, otherwise the composer. */
  function currentSink() {
    return settings.tab === "shares" ? "share" : "attach";
  }

  /* --- Paste -------------------------------------------------------- */
  input.addEventListener("paste", function (e) {
    var text = (e.clipboardData || window.clipboardData).getData("text");
    /* Anything else keeps the browser's normal paste-as-text behaviour. */
    if (!isPreviewable(text)) return;
    e.preventDefault();
    input.value = "";
    handleCandidate(text);
  });

  /* Also accept a link pasted anywhere in the message list. */
  messagesEl.addEventListener("paste", function (e) {
    var text = (e.clipboardData || window.clipboardData).getData("text");
    if (!isPreviewable(text)) return;
    e.preventDefault();
    handleCandidate(text);
  });

  /* --- Drag and drop ------------------------------------------------ */
  var dragDepth = 0;

  /* Accepts anything we could preview: text-ish payloads (links, selected
     text) and dropped media files. Chrome can report an image drag as "Files"
     only, so a bare "Files" entry must still arm the drop target. */
  function dragHasPayload(dt) {
    if (!dt) return false;
    var types = Array.prototype.slice.call(dt.types || []);
    for (var i = 0; i < types.length; i++) {
      if (types[i] === "Files") return true;
      if (types[i] === "text" || types[i].indexOf("text/") === 0) return true;
    }
    return false;
  }

  /* A dragged link carries its URL in text/uri-list, one per line, CRLF
     separated — so split on real newlines, not escaped ones. */
  function firstUri(dt) {
    if (!dt) return "";
    var uri = "";
    try { uri = dt.getData("text/uri-list") || ""; } catch (e) { uri = ""; }
    if (!uri) return "";
    return uri.split(/\r?\n/).filter(Boolean)[0] || "";
  }

  function droppedFiles(dt) {
    if (!dt || !dt.files || !dt.files.length) return [];
    return Array.prototype.slice.call(dt.files);
  }

  function isImageUrl(url) {
    return /\.(jpe?g|png|gif|webp|avif|bmp)(?:$|[?#\s])/i.test(url);
  }

  function fileNameFrom(url) {
    var parts = String(url).split(/[?#]/)[0].split("/");
    return parts[parts.length - 1] || "Image";
  }

  /* Attaches an image with no network round-trip. Blob URLs are revoked only
     once the bitmap has loaded, so revoking early cannot break the preview. */
  function attachImage(src, title, provider, sink, page) {
    var url = src;
    if (url.indexOf("blob:") === 0) {
      var revoke = function () {
        try { URL.revokeObjectURL(url); } catch (e) { /* already released */ }
      };
      var probe = new Image();
      probe.addEventListener("load", revoke, { once: true });
      probe.addEventListener("error", revoke, { once: true });
      probe.src = url;
    }

    var media = {
      provider: provider || "Image",
      title: title || fileNameFrom(src),
      author: "",
      poster: src,
      page: page || ""
    };

    if (sink === "share") addShare(media);
    else showAttachment(media);
  }

  /* Reads an image File into a downscaled JPEG data URL. Persisted thumbnails
   have to survive a reload, which rules out blob: URLs, and staying small
   matters because these go into extension storage. */
  function fileToThumbnail(file, maxWidth) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read failed")); };
      reader.onload = function () { resolve(reader.result); };
      reader.readAsDataURL(file);
    }).then(function (raw) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          try {
            var cap = maxWidth || 480;
            var sw = img.naturalWidth || cap;
            var sh = img.naturalHeight || Math.round(cap * 0.5625);
            var w = Math.min(cap, sw);
            var h = Math.max(1, Math.round((w * sh) / sw));
            var canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } catch (e) {
            resolve(raw); // tainted or unsupported; the original still works
          }
        };
        img.onerror = function () { resolve(raw); };
        img.src = raw;
      });
    });
  }

  function humanSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
    var mb = bytes / 1048576;
    return (mb < 10 ? mb.toFixed(1) : Math.round(mb)) + " MB";
  }

  /* A dropped File: videos get a real frame grab, images are used as-is. */
  function attachFile(file, sink) {
    var url = URL.createObjectURL(file);
    var isVideo = /^video\//i.test(file.type) || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);

    if (!isVideo) {
      /* Blob URLs are scoped to the page that created them, so one that gets
         persisted into Shares would be dead after any reload. Read the file
         into a downscaled data URL instead: it survives reloads and keeps the
         stored thumbnail small. */
      fileToThumbnail(file).then(function (dataUrl) {
        attachImage(dataUrl, file.name || "Image", "Image", sink, "");
      }).catch(function () {
        showToast("Could not read that image");
      });
      return;
    }

    showToast("Reading video frame…");
    grabVideoFrame(url).then(function (poster) {
      try { URL.revokeObjectURL(url); } catch (e) { /* already released */ }
      var media = {
        provider: "Video file",
        title: file.name || "Video",
        author: humanSize(file.size),
        poster: poster
      };
      if (sink === "share") addShare(media);
      else showAttachment(media);
    });
  }

  /* Pulls a media src out of dragged markup, e.g. dragging an <img> or
     <video> element straight off another page. */
  function srcFromHtml(html) {
    if (!html) return "";
    try {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var node =
        doc.querySelector("video[src]") ||
        doc.querySelector("video source[src]") ||
        doc.querySelector("img[src]") ||
        doc.querySelector("source[src]");
      return node ? node.getAttribute("src") || "" : "";
    } catch (e) {
      return "";
    }
  }

  function handleDrop(dt, sink) {
    /* Real files win: unambiguous and need no parsing. */
    var files = droppedFiles(dt);
    if (files.length) {
      attachFile(files[0], sink);
      return;
    }

    var uri = firstUri(dt);
    if (uri) {
      if (!handleCandidate(uri, sink)) showToast("That link cannot be previewed");
      return;
    }

    var fromHtml = "";
    try { fromHtml = srcFromHtml(dt.getData("text/html")); } catch (e) { fromHtml = ""; }
    if (fromHtml) {
      if (!handleCandidate(fromHtml, sink)) showToast("That media cannot be previewed");
      return;
    }

    var text = "";
    try { text = dt.getData("text/plain") || dt.getData("text") || ""; } catch (e) { text = ""; }
    if (text && !handleCandidate(text, sink)) showToast("That link cannot be previewed");
  }

  function endDrag() {
    dragDepth = 0;
    panel.classList.remove("is-dragover");
  }

  panel.addEventListener("dragenter", function (e) {
    if (!dragHasPayload(e.dataTransfer)) return;
    dragDepth++;
    panel.classList.add("is-dragover");
  });

  panel.addEventListener("dragover", function (e) {
    /* Required, or the browser navigates to the dropped URL instead. */
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  });

  panel.addEventListener("dragleave", function () {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) panel.classList.remove("is-dragover");
  });

  panel.addEventListener("drop", function (e) {
    /* Must preventDefault or the page navigates to whatever was dropped. */
    e.preventDefault();
    e.stopPropagation();
    endDrag();
    handleDrop(e.dataTransfer, currentSink());
  });

  window.addEventListener("dragend", endDrag);
  document.addEventListener("drop", endDrag);
  document.addEventListener("dragover", function (e) {
    /* Swallow drops that land outside the panel but inside our root, so the
       host page never navigates away mid-drag. */
    if (root.contains(e.target)) e.preventDefault();
  });

  /* ==================================================================
   * Chat
   * ================================================================== */
  var settings = {
    compact: false,
    contrast: false,
    enter: true,
    notify: false,
    theme: "auto",
    tab: "chat",
    shares: null,
    best: 0
  };

  /* Settings live in extension storage rather than memory: this widget is
     injected into every page, so anything held in a variable is discarded on
     each navigation.

     Storage strategy, in order:
       1. chrome.storage.local — extension-scoped, shared by every page. This is
          the real store. Note it only exists when the manifest declares the
          "storage" permission; without it the API is undefined and every write
          silently no-ops.
       2. localStorage — fallback only. Plain localStorage is keyed to the
          host page's origin, so on its own it would fragment saved links per
          website. It is only a safety net.

     Both expose the same get/set shape, so nothing downstream changes. */
  var LS_KEY = "lakbayon:v1";

  function localStorageAdapter() {
    return {
      get: function (keys, cb) {
        var out = {};
        try {
          var raw = localStorage.getItem(LS_KEY);
          var data = raw ? JSON.parse(raw) : {};
          (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
            if (k in data) out[k] = data[k];
          });
        } catch (e) { /* unreadable or blocked */ }
        if (cb) window.setTimeout(function () { cb(out); }, 0);
      },
      set: function (obj, cb) {
        try {
          var data = {};
          var raw = localStorage.getItem(LS_KEY);
          if (raw) data = JSON.parse(raw);
          Object.keys(obj).forEach(function (k) { data[k] = obj[k]; });
          localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch (e) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[Lakbayon] localStorage save failed:", e);
          }
        }
        if (cb) window.setTimeout(cb, 0);
      }
    };
  }

  var storage = (function () {
    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return chrome.storage.local;
      }
    } catch (e) { /* fall through to localStorage */ }

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LS_KEY + ":probe", "1");
        localStorage.removeItem(LS_KEY + ":probe");
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "[Lakbayon] chrome.storage unavailable — falling back to localStorage. " +
              "Saved links will only be shared within this site. Add the storage " +
              "permission to the manifest to fix this."
          );
        }
        return localStorageAdapter();
      }
    } catch (e) { /* nothing available */ }

    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "[Lakbayon] no storage available — settings and saved shares will not persist."
      );
    }
    return null;
  })();

  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function applyTheme() {
    var dark = settings.theme === "dark" || (settings.theme === "auto" && !!(darkQuery && darkQuery.matches));
    root.classList.toggle("is-dark", dark);
  }

  function saveSettings() {
    if (!storage) return false;
    try {
      storage.set(
        {
          compact: settings.compact,
          contrast: settings.contrast,
          enter: settings.enter,
          notify: settings.notify,
          theme: settings.theme,
          tab: settings.tab,
          shares: settings.shares,
          best: settings.best || 0
        },
        function () {
          /* Without a callback, a quota failure is completely silent — which is
             how a save can appear to succeed and then quietly not persist. */
          var err = chrome.runtime && chrome.runtime.lastError;
          if (err && typeof console !== "undefined" && console.warn) {
            console.warn("[Lakbayon] could not save settings/shares:", err.message);
          }
        }
      );
      return true;
    } catch (e) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[Lakbayon] could not save settings/shares:", e);
      }
      return false;
    }
  }

  function syncThemeButtons() {
    var seg = root.querySelector("#fc-theme-seg");
    if (!seg) return;
    Array.prototype.forEach.call(seg.querySelectorAll(".fc-seg-btn"), function (btn) {
      var on = btn.dataset.theme === settings.theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  if (darkQuery) {
    var onSchemeChange = function () {
      if (settings.theme === "auto") applyTheme();
    };
    if (darkQuery.addEventListener) darkQuery.addEventListener("change", onSchemeChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSchemeChange);
  }
  var started = false;

  function renderWelcome() {
    messagesEl.innerHTML =
      '<div class="fc-welcome">' +
      '<span class="fc-welcome-mark">' + I.pin + "</span>" +
      '<h2 class="fc-display fc-display--sm">Where to next?</h2>' +
      '<p class="fc-lede">Ask about destinations, tour packages, or itineraries.</p>' +
      '<div class="fc-chips">' +
      CHIPS.map(function (c) {
        return '<button type="button" class="fc-chip" data-chip="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("") +
      "</div>" +
      "</div>";
  }

  function addMessage(text, who, media) {
    var el = document.createElement("div");
    el.className = "fc-msg fc-msg--" + who;
    if (media) {
      el.classList.add("has-media");
      el.appendChild(buildMediaCard(media));
      if (text) {
        var cap = document.createElement("span");
        cap.className = "fc-msg-cap";
        cap.textContent = text;
        el.appendChild(cap);
      }
    } else {
      el.textContent = text;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  /* Shared thumbnail card, used by both the composer preview and sent messages. */
  function buildMediaCard(media, bare) {
    var card = document.createElement("div");
    card.className = "fc-mcard" + (bare ? " fc-mcard--bare" : "");

    var thumb = document.createElement("div");
    thumb.className = "fc-mcard-thumb" + (media.poster ? "" : " is-placeholder");

    if (media.poster) {
      var img = document.createElement("img");
      img.src = media.poster;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () {
        thumb.classList.add("is-placeholder");
        img.remove();
      });
      thumb.appendChild(img);
    }

    var play = document.createElement("span");
    play.className = "fc-mcard-play";
    play.innerHTML = I.play;
    thumb.appendChild(play);

    var body = document.createElement("div");
    body.className = "fc-mcard-body";

    var badge = document.createElement("p");
    badge.className = "fc-mcard-badge";
    badge.textContent = media.provider + (media.author ? " · " + media.author : "");
    body.appendChild(badge);

    var title = document.createElement("p");
    title.className = "fc-mcard-title";
    title.textContent = media.title;
    body.appendChild(title);

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
  }

  function replyTo(text, media) {
    var dots = document.createElement("div");
    dots.className = "fc-msg fc-msg--bot is-typing";
    dots.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(dots);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var answer = FALLBACK;
    for (var i = 0; i < REPLIES.length; i++) {
      if (REPLIES[i].match.test(text)) {
        answer = REPLIES[i].text;
        break;
      }
    }

    /* A video with no caption gets a note about the link itself. */
    if (media && !text) {
      answer =
        "Preview ready — " +
        media.provider +
        (media.author ? " by " + media.author : "") +
        ". Ask if you want this added to a trip plan.";
    }

    window.setTimeout(function () {
      dots.classList.remove("is-typing");
      dots.textContent = answer;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 650);
  }

  function send(text) {
    text = (text || "").trim();
    var media = attachment;

    /* An attachment on its own is worth sending. */
    if (!text && !media) return;

    if (!started) {
      started = true;
      messagesEl.innerHTML = "";
    }

    addMessage(text, "user", media);
    input.value = "";
    var sent = media;
    clearAttachment();

    /* Anything sent with a message is also kept in Recent Shares, so dragging a
       video or image into the chat and sending it does not simply vanish. */
    if (sent) addShare(withPage(sent, sent.page || ""), true);

    replyTo(text, sent);
  }

  messagesEl.addEventListener("click", function (e) {
    var chip = e.target.closest(".fc-chip");
    if (chip) send(chip.dataset.chip);
  });

  sendBtn.addEventListener("click", function () {
    send(input.value);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (settings.enter && !e.shiftKey) send(input.value);
  });

  renderWelcome();

  /* Normalise every view's visibility up front, so the widget never paints with
     more than one tab's content showing — not even on the very first frame. */
  selectTab("chat", false);

  /* ==================================================================
   * Countdown timer (Tools tab)
   * ================================================================== */
  var timerEl = root.querySelector("#fc-timer");
  var timerClock = root.querySelector("#fc-timer-clock");
  var timerFill = root.querySelector("#fc-timer-fill");
  var timerSub = root.querySelector("#fc-timer-sub");
  var timerToggle = root.querySelector("#fc-timer-toggle");
  var timerReset = root.querySelector("#fc-timer-reset");
  var timerPresets = root.querySelector("#fc-timer-presets");

  var timer = { total: 25 * 60, remaining: 25 * 60, running: false, id: null };
  var audioCtx = null;
  var ringWrap = root.querySelector("#fc-fab-wrap");
  var ringBar = root.querySelector("#fc-ring-bar");
  var fabBadge = root.querySelector("#fc-fab-badge");
  var RING_LEN = 2 * Math.PI * 29;

  /* Mirrors the countdown onto the launcher, so a running timer is still
     visible after switching to another tab. */
  function syncLauncherTimer() {
    var active = timer.running;
    ringWrap.classList.toggle("is-timing", active);
    fabBadge.hidden = !active;
    if (!active) return;
    var pct = timer.total ? timer.remaining / timer.total : 0;
    ringBar.style.strokeDasharray = RING_LEN;
    ringBar.style.strokeDashoffset = RING_LEN * (1 - pct);
    fabBadge.textContent = formatClock(timer.remaining);
  }

  function formatClock(seconds) {
    var s = Math.max(0, Math.round(seconds));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function renderTimer() {
    timerClock.textContent = formatClock(timer.remaining);
    var pct = timer.total ? (timer.remaining / timer.total) * 100 : 0;
    timerFill.style.width = pct + "%";
    timerEl.classList.toggle("is-running", timer.running);
    timerEl.classList.toggle("is-done", timer.remaining === 0);
    timerToggle.textContent = timer.running ? "Pause" : timer.remaining === 0 ? "Restart" : "Start";
    timerClock.setAttribute("aria-label", formatClock(timer.remaining) + " remaining");
    syncLauncherTimer();
  }

  function stopTimer() {
    timer.running = false;
    if (timer.id !== null) {
      window.clearInterval(timer.id);
      timer.id = null;
    }
    syncLauncherTimer();
  }

  function chime() {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtx) audioCtx = new Ctor();
      if (audioCtx.state === "suspended") audioCtx.resume();
      /* Three short beeps, generated so no audio asset is needed. */
      [0, 0.2, 0.4].forEach(function (delay) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + 0.17);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.19);
      });
    } catch (e) {
      /* Audio is a nicety; never let it break the timer. */
    }
  }

  function finishTimer() {
    stopTimer();
    timer.remaining = 0;
    timerSub.textContent = "Time is up";
    renderTimer();
    chime();
    showToast("Timer finished");
  }

  function startTimer() {
    if (timer.remaining <= 0) timer.remaining = timer.total;
    timer.running = true;
    timerSub.textContent = "Counting down";
    timer.id = window.setInterval(function () {
      timer.remaining -= 1;
      if (timer.remaining <= 0) {
        finishTimer();
      } else {
        renderTimer();
      }
    }, 1000);
    renderTimer();
  }

  function setTimerPreset(minutes, autostart) {
    stopTimer();
    timer.total = minutes * 60;
    timer.remaining = timer.total;
    timerSub.textContent = minutes + " minute countdown";
    Array.prototype.forEach.call(timerPresets.querySelectorAll(".fc-tchip"), function (chip) {
      chip.classList.toggle("is-active", Number(chip.dataset.min) === minutes);
    });
    renderTimer();
    if (autostart) startTimer();
  }

  timerToggle.addEventListener("click", function () {
    if (timer.running) {
      stopTimer();
      timerSub.textContent = "Paused";
      renderTimer();
    } else {
      startTimer();
    }
  });

  timerReset.addEventListener("click", function () {
    stopTimer();
    timer.remaining = timer.total;
    timerSub.textContent = "Reset";
    renderTimer();
  });

  timerPresets.addEventListener("click", function (e) {
    var chip = e.target.closest(".fc-tchip");
    if (chip) setTimerPreset(Number(chip.dataset.min), false);
  });

  root.querySelector("#fc-theme-seg").addEventListener("click", function (e) {
    var btn = e.target.closest(".fc-seg-btn");
    if (!btn) return;
    settings.theme = btn.dataset.theme;
    applyTheme();
    syncThemeButtons();
    saveSettings();
  });

  root.querySelector("#fc-social-grid").addEventListener("click", function (e) {
    var btn = e.target.closest(".fc-social-btn");
    if (!btn) return;
    window.open(btn.dataset.url, "_blank", "noopener");
  });

  /* Pause an in-flight timer while the page is hidden so it does not drift,
     then resume where it left off. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && timer.running) {
      stopTimer();
      timerSub.textContent = "Paused while hidden";
      renderTimer();
    }
  });

  setTimerPreset(25, false);

  /* ---- Restore preferences, then settle on the remembered tab ---------- */
  applyTheme();
  syncThemeButtons();

  if (storage) {
    try {
      storage.get(Object.keys(settings), function (data) {
        if (!data) return;
        ["compact", "contrast", "enter", "notify"].forEach(function (key) {
          if (typeof data[key] === "boolean") {
            settings[key] = data[key];
            syncTool(key, data[key]);
          }
        });
        panel.classList.toggle("is-compact", settings.compact);
        root.classList.toggle("is-contrast", settings.contrast);

        if (["auto", "light", "dark"].indexOf(data.theme) >= 0) settings.theme = data.theme;
        if (typeof data.best === "number" && data.best > 0) settings.best = data.best;
        applyTheme();
        syncThemeButtons();

        if (TABS.some(function (t) { return t.id === data.tab; })) selectTab(data.tab, false);

        /* Saved shares: an absent key means a fresh install, so seed the demo
           rows once; an empty array is a deliberate "user cleared them". */
        if (Array.isArray(data.shares)) settings.shares = data.shares;
        else settings.shares = seedShares();
        renderShares();
      });
    } catch (e) {
      /* Preferences unavailable; defaults already applied. */
    }
  }

  /* ---- Live cross-tab sync ----------------------------------------------
     Every page holds its own copy of the widget, so without this a change
     made in one tab only applies after a reload. Each key is compared before
     being applied so our own writes never bounce back and loop. */
  if (storage && typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged &&
    chrome.storage.onChanged.addListener) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area && area !== "local") return;

      ["compact", "contrast", "enter", "notify"].forEach(function (key) {
        if (!changes[key]) return;
        var next = changes[key].newValue === true;
        if (settings[key] === next) return;
        settings[key] = next;
        syncTool(key, next);
        if (key === "compact") panel.classList.toggle("is-compact", next);
        if (key === "contrast") root.classList.toggle("is-contrast", next);
      });

      if (changes.theme && changes.theme.newValue !== settings.theme) {
        settings.theme = changes.theme.newValue;
        applyTheme();
        syncThemeButtons();
      }

      if (changes.shares) {
        settings.shares = changes.shares.newValue;
        renderShares();
      }

      /* Set the value first so selectTab does not write it straight back. */
      if (changes.tab && changes.tab.newValue !== settings.tab &&
        TABS.some(function (t) { return t.id === changes.tab.newValue; })) {
        settings.tab = changes.tab.newValue;
        selectTab(changes.tab.newValue, false);
      }
    });
  }

  /* ---- Keyboard shortcut (relayed by the service worker) -------------- */
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg && msg.type === "lakbayon:toggle") {
        setOpen(!panel.classList.contains("is-open"));
      }
    });
  } catch (e) {
    /* Shortcut unavailable in this context. */
  }

  /* ==================================================================
   * Lakbayon Run — an original endless runner
   *
   * Deliberately not a clone of any branded runner: original geometry, our own
   * palette, and simple AABB physics. Two disciplines matter here:
   *   1. Fixed-timestep integration, so the game feels identical on a 60Hz and
   *      a 144Hz display.
   *   2. The rAF loop only runs while this tab is open and the panel is open.
   *      This widget is injected into every page, so a permanently animating
   *      canvas is not acceptable.
   * ================================================================== */
  var canvas = root.querySelector("#fc-canvas");
  var ctx2d = canvas.getContext("2d");
  var gameOverlay = root.querySelector("#fc-game-overlay");
  var gameTitle = root.querySelector("#fc-game-title");
  var gameSub = root.querySelector("#fc-game-sub");
  var gameStart = root.querySelector("#fc-game-start");
  var gameScoreEl = root.querySelector("#fc-game-score");
  var gameBestEl = root.querySelector("#fc-game-best");
  var gameLive = root.querySelector("#fc-game-live");

  var GRAVITY = 2100;
  var JUMP_V = -760;
  var DUCK_FAST = 2900;
  var GROUND_H = 30;
  var STEP = 1 / 60;

  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var G = {
    mode: "idle", // idle | running | over | paused
    score: 0,
    speed: 250,
    dist: 0,
    spawnIn: 0,
    acc: 0,
    last: 0,
    raf: null,
    obstacles: [],
    puffs: [],
    shake: 0,
    player: { x: 58, y: 0, w: 15, h: 34, vy: 0, grounded: true, duck: false }
  };

  function viewBox() {
    var r = canvas.getBoundingClientRect();
    return { w: Math.max(240, r.width || 360), h: Math.max(160, r.height || 240) };
  }

  function groundY() {
    return viewBox().h - GROUND_H;
  }

  /* Matches the canvas backing store to its CSS size for crisp lines. */
  function fitCanvas() {
    var box = viewBox();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(box.w * dpr);
    var h = Math.round(box.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetRun() {
    var box = viewBox();
    var p = G.player;
    G.score = 0;
    G.speed = 250;
    G.dist = 0;
    G.spawnIn = 42;
    G.obstacles.length = 0;
    G.puffs.length = 0;
    G.shake = 0;
    p.w = 15; p.h = 34; p.vy = 0; p.duck = false;
    p.x = Math.round(box.w * 0.16);
    p.y = groundY() - p.h;
    p.grounded = true;
    updateHud();
  }

  function updateHud() {
    gameScoreEl.textContent = String(Math.floor(G.score));
    gameBestEl.textContent = "Best " + Math.floor(settings.best || 0);
  }

  /* --- Drawing ------------------------------------------------------- */
  function palette() {
    var dark = root.classList.contains("is-dark");
    return dark
      ? { sky: ["#1b1f27", "#2b3240"], hill: "#333c4c", hill2: "#262d38",
          ground: "#161a20", line: "#465468", rock: "#cfd6e2", rock2: "#9aa6ba",
          player: "#8ba3c6", playerDark: "#5d7699", sun: "#ffe9cb" }
      : { sky: ["#fdfaf4", "#eae5f0"], hill: "#d9d3e4", hill2: "#c6bdd8",
          ground: "#e7e2ec", line: "#cfc7dc", rock: "#3f5473", rock2: "#5b7396",
          player: "#5b7396", playerDark: "#3f5473", sun: "#fff3d8" };
  }

  function drawScene(box, pal) {
    var sky = ctx2d.createLinearGradient(0, 0, 0, box.h);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(1, pal.sky[1]);
    ctx2d.fillStyle = sky;
    ctx2d.fillRect(0, 0, box.w, box.h);

    /* Low sun, echoing the Media artwork. */
    ctx2d.fillStyle = pal.sun;
    ctx2d.globalAlpha = 0.75;
    ctx2d.beginPath();
    ctx2d.arc(box.w * 0.78, box.h * 0.24, 15, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.globalAlpha = 1;

    /* Two parallax ridges, generated once and scrolled. */
    var far = groundY() - 8;
    ctx2d.fillStyle = pal.hill;
    ctx2d.beginPath();
    ctx2d.moveTo(0, box.h);
    for (var i = 0; i <= 8; i++) {
      var x = (box.w / 8) * i;
      var wobble = Math.sin((i + G.dist / 260) * 0.9) * 9;
      ctx2d.lineTo(x, far - 26 - wobble);
    }
    ctx2d.lineTo(box.w, box.h);
    ctx2d.closePath();
    ctx2d.fill();

    ctx2d.fillStyle = pal.hill2;
    ctx2d.beginPath();
    ctx2d.moveTo(0, box.h);
    for (var j = 0; j <= 8; j++) {
      var x2 = (box.w / 8) * j;
      var wob2 = Math.sin((j + G.dist / 150) * 1.15 + 2) * 6;
      ctx2d.lineTo(x2, far - 6 - wob2);
    }
    ctx2d.lineTo(box.w, box.h);
    ctx2d.closePath();
    ctx2d.fill();

    /* Ground band with scrolling dashes. */
    ctx2d.fillStyle = pal.ground;
    ctx2d.fillRect(0, groundY(), box.w, GROUND_H);
    ctx2d.strokeStyle = pal.line;
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.moveTo(0, groundY() + 0.5);
    ctx2d.lineTo(box.w, groundY() + 0.5);
    ctx2d.stroke();

    ctx2d.strokeStyle = pal.line;
    ctx2d.beginPath();
    var offset = -(G.dist % 26);
    for (var d = offset; d < box.w; d += 26) {
      ctx2d.moveTo(d, groundY() + GROUND_H - 7);
      ctx2d.lineTo(d + 12, groundY() + GROUND_H - 7);
    }
    ctx2d.stroke();
  }

  /* Original obstacle shapes: jagged shards and a gliding chevron. */
  function drawObstacle(o, pal) {
    ctx2d.fillStyle = pal.rock;
    if (o.kind === "shard") {
      ctx2d.beginPath();
      ctx2d.moveTo(o.x, o.y + o.h);
      ctx2d.lineTo(o.x + o.w * 0.18, o.y + o.h * 0.18);
      ctx2d.lineTo(o.x + o.w * 0.42, o.y + o.h * 0.42);
      ctx2d.lineTo(o.x + o.w * 0.62, o.y);
      ctx2d.lineTo(o.x + o.w * 0.84, o.y + o.h * 0.5);
      ctx2d.lineTo(o.x + o.w, o.y + o.h);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.fillStyle = pal.rock2;
      ctx2d.fillRect(o.x + o.w * 0.44, o.y + 2, 1.6, o.h * 0.5);
    } else {
      ctx2d.beginPath();
      ctx2d.moveTo(o.x, o.y + o.h * 0.5);
      ctx2d.lineTo(o.x + o.w * 0.5, o.y);
      ctx2d.lineTo(o.x + o.w, o.y + o.h * 0.5);
      ctx2d.lineTo(o.x + o.w * 0.5, o.y + o.h);
      ctx2d.closePath();
      ctx2d.fill();
    }
  }

  /* The player's collision box is its drawn box, so ducking genuinely makes it
     shorter rather than only changing a flag. */
  function bodyHeight() {
    return G.player.duck ? G.player.h * 0.62 : G.player.h;
  }

  /* Original avatar: a rounded capsule with a visor. */
  function drawPlayer(pal) {
    var p = G.player;
    var h = bodyHeight();
    var y = p.y;

    ctx2d.fillStyle = pal.player;
    ctx2d.beginPath();
    var r = 6;
    var x = p.x, w = p.w;
    ctx2d.moveTo(x + r, y);
    ctx2d.arcTo(x + w, y, x + w, y + h, r);
    ctx2d.arcTo(x + w, y + h, x, y + h, r);
    ctx2d.arcTo(x, y + h, x, y, r);
    ctx2d.arcTo(x, y, x + w, y, r);
    ctx2d.closePath();
    ctx2d.fill();

    ctx2d.fillStyle = pal.playerDark;
    ctx2d.beginPath();
    ctx2d.arc(x + w * 0.62, y + h * 0.3, 2.1, 0, Math.PI * 2);
    ctx2d.fill();
  }

  function draw() {
    fitCanvas();
    var box = viewBox();
    var pal = palette();

    ctx2d.save();
    if (G.shake > 0 && !reducedMotion) {
      ctx2d.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawScene(box, pal);
    for (var i = 0; i < G.obstacles.length; i++) drawObstacle(G.obstacles[i], pal);

    ctx2d.fillStyle = pal.player;
    for (var k = 0; k < G.puffs.length; k++) {
      var puff = G.puffs[k];
      ctx2d.globalAlpha = Math.max(0, puff.life / puff.total);
      ctx2d.beginPath();
      ctx2d.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx2d.fill();
    }
    ctx2d.globalAlpha = 1;

    drawPlayer(pal);
    ctx2d.restore();
  }

  /* --- Simulation ---------------------------------------------------- */
  function spawn() {
    var box = viewBox();
    var roll = Math.random();
    /* Flyers only start appearing once the run has warmed up. */
    if (G.score > 60 && roll > 0.72) {
      var high = groundY() - 34 - Math.random() * 22;
      G.obstacles.push({
        x: box.w + 20, y: high, w: 20, h: 12, kind: "glide",
        vy: 0, drift: 42 + Math.random() * 26
      });
      return;
    }
    var w = 13 + Math.random() * 9;
    var h = 24 + Math.random() * 18;
    G.obstacles.push({ x: box.w + 20, y: groundY() - h, w: w, h: h, kind: "shard" });
  }

  function puff(x, y, n) {
    if (reducedMotion) n = Math.min(n, 2);
    for (var i = 0; i < n; i++) {
      G.puffs.push({
        x: x, y: y,
        vx: -40 - Math.random() * 70,
        vy: -Math.random() * 46,
        r: 1.6 + Math.random() * 2.4,
        life: 0.42, total: 0.42
      });
    }
  }

  function step(dt) {
    var box = viewBox();
    var p = G.player;
    var gy = groundY();

    /* Ramp speed, but cap it so it stays fair. */
    G.speed = Math.min(560, 250 + G.score * 1.5);
    G.dist += G.speed * dt;
    G.score += G.speed * dt * 0.06;

    /* Vertical motion, using the current (possibly crouched) box height. */
    var bodyH = bodyHeight();
    var gravity = p.duck && !p.grounded ? DUCK_FAST : GRAVITY;
    p.vy += gravity * dt;
    p.y += p.vy * dt;

    if (p.y + bodyH >= gy) {
      if (!p.grounded) puff(p.x + 4, gy - 2, 3);
      p.y = gy - bodyH;
      p.vy = 0;
      p.grounded = true;
    } else {
      p.grounded = false;
    }

    /* Spawning: gap shrinks as speed rises, never below a safe window. */
    G.spawnIn -= G.speed * dt;
    if (G.spawnIn <= 0) {
      spawn();
      var minGap = 300 + G.speed * 0.42;
      G.spawnIn = minGap + Math.random() * 260;
    }

    /* Obstacles. */
    for (var i = G.obstacles.length - 1; i >= 0; i--) {
      var o = G.obstacles[i];
      o.x -= G.speed * dt;
      if (o.kind === "glide") o.y += o.drift * dt * (Math.random() < 0.5 ? -1 : 1) * 0.02;
      if (o.x + o.w < -20) { G.obstacles.splice(i, 1); continue; }

      /* Forgiving hitboxes: inset both shapes slightly. */
      var px = p.x + 3, pw = p.w - 6;
      var py = p.y + 2;
      if (px < o.x + 3 && px + pw > o.x + 3 && py < o.y + o.h - 3 && py + bodyH > o.y + 3) {
        endRun();
        return;
      }
    }

    for (var k = G.puffs.length - 1; k >= 0; k--) {
      var q = G.puffs[k];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 120 * dt;
      if (q.life <= 0) G.puffs.splice(k, 1);
    }

    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
    updateHud();
  }

  function scheduleFrame() {
    /* Always replace rather than gate on "!G.raf": a stale handle left by a
       loop that bailed out early would otherwise block every future run. */
    if (G.raf !== null) window.cancelAnimationFrame(G.raf);
    G.raf = window.requestAnimationFrame(frame);
  }

  function frame(now) {
    if (G.mode !== "running") {
      G.raf = null;
      return;
    }
    if (!G.last) G.last = now;
    var delta = Math.min((now - G.last) / 1000, 0.25);
    G.last = now;
    G.acc += delta;

    var guard = 0;
    while (G.acc >= STEP && guard++ < 6) {
      step(STEP);
      G.acc -= STEP;
      if (G.mode !== "running") break;
    }
    draw();
    scheduleFrame();
  }

  function startRun() {
    fitCanvas();
    resetRun();
    G.mode = "running";
    G.last = 0;
    G.acc = 0;
    gameOverlay.hidden = true;
    gameLive.textContent = "Running. Score " + Math.floor(G.score);
    scheduleFrame();
    /* Park focus on the canvas so the arrow keys reach the game right away
       instead of scrolling the host page. */
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* not focusable */ }
  }

  function stopLoop() {
    if (G.raf) {
      window.cancelAnimationFrame(G.raf);
      G.raf = null;
    }
  }

  function endRun() {
    G.mode = "over";
    stopLoop();
    G.shake = reducedMotion ? 0 : 7;
    puff(G.player.x + 6, G.player.y + 8, 6);
    draw();

    var final = Math.floor(G.score);
    if (final > (settings.best || 0)) {
      settings.best = final;
      saveSettings();
      gameLive.textContent = "New best: " + final;
    } else {
      gameLive.textContent = "Score " + final;
    }
    updateHud();

    gameTitle.textContent = "Run over";
    gameSub.textContent = "You scored " + final + " · best " + Math.floor(settings.best || 0) + ".";
    gameStart.textContent = "Run again";
    gameOverlay.hidden = false;
  }

  function pauseRun() {
    if (G.mode !== "running") return;
    G.mode = "paused";
    stopLoop();
    gameTitle.textContent = "Paused";
    gameSub.textContent = "Press P or the button to carry on.";
    gameStart.textContent = "Resume";
    gameOverlay.hidden = false;
  }

  function resumeRun() {
    if (G.mode !== "paused") return;
    gameOverlay.hidden = true;
    G.mode = "running";
    G.last = 0;
    scheduleFrame();
  }

  function primaryAction() {
    if (G.mode === "running") return;
    if (G.mode === "paused") { resumeRun(); return; }
    startRun();
  }

  function jump() {
    if (G.mode !== "running") { primaryAction(); return; }
    var p = G.player;
    if (!p.grounded) return;
    p.duck = false;
    p.y = groundY() - p.h;
    p.vy = JUMP_V;
    p.grounded = false;
    puff(p.x + 6, groundY() - 2, 3);
  }

  function setDuck(on) {
    var p = G.player;
    if (G.mode !== "running") return;
    on = !!on;
    if (on === p.duck) return;
    p.duck = on;
    /* Snap to the ground when changing profile while grounded, so the box
       never ends up hovering. */
    if (p.grounded) p.y = groundY() - bodyHeight();
  }

  gameStart.addEventListener("click", primaryAction);

  var gameArea = root.querySelector(".fc-game");
  gameArea.addEventListener("mousedown", function (e) {
    if (e.target.closest("#fc-game-start")) return;
    e.preventDefault();
    jump();
  });

  /* Arrow keys are the controls: Up jumps, Down ducks, P pauses.

     Bound on the document in the capture phase rather than on #fc-root,
     because key events only reach a subtree when something inside it holds
     focus — with focus on the host page's <body>, root-level listeners never
     fire and the arrow keys would silently do nothing. Still guarded so we
     never hijack typing in the composer. */
  function onGameKey(e) {
    if (G.mode !== "running" && G.mode !== "paused") return;
    if (settings.tab !== "run" || !panel.classList.contains("is-open")) return;

    var t = e.target;
    var tag = t && t.tagName ? t.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select" || (t && t.isContentEditable)) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      jump();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDuck(true);
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (G.mode === "running") pauseRun();
      else resumeRun();
    }
  }

  document.addEventListener("keydown", onGameKey, true);
  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowDown") setDuck(false);
  });

  /* Only animate while this tab and the panel are both open. */
  function syncRunVisibility() {
    if (!runReady) return;
    var active = settings.tab === "run" && panel.classList.contains("is-open");
    if (active) {
      fitCanvas();
      if (G.mode === "running") {
        G.last = 0;
        scheduleFrame();
      } else {
        draw();
      }
    } else if (G.mode === "running") {
      pauseRun();
    }
  }

  window.addEventListener("resize", function () {
    if (settings.tab === "run") {
      fitCanvas();
      draw();
    }
  });

  updateHud();
  draw();
  /* The runner is fully wired; visibility toggles may now touch it. */
  runReady = true;

  /* ==================================================================
   * Media
   * ================================================================== */
  root.querySelector("#fc-media-list").innerHTML =
    '<div class="fc-tiles">' +
    MEDIA.map(function (m) {
      return (
        '<article class="fc-tile fc-tile--' + m.cls + '">' +
        artTile(m.cls, m.title) +
        '<span class="fc-tile-sheen"></span>' +
        '<div class="fc-tile-body">' +
        '<p class="fc-tile-count">' + m.count + " photos</p>" +
        '<h3 class="fc-tile-title">' + esc(m.title) + "</h3>" +
        '<p class="fc-tile-meta">' + esc(m.meta) + "</p>" +
        "</div>" +
        "</article>"
      );
    }).join("") +
    "</div>";

  /* ==================================================================
   * Groups
   * ================================================================== */
  root.querySelector("#fc-groups-list").innerHTML =
    '<ul class="fc-rows">' +
    GROUPS.map(function (g) {
      return (
        '<li class="fc-row">' +
        '<span class="fc-avatar fc-avatar--' + g.cls + '">' + esc(g.in) + "</span>" +
        '<span class="fc-row-main">' +
        '<span class="fc-row-top">' +
        '<span class="fc-row-title">' + esc(g.name) + "</span>" +
        '<span class="fc-row-sub">' + esc(g.members) + "</span>" +
        "</span>" +
        '<span class="fc-row-msg">' + esc(g.msg) + "</span>" +
        "</span>" +
        '<button type="button" class="fc-pill">Open</button>' +
        "</li>"
      );
    }).join("") +
    "</ul>";

  /* ==================================================================
   * Shares
   * ================================================================== */
  renderShares();

  /* ---- Toolbar actions ---------------------------------------------- */
  var searchInput = root.querySelector("#fc-share-search");
  var fileInput = root.querySelector("#fc-share-file");

  searchInput.addEventListener("input", function () {
    shareQuery = searchInput.value;
    renderShares();
  });

  /* Saves whatever page the user is currently reading. Very often the thing
     worth keeping is the article, not the video. */
  root.querySelector("#fc-share-page").addEventListener("click", function () {
    var url = window.location.href;
    if (!/^https?:/i.test(url)) {
      showToast("This page cannot be saved");
      return;
    }
    if (parseVideoUrl(url)) {
      resolveVideo(url, "share");
      return;
    }
    var host = (window.location.hostname || "Link").replace(/^www\./, "");
    addShare(
      {
        provider: host,
        title: document.title ? document.title.replace(/\s*[|\-–—]\s*[^|\-–—]{0,40}$/, "").trim() : host,
        author: "",
        page: url,
        poster: null
      },
      false
    );
  });

  /* Clipboard writes reject whenever the document is not focused, which is common
     for a widget floating over someone else's page. A file download is the
     reliable primitive here, and it hands the user something they can keep. */
  function downloadJson(filename, json) {
    var url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () {
      try { URL.revokeObjectURL(url); } catch (e) { /* already released */ }
    }, 5000);
  }

  root.querySelector("#fc-share-export").addEventListener("click", function () {
    var items = Array.isArray(settings.shares) ? settings.shares : [];
    if (!items.length) {
      showToast("Nothing to export");
      return;
    }
    var payload = {
      app: "lakbayon",
      version: 1,
      exported: new Date().toISOString(),
      shares: items.map(function (s) {
        return { title: s.title, provider: s.provider, author: s.author, page: s.page, at: s.at };
      })
    };
    var stamp = new Date().toISOString().slice(0, 10);
    downloadJson("lakbayon-shares-" + stamp + ".json", JSON.stringify(payload, null, 2));
    showToast("Exported " + payload.shares.length + " links");
  });

  root.querySelector("#fc-share-import").addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var incoming;
      try {
        incoming = JSON.parse(String(reader.result));
      } catch (e) {
        showToast("That file is not valid JSON");
        return;
      }
      var list = Array.isArray(incoming) ? incoming : incoming && incoming.shares;
      if (!Array.isArray(list)) {
        showToast("No links found in that file");
        return;
      }
      if (!Array.isArray(settings.shares)) settings.shares = seedShares();

      var added = 0;
      list.forEach(function (s) {
        if (!s || typeof s !== "object") return;
        var page = typeof s.page === "string" ? s.page : "";
        /* Skip anything already saved, matched on URL. */
        if (page && settings.shares.some(function (x) { return x.page === page; })) return;
        settings.shares.unshift({
          id: "i" + Math.random().toString(36).slice(2, 10),
          title: String(s.title || page || "Untitled").slice(0, 160),
          provider: String(s.provider || "Link").slice(0, 40),
          author: s.author ? String(s.author).slice(0, 60) : "",
          page: page,
          poster: null,
          at: typeof s.at === "number" ? s.at : Date.now(),
          stamp: "Imported",
          seeded: false
        });
        added++;
      });

      if (settings.shares.length > 40) settings.shares.length = 40;
      renderShares();
      saveSettings();
      showToast(added ? "Imported " + added + " links" : "Nothing new to import");
      fileInput.value = "";
    };
    reader.onerror = function () { showToast("Could not read that file"); };
    reader.readAsText(file);
  });

  root.querySelector("#fc-share-clear").addEventListener("click", function () {
    if (!Array.isArray(settings.shares) || !settings.shares.length) {
      showToast("Nothing to clear");
      return;
    }
    settings.shares = [];
    renderShares();
    saveSettings();
    showToast("Cleared all saved links");
  });

  sharesWrap.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-remove]");
    if (rm) {
      e.stopPropagation();
      removeShare(rm.dataset.remove);
      showToast("Removed");
      return;
    }
    var row = e.target.closest("[data-page]");
    var page = row && row.dataset.page;
    if (page) window.open(page, "_blank", "noopener");
  });

  /* ==================================================================
   * Tools
   * ================================================================== */
  root.querySelector("#fc-tools-list").innerHTML =
    '<div class="fc-tools">' +
    TOOLS.map(function (t) {
      var control =
        t.type === "toggle"
          ? '<span class="fc-switch' + (t.on ? " is-on" : "") + '" role="switch" aria-checked="' + (t.on ? "true" : "false") + '"><span class="fc-switch-knob"></span></span>'
          : '<span class="fc-run">Run</span>';
      return (
        '<button type="button" class="fc-tool" data-tool="' + t.id + '" data-kind="' + t.type + '" ' +
        'aria-pressed="' + (t.type === "toggle" ? (t.on ? "true" : "false") : "false") + '">' +
        '<span class="fc-tool-ic">' + I[t.ico] + "</span>" +
        '<span class="fc-tool-text">' +
        '<span class="fc-tool-label">' + esc(t.label) + "</span>" +
        '<span class="fc-tool-desc">' + esc(t.desc) + "</span>" +
        "</span>" +
        control +
        "</button>"
      );
    }).join("") +
    "</div>";

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.t);
    showToast.t = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 1900);
  }

  function setToggle(id, on) {
    settings[id] = on;
    if (id === "compact") panel.classList.toggle("is-compact", on);
    if (id === "contrast") root.classList.toggle("is-contrast", on);
    saveSettings();
  }

  function resetAll() {
    ["compact", "contrast", "notify"].forEach(function (id) {
      settings[id] = false;
      syncTool(id, false);
    });
    settings.enter = true;
    settings.theme = "auto";
    settings.tab = "chat";
    panel.classList.remove("is-compact");
    root.classList.remove("is-contrast");
    applyTheme();
    syncThemeButtons();
    selectTab("chat", false);
    saveSettings();
  }

  function syncTool(id, on) {
    var btn = root.querySelector('.fc-tool[data-tool="' + id + '"]');
    if (!btn) return;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    var sw = btn.querySelector(".fc-switch");
    if (sw) {
      sw.classList.toggle("is-on", on);
      sw.setAttribute("aria-checked", on ? "true" : "false");
    }
  }

  root.querySelector("#fc-tools-list").addEventListener("click", function (e) {
    var btn = e.target.closest(".fc-tool");
    if (!btn) return;
    var id = btn.dataset.tool;
    if (btn.dataset.kind === "toggle") {
      var on = btn.getAttribute("aria-pressed") !== "true";
      syncTool(id, on);
      setToggle(id, on);
      showToast(btn.querySelector(".fc-tool-label").textContent + ": " + (on ? "on" : "off"));
      return;
    }
    if (id === "clear") {
      started = false;
      clearAttachment();
      renderWelcome();
      showToast("Conversation cleared");
    } else if (id === "reset") {
      resetAll();
      showToast("Settings restored");
    }
  });

  /* ==================================================================
   * Global events
   * ================================================================== */
  fab.addEventListener("click", function () {
    setOpen(true);
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false);
    fab.focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
  });

  // Keep the panel usable if the host page re-renders <body>.
  new MutationObserver(function () {
    if (!document.body.contains(root)) document.body.appendChild(root);
  }).observe(document.body, { childList: true });
})();