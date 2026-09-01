// Client Document Portal — Naim Automation Systems Co.
// SINGLE FIXED SCREEN: no scrolling. Two documents, one clear order.
// Progress-based and honest: step 2 unlocks only after step 1 is signed & submitted.
// Espresso / cream / gold — matching the documents and the landing page.

export function docsHubPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Client Document Portal — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
<link rel="icon" type="image/png" sizes="64x64" href="/static/images/favicon.png">
<link rel="apple-touch-icon" href="/static/images/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
<style>
:root{
  --espresso:#211812; --espresso-2:#2b1f18; --cream:#efe6d6;
  --gold:#c8a24a; --gold-deep:#b89040; --gold-soft:#d8bc7a;
  --dk:#e8dbc2; --dk-soft:#b6a88c;
  --rule:rgba(232,215,180,0.22);
  --serif:'Playfair Display',Georgia,serif; --sans:'Jost','Segoe UI',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{font-family:var(--sans);font-weight:300;background:var(--espresso);color:var(--dk);line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
em{font-style:italic}

.screen{position:fixed;inset:0;display:flex;flex-direction:column}

/* ---------- Topbar ---------- */
.topbar{flex-shrink:0;background:rgba(33,24,18,0.97);border-bottom:1px solid var(--rule)}
.topbar-in{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 20px}
.topbar .brand{display:flex;align-items:center;gap:10px}
.topbar .brand img{width:32px;height:32px}
.topbar .brand-name{font-family:var(--serif);font-style:italic;font-size:0.92rem;color:#f2e7cf;white-space:nowrap}
.topbar .tag{font-size:0.56rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-soft);border:1px solid rgba(216,188,122,0.4);border-radius:999px;padding:5px 13px;white-space:nowrap}

/* ---------- Center ---------- */
.center{flex:1;display:flex;align-items:center;justify-content:center;padding:14px 20px;min-height:0}
.inner{width:100%;max-width:960px;animation:fadeUp .6s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

.head{text-align:center;margin-bottom:clamp(16px,3.4vh,34px)}
.head .eyebrow{font-size:clamp(0.56rem,1.6vw,0.68rem);letter-spacing:0.32em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.head h1{font-family:var(--serif);font-weight:500;line-height:1.12;font-size:clamp(1.7rem,5.6vw,3rem);color:#f2e7cf}
.head h1 em{color:var(--gold-soft)}
.head .sub{max-width:520px;margin:clamp(8px,1.8vh,14px) auto 0;font-size:clamp(0.85rem,2.3vw,0.98rem);color:var(--dk-soft)}

/* ---------- Cards ---------- */
.cards{display:grid;grid-template-columns:1fr;gap:12px;align-items:stretch}
.doc-card{position:relative;display:flex;flex-direction:column;background:var(--espresso-2);border:1px solid var(--rule);border-radius:14px;padding:clamp(16px,3vh,26px) clamp(18px,3vw,28px);transition:border-color .25s,transform .25s;overflow:hidden}
.doc-card:hover{border-color:var(--gold-soft);transform:translateY(-3px)}
.doc-card .num{position:absolute;right:14px;top:6px;font-family:var(--serif);font-style:italic;font-size:clamp(50px,9vw,84px);line-height:1;color:rgba(216,188,122,0.12);pointer-events:none;user-select:none}
.doc-card .step-tag{display:inline-flex;align-items:center;gap:8px;font-size:0.56rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:clamp(8px,1.6vh,14px)}
.doc-card .step-tag .pill{border:1px solid var(--gold-soft);border-radius:999px;padding:4px 12px}
.doc-card .step-tag .start{background:var(--gold);color:#241a10;border-radius:999px;padding:5px 13px;font-weight:500;letter-spacing:0.2em;animation:glow 2.4s ease infinite}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(200,162,74,0.35)}50%{box-shadow:0 0 0 8px rgba(200,162,74,0)}}
.doc-card h2{font-family:var(--serif);font-weight:500;line-height:1.15;font-size:clamp(1.2rem,3.4vw,1.7rem);color:#f2e7cf;margin-bottom:clamp(6px,1.4vh,10px)}
.doc-card h2 em{color:var(--gold-soft)}
.doc-card .desc{font-size:clamp(0.8rem,2.2vw,0.92rem);color:var(--dk-soft);margin-bottom:clamp(10px,2vh,18px);max-width:400px}
.doc-card .facts{display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:clamp(10px,2.2vh,20px);font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--dk-soft)}
.doc-card .facts span::before{content:"— ";color:var(--gold-deep)}
.doc-card .open{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:9px;background:var(--gold);color:#241a10;border-radius:999px;padding:12px 26px;font-weight:500;font-size:0.9rem;letter-spacing:0.05em;transition:background .2s}
.doc-card .open:hover{background:var(--gold-soft)}

/* locked / done states */
.doc-card.locked .open{background:none;border:1px solid var(--rule);color:var(--dk-soft);cursor:default}
.doc-card.locked:hover{border-color:var(--rule);transform:none}
.doc-card .locknote{display:none;margin-top:10px;font-size:0.78rem;font-style:italic;color:var(--gold-soft)}
.doc-card.locked .locknote{display:block}
.doc-card .done-badge{display:none;margin-top:10px;font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold-soft)}
.doc-card.done .done-badge{display:inline-flex;align-items:center;gap:7px}
.doc-card.done .done-badge::before{content:"✦"}

/* connector between cards */
.connector{display:none}

/* ---------- Foot line ---------- */
.foot{flex-shrink:0;text-align:center;padding:10px 20px 14px;font-size:0.6rem;letter-spacing:0.22em;text-transform:uppercase;color:#8d7f65;border-top:1px solid var(--rule)}

/* ---------- Desktop ---------- */
@media(min-width:760px){
  .cards{grid-template-columns:1fr auto 1fr}
  .connector{display:flex;align-items:center}
  .connector .line{width:34px;border-top:1px dashed var(--gold-deep)}
}
@media(max-height:620px) and (max-width:759px){
  .head .sub{display:none}
  .doc-card .desc{display:none}
}
</style>
</head>
<body>

<div class="screen">

  <header class="topbar">
    <div class="topbar-in">
      <a class="brand" href="/">
        <img src="/static/images/naim-logo.png" alt="NaiM Agency logo">
        <span class="brand-name">Naim Automation Systems Co.</span>
      </a>
      <span class="tag">Client Document Portal</span>
    </div>
  </header>

  <main class="center">
    <div class="inner">

      <div class="head" id="portal-hero">
        <p class="eyebrow">Private &amp; Confidential · For Our Clients</p>
        <h1>Two documents.<br><em>Signed on your phone.</em></h1>
        <p class="sub">No printing, no scanning. Read page by page, sign with your finger — we receive it instantly, while we are together on the call.</p>
      </div>

      <div class="cards" id="document-path">

        <!-- STEP 1 · ONBOARDING -->
        <a class="doc-card" id="card-onboarding" href="/docs/onboarding">
          <span class="num">01</span>
          <span class="step-tag"><span class="start">Start here</span><span class="pill">Step 1 of 2</span></span>
          <h2>Welcome &amp;<br><em>Onboarding Guide.</em></h2>
          <p class="desc">How we work, what we need from you, and how payment works — one page at a time.</p>
          <div class="facts">
            <span>About 5 minutes</span>
            <span>Sign to acknowledge</span>
          </div>
          <span class="open">Open the guide →</span>
          <span class="done-badge">Signed &amp; submitted</span>
        </a>

        <div class="connector" aria-hidden="true"><span class="line"></span></div>

        <!-- STEP 2 · QUOTATION & SERVICE AGREEMENT CONTRACT -->
        <a class="doc-card locked" id="card-quotation" href="/docs/quotation">
          <span class="num">02</span>
          <span class="step-tag"><span class="pill">Step 2 of 2</span></span>
          <h2>Quotation &amp; Service<br><em>Agreement Contract.</em></h2>
          <p class="desc">Your itemised quotation and the thirteen clauses that protect both of us — one signature.</p>
          <div class="facts">
            <span>Fill in, date &amp; sign</span>
            <span>PDF copy shared</span>
          </div>
          <span class="open" id="quotation-open">Unlocks after step 1</span>
          <span class="locknote">Sign the Onboarding Guide first — this unlocks the moment you submit it.</span>
          <span class="done-badge">Signed &amp; submitted</span>
        </a>

      </div>

    </div>
  </main>

  <footer class="foot">Naim Automation Systems Co. · Nairobi, Kenya · © 2026</footer>

</div>

<script>
/* Progress-based portal: reflect honest completion state from the documents */
(function () {
  'use strict';
  var onboardingDone = null, quotationDone = null;
  try {
    onboardingDone = localStorage.getItem('naim_done_onboarding');
    quotationDone = localStorage.getItem('naim_done_quotation');
  } catch (e) {}

  var cardOnb = document.getElementById('card-onboarding');
  var cardQuo = document.getElementById('card-quotation');
  var quoOpen = document.getElementById('quotation-open');

  if (onboardingDone) {
    cardOnb.classList.add('done');
    cardQuo.classList.remove('locked');
    quoOpen.textContent = 'Open the contract →';
  } else {
    /* honest gate: block navigation while locked */
    cardQuo.addEventListener('click', function (e) {
      if (cardQuo.classList.contains('locked')) {
        e.preventDefault();
        cardQuo.querySelector('.locknote').style.display = 'block';
      }
    });
  }
  if (quotationDone) {
    cardQuo.classList.add('done');
  }
})();
</script>
</body>
</html>`
}
