// Voice dictation (#13a) — browser-native Web Speech API, no backend.
//
// One shared helper used by David chat + assessment-writing fields. Renders a mic button
// next to a target <textarea>/<input>; clicking it streams speech-to-text into that field.
// Chrome/Edge/Android-Chrome only — where SpeechRecognition is unavailable (Firefox, some
// iOS), micButtonHTML() returns '' so nothing renders and no field is affected.
//
// Usage:
//   markup:  ${micButtonHTML('ra-notes')}        // place beside the textarea
//   or wire imperatively:  startDictation('david-query', btnEl)
//
// Only one recognizer runs at a time; clicking the active mic (or another) stops the prior one.

(function () {
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var active = null; // { rec, target, btn }

  function dictationSupported() { return !!SR; }

  // Inline-styled mic button (no external CSS dependency). Sits inline next to the field.
  function micButtonHTML(targetId, opts) {
    if (!dictationSupported()) return '';
    opts = opts || {};
    var title = opts.title || 'Dictate by voice';
    var extra = opts.style || '';
    return '<button type="button" class="dictate-btn" id="mic-' + targetId + '" ' +
      'data-target="' + targetId + '" title="' + title + '" aria-label="' + title + '" ' +
      'onclick="startDictation(\'' + targetId + '\', this)" ' +
      'style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;' +
      'padding:0;border:1px solid rgba(0,0,0,0.15);border-radius:8px;background:#fff;cursor:pointer;' +
      'font-size:15px;line-height:1;vertical-align:middle;flex:0 0 auto;' + extra + '">' +
      '<span class="dictate-ico" aria-hidden="true">🎤</span></button>';
  }

  function setBtnState(btn, on) {
    if (!btn) return;
    var ico = btn.querySelector('.dictate-ico') || btn;
    ico.textContent = on ? '🔴' : '🎤';
    btn.style.background = on ? '#ffe9e9' : '#fff';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function stopActive() {
    if (active && active.rec) { try { active.rec.stop(); } catch (e) {} }
  }

  function startDictation(targetId, btn) {
    if (!SR) return;
    var el = document.getElementById(targetId);
    if (!el) return;

    // Clicking the mic that is already recording → stop (toggle off).
    if (active && active.target === targetId) { stopActive(); return; }
    // A different mic → stop the previous, then start this one.
    if (active) stopActive();

    var rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    var base = el.value ? el.value.replace(/\s*$/, '') + ' ' : '';
    var finalText = '';

    active = { rec: rec, target: targetId, btn: btn };
    setBtnState(btn, true);

    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      el.value = base + finalText + interim;
      // Fire input/change so auto-resize + oninput capture handlers (sim answers) run.
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    var clear = function () {
      setBtnState(btn, false);
      if (active && active.rec === rec) active = null;
    };
    rec.onend = clear;
    rec.onerror = clear;

    try { rec.start(); } catch (e) { clear(); }
  }

  // Expose globally for inline onclick handlers + imperative callers.
  window.dictationSupported = dictationSupported;
  window.micButtonHTML = micButtonHTML;
  window.startDictation = startDictation;
})();
