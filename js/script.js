(() => {
  "use strict";

  const config = window.WEDDING_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const setText = (id, value) => { const el = $(id); if (el && value != null) el.textContent = value; };

  const cover = $("cover");
  const audio = $("bgMusic");
  const soundButton = $("soundToggle");
  const scenes = $$(".scene");
  // Petals, seal highlight and reveals always run. Many phones report "reduced motion" when battery saver /
  // "remove animations" is on, which used to switch these off.
  const reducedMotion = false;
  const root = document.documentElement;
  const isSmall = window.matchMedia ? window.matchMedia("(max-width: 600px)").matches : true;
  let opened = false;
  let wantMusic = false;

  /* ------------------------------------------------------------------
     Names / venue text from config
  ------------------------------------------------------------------ */
  const first = config.couple?.firstName || "Madhu";
  const second = config.couple?.secondName || "Ashwini";
  document.title = `${first} & ${second} — Wedding Invitation`;
  $$(".couple-name").forEach(el => { el.innerHTML = `${first} <i>&amp;</i> ${second}`; });
  $$(".gold-heading").forEach(el => { if (el.textContent.includes("Madhu")) el.innerHTML = `${first} <i>&amp;</i> ${second}`; });

  const venue = config.sharedVenue || {};
  setText("sharedVenueAddress", venue.address || "Add the full venue address in js/config.js.");
  const venueHeading = document.querySelector(".shared-map-card h3");
  if (venueHeading && venue.name) venueHeading.textContent = venue.name;
  const mapLink = $("sharedMapLink");
  const validMap = /^https:\/\/(maps\.app\.goo\.gl\/|((www\.)?google\.[^/]+\/maps\/))/i.test(venue.mapsUrl || "");
  if (mapLink) {
    mapLink.href = validMap ? venue.mapsUrl : "#";
    mapLink.setAttribute("aria-disabled", String(!validMap));
    mapLink.addEventListener("click", e => { if (!validMap) e.preventDefault(); });
  }

  /* ------------------------------------------------------------------
     Small helpers: toast + haptics
  ------------------------------------------------------------------ */
  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }
  const buzz = (pattern = 15) => { try { navigator.vibrate && navigator.vibrate(pattern); } catch (_) { /* ignore */ } };

  /* ------------------------------------------------------------------
     Smooth scrolling. Driven by JS so it works on every phone, and is
     cancelled instantly if the guest touches the screen.
  ------------------------------------------------------------------ */
  let scrollRaf = 0;
  const cancelScroll = () => { if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = 0; } };
  ["touchstart", "wheel", "pointerdown", "keydown"].forEach(ev =>
    window.addEventListener(ev, cancelScroll, { passive: true }));

  function smoothScrollTo(targetY, duration = 1100) {
    cancelScroll();
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    if (reducedMotion) { window.scrollTo(0, targetY); return; }
    const t0 = performance.now();
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = now => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, startY + dist * ease(t));
      scrollRaf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    scrollRaf = requestAnimationFrame(step);
  }
  const scrollToScene = (el, duration) => {
    if (el) smoothScrollTo(el.getBoundingClientRect().top + window.scrollY, duration);
  };

  /* ------------------------------------------------------------------
     Falling petals + twinkles. Built once per page; CSS only animates
     them while that page is on screen (cheap on phones).
  ------------------------------------------------------------------ */
  function buildFx(section, petalCount, sparkleCount) {
    if (!section || reducedMotion) return;
    let petals = section.querySelector(".petal-layer");
    let sparkles = section.querySelector(".sparkle-layer");
    if (!petals) { petals = document.createElement("div"); petals.className = "petal-layer"; petals.setAttribute("aria-hidden", "true"); section.appendChild(petals); }
    if (!sparkles) { sparkles = document.createElement("div"); sparkles.className = "sparkle-layer"; sparkles.setAttribute("aria-hidden", "true"); section.appendChild(sparkles); }
    petals.replaceChildren(); sparkles.replaceChildren();
    petals.style.setProperty("--fall", `${section.offsetHeight + 40}px`);
    const pf = document.createDocumentFragment(), sf = document.createDocumentFragment();
    for (let i = 0; i < petalCount; i++) {
      const p = document.createElement("span");
      p.className = "petal" + (i % 5 === 0 ? " gold" : "");
      p.style.setProperty("--x", `${Math.random() * 96}%`);
      p.style.setProperty("--w", `${(isSmall ? 8 : 10) + Math.random() * 7}px`);
      p.style.setProperty("--rot", `${Math.random() * 360}deg`);
      p.style.setProperty("--dur", `${8 + Math.random() * 5}s`);
      p.style.setProperty("--delay", `${-Math.random() * 10}s`);
      p.style.setProperty("--drift", `${-60 + Math.random() * 120}px`);
      pf.appendChild(p);
    }
    for (let i = 0; i < sparkleCount; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.style.setProperty("--x", `${Math.random() * 96}%`);
      s.style.setProperty("--y", `${4 + Math.random() * 90}%`);
      s.style.setProperty("--s", `${6 + Math.random() * 8}px`);
      s.style.setProperty("--dur", `${1.4 + Math.random() * 1.6}s`);
      s.style.setProperty("--delay", `${-Math.random() * 3}s`);
      sf.appendChild(s);
    }
    petals.appendChild(pf); sparkles.appendChild(sf);
  }
  scenes.forEach(sc => {
    if (sc.id === "cover") buildFx(sc, isSmall ? 8 : 12, isSmall ? 7 : 10);
    else buildFx(sc, isSmall ? 7 : 11, isSmall ? 6 : 9);
  });

  const updateFall = () => scenes.forEach(sc => {
    const l = sc.querySelector(".petal-layer"); if (l) l.style.setProperty("--fall", `${sc.offsetHeight + 40}px`);
  });
  window.addEventListener("resize", updateFall, { passive: true });
  window.addEventListener("load", updateFall);

  /* Floral burst from the wax seal */
  function sealBurst() {
    const seal = $("openInvite");
    const wrap = document.querySelector(".envelope-wrap");
    if (!seal || !wrap || reducedMotion) return;
    const old = wrap.querySelector(".seal-burst"); if (old) old.remove();
    const layer = document.createElement("div"); layer.className = "seal-burst";
    const sr = seal.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    layer.style.left = `${sr.left + sr.width / 2 - wr.left}px`;
    layer.style.top = `${sr.top + sr.height / 2 - wr.top}px`;
    wrap.appendChild(layer);
    const glyphs = ["✿", "❀", "✽"];
    const n = isSmall ? 28 : 36;
    for (let i = 0; i < n; i++) {
      const bit = document.createElement("span");
      const spark = i % 4 === 0;
      bit.className = spark ? "burst-spark" : "burst-petal";
      bit.textContent = spark ? (i % 8 === 0 ? "✦" : "✧") : glyphs[i % 3];
      const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.2;
      const dist = 70 + Math.random() * 120;
      bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      bit.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      bit.style.setProperty("--rot", `${Math.random() * 540 - 270}deg`);
      bit.style.setProperty("--delay", `${Math.random() * 140}ms`);
      bit.style.setProperty("--size", `${16 + Math.random() * 16}px`);
      layer.appendChild(bit);
    }
    setTimeout(() => layer.remove(), 2000);
  }

  /* ------------------------------------------------------------------
     Music
  ------------------------------------------------------------------ */
  function fadeVolume(to, ms = 1500) {
    if (!audio) return;
    const from = audio.volume, t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function markPlaying(on) {
    if (!soundButton) return;
    soundButton.classList.toggle("is-playing", on);
    setText("soundToggleLabel", on ? "Music on" : "Music off");
  }
  async function startMusicFromGesture() {
    if (!audio) return;
    if (!audio.getAttribute("src") && config.musicFile) audio.src = config.musicFile;
    audio.volume = 0.05;
    audio.loop = true;
    try {
      const p = audio.play();               // must be called inside the tap handler (iOS / Android policy)
      if (p && typeof p.then === "function") await p;
      wantMusic = true; markPlaying(true); fadeVolume(0.5, 2200);
    } catch (err) {
      markPlaying(false); setText("soundToggleLabel", "Tap for music");
      console.warn("Background music could not start:", err);
    }
  }
  if (soundButton && audio) {
    soundButton.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          if (!audio.getAttribute("src") && config.musicFile) audio.src = config.musicFile;
          audio.volume = 0.5; await audio.play(); wantMusic = true; markPlaying(true);
        } catch (e) { setText("soundToggleLabel", "Unavailable"); }
      } else { audio.pause(); wantMusic = false; markPlaying(false); }
    });
    audio.addEventListener("error", () => setText("soundToggleLabel", "Music unavailable"));
    // Pause when the guest leaves the app/tab, resume when they come back.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (!audio.paused) audio.pause(); }
      else if (wantMusic) audio.play().catch(() => {});
    });
  }

  /* ------------------------------------------------------------------
     Open the invitation
  ------------------------------------------------------------------ */
  /* Scroll stays locked until the seal is tapped; trying to scroll (or tapping elsewhere) highlights the seal. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  const setLocked = on => root.classList.toggle("locked", on);
  let attnTimer = 0, lastNudge = 0;
  function nudgeSeal() {
    if (opened || !cover) return;
    cover.classList.remove("attention"); void cover.offsetWidth; cover.classList.add("attention");
    buzz(12);
    clearTimeout(attnTimer);
    attnTimer = setTimeout(() => cover.classList.remove("attention"), 1300);
  }
  function guard(e) {
    if (opened || !root.classList.contains("locked")) return;
    if (e.cancelable) e.preventDefault();
    const now = performance.now();
    if (now - lastNudge > 700) { lastNudge = now; nudgeSeal(); }
  }
  document.addEventListener("touchmove", guard, { passive: false });
  document.addEventListener("wheel", guard, { passive: false });
  document.addEventListener("keydown", e => {
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "End", "Home", " "].includes(e.key)) return;
    if (e.target.closest && e.target.closest("button, a")) return;
    guard(e);
  });
  cover?.addEventListener("click", e => { if (!opened && !e.target.closest("#openInvite")) nudgeSeal(); });

  function openInvitation() {
    if (opened) return;
    opened = true; passedCover = false;
    setLocked(false);
    buzz(25);
    startMusicFromGesture();
    sealBurst();
    cover?.classList.add("opening");
    document.body.classList.add("opened");
    setTimeout(() => scrollToScene($("family"), 1300), reducedMotion ? 150 : 1250);
  }
  $("openInvite")?.addEventListener("click", openInvitation);

  /* ------------------------------------------------------------------
     Page dots + "next" arrows
  ------------------------------------------------------------------ */
  const dotsNav = $("pageDots");
  const dots = [];
  if (dotsNav) {
    scenes.forEach((sc, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", i === 0 ? "Go to cover" : `Go to page ${i + 1}`);
      b.addEventListener("click", () => scrollToScene(sc, 900));
      dotsNav.appendChild(b); dots.push(b);
    });
  }
  scenes.forEach((sc, i) => {
    if (i === 0 || i === scenes.length - 1) return;
    const cue = document.createElement("button");
    cue.className = "next-cue"; cue.type = "button"; cue.setAttribute("aria-label", "Next page"); cue.textContent = "⌄";
    cue.addEventListener("click", () => scrollToScene(scenes[i + 1], 1000));
    sc.appendChild(cue);
  });

  /* ------------------------------------------------------------------
     Scroll: progress bar, active page dot, re-close the cover at the top
  ------------------------------------------------------------------ */
  const bar = $("progressBar");
  let ticking = false, activeIdx = -1, passedCover = false;
  function onScroll() {
    ticking = false;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max))})`;
    let idx = 0;
    for (let i = 0; i < scenes.length; i++) {
      const r = scenes[i].getBoundingClientRect();
      if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) { idx = i; break; }
    }
    if (idx !== activeIdx) { activeIdx = idx; dots.forEach((d, i) => d.classList.toggle("active", i === idx)); }
    if (!opened) {
      if (window.scrollY <= 2) setLocked(true);          // back at the cover with a closed envelope
      else if (root.classList.contains("locked")) setLocked(false);
    }
    if (opened && cover) {
      const bottom = cover.getBoundingClientRect().bottom;
      if (bottom < vh * 0.3) passedCover = true;
      else if (passedCover && bottom > vh * 0.6) {           // guest scrolled back up: envelope can be opened again
        cover.classList.remove("opening"); opened = false; passedCover = false;
      }
    }
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Reveals (staggered + reversible) and per-page "in-view" state
  ------------------------------------------------------------------ */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting)
        .sort((a, b) => reveals.indexOf(a.target) - reveals.indexOf(b.target))
        .forEach((e, i) => {
          e.target.style.setProperty("--d", `${Math.min(i * 110, 700)}ms`);   // natural top-to-bottom stagger
          e.target.classList.add("visible");
        });
      entries.filter(e => !e.isIntersecting).forEach(e => e.target.classList.remove("visible"));
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => revealIO.observe(el));

    const sceneIO = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle("in-view", e.isIntersecting));
    }, { threshold: 0.05 });
    scenes.forEach(sc => sceneIO.observe(sc));
  } else {
    reveals.forEach(el => el.classList.add("visible"));
    scenes.forEach(sc => sc.classList.add("in-view"));
  }

  /* ------------------------------------------------------------------
     Countdown (digits animate when they change)
  ------------------------------------------------------------------ */
  const target = new Date(config.weddingDateTime || "2026-11-20T09:20:00+05:30").getTime();
  const prev = {};
  function setDigit(id, val) {
    const el = $(id);
    if (!el || prev[id] === val) return;
    el.textContent = val;
    if (prev[id] !== undefined && !reducedMotion) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
    prev[id] = val;
  }
  function updateCountdown() {
    const left = target - Date.now();
    let ms = Math.max(0, left);
    const d = Math.floor(ms / 86400000); ms %= 86400000;
    const h = Math.floor(ms / 3600000); ms %= 3600000;
    const m = Math.floor(ms / 60000); ms %= 60000;
    const s = Math.floor(ms / 1000);
    setDigit("days", String(d).padStart(2, "0")); setDigit("hours", String(h).padStart(2, "0"));
    setDigit("minutes", String(m).padStart(2, "0")); setDigit("seconds", String(s).padStart(2, "0"));
    if (left <= 0) setText2(".countdown-sub", "Today, we begin our forever");
  }
  function setText2(sel, txt) { const el = document.querySelector(sel); if (el) el.textContent = txt; }
  updateCountdown();
  let cdTimer = setInterval(updateCountdown, 1000);
  document.addEventListener("visibilitychange", () => {
    clearInterval(cdTimer);
    if (!document.hidden) { updateCountdown(); cdTimer = setInterval(updateCountdown, 1000); }
  });

  /* ------------------------------------------------------------------
     Celebration burst (used when the scratch card is revealed)
  ------------------------------------------------------------------ */
  function confettiFrom(el) {
    if (reducedMotion) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span");
      s.className = "tap-spark";
      s.style.left = `${cx}px`; s.style.top = `${cy}px`;
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 110;
      s.style.setProperty("--tx", `${Math.cos(a) * d}px`);
      s.style.setProperty("--ty", `${Math.sin(a) * d - 20}px`);
      s.style.width = s.style.height = `${0.6 + Math.random() * 0.8}rem`;
      s.style.background = i % 3 === 0 ? "#f4b6bd" : "#ffe9a8";
      s.style.animationDuration = `${0.7 + Math.random() * 0.6}s`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  }

  /* ------------------------------------------------------------------
     Scratch card
  ------------------------------------------------------------------ */
  const canvas = $("scratchCanvas"), card = $("scratchCard"), message = $("scratchMessage"), hint = $("scratchHint");
  if (canvas && card && message) {
    message.textContent = config.hiddenMessage || "Your love and blessings are the most precious gifts. With love, Madhu & Ashwini.";
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let drawing = false, revealed = false, last = null, lastCheck = 0, brush = 22;

    function paintSurface() {
      const cs = getComputedStyle(canvas);
      const inset = parseFloat(cs.left) || 0, insetT = parseFloat(cs.top) || 0;
      const w = Math.max(1, card.clientWidth - 2 * inset);
      const h = Math.max(1, card.clientHeight - 2 * insetT);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      brush = Math.max(18, Math.min(26, h * 0.17));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#f0dfb6"); g.addColorStop(0.45, "#b88d4e"); g.addColorStop(1, "#f5e6c5");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,248,220,.45)"; ctx.lineWidth = 1;
      for (let y = 8; y < h; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff5dc";
      ctx.font = "20px Georgia"; ctx.fillText("✧", w / 2, h / 2 - h * 0.2);
      ctx.font = "17px Georgia"; ctx.fillText("❧", w / 2, h / 2 + h * 0.22);
    }
    const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function strokeTo(p) {
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = brush * 2; ctx.beginPath();
      if (last) { ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); } else { ctx.arc(p.x, p.y, brush, 0, Math.PI * 2); }
      ctx.stroke(); ctx.restore(); last = p;
    }
    function finishReveal() {
      revealed = true; drawing = false;
      card.classList.add("scratched");
      canvas.style.opacity = "0"; canvas.style.pointerEvents = "none";
      if (hint) hint.textContent = "MESSAGE REVEALED";
      buzz([20, 40, 20]);
      confettiFrom(card);
      setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 520);
    }
    function checkReveal(force) {
      if (revealed) return;
      const now = performance.now();
      if (!force && now - lastCheck < 260) return;      // throttled: cheap while the finger is moving
      lastCheck = now;
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < px.length; i += 64) { total++; if (px[i] < 70) clear++; }
      if (clear / total > 0.38) finishReveal();
    }
    canvas.addEventListener("pointerdown", e => {
      if (revealed) return;
      drawing = true; last = null; card.classList.add("scratching");
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      strokeTo(pt(e)); e.preventDefault();
    });
    canvas.addEventListener("pointermove", e => {
      if (!drawing || revealed) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      (evs.length ? evs : [e]).forEach(ev => strokeTo(pt(ev)));
      checkReveal(false); e.preventDefault();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(n =>
      canvas.addEventListener(n, () => { if (!drawing) return; drawing = false; last = null; checkReveal(true); }));

    paintSurface();
    let lastW = card.clientWidth;
    const repaint = () => { if (revealed) return; if (Math.abs(card.clientWidth - lastW) > 1) { lastW = card.clientWidth; paintSurface(); } };
    if ("ResizeObserver" in window) new ResizeObserver(repaint).observe(card); else window.addEventListener("resize", repaint);
  }

  /* ------------------------------------------------------------------
     Tap sparkles (light and capped)
  ------------------------------------------------------------------ */
  if (!reducedMotion) {
    let lastTap = 0, alive = 0;
    document.addEventListener("pointerdown", e => {
      if (e.target.closest && e.target.closest("#scratchCanvas, button, a")) return;
      const now = performance.now();
      if (now - lastTap < 180 || alive > 18) return;
      lastTap = now;
      for (let i = 0; i < 5; i++) {
        const s = document.createElement("span"); s.className = "tap-spark";
        s.style.left = `${e.clientX}px`; s.style.top = `${e.clientY}px`;
        const a = (Math.PI * 2 * i) / 5 + Math.random(), d = 22 + Math.random() * 26;
        s.style.setProperty("--tx", `${Math.cos(a) * d}px`); s.style.setProperty("--ty", `${Math.sin(a) * d}px`);
        alive++; document.body.appendChild(s);
        setTimeout(() => { s.remove(); alive--; }, 850);
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Venue actions: add to calendar, copy address, share on WhatsApp
  ------------------------------------------------------------------ */
  const icsStamp = d => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const icsEsc = t => String(t).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  function downloadIcs(key) {
    const ev = config.events && config.events[key]; if (!ev) return;
    const loc = [venue.name, venue.address].filter(Boolean).join(", ");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${key}-${icsStamp(ev.start)}@wedding-invitation`, `DTSTAMP:${icsStamp(Date.now())}`,
      `DTSTART:${icsStamp(ev.start)}`, `DTEND:${icsStamp(ev.end)}`,
      `SUMMARY:${icsEsc(ev.title)}`, `LOCATION:${icsEsc(loc)}`,
      `DESCRIPTION:${icsEsc(validMap ? "Directions: " + venue.mapsUrl : "With love, " + first + " & " + second)}`,
      "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:Wedding celebration today", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${key}-${first}-${second}.ics`.toLowerCase();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Open the downloaded file to save it to your calendar");
  }
  $$("[data-cal]").forEach(b => b.addEventListener("click", () => { buzz(); downloadIcs(b.dataset.cal); }));

  $("copyAddress")?.addEventListener("click", async () => {
    const text = [venue.name, venue.address].filter(Boolean).join(", ");
    buzz();
    try { await navigator.clipboard.writeText(text); toast("Venue address copied"); }
    catch (_) {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Venue address copied"); } catch (e) { toast("Please copy the address manually"); }
      ta.remove();
    }
  });

  const wa = $("shareWhatsapp");
  if (wa) {
    const msg = `${config.shareMessage || "You are warmly invited to our wedding."}\n${location.href.split("#")[0]}`;
    wa.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }
})();
