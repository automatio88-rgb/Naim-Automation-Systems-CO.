import { docLayout, signBlock } from './shared'

export function foundingPartnerPage(): string {
  const body = `
<section class="slide cover-slide">
  <div class="slide-inner">
    <p class="eyebrow">Special Programme · Limited to 3 Licensed Agencies</p>
    <h1>One complete system.<br><em>Built free. In exchange for proof.</em></h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">As a founding-stage company with one flagship deployment already live, we are selecting a small number of licensed agencies to receive one automation system completely free of charge — professionally built, to the same standard as our paid work. In return, we ask only for the right to document the results.</p>
    <p class="cover-meta">Founding Partner Programme · Naim Automation Systems Co.</p>
    <p class="cover-scroll">Scroll to see the offer</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">The Exchange</p>
    <h2>What you receive. <em>What we ask.</em></h2>

    <div class="card card-gold" style="margin-top:28px;">
      <h3>✦ What You Receive — Free</h3>
      <ul class="tick" style="margin-top:12px;">
        <li><b>One complete automation system</b> of your choice from our five systems, professionally built</li>
        <li><b>Full installation, testing &amp; training</b> for your team</li>
        <li><b>30 days of free operation</b> including hosting and support</li>
        <li><b>A written Operations Audit</b> of your agency — yours to keep</li>
      </ul>
    </div>

    <div class="card" style="margin-top:22px;">
      <h3>✦ What We Ask In Return</h3>
      <ul class="tick" style="margin-top:12px;">
        <li><b>A written testimonial</b> if — and only if — you are genuinely satisfied</li>
        <li><b>Case-study rights:</b> permission to state "We built [system] for [Agency]" with before/after figures</li>
        <li><b>A referral introduction</b> to one fellow agency director, if you found the work valuable</li>
        <li><b>Feedback sessions</b> — honest input during the 30 days</li>
      </ul>
    </div>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner">
    <p class="eyebrow">After The 30 Days</p>
    <h2>You choose. <em>Zero obligation.</em></h2>
    <p style="margin-top:18px;">At the end of the free period, the decision is entirely yours:</p>
    <ul class="tick" style="margin-top:18px;">
      <li><b>(a) Continue</b> on the standard monthly care plan and keep the system running, or</li>
      <li><b>(b) End the programme</b> — the system is decommissioned, your data is returned, and we part as friends.</li>
    </ul>
    <p style="margin-top:22px;font-family:'Playfair Display',serif;font-size:1.2rem;font-style:italic;">No hidden fees. No automatic charges. Ever.</p>
  </div>
</section>

<section class="slide">
  <div class="slide-inner">
    <p class="eyebrow">Programme Terms</p>
    <h2>Seven simple <em>terms.</em></h2>

    <div class="clause" style="margin-top:28px;">
      <h3><span class="cl-num">1.</span>One System Per Agency</h3>
      <p>This programme covers one (1) system per agency, at the Provider's discretion regarding technical scope.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">2.</span>Free Period</h3>
      <p>The free period is thirty (30) days from live handover.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">3.</span>Client Access</h3>
      <p>The Client provides reasonable access and a contact person as per the Onboarding Packet.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">4.</span>Data &amp; Case-Study Figures</h3>
      <p>All data is handled per the <b>Kenya Data Protection Act, 2019</b>; case-study figures are published only in aggregate and with written approval of the final text.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">5.</span>Voluntary Testimonial</h3>
      <p>The testimonial is voluntary and conditional on genuine satisfaction.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">6.</span>Continuation</h3>
      <p>Continuation after 30 days requires a signed Service Agreement and the standard monthly care plan.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">7.</span>Exit At Any Time</h3>
      <p>Either party may end the programme at any time with written notice.</p>
    </div>

    <div class="fields-2" style="margin-top:32px;">
      <div class="field">
        <label>Chosen system (from our five systems)</label>
        <input class="inline-fill" data-name="chosen_system" type="text" placeholder="e.g. WhatsApp Candidate Response System">
      </div>
      <div class="field">
        <label>Preferred start date</label>
        <input class="inline-fill" data-name="start_date" type="text" placeholder="e.g. 1 August 2026">
      </div>
    </div>
  </div>
</section>

${signBlock('founding-partner', 'I have read and accept the seven Programme Terms above. I understand the 30-day free period carries zero obligation, no hidden fees and no automatic charges. *')}
`

  return docLayout({
    title: 'Founding Partner Offer',
    docLabel: 'Founding Partner Programme',
    body,
  })
}
