import { docLayout } from './shared'

export function docsHubPage(): string {
  const body = `
<section class="slide cover-slide">
  <div class="slide-inner">
    <p class="eyebrow">Naim Automation Systems Co. · Client Portal</p>
    <h1>Your documents,<br><em>signed on your phone.</em></h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">No printing. No scanning. No email attachments. Open the document you need, read it in a beautiful full-screen view, fill in your details, and sign right on your screen — we receive it instantly.</p>
    <p class="cover-meta">Official Digital Document Suite · Mombasa, Kenya</p>
    <p class="cover-scroll">Choose your document</p>
  </div>
</section>

<section class="slide alt">
  <div class="slide-inner">
    <p class="eyebrow">Select a document</p>
    <h2>Four documents. <em>One tap each.</em></h2>
    <div class="hub-grid">
      <a class="hub-card" href="/docs/quotation">
        <span class="hub-num">01</span>
        <h3>Quotation</h3>
        <p>Your itemised project quotation — full cost breakdown, payment terms, banking &amp; M-PESA details. Review and accept with your signature.</p>
        <span class="hub-open">Open &amp; sign →</span>
      </a>
      <a class="hub-card" href="/docs/agreement">
        <span class="hub-num">02</span>
        <h3>Service Agreement</h3>
        <p>The professional services contract — 13 clear clauses covering scope, fees, data protection, support and your rights. Sign to execute.</p>
        <span class="hub-open">Open &amp; sign →</span>
      </a>
      <a class="hub-card" href="/docs/founding-partner">
        <span class="hub-num">03</span>
        <h3>Founding Partner Offer</h3>
        <p>The limited programme: one complete automation system, built free, in exchange for proof. Limited to 3 licensed agencies.</p>
        <span class="hub-open">Open &amp; sign →</span>
      </a>
      <a class="hub-card" href="/docs/onboarding">
        <span class="hub-num">04</span>
        <h3>Welcome &amp; Onboarding</h3>
        <p>Your guide to working with us — the process, the timeline, what we need from you, and how support works. Acknowledge receipt.</p>
        <span class="hub-open">Open &amp; acknowledge →</span>
      </a>
    </div>
  </div>
</section>

<section class="slide dark">
  <div class="slide-inner" style="text-align:center;">
    <p class="eyebrow">How it works</p>
    <h2>Read. Fill. Sign. <em>Done.</em></h2>
    <ol class="mini-steps" style="max-width:560px;margin-left:auto;margin-right:auto;text-align:left;">
      <li><b>Open the document</b><span>Everything is on one beautiful page — scroll through at your own pace.</span></li>
      <li><b>Fill in the blanks</b><span>Type your details directly into the golden fields on screen.</span></li>
      <li><b>Sign with your finger</b><span>Draw your signature in the signing box — exactly like signing on paper.</span></li>
      <li><b>Press submit</b><span>We receive your signed document instantly, and M.A. Salmin confirms next steps.</span></li>
    </ol>
  </div>
</section>`

  return docLayout({
    title: 'Client Document Portal',
    docLabel: 'Document Portal',
    body,
  })
}
