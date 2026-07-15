import { docLayout, signBlock } from './shared'

export function onboardingPage(): string {
  const body = `
<section class="slide cover-slide">
  <div class="slide-inner">
    <p class="eyebrow">Client Document · The Welcome Package</p>
    <h1>Welcome<br><em>Onboard.</em></h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">Your guide to working with Naim Automation Systems Co. — what happens next, what we need from you, and exactly how your new system comes to life.</p>
    <p class="cover-meta">Your Consultant: M.A. Salmin · Founder &amp; Systems Architect</p>
    <p class="cover-scroll">Scroll to begin</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Section 01 · Welcome</p>
    <h2>A word of <em>welcome.</em></h2>
    <p style="margin-top:18px;"><b>Thank you for choosing us as your automation partner.</b></p>
    <p style="margin-top:12px;">We are thrilled to formally welcome you. We help recruitment agencies grow by installing intelligent systems that answer every candidate in minutes, keep every document compliant, and put the whole business in the director's pocket — so your team focuses on placements, not paperwork.</p>
    <p style="margin-top:12px;">This Welcome Packet explains what to expect at every step of working with Naim Automation Systems Co. Keep it close — it answers most questions before they arise.</p>
    <div class="field" style="margin-top:28px;max-width:420px;">
      <label>Prepared for (Client / Agency Name)</label>
      <input class="inline-fill" data-name="prepared_for" type="text" placeholder="Your agency name">
    </div>
  </div>
</section>

<section class="slide">
  <div class="slide-inner">
    <p class="eyebrow">Section 02 · Our Promise</p>
    <h2>Four promises we <em>keep.</em></h2>
    <ul class="tick" style="margin-top:24px;">
      <li><b>Quality Engineering</b> — Every system is built to production standard, tested end-to-end, and demonstrated live before you pay the balance.</li>
      <li><b>Honest Communication</b> — Straight answers, realistic timelines, no jargon. If something is not worth automating, we will tell you.</li>
      <li><b>Measurable Results</b> — Every deliverable saves time, saves money or removes mistakes — and your monthly report shows the numbers.</li>
      <li><b>Data Respect</b> — Your candidate and business data is processed only to deliver your system, in line with the Kenya Data Protection Act.</li>
    </ul>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner">
    <p class="eyebrow">Section 03 · Process &amp; Timeline</p>
    <h2>From first call to handover — <em>21 days.</em></h2>
    <ol class="mini-steps" style="margin-top:32px;">
      <li><b>Consultation Call — Day 0</b><span>We walk through your audit, agree scope and answer every question. Booked via our scheduling link.</span></li>
      <li><b>Quotation &amp; Agreement — Days 1–3</b><span>Formal itemised quotation + service agreement. 50% deposit confirms the project.</span></li>
      <li><b>Build &amp; Weekly Updates — Days 4–18</b><span>We engineer your system and send progress updates so you are never in the dark.</span></li>
      <li><b>Live Demo &amp; Training — Days 19–20</b><span>You see the system perform live. Your team is trained. Balance is settled.</span></li>
      <li><b>Handover &amp; Care — Day 21 →</b><span>Owner's manual delivered. Monthly care plan begins the following month — with monthly reports.</span></li>
    </ol>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Section 04 · What We Need From You</p>
    <h2>Your six-item <em>checklist.</em></h2>
    <ul class="tick" style="margin-top:24px;">
      <li><b>A single contact person</b> authorised to give approvals and answer questions</li>
      <li><b>Access credentials</b> for the accounts your system will connect to (shared securely — never by plain text)</li>
      <li><b>Your current process</b> — a short walkthrough of how things are done today</li>
      <li><b>Sample data</b> — e.g. example candidate records or documents (anonymised is fine)</li>
      <li><b>Branding assets</b> — logo and preferred wording for client-facing messages</li>
      <li><b>Deposit payment</b> — the project timeline starts the day it is received</li>
    </ul>
    <div class="field" style="margin-top:28px;max-width:420px;">
      <label>Your appointed contact person (name &amp; phone)</label>
      <input class="inline-fill" data-name="contact_person" type="text" placeholder="Name — +254 7XX XXX XXX">
    </div>
  </div>
</section>

<section class="slide">
  <div class="slide-inner">
    <p class="eyebrow">Section 05 · Communication &amp; Support</p>
    <h2>Never in <em>the dark.</em></h2>
    <div class="card card-gold" style="margin-top:28px;">
      <h3>During The Build</h3>
      <p>Progress updates via WhatsApp/email. Questions answered within one business day. One weekly summary so you always know where we are.</p>
    </div>
    <div class="card" style="margin-top:20px;">
      <h3>After Handover</h3>
      <p>Support via your dedicated channel — response within one business day; emergencies prioritised. Monthly report on the 1st of each month.</p>
    </div>
    <div class="note-box" style="margin-top:26px;">
      <b>Guideline:</b> To keep your project on schedule, kindly consolidate feedback through your appointed contact person. Scope changes are always possible — they are simply quoted in writing first, so there are never surprises on the invoice.
    </div>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner" style="text-align:center;">
    <p class="eyebrow">Section 06 · Next Steps</p>
    <h2>Three steps and <em>we begin.</em></h2>
    <ol class="mini-steps" style="max-width:520px;margin:32px auto 0;text-align:left;">
      <li><b>Book your consultation call</b><span>Via our scheduling link — or simply reply on WhatsApp.</span></li>
      <li><b>Review &amp; sign</b><span>The quotation and the service agreement — both signable right here in this portal.</span></li>
      <li><b>Send the checklist items</b><span>And we begin. Your 21-day countdown starts.</span></li>
    </ol>
    <p style="margin-top:36px;font-family:'Playfair Display',serif;font-size:1.25rem;font-style:italic;">We are honoured to build with you. — M.A. Salmin</p>
  </div>
</section>

${signBlock('onboarding', 'I acknowledge receipt of this Welcome &amp; Onboarding Packet, and I have read the process, checklist and communication guidelines above. *')}
`

  return docLayout({
    title: 'Welcome & Onboarding Packet',
    docLabel: 'Welcome Packet · Onboarding',
    body,
  })
}
