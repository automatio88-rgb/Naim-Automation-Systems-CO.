/* Naim Automation Systems Co. — Interactive Document Suite JS
   Signature pad (touch + mouse), field collection, submit to /api/docs/submit */
(function () {
  'use strict';

  /* ---------- Signature pad ---------- */
  var canvas = document.getElementById('sig-pad');
  var hasSignature = false;
  var ctx = null;

  function setupCanvas() {
    if (!canvas) return;
    var frame = canvas.parentElement;
    var dpr = window.devicePixelRatio || 1;
    var w = frame.clientWidth;
    var h = frame.clientHeight;
    // Preserve existing drawing on resize
    var prev = null;
    if (hasSignature && canvas.width > 0) {
      prev = document.createElement('canvas');
      prev.width = canvas.width;
      prev.height = canvas.height;
      prev.getContext('2d').drawImage(canvas, 0, 0);
    }
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2b2417';
    if (prev) {
      ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, w, h);
    }
  }

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var src = (e.touches && e.touches.length) ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  if (canvas) {
    setupCanvas();
    var drawing = false;
    var last = null;

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      last = getPos(e);
      if (!hasSignature) {
        hasSignature = true;
        var frame = canvas.parentElement;
        if (frame) frame.classList.add('signed');
      }
      // dot for taps
      ctx.beginPath();
      ctx.arc(last.x, last.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#2b2417';
      ctx.fill();
    }
    function moveDraw(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function endDraw() { drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(setupCanvas, 150);
    });

    var clearBtn = document.getElementById('sig-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        var dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        hasSignature = false;
        var frame = canvas.parentElement;
        if (frame) frame.classList.remove('signed');
      });
    }
  }

  /* ---------- Collect fill-in fields ---------- */
  function collectFields() {
    var fields = {};
    var inputs = document.querySelectorAll('.inline-fill, .field input, .field textarea, .field select');
    inputs.forEach(function (el) {
      // skip the signer identity fields (sent separately)
      if (['s-name', 's-agency', 's-phone', 's-email'].indexOf(el.id) !== -1) return;
      var key = el.getAttribute('data-name') || el.name || el.id || el.getAttribute('placeholder') || 'field';
      var val = (el.value || '').trim();
      if (val) fields[key] = val;
    });
    return fields;
  }

  /* ---------- Submit ---------- */
  var submitBtn = document.getElementById('doc-submit');
  var msg = document.getElementById('doc-msg');

  function showMsg(text, cls) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'doc-msg ' + (cls || '');
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var name = (document.getElementById('s-name') || {}).value || '';
      var agency = (document.getElementById('s-agency') || {}).value || '';
      var phone = (document.getElementById('s-phone') || {}).value || '';
      var email = (document.getElementById('s-email') || {}).value || '';
      var agree = document.getElementById('s-agree');

      if (!name.trim()) { showMsg('Please enter your full name.', 'err'); return; }
      if (!agency.trim()) { showMsg('Please enter your agency / company name.', 'err'); return; }
      if (!hasSignature) { showMsg('Please draw your signature in the box above.', 'err'); return; }
      if (!agree || !agree.checked) { showMsg('Please tick the box to confirm you have read and agree.', 'err'); return; }

      var signature = '';
      try { signature = canvas.toDataURL('image/png'); } catch (e) {}
      if (!signature) { showMsg('Could not capture signature — please try again.', 'err'); return; }

      submitBtn.disabled = true;
      var original = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Submitting your signed document…';
      showMsg('', '');

      axios.post('/api/docs/submit', {
        doc_type: submitBtn.getAttribute('data-doc-type'),
        client_name: name.trim(),
        agency_name: agency.trim(),
        phone: phone.trim(),
        email: email.trim(),
        fields: collectFields(),
        signature: signature,
        agreed: true
      }).then(function () {
        // Hide the form pieces, show success panel
        var section = document.getElementById('sign-section');
        if (section) {
          section.querySelectorAll('.sign-grid, .sig-wrap, .agree-row, #doc-submit, .sign-sub, h2, .eyebrow').forEach(function (el) {
            el.style.display = 'none';
          });
        }
        showMsg('', '');
        var panel = document.getElementById('submitted-panel');
        if (panel) {
          panel.hidden = false;
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }).catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        var m = (err && err.response && err.response.data && err.response.data.error) || 'Something went wrong. Please check your connection and try again.';
        showMsg(m, 'err');
      });
    });
  }
})();
