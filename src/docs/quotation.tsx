// Quotation — Naim Automation Systems Co.
// Mobile-first port of the agent-designed paper/gold quotation sheet.
// Palette: paper #f5efe2, gold #c8a24a. Playfair Display + Jost.
// Fill-in fields (project details, KES amounts, banking / M-PESA) + signature block.
// Posts to /api/docs/submit, doc_type "quotation".

export function quotationPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quotation — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
<link rel="apple-touch-icon" href="/static/images/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#f5efe2; --paper-2:#efe6d3; --white:#fdfaf3;
  --gold:#c8a24a; --gold-deep:#a8862f; --gold-soft:#dcc086; --gold-pale:#f0e5c8;
  --ink:#2b2117; --ink-soft:#5d5140; --ink-faint:#8b7e68;
  --line:rgba(43,33,23,0.18); --line-soft:rgba(43,33,23,0.1);
  --espresso:#211812;
  --serif:'Playfair Display',Georgia,serif; --sans:'Jost','Segoe UI',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);font-weight:300;background:var(--paper-2);color:var(--ink);line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block}

.sheet{position:relative;max-width:900px;margin:0 auto;background:var(--paper);box-shadow:0 24px 70px -30px rgba(43,33,23,0.35);overflow:hidden}
.sheet-inner{position:relative;z-index:2;padding:38px 22px 60px}
.watermark{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);z-index:1;width:min(70vw,520px);opacity:0.05;pointer-events:none;user-select:none}
.watermark img{width:100%}

/* Header */
.q-header{display:flex;flex-direction:column;gap:22px;padding-bottom:26px;border-bottom:1px solid var(--line)}
.q-brand{display:flex;align-items:center;gap:14px}
.q-brand img{width:56px;height:56px}
.q-brand .script{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.3rem;line-height:1.2}
.q-brand .sub{font-size:0.66rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-deep);margin-top:4px}
.q-contacts{display:flex;flex-direction:column;gap:8px;font-size:0.9rem;color:var(--ink-soft)}
.q-contacts .row{display:flex;align-items:center;gap:10px}
.q-contacts svg{width:17px;height:17px;stroke:var(--gold-deep);fill:none;stroke-width:1.5;flex-shrink:0}

.doc-title{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(2.6rem,9vw,4rem);color:var(--gold-deep);text-align:center;margin:40px 0 34px}

.section{margin-top:34px}
.section-label{font-size:0.7rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold-deep);font-weight:500;padding-bottom:10px;border-bottom:1px solid var(--line);margin-bottom:18px}
.para{font-size:0.98rem;color:var(--ink-soft);max-width:680px}

/* Fields */
.fields{display:grid;grid-template-columns:1fr;gap:14px}
.field{display:flex;flex-direction:column;gap:4px}
.field .k{font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-faint)}
.field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);padding:8px 2px;font-family:var(--sans);font-weight:400;font-size:1rem;color:var(--ink);outline:none;border-radius:0}
.field input:focus{border-bottom-color:var(--gold)}
.field input::placeholder{color:rgba(139,126,104,0.55);font-weight:300}
.field .fixed{font-size:0.98rem;color:var(--ink);padding:8px 2px;border-bottom:1px solid var(--line-soft)}

/* Cost table */
.cost-table{width:100%;border-collapse:collapse;font-size:0.94rem}
.cost-table th{font-size:0.68rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-deep);font-weight:500;text-align:left;padding:10px 8px;border-bottom:1px solid var(--line)}
.cost-table th:last-child{text-align:right}
.cost-table td{padding:13px 8px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
.cost-table td.amount{text-align:right;white-space:nowrap;font-weight:400}
.cost-table td.amount .cur{color:var(--ink-faint);font-size:0.82rem;margin-right:6px}
.cost-table input{width:110px;background:transparent;border:none;border-bottom:1px solid var(--line);padding:4px 2px;text-align:right;font-family:var(--sans);font-weight:400;font-size:0.96rem;color:var(--ink);outline:none;border-radius:0}
.cost-table input:focus{border-bottom-color:var(--gold)}
.cost-table input::placeholder{color:rgba(139,126,104,0.5)}
.total-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:18px;padding:16px 8px;background:var(--gold-pale);border:1px solid var(--gold-soft)}
.total-row .k{font-family:var(--serif);font-style:italic;font-size:1.15rem;color:var(--ink)}
.total-row .v{display:flex;align-items:baseline;gap:8px;white-space:nowrap}
.total-row .cur{font-size:0.82rem;color:var(--ink-faint)}
.total-row input{width:150px;background:transparent;border:none;border-bottom:1px solid var(--gold-deep);padding:4px 2px;text-align:right;font-family:var(--serif);font-weight:500;font-size:1.2rem;color:var(--ink);outline:none;border-radius:0}
.monthly-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:22px;padding-top:16px;border-top:1px solid var(--line)}
.monthly-row .k{font-size:0.92rem;font-weight:400}
.monthly-row .v{display:flex;align-items:baseline;gap:6px;white-space:nowrap;font-size:0.95rem}
.monthly-row input{width:110px;background:transparent;border:none;border-bottom:1px solid var(--line);padding:4px 2px;text-align:right;font-family:var(--sans);font-weight:400;font-size:0.96rem;color:var(--ink);outline:none;border-radius:0}
.monthly-row input:focus{border-bottom-color:var(--gold)}
.monthly-note{margin-top:10px;font-size:0.82rem;color:var(--ink-faint);font-style:italic}

