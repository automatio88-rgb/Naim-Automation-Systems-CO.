import { docLayout, signBlock } from './shared'

export function quotationPage(): string {
  const body = `
<section class="slide cover-slide">
  <div class="slide-inner">
    <p class="eyebrow">Official Document · NAS-Q-2026</p>
    <h1>Project<br><em>Quotation.</em></h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">Your itemised investment for the design, engineering and deployment of your automation system — delivered to production standard, demonstrated live before final payment.</p>
    <p class="cover-meta">Naim Automation Systems Co. · Valid 30 days from date of issue</p>
    <p class="cover-scroll">Scroll to review</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Section 01 · Project Details</p>
    <h2>Who this quotation <em>is for.</em></h2>
    <p>Fill in your project details below — they will be attached to your signed acceptance.</p>
    <div class="fields-2" style="margin-top:28px;">
      <div class="field">
        <label>Quotation No.</label>
        <input class="inline-fill" data-name="quotation_no" type="text" placeholder="NAS-Q-2026-____">
      </div>
      <div class="field">
        <label>Date</label>
        <input class="inline-fill" data-name="date" type="text" placeholder="e.g. 14 July 2026">
      </div>
      <div class="field">
        <label>Project / System</label>
        <input class="inline-fill" data-name="project" type="text" placeholder="e.g. WhatsApp Candidate Response System">
      </div>
      <div class="field">
        <label>Client / Agency</label>
        <input class="inline-fill" data-name="client_agency" type="text" placeholder="Your agency name">
      </div>
    </div>
    <div class="card card-gold" style="margin-top:32px;">
      <h3>Summary of Service</h3>
      <p>Design, engineering and deployment of the automation system(s) itemised below, including professional configuration, testing, live demonstration, team training and final handover — delivered to production standard.</p>
      <ul class="tick" style="margin-top:14px;">
        <li><b>Payment Terms:</b> 50% deposit · 50% upon completion &amp; live demonstration</li>
        <li><b>Delivery Timeline:</b> 7–21 business days after confirmation &amp; deposit</li>
      </ul>
    </div>
  </div>
</section>

<section class="slide">
  <div class="slide-inner">
    <p class="eyebrow">Section 02 · Cost Breakdown</p>
    <h2>Exactly what your investment <em>covers.</em></h2>
    <table class="tbl">
      <thead>
        <tr><th>Component</th><th>Amount (KES)</th></tr>
      </thead>
      <tbody>
        <tr><td>Administrative &amp; Project Setup Fee <span class="pct">(10%)</span></td><td><input class="inline-fill" data-name="fee_admin" type="text" placeholder="—"></td></tr>
        <tr><td>Consultation &amp; Systems Architecture Fee <span class="pct">(15%)</span></td><td><input class="inline-fill" data-name="fee_consultation" type="text" placeholder="—"></td></tr>
        <tr><td>Intellectual &amp; System Development Fee <span class="pct">(25%)</span></td><td><input class="inline-fill" data-name="fee_development" type="text" placeholder="—"></td></tr>
        <tr><td>Automation Engineering &amp; Integration Fee <span class="pct">(25%)</span></td><td><input class="inline-fill" data-name="fee_engineering" type="text" placeholder="—"></td></tr>
        <tr><td>Testing, Training &amp; Quality Assurance Fee <span class="pct">(15%)</span></td><td><input class="inline-fill" data-name="fee_qa" type="text" placeholder="—"></td></tr>
        <tr><td>Final Delivery, Handover &amp; Documentation Fee <span class="pct">(10%)</span></td><td><input class="inline-fill" data-name="fee_handover" type="text" placeholder="—"></td></tr>
        <tr class="total"><td><b>TOTAL SETUP FEE</b> <span class="pct">(one-time)</span></td><td>KES <input class="inline-fill" data-name="total_setup_fee" type="text" placeholder="—"></td></tr>
      </tbody>
    </table>

    <table class="tbl">
      <thead>
        <tr><th>Monthly Service Package (required)</th><th>Amount (KES)</th></tr>
      </thead>
      <tbody>
        <tr class="total"><td>Hosting, upkeep, monitoring &amp; basic support <span class="pct">(as per Service Agreement)</span></td><td><input class="inline-fill" data-name="monthly_fee" type="text" placeholder="—"> /month</td></tr>
      </tbody>
    </table>
    <p style="font-size:0.9rem;color:#6f6650;">Begins the month after final delivery. Covers server/hosting upkeep, system monitoring and basic support as per contract. International clients: USD equivalent quotation available on request.</p>

    <div class="note-box">
      <b>Please note:</b> Certain components of this project are non-refundable as they cover consultation, systems architecture and development costs already incurred once the project begins. Kindly review the Refund Policy in the <a href="/docs/agreement" style="color:#b8860b;">Service Agreement</a> for full detail.
    </div>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner">
    <p class="eyebrow">Section 03 · Payment Details</p>
    <h2>How to <em>pay.</em></h2>
    <div class="fields-2" style="margin-top:28px;">
      <div class="field">
        <label>Bank</label>
        <input class="inline-fill" data-name="bank_name" type="text" placeholder="Bank name">
      </div>
      <div class="field">
        <label>Account Name</label>
        <input class="inline-fill" data-name="bank_account_name" type="text" placeholder="Account name">
      </div>
      <div class="field">
        <label>Account Number</label>
        <input class="inline-fill" data-name="bank_account_no" type="text" placeholder="Account number">
      </div>
      <div class="field">
        <label>M-PESA (Till / Paybill)</label>
        <input class="inline-fill" data-name="mpesa" type="text" placeholder="M-PESA number">
      </div>
    </div>
    <p style="margin-top:18px;font-size:0.9rem;">Payment reference: please use your agency name and quotation number. A receipt is issued for every payment.</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Section 04 · What's Included</p>
    <h2>Included with <em>every project.</em></h2>
    <ul class="tick" style="margin-top:24px;">
      <li><b>Live demonstration</b> and acceptance walkthrough before final payment</li>
      <li><b>Team training</b> for your staff on daily use of the system</li>
      <li><b>Handover documentation</b> — a clear owner's manual for your agency</li>
      <li><b>30-day post-delivery adjustment window</b> for refinements within agreed scope</li>
    </ul>
    <div class="note-box" style="margin-top:28px;">
      <b>Acceptance:</b> By signing below, the Client accepts this quotation and acknowledges agreement with the accompanying <a href="/docs/agreement" style="color:#b8860b;">Service Agreement (Contract)</a>.
    </div>
  </div>
</section>

${signBlock('quotation', 'I have read this quotation in full. I accept the itemised costs and payment terms above, and I acknowledge the accompanying Service Agreement. *')}
`

  return docLayout({
    title: 'Quotation',
    docLabel: 'Quotation · NAS-Q-2026',
    body,
  })
}
