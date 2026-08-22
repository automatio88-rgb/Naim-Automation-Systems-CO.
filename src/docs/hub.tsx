// Client Document Portal — Naim Automation Systems Co.
// Two documents. One clear order. Start here → Onboarding Guide → Quotation & Service Agreement Contract.
// Progress-based and honest: step 2 unlocks only after step 1 is signed & submitted.
// Espresso / cream / gold — matching the documents and the landing page.

export function docsHubPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  --ink-on-dark:#e8dbc2; --ink-on-dark-soft:#b6a88c;
  --rule-dark:rgba(232,215,180,0.22);
  --serif:'Playfair Display',Georgia,serif; --sans:'Jost','Segoe UI',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);font-weight:300;background:var(--espresso);color:var(--ink-on-dark);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block}
em{font-style:italic}
h1,h2{font-family:var(--serif);font-weight:500;line-height:1.12}
h1{font-size:clamp(2.4rem,7.5vw,4.2rem)}
h2{font-size:clamp(1.7rem,5vw,2.6rem)}
h1 em,h2 em{color:var(--gold-soft)}
.eyebrow{font-size:0.72rem;letter-spacing:0.34em;text-transform:uppercase;color:var(--gold);font-weight:400;margin-bottom:20px}

.wrap{max-width:880px;margin:0 auto;padding:0 24px}

/* ---------- Topbar ---------- */
.topbar{position:sticky;top:0;z-index:50;background:rgba(33,24,18,0.96);backdrop-filter:blur(10px);border-bottom:1px solid var(--rule-dark)}
.topbar-inner{max-width:880px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 24px}
.topbar .brand{display:flex;align-items:center;gap:11px}
.topbar .brand img{width:38px;height:38px}
.topbar .brand-name{font-family:var(--serif);font-style:italic;font-size:1rem;color:#f2e7cf}
.topbar .tag{font-size:0.62rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);border:1px solid rgba(216,188,122,0.4);border-radius:999px;padding:6px 15px;white-space:nowrap}

/* ---------- Hero ---------- */
.hero{padding:90px 0 70px;text-align:center;animation:fadeUp .6s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.hero-logo{width:86px;height:86px;margin:0 auto 34px;filter:drop-shadow(0 6px 24px rgba(0,0,0,0.4))}
.hero .rule{width:78px;border-bottom:1px solid var(--gold-soft);margin:30px auto}
.hero .sub{max-width:560px;margin:0 auto;font-size:1.05rem;color:var(--ink-on-dark-soft)}
.hero .meta{margin-top:34px;font-size:0.64rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--ink-on-dark-soft)}

/* ---------- Progress path ---------- */
.path{padding:30px 0 40px}
.path-head{text-align:center;margin-bottom:44px}
.path-head p{max-width:520px;margin:14px auto 0;font-size:1rem;color:var(--ink-on-dark-soft)}

