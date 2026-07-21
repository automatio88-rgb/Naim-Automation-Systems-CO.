// Naim Automation Systems Co. — Landing Page
// Modeled exactly on the Paperless (paperless.naiminvestments.com) structure, wording style and presentation.
// Clean. Light. Professional. No prices. No pressure.

const ICONS = {
  check: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  shield: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  file: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
  phone: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
}

export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Naim Automation Systems Co.</title>
<meta name="description" content="Naim Automation Systems Co. — Turn agency admin chaos into clean automated systems on your phone.">
<meta name="author" content="Naim Automation Systems Co.">
<meta property="og:title" content="Naim Automation Systems Co.">
<meta property="og:description" content="Turn agency admin chaos into clean automated systems on your phone.">
<meta property="og:type" content="website">
<link rel="icon" href="/static/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>

<!-- ============ HEADER ============ -->
<header class="topbar" id="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/">
      <span class="brand-mark">NA</span>
      <span class="brand-name">Naim Automation Systems Co.</span>
    </a>
    <nav class="topnav">
      <a href="#what-you-get">What You Get</a>
      <a href="#how-it-works">How It Works</a>
      <a href="#faq">Questions</a>
      <a class="btn-pill" href="#book">Book Appointment</a>
    </nav>
  </div>
</header>

<main>

<!-- ============ BEFORE / AFTER ============ -->
<section class="section" id="before-after">
  <div class="wrap">
    <div class="ba-panel">
      <h2 class="section-title">From Chaos &rarr; Clean</h2>
      <div class="ba-grid">
        <div class="ba-card">
          <div class="ba-img">
            <img src="/static/images/before-chaos.jpg" alt="Before — scattered admin and missed messages" loading="lazy" onerror="this.parentElement.classList.add('img-missing')">
          </div>
          <h3>Before</h3>
          <p>Missed messages, scattered paperwork</p>
        </div>
        <div class="ba-card ba-after">
          <div class="ba-img">
            <img src="/static/images/after-clean.jpg" alt="After — clean automated system on a phone" loading="lazy" onerror="this.parentElement.classList.add('img-missing')">
          </div>
          <h3>After</h3>
          <p>Every enquiry answered + records in order</p>
        </div>
      </div>
      <p class="ba-tag">Same agency. Less stress. Everything on your phone.</p>
    </div>
  </div>
</section>

<!-- ============ HERO ============ -->
<section class="section hero" id="hero">
  <div class="wrap-narrow">
    <h1>Turn agency admin from <em>Chaos</em> into <em>Clean</em> systems on your phone &mdash;<br class="br-d"> and never miss a candidate</h1>
    <p class="hero-sub">We help recruitment agencies stop wasting time on admin. We build systems that answer every enquiry, keep client records neat, and put your whole business in your pocket.</p>
    <a class="btn-pill btn-lg" href="#book">Book Appointment</a>
    <p class="hero-note">No pressure. If you don&rsquo;t need this, we&rsquo;ll tell you.</p>
  </div>
</section>

<!-- ============ WHAT YOU GET ============ -->
<section class="section" id="what-you-get">
  <div class="wrap-narrow">
    <h2 class="section-title">What You Get</h2>
    <ul class="get-list">
      <li>${ICONS.check}<span>Custom Automation System (Enquiry Response / Records / Follow-ups)</span></li>
      <li>${ICONS.check}<span>Automatic Branded Documents &amp; Reports</span></li>
      <li>${ICONS.check}<span>Simple Searchable List of Candidate &amp; Client Records</span></li>
      <li>${ICONS.check}<span>Short Training so you can run it yourself</span></li>
    </ul>
    <p class="get-note">Optional Add-Ons: Reminders, Follow-ups, Google Sheets Sync</p>
  </div>
</section>

<!-- ============ HOW IT WORKS ============ -->
<section class="section section-gray" id="how-it-works">
  <div class="wrap">
    <h2 class="section-title">How It Works</h2>
    <div class="steps-grid">
      <div class="step">
        <div class="step-num">1</div>
        <h3>Book Appointment</h3>
        <p>Consultation booked to understand your needs</p>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <h3>We build your system</h3>
        <p>Custom designed for your agency</p>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <h3>You go automated</h3>
        <p>Start using it with confidence</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ DATA PROTECTED ============ -->