/* Please note */
.please-note{margin-top:34px;padding:20px 22px;background:var(--gold-pale);border-left:3px solid var(--gold);font-size:0.92rem;color:var(--ink-soft)}
.please-note strong{color:var(--ink);font-weight:500}

/* Signature area */
.acceptance-body{font-size:0.96rem;color:var(--ink-soft);max-width:680px;margin-bottom:26px}
.sign-grid{display:grid;grid-template-columns:1fr;gap:20px}
.sig-wrap{margin-top:30px}
.sig-title{display:block;font-size:0.7rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:12px;font-weight:500}
.sig-pad-frame{position:relative;height:180px;background:var(--white);border:1px solid var(--gold-soft);border-radius:6px;overflow:hidden}
.sig-pad-frame canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
.sig-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.86rem;letter-spacing:0.1em;color:var(--ink-faint);pointer-events:none}
.sig-pad-frame.signed .sig-hint{display:none}
.sig-clear{margin-top:12px;background:none;border:1px solid var(--line);color:var(--ink-soft);font-family:var(--sans);font-weight:300;font-size:0.76rem;letter-spacing:0.16em;text-transform:uppercase;padding:9px 20px;border-radius:999px;cursor:pointer}
.sig-clear:hover{border-color:var(--gold);color:var(--gold-deep)}
.consultant-box{margin-top:30px;padding:18px 20px;border:1px solid var(--line-soft);font-size:0.92rem;color:var(--ink-soft)}
.consultant-box .role{font-size:0.68rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:8px}
.consultant-box .name{font-family:var(--serif);font-style:italic;font-size:1.1rem;color:var(--ink)}
.agree-row{display:flex;gap:14px;align-items:flex-start;margin-top:32px;cursor:pointer;font-size:0.94rem;color:var(--ink-soft);max-width:660px}
.agree-row input{margin-top:5px;width:19px;height:19px;accent-color:var(--gold);flex-shrink:0}
#doc-submit{margin-top:34px;width:100%;max-width:520px;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:17px 32px;font-family:var(--sans);font-weight:500;font-size:1rem;letter-spacing:0.06em;cursor:pointer;transition:background .2s}
#doc-submit:hover{background:var(--gold-soft)}
#doc-submit:disabled{opacity:0.6;cursor:wait}
.doc-msg{margin-top:14px;font-size:0.92rem;min-height:1.4em}
.doc-msg.err{color:#b0432f}
.submitted-panel{margin-top:26px;border:1px solid var(--gold-soft);background:var(--white);padding:44px 26px;text-align:center;max-width:640px}
.submitted-panel .sp-seal{font-size:1.4rem;color:var(--gold);margin-bottom:12px}
.submitted-panel h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.7rem;margin-bottom:12px}
.submitted-panel p{color:var(--ink-soft);max-width:440px;margin:0 auto 24px}
.submitted-panel .btn-back{display:inline-block;border:1px solid var(--gold);color:var(--gold-deep);border-radius:999px;padding:11px 26px;font-size:0.84rem;letter-spacing:0.1em}

