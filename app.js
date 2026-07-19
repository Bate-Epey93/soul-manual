/* ===== Soul Manual — zen layer v2 =====
   EFT tapping · breathing patterns · timer · reader · today · nav · ledger ·
   settings (theme/text size) · hash routing · update toast · PWA ===== */
(function () {
  'use strict';

  /* ---------- preferences ---------- */
  var PK = 'soulzen-prefs';
  var PREFS = { theme: 'dark', zoom: 1, pattern: 'solar', sound: true, haptics: true, ambient: true, reminders: { on: false, morning: '08:00', evening: '20:00' }, lastNudge: '' };
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

  /* ---------- ambient drone (overlays) ---------- */
  var amb = null;
  function startAmbient() {
    if (!PREFS.sound || !PREFS.ambient || amb) return;
    var a = ac(); if (!a) return;
    var t = a.currentTime;
    var master = a.createGain(); master.gain.setValueAtTime(0.0001, t); master.gain.exponentialRampToValueAtTime(0.055, t + 3.5);
    var filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 420; filt.Q.value = 0.6;
    var oscs = [];
    [[55, 'triangle', 0.5], [82.41, 'sine', 0.28], [110, 'sine', 0.22], [110.5, 'triangle', 0.16]].forEach(function (spec) {
      var o = a.createOscillator(); o.type = spec[1]; o.frequency.value = spec[0];
      var g = a.createGain(); g.gain.value = spec[2];
      o.connect(g); g.connect(filt); o.start(); oscs.push(o);
    });
    filt.connect(master); master.connect(a.destination);
    var lfo = a.createOscillator(); lfo.frequency.value = 0.05;
    var lg = a.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
    amb = { a: a, master: master, oscs: oscs, lfo: lfo };
  }
  function stopAmbient() {
    if (!amb) return; var a = amb.a, t = a.currentTime, keep = amb;
    amb = null;
    try {
      keep.master.gain.cancelScheduledValues(t); keep.master.gain.setValueAtTime(keep.master.gain.value || 0.05, t);
      keep.master.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      keep.oscs.forEach(function (o) { try { o.stop(t + 1.8); } catch (e) {} });
      try { keep.lfo.stop(t + 1.8); } catch (e) {}
    } catch (e) {}
  }
  function syncAmbient() { if (PREFS.sound && PREFS.ambient && ov && ov.classList.contains('open')) startAmbient(); else stopAmbient(); }
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
  var handoff = false;
  function pushLayer(name) { if (handoff) history.replaceState({ zenLayer: name }, ''); else history.pushState({ zenLayer: name }, ''); layers.push(name); }
  // close the current layer and open another without a spurious history.back()/popstate
  function layerHandoff(closeFn, openFn) { handoff = true; try { closeFn(true); openFn(); } finally { handoff = false; } }
  function popLayer(name, fromPop) {
    var i = layers.lastIndexOf(name);
    if (i !== -1) { layers.splice(i, 1); if (!fromPop) { try { history.back(); } catch (e) {} } }
  }
  window.addEventListener('popstate', function () {
    if (ov && ov.classList.contains('open')) { closeOverlay(true); return; }
    if (reader && reader.classList.contains('open')) { closeReader(true); return; }
    if (sheetWrap && sheetWrap.classList.contains('open')) { closeSheet(true); return; }
  });

  /* ================================================================
     ENSŌ — deterministic hand-brushed circle SVGs
     ================================================================ */
  function hash32(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = hash32(String(seed));
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // a single brush ring as a filled path: tapered ends, organic wobble, open gap
  function ensoPath(seed, opts) {
    opts = opts || {};
    var r = rng(seed);
    var R = 36, W = opts.w || 11;
    var rot = opts.rot !== undefined ? opts.rot : r() * Math.PI * 2;
    var gap = opts.gap !== undefined ? opts.gap : 0.55 + r() * 0.8;
    var span = Math.PI * 2 - gap;
    var wob = 2 + r() * 2.4, ph1 = r() * Math.PI * 2, ph2 = r() * Math.PI * 2;
    var N = 44, outer = [], inner = [];
    for (var k = 0; k <= N; k++) {
      var t = k / N, th = rot + t * span;
      var w = W * (0.3 + 0.7 * Math.pow(1 - t, 1.3)) * Math.min(1, 0.15 + t * 6);
      var rad = R + Math.sin(t * Math.PI * 2 + ph1) * wob * 0.5 + Math.sin(t * Math.PI * 5 + ph2) * 0.8;
      var co = Math.cos(th), si = Math.sin(th);
      outer.push((50 + co * (rad + w / 2)).toFixed(1) + ' ' + (50 + si * (rad + w / 2)).toFixed(1));
      inner.push((50 + co * (rad - w / 2)).toFixed(1) + ' ' + (50 + si * (rad - w / 2)).toFixed(1));
    }
    return 'M' + outer.join('L') + 'L' + inner.reverse().join('L') + 'Z';
  }
  function svgWrap(body, opts) {
    return '<svg class="enso" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"' +
      (opts && opts.style ? ' style="' + opts.style + '"' : '') + '>' + body + '</svg>';
  }
  /* open centerline arc for a self-drawing (stroke-dashoffset) ensō */
  function ensoCenterPath(seed, gap, rot) {
    var r = rng(seed), R = 38, g = gap !== undefined ? gap : 0.9, span = Math.PI * 2 - g;
    var rt = rot !== undefined ? rot : -0.7 + r() * 0.5, ph1 = r() * 6.28, ph2 = r() * 6.28, wob = 1.4 + r() * 1.6, N = 64, pts = [];
    for (var k = 0; k <= N; k++) {
      var t = k / N, th = rt + t * span, rad = R + Math.sin(t * 6.28 + ph1) * wob * 0.5 + Math.sin(t * 15.7 + ph2) * 0.7;
      pts.push((50 + Math.cos(th) * rad).toFixed(2) + ' ' + (50 + Math.sin(th) * rad).toFixed(2));
    }
    return 'M' + pts.join('L');
  }
  function drawEnsoSVG(seed, opts) {
    opts = opts || {};
    return '<svg class="enso draw-enso" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"' +
      (opts.style ? ' style="' + opts.style + '"' : '') +
      '><path pathLength="100" d="' + ensoCenterPath(seed, opts.gap, opts.rot) + '" fill="none" stroke="' + (opts.color || 'currentColor') +
      '" stroke-width="' + (opts.w || 3) + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function redrawOverlayEnso() {
    if (!ov) return; var p = ov.querySelector('.draw-enso path'); if (!p) return;
    p.style.animation = 'none'; void p.getBoundingClientRect(); p.style.animation = '';
  }
  function ensoSVG(seed, opts) {
    opts = opts || {};
    var fill = opts.color || 'currentColor';
    var dot = opts.dot ? '<circle cx="50" cy="50" r="' + opts.dot + '" fill="' + fill + '"/>' : '';
    return svgWrap('<path d="' + ensoPath(seed, opts) + '" fill="' + fill + '"/>' + dot, opts);
  }

  /* --- brush strokes along arbitrary polylines (sumi-e motifs) --- */
  function crSpline(a, b, c, d, t) {
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  }
  function resample(pts, N) {
    var out = [], k, t;
    if (pts.length < 3) {
      for (k = 0; k <= N; k++) { t = k / N; out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]); }
      return out;
    }
    var P = [pts[0]].concat(pts, [pts[pts.length - 1]]);
    var segs = pts.length - 1;
    for (k = 0; k <= N; k++) {
      t = k / N * segs;
      var i = Math.min(Math.floor(t), segs - 1), u = t - i;
      out.push([crSpline(P[i][0], P[i + 1][0], P[i + 2][0], P[i + 3][0], u), crSpline(P[i][1], P[i + 1][1], P[i + 2][1], P[i + 3][1], u)]);
    }
    return out;
  }
  function strokePath(seed, pts, w, o) {
    o = o || {};
    var r = rng(seed);
    var N = Math.max(14, pts.length * 6);
    var P = resample(pts, N);
    var ph = r() * 6.28, wob = 0.7 + r();
    var L = [], R = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      var a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var wt = o.taper === 'both'
        ? w * (0.25 + 0.75 * Math.sin(Math.PI * t))
        : w * (0.3 + 0.7 * Math.pow(1 - t, 1.15)) * Math.min(1, 0.15 + t * 6);
      wt += Math.sin(t * 9 + ph) * wob * 0.4;
      if (wt < 0.6) wt = 0.6;
      L.push((P[i][0] + nx * wt / 2).toFixed(1) + ' ' + (P[i][1] + ny * wt / 2).toFixed(1));
      R.push((P[i][0] - nx * wt / 2).toFixed(1) + ' ' + (P[i][1] - ny * wt / 2).toFixed(1));
    }
    return 'M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z';
  }
  function ringPts(cx, cy, R, rot, frac) {
    var pts = [], n = 9, span = Math.PI * 2 * (frac || 0.94);
    for (var i = 0; i <= n; i++) {
      var th = (rot || -1.2) + span * i / n;
      pts.push([cx + Math.cos(th) * R, cy + Math.sin(th) * R]);
    }
    return pts;
  }

  /* --- motif library: each mark drawn as brush strokes (s) + ink dots (d) --- */
  var MOTIFS = {
    sun:      { s: [{ p: ringPts(50, 50, 22, -1.1), w: 8 }, { p: [[50, 9], [50, 19]], w: 5 }, { p: [[79, 21], [72, 28]], w: 5 }, { p: [[91, 50], [81, 50]], w: 5 }, { p: [[79, 79], [72, 72]], w: 5 }, { p: [[50, 91], [50, 81]], w: 5 }, { p: [[21, 79], [28, 72]], w: 5 }, { p: [[9, 50], [19, 50]], w: 5 }, { p: [[21, 21], [28, 28]], w: 5 }] },
    sunrise:  { s: [{ p: [[10, 74], [90, 74]], w: 6 }, { p: [[27, 70], [32, 50], [50, 40], [68, 50], [73, 70]], w: 9 }, { p: [[50, 18], [50, 28]], w: 5 }, { p: [[26, 30], [33, 38]], w: 5 }, { p: [[74, 30], [67, 38]], w: 5 }] },
    mountain: { s: [{ p: [[10, 82], [36, 34], [50, 56], [66, 24], [90, 82]], w: 8 }] },
    lotus:    { s: [{ p: [[50, 32], [58, 46], [50, 64], [42, 46], [50, 34]], w: 6 }, { p: [[24, 60], [34, 42], [47, 58]], w: 6 }, { p: [[76, 60], [66, 42], [53, 58]], w: 6 }, { p: [[26, 68], [50, 78], [74, 68]], w: 7 }] },
    bond:     { s: [{ p: ringPts(39, 50, 16, 0.6), w: 7 }, { p: ringPts(61, 50, 16, 3.7), w: 7 }] },
    hammer:   { s: [{ p: [[34, 84], [58, 44]], w: 6 }, { p: [[44, 26], [72, 46]], w: 13 }] },
    drop:     { s: [{ p: [[50, 16], [63, 44], [58, 68], [50, 76], [42, 68], [37, 44], [49, 18]], w: 7 }] },
    yinyang:  { s: [{ p: ringPts(50, 50, 27, -1.4), w: 7 }, { p: [[50, 25], [37, 38], [62, 60], [50, 73]], w: 5 }], d: [[50, 37, 4], [50, 62, 4]] },
    fog:      { s: [{ p: [[22, 36], [42, 31], [62, 40], [80, 35]], w: 6 }, { p: [[16, 52], [40, 47], [64, 56], [86, 51]], w: 6 }, { p: [[24, 68], [44, 63], [64, 71], [78, 67]], w: 6 }] },
    weight:   { s: [{ p: [[24, 50], [76, 50]], w: 5 }, { p: [[29, 33], [29, 67]], w: 11 }, { p: [[71, 33], [71, 67]], w: 11 }] },
    pin:      { s: [{ p: ringPts(50, 40, 16, -1.2), w: 7 }, { p: [[50, 58], [50, 85]], w: 7 }] },
    target:   { s: [{ p: ringPts(50, 50, 27, -0.9), w: 8 }], d: [[50, 50, 9]] },
    wave:     { s: [{ p: [[12, 74], [24, 52], [44, 40], [64, 44], [72, 58], [62, 66], [52, 60], [56, 50]], w: 8 }], d: [[80, 68, 3], [86, 60, 2.5]] },
    wall:     { s: [{ p: [[24, 38], [76, 38]], w: 7 }, { p: [[16, 54], [68, 54]], w: 7 }, { p: [[32, 70], [84, 70]], w: 7 }] },
    lightning:{ s: [{ p: [[58, 12], [40, 46], [56, 46], [38, 86]], w: 7 }] },
    snake:    { s: [{ p: [[22, 80], [42, 68], [28, 52], [52, 38], [70, 28]], w: 6 }], d: [[74, 24, 4.5]] },
    bone:     { s: [{ p: [[50, 30], [50, 70]], w: 7 }], d: [[43, 25, 5], [57, 25, 5], [43, 75, 5], [57, 75, 5]] },
    game:     { s: [{ p: ringPts(50, 50, 26, -1.2), w: 7 }, { p: [[36, 28], [52, 50], [36, 72]], w: 4 }] },
    chart:    { s: [{ p: [[26, 22], [26, 78]], w: 5 }, { p: [[26, 78], [82, 78]], w: 5 }, { p: [[34, 66], [48, 50], [60, 58], [76, 32]], w: 6 }] },
    crescent: { s: [{ p: [[64, 18], [38, 28], [27, 52], [38, 76], [64, 82]], w: 13 }] },
    star:     { s: [{ p: [[50, 16], [50, 84]], w: 6, taper: 'both' }, { p: [[16, 50], [84, 50]], w: 6, taper: 'both' }] },
    check:    { s: [{ p: [[26, 52], [44, 70], [76, 28]], w: 9 }] },
    warning:  { s: [{ p: [[50, 20], [82, 76], [18, 76], [47, 23]], w: 7 }], d: [[50, 58, 5]] },
    magnify:  { s: [{ p: ringPts(44, 42, 18, -1.2), w: 7 }, { p: [[58, 56], [80, 80]], w: 8 }] },
    sword:    { s: [{ p: [[26, 78], [64, 28]], w: 8 }, { p: [[40, 46], [58, 62]], w: 5 }] },
    rose:     { s: [{ p: [[50, 44], [58, 50], [52, 58], [44, 52], [48, 44]], w: 5 }, { p: [[36, 40], [50, 32], [64, 42]], w: 5 }, { p: [[50, 60], [46, 84]], w: 5 }] },
    flame:    { s: [{ p: [[46, 84], [36, 58], [48, 38], [44, 18]], w: 9 }, { p: [[58, 82], [66, 60], [56, 44]], w: 6 }] },
    leaf:     { s: [{ p: [[50, 20], [65, 42], [58, 66], [50, 72], [42, 66], [35, 42], [49, 22]], w: 6 }, { p: [[50, 72], [52, 88]], w: 4 }] },
    sprout:   { s: [{ p: [[50, 86], [50, 50]], w: 5 }, { p: [[50, 58], [36, 48], [28, 36]], w: 6 }, { p: [[50, 66], [64, 54], [72, 44]], w: 6 }] },
    torii:    { s: [{ p: [[10, 28], [50, 20], [90, 28]], w: 9 }, { p: [[22, 42], [78, 42]], w: 6 }, { p: [[28, 38], [24, 86]], w: 8 }, { p: [[72, 38], [76, 86]], w: 8 }] },
    house:    { s: [{ p: [[14, 52], [50, 18], [86, 52]], w: 8 }, { p: [[27, 54], [27, 84], [73, 84], [73, 54]], w: 6 }] },
    road:     { s: [{ p: [[38, 92], [58, 72], [36, 52], [58, 32], [48, 10]], w: 12 }] },
    fork:     { s: [{ p: [[50, 88], [50, 58], [34, 40], [26, 20]], w: 8 }, { p: [[50, 58], [66, 42], [74, 22]], w: 7 }] },
    eye:      { s: [{ p: [[18, 50], [50, 33], [82, 50], [50, 66], [22, 52]], w: 6 }], d: [[50, 49, 6]] },
    compass:  { s: [{ p: ringPts(50, 50, 26, -1.2), w: 7 }, { p: [[38, 62], [62, 38]], w: 6 }], d: [[50, 50, 3.5]] },
    spiral:   { s: [{ p: [[52, 48], [58, 54], [50, 60], [42, 52], [48, 40], [62, 40], [68, 58], [50, 72], [30, 60], [28, 38]], w: 6 }] },
    candle:   { s: [{ p: [[50, 44], [50, 78]], w: 9 }, { p: [[38, 80], [62, 80]], w: 5 }, { p: [[50, 22], [55, 30], [50, 38], [46, 30], [50, 24]], w: 4 }] },
    letter:   { s: [{ p: [[18, 32], [82, 32], [82, 70], [18, 70], [18, 34]], w: 5 }, { p: [[22, 35], [50, 54], [78, 35]], w: 5 }] },
    female:   { s: [{ p: ringPts(50, 36, 15, -1.2), w: 6 }, { p: [[50, 52], [50, 84]], w: 6 }, { p: [[38, 70], [62, 70]], w: 5 }] },
    heart:    { s: [{ p: [[50, 76], [27, 52], [31, 33], [46, 35], [50, 44], [54, 35], [69, 33], [73, 52], [52, 74]], w: 7 }] },
    signal:   { s: [{ p: [[36, 52], [50, 44], [64, 52]], w: 5 }, { p: [[28, 42], [50, 30], [72, 42]], w: 5 }], d: [[50, 62, 5]] },
    coin:     { s: [{ p: ringPts(50, 50, 26, -1.0), w: 8 }, { p: [[40, 50], [60, 50]], w: 5 }] },
    door:     { s: [{ p: [[30, 20], [70, 20], [70, 84], [30, 84], [30, 22]], w: 6 }], d: [[60, 52, 4]] },
    diamond:  { s: [{ p: [[50, 22], [76, 50], [50, 78], [24, 50], [49, 24]], w: 6 }] },
    triangle: { s: [{ p: [[50, 22], [80, 74], [20, 74], [48, 24]], w: 6 }] }
  };
  function motifSVG(name, seed, opts) {
    var m = MOTIFS[name];
    if (!m) return ensoSVG(seed, opts);
    opts = opts || {};
    var fill = opts.color || 'currentColor';
    var body = '';
    m.s.forEach(function (st, i) {
      body += '<path d="' + strokePath(seed + '|' + i, st.p, st.w, st) + '" fill="' + fill + '"/>';
    });
    (m.d || []).forEach(function (d) {
      body += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="' + fill + '"/>';
    });
    return svgWrap(body, opts);
  }

  /* emoji / glyph → motif */
  var EMOJI_MAP = {
    '🌅': 'sunrise', '☀': 'sun', '🌞': 'sun',
    '🪨': 'mountain', '⛰': 'mountain', '🗻': 'mountain',
    '🪷': 'lotus',
    '🤝': 'bond', '🔗': 'bond',
    '🧱': 'wall',
    '⚒': 'hammer', '🔨': 'hammer', '🛠': 'hammer',
    '💧': 'drop', '🌧': 'drop',
    '☯': 'yinyang',
    '🌫': 'fog', '🌬': 'fog', '💨': 'fog',
    '🏋': 'weight',
    '📍': 'pin',
    '🎯': 'target', '◉': 'target',
    '🌊': 'wave',
    '⚡': 'lightning',
    '🐍': 'snake',
    '🦴': 'bone',
    '🎾': 'game',
    '📊': 'chart', '📈': 'chart',
    '🌑': 'crescent', '🌙': 'crescent',
    '✨': 'star', '⭐': 'star', '🌟': 'star', '✦': 'star', '✧': 'star',
    '✅': 'check', '✔': 'check',
    '⚠': 'warning',
    '🔍': 'magnify', '🔎': 'magnify',
    '⚔': 'sword', '🗡': 'sword', '🛡': 'sword', '🥋': 'sword',
    '🌹': 'rose',
    '🔥': 'flame',
    '🕯': 'candle', '🪔': 'candle',
    '🍁': 'leaf', '🍂': 'leaf',
    '🌿': 'sprout', '🌱': 'sprout',
    '🏛': 'torii', '⛩': 'torii',
    '🏠': 'house', '🏡': 'house', '🚪': 'door',
    '🧭': 'compass',
    '🌀': 'spiral',
    '💛': 'heart', '❤': 'heart', '💚': 'heart', '🧡': 'heart',
    '🪞': 'eye', '👁': 'eye',
    '✉': 'letter',
    '♀': 'female',
    '📡': 'signal',
    '💰': 'coin', '🪙': 'coin',
    '◆': 'diamond', '◈': 'diamond',
    '△': 'triangle'
  };
  var EMOJI_KEYS = Object.keys(EMOJI_MAP);
  function motifFor(emojiStr) {
    if (!emojiStr) return null;
    for (var i = 0; i < EMOJI_KEYS.length; i++) {
      if (emojiStr.indexOf(EMOJI_KEYS[i]) !== -1) return EMOJI_MAP[EMOJI_KEYS[i]];
    }
    return null;
  }

  /* replace emojis (and abstract section glyphs) in rendered content with ensō marks */
  var EMOJI_RE = /(?:[⌀-⏿☀-➿⬀-⯿️‍]|[\uD83C-\uD83E][\uDC00-\uDFFF])+/g;
  var GLYPH_RE = /[◆◈✦◉△✧]️?/g;
  var SWEEP_SEL = '[class*="icon"]:not([class*="zen"]):not([class*="enso"]),.eft-section-title,.edge-section-title,.arch-section-title,.drama-subsection-title,.mamba-warning-title,.eft-seq-title>span,.path-title>span';
  var GLYPH_SEL = '.filter-btn,.card-section-tag';
  function markWithEnso(el, re, seed) {
    if (el.dataset.enso || el.closest('.zen-overlay')) return;
    var found = null;
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      re.lastIndex = 0;
      var m = n.nodeValue.match(re);
      if (m) {
        if (!found) found = m[0];
        n.nodeValue = n.nodeValue.replace(re, '').replace(/^\s+/, '');
      }
    });
    if (!found) return;
    el.dataset.enso = '1';
    var host = document.createElement('span');
    host.className = 'enso-host';
    host.innerHTML = motifSVG(motifFor(found), seed);
    // emoji-only marker next to a colored label: borrow its accent
    if (!el.textContent.trim() && el.nextElementSibling && el.nextElementSibling.style && el.nextElementSibling.style.color) {
      host.style.color = el.nextElementSibling.style.color;
    }
    el.insertBefore(host, el.firstChild);
  }
  function ensoSweep(root) {
    root = root || document;
    root.querySelectorAll(SWEEP_SEL).forEach(function (el, idx) {
      markWithEnso(el, EMOJI_RE, (el.className || '') + '|' + el.textContent.slice(0, 24) + '|' + idx);
    });
    // section glyphs: seed by section name so every card of a section carries the same mark
    root.querySelectorAll(GLYPH_SEL).forEach(function (el) {
      markWithEnso(el, GLYPH_RE, 'section-' + el.textContent.replace(GLYPH_RE, '').trim());
    });
  }
  // filtering concepts re-renders filters + cards — re-sweep (and re-theme) after
  function wrapSetF() {
    if (typeof window.setF !== 'function') return;
    var orig = window.setF;
    window.setF = function (s) {
      orig(s);
      var page = document.getElementById('page-concepts');
      if (page) { ensoSweep(page); decorateConceptCards(); glassify(page); if (PREFS.theme === 'light') applyInlineTheme(true, page); }
    };
  }

  /* the 13 chapters, each with a representative brush mark */
  var CONCEPT_MOTIFS = {
    evolution: 'spiral',      // consciousness expanding outward
    karma: 'yinyang',         // cause and effect in balance
    reverence: 'lotus',       // reverence for life
    heart: 'heart',           // the heart as intelligence
    light: 'candle',          // light & nonphysical reality
    intuition: 'eye',         // inner seeing
    intention: 'target',      // intention aimed
    choice: 'fork',           // the engine of choice
    addiction: 'wave',        // riding the craving wave
    relationships: 'bond',    // spiritual partnership
    power: 'mountain',        // authentic power, grounded
    trust: 'torii',           // the sacred threshold
    illusion: 'fog'           // the veil as teacher
  };
  function decorateConceptCards() {
    document.querySelectorAll('.concept-card').forEach(function (card) {
      if (card.querySelector('.chapter-enso')) return;
      var m = (card.getAttribute('onclick') || '').match(/openD\('([^']+)'\)/);
      var c = m && DATA.find(function (x) { return x.id === m[1]; });
      if (!c) return;
      var mark = document.createElement('span');
      mark.className = 'chapter-enso';
      mark.innerHTML = motifSVG(CONCEPT_MOTIFS[c.id], 'ch-' + c.id, { color: c.color });
      card.appendChild(mark);
    });
  }
  function decorateDetail(id) {
    var c = DATA.find(function (x) { return x.id === id; });
    var dc = document.getElementById('detailContent');
    if (!c || !dc || dc.querySelector('.detail-enso')) return;
    var wm = document.createElement('div');
    wm.className = 'detail-enso';
    wm.innerHTML = motifSVG(CONCEPT_MOTIFS[c.id], 'ch-' + c.id, { color: c.color, style: 'width:100%;height:100%' });
    dc.insertBefore(wm, dc.firstChild);
    var num = dc.querySelector('.detail-number');
    if (num) {
      var mk = document.createElement('span');
      mk.className = 'detail-title-enso';
      mk.innerHTML = motifSVG(CONCEPT_MOTIFS[c.id], 'ch-' + c.id, { color: c.color });
      num.insertAdjacentElement('afterend', mk);
    }
  }

  /* ================================================================
     START HERE — curated first-read cross-references per chapter
     (3 picks + adaptive alternates; baked from a curation workflow)
     ================================================================ */
