// Naim Automation Systems Co. — Landing Page
// Built on Alex Hormozi's landing-page principles:
//  1. 80% of the win is above the fold: outcome headline + proof + ONE clear CTA
//  2. Value Equation: maximise Dream Outcome × Likelihood, crush Time Delay × Effort
//  3. One page = one action (every CTA points to the same audit form)
//  4. Results language, not features. Clarity over cleverness.
//  5. Proof stack early. Risk reversal. Ethical scarcity.

export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Naim Automation Systems Co. — Never Lose Another Candidate to a Slow Reply</title>
<meta name="description" content="We install AI systems for Kenya's licensed recruitment agencies that answer every candidate in under 5 minutes, chase every document, and report to you daily — proven live at Naim Investments Ltd, Mombasa.">
<link rel="icon" href="/static/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>

<!-- ============ TOP BAR — minimal, no exits (Hormozi: don't give people an easy way out) ============ -->
<header class="topbar" id="topbar">
  <div class="wrap topbar-inner">
    <a class="brand" href="/" id="brand-home">
      <span class="brand-mark">NA</span>
      <span class="brand-words">
        <span class="brand-name">Naim Automation Systems Co.</span>
        <span class="brand-tag">Automation &amp; AI Systems · Kenya</span>
      </span>
    </a>
    <div class="topbar-right">
      <button class="currency-toggle" id="currency-toggle" aria-label="Switch currency">
        <span class="cur active" data-cur="kes">KES</span><span class="cur" data-cur="usd">USD</span>
      </button>
      <a class="btn btn-gold btn-sm" href="#audit">Get My Free Audit</a>
    </div>
  </div>
</header>

<!-- ============ HERO — the 80% (headline → proof → single CTA, all above the fold) ============ -->
<section class="hero" id="hero-section">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow reveal">For Kenya's 1,296 NEA-licensed recruitment agencies</p>
      <h1 class="reveal d1">Never lose another candidate<br><em>to a slow reply.</em></h1>
      <p class="hero-sub reveal d2">
        We install done-for-you AI systems that answer every enquiry in <b>under 5 minutes</b>,
        chase every document, follow up every lead and report to you daily —
        <b>already running live</b> at a licensed Mombasa agency.
      </p>

      <div class="hero-cta reveal d3">
        <a class="btn btn-gold btn-lg" href="#audit">Get My Free Operations Audit <span class="arr">→</span></a>
        <p class="cta-micro">Free · takes 2 minutes to request · no obligation, ever</p>
      </div>

      <div class="hero-proof reveal d4">
        <div class="proof-item"><b>47h → 5min</b><span>first-response time at our live deployment</span></div>
        <div class="proof-item"><b>155+</b><span>candidates managed on one system</span></div>
        <div class="proof-item"><b>EN·SW·AR</b><span>replies in your candidates' languages</span></div>
      </div>
    </div>

    <figure class="hero-visual reveal d2">
      <div class="img-frame" id="hero-image">
        <img src="/static/images/hero.jpg" alt="The Agency Brain system in action" loading="eager"
             onerror="this.closest('.img-frame').classList.add('img-missing')">
        <div class="img-placeholder"><span class="ph-mark">NA</span><span>Your image here<br><i>public/static/images/hero.jpg</i></span></div>
      </div>
      <figcaption class="hero-caption">The Director's Command Center — live daily briefing, 7:00 AM sharp.</figcaption>
    </figure>
  </div>
</section>

<!-- ============ TRUST BAR ============ -->
<section class="trustbar" aria-label="Compliance and ecosystem">
  <div class="wrap trustbar-inner">
    <span class="trust-label">Built for the licensed recruitment ecosystem</span>
    <div class="trust-logos">
      <span>NEA Licensed Agencies</span><i>✦</i>
      <span>KAPEA Members</span><i>✦</i>
      <span>Ministry of Labour Compliant</span><i>✦</i>
      <span>Musaned-Ready Workflows</span>
    </div>
  </div>
</section>

<!-- ============ PAIN — the cost of doing nothing (short, skimmable) ============ -->
<section class="section pain" id="problem-section">
  <div class="wrap">
    <p class="eyebrow center reveal">The problem — in numbers you already feel</p>
    <h2 class="center reveal d1">Every hour a candidate waits,<br><em>another agency answers first.</em></h2>

    <div class="pain-grid reveal d2">
      <article class="pain-card">
        <span class="pain-num">01</span>
        <h3>Enquiries die in the inbox</h3>
        <p>WhatsApp messages at 9 PM. Calls during Friday prayers. By the time you reply, the candidate has registered elsewhere.</p>
      </article>
      <article class="pain-card">
        <span class="pain-num">02</span>
        <h3>Documents expire silently</h3>
        <p>A passport lapses. A medical runs out. Nobody notices until the employer asks — and the placement collapses.</p>
      </article>
      <article class="pain-card">
        <span class="pain-num">03</span>
        <h3>Follow-up depends on memory</h3>
        <p>Your staff are human. They forget. Each forgotten follow-up is a placement fee that quietly walks away.</p>
      </article>
      <article class="pain-card">
        <span class="pain-num">04</span>
        <h3>You fly blind</h3>
        <p>How many enquiries came in this week? How many stalled? If the answer lives in someone's head, you don't run the agency — it runs you.</p>
      </article>
    </div>

    <p class="pain-math center reveal d3">
      One lost placement ≈ <b data-kes="KES 100,000+" data-usd="USD 770+">KES 100,000+</b> in fees.
      Most agencies leak <b>3–5 placements a month</b> to slow replies alone. That's the real price of "we'll reply tomorrow."
    </p>
  </div>
</section>

<!-- ============ THE FIX — offer stack (what you actually get) ============ -->
<section class="section systems" id="systems-section">
  <div class="wrap">
    <p class="eyebrow center reveal">The fix — installed for you, running in weeks not months</p>
    <h2 class="center reveal d1">Five systems. One outcome:<br><em>an agency that never sleeps.</em></h2>

    <div class="sys-list">
      <article class="sys-row reveal">
        <div class="sys-media img-frame">
          <img src="/static/images/system-speed-to-lead.jpg" alt="Speed-to-Lead System" loading="lazy"
               onerror="this.closest('.img-frame').classList.add('img-missing')">
          <div class="img-placeholder"><span class="ph-mark">01</span><span>Your image here<br><i>system-speed-to-lead.jpg</i></span></div>
        </div>
        <div class="sys-copy">
          <span class="sys-index">System 01</span>
          <h3>The Speed-to-Lead System</h3>
          <p class="sys-outcome">Every enquiry answered in under 5 minutes — 24/7, in English, Kiswahili or Arabic.</p>
          <p>AI reception on WhatsApp and your website that qualifies candidates, answers the common questions and books them in — while your competitors are still asleep.</p>
        </div>
      </article>

      <article class="sys-row rev reveal">
        <div class="sys-media img-frame">
          <img src="/static/images/system-documents.jpg" alt="Document Compliance Engine" loading="lazy"
               onerror="this.closest('.img-frame').classList.add('img-missing')">
          <div class="img-placeholder"><span class="ph-mark">02</span><span>Your image here<br><i>system-documents.jpg</i></span></div>
        </div>
        <div class="sys-copy">
          <span class="sys-index">System 02</span>
          <h3>The Document Compliance Engine</h3>
          <p class="sys-outcome">No more expired passports discovered on deployment day.</p>
          <p>Every candidate document tracked, verified and chased automatically — with expiry alerts weeks in advance and audit-ready records for NEA inspections.</p>
        </div>
      </article>

      <article class="sys-row reveal">
        <div class="sys-media img-frame">
          <img src="/static/images/system-followup.jpg" alt="Follow-up Machine" loading="lazy"
               onerror="this.closest('.img-frame').classList.add('img-missing')">
          <div class="img-placeholder"><span class="ph-mark">03</span><span>Your image here<br><i>system-followup.jpg</i></span></div>
        </div>
        <div class="sys-copy">
          <span class="sys-index">System 03</span>
          <h3>The Follow-up Machine</h3>
          <p class="sys-outcome">No lead ever forgotten — the system remembers so your staff don't have to.</p>
          <p>Polite, persistent, perfectly-timed follow-up sequences that move candidates from "interested" to "deployed" on autopilot.</p>
        </div>
      </article>

      <article class="sys-row rev reveal">
        <div class="sys-media img-frame">
          <img src="/static/images/system-reactivation.jpg" alt="Database Reactivation System" loading="lazy"
               onerror="this.closest('.img-frame').classList.add('img-missing')">
          <div class="img-placeholder"><span class="ph-mark">04</span><span>Your image here<br><i>system-reactivation.jpg</i></span></div>
        </div>
        <div class="sys-copy">
          <span class="sys-index">System 04</span>
          <h3>The Database Reactivation System</h3>
          <p class="sys-outcome">Turn the old files in your cabinet into this month's placements.</p>
          <p>Your dormant candidate list is an asset. We wake it up with respectful, targeted campaigns — often paying for the entire system with recovered placements.</p>
        </div>
      </article>

      <article class="sys-row reveal">
        <div class="sys-media img-frame">
          <img src="/static/images/system-reporting.jpg" alt="Executive Reporting System" loading="lazy"
               onerror="this.closest('.img-frame').classList.add('img-missing')">
          <div class="img-placeholder"><span class="ph-mark">05</span><span>Your image here<br><i>system-reporting.jpg</i></span></div>
        </div>
        <div class="sys-copy">
          <span class="sys-index">System 05</span>
          <h3>The Executive Reporting System</h3>
          <p class="sys-outcome">Your whole agency in one daily briefing — on your phone, 7:00 AM.</p>
          <p>Numbers, alerts and bottlenecks delivered to you every morning. Ask questions in plain language and get answers instantly.</p>
        </div>
      </article>
    </div>

    <!-- Flagship -->
    <div class="flagship reveal" id="flagship-panel">
      <div class="flagship-copy">
        <p class="eyebrow gold-soft">The flagship — all five, unified</p>
        <h2>The Agency Brain<span class="tm">™</span></h2>
        <p>One intelligent operations system running your entire agency end-to-end — intake, compliance, follow-up, reactivation and reporting, all talking to each other. This is what we built for Naim Investments Ltd. It's what we'll build for you.</p>
        <a class="btn btn-cream" href="#audit">Start With The Free Audit <span class="arr">→</span></a>
      </div>
      <div class="flagship-media img-frame">
        <img src="/static/images/flagship.jpg" alt="The Agency Brain" loading="lazy"
             onerror="this.closest('.img-frame').classList.add('img-missing')">
        <div class="img-placeholder dark"><span class="ph-mark">★</span><span>Your image here<br><i>flagship.jpg</i></span></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ PROOF — case study (perceived likelihood) ============ -->
<section class="section case" id="case-study-section">
  <div class="wrap">
    <p class="eyebrow center reveal">Proof — not promises</p>
    <h2 class="center reveal d1">Already running, <em>live in Mombasa.</em></h2>
    <p class="case-intro center reveal d2">Naim Investments Ltd — an accredited staffing agency serving the Gulf labour market — runs its entire operation on our systems today. These are their numbers, not projections:</p>

    <div class="case-metrics reveal d2">
      <div class="metric"><b>47h → 5min</b><span>First response to candidate enquiries</span></div>
      <div class="metric"><b>155+</b><span>Candidates in one managed pipeline</span></div>
      <div class="metric"><b>7:00 AM</b><span>Director's daily briefing, never missed</span></div>
      <div class="metric"><b>3</b><span>Languages handled automatically</span></div>
    </div>

    <blockquote class="testimonial reveal d3" id="testimonial-slot">
      <p>"— Testimonial from the Director goes here. Replace this quote with the client's words once recorded. —"</p>
      <footer><b>A.M. Abdalla</b> · Director, Naim Investments Ltd, Mombasa</footer>
    </blockquote>
  </div>
</section>

<!-- ============ PROCESS — crush effort & time delay ============ -->
<section class="section process" id="process-section">
  <div class="wrap">
    <p class="eyebrow center reveal">Zero disruption to your operations</p>
    <h2 class="center reveal d1">From audit to live system<br><em>in as little as 21 days.</em></h2>

    <ol class="steps reveal d2">
      <li><b>Free Operations Audit</b><span>We test your agency like a candidate would and show you exactly where enquiries leak. Yours to keep, free.</span><i>Day 0</i></li>
      <li><b>Quotation &amp; Agreement</b><span>Fixed, itemised price. 50% deposit confirms. No surprises, no hourly billing.</span><i>Days 1–3</i></li>
      <li><b>We Build — You Run Your Agency</b><span>Zero effort from your side beyond a contact person. Weekly progress updates.</span><i>Days 4–18</i></li>
      <li><b>Live Demo &amp; Team Training</b><span>You watch the system perform before you pay the balance. Your team is trained.</span><i>Days 19–20</i></li>
      <li><b>Handover &amp; Care</b><span>Owner's manual delivered. Monthly care plan with a report that shows the numbers.</span><i>Day 21 →</i></li>
    </ol>
  </div>
</section>

<!-- ============ PRICING — value framed ============ -->
<section class="section pricing" id="pricing-section">
  <div class="wrap">
    <p class="eyebrow center reveal">Investment</p>
    <h2 class="center reveal d1">Priced against what it recovers —<br><em>not what it costs.</em></h2>
    <p class="center price-note reveal d2">One recovered placement ≈ <b data-kes="KES 100,000+" data-usd="USD 770+">KES 100,000+</b>. Every tier below aims to pay for itself within the first weeks.</p>

    <div class="price-grid reveal d3">
      <article class="price-card">
        <h3>Single System</h3>
        <p class="price-for">Fix your most painful leak first</p>
        <p class="price"><span class="amount" data-kes="KES 45,000" data-usd="USD 350">KES 45,000</span><span class="from">from · one-time</span></p>
        <ul>
          <li>Any one of the five systems</li>
          <li>Built, tested &amp; demonstrated live</li>
          <li>Team training &amp; owner's manual</li>
          <li>30-day adjustment window</li>
        </ul>
        <a class="btn btn-outline" href="#audit">Start With The Audit</a>
      </article>

      <article class="price-card featured">
        <span class="badge">Most popular</span>
        <h3>Growth Bundle</h3>
        <p class="price-for">Three systems, wired together</p>
        <p class="price"><span class="amount" data-kes="KES 120,000" data-usd="USD 925">KES 120,000</span><span class="from">from · one-time</span></p>
        <ul>
          <li>Any three systems, integrated</li>
          <li>Everything in Single System</li>
          <li>Priority build queue</li>
          <li>Monthly performance report</li>
        </ul>
        <a class="btn btn-gold" href="#audit">Start With The Audit</a>
      </article>

      <article class="price-card">
        <h3>The Agency Brain™</h3>
        <p class="price-for">Your entire agency, automated</p>
        <p class="price"><span class="amount" data-kes="KES 250,000" data-usd="USD 1,900">KES 250,000</span><span class="from">from · one-time</span></p>
        <ul>
          <li>All five systems, fully unified</li>
          <li>Director's Command Center</li>
          <li>Trilingual candidate experience</li>
          <li>White-glove onboarding</li>
        </ul>
        <a class="btn btn-outline" href="#audit">Start With The Audit</a>
      </article>
    </div>

    <!-- Risk reversal -->
    <div class="guarantee reveal d3" id="guarantee-panel">
      <div class="g-seal">✦</div>
      <div>
        <h3>You see it working before you pay the balance.</h3>
        <p>50% to start, 50% only after a <b>live demonstration</b> of your system performing the agreed functions — plus a 30-day adjustment window after delivery. If we fail to deliver the agreed system and don't fix it within 21 days of notice, you're entitled to a refund for undelivered components. It's in the contract.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ SCARCITY — founding partner (ethical, real) ============ -->
<section class="section founding" id="founding-section">
  <div class="wrap founding-inner reveal">
    <p class="eyebrow gold-soft">Founding Partner Programme — genuinely limited to 3 agencies</p>
    <h2>One complete system. Built free.<br><em>In exchange for proof.</em></h2>
    <p>As a founding-stage company with one flagship deployment live, we're selecting <b>three licensed agencies</b> to receive one system completely free — professionally built, to the same standard as our paid work. In return we ask only for a testimonial (if you're genuinely satisfied) and permission to publish the before/after numbers.</p>
    <a class="btn btn-cream" href="#audit">Apply Via The Free Audit <span class="arr">→</span></a>
  </div>
