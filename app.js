/* ===== Soul Manual — zen layer: EFT tapping sessions, solar plexus breathing, meditation timer, PWA ===== */
(function () {
  'use strict';

  /* ---------- sound ---------- */
  var LSK = 'soulzen-sound';
  var soundOn = localStorage.getItem(LSK) !== 'off';
  var AC = null;
  function ac() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tick() {
    if (!soundOn) return;
    var a = ac(); if (!a) return;
    var t = a.currentTime;
    var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.07);
    f.type = 'lowpass'; f.frequency.value = 600;
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(f); f.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + 0.12);
  }
  function bell(delay, freq, vol, dur) {
    if (!soundOn) return;
    var a = ac(); if (!a) return;
    var t = a.currentTime + delay;
    [1, 2.76, 5.4].forEach(function (h, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = freq * h;
      var v = vol / (i * 2 + 1);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }
  function chimeStart() { bell(0, 523.25, 0.12, 2.4); }
  function chimeEnd() { bell(0, 523.25, 0.12, 2.6); bell(1.3, 659.25, 0.1, 2.6); bell(2.6, 783.99, 0.08, 3.2); }
  function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

  /* ---------- wake lock ---------- */
  var wl = null, wantLock = false;
  function lockScreen() {
    wantLock = true;
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request('screen').then(function (l) { wl = l; }).catch(function () {});
    }
  }
  function unlockScreen() { wantLock = false; if (wl) { try { wl.release(); } catch (e) {} wl = null; } }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && wantLock) lockScreen();
  });

  /* ---------- session bookkeeping ---------- */
  var S = null;
  function stopSession() {
    if (!S) return;
    S.timers.forEach(clearTimeout); S.intervals.forEach(clearInterval);
    S = null;
  }
  function newSession() { stopSession(); S = { timers: [], intervals: [], paused: false }; return S; }
  function after(ms, fn) { if (!S) return; var id = setTimeout(fn, ms); S.timers.push(id); return id; }
  function every(ms, fn) { if (!S) return; var id = setInterval(fn, ms); S.intervals.push(id); return id; }
  function clearBeats() { if (!S) return; S.intervals.forEach(clearInterval); S.intervals = []; }

  /* ---------- overlay skeleton ---------- */
  var ov = null, Z = {};
  function buildOverlay() {
    if (ov) return;
    ov = document.createElement('div');
    ov.className = 'zen-overlay';
    ov.innerHTML =
      '<div class="zen-bg"><div class="zen-blob b1"></div><div class="zen-blob b2"></div><div class="zen-blob b3"></div><div class="zen-grain"></div></div>' +
      '<div class="zen-top">' +
        '<button class="zen-iconbtn" id="zClose" aria-label="Close">&#10005;</button>' +
        '<div class="zen-kicker" id="zKicker"></div>' +
        '<div class="zen-top-group">' +
          '<button class="zen-iconbtn" id="zRead" style="display:none" aria-label="Read text">&#9776;</button>' +
          '<button class="zen-iconbtn" id="zSound" aria-label="Sound">&#9834;</button>' +
        '</div>' +
      '</div>' +
      '<div class="zen-stage">' +
        '<div class="zen-point" id="zPoint"></div>' +
        '<div class="zen-orb-wrap">' +
          '<svg class="zen-svgring" id="zRingSvg" viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="48.5"/><circle class="fill" id="zRingFill" cx="50" cy="50" r="48.5"/></svg>' +
          '<div class="zen-ring"></div>' +
          '<div class="zen-echo" id="zEcho"></div>' +
          '<div class="zen-orb" id="zOrb"><span class="zen-orb-label" id="zOrbLabel"></span></div>' +
        '</div>' +
        '<div class="zen-phrase" id="zPhrase"></div>' +
        '<div class="zen-count" id="zCount"></div>' +
        '<div class="zen-sub" id="zSub"></div>' +
        '<div class="zen-chips" id="zChips"></div>' +
        '<div class="zen-dots" id="zDots"></div>' +
      '</div>' +
      '<div class="zen-bottom"><div class="zen-controls" id="zCtls"></div><div class="zen-hint" id="zHint"></div></div>';
    document.body.appendChild(ov);
    ['zClose','zKicker','zRead','zSound','zPoint','zRingSvg','zRingFill','zEcho','zOrb','zOrbLabel','zPhrase','zCount','zSub','zChips','zDots','zCtls','zHint'].forEach(function (id) { Z[id] = ov.querySelector('#' + id); });
    Z.zClose.onclick = closeOverlay;
    Z.zSound.onclick = function () {
      soundOn = !soundOn;
      localStorage.setItem(LSK, soundOn ? 'on' : 'off');
      Z.zSound.style.opacity = soundOn ? '1' : '0.35';
      if (soundOn) tick();
    };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) closeOverlay(); });
  }
  function setVars(c1, c2) {
    ov.style.setProperty('--zen-c1', c1);
    ov.style.setProperty('--zen-c2', c2 || '#6B5B8A');
    ov.style.setProperty('--zen-hi', lighten(c1));
    ov.style.setProperty('--zen-glow', hexA(c1, 0.38));
  }
  function hexA(h, a) {
    var n = parseInt(h.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function lighten(h) {
    var n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return Math.min(255, Math.round(v + (255 - v) * 0.55)); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function resetSlots() {
    Z.zPoint.textContent = ''; Z.zPhrase.innerHTML = ''; Z.zSub.innerHTML = '';
    Z.zCount.style.display = 'none'; Z.zChips.style.display = 'none'; Z.zChips.innerHTML = '';
    Z.zDots.innerHTML = ''; Z.zCtls.innerHTML = ''; Z.zHint.textContent = '';
    Z.zRingSvg.style.display = 'none'; Z.zRead.style.display = 'none';
    Z.zOrbLabel.textContent = '';
    Z.zOrb.className = 'zen-orb'; Z.zOrb.style.transition = ''; Z.zOrb.style.transform = 'scale(1)';
    Z.zSound.style.opacity = soundOn ? '1' : '0.35';
  }
  function openOverlay(c1, c2) {
    buildOverlay(); setVars(c1, c2); resetSlots();
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    lockScreen();
  }
  function closeOverlay() {
    stopSession(); unlockScreen();
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  }

  function ctlBtn(html, cls, fn) {
    var b = document.createElement('button');
    b.className = cls; b.innerHTML = html; b.onclick = fn;
    Z.zCtls.appendChild(b); return b;
  }

  /* ================================================================
     EFT — guided visual tapping session (Endel-style)
     ================================================================ */
  var POINTS = {};
  function indexPoints() {
    if (typeof EFT === 'undefined' || Object.keys(POINTS).length) return;
    EFT.points.forEach(function (p) {
      var m = p.name.match(/\(([A-Z]+)\)/);
      if (m) POINTS[m[1]] = { name: p.name.replace(/\s*\([^)]*\)/, ''), location: p.location };
    });
  }
  function readMs(text) {
    var w = String(text).trim().split(/\s+/).length;
    return Math.max(5200, Math.min(13000, w * 480));
  }
  function splitSetup(t) { return t.split(/\s+(?=Even though)/); }

  var BEAT_MS = 620;

  function openTap(idx) {
    indexPoints();
    var seq = EFT.sequences[idx];
    if (!seq) return;
    openOverlay(seq.color || '#C4A265');
    Z.zKicker.textContent = 'EFT · GUIDED TAPPING';

    var steps = [];
    splitSetup(seq.setup).forEach(function (st) {
      steps.push({ kind: 'beat', abbr: 'KC', kicker: 'Setup · Karate Chop', phrase: st, loc: POINTS.KC ? POINTS.KC.location : '', dur: readMs(st) });
    });
    var firstRound = steps.length;
    seq.rounds.forEach(function (r) {
      var p = POINTS[r.point] || { name: r.point, location: '' };
      steps.push({ kind: 'beat', abbr: r.point, kicker: p.name, phrase: r.phrase, loc: p.location, dur: readMs(r.phrase) });
    });
    steps.push({ kind: 'breath' });
    steps.push({ kind: 'closing', text: seq.closing.replace(/^Close with:\s*['"]?/i, '').replace(/['"]$/, '') });

    // progress dots for beat steps
    var beatSteps = steps.filter(function (s) { return s.kind === 'beat'; }).length;
    Z.zDots.innerHTML = '';
    for (var d = 0; d < beatSteps; d++) {
      var dot = document.createElement('div'); dot.className = 'zen-dot'; Z.zDots.appendChild(dot);
    }
    var dots = Z.zDots.children;

    var sess = newSession();
    var cur = -1, stepStart = 0, stepRemain = 0;

    function markDots(i) {
      for (var k = 0; k < dots.length; k++) dots[k].className = 'zen-dot' + (k < i ? ' done' : k === i ? ' now' : '');
    }
    function beat() {
      Z.zOrb.classList.add('beat');
      Z.zEcho.classList.remove('go'); void Z.zEcho.offsetWidth; Z.zEcho.classList.add('go');
      tick(); buzz(18);
      after(190, function () { Z.zOrb.classList.remove('beat'); });
    }
    function startBeats() { beat(); every(BEAT_MS, beat); }

    function showIntro() {
      Z.zOrb.classList.add('tapmode');
      Z.zPhrase.innerHTML = '<em>' + seq.icon + '</em>&nbsp; ' + seq.title;
      Z.zSub.textContent = 'Find the feeling and rate it 0–10. Then tap each point along with the pulse, speaking the phrase aloud.';
      Z.zCtls.innerHTML = '';
      ctlBtn('Begin', 'zen-btn', function () { ac(); chimeStart(); goTo(0); });
      Z.zHint.textContent = 'setup · 8 points · breath · closing';
    }

    function fadeSwap(fn) {
      Z.zPhrase.classList.add('dim'); Z.zSub.classList.add('dim');
      after(320, function () { fn(); Z.zPhrase.classList.remove('dim'); Z.zSub.classList.remove('dim'); });
    }

    function stdControls() {
      Z.zCtls.innerHTML = '';
      ctlBtn('&#9664;', 'zen-ctl', function () { if (cur > 0) goTo(cur - 1); });
      var pp = ctlBtn('&#10073;&#10073;', 'zen-ctl main', function () {
        if (!S) return;
        if (S.paused) { // resume
          S.paused = false; pp.innerHTML = '&#10073;&#10073;'; Z.zHint.textContent = 'tap along with the pulse';
          startBeats(); stepStart = Date.now();
          after(stepRemain, advance);
        } else {
          S.paused = true; pp.innerHTML = '&#9654;'; Z.zHint.textContent = 'paused';
          stepRemain = Math.max(800, stepRemain - (Date.now() - stepStart));
          S.timers.forEach(clearTimeout); S.timers = []; clearBeats();
          Z.zOrb.classList.remove('beat');
        }
      });
      ctlBtn('&#9654;&#9654;', 'zen-ctl', function () { goTo(cur + 1); });
      Z.zHint.textContent = 'tap along with the pulse';
    }

    function advance() { goTo(cur + 1); }

    function goTo(i) {
      if (!S) return;
      S.timers.forEach(clearTimeout); S.timers = []; clearBeats();
      S.paused = false;
      cur = i;
      var st = steps[i];
      if (!st) { finish(); return; }

      if (st.kind === 'beat') {
        markDots(i);
        stdControls();
        fadeSwap(function () {
          Z.zPoint.textContent = st.kicker;
          Z.zOrbLabel.textContent = st.abbr;
          Z.zPhrase.textContent = '“' + st.phrase + '”';
          Z.zSub.textContent = st.loc;
        });
        startBeats();
        stepStart = Date.now(); stepRemain = st.dur;
        after(st.dur, advance);
      } else if (st.kind === 'breath') {
        markDots(dots.length);
        Z.zCtls.innerHTML = ''; Z.zHint.textContent = '';
        Z.zOrbLabel.textContent = '';
        Z.zPoint.textContent = 'Integration';
        fadeSwap(function () { Z.zPhrase.textContent = 'Take a deep breath'; Z.zSub.textContent = 'Let it move through you. Check the intensity now — 0 to 10.'; });
        buzz(35);
        Z.zOrb.classList.remove('tapmode');
        Z.zOrb.style.transition = 'transform 4s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1.3)';
        after(4200, function () { Z.zOrb.style.transition = 'transform 6s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1)'; });
        after(11000, advance);
      } else if (st.kind === 'closing') {
        Z.zPoint.textContent = 'Closing';
        Z.zOrb.classList.remove('tapmode');
        idleBreathe();
        fadeSwap(function () {
          Z.zPhrase.textContent = st.text;
          Z.zPhrase.style.fontSize = 'clamp(17px,4.6vw,22px)';
          Z.zSub.textContent = 'Speak it slowly. If the charge is still above a 3, run another round.';
        });
        Z.zCtls.innerHTML = '';
        ctlBtn('Another round', 'zen-btn ghost', function () { Z.zPhrase.style.fontSize = ''; Z.zOrb.classList.add('tapmode'); goTo(firstRound); });
        ctlBtn('Complete', 'zen-btn', finish);
        Z.zHint.textContent = '';
      }
    }

    function idleBreathe() {
      function inhale() { if (!S) return; Z.zOrb.style.transition = 'transform 4s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1.12)'; after(4000, exhale); }
      function exhale() { if (!S) return; Z.zOrb.style.transition = 'transform 6s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1)'; after(6000, inhale); }
      inhale();
    }

    function finish() {
      if (!S) return;
      S.timers.forEach(clearTimeout); S.timers = []; clearBeats();
      chimeEnd(); buzz([40, 80, 40]);
      Z.zPoint.textContent = '';
      Z.zOrbLabel.textContent = '';
      Z.zPhrase.style.fontSize = '';
      fadeSwap(function () { Z.zPhrase.textContent = 'Well done.'; Z.zSub.textContent = 'The pattern loosens a little every time you meet it.'; });
      Z.zCtls.innerHTML = '';
      ctlBtn('Close', 'zen-btn', closeOverlay);
      Z.zHint.textContent = '';
      idleBreathe();
    }

    showIntro();
  }

  /* ================================================================
     Solar plexus breathing (meditations) + meditation timer
     ================================================================ */
  var GOLD = '#C4A265';
  var PHASES = [
    { n: 'Inhale', ms: 4000, scale: 1.34 },
    { n: 'Hold', ms: 2000, scale: 1.34 },
    { n: 'Exhale', ms: 6000, scale: 1.0 }
  ];
  var CYCLE_MS = PHASES.reduce(function (a, p) { return a + p.ms; }, 0);

  function runBreathLoop(onCycle) {
    var cycle = 0;
    function phase(pi) {
      if (!S || S.paused) return;
      var p = PHASES[pi];
      Z.zPhrase.textContent = p.n;
      Z.zOrb.style.transition = 'transform ' + p.ms + 'ms cubic-bezier(.4,0,.4,1)';
      Z.zOrb.style.transform = 'scale(' + p.scale + ')';
      if (pi === 0) { buzz(25); cycle++; if (onCycle) onCycle(cycle); }
      after(p.ms, function () { phase((pi + 1) % PHASES.length); });
    }
    phase(0);
    return function restart() { phase(0); };
  }

  function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  /* --- open-ended breathing for a meditation --- */
  function openMedBreath(i) {
    var m = MEDS[i];
    openOverlay(GOLD);
    Z.zKicker.textContent = (m.day + ' · Solar Plexus Breathing').toUpperCase();
    Z.zPoint.textContent = m.title;
    Z.zSub.innerHTML = m.carry ? '“' + m.carry + '”' : '';
    Z.zRead.style.display = 'flex';
    Z.zRead.onclick = function () {
      closeOverlay();
      var card = document.getElementById('md-' + i);
      if (card && !card.classList.contains('expanded')) tGen('md', i);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    newSession();
    chimeStart();
    runBreathLoop(function (c) { Z.zHint.textContent = 'cycle ' + c + ' · 4 in · 2 hold · 6 out'; });
    Z.zCtls.innerHTML = '';
    ctlBtn('End practice', 'zen-btn ghost', function () { chimeEnd(); after(400, closeOverlay) || closeOverlay(); });
  }

  /* --- solar plexus meditation timer --- */
  var RING_C = 2 * Math.PI * 48.5;
  function openTimer() {
    openOverlay(GOLD);
    Z.zKicker.textContent = 'SOLAR PLEXUS · MEDITATION TIMER';
    Z.zPhrase.textContent = 'Solar Plexus Meditation';
    Z.zSub.textContent = 'Breathe golden light into the centre just below the ribs — the seat of will, power and self. Choose a duration.';
    newSession();
    var mins = 5;
    Z.zChips.style.display = 'flex';
    [3, 5, 10, 15, 20].forEach(function (v) {
      var c = document.createElement('button');
      c.className = 'zen-chip' + (v === mins ? ' sel' : '');
      c.textContent = v + ' min';
      c.onclick = function () {
        mins = v;
        Array.prototype.forEach.call(Z.zChips.children, function (x) { x.classList.remove('sel'); });
        c.classList.add('sel');
      };
      Z.zChips.appendChild(c);
    });
    Z.zCtls.innerHTML = '';
    ctlBtn('Begin', 'zen-btn', function () { startTimer(mins); });
  }

  function startTimer(mins) {
    newSession();
    resetSlots();
    Z.zKicker.textContent = 'SOLAR PLEXUS · ' + mins + ' MIN';
    Z.zRingSvg.style.display = 'block';
    Z.zRingFill.style.strokeDasharray = RING_C;
    Z.zRingFill.style.strokeDashoffset = 0;
    Z.zCount.style.display = 'block';
    var total = mins * 60, left = total;
    Z.zCount.textContent = fmt(left);
    ac(); chimeStart(); buzz([30, 60, 30]);

    var restart = runBreathLoop(function (c) { Z.zHint.textContent = '4 in · 2 hold · 6 out'; });

    var tickDown = every(1000, function () {
      if (S && S.paused) return;
      left--;
      if (left <= 0) { finishTimer(mins); return; }
      Z.zCount.textContent = fmt(left);
      Z.zRingFill.style.strokeDashoffset = RING_C * (1 - left / total);
    });

    Z.zCtls.innerHTML = '';
    var pp = ctlBtn('&#10073;&#10073;', 'zen-ctl main', function () {
      if (!S) return;
      if (S.paused) {
        S.paused = false; pp.innerHTML = '&#10073;&#10073;'; Z.zHint.textContent = '';
        restart();
      } else {
        S.paused = true; pp.innerHTML = '&#9654;'; Z.zHint.textContent = 'paused';
        S.timers.forEach(clearTimeout); S.timers = [];
        Z.zOrb.style.transition = 'transform 1.5s ease'; Z.zOrb.style.transform = 'scale(1)';
        Z.zPhrase.textContent = 'Paused';
      }
    });
    ctlBtn('&#10005;', 'zen-ctl', closeOverlay);
  }

  function finishTimer(mins) {
    stopSession(); newSession();
    chimeEnd(); buzz([50, 100, 50, 100, 50]);
    Z.zCount.style.display = 'none';
    Z.zRingFill.style.strokeDashoffset = RING_C;
    Z.zOrb.style.transition = 'transform 6s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1)';
    Z.zPhrase.textContent = 'Complete';
    Z.zSub.textContent = mins + ' minutes at the solar plexus. Carry the warmth with you.';
    Z.zHint.textContent = '';
    Z.zCtls.innerHTML = '';
    ctlBtn('Close', 'zen-btn', closeOverlay);
  }

  /* ================================================================
     Hooks into the rendered app
     ================================================================ */
  function hookEft() {
    if (typeof EFT === 'undefined') return;
    document.querySelectorAll('.eft-seq-card').forEach(function (card, i) {
      card.onclick = function () { openTap(i); };
      var title = card.querySelector('.eft-seq-title');
      if (title) {
        var hint = document.createElement('div');
        hint.className = 'eft-seq-hint';
        hint.innerHTML = '<span class="zb-orb"></span> tap to begin guided session';
        title.insertAdjacentElement('afterend', hint);
        var read = document.createElement('button');
        read.className = 'eft-read-link';
        read.textContent = 'read the script ▾';
        read.onclick = function (e) { e.stopPropagation(); tGen('es', i); };
        hint.insertAdjacentElement('afterend', read);
      }
    });
  }

  function hookMeds() {
    if (typeof MEDS === 'undefined') return;
    document.querySelectorAll('.med-card').forEach(function (card, i) {
      card.onclick = function () { openMedBreath(i); };
      var body = card.querySelector('.med-body');
      var read = document.createElement('button');
      read.className = 'eft-read-link';
      read.textContent = 'read ▾';
      read.onclick = function (e) { e.stopPropagation(); tGen('md', i); };
      card.insertBefore(read, body);
      if (body) {
        var b = document.createElement('button');
        b.className = 'zen-begin';
        b.innerHTML = '<span class="zb-orb"></span> Begin solar plexus breathing';
        b.onclick = function (e) { e.stopPropagation(); openMedBreath(i); };
        body.appendChild(b);
      }
    });
    // timer banner at top of meditations page
    var page = document.getElementById('page-meditations');
    if (page) {
      var banner = document.createElement('div');
      banner.className = 'zen-banner';
      banner.innerHTML = '<span class="zb-orb"></span><div><div class="zen-banner-title">Solar Plexus Meditation Timer</div><div class="zen-banner-sub">A golden breathing meditation — 3 to 20 minutes, with opening and closing bells.</div></div>';
      banner.onclick = openTimer;
      page.insertBefore(banner, page.firstChild);
    }
  }

  function addFab() {
    var fab = document.createElement('button');
    fab.className = 'zen-fab';
    fab.setAttribute('aria-label', 'Solar plexus meditation timer');
    fab.innerHTML = '&#9737;';
    fab.onclick = openTimer;
    document.body.appendChild(fab);
  }

  function registerSW() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  function boot() {
    try { hookEft(); hookMeds(); addFab(); } catch (e) { console.error('zen layer:', e); }
    registerSW();
  }

  if (document.readyState === 'loading') {
    // inline app script registers its own DOMContentLoaded init first; ours runs after it
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
