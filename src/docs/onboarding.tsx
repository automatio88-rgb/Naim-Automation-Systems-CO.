// Welcome & Onboarding Guide — Naim Automation Systems Co.
// REVEAL-STYLE deck: one page at a time. Nothing is revealed until the reader
// confirms they have read and understood the current page. Honest, simple, calm.
// Espresso #211812 / cream #efe6d6 / gold #c8a24a · Playfair Display + Jost.
// Ends with acknowledge + signature (posts to /api/docs/submit, doc_type "onboarding").

export function onboardingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Onboarding Guide — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
<link rel="icon" type="image/png" sizes="64x64" href="/static/images/favicon.png">
<link rel="apple-touch-icon" href="/static/images/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
<style>
:root{
  --espresso:#211812; --espresso-2:#2b1f18; --cream:#efe6d6; --cream-2:#e9dfcc;
  --gold:#c8a24a; --gold-deep:#b89040; --gold-soft:#d8bc7a;
  --ink-on-dark:#e8dbc2; --ink-on-dark-soft:#b6a88c; --ink-on-cream:#2b1f18; --ink-on-cream-soft:#5c4f3e;
  --rule-dark:rgba(232,215,180,0.22); --rule-light:rgba(43,31,24,0.22);
  --serif:'Playfair Display',Georgia,serif; --sans:'Jost','Segoe UI',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);font-weight:300;background:var(--espresso);color:var(--ink-on-dark);line-height:1.7;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
em{font-style:italic}
h1,h2{font-family:var(--serif);font-weight:500;line-height:1.12}
h1{font-size:clamp(2.4rem,7.5vw,4.4rem)}
h2{font-size:clamp(1.9rem,5.6vw,3rem)}
h1 em,h2 em{color:var(--gold)}
.eyebrow{font-size:0.72rem;letter-spacing:0.34em;text-transform:uppercase;color:var(--gold);font-weight:400;margin-bottom:22px}

/* ---------- Deck rail (progress) ---------- */
.deck-rail{position:fixed;top:0;left:0;right:0;z-index:60;background:rgba(33,24,18,0.96);backdrop-filter:blur(10px);border-bottom:1px solid var(--rule-dark)}
.deck-rail-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 22px}
.deck-rail .rb-brand{display:flex;align-items:center;gap:10px;font-size:0.62rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink-on-dark-soft);white-space:nowrap;overflow:hidden}
.deck-rail .rb-brand img{width:24px;height:24px;flex-shrink:0}
.deck-rail .rb-count{font-family:var(--serif);font-style:italic;font-size:0.95rem;color:var(--gold-soft);white-space:nowrap}
.deck-progress{height:2px;background:rgba(216,188,122,0.15)}
.deck-progress .bar{height:100%;width:0;background:var(--gold);transition:width .5s ease}

/* ---------- Pages (reveal) ---------- */
.pg{display:none;position:relative;overflow:hidden;padding:110px 26px 60px;min-height:100vh}
.pg.active{display:block;animation:pageIn .55s ease both}
@keyframes pageIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.pg.dark{background:var(--espresso);color:var(--ink-on-dark)}
.pg.cream{background:var(--cream);color:var(--ink-on-cream)}
.pg-inner{position:relative;max-width:960px;margin:0 auto;z-index:2}
.sec-tag{font-size:0.64rem;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:44px;padding-bottom:14px}
.pg.dark .sec-tag{color:var(--ink-on-dark-soft);border-bottom:1px solid var(--rule-dark)}
.pg.cream .sec-tag{color:var(--ink-on-cream-soft);border-bottom:1px solid var(--rule-light)}
.page-num{position:absolute;right:8px;bottom:120px;z-index:1;font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(110px,22vw,200px);line-height:1;pointer-events:none;user-select:none}
.pg.dark .page-num{color:rgba(216,188,122,0.13)}
.pg.cream .page-num{color:rgba(184,144,64,0.15)}