</section>

<!-- ============ FAQ — objection handling ============ -->
<section class="section faq" id="faq-section">
  <div class="wrap wrap-narrow">
    <p class="eyebrow center reveal">Questions directors actually ask</p>
    <h2 class="center reveal d1">Straight answers.</h2>

    <div class="faq-list reveal d2">
      <details>
        <summary>Will this replace my staff?</summary>
        <p>No — it removes the repetitive work that burns them out. Your team stops copy-pasting the same answers 40 times a day and focuses on interviews, employers and placements. The humans do human work; the system does the rest.</p>
      </details>
      <details>
        <summary>My candidates use WhatsApp and speak Kiswahili or Arabic. Does it handle that?</summary>
        <p>Yes. WhatsApp-first, trilingual by design — English, Kiswahili and Arabic. That's exactly how our live Mombasa deployment runs today.</p>
      </details>
      <details>
        <summary>What about candidate data and the law?</summary>
        <p>All systems are built in line with the Kenya Data Protection Act, 2019. Your data stays yours — it's written into our Service Agreement, which you can read before paying a shilling.</p>
      </details>
      <details>
        <summary>How long until it's running?</summary>
        <p>7–21 business days from deposit, depending on scope. You get weekly progress updates and see a live demonstration before the balance is due.</p>
      </details>
      <details>
        <summary>What happens after delivery?</summary>
        <p>A monthly care plan covers hosting, monitoring and support — with a monthly report showing enquiries answered, response times and hours saved. You'll always know what the system is earning you.</p>
      </details>
      <details>
        <summary>What does the free audit involve from my side?</summary>
        <p>Two minutes to fill the form below. We do the rest from the outside — the way a candidate experiences your agency — and hand you a written report of what we find. No meetings required until you want one.</p>
      </details>
    </div>
  </div>