var CURATED = {
    "evolution": { picks: [{"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Names your not-enough fear as the borrowed gaze: build Ontario as a sovereign man, not an applicant."}, {"source": "Attached — Levine & Heller", "why": "Shows the Aloof for what it is: the wall against being held. Letting Marie hold you is the evolution."}, {"source": "When the Body Says No — Maté", "why": "Your wave is instrumentation, not weakness — performed calm overrides the very signal you decide by."}], adaptive: [{"cond": "lowWave", "source": "When Things Fall Apart — Chödrön", "why": "On trough days, don't force resolution — falling apart is your 3-line curriculum, not failure."}, {"cond": "aloofCharged", "source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Your composure is the boyhood amputation still running; your wave is what patriarchy failed to sever."}, {"cond": "poorMeCharged", "source": "Nonviolent Communication — Rosenberg", "why": "Needs aren't burdens — say them as requests. Giving from depletion is jackal turned on yourself."}] },
    "karma": { picks: [{"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Names the engine under both your dramas — buried feeling returning as pattern. Your wave exists to feel it."}, {"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Separates inherited freight from your ledger — the zero start isn't evidence you're not enough."}, {"source": "Nonviolent Communication — Rosenberg", "why": "Hear the need under Marie's frustration; name your own instead of going silent. One sentence stops the loop."}], adaptive: [{"cond": "lowWave", "source": "Letters to a Young Poet — Rilke", "why": "On trough days the sadness may be the future arriving, not the past billing you. Host it, don't audit it."}, {"cond": "aloofCharged", "source": "When Things Fall Apart — Chödrön", "why": "Shenpa is your withdrawal impulse. Feel it without acting on it — that is the Aloof loop's exact break point."}, {"cond": "poorMeCharged", "source": "When the Body Says No — Maté", "why": "Giving from depletion is billed to your body. Interrupt the pattern before it escalates into illness."}] },
    "reverence": { picks: [{"source": "When Things Fall Apart — Chödrön", "why": "Reverence for the parts your calm hides — the direct answer to 'not enough' and the Aloof performance."}, {"source": "Tao Te Ching — Lao Tzu", "why": "Names your season: the low rung beneath your craft is where water gathers — Ọ̀ṣun logic for the $4k climb."}, {"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Love is what you do: the call made when the wave says withdraw is how presence for Marie stays real."}], adaptive: [{"cond": "lowWave", "source": "The Four Agreements — Ruiz", "why": "On trough days 'your best varies daily' — meet the depleted day without reading it as not-enough."}, {"cond": "aloofCharged", "source": "Attached — Levine & Heller", "why": "When Marie starts to look like a demand, that's the avoidant lens, not her — regulate, inform, look again."}, {"cond": "poorMeCharged", "source": "When the Body Says No — Maté", "why": "Giving from depletion is disreverence toward your own body — consult that oracle before you deploy again."}] },
    "heart": { picks: [{"source": "Nonviolent Communication — Rosenberg", "why": "Swaps verdicts for feelings — the one-line grammar that reads your wave and actually reaches Marie."}, {"source": "Of Water and the Spirit — Somé", "why": "Grief needs witness, not composure — micro-rituals for the Douala losses you carry into your first winter."}, {"source": "The Inner Game of Tennis — Gallwey", "why": "Trust the wave: clarity arrives on its own schedule, and a seed is not a failed rose — neither are you."}], adaptive: [{"cond": "lowWave", "source": "Letters to a Young Poet — Rilke", "why": "On trough days: your sadness is the next self arriving — host it, don't handle it offstage."}, {"cond": "aloofCharged", "source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "When Aloof flares: Baldwin names armored composure as slow death — feel the rage, keep the heart open."}, {"cond": "poorMeCharged", "source": "When the Body Says No — Maté", "why": "When Poor Me flares: naming needs is cardiac medicine — silent carrying breaks the body, not just the mood."}] },
    "light": { picks: [{"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Your not-enough fear says imitate; Fanon says your Douala-Ontario in-between is the light only you can emit."}, {"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Don't defer aliveness until the debt clears: your Ọ̀ṣun joy is the fuel of the rebuild, not its reward."}, {"source": "Nonviolent Communication — Rosenberg", "why": "Under the Aloof silence and the depleted giving sit real needs; name them, feed them, the dramas retire."}], adaptive: [{"cond": "lowWave", "source": "Tao Te Ching — Lao Tzu", "why": "On trough days there's no state to build — only debris to set down. Rest at the source; begin again."}, {"cond": "highWave", "source": "Can't Hurt Me — Goggins", "why": "Peak charge is for effort, not decisions: bank the hard run or hard week that tapping can't reach."}, {"cond": "aloofCharged", "source": "Attached — Levine & Heller", "why": "Your silence doesn't protect the wave — it starves the field with Marie. Informing is biology, not chore."}] },
    "intuition": { picks: [{"source": "Letters to a Young Poet — Rilke", "why": "Run the must-I test on each offer: does it arrange around your writing, or quietly replace it?"}, {"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Lorde and hooks name your wave as knowledge, not mood — armor when the job hunt pushes you to override it."}, {"source": "The Inner Game of Tennis — Gallwey", "why": "Your not-enough second-guessing is Self 1 jamming your Ni — this is the drill for quieting it."}], adaptive: [{"cond": "lowWave", "source": "Can't Hurt Me — Goggins", "why": "Trough rule: what only screams at your wave's bottom is negotiation; what survives the settle is signal."}, {"cond": "aloofCharged", "source": "Attached — Levine & Heller", "why": "When Aloof fires, your read on Marie gets less accurate, not more — this names that distortion exactly."}, {"cond": "poorMeCharged", "source": "Nonviolent Communication — Rosenberg", "why": "Before giving from empty again: what am I feeling, what do I need — name the need instead of carrying it."}] },
    "intention": { picks: [{"source": "Deep Work — Newport", "why": "Your $1,960→$4,000 climb becomes daily practice: name one income or debt output, inside fixed hours."}, {"source": "When the Body Says No — Maté", "why": "Your body obeys the hidden intention, not the declared one — ask what 'not enough' is really driving."}, {"source": "Attached — Levine & Heller", "why": "Names your Aloof move in real time: intend to tell Marie when you withdraw, and to repair fast."}], adaptive: [{"cond": "lowWave", "source": "Letters to a Young Poet — Rilke", "why": "Trough days lie about your pace. Applications, debt, Marie — trees in spring: tend them, stop counting days."}, {"cond": "aloofCharged", "source": "Of Water and the Spirit — Somé", "why": "When your silence turns strategic, speak the intention aloud — a stated working closes the door Aloof opens."}, {"cond": "poorMeCharged", "source": "When Things Fall Apart — Chödrön", "why": "Tonglen reverses giving-from-depletion: breathe in the need you deny, breathe out service that refills you."}] },
    "choice": { picks: [{"source": "Tao Te Ching — Lao Tzu", "why": "Your season at true scale: today's application, page, transfer, weather report ARE the thousand-mile choice."}, {"source": "When Things Fall Apart — Chödrön", "why": "The Aloof fires trigger-to-retreat in a second. The pause stretches that gap so you can stay and inform."}, {"source": "Nonviolent Communication — Rosenberg", "why": "Rewrite the have-to list — job hunt, caretaker's ledger — as chosen, and the grind stops breeding resentment."}], adaptive: [{"cond": "lowWave", "source": "Man's Search for Meaning — Frankl", "why": "Trough days strip options; Frankl shows the one choice no wave can take — who you are while it passes."}, {"cond": "aloofCharged", "source": "Feminist Thought — bell hooks · Audre Lorde", "why": "When withdrawal feels like who you are, hooks removes the alibi: it is trained, and refusable, today."}, {"cond": "poorMeCharged", "source": "When the Body Says No — Maté", "why": "Giving from depletion isn't generosity, it's an old adaptation — and your EFT works where it actually lives."}] },
    "addiction": { picks: [{"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Names your job-hunt hazard: craving Canadian validation to prove you're enough. Build your own table."}, {"source": "Letters to a Young Poet — Rilke", "why": "Catches the Aloof's finest tool: analysis as escape. When Marie is raw on a call, presence before commentary."}, {"source": "Tao Te Ching — Lao Tzu", "why": "Guards the money keystone: a written 'enough' line lets income growth close the debt, not move the goalposts."}], adaptive: [{"cond": "lowWave", "source": "Nonviolent Communication — Rosenberg", "why": "On trough days the inner verdict fires first; translate it to a need before the hand reaches for the phone."}, {"cond": "aloofCharged", "source": "Attached — Levine & Heller", "why": "When silence-as-strategy flares: autonomy turned compulsive, distance kept when no threat exists."}, {"cond": "poorMeCharged", "source": "When Things Fall Apart — Chödrön", "why": "Names the Inverted Poor Me's engine: over-giving to dodge having needs. Sit with them; they won't destroy you."}] },
    "relationships": { picks: [{"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Names your Aloof mask at its roots — colonization, masculinity, caretaking — and why Marie can't love a mask."}, {"source": "When the Body Says No — Maté", "why": "Suppressing needs and wave-troughs to look stable for Marie costs your body — informing her is medicine."}, {"source": "Letters to a Young Poet — Rilke", "why": "Written to a young poet — you. The ocean as apprenticeship: two solitudes that protect, border, and greet."}], adaptive: [{"cond": "lowWave", "source": "Nonviolent Communication — Rosenberg", "why": "On trough days: four sentences that carry the low to Marie without silence, blame, or ammunition."}, {"cond": "aloofCharged", "source": "The Inner Game of Tennis — Gallwey", "why": "When Aloof flares: it's Self 1 managing your image — quiet it, let Marie meet the unmanaged you."}, {"cond": "poorMeCharged", "source": "Bhagavad Gita", "why": "When Poor Me flares: your caretaking is attachment — giving to be needed. Bhakti removes the transaction."}] },
    "power": { picks: [{"source": "Can't Hurt Me — Goggins", "why": "Your jar is full — languages, ocean, PR, Bakwa. Write the inventory; read it when 'not enough' speaks."}, {"source": "Deep Work — Newport", "why": "Career capital, not hustle, closes the $1,960→$4,000 gap and pays the debt. Deep hours on craft compound."}, {"source": "Attached — Levine & Heller", "why": "Let Marie see your actual weather: being held multiplies power — you stop defending against being seen."}], adaptive: [{"cond": "lowWave", "source": "When Things Fall Apart — Chödrön", "why": "Trough days shatter earned confidence; hers survives them. Your trials are curriculum, not verdicts."}, {"cond": "highWave", "source": "Bhagavad Gita", "why": "Peak euphoria isn't clarity. Equanimity in pleasure too — decide from the completed wave, not the high."}, {"cond": "aloofCharged", "source": "Nonviolent Communication — Rosenberg", "why": "Names your silence: a boundary held cleanly ends; coldness that teaches a lesson is punishment, not power."}] },
    "trust": { picks: [{"source": "Can't Hurt Me — Goggins", "why": "Your self-trust is a filing cabinet: one kept promise a day funds the debt plan and answers 'not enough'."}, {"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Names both your dramas: the composed mask you send Marie and the hidden ledger — and the truth-telling cure."}, {"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "Fanon and Ngũgĩ trusted through years of no visible fruit — elders for your rebuild's silent first year."}], adaptive: [{"cond": "lowWave", "source": "When Things Fall Apart — Chödrön", "why": "On a trough day: the wave moves, awareness doesn't — trust the ground under you, not the forecast."}, {"cond": "aloofCharged", "source": "Attached — Levine & Heller", "why": "When Aloof flares: Marie's reach needs a response, not an explanation — each withdrawal debits the account."}, {"cond": "poorMeCharged", "source": "Nonviolent Communication — Rosenberg", "why": "When Poor Me flares: she loses trust when needs surface late, not when you have them. Table them now."}] },
    "illusion": { picks: [{"source": "Feminist Thought — bell hooks · Audre Lorde", "why": "Names both your dramas: Aloof armor isn't strength, and the silence swallowing your needs isn't safety."}, {"source": "Deep Work — Newport", "why": "Money pressure will tempt hustle-busyness; depth, not saying yes to everything, gets you to the $4k floor."}, {"source": "Black Radical Thought — Fanon · Ngũgĩ · Diop · Baldwin", "why": "The Canadian market's verdict on your worth is a spell, not a fact — your double sight is the advantage."}], adaptive: [{"cond": "lowWave", "source": "When Things Fall Apart — Chödrön", "why": "On trough days the failures feel like proof of who you are; they're events a past pattern lived, not you."}, {"cond": "aloofCharged", "source": "The Inner Game of Tennis — Gallwey", "why": "When the Aloof flares, watch the impulse without judging — the story only runs while you believe it."}, {"cond": "poorMeCharged", "source": "Attached — Levine & Heller", "why": "Marie can't read your silent weight across an ocean — stating the need is the romance, not its failure."}] },
  };

  // what state is Beet in right now? (drives the adaptive pick)
  function adaptiveCond() {
    var rc = recentCharged();
    if (rc && /aloof/i.test(rc.label || '')) return 'aloofCharged';
    if (rc && /poor\s*me/i.test(rc.label || '')) return 'poorMeCharged';
    var t = waveToday();
    if (t && t.v <= 2) return 'lowWave';
    if (t && t.v >= 5) return 'highWave';
    return null;
  }
  var COND_LABEL = { lowWave: 'for the trough', highWave: 'for the peak', aloofCharged: 'for the aloof pattern', poorMeCharged: 'for the giving-from-empty pattern' };
  function startHerePicks(id) {
    var cur = CURATED[id];
    if (!cur || !cur.picks || cur.picks.length < 3) return null;
    var picks = cur.picks.slice(0, 3).map(function (p) { return { source: p.source, why: p.why }; });
    var cond = adaptiveCond();
    if (cond && cur.adaptive) {
      for (var i = 0; i < cur.adaptive.length; i++) {
        var a = cur.adaptive[i];
        if (a.cond !== cond) continue;
        var dup = -1;
        picks.forEach(function (p, k) { if (p.source === a.source) dup = k; });
        if (dup >= 0) { picks[dup].forToday = cond; picks[dup].why = a.why; }
        else picks[2] = { source: a.source, why: a.why, forToday: cond };
        break;
      }
    }
    return picks;
  }
  function decorateStartHere(id) {
    var picks = startHerePicks(id);
    var c = DATA.find(function (x) { return x.id === id; });
    var first = document.getElementById('cr-' + id + '-0');
    if (!picks || !c || !first || document.querySelector('.starthere')) return;
    var idxBySource = {};
    c.crossReferences.forEach(function (r, i) { idxBySource[r.source] = i; });

    var rows = '';
    picks.forEach(function (p, k) {
      var i = idxBySource[p.source];
      if (i === undefined) return;
      var col = typeof gsc === 'function' ? gsc(p.source) : '#C4A265';
      rows += '<div class="sh-pick glass sh-p' + k + '" data-cr="' + i + '" role="button" tabindex="0">' +
        '<span class="sh-mark" style="color:' + col + '">' + drawEnsoSVG('sh-' + id + '-' + i, { w: 4 }) + '</span>' +
        '<div class="sh-body"><div class="sh-src" style="color:' + col + '">' + esc(p.source) +
          (p.forToday ? '<span class="sh-today">' + (COND_LABEL[p.forToday] || 'for today') + '</span>' : '') + '</div>' +
        '<div class="sh-why">' + esc(p.why) + '</div></div></div>';
    });
    if (!rows) return;

    var essRow = essenceRowFor(id);
    if (essRow) {
      rows += '<div class="sh-pick glass sh-ess" role="button" tabindex="0">' +
        '<span class="sh-mark" style="color:#5A7B8C">' + drawEnsoSVG('sh-ess-' + id, { w: 4, gap: 1.4 }) + '</span>' +
        '<div class="sh-body"><div class="sh-src" style="color:#7E9E8E">From Return to Essence · ' + esc(essRow.label) + '</div>' +
        '<div class="sh-why">' + esc(essRow.why) + '</div></div></div>';
    }

    var box = document.createElement('div');
    box.className = 'starthere';
    box.innerHTML =
      '<div class="sh-title">' + drawEnsoSVG('sh-t-' + id, { w: 6, gap: 1.1 }) + ' Start here</div>' +
      '<div class="sh-sub">Three of the twenty-one, chosen for where you are. The rest will keep.</div>' + rows;
    first.parentNode.insertBefore(box, first);
    var essEl = box.querySelector('.sh-ess');
    if (essEl && essRow) {
      essEl.addEventListener('keydown', kbToggle);
      essEl.onclick = function () { essRow.open(); };
    }

    // mark the chosen cards down in the full list too
    picks.forEach(function (p) {
      var i = idxBySource[p.source];
      if (i === undefined) return;
      var card = document.getElementById('cr-' + id + '-' + i);
      if (!card || card.classList.contains('sh-marked')) return;
      card.classList.add('sh-marked');
      var srcEl = card.querySelector('.crossref-source');
      if (srcEl) {
        var mk = document.createElement('span');
        mk.className = 'sh-cardmark';
        mk.innerHTML = drawEnsoSVG('shc-' + id + '-' + i, { w: 5, style: 'width:14px;height:14px' });
        srcEl.insertAdjacentElement('afterend', mk);
      }
      var body = card.querySelector('.crossref-body');
      if (body) {
        var why = document.createElement('div');
        why.className = 'sh-cardwhy';
        why.textContent = p.why;
        card.insertBefore(why, body);
      }
    });

    box.querySelectorAll('.sh-pick:not(.sh-ess)').forEach(function (el) {
      el.addEventListener('keydown', kbToggle);
      el.onclick = function () {
        var i = +el.dataset.cr;
        var card = document.getElementById('cr-' + id + '-' + i);
        if (!card) return;
        if (!card.classList.contains('expanded') && typeof tCR === 'function') tCR(id, i, { stopPropagation: function () {} });
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
  }

  /* ---------- liquid glass finish ---------- */
  var GLASS_SEL = '.concept-card,.med-card,.eft-seq-card,.dtree-card,.drama-card,.forge-protocol,.crisis-card,.today-card,.today-tile,.path-card,.crossref-card,.edge-card,.zen-banner,.excerpt-block,.proto-section,.lg-item,.tbtn,.zen-btn,.zen-chip,.zsubnav button,.filter-btn,.zen-begin,.back-btn';
  function glassify(root) {
    (root || document).querySelectorAll(GLASS_SEL).forEach(function (el) { el.classList.add('glass'); });
  }
  function glassPoint(g, e) {
    var r = g.getBoundingClientRect();
    g.style.setProperty('--mx', Math.round((e.clientX - r.left) / r.width * 100) + '%');
    g.style.setProperty('--my', Math.round((e.clientY - r.top) / r.height * 100) + '%');
  }
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (g) glassPoint(g, e);
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    glassPoint(g, e);
    g.classList.add('zpress');
    var up = function () {
      g.classList.remove('zpress');
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    };
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }, { passive: true });

  /* faint topical watermark behind each page */
  var PAGE_MOTIFS = {
    'page-today': 'sun', 'page-concepts': null /* ensō */, 'page-map': 'mountain',
    'page-forge': 'flame', 'page-edge': 'wave', 'page-dramas': 'fog',
    'page-arch': 'torii', 'page-mirror': 'eye', 'page-crisis': 'warning',
    'page-trees': 'fork', 'page-eft': 'target', 'page-guide': 'road',
    'page-meditations': 'lotus', 'page-ledger': 'chart',
    'page-essence': 'yinyang', 'page-waters': 'drop'
  };
  function pageEnsoHTML(pageId) {
    return '<div class="page-enso">' +
      motifSVG(PAGE_MOTIFS[pageId], pageId, { w: 8, color: '#C4A265', style: 'width:100%;height:100%' }) +
      '</div>';
  }
  function addPageEnsos() {
    document.querySelectorAll('.page').forEach(function (p) {
      if (p.id === 'page-today' || p.id === 'page-ledger') return; // these render their own
      var d = document.createElement('div');
      d.innerHTML = pageEnsoHTML(p.id);
      p.insertBefore(d.firstChild, p.firstChild);
    });
    var orn = document.querySelector('.header-ornament');
    if (orn) {
      orn.innerHTML = '<span class="line"></span>' +
        motifSVG('torii', 'ornament', { color: 'rgba(196,162,101,0.6)', style: 'width:26px;height:26px' }) +
        '<span class="line"></span>';
    }
  }

  /* ---------- overlay skeleton ---------- */
  var ov = null, Z = {};
  function buildOverlay() {
    if (ov) return;
    ov = document.createElement('div');
    ov.className = 'zen-overlay';
    ov.innerHTML =
      '<div class="zen-bg"><div class="zen-blob b1"></div><div class="zen-blob b2"></div><div class="zen-blob b3"></div>' +
        '<div class="zen-enso">' + drawEnsoSVG('overlay-enso', { w: 2.4, gap: 0.9, color: 'var(--zen-c1,#C4A265)', style: 'width:86vmin;height:86vmin' }) + '</div>' +
        '<div class="zen-grain"></div></div>' +
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
      syncAmbient();
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
    redrawOverlayEnso();
    startAmbient();
  }
  function closeOverlay(fromPop) {
    var cb = S && S.onClose;
    stopSession(); unlockScreen(); stopAmbient();
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

  /* two added sequences: groundedness + returning to center (researched EFT grounding
     scripts; standard point-emotion mapping, written in the manual's voice) */
  var EXTRA_EFT = [
    {
      title: 'For Groundedness',
      icon: '\ud83e\udea8',
      color: '#8B6F47',
      setup: 'Even though I feel scattered across two continents, untethered from ground that knows my name, I deeply and completely accept myself. Even though my mind runs ahead of my body \u2014 to the debt, the winter, the silence after applications \u2014 I deeply and completely accept myself. Even though I have been living from the neck up, I choose to come back into my body now.',
      rounds: [
        { point: 'TH', phrase: 'This scattered, ungrounded energy' },
        { point: 'EB', phrase: 'This mind that lives three months ahead of my feet' },
        { point: 'SE', phrase: 'This body I abandon when the pressure rises' },
        { point: 'UE', phrase: 'This fear that if I slow down, everything falls' },
        { point: 'UN', phrase: 'The ground under me did not disappear when I crossed the ocean' },
        { point: 'CH', phrase: 'My body is the one home that made the crossing with me' },
        { point: 'CB', phrase: 'I feel my feet. I feel the floor. The earth holds weight heavier than mine' },
        { point: 'UA', phrase: 'I am here. Not in January, not in Douala, not in the inbox. Here' }
      ],
      closing: 'Close with: \u2018The ground holds me the same on every continent. My body is home, and I am in it. I choose to be here.\u2019'
    },
    {
      title: 'For Returning to Center',
      icon: '\u262f',
      color: '#C4A265',
      setup: 'Even though the day has pulled me out of my center \u2014 every ping, every demand, every spiral \u2014 I deeply and completely accept myself. Even though I confuse motion with progress and urgency with importance, I deeply and completely accept myself. Even though I forget there is a stillness in me the wave never touches, I choose to return to it now.',
      rounds: [
        { point: 'TH', phrase: 'This pull away from center' },
        { point: 'EB', phrase: 'This urgency that is not mine' },
        { point: 'SE', phrase: 'This scattering \u2014 a piece of me in every open tab' },
        { point: 'UE', phrase: 'This fear that stillness means falling behind' },
        { point: 'UN', phrase: 'The wave moves on the surface. The seabed does not move' },
        { point: 'CH', phrase: 'I do not have to finish the wave to touch the still place beneath it' },
        { point: 'CB', phrase: 'Breath by breath, I return to the solar plexus \u2014 my seat, my center' },
        { point: 'UA', phrase: 'Still water. The mud settles by itself when I stop stirring' }
      ],
      closing: 'Close with: \u2018My center did not move \u2014 I left, and returning takes one breath. Stillness is not something I find. It is something I stop leaving.\u2019'
    }
  ];
  function extendEft() {
    if (typeof EFT === 'undefined' || EFT._extended) return;
    EFT._extended = true;
    EXTRA_EFT.forEach(function (s) { EFT.sequences.push(s); });
    if (typeof renderEft === 'function') renderEft();
  }

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
      Z.zPhrase.innerHTML = motifSVG(motifFor(seq.icon), 'seq-' + seq.title, { color: 'var(--zen-c1,#C4A265)', style: 'width:.85em;height:.85em;vertical-align:-.08em' }) + '&nbsp; ' + seq.title;
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
      if (pi === 0) { cycle++; redrawOverlayEnso(); if (onCycle) onCycle(cycle); }
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
    Z.zRead.onclick = function () { layerHandoff(closeOverlay, function () { openReader('med', i); }); };
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
      '<div class="reader-scroll" id="rScroll"><article class="reader-body" id="rBody"></article></div>' +
      '<div class="page-enso reader-enso">' + ensoSVG('reader', { w: 8, color: '#C4A265', style: 'width:100%;height:100%' }) + '</div>';
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
      h += '<h1 class="reader-title">' + motifSVG(motifFor(m.icon), 'med-' + m.day, { color: '#C4A265', style: 'width:26px;height:26px;margin-right:8px;vertical-align:-3px' }) + m.title + '</h1>';
      h += '<div class="reader-text"><p>' + m.text + '</p></div>';
      if (m.practice) h += '<div class="reader-block"><div class="reader-block-label">The practice</div>' + m.practice + '</div>';
      if (m.carry) h += '<div class="reader-carry">“' + m.carry + '”</div>';
      h += '<div class="reader-fin"></div>';
      h += '<div class="reader-actions"><button class="tbtn" id="rAct1"><span class="zb-orb" style="width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#F2E2AC,#C4A265)"></span> Begin solar plexus breathing</button></div>';
    } else if (kind === 'essence') {
      var s = ESSENCE.sections[i];
      rEls.rKicker.textContent = ('Return to Essence · ' + s.kicker).toUpperCase();
      h += '<h1 class="reader-title">' + motifSVG(s.motif, 'ess-' + s.id, { color: s.color, style: 'width:26px;height:26px;margin-right:8px;vertical-align:-3px' }) + s.title + '</h1>';
      h += '<div class="reader-text">' + s.body + '</div>';
      if (s.parts) s.parts.forEach(function (p) {
        h += '<div class="reader-block"><div class="reader-block-label" style="color:' + s.color + '">' + motifSVG(p.motif, 'essp-' + p.name, { style: 'width:14px;height:14px;margin-right:5px;vertical-align:-2px' }) + p.name + ' — ' + p.gloss + '</div>' + p.text + '</div>';
      });
      if (s.body2) h += '<div class="reader-text">' + s.body2 + '</div>';
      if (s.traditions) s.traditions.forEach(function (t) {
        h += '<div class="reader-block"><div class="reader-block-label">' + t.name + ' · ' + t.force + '</div>Seat: ' + t.seat + ' · Return: ' + t.ret + ' · Residence: ' + t.res + ' · Growth: ' + t.grow + '</div>';
      });
      h += '<div class="reader-fin"></div>';
      if (['return', 'residence', 'conduction'].indexOf(s.id) !== -1) {
        h += '<div class="reader-actions"><button class="tbtn ghost" id="rAct1">Open the practicum &rarr;</button></div>';
      }
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
      ? function () { layerHandoff(closeReader, function () { openMedBreath(i); }); }
      : kind === 'essence'
      ? function () { closeReader(false); navTo('waters'); }
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
    { id: 'today', label: 'Today', motif: 'sun', pages: ['today'] },
    { id: 'learn', label: 'Learn', motif: null, enso: { w: 5.5, gap: 1.9, rot: 2.6 }, pages: ['concepts', 'essence', 'arch', 'mirror', 'dramas', 'guide'] },
    { id: 'practice', label: 'Practice', motif: 'target', pages: ['meditations', 'waters', 'eft', 'forge', 'edge', 'ledger'] },
    { id: 'mapg', label: 'Map', motif: 'road', pages: ['map', 'trees'] },
    { id: 'crisisg', label: 'Crisis', motif: 'warning', pages: ['crisis'] }
  ];
  var PAGE_LABELS = { today: 'Today', concepts: 'Concepts', essence: 'Essence', arch: 'Architecture', mirror: 'Mirror', dramas: 'Dramas', guide: 'Paths', meditations: 'Meditations', waters: 'The Waters', eft: 'EFT', forge: 'Forge', edge: 'Living Edge', ledger: 'Ledger', map: 'The Map', trees: 'Decide', crisis: 'Crisis' };
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
      b.innerHTML = '<span class="zi">' + (g.motif ? motifSVG(g.motif, 'nav-' + g.id) : ensoSVG('nav-' + g.id, g.enso)) + '</span><span>' + g.label + '</span>';
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
    var page = VALID.indexOf(h) !== -1 ? h : 'today';
    activate(page);
    // scope the decoration scans to the page being shown (subnav is rebuilt per activate)
    var el = document.getElementById('page-' + page);
    if (page === 'concepts') decorateConceptCards();
    glassify(el); tintCards(el);
    if (subnavEl) glassify(subnavEl);
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
    waveEditing = false;
    if (page === 'today') renderToday();
    if (page === 'ledger') renderLedger();
    if (page === 'map') decorateMap();
    if (page === 'essence') renderEssence();
    if (page === 'waters') renderWaters();
    if (page === 'guide') decorateEntry();
    if (page === 'eft') refreshEftStats();
    if (page === 'mirror') decorateMirror();
    var pe = document.getElementById('page-' + page);
    if (pe) { var s = pe.querySelector('.page-enso svg'); if (s) { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; } }
  }

  /* ================================================================
     TODAY PAGE
     ================================================================ */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function createPages() {
    var anchor = document.getElementById('page-concepts');
    ['today', 'ledger', 'essence', 'waters'].forEach(function (id) {
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

  var todayCtx = { mi: 0, ci: 0 };
  function buildTodaySections() {
    var now = new Date();
    var mi = todayMedIndex(), m = MEDS[mi];
    var adapt = adaptiveChapter(), ci = adapt.ci, c = DATA[ci];
    var wnow = waveToday(), lowDay = wnow && wnow.v <= 2;
    var hr = now.getHours();
    var slot = hr < 12 ? 'morning' : hr < 18 ? 'day' : 'evening';
    var greet = slot === 'morning' ? 'Good morning, Beet.' : slot === 'day' ? 'Good afternoon, Beet.' : 'Good evening, Beet.';
    var st = weekStats();
    applyWaveTint();
    todayCtx.mi = mi; todayCtx.ci = ci;

    var sec = {};
    sec.head =
      '<div class="today-wavewash"></div>' +
      '<div class="today-date">' + DAYS[now.getDay()].toUpperCase() + ' · ' + MONTHS[now.getMonth()].toUpperCase() + ' ' + now.getDate() + '</div>' +
      '<div class="today-greet">' + greet + '</div>' +
      (function () {
        if (slot !== 'morning') return '';
        var names = orikiAll();
        if (!names.length) return '';
        var n = names[Math.floor(Date.now() / 864e5) % names.length];
        return '<div class="today-oriki">“' + esc(n.name) + '” — spoken aloud, it counts.</div>';
      })();

    sec.wave = waveCardHTML(slot);

    sec.med =
      '<div class="today-sec">' + (slot === 'evening' ? 'Tonight’s Contemplation' : 'Today’s Meditation') + '</div>' +
      '<div class="today-card" id="tdMed">' +
        '<div class="tc-kicker">' + motifSVG(motifFor(m.icon), 'med-' + m.day) + ' ' + m.day + '</div>' +
        '<div class="tc-title">' + m.title + '</div>' +
        (m.carry ? '<div class="tc-sub">“' + m.carry + '”</div>' : '') +
        (lowDay ? '<div class="tc-nudge">A low day — the breath may serve you more than the page.</div>' : '') +
        '<div class="today-actions">' + (lowDay
          ? '<button class="tbtn" id="tdMedBreathe">Breathe</button><button class="tbtn ghost" id="tdMedRead">Read</button>'
          : '<button class="tbtn" id="tdMedRead">Read</button><button class="tbtn ghost" id="tdMedBreathe">Breathe</button>') +
        '</div>' +
      '</div>';

    sec.entry = entryTodayHTML();
    sec.mirror = mirrorCardHTML();
    sec.quarter = quarterCardHTML();

    var er = essenceReadOfDay(), ws = watersSuggestion(slot);
    if (er && ws) {
      todayCtx.essRead = er.i; todayCtx.essPrac = ws;
      sec.essence =
        '<div class="today-sec">Return to Essence</div>' +
        '<div class="today-card" id="tdEss">' +
          '<div class="tc-kicker" style="color:' + er.s.color + '">' + motifSVG(er.s.motif, 'ess-' + er.s.id) + ' ' + er.s.kicker + '</div>' +
          '<div class="tc-title" style="font-size:19px">' + er.s.title + '</div>' +
          '<div class="ess-prac-line">' + motifSVG('drop', 'td-ws', { color: '#5A7B8C', style: 'width:13px;height:13px;vertical-align:-2px;margin-right:5px' }) + '<strong>' + ws.label + '</strong> — ' + ws.sub + '</div>' +
          '<div class="today-actions"><button class="tbtn" id="tdEssRead">Read</button><button class="tbtn ghost" id="tdEssPrac">' + (ws.guided ? 'Begin' : 'The practice') + '</button></div>' +
        '</div>';
    }

    sec.chapter =
      '<div class="today-sec">' + (adapt.reason ? 'For You, Today' : 'Suggested Chapter') + '</div>' +
      '<div class="today-card" id="tdCh">' +
        '<div class="tc-kicker" style="color:' + c.color + '">' + motifSVG(CONCEPT_MOTIFS[c.id], 'ch-' + c.id) + ' Chapter ' + c.number + ' · ' + c.section + '</div>' +
        '<div class="tc-title">' + c.title + '</div>' +
        '<div class="tc-sub">' + (adapt.reason || c.subtitle) + '</div>' +
        '<div class="today-actions"><button class="tbtn" id="tdChRead">Read</button></div>' +
      '</div>';

    sec.practice =
      '<div class="today-sec">Practice</div>' +
      '<div class="today-tiles">' +
        '<button class="today-tile" id="tdTimer"><div class="tt-icon"></div><div class="tt-name">Solar Plexus</div><div class="tt-sub">meditation timer</div></button>' +
        '<button class="today-tile" id="tdEft"><div class="tt-icon violet"></div><div class="tt-name">EFT Tapping</div><div class="tt-sub">guided sequences</div></button>' +
      '</div>';

    var ledgerLine = st.sessions
      ? 'This week: <em>' + st.sessions + ' session' + (st.sessions > 1 ? 's' : '') + '</em>' + (st.minutes ? ' · <em>' + st.minutes + ' min</em> of breath' : '') + ' &rarr;'
      : 'Your ledger is empty. One breath begins it. &rarr;';
    sec.ledger = '<div class="today-ledger-line" id="tdLedger">' + ledgerLine + '</div>';

    var order = slot === 'morning' ? ['head', 'wave', 'entry', 'med', 'essence', 'chapter', 'quarter', 'practice', 'ledger']
      : slot === 'evening' ? ['head', 'wave', 'mirror', 'essence', 'med', 'chapter', 'entry', 'quarter', 'practice', 'ledger']
      : ['head', 'med', 'wave', 'entry', 'essence', 'chapter', 'quarter', 'mirror', 'practice', 'ledger'];
    return { sec: sec, order: order };
  }

  function renderToday() {
    var page = document.getElementById('page-today');
    var b = buildTodaySections();
    page.innerHTML = pageEnsoHTML('page-today') + b.order.map(function (k) {
      return '<div class="tsec" data-tsec="' + k + '">' + (b.sec[k] || '') + '</div>';
    }).join('');
    bindToday(page);
    tintCards(page);
  }
  // partial re-render: only the named sections are rebuilt (wave tap, edit, etc.)
  function refreshToday(keys) {
    var page = document.getElementById('page-today');
    if (!page || !page.querySelector('[data-tsec]')) { renderToday(); return; }
    var b = buildTodaySections();
    keys.forEach(function (k) {
      var w = page.querySelector('[data-tsec="' + k + '"]');
      if (w) w.innerHTML = b.sec[k] || '';
    });
    bindToday(page);
    glassify(page); tintCards(page);
    if (PREFS.theme === 'light') applyInlineTheme(true, page);
  }

  function bindToday(page) {
    var mi = todayCtx.mi, ci = todayCtx.ci;
    function on(id, fn) { var el = page.querySelector('#' + id); if (el) el.onclick = fn; }
    on('tdMed', function () { openReader('med', mi); });
    on('tdMedRead', function (e) { e.stopPropagation(); openReader('med', mi); });
    on('tdMedBreathe', function (e) { e.stopPropagation(); openMedBreath(mi); });
    on('tdCh', function () { openReader('concept', ci); });
    on('tdChRead', function (e) { e.stopPropagation(); openReader('concept', ci); });
    on('tdTimer', openTimer);
    on('tdEft', function () { navTo('eft'); });
    on('tdLedger', function () { navTo('ledger'); });
    on('tdQMap', function (e) { e.stopPropagation(); navTo('map'); });
    on('tdQ', function () { navTo('map'); });
    on('tdWaveEdit', function () { waveEditing = true; refreshToday(['wave']); });
    on('tdEntryCta', function () { navTo('guide'); });
    on('tdEss', function () { if (todayCtx.essRead != null) openReader('essence', todayCtx.essRead); });
    on('tdEssRead', function (e) { e.stopPropagation(); if (todayCtx.essRead != null) openReader('essence', todayCtx.essRead); });
    on('tdEssPrac', function (e) {
      e.stopPropagation();
      var ws = todayCtx.essPrac; if (!ws) return;
      if (ws.guided === 'twowaters') openTwoWaters();
      else if (ws.guided === 'reservoir') openReservoir();
      else { navTo('waters'); setTimeout(function () { var el = document.querySelector('[data-wat="' + ws.id + '"]'); if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 350); }
    });
    on('tdMirrorMore', function () { navTo('mirror'); });
    var mSave = page.querySelector('#tdMirrorSave');
    if (mSave) mSave.onclick = function () {
      var inp = page.querySelector('#tdMirrorInput'), v = inp.value.trim(); if (!v) return;
      journalWrite(v); mSave.textContent = 'Saved ✓'; buzz(15);
    };
    page.querySelectorAll('[data-wave]').forEach(function (b) {
      b.onclick = function () { logWave(+b.dataset.wave, ''); waveEditing = false; refreshToday(['wave', 'med', 'chapter']); buzz(20); };
    });
    page.querySelectorAll('[data-entry]').forEach(function (r) {
      r.addEventListener('keydown', kbToggle);
      r.onclick = function () {
        entryToggle(r.dataset.entry);
        var onNow = entryChecksToday().indexOf(r.dataset.entry) !== -1;
        r.classList.toggle('checked', onNow); r.setAttribute('aria-checked', onNow); var chk = r.querySelector('.q-check'); if (chk) chk.textContent = onNow ? '✓' : '';
        var card = r.closest('#tdEntry'); if (card) {
          var rows = card.querySelectorAll('[data-entry]'), done = 0;
          rows.forEach(function (x) { if (x.classList.contains('checked')) done++; });
          var bar = card.querySelector('.q-prog-bar span'), num = card.querySelector('.q-prog-num'), pct = rows.length ? Math.round(done / rows.length * 100) : 0;
          if (bar) bar.style.width = pct + '%'; if (num) num.textContent = done + '/' + rows.length;
          var kick = card.querySelector('.tc-kicker'); var wi = entryWeekIdx(entryDay()), w = ENTRY.weeks[wi], streak = entryStreak();
          if (kick && w) kick.textContent = w.week + ' · ' + w.focus + (streak > 1 ? ' · ' + streak + '-day streak' : '');
        }
        buzz(12);
      };
    });
    page.querySelectorAll('[data-qa]').forEach(function (r) {
      r.addEventListener('keydown', kbToggle);
      r.onclick = function (e) {
        e.stopPropagation();
        var s = mapStore(), k = r.dataset.qa; s.qa[k] = !s.qa[k]; mapSave(s);
        var onNow = s.qa[k]; r.classList.toggle('checked', onNow); r.setAttribute('aria-checked', onNow); var chk = r.querySelector('.q-check'); if (chk) chk.textContent = onNow ? '✓' : '';
        var card = r.closest('#tdQ'); if (card) {
          var rows = card.querySelectorAll('[data-qa]'), done = 0;
          rows.forEach(function (x) { if (x.classList.contains('checked')) done++; });
          var bar = card.querySelector('.q-prog-bar span'), num = card.querySelector('.q-prog-num'), pct = rows.length ? Math.round(done / rows.length * 100) : 0;
          if (bar) bar.style.width = pct + '%'; if (num) num.textContent = done + '/' + rows.length;
        }
        buzz(12);
      };
    });
  }

  /* ================================================================
     LEDGER PAGE
     ================================================================ */
  function dayLabel(t) {
    var d = new Date(t), today = new Date();
    var midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var yMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime();
    if (t >= midnight) return 'Today';
    if (t >= yMidnight) return 'Yesterday';
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
  }
  function renderLedger() {
    var page = document.getElementById('page-ledger');
    var all = ledgerAll().slice().reverse();
    var st = weekStats();
    var h = pageEnsoHTML('page-ledger') +
      '<div style="margin-bottom:20px"><h2 style="font-family:\'Cormorant Garamond\',serif;font-size:24px;font-weight:400;color:#E8DCC8;margin-bottom:6px">The Ledger</h2>' +
      '<p style="font-size:12.5px;color:rgba(255,255,255,0.35)">A quiet record of practice. No streaks, no scores — just what you’ve done.</p></div>';
    h += '<div class="ledger-stats">' +
      '<div class="ledger-stat"><div class="ls-num">' + st.sessions + '</div><div class="ls-label">this week</div></div>' +
      '<div class="ledger-stat"><div class="ls-num">' + st.minutes + '</div><div class="ls-label">breath minutes</div></div>' +
      '<div class="ledger-stat"><div class="ls-num">' + st.total + '</div><div class="ls-label">all time</div></div>' +
      '</div>';
    h += heatmapHTML();
    h += waveChartHTML();
    h += eftChartHTML();
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
    gear.className = 'zgear';
    gear.innerHTML = ensoSVG('gear', { w: 6, gap: 2.7, rot: 0.5, dot: 7, style: 'width:16px;height:16px' });
    gear.setAttribute('aria-label', 'Settings');
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
    sheet.appendChild(optRow('Sound', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], PREFS.sound ? 'on' : 'off', function (v) { PREFS.sound = v === 'on'; savePrefs(); syncAmbient(); }));
    sheet.appendChild(optRow('Ambient drone', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], PREFS.ambient ? 'on' : 'off', function (v) { PREFS.ambient = v === 'on'; savePrefs(); syncAmbient(); }));
    sheet.appendChild(optRow('Haptics', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], PREFS.haptics ? 'on' : 'off', function (v) { PREFS.haptics = v === 'on'; savePrefs(); }));

    var rp = reminderPrefs();
    sheet.appendChild(optRow('Daily reminders', [{ v: 'on', n: 'On' }, { v: 'off', n: 'Off' }], rp.on ? 'on' : 'off', function (v) {
      if (v === 'on') enableReminders().then(openSheet);
      else disableReminders().then(openSheet);
    }));
    if (rp.on) {
      var rt = document.createElement('div');
      rt.className = 'zset-times';
      rt.innerHTML = '<label>Morning<input type="time" id="remM" value="' + rp.morning + '"></label>' +
        '<label>Evening<input type="time" id="remE" value="' + rp.evening + '"></label>';
      rt.querySelector('#remM').onchange = function (e) { PREFS.reminders.morning = e.target.value || '08:00'; savePrefs(); scheduleReminders(); };
      rt.querySelector('#remE').onchange = function (e) { PREFS.reminders.evening = e.target.value || '20:00'; savePrefs(); scheduleReminders(); };
      sheet.appendChild(rt);
    }
    var rHint = document.createElement('div');
    rHint.className = 'zset-hint';
    rHint.textContent = triggerSupported()
      ? 'A gentle nudge each morning and evening, even when the app is closed.'
      : 'A gentle morning and evening nudge. On iPhone these arrive best while the app has been opened that day; a nudge also greets you inside the app.';
    sheet.appendChild(rHint);

    var data = document.createElement('div');
    data.innerHTML = '<div class="zset-label">Your data</div><div class="zset-row"><button id="zExport">Export backup</button><button id="zImport">Import</button></div><div class="zset-hint">A private JSON backup of your wave, ledger, map, journal and settings — kept only on this device unless you export it.</div>';
    data.querySelector('#zExport').onclick = exportData;
    var fin = document.createElement('input'); fin.type = 'file'; fin.accept = 'application/json,.json'; fin.style.display = 'none';
    fin.onchange = function () { if (fin.files && fin.files[0]) importData(fin.files[0]); };
    data.appendChild(fin);
    data.querySelector('#zImport').onclick = function () { fin.click(); };
    sheet.appendChild(data);
    var wasOpen = sheetWrap.classList.contains('open');
    sheetWrap.classList.add('open');
    if (!wasOpen) pushLayer('sheet');
  }
  function closeSheet(fromPop) { sheetWrap.classList.remove('open'); popLayer('sheet', fromPop); }

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
    retintTheme();
  }
  function themeDetailPanel() {
    var dp = document.getElementById('detailPanel');
    if (!dp) return;
    ensoSweep(dp);
    if (PREFS.theme === 'light') applyInlineTheme(true, dp);
  }
  // concept detail renders fresh HTML — re-theme + re-ensō it when opened
  function wrapOpenD() {
    if (typeof window.openD !== 'function') return;
    var orig = window.openD;
    window.openD = function (id) { orig(id); decorateDetail(id); decorateStartHere(id); themeDetailPanel(); glassify(document.getElementById('detailPanel')); tintCards(document.getElementById('detailPanel')); };
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
  /* ================================================================
     REMINDERS — gentle daily nudges (best-effort local notifications)
     ================================================================ */
  function reminderPrefs() {
    var r = PREFS.reminders || {};
    return { on: !!r.on, morning: r.morning || '08:00', evening: r.evening || '20:00' };
  }
  function notifSupported() { return 'Notification' in window && 'serviceWorker' in navigator; }
  function triggerSupported() { return notifSupported() && 'showTrigger' in Notification.prototype && typeof window.TimestampTrigger !== 'undefined'; }
  var REMINDER_MSGS = {
    morning: { title: 'A minute before the phone', body: 'Check your wave and choose the first move.' },
    evening: { title: 'How did the day land?', body: 'A breath, and the evening Mirror.' }
  };
  function parseHM(hhmm) { var p = String(hhmm).split(':'); return { h: +p[0] || 0, m: +p[1] || 0 }; }
  function nextOccur(hhmm, dayOffset) { var t = parseHM(hhmm), d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(t.h, t.m, 0, 0); return d; }
  var fgTimers = [];
  function clearFgTimers() { fgTimers.forEach(clearTimeout); fgTimers = []; }
  function scheduleReminders() {
    if (!notifSupported() || Notification.permission !== 'granted') return Promise.resolve();
    clearFgTimers();
    return navigator.serviceWorker.ready.then(function (reg) {
      // clear our previously scheduled/shown notifications
      return reg.getNotifications({ includeTriggered: true }).catch(function () { return []; }).then(function (pending) {
        pending.forEach(function (n) { if (n.tag && n.tag.indexOf('soul-rem') === 0) n.close(); });
        var r = reminderPrefs();
        if (!r.on) return;
        var now = Date.now();
        [['morning', r.morning], ['evening', r.evening]].forEach(function (s) {
          var kind = s[0], hhmm = s[1], msg = REMINDER_MSGS[kind];
          if (triggerSupported()) {
            for (var day = 0; day < 7; day++) {
              var when = nextOccur(hhmm, day).getTime();
              if (when <= now + 30000) continue;
              try {
                reg.showNotification(msg.title, {
                  tag: 'soul-rem-' + kind + '-' + nextOccur(hhmm, day).toDateString(),
                  body: msg.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', silent: false,
                  showTrigger: new window.TimestampTrigger(when), data: { url: './#/today' }
                });
              } catch (e) {}
            }
          } else {
            var delay = nextOccur(hhmm, 0).getTime() - now;
            if (delay > 3000 && delay < 20 * 3600 * 1000) {
              fgTimers.push(setTimeout(function () {
                if (Notification.permission === 'granted') navigator.serviceWorker.ready.then(function (rg) {
                  rg.showNotification(msg.title, { body: msg.body, icon: 'icons/icon-192.png', data: { url: './#/today' }, tag: 'soul-rem-fg-' + kind });
                });
              }, delay));
            }
          }
        });
      });
    }).catch(function () {});
  }
  function enableReminders() {
    if (!notifSupported()) { showToast('Notifications aren’t supported here', null); return Promise.resolve(false); }
    var p = Notification.permission === 'default' ? Notification.requestPermission() : Promise.resolve(Notification.permission);
    return Promise.resolve(p).then(function (perm) {
      if (perm !== 'granted') { showToast('Notifications are blocked — allow them in your browser settings', null); return false; }
      PREFS.reminders = reminderPrefs(); PREFS.reminders.on = true; savePrefs();
      return scheduleReminders().then(function () { return true; });
    });
  }
  function disableReminders() {
    PREFS.reminders = reminderPrefs(); PREFS.reminders.on = false; savePrefs();
    clearFgTimers(); return scheduleReminders();
  }
  function maybeInAppNudge() {
    if (!reminderPrefs().on) return;
    var today = todayISO();
    if (PREFS.lastNudge === today) return;
    if (waveToday() || journalToday()) return;
    if (ledgerAll().some(function (e) { return isoDay(e.t) === today; })) return;
    PREFS.lastNudge = today; savePrefs();
    var hr = new Date().getHours();
    var msg = hr < 12 ? 'Good morning — a minute before the day?' : hr < 18 ? 'A pause in the afternoon?' : 'How did the day land? A breath, and the Mirror.';
    setTimeout(function () { showToast(msg, 'Open', function () { navTo('today'); }); }, 1600);
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
      // kept-open PWAs never re-check otherwise: poll hourly + when returning to the app
      var check = function () { reg.update().catch(function () {}); };
      setInterval(check, 3600000);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') check();
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
    fab.innerHTML = motifSVG('sun', 'fab', { color: 'rgba(26,20,10,0.78)', style: 'width:28px;height:28px' });
    fab.onclick = openTimer;
    document.body.appendChild(fab);
  }

  /* ================================================================
     LIFE LAYER — wave check-in · live Map · debt · (Pair 1)
     ================================================================ */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function kbToggle(e) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') { e.preventDefault(); e.currentTarget.click(); } }
  function fmtMoney(n) { return Math.round(n).toLocaleString('en-US'); }
  function store(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function saveStore(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  function isoDay(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function todayISO() { return isoDay(Date.now()); }

  /* ---- wave (emotional authority) ---- */
  var WK = 'soulzen-wave';
  var WAVE_STATES = [
    { v: 1, label: 'In the trough', short: 'Trough', tint: '#5A7B8C' },
    { v: 2, label: 'Low, still moving', short: 'Low', tint: '#6E7FA3' },
    { v: 3, label: 'Level', short: 'Level', tint: '#C4A265' },
    { v: 4, label: 'Rising', short: 'Rising', tint: '#D4A038' },
    { v: 5, label: 'At the peak', short: 'Peak', tint: '#E0B84C' }
  ];
  var waveEditing = false;
  function waveState(v) { var i = Math.max(1, Math.min(5, Math.round(+v) || 3)); return WAVE_STATES[i - 1]; }
  function waveAll() { try { return JSON.parse(localStorage.getItem(WK)) || []; } catch (e) { return []; } }
  function waveSave(a) { saveStore(WK, a.slice(-500)); }
  function waveToday() { var day = todayISO(), a = waveAll(); for (var i = a.length - 1; i >= 0; i--) if (isoDay(a[i].t) === day) return a[i]; return null; }
  function logWave(v, note) {
    var a = waveAll(), day = todayISO();
    for (var i = a.length - 1; i >= 0; i--) { if (isoDay(a[i].t) === day) { a[i] = { t: Date.now(), v: v, note: note || '' }; waveSave(a); return; } }
    a.push({ t: Date.now(), v: v, note: note || '' }); waveSave(a);
  }
  function waveGuidance() {
    var t = waveToday(); if (!t) return '';
    if (t.v <= 2) return 'Low in the wave. Your authority says wait — this is not a deciding day. Let it complete first.';
    if (t.v >= 5) return 'At the peak. The high is information, not a mandate — let a big yes ripen past the crest.';
    return 'Level enough to see clearly. A choice that has moved through a full wave can be made here.';
  }
  function waveSparkline() {
    var a = waveAll(); if (!a.length) return '';
    var byDay = {}; a.forEach(function (e) { byDay[isoDay(e.t)] = e.v; });
    var now = new Date(), days = [], n = 21;
    for (var i = n - 1; i >= 0; i--) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); days.push(byDay[isoDay(d.getTime())] || null); }
    var W = 220, H = 42, pad = 5, pts = [];
    days.forEach(function (v, i) { if (v == null) return; var x = pad + (W - 2 * pad) * i / (n - 1); var y = H - pad - (H - 2 * pad) * ((v - 1) / 4); pts.push([x, y]); });
    if (!pts.length) return '';
    var poly = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var dots = pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.2" fill="var(--wave-tint,#C4A265)"/>'; }).join('');
    return '<svg class="wave-spark" viewBox="0 0 ' + W + ' ' + H + '">' +
      (pts.length > 1 ? '<polyline points="' + poly + '" fill="none" stroke="var(--wave-tint,#C4A265)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>' : '') +
      dots + '</svg>';
  }
  function applyWaveTint() {
    var t = waveToday();
    document.documentElement.style.setProperty('--wave-tint', t ? waveState(t.v).tint : '#C4A265');
    document.body.classList.toggle('has-wave', !!t);
  }
  function waveChartHTML() {
    var a = waveAll(); if (!a.length) return '';
    var byDay = {}; a.forEach(function (e) { byDay[isoDay(e.t)] = e.v; });
    var now = new Date(), N = 30, bars = '', logged = 0;
    for (var i = N - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var v = byDay[isoDay(d.getTime())];
      if (v) {
        logged++;
        var ws = waveState(v);
        bars += '<div class="wc-bar" title="' + isoDay(d.getTime()) + ' · ' + ws.label + '"><span style="height:' + (ws.v / 5 * 100) + '%;background:' + ws.tint + '"></span></div>';
      } else {
        bars += '<div class="wc-bar empty"><span></span></div>';
      }
    }
    return '<div class="ledger-day" style="margin-top:24px">Your Wave · last 30 days</div>' +
      '<div class="wave-chart glass">' +
        '<div class="wc-bars">' + bars + '</div>' +
        '<div class="wc-foot"><span>trough</span><span>' + logged + ' day' + (logged === 1 ? '' : 's') + ' logged</span><span>peak</span></div>' +
      '</div>';
  }
  function waveCardHTML(slot) {
    var wave = waveToday(), spark = waveSparkline();
    if (!wave || waveEditing) {
      var q = slot === 'evening' ? 'How did the day land in you?' : 'Where are you in your wave?';
      return '<div class="today-sec">Emotional Weather</div>' +
        '<div class="today-card glass wave-card" id="tdWave">' +
          '<div class="wave-q">' + q + '</div>' +
          '<div class="wave-scale">' + WAVE_STATES.map(function (w) {
            return '<button class="wave-dot' + (wave && Math.round(+wave.v) === w.v ? ' on' : '') + '" data-wave="' + w.v + '" style="--wd:' + w.tint + '" aria-label="' + w.label + '"><span></span><em>' + w.short + '</em></button>';
          }).join('') + '</div>' +
          (spark ? '<div class="wave-spark-wrap">' + spark + '</div>' : '') +
        '</div>';
    }
    var ws = waveState(wave.v);
    return '<div class="today-sec">Emotional Weather</div>' +
      '<div class="today-card glass wave-card logged" id="tdWave">' +
        '<div class="wave-status"><span class="wave-orb" style="background:' + ws.tint + '"></span>' +
          '<div class="wave-status-body"><div class="wave-state">' + ws.label + (wave.note ? ' · <em>' + esc(wave.note) + '</em>' : '') + '</div>' +
          '<div class="wave-guide">' + waveGuidance() + '</div></div></div>' +
        (spark ? '<div class="wave-spark-wrap">' + spark + '</div>' : '') +
        '<div class="today-actions"><button class="tbtn ghost" id="tdWaveEdit">Change</button></div>' +
      '</div>';
  }

  /* ---- live Map: quarters, milestones, debt ---- */
  var MK = 'soulzen-map';
  function mapStore() { var s = store(MK); s.ms = s.ms || {}; s.qa = s.qa || {}; s.debt = s.debt || { start: 15000, current: 15000, zero: '2028-01-01' }; return s; }
  function mapSave(s) { saveStore(MK, s); }
  function quarterRange(qstr) { var m = String(qstr).match(/Q(\d)\s*(\d{4})/); if (!m) return null; var q = +m[1]; return { y: +m[2], s: (q - 1) * 3, e: (q - 1) * 3 + 2 }; }
  function currentQuarterIndex() {
    if (!window.MAP || !MAP.quarters) return 0;
    var now = new Date(), y = now.getFullYear(), mo = now.getMonth(), items = MAP.quarters.items, i, r;
    for (i = 0; i < items.length; i++) { r = quarterRange(items[i].q); if (r && y === r.y && mo >= r.s && mo <= r.e) return i; }
    for (i = 0; i < items.length; i++) { r = quarterRange(items[i].q); if (r && (y < r.y || (y === r.y && mo <= r.e))) return i; }
    return items.length - 1;
  }
  function debtInfo() {
    var d = mapStore().debt, paid = Math.max(0, d.start - d.current), pct = d.start ? Math.min(100, paid / d.start * 100) : 0;
    var p = String(d.zero).split('-'), zy = +p[0], zm = (+p[1] || 1) - 1, now = new Date();
    var months = Math.max(0, (zy - now.getFullYear()) * 12 + (zm - now.getMonth()));
    return { start: d.start, current: d.current, paid: paid, pct: pct, months: months };
  }
  function quarterCardHTML() {
    if (!window.MAP || !MAP.quarters) return '';
    var qi = currentQuarterIndex(), q = MAP.quarters.items[qi]; if (!q) return '';
    var s = mapStore(), acts = q.actions || [], done = 0;
    var rows = acts.map(function (a, j) {
      var key = 'q' + qi + 'a' + j, on = !!s.qa[key]; if (on) done++;
      return '<div class="q-act' + (on ? ' checked' : '') + '" data-qa="' + key + '" role="checkbox" tabindex="0" aria-checked="' + on + '" aria-label="' + esc(a.tag) + '"><span class="q-check">' + (on ? '✓' : '') + '</span>' +
        '<div class="q-act-body"><div class="q-act-tag">' + a.tag + '</div><div class="q-act-text">' + a.text + '</div></div></div>';
    }).join('');
    var pct = acts.length ? Math.round(done / acts.length * 100) : 0;
    return '<div class="today-sec">This Quarter · ' + q.q + '</div>' +
      '<div class="today-card glass" id="tdQ">' +
        '<div class="tc-kicker" style="color:' + q.focus + '">' + q.window + '</div>' +
        '<div class="tc-title" style="font-size:19px">' + q.theme + '</div>' +
        '<div class="q-prog"><div class="q-prog-bar"><span style="width:' + pct + '%;background:' + q.focus + '"></span></div><span class="q-prog-num">' + done + '/' + acts.length + '</span></div>' +
        rows +
        '<div class="today-actions"><button class="tbtn ghost" id="tdQMap">Open the Map →</button></div>' +
      '</div>';
  }
  function debtBarHTML() {
    var d = debtInfo();
    return '<div class="today-sec">The Debt</div>' +
      '<div class="today-card glass" id="tdDebt">' +
        '<div class="debt-row"><span class="debt-cur">$' + fmtMoney(d.current) + '</span><span class="debt-meta">$' + fmtMoney(d.paid) + ' cleared · ' + d.months + ' mo to zero</span></div>' +
        '<div class="debt-bar"><span style="width:' + d.pct.toFixed(0) + '%"></span></div>' +
        '<div class="debt-foot">Zero date · Jan 2028 — tap to update</div>' +
      '</div>';
  }
  function renderMapDebt() {
    var host = document.getElementById('mapDebt'); if (!host) return; var d = debtInfo();
    host.innerHTML = '<div class="mapdebt glass">' +
      '<div class="mapdebt-head"><span class="mapdebt-title">Debt Thermometer</span><span class="mapdebt-zero">zero · Jan 2028</span></div>' +
      '<div class="mapdebt-nums"><span class="mapdebt-cur">$' + fmtMoney(d.current) + '</span><span class="mapdebt-sub">remaining · $' + fmtMoney(d.paid) + ' cleared · ' + d.months + ' mo left</span></div>' +
      '<div class="debt-bar big"><span style="width:' + d.pct.toFixed(0) + '%"></span></div>' +
      '<div class="mapdebt-form"><input id="mapDebtInput" type="text" inputmode="text" autocomplete="off" placeholder="new balance, or -payment" /><button class="tbtn" id="mapDebtSave">Update</button></div>' +
      '<div class="mapdebt-hint">Enter a new balance, or a negative number (e.g. -250) to log a payment.</div>' +
    '</div>';
    host.querySelector('#mapDebtSave').onclick = function () {
      var el = host.querySelector('#mapDebtInput'), v = parseFloat(el.value); if (isNaN(v)) return;
      var s = mapStore(); s.debt.current = v < 0 ? Math.max(0, s.debt.current + v) : Math.max(0, v); mapSave(s);
      renderMapDebt(); buzz(20);
      if (document.getElementById('page-today').classList.contains('active')) renderToday();
    };
    glassify(host);
  }
  function addCheck(el, bag, key) {
    var s = mapStore(), on = !!s[bag][key];
    el.classList.add('has-check'); el.classList.toggle('checked', on); el.dataset.ckey = bag + '|' + key;
    var b = document.createElement('button'); b.className = 'mcheck'; b.textContent = on ? '✓' : '';
    b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', 'Mark done');
    b.onclick = function (e) {
      e.stopPropagation(); var st = mapStore(); st[bag][key] = !st[bag][key]; mapSave(st);
      var nowOn = st[bag][key]; b.textContent = nowOn ? '✓' : ''; b.setAttribute('aria-pressed', nowOn); el.classList.toggle('checked', nowOn); buzz(12);
    };
    el.insertBefore(b, el.firstChild);
  }
  function syncMapChecks() {
    var s = mapStore();
    document.querySelectorAll('#mapContent [data-ckey]').forEach(function (el) {
      var parts = el.dataset.ckey.split('|'), on = !!(s[parts[0]] && s[parts[0]][parts[1]]);
      el.classList.toggle('checked', on);
      var b = el.querySelector('.mcheck'); if (b) b.textContent = on ? '✓' : '';
    });
  }
  function decorateMap() {
    var mc = document.getElementById('mapContent'); if (!mc) return;
    if (mc.dataset.live) { renderMapDebt(); syncMapChecks(); return; }
    mc.dataset.live = '1';
    var dp = document.createElement('div'); dp.id = 'mapDebt'; mc.insertBefore(dp, mc.firstChild); renderMapDebt();
    mc.querySelectorAll('.map-hz').forEach(function (hz, i) { hz.querySelectorAll('.map-ms').forEach(function (ms, j) { addCheck(ms, 'ms', 'h' + i + 'm' + j); }); });
    mc.querySelectorAll('.map-q').forEach(function (q, i) { q.querySelectorAll('.map-act').forEach(function (act, j) { addCheck(act, 'qa', 'q' + i + 'a' + j); }); });
    tintCards(mc);
  }

  /* ================================================================
     LIFE LAYER 2 — 30-day entry · EFT charts · adaptive · heatmap
     ================================================================ */
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  function dayMidnight(t) { var d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

  /* ---- 30-Day Entry program ---- */
  var EK = 'soulzen-entry';
  function entryStore() { var s = store(EK); s.checks = s.checks || {}; return s; }
  function entrySave(s) { saveStore(EK, s); }
  function entryStarted() { return !!entryStore().start; }
  function entryDay() { var s = entryStore(); if (!s.start) return 0; return Math.round((dayMidnight(Date.now()) - dayMidnight(s.start)) / 864e5) + 1; }
  function entryWeekIdx(day) { return Math.max(0, Math.min(3, Math.floor((day - 1) / 7))); }
  function entryStartToday() { var s = entryStore(); s.start = dayMidnight(Date.now()); entrySave(s); }
  function entryReset() { saveStore(EK, { checks: {} }); }
  function entryChecksToday() { return entryStore().checks[todayISO()] || []; }
  function entryToggle(key) {
    var s = entryStore(), day = todayISO(), arr = s.checks[day] || [], i = arr.indexOf(key);
    if (i === -1) arr.push(key); else arr.splice(i, 1);
    s.checks[day] = arr; entrySave(s);
  }
  function entryStreak() {
    var s = entryStore(); if (!s.start) return 0; var streak = 0, d = new Date();
    for (var back = 0; back < 90; back++) {
      var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
      var has = (s.checks[isoDay(day.getTime())] || []).length > 0;
      if (has) streak++; else if (back > 0) break;
    }
    return streak;
  }
  function entryTodayHTML() {
    if (typeof ENTRY === 'undefined') return '';
    if (!entryStarted()) return '<button class="today-entry-cta glass" id="tdEntryCta">Begin the 30-Day Entry — one small thing at a time →</button>';
    var day = entryDay();
    if (day > 30) return '<div class="today-sec">The 30-Day Entry</div>' +
      '<div class="today-card glass" id="tdEntry"><div class="tc-kicker">Complete</div><div class="tc-title" style="font-size:19px">Thirty days done.</div><div class="tc-sub">The rhythm is yours now — revisit any week from Paths.</div></div>';
    var wi = entryWeekIdx(day), w = ENTRY.weeks[wi], checks = entryChecksToday(), streak = entryStreak(), done = 0;
    var items = w.items.map(function (it, j) {
      var key = 'w' + wi + 'i' + j, on = checks.indexOf(key) !== -1; if (on) done++;
      return '<div class="q-act' + (on ? ' checked' : '') + '" data-entry="' + key + '" role="checkbox" tabindex="0" aria-checked="' + on + '"><span class="q-check">' + (on ? '✓' : '') + '</span><div class="q-act-body"><div class="q-act-text" style="-webkit-line-clamp:3">' + it + '</div></div></div>';
    }).join('');
    return '<div class="today-sec">The 30-Day Entry · Day ' + day + ' of 30</div>' +
      '<div class="today-card glass" id="tdEntry" style="border-left:3px solid ' + w.color + '">' +
        '<div class="tc-kicker" style="color:' + w.color + '">' + w.week + ' · ' + w.focus + (streak > 1 ? ' · ' + streak + '-day streak' : '') + '</div>' +
        '<div class="tc-title" style="font-size:19px">' + w.title + '</div>' +
        '<div class="q-prog"><div class="q-prog-bar"><span style="width:' + (done / w.items.length * 100) + '%;background:' + w.color + '"></span></div><span class="q-prog-num">' + done + '/' + w.items.length + '</span></div>' +
        items +
      '</div>';
  }
  function decorateEntry() {
    var host = document.getElementById('moneyEntry'); if (!host) return;
    var sec = null; host.querySelectorAll('.proto-section').forEach(function (s) { if (s.querySelector('.entry-week')) sec = s; });
    if (!sec) return;
    var panel = sec.querySelector('#entryTracker');
    if (!panel) { panel = document.createElement('div'); panel.id = 'entryTracker'; var intro = sec.querySelector('.proto-intro'); if (intro) intro.insertAdjacentElement('afterend', panel); else sec.insertBefore(panel, sec.firstChild); }
    renderEntryTracker();
    tintCards(host);
  }
  function renderEntryTracker() {
    var panel = document.getElementById('entryTracker'); if (!panel) return;
    if (!entryStarted()) {
      panel.innerHTML = '<div class="entry-tracker glass"><div class="et-title">The onramp</div><div class="et-sub">Begin when you’re ready. Thirty days, one small thing at a time — today’s items will appear on your Today screen.</div><button class="tbtn" id="etStart">Begin the 30-Day Entry</button></div>';
      panel.querySelector('#etStart').onclick = function () { entryStartToday(); renderEntryTracker(); buzz(20); };
    } else {
      var day = entryDay(), done = day > 30;
      panel.innerHTML = '<div class="entry-tracker glass"><div class="et-head"><span class="et-day">' + (done ? 'Complete' : 'Day ' + day + ' of 30') + '</span><span class="et-streak">' + entryStreak() + '-day streak</span></div>' +
        '<div class="et-bar"><span style="width:' + Math.min(100, day / 30 * 100) + '%"></span></div>' +
        '<div class="et-sub">' + (done ? 'The thirty days are done — the weeks below stay as reference.' : 'Today’s items live on your Today screen. The four weeks below are the full protocol.') + '</div>' +
        '<button class="tbtn ghost" id="etReset">Reset</button></div>';
      panel.querySelector('#etReset').onclick = function () { if (confirm('Reset the 30-Day Entry? Its check history will be cleared.')) { entryReset(); renderEntryTracker(); } };
    }
    glassify(panel);
  }

  /* ---- adaptive suggestion ---- */
  function chapterIdx(id) { var i = DATA.findIndex(function (c) { return c.id === id; }); return i === -1 ? suggestedChapterIndex() : i; }
  function recentCharged() {
    // judge only the genuine most-recent rated tap within the window
    var cut = Date.now() - 2 * 864e5, l = ledgerAll();
    for (var i = l.length - 1; i >= 0; i--) {
      var e = l[i]; if (e.k !== 'tap' || e.t < cut) continue;
      if (e.after == null) continue;
      return e.after >= 6 ? e : null;
    }
    return null;
  }
  function adaptiveChapter() {
    var t = waveToday(), rc = recentCharged();
    if (rc) return { ci: chapterIdx('addiction'), reason: 'Your last tapping (“' + esc(rc.label) + '”) stayed near ' + rc.after + '. Inner Healing speaks to what stays charged.' };
    if (t && t.v <= 2) return { ci: chapterIdx('illusion'), reason: 'You logged low today — this one reframes the trough as teacher, not verdict.' };
    if (t && t.v >= 5) return { ci: chapterIdx('intention'), reason: 'You’re at the peak — a clear day to aim intention.' };
    return { ci: suggestedChapterIndex(), reason: '' };
  }

  /* ---- EFT before→after aggregation ---- */
  function eftAgg() { var l = ledgerAll(), by = {}; l.forEach(function (e) { if (e.k !== 'tap') return; var k = e.label || 'Session'; (by[k] = by[k] || []).push(e); }); return by; }
  function eftChartHTML() {
    var by = eftAgg(), keys = Object.keys(by); if (!keys.length) return '';
    var h = '<div class="ledger-day" style="margin-top:24px">EFT · charge before → after</div><div class="eft-prog">';
    keys.forEach(function (k) {
      var arr = by[k], both = arr.filter(function (e) { return e.before != null && e.after != null; });
      var meta = arr.length + ' session' + (arr.length > 1 ? 's' : ''), body;
      if (both.length) {
        var b = avg(both.map(function (e) { return e.before; })), a = avg(both.map(function (e) { return e.after; })), dd = b - a;
        meta += Math.abs(dd) < 0.05 ? ' · no avg change' : dd > 0 ? ' · avg drop ' + dd.toFixed(1) : ' · avg rise ' + (-dd).toFixed(1);
        body = '<div class="ep-nums"><span class="ep-before">' + b.toFixed(1) + '</span><span class="ep-arrow">→</span><span class="ep-after">' + a.toFixed(1) + '</span></div>' +
          '<div class="ep-bars"><div class="ep-track"><span class="ep-fill b" style="width:' + (b / 10 * 100) + '%"></span></div><div class="ep-track"><span class="ep-fill a" style="width:' + (a / 10 * 100) + '%"></span></div></div>';
      } else { body = '<div class="ep-nums"><span class="ep-none">intensity not logged</span></div>'; }
      h += '<div class="ep-row glass"><div class="ep-title">' + esc(k) + '</div><div class="ep-meta">' + meta + '</div>' + body + '</div>';
    });
    return h + '</div>';
  }
  function refreshEftStats() {
    if (typeof EFT === 'undefined') return; var by = eftAgg();
    document.querySelectorAll('.eft-seq-card').forEach(function (card, i) {
      var seq = EFT.sequences[i]; if (!seq) return; var arr = by[seq.title] || [], el = card.querySelector('.eft-stat');
      if (!arr.length) { if (el) el.remove(); return; }
      var both = arr.filter(function (e) { return e.before != null && e.after != null; });
      var txt = arr.length + ' session' + (arr.length > 1 ? 's' : '');
      if (both.length) txt = 'avg ' + avg(both.map(function (e) { return e.before; })).toFixed(1) + ' → ' + avg(both.map(function (e) { return e.after; })).toFixed(1) + ' · ' + txt;
      if (!el) { el = document.createElement('div'); el.className = 'eft-stat'; var hint = card.querySelector('.eft-seq-hint'); if (hint) hint.insertAdjacentElement('afterend', el); else card.appendChild(el); }
      el.textContent = txt;
    });
  }

  /* ---- practice heatmap ---- */
  function heatmapHTML() {
    var l = ledgerAll(); if (!l.length) return '';
    var byDay = {}; l.forEach(function (e) { var k = isoDay(e.t); byDay[k] = (byDay[k] || 0) + 1; });
    var now = new Date(), end = new Date(now.getFullYear(), now.getMonth(), now.getDate()), weeks = 12;
    var lastSun = new Date(end.getFullYear(), end.getMonth(), end.getDate() - end.getDay());
    var firstSun = new Date(lastSun.getFullYear(), lastSun.getMonth(), lastSun.getDate() - 7 * (weeks - 1));
    var html = '<div class="heat">';
    for (var w = 0; w < weeks; w++) {
      html += '<div class="heat-col">';
      for (var dd = 0; dd < 7; dd++) {
        var cell = new Date(firstSun.getFullYear(), firstSun.getMonth(), firstSun.getDate() + w * 7 + dd);
        if (cell.getTime() > end.getTime()) { html += '<div class="heat-cell future"></div>'; continue; }
        var cnt = byDay[isoDay(cell.getTime())] || 0, lvl = cnt === 0 ? 0 : cnt === 1 ? 1 : cnt === 2 ? 2 : cnt <= 4 ? 3 : 4;
        html += '<div class="heat-cell l' + lvl + '" title="' + isoDay(cell.getTime()) + ' · ' + cnt + ' session' + (cnt === 1 ? '' : 's') + '"></div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return '<div class="ledger-day" style="margin-top:24px">Practice · last 12 weeks</div><div class="heatmap glass">' + html +
      '<div class="heat-legend"><span>less</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>more</span></div></div>';
  }

  /* ---- tinted cards: whole-card wash for one-sided-border cards ---- */
  function toRGB(c) {
    if (!c) return null;
    var m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    m = c.match(/^#([0-9a-fA-F]{6})$/); if (m) { var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    m = c.match(/^#([0-9a-fA-F]{3})$/); if (m) { return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)]; }
    return null;
  }
  function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }
  function inlineAccent(el) {
    var s = el.getAttribute('style') || '';
    var m = s.match(/border-(?:left|top|right|bottom|color)\s*:[^;]*?(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/);
    return m ? m[1] : null;
  }
  var TINT_SEL = '.map-hz, .map-q, .map-thread, .proto-block, .entry-week, .map-cadence-row, #tdEntry, .forge-card, .masc-card, .orisha-card, .orisha-teaching, .mirror-quote, .crisis-card, .excerpt-block, .eft-seq-card, .forge-protocol, .dtree-card, .drama-card';
  function tintCards(root) {
    (root || document).querySelectorAll(TINT_SEL).forEach(function (el) {
      if (el.dataset.tinted) return;
      var rgb = toRGB(inlineAccent(el)); if (!rgb) return;
      el.dataset.tinted = '1';
      el.classList.add('tinted-card', 'glass');
      var light = PREFS.theme === 'light';
      el.style.setProperty('--tint', rgba(rgb, 1));
      el.style.setProperty('--tint-bg', rgba(rgb, light ? 0.16 : 0.13));
      el.style.setProperty('--tint-bg2', rgba(rgb, light ? 0.06 : 0.04));
      el.style.setProperty('--tint-bd', rgba(rgb, light ? 0.34 : 0.3));
      el.style.borderLeft = ''; el.style.borderTop = ''; el.style.borderRight = ''; el.style.borderBottom = ''; el.style.borderColor = '';
    });
  }
  function retintTheme() {
    var light = PREFS.theme === 'light';
    document.querySelectorAll('.tinted-card').forEach(function (el) {
      var rgb = toRGB(el.style.getPropertyValue('--tint')); if (!rgb) return;
      el.style.setProperty('--tint-bg', rgba(rgb, light ? 0.16 : 0.13));
      el.style.setProperty('--tint-bg2', rgba(rgb, light ? 0.06 : 0.04));
      el.style.setProperty('--tint-bd', rgba(rgb, light ? 0.34 : 0.3));
    });
  }

  /* ================================================================
     LIFE LAYER 3 — Mirror journal · export/backup  (Pair 3)
     ================================================================ */
  var JOURNAL_PROMPTS = [
    'Where did you choose presence over performance today?',
    'What did you meet today that asked you to become someone new?',
    'What are you gripping that is already leaving?',
    'Where did the fear of not being enough steer you — and what would love have done instead?',
    'What did you give today, and did it come from fullness or from depletion?',
    'What truth did you not say out loud today?',
    'Where did you move first, as the one who initiates, instead of waiting?',
    'What went well today that you would normally overlook?',
    'What did today teach you about the man you are becoming?',
    'Where did you touch your center — and where did you lose it?',
    'What are you grateful for, in this exact configuration of your life?',
    'What small thing, handled today, kept a larger thing from growing?'
  ];
  function journalPromptIdx() { var n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5) % JOURNAL_PROMPTS.length; }
  var JK = 'soulzen-journal';
  function journalAll() { try { return JSON.parse(localStorage.getItem(JK)) || []; } catch (e) { return []; } }
  function journalSave(a) { saveStore(JK, a.slice(-500)); }
  function journalToday() { var day = todayISO(), a = journalAll(); for (var i = a.length - 1; i >= 0; i--) if (isoDay(a[i].t) === day) return a[i]; return null; }
  function journalWrite(text) {
    var a = journalAll(), day = todayISO(), q = JOURNAL_PROMPTS[journalPromptIdx()];
    for (var i = a.length - 1; i >= 0; i--) { if (isoDay(a[i].t) === day) { a[i].a = text; a[i].q = q; a[i].t = Date.now(); journalSave(a); return; } }
    a.push({ t: Date.now(), q: q, a: text }); journalSave(a);
  }
  function mirrorCardHTML() {
    var q = JOURNAL_PROMPTS[journalPromptIdx()], j = journalToday();
    return '<div class="today-sec">Evening Mirror</div>' +
      '<div class="today-card glass mirror-card" id="tdMirror">' +
        '<div class="mirror-q">' + q + '</div>' +
        '<textarea class="mirror-input" id="tdMirrorInput" rows="2" placeholder="One honest line…">' + (j ? esc(j.a) : '') + '</textarea>' +
        '<div class="today-actions"><button class="tbtn" id="tdMirrorSave">' + (j ? 'Saved ✓' : 'Save') + '</button>' +
          '<button class="tbtn ghost" id="tdMirrorMore">Past reflections →</button></div>' +
      '</div>';
  }
  function decorateMirror() {
    var mc = document.getElementById('mirrorContent'); if (!mc) return;
    var panel = document.getElementById('mirrorJournal');
    if (!panel) { panel = document.createElement('div'); panel.id = 'mirrorJournal'; mc.insertBefore(panel, mc.firstChild); }
    renderMirrorJournal();
  }
  function renderMirrorJournal() {
    var panel = document.getElementById('mirrorJournal'); if (!panel) return;
    var q = JOURNAL_PROMPTS[journalPromptIdx()], j = journalToday(), all = journalAll().slice().reverse();
    var past = all.filter(function (e) { return e.a; }).map(function (e) {
      return '<div class="mj-entry glass"><div class="mj-date">' + dayLabel(e.t) + '</div><div class="mj-q">' + esc(e.q || '') + '</div><div class="mj-a">' + esc(e.a) + '</div></div>';
    }).join('');
    panel.innerHTML = '<div class="mj-head"><h3 class="mj-title">The Mirror Journal</h3><p class="mj-sub">One honest line a day. Private to this device.</p></div>' +
      '<div class="mj-today glass"><div class="mirror-q">' + q + '</div><textarea class="mirror-input" id="mjInput" rows="2" placeholder="One honest line…">' + (j ? esc(j.a) : '') + '</textarea><button class="tbtn" id="mjSave">' + (j ? 'Saved ✓' : 'Save') + '</button></div>' +
      (past ? '<div class="mj-list">' + past + '</div>' : '<div class="mj-empty">No reflections yet. Tonight can be the first.</div>');
    var save = panel.querySelector('#mjSave'), inp = panel.querySelector('#mjInput');
    save.onclick = function () { var v = inp.value.trim(); if (!v) return; journalWrite(v); renderMirrorJournal(); buzz(15); if (document.getElementById('page-today').classList.contains('active')) renderToday(); };
    glassify(panel);
  }

  /* ---- export / import backup ---- */
  function exportData() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('soulzen') === 0) out[k] = localStorage.getItem(k); }
    var payload = { app: 'soul-manual', version: 1, exported: new Date().toISOString(), data: out };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'soul-manual-backup-' + todayISO() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  function importData(file) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var obj = JSON.parse(rd.result), data = obj && obj.data ? obj.data : obj;
        if (!data || typeof data !== 'object') throw 0;
        var keys = Object.keys(data).filter(function (k) { return k.indexOf('soulzen') === 0; });
        if (!keys.length) throw 0;
        keys.forEach(function (k) { localStorage.setItem(k, data[k]); });
        alert('Backup restored — ' + keys.length + ' items. Reloading.'); location.reload();
      } catch (e) { alert('That file could not be read as a Soul Manual backup.'); }
    };
    rd.readAsText(file);
  }

  /* ================================================================
     RETURN TO ESSENCE + THE WATERS  (The Grammar of Return)
     Honors the Anti-Performance Clause (3.9): nothing here logs to the
     practice ledger, appears in the heatmap, or counts a streak.
     ================================================================ */
  var KWK = 'soulzen-keptword', OKK = 'soulzen-oriki', AFK = 'soulzen-waters';
  function kwAll() { try { return JSON.parse(localStorage.getItem(KWK)) || []; } catch (e) { return []; } }
  function orikiAll() { try { return JSON.parse(localStorage.getItem(OKK)) || []; } catch (e) { return []; } }
  function afoseStore() { var s = store(AFK); s.afose = s.afose || []; return s; }
  function latestAfose() { var a = afoseStore().afose; return a.length ? a[a.length - 1] : null; }

  function fnChip(fn) {
    if (!fn) return '';
    var cls = fn === 'REPAIR' ? 'repair' : fn === 'GROW' ? 'grow' : 'maintain';
    return '<span class="wfn ' + cls + '">' + fn + '</span>';
  }

  function renderEssence() {
    var page = document.getElementById('page-essence');
    if (!page || page.dataset.done || typeof ESSENCE === 'undefined') return;
    page.dataset.done = '1';
    var h = pageEnsoHTML('page-essence') +
      '<div style="margin-bottom:20px"><h2 style="font-family:\'Cormorant Garamond\',serif;font-size:24px;font-weight:400;color:#E8DCC8;margin-bottom:6px">' + ESSENCE.title + '</h2>' +
      '<p style="font-size:12.5px;line-height:1.7;color:rgba(255,255,255,0.42)">' + ESSENCE.sub + '</p></div>';
    ESSENCE.sections.forEach(function (s, i) {
      h += '<div class="ess-card glass" data-ess="' + i + '" style="border-left:3px solid ' + s.color + '">' +
        '<div class="ess-kicker" style="color:' + s.color + '">' + s.kicker + '</div>' +
        '<div class="ess-title">' + motifSVG(s.motif, 'ess-' + s.id, { color: s.color }) + ' ' + s.title + '</div>' +
        '<div class="ess-body" id="essb-' + i + '">' +
          '<div class="ess-text">' + s.body + '</div>' +
          (s.parts ? s.parts.map(function (p) {
            return '<div class="ess-part"><div class="ess-part-head" style="color:' + s.color + '">' + motifSVG(p.motif, 'essp-' + p.name) + ' <strong>' + p.name + '</strong> — ' + p.gloss + '</div><div class="ess-part-text">' + p.text + '</div></div>';
          }).join('') : '') +
          (s.body2 ? '<div class="ess-text">' + s.body2 + '</div>' : '') +
          (s.traditions ? s.traditions.map(function (t) {
            return '<div class="ess-trad"><div class="ess-trad-name">' + t.name + ' · <em>' + t.force + '</em></div><div class="ess-trad-row"><span>Seat</span>' + t.seat + '</div><div class="ess-trad-row"><span>Return</span>' + t.ret + '</div><div class="ess-trad-row"><span>Residence</span>' + t.res + '</div><div class="ess-trad-row"><span>Growth</span>' + t.grow + '</div></div>';
          }).join('') : '') +
          '<div class="today-actions"><button class="tbtn" data-essread="' + i + '">Read</button>' +
          (['return', 'residence', 'conduction'].indexOf(s.id) !== -1 ? '<button class="tbtn ghost" data-esswaters="1">The practicum &rarr;</button>' : '') +
          '</div>' +
        '</div></div>';
    });
    page.innerHTML = h;
    page.querySelectorAll('.ess-card').forEach(function (card) {
      card.onclick = function (e) {
        if (e.target.closest('button')) return;
        card.classList.toggle('open');
      };
    });
    page.querySelectorAll('[data-essread]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); openReader('essence', +b.dataset.essread); };
    });
    page.querySelectorAll('[data-esswaters]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); navTo('waters'); };
    });
    if (PREFS.theme === 'light') applyInlineTheme(true, page);
  }

  function renderWaters() {
    var page = document.getElementById('page-waters');
    if (!page || typeof WATERS === 'undefined') return;
    var h = pageEnsoHTML('page-waters') +
      '<div style="margin-bottom:18px"><h2 style="font-family:\'Cormorant Garamond\',serif;font-size:24px;font-weight:400;color:#E8DCC8;margin-bottom:6px">' + WATERS.title + '</h2>' +
      '<p style="font-size:12.5px;line-height:1.7;color:rgba(255,255,255,0.42)">' + WATERS.sub + '</p></div>';
    h += '<div class="wprin glass"><div class="ess-kicker" style="color:#C4A265">Principles before procedure</div>' +
      '<div class="wprin-body">' + WATERS.principles.growth + WATERS.principles.polarity + WATERS.principles.safety + WATERS.principles.load + '</div>' +
      '<button class="eft-read-link" id="wPrinMore">read the principles ▾</button></div>';
    WATERS.practices.forEach(function (p, i) {
      h += '<div class="ess-card wat-card glass" data-wat="' + p.id + '" style="border-left:3px solid ' + p.color + '">' +
        '<div class="wat-head"><div class="ess-kicker" style="color:' + p.color + '">' + p.num + (p.cadence ? ' · ' + p.cadence : '') + '</div>' + fnChip(p.fn) + '</div>' +
        '<div class="ess-title">' + motifSVG(p.motif, 'wat-' + p.id, { color: p.color }) + ' ' + p.title + '</div>' +
        '<div class="ess-body">' +
          '<ol class="wat-steps">' + p.steps.map(function (st) { return '<li>' + st + '</li>'; }).join('') + '</ol>' +
          (p.note ? '<div class="wat-note">' + p.note + '</div>' : '') +
          '<div class="today-actions">' +
            (p.guided === 'reservoir' ? '<button class="tbtn" data-wguided="reservoir">Begin · guided</button>' : '') +
            (p.guided === 'twowaters' ? '<button class="tbtn" data-wguided="twowaters">Open the container · guided</button>' : '') +
          '</div>' +
          (p.ledger ? '<div id="kwHost"></div>' : '') +
          (p.oriki ? '<div id="okHost"></div>' : '') +
        '</div></div>';
    });
    page.innerHTML = h;
    page.querySelectorAll('.wat-card').forEach(function (card) {
      card.onclick = function (e) {
        if (e.target.closest('button,input,textarea,#kwHost,#okHost')) return;
        card.classList.toggle('open');
      };
    });
    var pm = page.querySelector('#wPrinMore');
    pm.onclick = function () { var w = page.querySelector('.wprin'); w.classList.toggle('open'); pm.textContent = w.classList.contains('open') ? 'fold the principles ▴' : 'read the principles ▾'; };
    page.querySelectorAll('[data-wguided]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); if (b.dataset.wguided === 'reservoir') openReservoir(); else openTwoWaters(); };
    });
    renderKeptWord(); renderOriki();
    glassify(page); tintCards(page);
    if (PREFS.theme === 'light') applyInlineTheme(true, page);
  }

  /* ---- Kept Word ledger (3.5) ---- */
  function renderKeptWord() {
    var host = document.getElementById('kwHost'); if (!host) return;
    var la = latestAfose();
    var entries = kwAll();
    var lastEntry = entries[entries.length - 1];
    var prefill = la && (!lastEntry || la.t > lastEntry.t) ? la.text : '';
    var kept = 0, unkept = 0;
    entries.forEach(function (e) { if (e.kept) kept++; if (e.unkept) unkept++; });
    var h = '<div class="kw-form">' +
      '<div class="kw-label">Kept — one word spoken this week that came to pass' + (lastEntry && lastEntry.word ? ' <em>(last week’s word: “' + esc(lastEntry.word) + '”)</em>' : '') + '</div>' +
      '<textarea class="mirror-input kw-inp" id="kwKept" rows="1"></textarea>' +
      '<div class="kw-label">Unkept — recorded, not prosecuted</div>' +
      '<textarea class="mirror-input kw-inp" id="kwUnkept" rows="1"></textarea>' +
      '<div class="kw-label">This week’s word — one àfọ̀ṣẹ sentence, sized to be completable</div>' +
      '<textarea class="mirror-input kw-inp" id="kwWord" rows="1">' + esc(prefill) + '</textarea>' +
      '<div class="today-actions"><button class="tbtn" id="kwSave">Enter the week</button>' +
      (entries.length ? '<button class="tbtn ghost" id="kwRead">Read the ledger</button>' : '') + '</div>' +
      '<div class="kw-list" id="kwList" style="display:none">' +
        '<div class="wat-note">' + kept + ' kept · ' + unkept + ' unkept across ' + entries.length + ' week' + (entries.length === 1 ? '' : 's') + ' — read quarterly, at most.</div>' +
        entries.slice(-12).reverse().map(function (e) {
          return '<div class="kw-entry"><div class="mj-date">' + dayLabel(e.t) + '</div>' +
            (e.kept ? '<div class="kw-line"><span>kept</span>' + esc(e.kept) + '</div>' : '') +
            (e.unkept ? '<div class="kw-line un"><span>unkept</span>' + esc(e.unkept) + '</div>' : '') +
            (e.word ? '<div class="kw-line word"><span>word</span>' + esc(e.word) + '</div>' : '') + '</div>';
        }).join('') + '</div>';
    host.innerHTML = h;
    host.querySelector('#kwSave').onclick = function () {
      var k = host.querySelector('#kwKept').value.trim(), u = host.querySelector('#kwUnkept').value.trim(), w = host.querySelector('#kwWord').value.trim();
      if (!k && !u && !w) return;
      var a = kwAll(); a.push({ t: Date.now(), kept: k, unkept: u, word: w }); saveStore(KWK, a.slice(-200));
      buzz(15); renderKeptWord();
      if (PREFS.theme === 'light') applyInlineTheme(true, document.getElementById('page-waters'));
    };
    var rd = host.querySelector('#kwRead');
    if (rd) rd.onclick = function () { var l = host.querySelector('#kwList'); l.style.display = l.style.display === 'none' ? 'block' : 'none'; };
  }

  /* ---- Oríkì file (3.7) ---- */
  function renderOriki() {
    var host = document.getElementById('okHost'); if (!host) return;
    var names = orikiAll();
    var h = '<div class="ok-list">' +
      (names.length ? names.slice().reverse().map(function (n) {
        return '<div class="ok-entry"><div class="ok-name">' + motifSVG('star', 'ok-' + n.t, { color: '#DAA520', style: 'width:13px;height:13px;margin-right:6px;vertical-align:-2px' }) + '“' + esc(n.name) + '”</div>' + (n.moment ? '<div class="ok-moment">' + esc(n.moment) + '</div>' : '') + '</div>';
      }).join('') : '<div class="mj-empty">No names yet. The first one is earned, not written.</div>') + '</div>' +
      '<div class="kw-label">Add a name — only when a lived moment has demonstrated it</div>' +
      '<textarea class="mirror-input kw-inp" id="okName" rows="1" placeholder="the one who…"></textarea>' +
      '<textarea class="mirror-input kw-inp" id="okMoment" rows="1" placeholder="the moment that earned it"></textarea>' +
      '<div class="today-actions"><button class="tbtn" id="okAdd">Enter the name</button></div>';
    host.innerHTML = h;
    host.querySelector('#okAdd').onclick = function () {
      var n = host.querySelector('#okName').value.trim(); if (!n) return;
      var m = host.querySelector('#okMoment').value.trim();
      var a = orikiAll(); a.push({ t: Date.now(), name: n, moment: m }); saveStore(OKK, a.slice(-100));
      buzz(15); renderOriki();
      if (PREFS.theme === 'light') applyInlineTheme(true, document.getElementById('page-waters'));
    };
  }

  /* ---- guided Reservoir (3.3) — slow nasal breath, no retention, no logging ---- */
  var WATER_BLUE = '#5A7B8C';
  function openReservoir() {
    openOverlay(WATER_BLUE);
    Z.zKicker.textContent = 'THE RESERVOIR · Ẹ̀MÍ';
    Z.zPhrase.textContent = 'The Reservoir';
    Z.zSub.textContent = 'Attention two fingers below the navel. Slow nasal breath, exhale longer than inhale — no retention, no counting. The return of attention is the practice working.';
    newSession();
    var mins = 5;
    Z.zChips.style.display = 'flex';
    [5, 10, 15].forEach(function (v) {
      var c = document.createElement('button');
      c.className = 'zen-chip' + (v === mins ? ' sel' : '');
      c.textContent = v + ' min';
      c.onclick = function () { mins = v; Array.prototype.forEach.call(Z.zChips.children, function (x) { x.classList.remove('sel'); }); c.classList.add('sel'); };
      Z.zChips.appendChild(c);
    });
    Z.zCtls.innerHTML = '';
    ctlBtn('Begin', 'zen-btn', function () { startReservoir(mins); });
  }
  function startReservoir(mins) {
    newSession(); resetSlots();
    Z.zKicker.textContent = 'THE RESERVOIR · ' + mins + ' MIN';
    Z.zRingSvg.style.display = 'block';
    Z.zRingFill.style.strokeDasharray = RING_C;
    Z.zRingFill.style.strokeDashoffset = 0;
    Z.zCount.style.display = 'block';
    Z.zSub.textContent = 'Two fingers below the navel. Return without commentary.';
    var total = mins * 60, left = total;
    Z.zCount.textContent = fmt(left);
    ac(); chimeStart(); buzz(25);
    function loop(pi) {
      if (!S || S.paused) return;
      var ph = pi === 0 ? ['Inhale', 4000, 1.28] : ['Exhale', 6000, 1];
      Z.zPhrase.textContent = ph[0];
      Z.zOrb.style.transition = 'transform ' + ph[1] + 'ms cubic-bezier(.4,0,.4,1)';
      Z.zOrb.style.transform = 'scale(' + ph[2] + ')';
      after(ph[1], function () { loop((pi + 1) % 2); });
    }
    loop(0);
    every(1000, function () {
      if (S && S.paused) return;
      left--;
      if (left <= 0) {
        stopSession(); newSession();
        chimeEnd(); buzz([40, 80, 40]);
        Z.zCount.style.display = 'none';
        Z.zPhrase.textContent = 'The deposit is made.';
        Z.zSub.textContent = 'Unspectacular and cumulative — a longer fuse, a wider gap between wave and word.';
        Z.zCtls.innerHTML = ''; ctlBtn('Close', 'zen-btn', function () { closeOverlay(false); });
        return;
      }
      Z.zCount.textContent = fmt(left);
      Z.zRingFill.style.strokeDashoffset = RING_C * (1 - left / total);
    });
    Z.zCtls.innerHTML = '';
    var pp = ctlBtn('&#10073;&#10073;', 'zen-ctl main', function () {
      if (!S) return;
      if (S.paused) { S.paused = false; pp.innerHTML = '&#10073;&#10073;'; Z.zHint.textContent = ''; loop(0); }
      else { S.paused = true; pp.innerHTML = '&#9654;'; Z.zHint.textContent = 'paused'; S.timers.forEach(clearTimeout); S.timers = []; Z.zOrb.style.transition = 'transform 1.5s ease'; Z.zOrb.style.transform = 'scale(1)'; Z.zPhrase.textContent = 'Paused'; }
    });
    ctlBtn('&#10005;', 'zen-ctl', function () { closeOverlay(false); });
  }

  /* ---- guided Two Waters (3.4) — the framed container; no logging ---- */
  var TW_STEPS = [
    { t: 'The Two Waters', sub: 'Two vessels · sea salt · warm water · cool fresh water. Phone in another room.', btn: 'Open the container', color: WATER_BLUE },
    { t: 'Invocation', phrase: '“I open this water to carry what I name.”', sub: 'Say it aloud. The container is open until the closing line.', btn: 'Continue', color: WATER_BLUE },
    { t: 'The Salt Water', phrase: 'Name the week’s residue', sub: 'Hold three pinches of salt before dissolving. Name it specifically, aloud — the argument rehearsed on the walk; the guilt absorbed that was not yours; the vigilance held where none was needed. Specificity is the work; generality is the mind negotiating.', btn: 'Named — dissolve the salt', color: '#8B6F47' },
    { t: 'Hands in the water', timed: 60, sub: 'Both hands fully in the water. Stay at least a full minute. If nothing comes, breathe and let the hands soak — silence in the container still counts.', color: '#8B6F47' },
    { t: 'Speak what leaves', phrase: 'The sentences may be broken', sub: 'Grief speaks in fragments; fragments suffice. This is the one place in the week where the case does not need to be airtight.', btn: 'Ready to close the release', color: '#8B6F47' },
    { t: 'Close the release', phrase: '“Water, carry it. I am reconciled to what I have named — or willing to become so.”', sub: 'Pour the water away — drain acceptable, earth better. Rinse hands under running water.', btn: 'Poured', color: '#8B6F47' },
    { t: 'The Cool Water', phrase: 'Cool water to the face, then the crown', sub: 'Address orí, as in the morning: “Orí mi, I greet you.”', btn: 'Continue', color: WATER_BLUE },
    { t: 'One àfọ̀ṣẹ sentence', input: true, sub: 'The word intended to come to pass. Present tense. First person. No subordinate clauses, no defense built in. One sentence — the discipline is the singularity. It becomes next week’s Kept Word review.', btn: 'Spoken — set it down', color: WATER_BLUE },
    { t: 'Libation — optional', phrase: '“To those who came before — water on the ground.”', sub: 'A few drops of fresh water — never the salt — to earth or a living plant. Ground in Ontario reaches ground in Cameroon.', btn: 'Continue', skip: true, color: WATER_BLUE },
    { t: 'Closure', phrase: '“The water is finished. I remain.”', sub: 'The container is closed. Nothing is decided inside the rite — whatever surfaced rides the wave at least one night. Decisions and initiations issue only from the cool.', btn: 'Finish', end: true, color: WATER_BLUE }
  ];
  function openTwoWaters() {
    openOverlay(WATER_BLUE);
    newSession();
    var cur = -1, afInput = null;
    function go(i) {
      if (!S) return;
      S.timers.forEach(clearTimeout); S.timers = []; clearBeats();
      cur = i;
      var st = TW_STEPS[i];
      if (!st) { closeOverlay(false); return; }
      setVars(st.color);
      Z.zKicker.textContent = 'THE TWO WATERS · ' + (i + 1) + ' OF ' + TW_STEPS.length;
      Z.zPoint.textContent = st.t;
      Z.zPhrase.textContent = st.phrase || (i === 0 ? 'The weekly container' : '');
      Z.zPhrase.style.fontSize = st.phrase && st.phrase.length > 60 ? 'clamp(17px,4.6vw,22px)' : '';
      Z.zSub.textContent = st.sub || '';
      Z.zCount.style.display = 'none';
      Z.zChips.style.display = 'none'; Z.zChips.innerHTML = '';
      Z.zCtls.innerHTML = '';
      Z.zHint.textContent = 'nothing is decided inside the rite';
      // gentle idle breathing
      (function idle() {
        if (!S || cur !== i) return;
        Z.zOrb.style.transition = 'transform 4s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1.12)';
        after(4000, function () { if (!S || cur !== i) return; Z.zOrb.style.transition = 'transform 6s cubic-bezier(.4,0,.4,1)'; Z.zOrb.style.transform = 'scale(1)'; after(6000, idle); });
      })();
      if (st.timed) {
        var left = st.timed;
        Z.zCount.style.display = 'block'; Z.zCount.textContent = fmt(left);
        every(1000, function () {
          if (!S || S.paused) return;
          left--;
          Z.zCount.textContent = fmt(Math.max(0, left));
          if (left <= 0) { bell(0, 523.25, 0.09, 2); buzz(30); go(i + 1); }
        });
        ctlBtn('Stay longer', 'zen-btn ghost', function () { left += 60; });
      } else if (st.input) {
        Z.zChips.style.display = 'flex';
        Z.zChips.innerHTML = '<textarea class="mirror-input tw-input" id="twAfose" rows="2" placeholder="I …"></textarea>';
        afInput = Z.zChips.querySelector('#twAfose');
        ctlBtn(st.btn, 'zen-btn', function () {
          var v = afInput.value.trim();
          if (v) { var s = afoseStore(); s.afose.push({ t: Date.now(), text: v }); s.afose = s.afose.slice(-100); saveStore(AFK, s); }
          go(i + 1);
        });
      } else {
        if (st.skip) ctlBtn('Skip', 'zen-btn ghost', function () { go(i + 1); });
        ctlBtn(st.btn, 'zen-btn', function () {
          if (st.end) { chimeEnd(); buzz([40, 80, 40]); closeOverlay(false); renderKeptWord(); }
          else { buzz(12); go(i + 1); }
        });
      }
      if (i === 0) { ac(); chimeStart(); }
    }
    go(0);
  }

  /* ---- Start-here fourth row: chapter → essence/practice ---- */
  var ESSENCE_FOR_CHAPTER = {
    evolution:     { sec: 'thesis',      why: 'The departure-not-loss thesis is the multisensory shift said in one move: the essence never left — you did.' },
    karma:         { sec: 'conduction',  why: 'Ayni and ẹbọ: every act as offering or extraction. Karma as bookkeeping, not moralism.' },
    reverence:     { prac: 'inputs',     why: 'The traditions put sleep, food, light and walking inside the spiritual economy — reverence as intake.' },
    heart:         { sec: 'anatomy',     why: 'Ọkàn — the heart as primary sensing instrument, and why it aims outward at the cost of registering inward.' },
    light:         { sec: 'anatomy',     why: 'Ẹ̀mí — the breath as the divine share, the only part of you that exists strictly now.' },
    intuition:     { sec: 'anatomy',     why: 'Orí inú — the inner head that chose its destiny; intuition as the slow remembering of that choice.' },
    intention:     { sec: 'conduction',  why: 'orí → ìwà → àṣẹ: alignment, character, then the word — the clean sequence intention runs on.' },
    choice:        { sec: 'anatomy',     why: 'Ẹsẹ̀ — the legs. A well-chosen head with unused legs: accurate self-knowledge, no lived change.' },
    addiction:     { prac: 'twowaters',  why: 'The salt water is the release valve — grief moved instead of processed conceptually.' },
    relationships: { sec: 'diagnostic',  why: 'The caretaker, precisely addressed: tending other people’s orí while your own goes unfed is not virtue.' },
    power:         { prac: 'keptword',   why: 'Àṣẹ compounds by congruence — every kept word deposits authority in the instrument of speech.' },
    trust:         { sec: 'thesis',      why: 'The contract was chosen before birth and forgotten at the crossing; trust is the slow remembering.' },
    illusion:      { sec: 'residence',   why: 'The performance of comprehension is the subtlest mask — residence is not naming the feeling too soon.' }
  };
  function essenceRowFor(chapterId) {
    var m = ESSENCE_FOR_CHAPTER[chapterId];
    if (!m || typeof ESSENCE === 'undefined') return null;
    if (m.sec) {
      var idx = ESSENCE.sections.findIndex(function (s) { return s.id === m.sec; });
      if (idx === -1) return null;
      return { label: ESSENCE.sections[idx].title, why: m.why, open: function () { openReader('essence', idx); } };
    }
    var p = (typeof WATERS !== 'undefined') && WATERS.practices.find(function (x) { return x.id === m.prac; });
    if (!p) return null;
    return { label: p.title, why: m.why, open: function () { if (typeof closeD === 'function') closeD(); navTo('waters'); setTimeout(function () { var el = document.querySelector('[data-wat="' + m.prac + '"]'); if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 350); } };
  }

  /* ---- Today: the Return card ---- */
  function essenceReadOfDay() {
    if (typeof ESSENCE === 'undefined') return null;
    var now = new Date();
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    var i = doy % ESSENCE.sections.length;
    return { i: i, s: ESSENCE.sections[i] };
  }
  function watersSuggestion(slot) {
    var now = new Date(), t = waveToday();
    if (now.getDay() === 0 && slot === 'evening') return { id: 'twowaters', label: 'The Two Waters', sub: 'Sunday evening — name the week’s residue, then enter the Kept Word.', guided: 'twowaters' };
    if (t && t.v <= 2) return { id: 'twowaters', label: 'The Two Waters', sub: 'A low day — let the salt carry what the mind keeps re-arguing.', guided: 'twowaters' };
    if (now.getDate() <= 3 && slot !== 'morning') return { id: 'immersion', label: 'The Immersion', sub: 'A month has turned — a threshold bath, if one is due.', guided: null };
    if (slot === 'morning') return { id: 'anchor', label: 'The Morning Anchor', sub: 'Before the phone: three breaths, the first word to orí.', guided: null };
    if (slot === 'day') return { id: 'inplace', label: 'The Return-in-Place', sub: 'Two long exhales, feet, one line: “Orí, I’m here.” Thirty invisible seconds.', guided: null };
    return { id: 'reservoir', label: 'The Reservoir', sub: 'Five minutes of attention parked in the breath — the daily deposit.', guided: 'reservoir' };
  }

  /* ================================================================
     BOOT
     ================================================================ */
  /* footer: keep only the Manifestor line */
  function trimFooter() {
    var ft = document.querySelector('.footer-text');
    if (!ft) return;
    var parts = ft.innerHTML.split(/<br\s*\/?>/i);
    ft.innerHTML = parts[parts.length - 1];
  }

  function boot() {
    try {
      extendEft();
      hookEft(); hookMeds(); addFab();
      createPages(); buildNav(); buildSettings(); wrapOpenD(); wrapSetF();
      trimFooter();
      ensoSweep(document); addPageEnsos();
      applyZoom(); applyTheme();
      window.addEventListener('hashchange', route);
      if (!location.hash) history.replaceState(null, '', '#/today');
      route();
      if (reminderPrefs().on) scheduleReminders();
      maybeInAppNudge();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && reminderPrefs().on) scheduleReminders();
      });
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