<section class="section" id="data">
  <div class="wrap-narrow center">
    <span class="shield-ic">${ICONS.shield}</span>
    <h2 class="section-title">Your Data is Protected</h2>
    <p class="data-text">We only collect what you need, protect access, and keep candidate and client data private.<br>Your business stays compliant with the Kenya Data Protection Act, 2019.</p>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="section section-gray" id="faq">
  <div class="wrap-narrow">
    <h2 class="section-title">Common Questions</h2>
    <div class="faq-list">
      <details>
        <summary>How much does this cost?</summary>
        <p>Pricing is project-based for the initial setup, with a monthly subscription for maintenance, updates, and support. We&rsquo;ll provide an exact quote based on the size and complexity of your project.</p>
      </details>
      <details>
        <summary>How long does setup take?</summary>
        <p>Setup timelines depend on the number and complexity of systems required. Most projects are delivered within a reasonable implementation window, and we confirm a realistic timeline after reviewing your exact needs.</p>
      </details>
      <details>
        <summary>Do I need a computer or special software?</summary>
        <p>No. Everything works on your smartphone. You just need a modern phone with internet access.</p>
      </details>
      <details>
        <summary>What if my staff don&rsquo;t know how to use it?</summary>
        <p>We provide a short training session that covers everything. The systems are designed to be simple and intuitive.</p>
      </details>
      <details>
        <summary>Is my client data safe?</summary>
        <p>Yes. We use secure systems compliant with the Kenya Data Protection Act. Your data is encrypted, access-controlled, and stored safely.</p>
      </details>
    </div>
  </div>
</section>

<!-- ============ BOOKING FORM ============ -->
<section class="section" id="book">
  <div class="wrap-narrow">
    <h2 class="section-title">Let&rsquo;s Get You Automated</h2>
    <p class="form-intro">Submit your details below, then choose a booking time.</p>

    <form id="book-form" class="book-form" novalidate>
      <div class="form-2col">
        <div class="ff">
          <label for="f-name">Full name *</label>
          <input id="f-name" name="contact_name" type="text" required autocomplete="name">
        </div>
        <div class="ff">
          <label for="f-agency">Agency / business name *</label>
          <input id="f-agency" name="agency_name" type="text" required autocomplete="organization">
        </div>
        <div class="ff">
          <label for="f-phone">Phone / WhatsApp *</label>
          <input id="f-phone" name="phone" type="tel" required autocomplete="tel">
        </div>
        <div class="ff">
          <label for="f-email">Email</label>
          <input id="f-email" name="email" type="email" autocomplete="email">
        </div>
      </div>

      <div class="ff">
        <label for="f-details">Tell us about your project</label>
        <textarea id="f-details" name="details" rows="4" placeholder="Tell us what tasks take your time and what you want automated"></textarea>
      </div>

      <div class="ff">
        <label for="f-slot">Consultation appointment time slot</label>
        <p class="slot-note">Please choose a preferred time slot that suits you. We will then contact you to confirm the closest available date.</p>
        <select id="f-slot" name="slot">
          <option value="">Select a time slot</option>
          <option>Saturday — 12:00</option>
          <option>Saturday — 12:30</option>
          <option>Saturday — 13:00</option>
          <option>Saturday — 13:30</option>
        </select>
      </div>

      <button type="submit" class="btn-pill btn-lg btn-submit" id="book-submit">Book Appointment</button>
      <p id="form-msg" class="form-msg" role="status"></p>
    </form>
  </div>
</section>

</main>

<!-- ============ FOOTER ============ -->
<footer class="footer">
  <span class="brand-mark">NA</span>
  <p>Naim Automation Systems Co. &mdash; Mombasa, Kenya</p>
  <p class="foot-links"><a href="/docs">Client Documents</a></p>
  <p class="foot-copy">&copy; 2026 Naim Automation Systems Co. All rights reserved.</p>
</footer>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/app.js"></script>
</body>
</html>`
}