/* ---------- Read-confirm gate ---------- */
.gate{position:relative;z-index:3;margin-top:64px;border-radius:10px;padding:26px 24px}
.pg.dark .gate{background:rgba(43,31,24,0.72);border:1px solid var(--rule-dark)}
.pg.cream .gate{background:rgba(255,252,244,0.72);border:1px solid var(--rule-light)}
.gate .q{font-family:var(--serif);font-style:italic;font-size:1.15rem;margin-bottom:16px}
.pg.dark .gate .q{color:#f2e7cf}
.pg.cream .gate .q{color:var(--ink-on-cream)}
.gate .btns{display:flex;flex-wrap:wrap;gap:12px}
.gate .yes{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:13px 26px;font-family:var(--sans);font-weight:500;font-size:0.94rem;letter-spacing:0.05em;cursor:pointer;transition:background .2s}
.gate .yes:hover{background:var(--gold-soft)}
.gate .no{display:inline-flex;align-items:center;gap:8px;background:none;border-radius:999px;padding:13px 24px;font-family:var(--sans);font-weight:300;font-size:0.9rem;letter-spacing:0.05em;cursor:pointer;transition:all .2s}
.pg.dark .gate .no{border:1px solid var(--rule-dark);color:var(--ink-on-dark-soft)}
.pg.dark .gate .no:hover{border-color:var(--gold-soft);color:var(--gold-soft)}
.pg.cream .gate .no{border:1px solid var(--rule-light);color:var(--ink-on-cream-soft)}
.pg.cream .gate .no:hover{border-color:var(--gold-deep);color:var(--gold-deep)}
.gate .back{display:inline-block;margin-top:16px;font-size:0.74rem;letter-spacing:0.18em;text-transform:uppercase;background:none;border:none;cursor:pointer;font-family:var(--sans)}
.pg.dark .gate .back{color:var(--ink-on-dark-soft)}
.pg.cream .gate .back{color:var(--ink-on-cream-soft)}
.gate .back:hover{color:var(--gold)}
.reread-note{display:none;margin-top:14px;font-size:0.9rem;font-style:italic}
.pg.dark .reread-note{color:var(--gold-soft)}
.pg.cream .reread-note{color:var(--gold-deep)}

/* ---------- Cover ---------- */
.cover-media{position:absolute;inset:0}
.cover-media img{width:100%;height:100%;object-fit:cover}
.cover-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(33,24,18,0.6) 0%,rgba(33,24,18,0.42) 40%,rgba(33,24,18,0.94) 100%)}
.cover-inner{position:relative;z-index:2;max-width:960px;margin:0 auto;display:flex;flex-direction:column;justify-content:flex-end;min-height:calc(100vh - 170px)}
.cover-logo{width:92px;height:92px;margin-bottom:36px;filter:drop-shadow(0 6px 24px rgba(0,0,0,0.45))}
.cover-sub{margin-top:24px;font-size:1rem;letter-spacing:0.12em;color:var(--ink-on-dark-soft)}
.cover-meta{margin-top:34px;display:flex;justify-content:space-between;gap:12px;font-size:0.62rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink-on-dark-soft);border-top:1px solid var(--rule-dark);padding-top:14px}

/* ---------- Contents ---------- */
.toc{margin-top:40px}
.toc .row{display:flex;align-items:baseline;gap:18px;padding:16px 0;border-bottom:1px solid var(--rule-light);font-size:1.02rem}
.toc .num{font-family:var(--serif);font-style:italic;color:var(--gold-deep);min-width:34px}
.toc .name{flex:1;letter-spacing:0.04em}
.toc .dots{font-size:0.64rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-on-cream-soft);white-space:nowrap}
.toc-photo{margin-top:44px;border:1px solid var(--rule-light);padding:12px;background:var(--cream-2)}
.toc-photo img{width:100%;height:260px;object-fit:cover}

