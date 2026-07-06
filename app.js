/* ===== Soul Manual — zen layer v2 =====
   EFT tapping · breathing patterns · timer · reader · today · nav · ledger ·
   settings (theme/text size) · hash routing · update toast · PWA ===== */
(function () {
  'use strict';

  /* ---------- preferences ---------- */
  var PK = 'soulzen-prefs';
  var PREFS = { theme: 'dark', zoom: 1, pattern: 'solar', sound: true, haptics: true };
  try { Object.assign(PREFS, JSON.parse(localStorage.getItem(PK)) || {}); } catch (e) {}
  if (localStorage.getItem('soulzen-sound') === 'off') { PREFS.sound = false; localStorage.removeItem('soulzen-sound'); }
  function savePrefs() { localStorage.setItem(PK, JSON.stringify(PREFS)); }

  /* ---------- sound ---------- */
  var AC = null;
  function ac() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tick() {
    if (!PREFS.sound) return;
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
    if (!PREFS.sound) return;
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
  function buzz(p) { if (PREFS.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

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
  function newSession() { stopSession(); S = { timers: [], intervals: [], paused: false, onClose: null }; return S; }
  function after(ms, fn) { if (!S) return; var id = setTimeout(fn, ms); S.timers.push(id); return id; }
  function every(ms, fn) { if (!S) return; var id = setInterval(fn, ms); S.intervals.push(id); return id; }
  function clearBeats() { if (!S) return; S.intervals.forEach(clearInterval); S.intervals = []; }

  /* ---------- session ledger (localStorage) ---------- */
  var LK = 'soulzen-ledger';
  function ledgerAll() { try { return JSON.parse(localStorage.getItem(LK)) || []; } catch (e) { return []; } }
  function ledgerSave(l) { localStorage.setItem(LK, JSON.stringify(l.slice(-400))); }
  function logSession(e) { var l = ledgerAll(); e.t = Date.now(); l.push(e); ledgerSave(l); }
  function patchLast(patch) { var l = ledgerAll(); if (l.length) { Object.assign(l[l.length - 1], patch); ledgerSave(l); } }
  function weekStats() {
    var cut = Date.now() - 7 * 864e5, n = 0, min = 0;
    ledgerAll().forEach(function (e) { if (e.t >= cut) { n++; min += e.min || 0; } });
    return { sessions: n, minutes: min, total: ledgerAll().length };
  }

  /* ---------- layered history (back button closes overlays) ---------- */
  var layers = [];
  function pushLayer(name) { history.pushState({ zenLayer: name }, ''); layers.push(name); }
  function popLayer(name, fromPop) {
    var i = layers.lastIndexOf(name);
    if (i !== -1) { layers.splice(i, 1); if (!fromPop) { try { history.back(); } catch (e) {} } }
  }
  window.addEventListener('popstate', function () {
    if (ov && ov.classList.contains('open')) { closeOverlay(true); return; }
    if (reader && reader.classList.contains('open')) { closeReader(true); return; }
    if (sheetWrap && sheetWrap.classList.contains('open')) { closeSheet(true); return; }
  });

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
    Z.zClose.onclick = function () { closeOverlay(false); };
    Z.zSound.onclick = function () {
      PREFS.sound = !PREFS.sound; savePrefs();
      Z.zSound.style.opacity = PREFS.sound ? '1' : '0.35';
      if (PREFS.sound) tick();
    };
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (ov && ov.classList.contains('open')) closeOverlay(false);
    else if (reader && reader.classList.contains('open')) closeReader(false);
    else if (sheetWrap && sheetWrap.classList.contains('open')) closeSheet(false);
  });

  function setVars(c1, c2) {
    ov.style.setProperty('--zen-c1', c1);
    ov.style.setProperty('--zen-c2', c2 || '#6B5B8A');
    ov.style.setProperty('--zen-hi', lightenHex(c1));
    ov.style.setProperty('--zen-glow', hexA(c1, 0.38));
  }
  function hexA(h, a) {
    var n = parseInt(h.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function lightenHex(h) {
    var n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return Math.min(255, Math.round(v + (255 - v) * 0.55)); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function resetSlots() {
    Z.zPoint.textContent = ''; Z.zPhrase.innerHTML = ''; Z.zSub.innerHTML = '';
    Z.zPhrase.style.fontSize = '';
    Z.zCount.style.display = 'none'; Z.zChips.style.display = 'none'; Z.zChips.innerHTML = '';
    Z.zDots.innerHTML = ''; Z.zCtls.innerHTML = ''; Z.zHint.textContent = '';
    Z.zRingSvg.style.display = 'none'; Z.zRead.style.display = 'none';
    Z.zOrbLabel.textContent = '';
    Z.zOrb.className = 'zen-orb'; Z.zOrb.style.transition = ''; Z.zOrb.style.transform = 'scale(1)';
    Z.zSound.style.opacity = PREFS.sound ? '1' : '0.35';
  }
  function openOverlay(c1, c2) {
    buildOverlay(); setVars(c1, c2); resetSlots();
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    lockScreen(); pushLayer('overlay');
  }
  function closeOverlay(fromPop) {
    var cb = S && S.onClose;
    stopSession(); unlockScreen();
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
    popLayer('overlay', fromPop);
    if (cb) { try { cb(); } catch (e) {} }
  }

  function ctlBtn(html, cls, fn) {
    var b = document.createElement('button');
    b.className = cls; b.innerHTML = html; b.onclick = fn;
    Z.zCtls.appendChild(b); return b;
  }
  function scaleRow(container, label, onPick) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="zen-scale"></div><div class="zen-scale-label">' + label + '</div>';
    var row = wrap.querySelector('.zen-scale');
    for (var v = 0; v <= 10; v++) (function (v) {
      var b = document.createElement('button'); b.textContent = v;
      b.onclick = function () {
        row.querySelectorAll('button').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); onPick(v);
      };
      row.appendChild(b);
    })(v);
    container.appendChild(wrap);
  }

  /* ================================================================
     EFT — guided visual tapping session
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

    var beatSteps = steps.filter(function (s) { return s.kind === 'beat'; }).length;
    Z.zDots.innerHTML = '';
    for (var d = 0; d < beatSteps; d++) {
      var dot = document.createElement('div'); dot.className = 'zen-dot'; Z.zDots.appendChild(dot);
    }
    var dots = Z.zDots.children;

    newSession();
    var cur = -1, stepStart = 0, stepRemain = 0, before = null;

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
      Z.zSub.textContent = 'Find the feeling. Tap each point along with the pulse, speaking the phrase aloud.';
      Z.zChips.style.display = 'block';
      scaleRow(Z.zChips, 'how strong is it right now? (optional)', function (v) { before = v; });
      Z.zCtls.innerHTML = '';
      ctlBtn('Begin', 'zen-btn', function () { ac(); chimeStart(); Z.zChips.style.display = 'none'; Z.zChips.innerHTML = ''; goTo(0); });
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
        if (S.paused) {
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
        Z.zOrb.classList.add('tapmode');
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
        fadeSwap(function () { Z.zPhrase.textContent = 'Take a deep breath'; Z.zSub.textContent = 'Let it move through you.'; });
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
        ctlBtn('Another round', 'zen-btn ghost', function () { Z.zPhrase.style.fontSize = ''; goTo(firstRound); });
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
      logSession({ k: 'tap', label: seq.title, before: before, after: null });
      Z.zPoint.textContent = '';
      Z.zOrbLabel.textContent = '';
      Z.zPhrase.style.fontSize = '';
      fadeSwap(function () { Z.zPhrase.textContent = 'Well done.'; Z.zSub.textContent = 'The pattern loosens a little every time you meet it.'; });
      Z.zChips.innerHTML = ''; Z.zChips.style.display = 'block';
      scaleRow(Z.zChips, 'how strong is it now?', function (v) {
        patchLast({ after: v });
        if (before !== null && v < before) Z.zSub.textContent = 'From ' + before + ' down to ' + v + '. The charge is moving.';
        else if (before !== null) Z.zSub.textContent = 'From ' + before + ' to ' + v + '. Logged in your ledger.';
        else Z.zSub.textContent = 'Logged in your ledger.';
      });
      Z.zCtls.innerHTML = '';
      ctlBtn('Close', 'zen-btn', function () { closeOverlay(false); });
      Z.zHint.textContent = '';
      idleBreathe();
    }

    showIntro();
  }

  /* ================================================================
     Breathing patterns · solar plexus breathing · meditation timer
     ================================================================ */
  var GOLD = '#C4A265';
  var PATTERNS = {
    solar: { name: 'Solar 4·2·6', hint: '4 in · 2 hold · 6 out', steps: [['Inhale', 4000, 1.34], ['Hold', 2000, 1.34], ['Exhale', 6000, 1]] },
    box:   { name: 'Box 4·4·4·4', hint: '4 in · 4 hold · 4 out · 4 hold', steps: [['Inhale', 4000, 1.34], ['Hold', 4000, 1.34], ['Exhale', 4000, 1], ['Hold', 4000, 1]] },
    relax: { name: '4·7·8', hint: '4 in · 7 hold · 8 out', steps: [['Inhale', 4000, 1.34], ['Hold', 7000, 1.34], ['Exhale', 8000, 1]] }
  };
  function pattern() { return PATTERNS[PREFS.pattern] || PATTERNS.solar; }

  function runBreathLoop(onCycle) {
    var cycle = 0;
    function phase(pi) {
      if (!S || S.paused) return;
      var p = pattern().steps[pi];
      Z.zPhrase.textContent = p[0];
      Z.zOrb.style.transition = 'transform ' + p[1] + 'ms cubic-bezier(.4,0,.4,1)';
      Z.zOrb.style.transform = 'scale(' + p[2] + ')';
      buzz(pi === 0 ? 30 : 15);
      if (pi === 0) { cycle++; if (onCycle) onCycle(cycle); }
      after(p[1], function () { phase((pi + 1) % pattern().steps.length); });
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
    Z.zRead.onclick = function () { closeOverlay(false); openReader('med', i); };
    newSession();
    var start = Date.now();
    S.onClose = function () {
      var min = Math.round((Date.now() - start) / 60000);
      if (min >= 1) logSession({ k: 'breath', label: m.title, min: min });
    };
    chimeStart();
    runBreathLoop(function (c) { Z.zHint.textContent = 'cycle ' + c + ' · ' + pattern().hint; });
    Z.zCtls.innerHTML = '';
    ctlBtn('End practice', 'zen-btn ghost', function () { chimeEnd(); closeOverlay(false); });
  }

  /* --- solar plexus meditation timer --- */
  var RING_C = 2 * Math.PI * 48.5;
  function openTimer() {
    openOverlay(GOLD);
    Z.zKicker.textContent = 'SOLAR PLEXUS · MEDITATION TIMER';
    Z.zPhrase.textContent = 'Solar Plexus Meditation';
    Z.zSub.textContent = 'Breathe golden light into the centre just below the ribs — the seat of will, power and self.';
    newSession();
    var mins = 5;
    Z.zChips.style.display = 'flex';
    [3, 5, 10, 15, 20].forEach(function (v) {
      var c = document.createElement('button');
      c.className = 'zen-chip' + (v === mins ? ' sel' : '');
      c.textContent = v + ' min';
      c.onclick = function () {
        mins = v;
        Z.zChips.querySelectorAll('.zen-chip').forEach(function (x) { x.classList.remove('sel'); });
        c.classList.add('sel');
      };
      Z.zChips.appendChild(c);
    });
    var brk = document.createElement('div'); brk.style.cssText = 'width:100%;height:2px';
    Z.zChips.appendChild(brk);
    Object.keys(PATTERNS).forEach(function (key) {
      var c = document.createElement('button');
      c.className = 'zen-chip pat' + (key === PREFS.pattern ? ' sel' : '');
      c.style.cssText = 'font-size:10px;padding:8px 14px;opacity:.85';
      c.textContent = PATTERNS[key].name;
      c.onclick = function () {
        PREFS.pattern = key; savePrefs();
        Z.zChips.querySelectorAll('.pat').forEach(function (x) { x.classList.remove('sel'); });
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
    var start = Date.now();
    S.onClose = function () {
      var min = Math.round((Date.now() - start) / 60000);
      if (min >= 1) logSession({ k: 'timer', label: 'Solar plexus timer (ended early)', min: min });
    };
    Z.zKicker.textContent = 'SOLAR PLEXUS · ' + mins + ' MIN';
    Z.zRingSvg.style.display = 'block';
    Z.zRingFill.style.strokeDasharray = RING_C;
    Z.zRingFill.style.strokeDashoffset = 0;
    Z.zCount.style.display = 'block';
    var total = mins * 60, left = total;
    Z.zCount.textContent = fmt(left);
    ac(); chimeStart(); buzz([30, 60, 30]);

    var restart = runBreathLoop(function () { Z.zHint.textContent = pattern().hint; });

    every(1000, function () {
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
        S.paused = false; pp.innerHTML = '&#10073;&#10073;'; Z.zHint.textContent = pattern().hint;
        restart();
      } else {
        S.paused = true; pp.innerHTML = '&#9654;'; Z.zHint.textContent = 'paused';
        S.timers.forEach(clearTimeout); S.timers = [];
        Z.zOrb.style.transition = 'transform 1.5s ease'; Z.zOrb.style.transform = 'scale(1)';
        Z.zPhrase.textContent = 'Paused';
      }
    });
    ctlBtn('&#10005;', 'zen-ctl', function () { closeOverlay(false); });
  }

  function finishTimer(mins) {
    if (S) S.onClose = null;
    stopSession(); newSession();
    logSession({ k: 'timer', label: 'Solar plexus timer', min: mins });
    chimeEnd(); buzz([50, 100, 50, 100, 50]);
    Z.zCount.style.display = 'none';
    Z.zRingFill.style.strokeDashoffset = RING_C;
    Z.zOrb.style.transition = 'transform 6s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1)';
    Z.zPhrase.textContent = 'Complete';
    Z.zSub.textContent = mins + ' minutes at the solar plexus. Carry the warmth with you.';
    Z.zHint.textContent = '';
    Z.zCtls.innerHTML = '';
    ctlBtn('Close', 'zen-btn', function () { closeOverlay(false); });
  }

  /* ================================================================
     READER MODE
     ================================================================ */
  var reader = null, rEls = {};
  function buildReader() {
    if (reader) return;
    reader = document.createElement('div');
    reader.className = 'reader';
    reader.innerHTML =
      '<div class="reader-progress" id="rProg"></div>' +
      '<div class="reader-bar">' +
        '<button class="zen-iconbtn" id="rClose" aria-label="Close">&#10005;</button>' +
        '<div class="reader-kicker" id="rKicker"></div>' +
        '<div style="width:38px"></div>' +
      '</div>' +
      '<div class="reader-scroll" id="rScroll"><article class="reader-body" id="rBody"></article></div>';
    document.body.appendChild(reader);
    ['rProg','rKicker','rScroll','rBody'].forEach(function (id) { rEls[id] = reader.querySelector('#' + id); });
    reader.querySelector('#rClose').onclick = function () { closeReader(false); };
    rEls.rScroll.addEventListener('scroll', function () {
      var el = rEls.rScroll;
      var p = el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0;
      rEls.rProg.style.width = (p * 100) + '%';
    });
  }

  function openReader(kind, i) {
    buildReader();
    var h = '';
    if (kind === 'med') {
      var m = MEDS[i];
      rEls.rKicker.textContent = (m.day + ' · Meditation').toUpperCase();
      h += '<h1 class="reader-title">' + (m.icon ? m.icon + ' ' : '') + m.title + '</h1>';
      h += '<div class="reader-text"><p>' + m.text + '</p></div>';
      if (m.practice) h += '<div class="reader-block"><div class="reader-block-label">The practice</div>' + m.practice + '</div>';
      if (m.carry) h += '<div class="reader-carry">“' + m.carry + '”</div>';
      h += '<div class="reader-fin"></div>';
      h += '<div class="reader-actions"><button class="tbtn" id="rAct1"><span class="zb-orb" style="width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#F2E2AC,#C4A265)"></span> Begin solar plexus breathing</button></div>';
    } else {
      var c = DATA[i];
      rEls.rKicker.textContent = ('Chapter ' + c.number + ' · ' + c.section).toUpperCase();
      h += '<span class="reader-number" style="color:' + c.color + '">' + c.number + '</span>';
      h += '<h1 class="reader-title">' + c.title + '</h1>';
      h += '<p class="reader-subtitle">' + c.subtitle + '</p>';
      h += '<div class="reader-text">' + c.summary + '</div>';
      if (c.bookExcerpts && c.bookExcerpts.length) {
        h += '<div class="reader-fin"></div>';
        c.bookExcerpts.forEach(function (e) { h += '<div class="reader-quote">“' + e + '”</div>'; });
        h += '<div class="reader-attr">— Gary Zukav, The Seat of the Soul</div>';
      }
      h += '<div class="reader-actions"><button class="tbtn ghost" id="rAct1">Explore ' + (c.crossReferences ? c.crossReferences.length : 21) + ' cross-references &rarr;</button></div>';
    }
    rEls.rBody.innerHTML = h;
    var act = rEls.rBody.querySelector('#rAct1');
    if (act) act.onclick = kind === 'med'
      ? function () { closeReader(false); openMedBreath(i); }
      : function () { closeReader(false); navTo('concepts'); openD(DATA[i].id); themeDetailPanel(); };
    rEls.rScroll.scrollTop = 0; rEls.rProg.style.width = '0';
    reader.classList.add('open');
    document.body.style.overflow = 'hidden';
    pushLayer('reader');
  }
  function closeReader(fromPop) {
    if (reader) reader.classList.remove('open');
    if (!ov || !ov.classList.contains('open')) document.body.style.overflow = '';
    popLayer('reader', fromPop);
  }

  /* ================================================================
     NAV — 5 groups · hash routing
     ================================================================ */
  var GROUPS = [
    { id: 'today', label: 'Today', icon: '☉', pages: ['today'] },
    { id: 'learn', label: 'Learn', icon: '❖', pages: ['concepts', 'arch', 'mirror', 'dramas', 'guide'] },
    { id: 'practice', label: 'Practice', icon: '◉', pages: ['meditations', 'eft', 'forge', 'edge', 'ledger'] },
    { id: 'mapg', label: 'Map', icon: '✦', pages: ['map', 'trees'] },
    { id: 'crisisg', label: 'Crisis', icon: '⚑', pages: ['crisis'] }
  ];
  var PAGE_LABELS = { today: 'Today', concepts: 'Concepts', arch: 'Architecture', mirror: 'Mirror', dramas: 'Dramas', guide: 'Paths', meditations: 'Meditations', eft: 'EFT', forge: 'Forge', edge: 'Living Edge', ledger: 'Ledger', map: 'The Map', trees: 'Decide', crisis: 'Crisis' };
  var VALID = Object.keys(PAGE_LABELS);
  var groupChoice = {}; // last-visited page per group
  var navEl = null, subnavEl = null;

  function groupOf(page) {
    for (var g = 0; g < GROUPS.length; g++) if (GROUPS[g].pages.indexOf(page) !== -1) return GROUPS[g];
    return GROUPS[0];
  }
  function buildNav() {
    navEl = document.createElement('nav');
    navEl.className = 'znav';
    GROUPS.forEach(function (g) {
      var b = document.createElement('button');
      b.className = 'znav-item'; b.dataset.group = g.id;
      b.innerHTML = '<span class="zi">' + g.icon + '</span><span>' + g.label + '</span>';
      b.onclick = function () { navTo(groupChoice[g.id] || g.pages[0]); };
      navEl.appendChild(b);
    });
    document.body.appendChild(navEl);
    subnavEl = document.createElement('div');
    subnavEl.className = 'zsubnav';
    var firstPage = document.querySelector('.page');
    firstPage.parentNode.insertBefore(subnavEl, firstPage);
  }
  function navTo(page) {
    if (VALID.indexOf(page) === -1) page = 'today';
    if (location.hash === '#/' + page) activate(page);
    else location.hash = '/' + page;
  }
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    activate(VALID.indexOf(h) !== -1 ? h : 'today');
  }
  function activate(page) {
    var g = groupOf(page);
    groupChoice[g.id] = page;
    showPage(page, null);
    navEl.querySelectorAll('.znav-item').forEach(function (b) { b.classList.toggle('active', b.dataset.group === g.id); });
    subnavEl.innerHTML = '';
    if (g.pages.length > 1) {
      g.pages.forEach(function (p) {
        var b = document.createElement('button');
        b.textContent = PAGE_LABELS[p];
        b.className = p === page ? 'active' : '';
        b.onclick = function () { navTo(p); };
        subnavEl.appendChild(b);
      });
    }
    if (page === 'today') renderToday();
    if (page === 'ledger') renderLedger();
  }

  /* ================================================================
     TODAY PAGE
     ================================================================ */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function createPages() {
    var anchor = document.getElementById('page-concepts');
    ['today', 'ledger'].forEach(function (id) {
      var d = document.createElement('div');
      d.className = 'page'; d.id = 'page-' + id;
      anchor.parentNode.insertBefore(d, anchor);
    });
  }

  function todayMedIndex() {
    var name = DAYS[new Date().getDay()];
    var i = MEDS.findIndex(function (m) { return m.day === name; });
    return i === -1 ? 0 : i;
  }
  function suggestedChapterIndex() {
    var now = new Date();
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    return doy % DATA.length;
  }

  function renderToday() {
    var page = document.getElementById('page-today');
    var now = new Date();
    var mi = todayMedIndex(), m = MEDS[mi];
    var ci = suggestedChapterIndex(), c = DATA[ci];
    var hr = now.getHours();
    var greet = hr < 12 ? 'Good morning, Beet.' : hr < 18 ? 'Good afternoon, Beet.' : 'Good evening, Beet.';
    var st = weekStats();
    var ledgerLine = st.sessions
      ? 'This week: <em>' + st.sessions + ' session' + (st.sessions > 1 ? 's' : '') + '</em>' + (st.minutes ? ' · <em>' + st.minutes + ' min</em> of breath' : '') + ' &rarr;'
      : 'Your ledger is empty. One breath begins it. &rarr;';

    page.innerHTML =
      '<div class="today-date">' + DAYS[now.getDay()].toUpperCase() + ' · ' + MONTHS[now.getMonth()].toUpperCase() + ' ' + now.getDate() + '</div>' +
      '<div class="today-greet">' + greet + '</div>' +

      '<div class="today-sec">Today’s Meditation</div>' +
      '<div class="today-card" id="tdMed">' +
        '<div class="tc-kicker">' + (m.icon ? m.icon + ' ' : '') + m.day + '</div>' +
        '<div class="tc-title">' + m.title + '</div>' +
        (m.carry ? '<div class="tc-sub">“' + m.carry + '”</div>' : '') +
        '<div class="today-actions"><button class="tbtn" id="tdMedRead">Read</button><button class="tbtn ghost" id="tdMedBreathe">Breathe</button></div>' +
      '</div>' +

      '<div class="today-sec">Suggested Chapter</div>' +
      '<div class="today-card" id="tdCh">' +
        '<div class="tc-kicker" style="color:' + c.color + '">Chapter ' + c.number + ' · ' + c.section + '</div>' +
        '<div class="tc-title">' + c.title + '</div>' +
        '<div class="tc-sub">' + c.subtitle + '</div>' +
        '<div class="today-actions"><button class="tbtn" id="tdChRead">Read</button></div>' +
      '</div>' +

      '<div class="today-sec">Practice</div>' +
      '<div class="today-tiles">' +
        '<button class="today-tile" id="tdTimer"><div class="tt-icon"></div><div class="tt-name">Solar Plexus</div><div class="tt-sub">meditation timer</div></button>' +
        '<button class="today-tile" id="tdEft"><div class="tt-icon violet"></div><div class="tt-name">EFT Tapping</div><div class="tt-sub">guided sequences</div></button>' +
      '</div>' +

      '<div class="today-ledger-line" id="tdLedger">' + ledgerLine + '</div>';

    function on(id, fn) { page.querySelector('#' + id).onclick = fn; }
    on('tdMed', function () { openReader('med', mi); });
    on('tdMedRead', function (e) { e.stopPropagation(); openReader('med', mi); });
    on('tdMedBreathe', function (e) { e.stopPropagation(); openMedBreath(mi); });
    on('tdCh', function () { openReader('concept', ci); });
    on('tdChRead', function (e) { e.stopPropagation(); openReader('concept', ci); });
    on('tdTimer', openTimer);
    on('tdEft', function () { navTo('eft'); });
    on('tdLedger', function () { navTo('ledger'); });
  }

  /* ================================================================
     LEDGER PAGE
     ================================================================ */
  function dayLabel(t) {
    var d = new Date(t), today = new Date();
    var midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (t >= midnight) return 'Today';
    if (t >= midnight - 864e5) return 'Yesterday';
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
  }
  function renderLedger() {
    var page = document.getElementById('page-ledger');
    var all = ledgerAll().slice().reverse();
    var st = weekStats();
    var h = '<div style="margin-bottom:20px"><h2 style="font-family:\'Cormorant Garamond\',serif;font-size:24px;font-weight:400;color:#E8DCC8;margin-bottom:6px">The Ledger</h2>' +
      '<p style="font-size:12.5px;color:rgba(255,255,255,0.35)">A quiet record of practice. No streaks, no scores — just what you’ve done.</p></div>';
    h += '<div class="ledger-stats">' +
      '<div class="ledger-stat"><div class="ls-num">' + st.sessions + '</div><div class="ls-label">this week</div></div>' +
      '<div class="ledger-stat"><div class="ls-num">' + st.minutes + '</div><div class="ls-label">breath minutes</div></div>' +
      '<div class="ledger-stat"><div class="ls-num">' + st.total + '</div><div class="ls-label">all time</div></div>' +
      '</div>';
    if (!all.length) {
      h += '<div class="ledger-empty">Nothing here yet.<br>Complete a tapping session or sit with the timer,<br>and it will be remembered.</div>';
    } else {
      var lastDay = '';
      all.forEach(function (e) {
        var dl = dayLabel(e.t);
        if (dl !== lastDay) { h += '<div class="ledger-day">' + dl + '</div>'; lastDay = dl; }
        var d = new Date(e.t);
        var time = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
        var kind = e.k === 'tap' ? 'EFT tapping' : e.k === 'timer' ? 'Meditation timer' : 'Breathing';
        var delta = '';
        if (e.k === 'tap' && e.before !== null && e.before !== undefined && e.after !== null && e.after !== undefined) delta = e.before + ' → ' + e.after;
        else if (e.min) delta = e.min + ' min';
        h += '<div class="ledger-row"><div class="lr-orb' + (e.k === 'tap' ? ' tap' : '') + '"></div>' +
          '<div class="lr-main"><div class="lr-title">' + (e.label || kind) + '</div><div class="lr-sub">' + time + ' · ' + kind + '</div></div>' +
          (delta ? '<div class="lr-delta">' + delta + '</div>' : '') + '</div>';
      });
    }
    page.innerHTML = h;
    if (PREFS.theme === 'light') applyInlineTheme(true, page);
  }

  /* ================================================================
     SETTINGS — theme · text size · breathing · sound · haptics
     ================================================================ */
  var sheetWrap = null;
  function buildSettings() {
    var gear = document.createElement('button');
    gear.className = 'zgear'; gear.innerHTML = '&#9881;'; gear.setAttribute('aria-label', 'Settings');
    gear.onclick = openSheet;
    document.body.appendChild(gear);

    sheetWrap = document.createElement('div');
    sheetWrap.className = 'zsheet-wrap';
    sheetWrap.innerHTML = '<div class="zsheet" id="zSheet"></div>';
    sheetWrap.onclick = function (e) { if (e.target === sheetWrap) closeSheet(false); };
    document.body.appendChild(sheetWrap);
  }
  function optRow(label, opts, current, onPick) {
    var h = '<div class="zset-label">' + label + '</div><div class="zset-row">';
    opts.forEach(function (o) { h += '<button data-v="' + o.v + '" class="' + (String(o.v) === String(current) ? 'sel' : '') + '">' + o.n + '</button>'; });
    h += '</div>';
    var tpl = document.createElement('div'); tpl.innerHTML = h;
    tpl.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        tpl.querySelectorAll('button').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); onPick(b.dataset.v);
      };
    });
    return tpl;
  }
  function openSheet() {
    var sheet = sheetWrap.querySelector('#zSheet');
    sheet.innerHTML = '<h3>Settings</h3>';
    sheet.appendChild(optRow('Theme', [{ v: 'dark', n: 'Night' }, { v: 'light', n: 'Parchment' }], PREFS.theme, function (v) { PREFS.theme = v; savePrefs(); applyTheme(); }));
    sheet.appendChild(optRow('Text size', [{ v: 0.92, n: 'S' }, { v: 1, n: 'M' }, { v: 1.08, n: 'L' }, { v: 1.18, n: 'XL' }], PREFS.zoom, function (v) { PREFS.zoom = parseFloat(v); savePrefs(); applyZoom(); }));
    sheet.appendChild(optRow('Breathing pattern', Object.keys(PATTERNS).map(function (k) { return { v: k, n: PATTERNS[k].name }; }), PREFS.pattern, function (v) { PREFS.pattern = v; savePrefs(); }));
    sheet.appendChild(optRow('Sound', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], PREFS.sound ? 'on' : 'off', function (v) { PREFS.sound = v === 'on'; savePrefs(); }));
    sheet.appendChild(optRow('Haptics', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], PREFS.haptics ? 'on' : 'off', function (v) { PREFS.haptics = v === 'on'; savePrefs(); }));
    sheetWrap.classList.add('open');
  }
  function closeSheet() { sheetWrap.classList.remove('open'); }

  function applyZoom() { document.documentElement.style.zoom = PREFS.zoom === 1 ? '' : PREFS.zoom; }

  /* ================================================================
     LIGHT THEME ENGINE — compiles the original dark stylesheet and
     inline styles into a parchment palette at runtime
     ================================================================ */
  var lightBuilt = false;

  // mode: 'text' | 'bg' | 'other' (borders, shadows)
  function remapColors(val, mode) {
    // hex forms (inline attribute strings keep author formatting)
    val = val.replace(/#E8DCC8/gi, 'rgb(232,220,200)').replace(/#EDE4D3/gi, 'rgb(237,228,211)').replace(/#F2E2AC/gi, 'rgb(242,226,172)')
             .replace(/#0A0908/gi, 'rgb(10,9,8)').replace(/#080706/gi, 'rgb(8,7,6)');
    if (mode === 'text') val = val.replace(/#C4A265/gi, 'rgb(196,162,101)').replace(/#D4A038/gi, 'rgb(212,160,56)');
    return val.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/gi, function (m, r, g, b, a) {
      r = +r; g = +g; b = +b; a = a === undefined ? 1 : parseFloat(a);
      function out(rr, gg, bb, aa) { return 'rgba(' + rr + ',' + gg + ',' + bb + ',' + (+aa.toFixed(3)) + ')'; }
      // near-white → warm ink
      if (r > 235 && g > 235 && b > 235) {
        return out(58, 45, 26, mode === 'text' ? Math.min(0.92, a * 1.15 + 0.12) : Math.min(0.5, a * 1.4));
      }
      // cream / parchment tones → dark brown
      if (r >= 215 && g >= 195 && b >= 140 && r >= g && g > b) {
        return out(51, 41, 26, a < 1 ? Math.min(0.95, a * 1.1 + 0.1) : 1);
      }
      // gold accents used as text → deeper gold for contrast
      if (mode === 'text' && r >= 170 && r <= 225 && g >= 130 && g <= 185 && b >= 30 && b <= 130) {
        return out(138, 107, 52, a);
      }
      // app blacks → paper, backgrounds only (shadows stay dark)
      if (mode === 'bg' && r < 25 && g < 25 && b < 25) {
        return a > 0.85 ? 'rgb(244,236,219)' : out(244, 236, 219, a);
      }
      return m;
    });
  }
  function propMode(prop) {
    if (prop === 'color' || prop === '-webkit-text-fill-color') return 'text';
    return prop.indexOf('background') === 0 ? 'bg' : 'other';
  }

  var THEME_PROPS = ['color', 'background', 'background-color', 'background-image', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'box-shadow', '-webkit-text-fill-color'];

  function buildLightCSS() {
    var src = document.querySelector('style');
    if (!src || !src.sheet) return;
    var out = [];
    function walk(rules, mediaText) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.type === 4 /* media */) { walk(r.cssRules, r.conditionText || r.media.mediaText); continue; }
        if (r.type !== 1 /* style */) continue;
        var decl = [];
        for (var p = 0; p < THEME_PROPS.length; p++) {
          var prop = THEME_PROPS[p];
          var v = r.style.getPropertyValue(prop);
          if (!v) continue;
          var nv = remapColors(v, propMode(prop));
          if (nv !== v) decl.push(prop + ':' + nv + ' !important');
        }
        if (!decl.length) continue;
        var sel = r.selectorText.split(',').map(function (s) {
          s = s.trim();
          if (s === 'body') return 'body.light';
          if (s.indexOf('body') === 0) return 'body.light' + s.slice(4);
          if (s.indexOf('html') === 0) return null;
          return 'body.light ' + s;
        }).filter(Boolean).join(',');
        if (!sel) continue;
        var rule = sel + '{' + decl.join(';') + '}';
        out.push(mediaText ? '@media ' + mediaText + '{' + rule + '}' : rule);
      }
    }
    try { walk(src.sheet.cssRules, null); } catch (e) { return; }
    var st = document.createElement('style');
    st.id = 'zenLightTheme';
    st.textContent = out.join('\n');
    // insert BEFORE app.css so hand-tuned body.light rules in app.css win ties
    var appLink = document.querySelector('link[href="app.css"]');
    if (appLink) appLink.parentNode.insertBefore(st, appLink);
    else document.head.appendChild(st);
  }

  function applyInlineTheme(light, root) {
    var els = (root || document).querySelectorAll('[style]');
    els.forEach(function (el) {
      if (el.closest('.zen-overlay,.reader,.znav,.zsheet-wrap,.ztoast,#page-today')) return;
      if (light) {
        if (el.dataset.zdk === undefined) el.dataset.zdk = el.getAttribute('style') || '';
        THEME_PROPS.forEach(function (p) {
          var v = el.style.getPropertyValue(p);
          if (!v) return;
          var nv = remapColors(v, propMode(p));
          if (nv !== v) el.style.setProperty(p, nv);
        });
      } else if (el.dataset.zdk !== undefined) {
        el.setAttribute('style', el.dataset.zdk);
      }
    });
  }

  function applyTheme() {
    var light = PREFS.theme === 'light';
    document.body.classList.toggle('light', light);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#F4ECDB' : '#0A0908');
    if (light && !lightBuilt) { buildLightCSS(); lightBuilt = true; }
    applyInlineTheme(light);
  }
  function themeDetailPanel() {
    if (PREFS.theme === 'light') {
      var dp = document.getElementById('detailPanel');
      if (dp) applyInlineTheme(true, dp);
    }
  }
  // concept detail renders fresh HTML — re-theme it when opened in light mode
  function wrapOpenD() {
    if (typeof window.openD !== 'function') return;
    var orig = window.openD;
    window.openD = function (id) { orig(id); themeDetailPanel(); };
  }

  /* ================================================================
     UPDATE TOAST + SERVICE WORKER
     ================================================================ */
  var toastEl = null;
  function showToast(msg, btnLabel, fn) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ztoast';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span>' + msg + '</span>' + (btnLabel ? '<button>' + btnLabel + '</button>' : '');
    if (btnLabel) toastEl.querySelector('button').onclick = fn;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    if (!btnLabel) setTimeout(function () { toastEl.classList.remove('show'); }, 5000);
  }
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('A new version is ready', 'Reload', function () { location.reload(); });
          }
        });
      });
    }).catch(function () {});
  }

  /* ================================================================
     HOOKS INTO THE RENDERED APP
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
      read.textContent = 'read →';
      read.onclick = function (e) { e.stopPropagation(); openReader('med', i); };
      card.insertBefore(read, body);
      if (body) {
        var b = document.createElement('button');
        b.className = 'zen-begin';
        b.innerHTML = '<span class="zb-orb"></span> Begin solar plexus breathing';
        b.onclick = function (e) { e.stopPropagation(); openMedBreath(i); };
        body.appendChild(b);
      }
    });
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

  /* ================================================================
     BOOT
     ================================================================ */
  function boot() {
    try {
      hookEft(); hookMeds(); addFab();
      createPages(); buildNav(); buildSettings(); wrapOpenD();
      applyZoom(); applyTheme();
      window.addEventListener('hashchange', route);
      if (!location.hash) history.replaceState(null, '', '#/today');
      route();
    } catch (e) { console.error('zen layer:', e); }
    registerSW();
  }

  if (document.readyState === 'loading') {
    // the app's inline script registers its DOMContentLoaded init first; ours runs after it
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
