/* Allingford Drone Services – shared code for the Contact Me and Drone Requirements forms.
   Each form page sets window.ADS_FORM = { type, container, collect, validate } before this file loads.

   Sending: answers go as text to the Apps Script web app's doPost, which checks the
   Cloudflare Turnstile token and then logs the enquiry in the Job Book and emails Ewan. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxY3ZxUKLFfmMnF3indC72LQ9qUxQWBb0Nvjt_iEoLK3CEcggeoSCofU5RL72KIc8Ou/exec';
  var SITEKEY = '0x4AAAAAAF6NIcPuKnA2EtqG';
  // Cloudflare's test key (always passes) when testing locally; the real key only works on the live domain.
  var LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (LOCAL) SITEKEY = '1x00000000000000000000AA';

  var cfg = window.ADS_FORM;
  var $ = function (id) { return document.getElementById(id); };
  var widgetId = null;
  var sending = false;

  /* ---------- Turnstile ---------- */
  window.adsTurnstileLoad = function () {
    widgetId = turnstile.render('#turnstile', { sitekey: SITEKEY, theme: 'light' });
  };
  var ts = document.createElement('script');
  ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=adsTurnstileLoad';
  ts.async = true; ts.defer = true;
  ts.onerror = function () {
    $('turnstile').innerHTML = '<p class="form-msg form-msg--err">The security check could not load. Please refresh the page, or email ewan@allingforddroneservices.co.uk.</p>';
  };
  document.head.appendChild(ts);

  function token() {
    try { return widgetId !== null ? turnstile.getResponse(widgetId) : ''; } catch (e) { return ''; }
  }
  function resetTurnstile() {
    try { if (widgetId !== null) turnstile.reset(widgetId); } catch (e) { /* ignore */ }
  }

  /* ---------- Messages ---------- */
  function showMsg(text, isErr) {
    var m = $('formMsg');
    m.textContent = text;
    m.className = 'form-msg' + (isErr ? ' form-msg--err' : '');
  }
  function fail(text, id) {
    showMsg(text, true);
    var el = id && $(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.focus) el.focus({ preventScroll: true });
    }
    return false;
  }
  window.ADS_FORM_FAIL = fail;

  /* ---------- Send ---------- */
  $('sendBtn').addEventListener('click', function () {
    if (sending) return;
    showMsg('');
    if (!cfg.validate()) return;
    var t = token();
    if (!t) return fail('Please complete the security check above the Send button.', 'turnstile');

    sending = true;
    $('sendBtn').disabled = true;
    showMsg('Sending…');

    fetch(ENDPOINT, {
      method: 'POST',
      // Plain text body: a "simple" request, so the browser doesn't need a pre-flight check Apps Script can't answer
      body: JSON.stringify({ formType: cfg.type, token: t, form: cfg.collect() })
    })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.error) || 'Something went wrong. Please try again.');
        $('doneRef').textContent = r.enquiryNo || '';
        $('doneRefLine').hidden = !r.enquiryNo;
        $(cfg.container).hidden = true;
        $('doneWrap').hidden = false;
        $('doneWrap').scrollIntoView({ block: 'center' });
      })
      .catch(function (e) {
        var text = e && e.message && !/fetch|network|JSON/i.test(e.message) ? e.message
          : 'Your message could not be sent. Please check your connection and try again, or email ewan@allingforddroneservices.co.uk.';
        showMsg(text, true);
        resetTurnstile();
      })
      .then(function () {
        sending = false;
        $('sendBtn').disabled = false;
      });
  });

  /* ---------- Shared input helpers ---------- */
  window.ADS_FORM_HELPERS = {
    emailOk: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v).trim()); },
    phoneOk: function (v, required) {
      v = String(v).trim();
      if (!v) return !required;
      var digits = v.replace(/\D/g, '').length;
      return !/[^0-9+()\- ]/.test(v) && digits >= 10 && digits <= 15;
    },
    // Telephone boxes: digits, spaces, + ( ) - only
    limitPhone: function (el) {
      el.addEventListener('input', function () {
        var v = this.value.replace(/[^0-9+()\- ]/g, '');
        if (v !== this.value) this.value = v;
      });
    }
  };
})();
