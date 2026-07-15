// Shared layout for the interactive document suite
// Slide-deck style: full-screen gold/cream sections, fill-in fields, signature pad

export function docLayout(opts: {
  title: string
  docLabel: string
  body: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.title} — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link href="/static/docs.css" rel="stylesheet">
</head>
<body>

<header class="doc-topbar">
  <a class="brand" href="/">
    <span class="brand-mark">NA</span>
    <span class="brand-words">
      <span class="brand-name">Naim Automation Systems Co.</span>
      <span class="brand-tag">Official Client Document</span>
    </span>
  </a>
  <span class="doc-label">${opts.docLabel}</span>
</header>

<main class="doc-main">
${opts.body}
</main>

<footer class="doc-footer">
  <span>© 2026 Naim Automation Systems Co. · Mombasa, Kenya</span>
  <span class="gold">✦</span>
  <span>Questions? WhatsApp us any time.</span>
</footer>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/docs.js"></script>
</body>
</html>`
}

// Reusable signature + agree + submit block (posts to /api/docs/submit)
export function signBlock(docType: string, agreeText: string): string {
  return `
<section class="slide sign-slide" id="sign-section">
  <div class="slide-inner">
    <p class="eyebrow">Review · Sign · Submit</p>
    <h2>Sign right here,<br><em>on this screen.</em></h2>
    <p class="sign-sub">No printing. No scanning. Draw your signature with your finger or mouse, tick the box, and press submit — we receive everything instantly.</p>

    <div class="sign-grid">
      <div class="field">
        <label for="s-name">Your full name *</label>
        <input id="s-name" type="text" required placeholder="e.g. Fatma Ali Hassan">
      </div>
      <div class="field">
        <label for="s-agency">Agency / company name *</label>
        <input id="s-agency" type="text" required placeholder="e.g. Coastal Manpower Ltd">
      </div>
      <div class="field">
        <label for="s-phone">Phone / WhatsApp</label>
        <input id="s-phone" type="tel" placeholder="+254 7XX XXX XXX">
      </div>
      <div class="field">
        <label for="s-email">Email</label>
        <input id="s-email" type="email" placeholder="you@agency.co.ke">
      </div>
    </div>

    <div class="sig-wrap">
      <label class="sig-title">Draw your signature below *</label>
      <div class="sig-pad-frame">
        <canvas id="sig-pad" aria-label="Signature pad"></canvas>
        <span class="sig-hint" id="sig-hint">✍ Sign here with your finger</span>
      </div>
      <button type="button" class="sig-clear" id="sig-clear">Clear &amp; sign again</button>
    </div>

    <label class="agree-row">
      <input type="checkbox" id="s-agree">
      <span>${agreeText}</span>
    </label>

    <button type="button" class="btn btn-gold btn-lg btn-block" id="doc-submit" data-doc-type="${docType}">
      Sign &amp; Submit This Document <span class="arr">→</span>
    </button>
    <p id="doc-msg" class="doc-msg" role="status"></p>

    <div class="submitted-panel" id="submitted-panel" hidden>
      <div class="sp-seal">✦</div>
      <h3>Signed &amp; received.</h3>
      <p>Thank you — your signed document has reached us instantly. <b>M.A. Salmin</b> will be in touch shortly to confirm next steps. Welcome aboard.</p>
      <a class="btn btn-outline" href="/docs">Back to Document Portal</a>
    </div>
  </div>
</section>`
}