.doc-card{position:relative;display:block;background:var(--espresso-2);border:1px solid var(--rule-dark);border-radius:14px;padding:34px 26px 30px;margin-bottom:0;transition:border-color .25s,transform .25s;animation:fadeUp .6s ease both}
.doc-card:hover{border-color:var(--gold-soft);transform:translateY(-3px)}
.doc-card .step-tag{display:inline-flex;align-items:center;gap:10px;font-size:0.64rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:18px}
.doc-card .step-tag .pill{border:1px solid var(--gold-soft);border-radius:999px;padding:5px 14px}
.doc-card .step-tag .start{background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:6px 15px;font-weight:500;letter-spacing:0.22em}
.doc-card h2{color:#f2e7cf;margin-bottom:14px}
.doc-card .desc{max-width:560px;font-size:0.99rem;color:var(--ink-on-dark-soft);margin-bottom:22px}
.doc-card .facts{display:flex;flex-wrap:wrap;gap:10px 26px;margin-bottom:26px;font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.doc-card .facts span::before{content:"— ";color:var(--gold-deep)}
.doc-card .open{display:inline-flex;align-items:center;gap:10px;background:var(--gold);color:#241a10;border-radius:999px;padding:14px 30px;font-weight:500;font-size:0.95rem;letter-spacing:0.05em;transition:background .2s}
.doc-card .open:hover{background:var(--gold-soft)}
.doc-card .num{position:absolute;right:18px;top:12px;font-family:var(--serif);font-style:italic;font-size:clamp(64px,12vw,104px);line-height:1;color:rgba(216,188,122,0.12);pointer-events:none;user-select:none}

/* connector */
.connector{display:flex;flex-direction:column;align-items:center;padding:8px 0}
.connector .dot{width:5px;height:5px;border-radius:50%;background:var(--gold-deep);margin:5px 0}

/* locked state */
.doc-card.locked{opacity:1}
.doc-card.locked .open{background:none;border:1px solid var(--rule-dark);color:var(--ink-on-dark-soft);cursor:default}
.doc-card.locked .open:hover{background:none}
.doc-card.locked:hover{border-color:var(--rule-dark);transform:none}
.doc-card .locknote{display:none;margin-top:16px;font-size:0.88rem;font-style:italic;color:var(--gold-soft)}
.doc-card.locked .locknote{display:block}
.doc-card .done-badge{display:none;margin-top:16px;font-size:0.8rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold-soft)}
.doc-card.done .done-badge{display:inline-flex;align-items:center;gap:8px}
.doc-card.done .done-badge::before{content:"✦"}

/* ---------- How it works ---------- */
.how{padding:56px 0 30px;border-top:1px solid var(--rule-dark);margin-top:50px}
.how-head{text-align:center;margin-bottom:40px}
.mini-steps{list-style:none;max-width:560px;margin:0 auto}
.mini-steps li{display:flex;flex-direction:column;gap:3px;padding:17px 0;border-bottom:1px solid var(--rule-dark);counter-increment:step}
.mini-steps li b{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.12rem;color:#f2e7cf}
.mini-steps li b::before{content:counter(step,decimal-leading-zero)". ";color:var(--gold-soft)}
.mini-steps li span{font-size:0.95rem;color:var(--ink-on-dark-soft)}

/* ---------- Honesty note ---------- */
.honesty{padding:50px 0 20px;text-align:center}
.honesty .card{max-width:620px;margin:0 auto;border:1px solid var(--rule-dark);border-radius:14px;padding:36px 28px;background:var(--espresso-2)}
.honesty .card h2{font-size:clamp(1.4rem,4vw,1.9rem);color:#f2e7cf;margin-bottom:14px}
.honesty .card p{font-size:0.98rem;color:var(--ink-on-dark-soft);max-width:500px;margin:0 auto}

/* ---------- Footer ---------- */
.footer{margin-top:70px;padding:44px 20px;text-align:center;background:#1a120d;color:#8d7f65;font-size:0.8rem}
.footer img{width:44px;height:44px;margin:0 auto 16px}
.footer .fp{margin-bottom:6px;color:var(--ink-on-dark-soft)}

@media(min-width:760px){
  .doc-card{padding:44px 46px 40px}
}
</style>
</head>
<body>

<!-- ============ TOPBAR ============ -->
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/">
      <img src="/static/images/naim-logo.png" alt="NaiM Agency logo">
      <span class="brand-name">Naim Automation Systems Co.</span>
    </a>
    <span class="tag">Client Document Portal</span>
  </div>
</header>

<main>

<!-- ============ HERO ============ -->
<section class="hero wrap" id="portal-hero">
  <img class="hero-logo" src="/static/images/naim-logo.png" alt="NaiM Agency logo">
  <p class="eyebrow">Private &amp; Confidential · For Our Clients</p>
  <h1>Two documents.<br><em>Signed on your phone.</em></h1>
  <div class="rule"></div>
  <p class="sub">No printing. No scanning. No email attachments. Read at your own pace, fill in your details, sign with your finger — and we receive everything instantly, while we are together on the call.</p>
  <p class="meta">Naim Automation Systems Co. · Nairobi, Kenya</p>
</section>

<!-- ============ PROGRESS PATH ============ -->
<section class="path wrap" id="document-path">
  <div class="path-head">
    <p class="eyebrow" style="margin-bottom:10px;">Your path</p>
    <h2>Start here. <em>Finish signed.</em></h2>
    <p>The documents open in order — first the guide that explains everything, then the contract that makes it official. That way, nothing in the contract will surprise you.</p>
  </div>

  <!-- STEP 1 · ONBOARDING -->
  <a class="doc-card" id="card-onboarding" href="/docs/onboarding">
    <span class="num">01</span>
    <span class="step-tag"><span class="start">Start here</span><span class="pill">Step 1 of 2</span></span>
    <h2>Welcome &amp;<br><em>Onboarding Guide.</em></h2>
    <p class="desc">Your guide to working with us — the process, the guidelines, what we need from you, and how payment works. It reveals one page at a time, so nothing important is missed, and it ends with a simple acknowledgement signature.</p>
    <div class="facts">
      <span>9 short pages</span>
      <span>About 5 minutes</span>
      <span>Sign to acknowledge</span>
    </div>
    <span class="open">Open the guide →</span>
    <span class="done-badge">Signed &amp; submitted</span>
  </a>

  <div class="connector" aria-hidden="true">
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
  </div>

  <!-- STEP 2 · QUOTATION & SERVICE AGREEMENT CONTRACT -->
  <a class="doc-card locked" id="card-quotation" href="/docs/quotation">
    <span class="num">02</span>
    <span class="step-tag"><span class="pill">Step 2 of 2</span></span>
    <h2>Quotation &amp; Service<br><em>Agreement Contract.</em></h2>
    <p class="desc">One document, one signature: your itemised quotation — full cost breakdown, payment terms, banking &amp; M-PESA details — together with the thirteen plain-language clauses that protect both of us. After you sign, we acknowledge it and share your own PDF copy.</p>
    <div class="facts">
      <span>Quotation + 13 clauses</span>
      <span>Fill in, date &amp; sign</span>
      <span>PDF copy shared with you</span>
    </div>
    <span class="open" id="quotation-open">Unlocks after step 1</span>
    <span class="locknote">Finish and sign the Onboarding Guide first — this contract unlocks the moment you submit it.</span>
    <span class="done-badge">Signed &amp; submitted</span>
  </a>
</section>

<!-- ============ HOW IT WORKS ============ -->
<section class="how wrap" id="how-it-works">
  <div class="how-head">
    <p class="eyebrow" style="margin-bottom:10px;">How it works</p>
    <h2>Read. Fill. Sign. <em>Done.</em></h2>
  </div>
  <ol class="mini-steps">
    <li><b>Open the guide</b><span>It reveals one page at a time — read at your own pace, nothing is rushed.</span></li>
    <li><b>Confirm as you go</b><span>Each page simply asks if you've read and understood it before the next one appears.</span></li>
    <li><b>Sign with your finger</b><span>Draw your signature right on the screen — exactly like signing on paper.</span></li>
    <li><b>Press submit</b><span>We receive it instantly, and the next document unlocks for you automatically.</span></li>
  </ol>
</section>

<!-- ============ HONESTY NOTE ============ -->
<section class="honesty wrap" id="why-in-order">
  <div class="card">
    <h2>Why in this order?</h2>
    <p>Because these documents protect you as much as they protect us. The guide explains everything first, so that when you sign the contract, you sign it understanding every line — no pressure, no surprises.</p>
  </div>
</section>

</main>

<!-- ============ FOOTER ============ -->
<footer class="footer">
  <img src="/static/images/naim-logo.png" alt="">
  <p class="fp">Naim Automation Systems Co. &mdash; Nairobi, Kenya</p>
  <p>&copy; 2026 Naim Automation Systems Co. All rights reserved. Questions? WhatsApp us any time.</p>
</footer>

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