/* ---------- Welcome / founder ---------- */
.body-copy p{margin-bottom:20px;font-size:1.04rem;max-width:640px}
.sig-line{margin-top:38px}
.sig-line .line{width:150px;border-bottom:1px solid var(--gold-soft);margin-bottom:12px}
.sig-line .who strong{display:block;font-family:var(--serif);font-style:italic;font-size:1.15rem;color:#f2e7cf;font-weight:500;margin-bottom:2px}
.sig-line .who{font-size:0.72rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.portrait-frame{position:relative;margin-top:52px;border:1px solid var(--rule-dark);background:var(--espresso-2);padding:16px 16px 22px}
.portrait-frame::before,.portrait-frame::after{content:"";position:absolute;width:34px;height:34px;border:1px solid var(--gold-soft);z-index:3}
.portrait-frame::before{top:10px;left:10px;border-right:none;border-bottom:none}
.portrait-frame::after{bottom:10px;right:10px;border-left:none;border-top:none}
.portrait-frame img{width:100%;height:380px;object-fit:cover;object-position:center top}
.portrait-frame .caption{text-align:center;margin-top:18px;font-size:0.66rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.portrait-frame .caption strong{display:block;font-family:var(--serif);font-style:italic;font-size:1.05rem;letter-spacing:0.1em;color:#f2e7cf;font-weight:500;margin-bottom:5px}

/* ---------- Guidelines ---------- */
.gl-cols{margin-top:42px;display:grid;grid-template-columns:1fr;gap:40px}
.gl-col .kicker{font-size:0.68rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:14px}
.gl-col h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.55rem;margin-bottom:18px}
.gl-col ul{list-style:none}
.gl-col li{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid var(--rule-light);font-size:0.98rem}
.gl-col li .k{color:var(--ink-on-cream-soft);letter-spacing:0.06em}
.gl-col li .v{text-align:right}
.gl-col p{margin-bottom:16px;font-size:1rem}

/* ---------- Build & approval / lede ---------- */
.lede{font-family:var(--serif);font-style:italic;font-size:clamp(1.2rem,3.2vw,1.65rem);color:var(--gold-soft);margin-top:30px;max-width:680px;line-height:1.4}
.pg.cream .lede{color:var(--gold-deep)}
.two-col{margin-top:36px;display:grid;grid-template-columns:1fr;gap:24px}
.two-col p{font-size:1.02rem}

/* ---------- Checklist / steps ---------- */
.checklist{margin-top:40px}
.chk,.step{display:flex;gap:22px;padding:22px 0;border-bottom:1px solid var(--rule-light)}
.chk .n,.step .n{font-family:var(--serif);font-style:italic;font-size:1.5rem;color:var(--gold-deep);min-width:48px;line-height:1.2}
.chk h4,.step h4{font-family:var(--serif);font-weight:500;font-size:1.2rem;margin-bottom:6px}
.chk p,.step p{font-size:0.96rem;color:var(--ink-on-cream-soft)}
.steps{margin-top:40px}

/* ---------- Contract & invoice ---------- */
.terms{margin-top:38px;border-top:1px solid var(--rule-dark)}
.terms .t{padding:24px 0;border-bottom:1px solid var(--rule-dark)}
.terms .k{font-family:var(--serif);font-style:italic;font-size:1.6rem;color:var(--gold-soft);margin-bottom:8px}
.terms .v{font-size:1rem}

/* ---------- Thank you ---------- */
.thanks-media{position:absolute;inset:0}
.thanks-media img{width:100%;height:100%;object-fit:cover}
.thanks-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(33,24,18,0.46) 0%,rgba(33,24,18,0.92) 100%)}
.thanks-inner{position:relative;z-index:2;max-width:960px;margin:0 auto;display:flex;flex-direction:column;justify-content:flex-end;min-height:calc(100vh - 170px)}
.thanks-inner .rule{width:78px;border-bottom:1px solid var(--gold-soft);margin:24px 0}
.thanks-inner .note{max-width:520px;font-size:1.02rem}

/* ---------- Sign page ---------- */
.sign-sub{margin-top:18px;max-width:600px;font-size:1.02rem;color:var(--ink-on-dark-soft)}
.sign-grid{margin-top:36px;display:grid;grid-template-columns:1fr;gap:20px}
.field label{display:block;font-size:0.68rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:8px}
.field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--rule-dark);padding:10px 2px;font-family:var(--sans);font-weight:300;font-size:1.05rem;color:var(--ink-on-dark);outline:none;border-radius:0}
.field input:focus{border-bottom-color:var(--gold)}
.field input::placeholder{color:rgba(182,168,140,0.5)}
.sig-wrap{margin-top:38px}
.sig-title{display:block;font-size:0.68rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:12px}
.sig-pad-frame{position:relative;height:190px;background:#f6efe0;border:1px solid var(--gold-soft);border-radius:6px;overflow:hidden}
.sig-pad-frame canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
.sig-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.86rem;letter-spacing:0.1em;color:#a99a7d;pointer-events:none}
.sig-pad-frame.signed .sig-hint{display:none}
.sig-clear{margin-top:12px;background:none;border:1px solid var(--rule-dark);color:var(--ink-on-dark-soft);font-family:var(--sans);font-weight:300;font-size:0.76rem;letter-spacing:0.16em;text-transform:uppercase;padding:9px 20px;border-radius:999px;cursor:pointer}
.sig-clear:hover{border-color:var(--gold-soft);color:var(--gold-soft)}
.agree-row{display:flex;gap:14px;align-items:flex-start;margin-top:34px;cursor:pointer;font-size:0.96rem;max-width:640px}
.agree-row input{margin-top:5px;width:19px;height:19px;accent-color:var(--gold);flex-shrink:0}
#doc-submit{margin-top:36px;width:100%;max-width:520px;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:18px 34px;font-family:var(--sans);font-weight:500;font-size:1.02rem;letter-spacing:0.06em;cursor:pointer;transition:background .2s}
#doc-submit:hover{background:var(--gold-soft)}
#doc-submit:disabled{opacity:0.6;cursor:wait}
.doc-msg{margin-top:14px;font-size:0.95rem;min-height:1.4em}
.doc-msg.err{color:#e5a394}
.submitted-panel{margin-top:28px;border:1px solid var(--gold-soft);padding:44px 28px;text-align:center;max-width:640px}
.submitted-panel .sp-seal{font-size:1.5rem;color:var(--gold-soft);margin-bottom:14px}
.submitted-panel h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.8rem;color:#f2e7cf;margin-bottom:14px}
.submitted-panel p{max-width:460px;margin:0 auto 26px}
.submitted-panel .btn-next{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#241a10;border-radius:999px;padding:14px 30px;font-weight:500;font-size:0.96rem;margin-bottom:14px}
.submitted-panel .btn-next:hover{background:var(--gold-soft)}
.submitted-panel .btn-back{display:inline-block;border:1px solid var(--gold-soft);color:var(--gold-soft);border-radius:999px;padding:12px 28px;font-size:0.84rem;letter-spacing:0.1em}

/* ---------- Desktop ---------- */
@media(min-width:860px){
  .pg{padding:130px 60px 80px}
  .gl-cols{grid-template-columns:1fr 1fr;gap:70px}
  .two-col{grid-template-columns:1fr 1fr;gap:60px}
  .s2-grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:70px;align-items:start}
  .toc-photo{margin-top:0}
  .toc-photo img{height:440px}
  .s3-grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:70px;align-items:start}
  .portrait-frame{margin-top:0}
  .portrait-frame img{height:430px}
  .checklist{display:grid;grid-template-columns:1fr 1fr;column-gap:70px}
  .terms{display:grid;grid-template-columns:1fr 1fr;border-top:none;gap:0 60px}
  .terms .t{border-top:1px solid var(--rule-dark)}
  .steps{max-width:760px}
}
</style>
</head>
<body>

<!-- ============ PROGRESS RAIL ============ -->
<div class="deck-rail">
  <div class="deck-rail-inner">
    <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co. · Onboarding</span></span>
    <span class="rb-count" id="rail-count">Page 1 of 10</span>
  </div>
  <div class="deck-progress"><div class="bar" id="rail-bar"></div></div>
</div>

<main id="deck">

<!-- PAGE 1 · COVER -->
<section class="pg dark active" data-title="Cover">
  <div class="cover-media"><img src="/static/images/doc-cover.jpg" alt=""><div class="cover-overlay"></div></div>
  <div class="cover-inner">
    <img class="cover-logo" src="/static/images/naim-logo.png" alt="NaiM Agency logo">
    <p class="eyebrow">A guide for new clients</p>
    <h1>Your onboarding<br><em>guide</em></h1>
    <p class="cover-sub">Welcome to Naim Automation Systems Co.</p>
    <div class="cover-meta"><span>Nairobi · Kenya</span><span>Client Onboarding · MMXXVI</span></div>
    <div class="gate">
      <p class="q">This guide reveals one page at a time, so nothing important is missed. Ready to begin?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Begin the guide →</button>
      </div>
    </div>
  </div>
</section>

<!-- PAGE 2 · CONTENTS -->
<section class="pg cream" data-title="Contents">
  <div class="pg-inner">
    <p class="sec-tag">Onboarding · Contents</p>
    <div class="s2-grid">
      <div>
        <p class="eyebrow">In this guide</p>
        <h1><em>Contents</em></h1>
        <div class="toc">
          <div class="row"><span class="num">01</span><span class="name">Welcome</span><span class="dots">— Page 03</span></div>
          <div class="row"><span class="num">02</span><span class="name">Guidelines</span><span class="dots">— Page 04</span></div>
          <div class="row"><span class="num">03</span><span class="name">Build &amp; approval process</span><span class="dots">— Page 05</span></div>
          <div class="row"><span class="num">04</span><span class="name">What we need from you</span><span class="dots">— Page 06</span></div>
          <div class="row"><span class="num">05</span><span class="name">Contract &amp; invoice</span><span class="dots">— Page 07</span></div>
          <div class="row"><span class="num">06</span><span class="name">The process</span><span class="dots">— Page 08</span></div>
          <div class="row"><span class="num">—</span><span class="name">Thank you</span><span class="dots">— Page 09</span></div>
        </div>
      </div>
      <div class="toc-photo"><img src="/static/images/doc-agenda.jpg" alt=""></div>
    </div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 3 · WELCOME -->
<section class="pg dark" data-title="Welcome">
  <div class="pg-inner">
    <p class="sec-tag">Section 01 · Welcome</p>
    <div class="s3-grid">
      <div>
        <p class="eyebrow">Section 01</p>
        <h1><em>Welcome.</em></h1>
        <div class="body-copy" style="margin-top:30px;">
          <p>Thank you for choosing Naim Automation Systems Co. as your automation partner. We are thrilled to formally welcome you.</p>
          <p>We help businesses stop wasting time on admin. We build systems that answer every enquiry in minutes, keep records neat and searchable, and put your whole business in your pocket — so your team focuses on the work that matters, not paperwork.</p>
          <p>This guide explains what to expect at every step of working with us. Keep it close — it answers most questions before they arise.</p>
        </div>
        <div class="sig-line">
          <div class="line"></div>
          <div class="who"><strong>M.A. Salmin</strong>Founder &amp; Systems Architect</div>
        </div>
      </div>
      <div class="portrait-frame">
        <img src="/static/images/founder.jpg" alt="M.A. Salmin, Founder and Systems Architect">
        <div class="caption"><strong>M.A. Salmin</strong>Founder &amp; Systems Architect</div>
      </div>
    </div>
    <div class="page-num">01</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 4 · GUIDELINES -->
<section class="pg cream" data-title="Guidelines">
  <div class="pg-inner">
    <p class="sec-tag">Section 02 · Guidelines</p>
    <p class="eyebrow">Section 02</p>
    <h1><em>Guidelines.</em></h1>
    <div class="gl-cols">
      <div class="gl-col">
        <p class="kicker">Working hours &amp; contact</p>
        <h3>When we are here.</h3>
        <ul>
          <li><span class="k">Days</span><span class="v">Monday — Friday</span></li>
          <li><span class="k">Hours</span><span class="v">09:00 — 18:00 EAT</span></li>
          <li><span class="k">Response</span><span class="v">Within one business day</span></li>
          <li><span class="k">Emergencies</span><span class="v">Prioritised</span></li>
        </ul>
      </div>
      <div class="gl-col">
        <p class="kicker">How to reach us</p>
        <h3>Two clean channels.</h3>
        <p>All communication runs through your dedicated Email and WhatsApp channel.</p>
        <p>Kindly consolidate feedback through your appointed contact person — it keeps your project on schedule.</p>
        <p>Questions answered within one business day; one weekly summary during the build so you always know where we are.</p>
      </div>
    </div>
    <div class="page-num">02</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 5 · BUILD & APPROVAL -->
<section class="pg dark" data-title="Build and approval">
  <div class="pg-inner">
    <p class="sec-tag">Section 03 · Build &amp; approval</p>
    <p class="eyebrow">Section 03</p>
    <h1>Build &amp; approval <em>process.</em></h1>
    <p class="lede">Every second counts. Once your deposit is received and your materials are in, the build begins.</p>
    <div class="two-col">
      <p>We engineer your system and send progress updates so you are never in the dark. Nothing goes live without your approval — you review, we refine, and only what you approve is deployed.</p>
      <p>If you'd like to make changes at any stage, simply tell your contact person. Changes are always possible; they are simply quoted in writing first, so there are never surprises on the invoice.</p>
    </div>
    <div class="page-num">03</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 6 · WHAT WE NEED -->
<section class="pg cream" data-title="What we need">
  <div class="pg-inner">
    <p class="sec-tag">Section 04 · What we need</p>
    <p class="eyebrow">Section 04</p>
    <h1>What we need <em>from you.</em></h1>
    <p class="lede">A few simple items keep your project on schedule.</p>
    <div class="checklist">
      <div class="chk"><span class="n">i.</span><div><h4>One contact person</h4><p>Someone on your side authorised to give approvals — it keeps decisions clean and quick.</p></div></div>
      <div class="chk"><span class="n">ii.</span><div><h4>Access credentials</h4><p>Logins for the accounts your system will connect to, shared securely — never by plain text.</p></div></div>
      <div class="chk"><span class="n">iii.</span><div><h4>A short walkthrough</h4><p>Fifteen minutes on how things are done today, so we build around your real workflow.</p></div></div>
      <div class="chk"><span class="n">iv.</span><div><h4>Sample data</h4><p>A handful of example records — anonymised is perfectly fine.</p></div></div>
      <div class="chk"><span class="n">v.</span><div><h4>Branding assets</h4><p>Your logo and preferred wording, so every document your system generates feels like you.</p></div></div>
      <div class="chk"><span class="n">vi.</span><div><h4>The deposit</h4><p>Your timeline starts the day it is received.</p></div></div>
    </div>
    <div class="page-num">04</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 7 · CONTRACT & INVOICE -->
<section class="pg dark" data-title="Contract and invoice">
  <div class="pg-inner">
    <p class="sec-tag">Section 05 · Contract &amp; invoice</p>
    <p class="eyebrow">Section 05</p>
    <h1>Contract &amp; <em>invoice.</em></h1>
    <div class="body-copy" style="margin-top:30px;">
      <p>Please be aware that no work is carried out until the Service Agreement has been signed and the deposit has been received. Our payment structure is simple, and there are no surprises along the way.</p>
    </div>
    <div class="terms">
      <div class="t">
        <div class="k">50% deposit</div>
        <div class="v">To begin — timeline starts the day it is received.</div>
      </div>
      <div class="t">
        <div class="k">50% balance</div>
        <div class="v">Only after you watch your finished system perform live in a demonstration.</div>
      </div>
    </div>
    <div class="body-copy" style="margin-top:30px;">
      <p>The monthly care plan — hosting, upkeep, monitoring and support — begins the month after final delivery.</p>
      <p>Once you finish this guide, the Quotation &amp; Service Agreement Contract is the next document in your portal — you review and sign it from your phone, right after this one.</p>
    </div>
    <div class="page-num">05</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 8 · THE PROCESS -->
<section class="pg cream" data-title="The process">
  <div class="pg-inner">
    <p class="sec-tag">Section 06 · The process</p>
    <p class="eyebrow">Section 06</p>
    <h1>The <em>Process.</em></h1>
    <div class="steps">
      <div class="step"><span class="n">01</span><div><h4>Book appointment</h4><p>A short consultation so we truly understand your needs before proposing anything.</p></div></div>
      <div class="step"><span class="n">02</span><div><h4>Quotation &amp; agreement</h4><p>An itemised quote and Service Agreement — review and sign from your phone.</p></div></div>
      <div class="step"><span class="n">03</span><div><h4>We build your system</h4><p>Roughly 7–21 business days, with progress updates so you are never in the dark.</p></div></div>
      <div class="step"><span class="n">04</span><div><h4>Live demo &amp; training</h4><p>You see it work before the balance. A short training session for your team follows.</p></div></div>
      <div class="step"><span class="n">05</span><div><h4>Handover &amp; care</h4><p>Owner's manual delivered, then the optional monthly care plan takes over.</p></div></div>
    </div>
    <div class="page-num">06</div>
    <div class="gate">
      <p class="q">Have you read and understood this page?</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Yes — reveal the next page →</button>
        <button type="button" class="no" data-reread>Not yet — I'll read it again</button>
      </div>
      <p class="reread-note">Take your time — the guide will be right here when you're ready.</p>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 9 · THANK YOU (final page) -->
<section class="pg dark" data-title="Thank you">
  <div class="thanks-media"><img src="/static/images/doc-thankyou.jpg" alt=""><div class="thanks-overlay"></div></div>
  <div class="thanks-inner">
    <p class="eyebrow">A final note</p>
    <h1>Thank you.</h1>
    <div class="rule"></div>
    <p class="note">If you have any questions regarding your onboarding, please don't hesitate to contact us on WhatsApp.</p>
    <div class="gate">
      <p class="q">You have now read the full guide. One last step — acknowledge it with your signature.</p>
      <div class="btns">
        <button type="button" class="yes" data-next>Acknowledge &amp; sign →</button>
      </div>
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

<!-- PAGE 10 · ACKNOWLEDGE & SIGN -->
<section class="pg dark" data-title="Sign" id="sign-section" style="background:var(--espresso-2);">
  <div class="pg-inner">
    <p class="eyebrow">Acknowledge · Sign · Submit</p>
    <h2>Acknowledge receipt,<br><em>right on this screen.</em></h2>
    <p class="sign-sub">No printing. No scanning. Fill in your details, draw your signature with your finger, tick the box and press submit — we receive it instantly.</p>

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
        <span class="sig-hint" id="sig-hint">Sign here with your finger</span>
      </div>
      <button type="button" class="sig-clear" id="sig-clear">Clear &amp; sign again</button>
    </div>

    <label class="agree-row">
      <input type="checkbox" id="s-agree">
      <span>I confirm that I have read every page of this Onboarding Guide, and I understand the process, guidelines and payment structure described in it.</span>
    </label>

    <button type="button" id="doc-submit" data-doc-type="onboarding">
      Sign &amp; Submit This Document →
    </button>
    <p id="doc-msg" class="doc-msg" role="status"></p>

    <div class="submitted-panel" id="submitted-panel" hidden>
      <div class="sp-seal">✦</div>
      <h3>Signed &amp; received.</h3>
      <p>Thank you — your acknowledgement has reached us instantly. Your next document is now unlocked: the Quotation &amp; Service Agreement Contract.</p>
      <a class="btn-next" href="/docs/quotation">Continue to the Contract →</a><br>
      <a class="btn-back" href="/docs">Back to Document Portal</a>
    </div>

    <div class="gate" style="margin-top:44px;">
      <button type="button" class="back" data-back>← Previous page</button>
    </div>
  </div>
</section>

</main>

<script>
/* Reveal deck controller — one page at a time, confirm to advance */
(function () {
  'use strict';
  var pages = Array.prototype.slice.call(document.querySelectorAll('.pg'));
  var railCount = document.getElementById('rail-count');
  var railBar = document.getElementById('rail-bar');
  var current = 0;
  var maxSeen = 0; /* honest forward progress */

  function show(i) {
    if (i < 0 || i >= pages.length) return;
    /* honesty: never jump forward beyond the next unseen page */
    if (i > maxSeen + 1) i = maxSeen + 1;
    pages[current].classList.remove('active');
    current = i;
    if (current > maxSeen) maxSeen = current;
    pages[current].classList.add('active');
    railCount.textContent = 'Page ' + (current + 1) + ' of ' + pages.length;
    railBar.style.width = (((current + 1) / pages.length) * 100) + '%';
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    /* resize signature canvas when the sign page becomes visible */
    if (pages[current].id === 'sign-section') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-next],[data-back],[data-reread]');
    if (!t) return;
    if (t.hasAttribute('data-next')) { show(current + 1); }
    else if (t.hasAttribute('data-back')) { show(current - 1); }
    else if (t.hasAttribute('data-reread')) {
      var note = pages[current].querySelector('.reread-note');
      if (note) note.style.display = 'block';
      var top = pages[current].querySelector('.pg-inner') || pages[current];
      top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  railBar.style.width = (1 / pages.length * 100) + '%';
})();
</script>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/docs.js"></script>
</body>
</html>`
}