/* Footer band */
.footer-band{margin-top:52px;background:var(--espresso);color:#e8dbc2;text-align:center;padding:34px 20px}
.footer-band img{width:44px;height:44px;margin:0 auto 14px}
.footer-band .head{font-size:0.64rem;letter-spacing:0.3em;text-transform:uppercase;color:#b6a88c;margin-bottom:10px}
.footer-band .line-1{font-family:var(--serif);font-style:italic;font-size:1.3rem;color:#f2e7cf}
.footer-band .line-2{font-size:0.72rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-soft);margin-top:6px}
.copy-line{text-align:center;font-size:0.74rem;color:var(--ink-faint);padding:20px 16px 8px;background:var(--paper)}

@media(min-width:760px){
  .sheet-inner{padding:56px 64px 70px}
  .q-header{flex-direction:row;align-items:flex-start;justify-content:space-between}
  .fields{grid-template-columns:1fr 1fr;gap:16px 40px}
  .sign-grid{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<article class="sheet">
  <div class="watermark" aria-hidden="true"><img src="/static/images/naim-logo.png" alt=""></div>
  <div class="sheet-inner">

    <!-- HEADER -->
    <header class="q-header">
      <div class="q-brand">
        <img src="/static/images/naim-logo.png" alt="NaiM Agency logo">
        <div>
          <div class="script">Naim Automation Systems Co.</div>
          <div class="sub">Automation &amp; AI Systems · Nairobi</div>
        </div>
      </div>
      <div class="q-contacts">
        <div class="row">
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>
          <span>tech@naimautomation.com</span>
        </div>
        <div class="row">
          <svg viewBox="0 0 24 24"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.9L2.5 21.5l3.7-1A11 11 0 1 0 20.5 3.5z"/></svg>
          <span>+254 7XX XXX XXX</span>
        </div>
      </div>
    </header>

    <h1 class="doc-title">Quotation</h1>

    <!-- PROJECT DETAILS -->
    <section class="section" id="project-details">
      <div class="section-label">Project Details</div>
      <div class="fields">
        <div class="field"><span class="k">Project</span><input type="text" data-name="project" placeholder="e.g. Candidate Intake Automation System"></div>
        <div class="field"><span class="k">Client</span><input type="text" data-name="client" placeholder="Agency / company name"></div>
        <div class="field"><span class="k">Contact No</span><input type="tel" data-name="contact_no" placeholder="+254 7XX XXX XXX"></div>
        <div class="field"><span class="k">Email Address</span><input type="email" data-name="email_address" placeholder="you@agency.co.ke"></div>
        <div class="field"><span class="k">Quotation Date</span><input type="text" data-name="quotation_date" placeholder="DD / MM / YYYY"></div>
        <div class="field"><span class="k">Payment Terms</span><span class="fixed">50% deposit, 50% upon completion</span></div>
        <div class="field"><span class="k">Delivery Timeline</span><span class="fixed">7–21 business days after confirmation &amp; deposit</span></div>
      </div>
    </section>

    <!-- SUMMARY -->
    <section class="section" id="summary">
      <div class="section-label">Summary of Service</div>
      <p class="para">Design, engineering and deployment of the custom automation system(s) itemised below. Includes professional configuration, testing, live demonstration, team training and final handover in production-ready format.</p>
    </section>

    <!-- COST BREAKDOWN -->
    <section class="section" id="cost-breakdown">
      <div class="section-label">Cost Breakdown</div>
      <table class="cost-table">
        <thead>
          <tr><th>Component</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr><td>Administrative &amp; Project Setup Fee (10%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_admin_setup" placeholder="—"></td></tr>
          <tr><td>Consultation &amp; Systems Architecture Fee (15%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_consultation_architecture" placeholder="—"></td></tr>
          <tr><td>Intellectual &amp; System Development Fee (25%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_system_development" placeholder="—"></td></tr>
          <tr><td>Automation Engineering &amp; Integration Fee (25%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_engineering_integration" placeholder="—"></td></tr>
          <tr><td>Testing, Training &amp; Quality Assurance Fee (15%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_testing_training_qa" placeholder="—"></td></tr>
          <tr><td>Final Delivery, Handover &amp; Documentation Fee (10%)</td><td class="amount"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="fee_delivery_handover" placeholder="—"></td></tr>
        </tbody>
      </table>
      <div class="total-row">
        <span class="k">Total Fee</span>
        <span class="v"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="total_fee" placeholder="—"></span>
      </div>
      <div class="monthly-row">
        <span class="k">Monthly Service Package (Required)</span>
        <span class="v"><span class="cur">KES</span><input class="inline-fill" type="text" inputmode="numeric" data-name="monthly_service_fee" placeholder="—"><span>/ month</span></span>
      </div>
      <p class="monthly-note">Starts the month after final delivery. Covers server/hosting upkeep + basic support as per contract.</p>
    </section>

    <!-- PLEASE NOTE -->
    <div class="please-note">
      <strong>Please note:</strong> Certain components of this project are non-refundable as they cover consultation, systems architecture, and development costs already incurred once the project begins. Kindly review our Refund Policy in the attached Service Agreement for full detail.
    </div>

    <!-- BANKING -->
    <section class="section" id="banking-details">
      <div class="section-label">Banking Details</div>
      <div class="fields">
        <div class="field"><span class="k">Bank</span><input type="text" data-name="bank" placeholder=""></div>
        <div class="field"><span class="k">Account Type</span><input type="text" data-name="account_type" placeholder=""></div>
        <div class="field"><span class="k">Account Number</span><input type="text" data-name="account_number" placeholder=""></div>
        <div class="field"><span class="k">Branch Code</span><input type="text" data-name="branch_code" placeholder=""></div>
        <div class="field"><span class="k">M-PESA (Till / Paybill)</span><input type="text" data-name="mpesa_till_paybill" placeholder=""></div>
        <div class="field"><span class="k">Reference</span><span class="fixed">Client Name / Project Name</span></div>
      </div>
    </section>

    <!-- ACCEPTANCE + SIGNATURE -->
    <section class="section" id="sign-section">
      <div class="section-label">Acceptance</div>
      <p class="acceptance-body">By signing below or confirming by Email/WhatsApp, the Client accepts this quotation and acknowledges agreement with the attached Service Agreement (Contract).</p>

      <div class="sign-grid">
        <div class="field">
          <span class="k">Your full name *</span>
          <input id="s-name" type="text" required placeholder="e.g. Fatma Ali Hassan">
        </div>
        <div class="field">
          <span class="k">Agency / company name *</span>
          <input id="s-agency" type="text" required placeholder="e.g. Coastal Manpower Ltd">
        </div>
        <div class="field">
          <span class="k">Phone / WhatsApp</span>
          <input id="s-phone" type="tel" placeholder="+254 7XX XXX XXX">
        </div>
        <div class="field">
          <span class="k">Email</span>
          <input id="s-email" type="email" placeholder="you@agency.co.ke">
        </div>
      </div>

      <div class="sig-wrap">
        <label class="sig-title">Client — draw your signature below *</label>
        <div class="sig-pad-frame">
          <canvas id="sig-pad" aria-label="Signature pad"></canvas>
          <span class="sig-hint" id="sig-hint">Sign here with your finger</span>
        </div>
        <button type="button" class="sig-clear" id="sig-clear">Clear &amp; sign again</button>
      </div>

      <div class="consultant-box">
        <div class="role">Systems Consultant</div>
        <div class="name">M.A. Salmin — Naim Automation Systems Co.</div>
      </div>

      <label class="agree-row">
        <input type="checkbox" id="s-agree">
        <span>I have read and accept this quotation, including the cost breakdown, payment terms and refund policy referenced in the Service Agreement.</span>
      </label>

      <button type="button" id="doc-submit" data-doc-type="quotation">
        Sign &amp; Submit This Quotation →
      </button>
      <p id="doc-msg" class="doc-msg" role="status"></p>

      <div class="submitted-panel" id="submitted-panel" hidden>
        <div class="sp-seal">✦</div>
        <h3>Signed &amp; received.</h3>
        <p>Thank you — your signed quotation has reached us instantly. <b>M.A. Salmin</b> will be in touch shortly to confirm next steps.</p>
        <a class="btn-back" href="/docs">Back to Document Portal</a>
      </div>
    </section>

  </div>

  <!-- FOOTER BAND -->
  <footer class="footer-band">
    <img src="/static/images/naim-logo.png" alt="">
    <div class="head">Presented By</div>
    <div class="line-1">Naim Automation Systems Co.</div>
    <div class="line-2">Automation &amp; AI Systems Division</div>
  </footer>
  <div class="copy-line">© Copyright 2026 Naim Automation Systems Co. · Nairobi, Kenya</div>
</article>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/docs.js"></script>
</body>
</html>`
}