</section>

<!-- ============ FINAL CTA — the ONE action ============ -->
<section class="section audit" id="audit">
  <div class="wrap wrap-narrow">
    <div class="audit-card reveal">
      <p class="eyebrow center">Free · No obligation · Yours to keep</p>
      <h2 class="center">Get your free<br><em>Operations Audit.</em></h2>
      <p class="center audit-sub">We'll test your agency the way a candidate does — response time, follow-up, visibility — and send you a written report of exactly where placements are leaking. Even if you never hire us, the report is yours.</p>

      <form id="audit-form" autocomplete="on">
        <div class="form-row">
          <div class="field">
            <label for="f-agency">Agency name *</label>
            <input id="f-agency" name="agency_name" type="text" required placeholder="e.g. Coastal Manpower Ltd">
          </div>
          <div class="field">
            <label for="f-name">Your name *</label>
            <input id="f-name" name="contact_name" type="text" required placeholder="e.g. Fatma Ali">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="f-phone">Phone / WhatsApp *</label>
            <input id="f-phone" name="phone" type="tel" required placeholder="+254 7XX XXX XXX">
          </div>
          <div class="field">
            <label for="f-email">Email <span class="opt">(optional)</span></label>
            <input id="f-email" name="email" type="email" placeholder="you@agency.co.ke">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="f-size">Agency size <span class="opt">(optional)</span></label>
            <select id="f-size" name="agency_size">
              <option value="">Select…</option>
              <option>1–5 staff</option>
              <option>6–15 staff</option>
              <option>16–40 staff</option>
              <option>40+ staff</option>
            </select>
          </div>
          <div class="field">
            <label for="f-challenge">Biggest headache right now <span class="opt">(optional)</span></label>
            <select id="f-challenge" name="main_challenge">
              <option value="">Select…</option>
              <option>Slow responses / missed enquiries</option>
              <option>Document tracking &amp; compliance</option>
              <option>Follow-up falling through cracks</option>
              <option>No visibility / reporting</option>
              <option>All of the above</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-gold btn-lg btn-block" id="audit-submit">Send Me My Free Audit <span class="arr">→</span></button>
        <p class="cta-micro center">We reply within 5 minutes during business hours — we run our own speed-to-lead system, after all.</p>
        <p id="form-msg" class="form-msg" role="status"></p>
      </form>
    </div>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="footer" id="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <span class="brand-mark">NA</span>
      <div>
        <b>Naim Automation Systems Co.</b>
        <p>Automation &amp; AI systems for licensed recruitment agencies.<br>Mombasa, Kenya · Serving agencies nationwide.</p>
      </div>
    </div>
    <div class="footer-links">
      <a href="#systems-section">The Five Systems</a>
      <a href="#pricing-section">Investment</a>
      <a href="/docs">Client Document Portal</a>
      <a href="#audit">Free Audit</a>
    </div>
  </div>
  <div class="wrap footer-base">
    <span>© 2026 Naim Automation Systems Co. All rights reserved.</span>
    <span>Built on our own systems — of course.</span>
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/app.js"></script>
</body>
</html>`
}
