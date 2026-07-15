/* Naim Automation Systems Co. — landing page behaviour */
(function () {
  'use strict';

  /* ---------- Sticky header shadow ---------- */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var onScroll = function () {
      topbar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Currency toggle (KES / USD) ---------- */
  var toggle = document.getElementById('currency-toggle');
  if (toggle) {
    var setCurrency = function (cur) {
      toggle.querySelectorAll('.cur').forEach(function (b) {
        b.classList.toggle('active', b.dataset.cur === cur);
      });
      document.querySelectorAll('[data-kes]').forEach(function (el) {
        el.textContent = cur === 'usd' ? el.dataset.usd : el.dataset.kes;
      });
      try { localStorage.setItem('nas-currency', cur); } catch (e) { /* private mode */ }
    };
    toggle.addEventListener('click', function () {
      var active = toggle.querySelector('.cur.active');
      setCurrency(active && active.dataset.cur === 'kes' ? 'usd' : 'kes');
    });
    var saved = null;
    try { saved = localStorage.getItem('nas-currency'); } catch (e) { /* ignore */ }
    if (saved === 'usd') setCurrency('usd');
  }

  /* ---------- Audit form (speed-to-lead: instant feedback) ---------- */
  var form = document.getElementById('audit-form');
  if (form) {
    var msg = document.getElementById('form-msg');
    var submitBtn = document.getElementById('audit-submit');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });

      msg.className = 'form-msg';
      msg.textContent = '';

      if (!data.agency_name || !data.contact_name || !data.phone) {
        msg.classList.add('err');
        msg.textContent = 'Please fill in your agency name, your name and your phone number.';
        return;
      }

      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending…';

      axios.post('/api/leads', data)
        .then(function (res) {
          if (res.data && res.data.ok) {
            msg.classList.add('ok');
            msg.textContent = '✦ Received! Your audit request is in. Expect to hear from us fast — we practise what we sell.';
            form.reset();
          } else {
            throw new Error((res.data && res.data.error) || 'Unexpected response');
          }
        })
        .catch(function (err) {
          msg.classList.add('err');
          var apiMsg = err && err.response && err.response.data && err.response.data.error;
          msg.textContent = apiMsg || 'Something went wrong. Please try again, or WhatsApp us directly.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = original;
        });
    });
  }
})();
