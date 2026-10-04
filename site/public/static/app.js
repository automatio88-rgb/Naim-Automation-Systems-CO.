/* Naim Automation Systems Co. — Landing Page JS */
(function () {
  'use strict';

  /* Topbar subtle border on scroll */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var onScroll = function () {
      topbar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Booking form */
  var form = document.getElementById('book-form');
  var msg = document.getElementById('form-msg');
  var submitBtn = document.getElementById('book-submit');

  function showMsg(text, cls) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-msg ' + (cls || '');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (document.getElementById('f-name') || {}).value || '';
      var agency = (document.getElementById('f-agency') || {}).value || '';
      var phone = (document.getElementById('f-phone') || {}).value || '';
      var email = (document.getElementById('f-email') || {}).value || '';
      var details = (document.getElementById('f-details') || {}).value || '';
      var slot = (document.getElementById('f-slot') || {}).value || '';

      if (!name.trim() || !agency.trim() || !phone.trim()) {
        showMsg('Please fill in your name, agency name and phone number.', 'err');
        return;
      }

      var challenge = details.trim() || 'No additional project details provided.';
      challenge += ' | Preferred slot: ' + (slot || 'No time slot selected.');

      submitBtn.disabled = true;
      var original = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
      showMsg('', '');

      axios.post('/api/leads', {
        contact_name: name.trim(),
        agency_name: agency.trim(),
        phone: phone.trim(),
        email: email.trim(),
        main_challenge: challenge
      }).then(function () {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        showMsg('Thank you for your submission. We will be in touch.', 'ok');
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        showMsg('Sorry, we could not submit your request right now. Please try again.', 'err');
      });
    });
  }
})();
