import { docLayout, signBlock } from './shared'

export function agreementPage(): string {
  const body = `
<section class="slide cover-slide">
  <div class="slide-inner">
    <p class="eyebrow">Legal Document · NAS-SA-2026 · Private &amp; Confidential</p>
    <h1>Service<br><em>Agreement.</em></h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">The terms of engagement between Naim Automation Systems Co. and the Client for the design, build, deployment and care of automation systems. Thirteen clear clauses — written in plain language.</p>
    <p class="cover-meta">Provider: Naim Automation Systems Co. · Represented by M.A. Salmin</p>
    <p class="cover-scroll">Scroll to read the terms</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Agreement Details</p>
    <h2>This agreement <em>is between.</em></h2>
    <div class="fields-2" style="margin-top:28px;">
      <div class="field">
        <label>Agreement No.</label>
        <input class="inline-fill" data-name="agreement_no" type="text" placeholder="NAS-SA-2026-____">
      </div>
      <div class="field">
        <label>Date</label>
        <input class="inline-fill" data-name="date" type="text" placeholder="e.g. 14 July 2026">
      </div>
      <div class="field">
        <label>Client / Agency</label>
        <input class="inline-fill" data-name="client_agency" type="text" placeholder="Your agency name">
      </div>
      <div class="field">
        <label>Client Representative &amp; Title</label>
        <input class="inline-fill" data-name="client_rep" type="text" placeholder="Name — Title">
      </div>
    </div>
  </div>
</section>

<section class="slide">
  <div class="slide-inner">
    <p class="eyebrow">Terms · Clauses 1–5</p>
    <h2>The <em>foundations.</em></h2>

    <div class="clause" style="margin-top:28px;">
      <h3><span class="cl-num">1.</span>Parties &amp; Definitions</h3>
      <p>This Service Agreement ("Agreement") is entered into between <b>Naim Automation Systems Co.</b> ("the Provider"), represented by <b>M.A. Salmin</b>, and the Client named above ("the Client"). "System" means the automation system(s) described in the accepted Quotation, which forms part of this Agreement.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">2.</span>Scope of Services</h3>
      <p>The Provider shall design, build, test and deploy the System as itemised in the accepted Quotation. Work outside the itemised scope ("Change Requests") shall be quoted separately in writing before commencement. Nothing in this Agreement obliges the Provider to perform services not expressly stated.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">3.</span>Fees &amp; Payment Terms</h3>
      <ul>
        <li><b>Setup Fee:</b> 50% deposit due upon signing; 50% balance due upon completion and live demonstration, before final handover.</li>
        <li><b>Monthly Service Package:</b> due from the month following final delivery; covers hosting, upkeep, monitoring and basic support.</li>
        <li><b>Late payment:</b> service may be suspended where any amount remains unpaid 14 days after its due date, upon written notice.</li>
        <li>All fees are quoted in KES unless stated otherwise; USD equivalents available for international clients.</li>
      </ul>
    </div>

    <div class="clause">
      <h3><span class="cl-num">4.</span>Refund Policy</h3>
      <p>Components covering consultation, systems architecture and development are <b>non-refundable once the project begins</b>, as these costs are incurred immediately. Where the Provider fails to deliver the agreed System and the failure is not remedied within 21 days of written notice, the Client is entitled to a refund of amounts paid for undelivered components.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">5.</span>Delivery, Acceptance &amp; Training</h3>
      <p>Delivery timelines (7–21 business days by scope) commence upon receipt of the deposit and all required client materials. Acceptance occurs upon live demonstration of the System performing the agreed functions. The Provider shall train the Client's team and supply handover documentation. A 30-day post-delivery adjustment window is included for refinements within the agreed scope.</p>
    </div>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Terms · Clauses 6–11</p>
    <h2>Working <em>together.</em></h2>

    <div class="clause" style="margin-top:28px;">
      <h3><span class="cl-num">6.</span>Client Obligations</h3>
      <p>The Client shall provide timely access to necessary accounts, information and personnel; ensure the accuracy of data supplied; and appoint a contact person authorised to give approvals. Delays caused by the Client extend delivery timelines accordingly.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">7.</span>Data Protection &amp; Confidentiality</h3>
      <p>Each party shall keep the other's confidential information strictly confidential. The Provider shall process personal data (including candidate data) only for the purpose of delivering the System, in line with the <b>Kenya Data Protection Act, 2019</b>. The Provider shall implement reasonable technical measures to protect such data and shall not sell or disclose it to third parties.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">8.</span>Intellectual Property</h3>
      <p>Upon full payment, the Client receives a perpetual licence to use the System for its business operations. Underlying frameworks, tooling, know-how and reusable components remain the intellectual property of the Provider. The Provider may reference the project and non-confidential outcomes in its portfolio unless the Client opts out in writing.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">9.</span>Service Levels &amp; Support</h3>
      <p>Under the Monthly Service Package, the Provider shall monitor the System, apply necessary upkeep, and respond to support requests within one business day. Emergency outages are prioritised. Support excludes new features, which are handled as Change Requests.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">10.</span>Limitation of Liability</h3>
      <p>The Provider's total liability under this Agreement shall not exceed the total fees paid by the Client in the six (6) months preceding the claim. Neither party is liable for indirect or consequential losses. Nothing limits liability that cannot be limited by law.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">11.</span>Term, Suspension &amp; Termination</h3>
      <p>The Monthly Service Package continues month-to-month and may be cancelled by either party on 30 days' written notice. Upon termination, the Provider shall hand over Client data in a standard format. Hosting-dependent functions cease when hosting ends.</p>
    </div>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner">
    <p class="eyebrow">Terms · Clauses 12–13</p>
    <h2>Final <em>provisions.</em></h2>

    <div class="clause" style="margin-top:28px;">
      <h3><span class="cl-num">12.</span>Dispute Resolution &amp; Governing Law</h3>
      <p>The parties shall first attempt to resolve any dispute amicably within 21 days. Unresolved disputes shall be referred to mediation before litigation. This Agreement is governed by the laws of the <b>Republic of Kenya</b>.</p>
    </div>

    <div class="clause">
      <h3><span class="cl-num">13.</span>Entire Agreement</h3>
      <p>This Agreement, together with the accepted Quotation and any signed annexes, constitutes the entire agreement between the parties and supersedes all prior discussions. Amendments are valid only in writing signed by both parties.</p>
    </div>

    <div class="note-box" style="margin-top:32px;">
      This document is a professional services template and does not constitute legal advice. Parties are encouraged to seek independent legal review before execution.
    </div>
  </div>
</section>

${signBlock('agreement', 'I confirm that I have read and understood all thirteen (13) clauses of this Service Agreement, and I sign it as the duly authorised representative of the Client. *')}
`

  return docLayout({
    title: 'Service Agreement',
    docLabel: 'Service Agreement · NAS-SA-2026',
    body,
  })
}
