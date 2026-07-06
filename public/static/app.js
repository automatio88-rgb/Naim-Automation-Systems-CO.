/* Naim Automation Systems Co. — landing page interactions */
(function () {
  'use strict';

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('nav-burger');
  const nav = document.getElementById('main-nav');
  if (burger) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });

  /* ---------- Currency toggle (KES primary / USD international) ---------- */
  const toggle = document.getElementById('currency-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      const opts = toggle.querySelectorAll('.cur-opt');
      let next = 'KES';
      opts.forEach(function (o) {
        if (o.classList.contains('active') && o.dataset.cur === 'KES') next = 'USD';
      });
      opts.forEach(function (o) { o.classList.toggle('active', o.dataset.cur === next); });
      document.querySelectorAll('[data-kes]').forEach(function (el) {
        el.textContent = next === 'KES' ? el.dataset.kes : el.dataset.usd;
      });
    });
  }

  /* ---------- Lead form (our own speed-to-lead) ---------- */
  const form = document.getElementById('audit-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('audit-submit');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      statusEl.className = 'form-status';
      statusEl.textContent = '';

      const data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });

      if (!data.agency_name || !data.contact_name || !data.phone) {
        statusEl.classList.add('err');
        statusEl.textContent = 'Please fill in the agency name, your name and WhatsApp number.';
        return;
      }

      submitBtn.disabled = true;
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending… <i class="fas fa-circle-notch fa-spin"></i>';

      try {
        const res = await axios.post('/api/leads', data);
        if (res.data && res.data.ok) {
          statusEl.classList.add('ok');
          statusEl.textContent = 'Thank you — your audit request is received. We will contact you on WhatsApp within one business day.';
          form.reset();
        } else {
          throw new Error('bad response');
        }
      } catch (err) {
        statusEl.classList.add('err');
        statusEl.textContent = 'Something went wrong. Please try again, or reach us directly on WhatsApp.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
})();
