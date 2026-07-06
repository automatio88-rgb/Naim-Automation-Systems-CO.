import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ---------- API: Lead capture (our own speed-to-lead) ----------
app.post('/api/leads', async (c) => {
  try {
    const body = await c.req.json()
    const { agency_name, contact_name, phone, email, nea_reg_no, agency_size, main_challenge } = body

    if (!agency_name || !contact_name || !phone) {
      return c.json({ ok: false, error: 'Agency name, contact name and phone are required.' }, 400)
    }

    const { env } = c
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO leads (agency_name, contact_name, phone, email, nea_reg_no, agency_size, main_challenge)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        agency_name, contact_name, phone,
        email || null, nea_reg_no || null, agency_size || null, main_challenge || null
      ).run()
    }

    return c.json({ ok: true, message: 'Audit request received.' })
  } catch (e) {
    return c.json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp us directly.' }, 500)
  }
})

// Simple admin list of leads (protect with a key)
app.get('/api/leads', async (c) => {
  const key = c.req.query('key')
  if (key !== 'naim-admin-2026') return c.json({ ok: false, error: 'Unauthorized' }, 401)
  const { env } = c
  if (!env.DB) return c.json({ ok: true, leads: [] })
  const { results } = await env.DB.prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`).all()
  return c.json({ ok: true, leads: results })
})

// ---------- Landing Page ----------
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Naim Automation Systems Co. — AI Operations Systems for Recruitment Agencies</title>
<meta name="description" content="We build the AI-powered systems that run licensed recruitment agencies — candidate intake, document compliance, follow-ups and daily reporting. More placements. Less paperwork.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>

<!-- ============ NAVIGATION ============ -->
<header class="site-header" id="site-header">
  <div class="container nav-inner">
    <a href="#" class="brand" id="brand-logo">
      <span class="brand-mark">N<span class="brand-amp">A</span></span>
      <span class="brand-text">
        <span class="brand-name">Naim Automation Systems</span>
        <span class="brand-sub">C O &nbsp;·&nbsp; K E N Y A</span>
      </span>
    </a>
    <nav class="main-nav" id="main-nav">
      <a href="#systems">Systems</a>
      <a href="#flagship">The Agency Brain</a>
      <a href="#case-study">Case Study</a>
      <a href="#process">Process</a>
      <a href="#investment">Investment</a>
    </nav>
    <div class="nav-actions">
      <button class="currency-toggle" id="currency-toggle" title="Switch currency">
        <span class="cur-opt active" data-cur="KES">KES</span><span class="cur-sep">/</span><span class="cur-opt" data-cur="USD">USD</span>
      </button>
      <a href="#audit" class="btn btn-gold btn-sm">Free Audit</a>
      <button class="nav-burger" id="nav-burger" aria-label="Menu"><i class="fas fa-bars"></i></button>
    </div>
  </div>
</header>

<!-- ============ HERO ============ -->
<section class="hero" id="hero-section">
  <div class="container hero-grid">
    <div class="hero-copy reveal">
      <p class="eyebrow"><span class="eyebrow-line"></span>Automation Systems · Est. 2026 · Mombasa, Kenya</p>
      <h1>We build the systems that <em>run</em> recruitment agencies.</h1>
      <p class="hero-lead">Candidate intake, document compliance, follow-ups and daily reporting — engineered to run on autopilot, so your agency places more workers with the same team.</p>
      <div class="hero-ctas">
        <a href="#audit" class="btn btn-gold">Request Your Free Operations Audit <i class="fas fa-arrow-right"></i></a>
        <a href="#case-study" class="btn btn-ghost">See It Running Live</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><span class="stat-num" data-count="5">5</span><span class="stat-label">Automation Systems</span></div>
        <div class="stat-divider"></div>
        <div class="stat"><span class="stat-num">5<small>min</small></span><span class="stat-label">Lead Response Time</span></div>
        <div class="stat-divider"></div>
        <div class="stat"><span class="stat-num" data-count="1296">1,296</span><span class="stat-label">Licensed Agencies Served Market</span></div>
      </div>
    </div>
    <div class="hero-visual reveal delay-1">
      <figure class="img-frame img-frame-hero" id="hero-image">
        <!-- Replace with your image: /static/images/hero.jpg -->
        <img src="/static/images/hero.jpg" alt="Naim Automation Systems — the agency operations command center" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder">
          <i class="fas fa-diagram-project"></i>
          <span>Hero Image<br><small>/static/images/hero.jpg</small></span>
        </div>
        <figcaption class="img-frame-badge"><i class="fas fa-circle-check"></i> Live system — Naim Investments Ltd</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- ============ TRUST BAR ============ -->
<section class="trust-bar">
  <div class="container trust-inner">
    <span class="trust-title">Built for agencies accredited by</span>
    <div class="trust-logos">
      <span class="trust-item">NEA · National Employment Authority</span>
      <span class="trust-dot">·</span>
      <span class="trust-item">KAPEA</span>
      <span class="trust-dot">·</span>
      <span class="trust-item">Ministry of Labour</span>
      <span class="trust-dot">·</span>
      <span class="trust-item">Musaned-aligned Agencies</span>
    </div>
  </div>
</section>

<!-- ============ PROBLEM ============ -->
<section class="section problem-section" id="problem">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow center"><span class="eyebrow-line"></span>The Honest Diagnosis<span class="eyebrow-line"></span></p>
      <h2>Where agencies quietly lose placements — <em>every single week</em></h2>
    </div>
    <div class="problem-grid">
      <article class="problem-card reveal">
        <div class="problem-num">01</div>
        <h3>The 47-Hour Reply</h3>
        <p>The average business takes 47 hours to answer a new enquiry. A candidate who messages your agency and hears nothing walks straight to the agency next door.</p>
      </article>
      <article class="problem-card reveal delay-1">
        <div class="problem-num">02</div>
        <h3>Documents on Paper</h3>
        <p>Passports, Good Conduct certificates, medicals, Yellow Fever cards — tracked in files and memory. One expired document silently kills a confirmed placement.</p>
      </article>
      <article class="problem-card reveal delay-2">
        <div class="problem-num">03</div>
        <h3>The Silent Pipeline</h3>
        <p>80% of placements need five or more follow-ups. Most offices stop after one. Candidates drop off between registration, medical, visa and departure — unnoticed.</p>
      </article>
      <article class="problem-card reveal delay-3">
        <div class="problem-num">04</div>
        <h3>The Blind Director</h3>
        <p>Without opening the office, the director cannot see today's numbers. Decisions get made on feeling, not figures.</p>
      </article>
    </div>
  </div>
</section>

<!-- ============ THE 5 SYSTEMS ============ -->
<section class="section systems-section" id="systems">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow center"><span class="eyebrow-line"></span>What We Build<span class="eyebrow-line"></span></p>
      <h2>Five systems. One outcome: <em>more placements.</em></h2>
      <p class="section-lead">Each system is installed independently, works from day one, and is maintained under a simple monthly care plan.</p>
    </div>

    <div class="system-row reveal" id="system-1">
      <figure class="img-frame">
        <img src="/static/images/system-speed-to-lead.jpg" alt="5-Minute Candidate Response System" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder"><i class="fas fa-bolt"></i><span>System Image<br><small>/static/images/system-speed-to-lead.jpg</small></span></div>
      </figure>
      <div class="system-copy">
        <span class="system-index">System 01</span>
        <h3>The 5-Minute Candidate Response System</h3>
        <p>Every enquiry — WhatsApp, Facebook, website — is answered, qualified and routed to your team within minutes, in English, Kiswahili or Arabic. Responding within 5 minutes makes you up to 10× more likely to win that candidate.</p>
        <ul class="system-points">
          <li><i class="fas fa-check"></i>Instant trilingual first response, 24/7</li>
          <li><i class="fas fa-check"></i>Automatic qualification &amp; routing to the right associate</li>
          <li><i class="fas fa-check"></i>Nothing ever sits unanswered overnight again</li>
        </ul>
      </div>
    </div>

    <div class="system-row row-reverse reveal" id="system-2">
      <figure class="img-frame">
        <img src="/static/images/system-documents.jpg" alt="Document Compliance Engine" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder"><i class="fas fa-file-shield"></i><span>System Image<br><small>/static/images/system-documents.jpg</small></span></div>
      </figure>
      <div class="system-copy">
        <span class="system-index">System 02</span>
        <h3>The Document Compliance Engine</h3>
        <p>Every candidate file — passport, ID, Good Conduct, medical, Yellow Fever — digitised, checklist-enforced and expiry-monitored. The system alerts your office <em>before</em> a document expires, never after.</p>
        <ul class="system-points">
          <li><i class="fas fa-check"></i>Automatic checklist per candidate, per destination country</li>
          <li><i class="fas fa-check"></i>Expiry alerts weeks in advance</li>
          <li><i class="fas fa-check"></i>Clean, audit-ready files for NEA compliance</li>
        </ul>
      </div>
    </div>

    <div class="system-row reveal" id="system-3">
      <figure class="img-frame">
        <img src="/static/images/system-followup.jpg" alt="Candidate Journey Autopilot" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder"><i class="fas fa-route"></i><span>System Image<br><small>/static/images/system-followup.jpg</small></span></div>
      </figure>
      <div class="system-copy">
        <span class="system-index">System 03</span>
        <h3>The Candidate Journey Autopilot</h3>
        <p>From registration to departure, every candidate is moved along automatically — reminders for medicals, interview confirmations, visa updates — with a personal, human tone your candidates trust.</p>
        <ul class="system-points">
          <li><i class="fas fa-check"></i>Five-plus touchpoints without lifting a finger</li>
          <li><i class="fas fa-check"></i>Stage-by-stage tracking of every candidate</li>
          <li><i class="fas fa-check"></i>Drop-offs flagged to your team instantly</li>
        </ul>
      </div>
    </div>

    <div class="system-row row-reverse reveal" id="system-4">
      <figure class="img-frame">
        <img src="/static/images/system-reactivation.jpg" alt="Dormant Candidate Goldmine" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder"><i class="fas fa-gem"></i><span>System Image<br><small>/static/images/system-reactivation.jpg</small></span></div>
      </figure>
      <div class="system-copy">
        <span class="system-index">System 04</span>
        <h3>The Dormant Candidate Goldmine</h3>
        <p>Your old database is unclaimed revenue. We segment past candidates and cold enquiries, then re-engage them with personalised outreach — recovering placements from contacts you already own, at zero ad spend.</p>
        <ul class="system-points">
          <li><i class="fas fa-check"></i>Database cleaning, de-duplication &amp; segmentation</li>
          <li><i class="fas fa-check"></i>Personalised reactivation campaigns</li>
          <li><i class="fas fa-check"></i>Recovered revenue with no new marketing budget</li>
        </ul>
      </div>
    </div>

    <div class="system-row reveal" id="system-5">
      <figure class="img-frame">
        <img src="/static/images/system-reporting.jpg" alt="Director's Daily Briefing" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder"><i class="fas fa-chart-line"></i><span>System Image<br><small>/static/images/system-reporting.jpg</small></span></div>
      </figure>
      <div class="system-copy">
        <span class="system-index">System 05</span>
        <h3>The Director's Daily Briefing</h3>
        <p>Every morning at 7:00 AM, the director receives the full state of the agency on Telegram — new candidates, pending documents, today's appointments, overdue tasks. The whole business, in the palm of your hand.</p>
        <ul class="system-points">
          <li><i class="fas fa-check"></i>Daily briefing &amp; instant alerts on Telegram</li>
          <li><i class="fas fa-check"></i>Ask anything: "Status ya Mariam?" — answered in seconds</li>
          <li><i class="fas fa-check"></i>Weekly performance reports, automatically compiled</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ============ FLAGSHIP ============ -->
<section class="section flagship-section" id="flagship">
  <div class="container">
    <div class="flagship-card reveal">
      <div class="flagship-copy">
        <p class="eyebrow light"><span class="eyebrow-line"></span>The Flagship</p>
        <h2>The Agency Brain<span class="tm">™</span></h2>
        <p>All five systems, unified into one intelligent operations engine — the same architecture running daily operations at Naim Investments Ltd. Your agency, fully awake, 24 hours a day, in three languages.</p>
        <ul class="flagship-points">
          <li><i class="fas fa-crown"></i>All 5 systems, one command center</li>
          <li><i class="fas fa-crown"></i>Boss interface on Telegram · Candidates on WhatsApp</li>
          <li><i class="fas fa-crown"></i>English · Kiswahili · العربية</li>
          <li><i class="fas fa-crown"></i>Self-learning — grows with your agency</li>
        </ul>
        <a href="#audit" class="btn btn-cream">Enquire About The Agency Brain <i class="fas fa-arrow-right"></i></a>
      </div>
      <figure class="img-frame img-frame-flagship">
        <img src="/static/images/flagship.jpg" alt="The Agency Brain — full operations system" onerror="this.parentElement.classList.add('img-missing')">
        <div class="img-placeholder light"><i class="fas fa-brain"></i><span>Flagship Image<br><small>/static/images/flagship.jpg</small></span></div>
      </figure>
    </div>
  </div>
</section>

<!-- ============ CASE STUDY ============ -->
<section class="section case-section" id="case-study">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow center"><span class="eyebrow-line"></span>Proof, Not Promises<span class="eyebrow-line"></span></p>
      <h2>Running live at <em>Naim Investments Ltd</em></h2>
      <p class="section-lead">An accredited staffing &amp; recruiting agency in Mombasa, placing Kenyan workers across Saudi Arabia, UAE, Qatar and Kuwait — now operated by the systems we build.</p>
    </div>
    <div class="case-grid">
      <div class="case-metrics reveal">
        <div class="case-metric">
          <span class="metric-val">47h <i class="fas fa-arrow-right-long"></i> 5min</span>
          <span class="metric-label">Candidate response time</span>
        </div>
        <div class="case-metric">
          <span class="metric-val">155+</span>
          <span class="metric-label">Candidates managed in pipeline</span>
        </div>
        <div class="case-metric">
          <span class="metric-val">7:00 AM</span>
          <span class="metric-label">Director's daily briefing, every day</span>
        </div>
        <div class="case-metric">
          <span class="metric-val">3</span>
          <span class="metric-label">Languages served — EN · SW · AR</span>
        </div>
      </div>
      <blockquote class="case-quote reveal delay-1">
        <i class="fas fa-quote-left quote-mark"></i>
        <p class="quote-body" id="testimonial-text">Testimonial from Abdalla Mohamed, Director &amp; Founder of Naim Investments Ltd, will appear here upon system handover.</p>
        <footer>
          <span class="quote-name">A.M. Abdalla</span>
          <span class="quote-role">Director &amp; Founder — Naim Investments Ltd, Mombasa</span>
        </footer>
      </blockquote>
    </div>
  </div>
</section>

<!-- ============ PROCESS ============ -->
<section class="section process-section" id="process">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow center"><span class="eyebrow-line"></span>How We Work<span class="eyebrow-line"></span></p>
      <h2>A clean, professional engagement — <em>from first hello to handover</em></h2>
    </div>
    <div class="process-grid">
      <div class="process-step reveal">
        <span class="step-num">1</span>
        <h3>Free Operations Audit</h3>
        <p>We study your agency and hand you a written report showing exactly where time, candidates and money are leaking. Yours to keep — no obligation.</p>
      </div>
      <div class="process-step reveal delay-1">
        <span class="step-num">2</span>
        <h3>Consultation Call</h3>
        <p>A scheduled session to walk through the audit together, understand your operations, and agree the right system for your agency.</p>
      </div>
      <div class="process-step reveal delay-2">
        <span class="step-num">3</span>
        <h3>Quotation &amp; Agreement</h3>
        <p>You receive a formal itemised quotation and service agreement. 50% deposit to begin, 50% upon completion. Everything in writing.</p>
      </div>
      <div class="process-step reveal delay-3">
        <span class="step-num">4</span>
        <h3>Build &amp; Handover</h3>
        <p>Your system is built, tested and demonstrated live. Your team is trained. Delivery in 7–21 business days depending on scope.</p>
      </div>
      <div class="process-step reveal delay-4">
        <span class="step-num">5</span>
        <h3>Monthly Care &amp; Reports</h3>
        <p>Hosting, upkeep and support under a simple monthly plan — with a professional monthly report showing exactly what your system achieved.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ INVESTMENT ============ -->
<section class="section invest-section" id="investment">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow center"><span class="eyebrow-line"></span>Investment<span class="eyebrow-line"></span></p>
      <h2>Transparent. Itemised. <em>In writing.</em></h2>
      <p class="section-lead">Setup is a one-time engineering fee. The monthly plan covers hosting, upkeep and support — exactly as stated in your service agreement.</p>
    </div>
    <div class="pricing-grid">
      <article class="price-card reveal">
        <h3>Single System</h3>
        <p class="price-desc">One system, installed and running. Ideal first step.</p>
        <div class="price-line">
          <span class="price-val" data-kes="From KES 45,000" data-usd="From $350">From KES 45,000</span>
          <span class="price-note">one-time setup</span>
        </div>
        <div class="price-line sub">
          <span class="price-val-sub" data-kes="+ KES 6,000–10,000/month" data-usd="+ $45–80/month">+ KES 6,000–10,000/month</span>
          <span class="price-note">care plan</span>
        </div>
        <ul class="price-points">
          <li><i class="fas fa-check"></i>Any one of the five systems</li>
          <li><i class="fas fa-check"></i>Delivery in 7–14 business days</li>
          <li><i class="fas fa-check"></i>Team training included</li>
          <li><i class="fas fa-check"></i>Monthly performance report</li>
        </ul>
        <a href="#audit" class="btn btn-outline-gold">Start With an Audit</a>
      </article>

      <article class="price-card featured reveal delay-1">
        <span class="featured-badge">Most Chosen</span>
        <h3>Growth Bundle</h3>
        <p class="price-desc">Any three systems working together as one.</p>
        <div class="price-line">
          <span class="price-val" data-kes="From KES 120,000" data-usd="From $950">From KES 120,000</span>
          <span class="price-note">one-time setup</span>
        </div>
        <div class="price-line sub">
          <span class="price-val-sub" data-kes="+ KES 15,000/month" data-usd="+ $120/month">+ KES 15,000/month</span>
          <span class="price-note">care plan</span>
        </div>
        <ul class="price-points">
          <li><i class="fas fa-check"></i>Three integrated systems</li>
          <li><i class="fas fa-check"></i>Delivery in 14–21 business days</li>
          <li><i class="fas fa-check"></i>Priority support channel</li>
          <li><i class="fas fa-check"></i>Quarterly strategy review</li>
        </ul>
        <a href="#audit" class="btn btn-gold">Start With an Audit</a>
      </article>

      <article class="price-card reveal delay-2">
        <h3>The Agency Brain™</h3>
        <p class="price-desc">The complete flagship — all five systems, unified.</p>
        <div class="price-line">
          <span class="price-val" data-kes="From KES 250,000" data-usd="From $2,000">From KES 250,000</span>
          <span class="price-note">one-time setup</span>
        </div>
        <div class="price-line sub">
          <span class="price-val-sub" data-kes="+ KES 25,000/month" data-usd="+ $200/month">+ KES 25,000/month</span>
          <span class="price-note">care plan</span>
        </div>
        <ul class="price-points">
          <li><i class="fas fa-check"></i>All five systems, one brain</li>
          <li><i class="fas fa-check"></i>Telegram command center for the director</li>
          <li><i class="fas fa-check"></i>Trilingual candidate channel</li>
          <li><i class="fas fa-check"></i>Dedicated onboarding &amp; live demo day</li>
        </ul>
        <a href="#audit" class="btn btn-outline-gold">Enquire Now</a>
      </article>
    </div>
    <p class="invest-footnote reveal">Payment terms: 50% deposit, 50% upon completion · Formal quotation &amp; service agreement provided before any work begins.</p>
  </div>
</section>

<!-- ============ AUDIT / LEAD FORM ============ -->
<section class="section audit-section" id="audit">
  <div class="container audit-grid">
    <div class="audit-copy reveal">
      <p class="eyebrow"><span class="eyebrow-line"></span>Free · Limited Availability</p>
      <h2>Request your free<br><em>Agency Operations Audit</em></h2>
      <p>We take on a limited number of audits each month so every report is done properly. You receive a written, personalised report showing:</p>
      <ul class="audit-points">
        <li><i class="fas fa-magnifying-glass-chart"></i>How fast your agency currently responds to a new candidate — tested by us</li>
        <li><i class="fas fa-magnifying-glass-chart"></i>Where candidates are dropping out of your pipeline</li>
        <li><i class="fas fa-magnifying-glass-chart"></i>Which of the five systems would return the most for your agency — with the math</li>
      </ul>
      <p class="audit-promise"><i class="fas fa-handshake"></i> No obligation. The report is yours to keep, whoever you build with.</p>
    </div>
    <form class="audit-form reveal delay-1" id="audit-form">
      <h3>Book Your Audit</h3>
      <div class="form-row">
        <label for="f-agency">Agency Name *</label>
        <input type="text" id="f-agency" name="agency_name" required placeholder="e.g. Naim Investments Ltd">
      </div>
      <div class="form-row two-col">
        <div>
          <label for="f-name">Your Name *</label>
          <input type="text" id="f-name" name="contact_name" required placeholder="Full name">
        </div>
        <div>
          <label for="f-phone">WhatsApp Number *</label>
          <input type="tel" id="f-phone" name="phone" required placeholder="+254 7XX XXX XXX">
        </div>
      </div>
      <div class="form-row two-col">
        <div>
          <label for="f-email">Email</label>
          <input type="email" id="f-email" name="email" placeholder="you@agency.co.ke">
        </div>
        <div>
          <label for="f-nea">NEA Reg. No. <small>(optional)</small></label>
          <input type="text" id="f-nea" name="nea_reg_no" placeholder="RA/20XX/XX/XX">
        </div>
      </div>
      <div class="form-row">
        <label for="f-size">Agency Size</label>
        <select id="f-size" name="agency_size">
          <option value="">Select…</option>
          <option value="1-5">1–5 staff</option>
          <option value="6-15">6–15 staff</option>
          <option value="16-50">16–50 staff</option>
          <option value="50+">50+ staff</option>
        </select>
      </div>
      <div class="form-row">
        <label for="f-challenge">Your biggest operational headache</label>
        <textarea id="f-challenge" name="main_challenge" rows="3" placeholder="e.g. We lose track of candidate documents / candidates go quiet after registration…"></textarea>
      </div>
      <button type="submit" class="btn btn-gold btn-block" id="audit-submit">Request My Free Audit <i class="fas fa-arrow-right"></i></button>
      <p class="form-status" id="form-status"></p>
      <p class="form-privacy"><i class="fas fa-lock"></i> Your details are used only to prepare your audit. Never shared.</p>
    </form>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="site-footer" id="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <span class="brand-mark light">N<span class="brand-amp">A</span></span>
      <p class="footer-name">Naim Automation Systems Co.</p>
      <p class="footer-tag">More placements. Less paperwork.</p>
    </div>
    <div class="footer-col">
      <h4>Systems</h4>
      <a href="#system-1">5-Minute Response</a>
      <a href="#system-2">Document Compliance</a>
      <a href="#system-3">Journey Autopilot</a>
      <a href="#system-4">Database Goldmine</a>
      <a href="#system-5">Director's Briefing</a>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="#case-study">Case Study</a>
      <a href="#process">How We Work</a>
      <a href="#investment">Investment</a>
      <a href="#audit">Free Audit</a>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <a href="mailto:hello@naimautomation.com"><i class="fas fa-envelope"></i> hello@naimautomation.com</a>
      <a href="#"><i class="fab fa-whatsapp"></i> WhatsApp Business</a>
      <span class="footer-loc"><i class="fas fa-location-dot"></i> Mombasa, Kenya · Serving East Africa &amp; the Gulf</span>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>© 2026 Naim Automation Systems Co. — Digital Services Division. All rights reserved.</span>
      <span>English · Kiswahili · العربية</span>
    </div>
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
