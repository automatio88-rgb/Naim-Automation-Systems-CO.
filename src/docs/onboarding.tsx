// Welcome & Onboarding Guide — Naim Automation Systems Co.
// Mobile-first port of the agent-designed espresso/cream editorial deck.
// Palette: espresso #211812 / cream #efe6d6 / gold #c8a24a. Playfair Display + Jost.
// Ends with acknowledge + signature section (posts to /api/docs/submit, doc_type "onboarding").

export function onboardingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Onboarding Guide — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
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

/* ---------- Page sections ---------- */
.pg{position:relative;overflow:hidden;padding:72px 26px 96px}
.pg.dark{background:var(--espresso);color:var(--ink-on-dark)}
.pg.cream{background:var(--cream);color:var(--ink-on-cream)}
.pg-inner{position:relative;max-width:960px;margin:0 auto;z-index:2}

h1,h2{font-family:var(--serif);font-weight:500;line-height:1.12}
h1{font-size:clamp(2.6rem,8vw,4.6rem)}
h2{font-size:clamp(2rem,6vw,3.2rem)}
h1 em,h2 em{color:var(--gold)}
.eyebrow{font-size:0.72rem;letter-spacing:0.34em;text-transform:uppercase;color:var(--gold);font-weight:400;margin-bottom:22px}

.ribbon{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:0.66rem;letter-spacing:0.24em;text-transform:uppercase;margin-bottom:52px}
.pg.dark .ribbon{color:var(--ink-on-dark-soft);border-bottom:1px solid var(--rule-dark);padding-bottom:16px}
.pg.cream .ribbon{color:var(--ink-on-cream-soft);border-bottom:1px solid var(--rule-light);padding-bottom:16px}
.ribbon .rb-brand{display:flex;align-items:center;gap:9px;white-space:nowrap}
.ribbon .rb-brand img{width:22px;height:22px}
.ribbon .rb-right{text-align:right;white-space:nowrap}

.foot-ribbon{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:0.62rem;letter-spacing:0.22em;text-transform:uppercase;margin-top:64px;padding-top:16px}
.pg.dark .foot-ribbon{color:var(--ink-on-dark-soft);border-top:1px solid var(--rule-dark)}
.pg.cream .foot-ribbon{color:var(--ink-on-cream-soft);border-top:1px solid var(--rule-light)}

.page-num{position:absolute;right:8px;bottom:-36px;z-index:1;font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(120px,24vw,220px);line-height:1;pointer-events:none;user-select:none}
.pg.dark .page-num{color:rgba(216,188,122,0.14)}
.pg.cream .page-num{color:rgba(184,144,64,0.16)}

/* ---------- Cover ---------- */
.cover{position:relative;min-height:92vh;display:flex;flex-direction:column;justify-content:flex-end;padding:0}
.cover-media{position:absolute;inset:0}
.cover-media img{width:100%;height:100%;object-fit:cover}
.cover-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(33,24,18,0.55) 0%,rgba(33,24,18,0.35) 40%,rgba(33,24,18,0.92) 100%)}
.cover-top{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 26px;font-size:0.62rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--ink-on-dark);border-bottom:1px solid var(--rule-dark)}
.cover-top .cb{display:flex;align-items:center;gap:9px}
.cover-top .cb img{width:22px;height:22px}
.cover-content{position:relative;z-index:3;padding:0 26px 84px;max-width:960px;margin:0 auto;width:100%}
.cover-logo{width:96px;height:96px;margin-bottom:40px;filter:drop-shadow(0 6px 24px rgba(0,0,0,0.45))}
.cover .sub{margin-top:26px;font-size:1rem;letter-spacing:0.12em;color:var(--ink-on-dark-soft)}
.cover-foot{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 26px;font-size:0.62rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink-on-dark-soft);border-top:1px solid var(--rule-dark)}

/* ---------- Contents ---------- */
.toc{margin-top:44px;display:flex;flex-direction:column}
.toc .row{display:flex;align-items:baseline;gap:18px;padding:17px 0;border-bottom:1px solid var(--rule-light);font-size:1.02rem}
.toc .num{font-family:var(--serif);font-style:italic;color:var(--gold-deep);min-width:34px}
.toc .name{flex:1;letter-spacing:0.04em}
.toc .dots{font-size:0.66rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--ink-on-cream-soft);white-space:nowrap}
.toc-photo{margin-top:52px;border:1px solid var(--rule-light);padding:12px;background:var(--cream-2)}
.toc-photo img{width:100%;height:280px;object-fit:cover}

/* ---------- Welcome ---------- */
.body-copy p{margin-bottom:20px;font-size:1.04rem;max-width:640px}
.pg.dark .body-copy p{color:var(--ink-on-dark)}
.sig-line{margin-top:40px}
.sig-line .line{width:150px;border-bottom:1px solid var(--gold-soft);margin-bottom:12px}
.sig-line .who strong{display:block;font-family:var(--serif);font-style:italic;font-size:1.15rem;color:#f2e7cf;font-weight:500;margin-bottom:2px}
.sig-line .who{font-size:0.72rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.portrait-frame{position:relative;margin-top:56px;border:1px solid var(--rule-dark);background:var(--espresso-2);min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:34px}
.portrait-frame::before,.portrait-frame::after{content:"";position:absolute;width:34px;height:34px;border:1px solid var(--gold-soft)}
.portrait-frame::before{top:14px;left:14px;border-right:none;border-bottom:none}
.portrait-frame::after{bottom:14px;right:14px;border-left:none;border-top:none}
.portrait-frame .placeholder-label{font-size:0.68rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.portrait-frame .caption{text-align:center;font-size:0.68rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.portrait-frame .caption strong{display:block;font-family:var(--serif);font-style:italic;font-size:1.05rem;letter-spacing:0.1em;color:#f2e7cf;font-weight:500;margin-bottom:5px}

/* ---------- Guidelines ---------- */
.gl-cols{margin-top:46px;display:grid;grid-template-columns:1fr;gap:44px}
.gl-col .kicker{font-size:0.68rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:14px}
.gl-col h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.6rem;margin-bottom:20px}
.gl-col ul{list-style:none}
.gl-col li{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid var(--rule-light);font-size:0.98rem}
.gl-col li .k{color:var(--ink-on-cream-soft);letter-spacing:0.06em}
.gl-col li .v{text-align:right}
.gl-col p{margin-bottom:16px;font-size:1rem;color:var(--ink-on-cream)}

/* ---------- Build & approval ---------- */
.lede{font-family:var(--serif);font-style:italic;font-size:clamp(1.25rem,3.4vw,1.7rem);color:var(--gold-soft);margin-top:34px;max-width:680px;line-height:1.4}
.two-col{margin-top:40px;display:grid;grid-template-columns:1fr;gap:26px}
.two-col p{font-size:1.02rem}

/* ---------- Checklist ---------- */
.checklist{margin-top:46px;display:grid;grid-template-columns:1fr;gap:0}
.chk{display:flex;gap:22px;padding:24px 0;border-bottom:1px solid var(--rule-light)}
.chk .n{font-family:var(--serif);font-style:italic;font-size:1.5rem;color:var(--gold-deep);min-width:44px;line-height:1.2}
.chk h4{font-family:var(--serif);font-weight:500;font-size:1.22rem;margin-bottom:6px}
.chk p{font-size:0.97rem;color:var(--ink-on-cream-soft)}

/* ---------- Contract & invoice ---------- */
.terms{margin-top:42px;display:grid;grid-template-columns:1fr;gap:0;border-top:1px solid var(--rule-dark)}
.terms .t{padding:26px 0;border-bottom:1px solid var(--rule-dark)}
.terms .k{font-family:var(--serif);font-style:italic;font-size:1.7rem;color:var(--gold-soft);margin-bottom:8px}
.terms .v{font-size:1rem;color:var(--ink-on-dark)}
.link-cta{margin-top:48px;display:inline-flex;flex-direction:column;gap:6px;border:1px solid var(--gold-soft);padding:22px 30px}
.link-cta .txt{font-size:0.68rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--ink-on-dark-soft)}
.link-cta .url{font-family:var(--serif);font-style:italic;font-size:1.2rem;color:var(--gold-soft)}

/* ---------- The Process ---------- */
.steps{margin-top:46px}
.step{display:flex;gap:22px;padding:24px 0;border-bottom:1px solid var(--rule-light)}
.step .n{font-family:var(--serif);font-style:italic;font-size:1.6rem;color:var(--gold-deep);min-width:52px;line-height:1.2}
.step h4{font-family:var(--serif);font-weight:500;font-size:1.24rem;margin-bottom:6px}
.step p{font-size:0.97rem;color:var(--ink-on-cream-soft)}

/* ---------- Thank you ---------- */
.thanks{position:relative;min-height:86vh;display:flex;align-items:flex-end;padding:0}
.thanks-media{position:absolute;inset:0}
.thanks-media img{width:100%;height:100%;object-fit:cover}
.thanks-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(33,24,18,0.42) 0%,rgba(33,24,18,0.9) 100%)}
.thanks-content{position:relative;z-index:3;padding:0 26px 90px;max-width:960px;margin:0 auto;width:100%}
.thanks-content .rule{width:78px;border-bottom:1px solid var(--gold-soft);margin:26px 0}
.thanks-content .note{max-width:520px;font-size:1.02rem;color:var(--ink-on-dark)}

/* ---------- Acknowledge & sign ---------- */
.sign-slide{background:var(--espresso-2);padding:76px 26px 100px}
.sign-sub{margin-top:20px;max-width:600px;font-size:1.02rem;color:var(--ink-on-dark-soft)}
.sign-grid{margin-top:40px;display:grid;grid-template-columns:1fr;gap:20px}
.field label{display:block;font-size:0.68rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:8px}
.field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--rule-dark);padding:10px 2px;font-family:var(--sans);font-weight:300;font-size:1.05rem;color:var(--ink-on-dark);outline:none;border-radius:0}
.field input:focus{border-bottom-color:var(--gold)}
.field input::placeholder{color:rgba(182,168,140,0.5)}
.sig-wrap{margin-top:42px}
.sig-title{display:block;font-size:0.68rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:12px}
.sig-pad-frame{position:relative;height:190px;background:#f6efe0;border:1px solid var(--gold-soft);border-radius:6px;overflow:hidden}
.sig-pad-frame canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
.sig-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.86rem;letter-spacing:0.1em;color:#a99a7d;pointer-events:none}
.sig-pad-frame.signed .sig-hint{display:none}
.sig-clear{margin-top:12px;background:none;border:1px solid var(--rule-dark);color:var(--ink-on-dark-soft);font-family:var(--sans);font-weight:300;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;padding:9px 20px;border-radius:999px;cursor:pointer}
.sig-clear:hover{border-color:var(--gold-soft);color:var(--gold-soft)}
.agree-row{display:flex;gap:14px;align-items:flex-start;margin-top:36px;cursor:pointer;font-size:0.96rem;color:var(--ink-on-dark);max-width:640px}
.agree-row input{margin-top:5px;width:19px;height:19px;accent-color:var(--gold);flex-shrink:0}
#doc-submit{margin-top:38px;width:100%;max-width:520px;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:18px 34px;font-family:var(--sans);font-weight:500;font-size:1.02rem;letter-spacing:0.06em;cursor:pointer;transition:background .2s}
#doc-submit:hover{background:var(--gold-soft)}
#doc-submit:disabled{opacity:0.6;cursor:wait}
.doc-msg{margin-top:16px;font-size:0.95rem;min-height:1.4em}
.doc-msg.err{color:#e5a394}
.submitted-panel{margin-top:30px;border:1px solid var(--gold-soft);padding:46px 30px;text-align:center;max-width:640px}
.submitted-panel .sp-seal{font-size:1.5rem;color:var(--gold-soft);margin-bottom:14px}
.submitted-panel h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.8rem;color:#f2e7cf;margin-bottom:14px}
.submitted-panel p{color:var(--ink-on-dark);max-width:460px;margin:0 auto 26px}
.submitted-panel .btn-back{display:inline-block;border:1px solid var(--gold-soft);color:var(--gold-soft);border-radius:999px;padding:12px 28px;font-size:0.86rem;letter-spacing:0.1em}

/* ---------- Desktop ---------- */
@media(min-width:860px){
  .pg{padding:96px 60px 130px}
  .gl-cols{grid-template-columns:1fr 1fr;gap:70px}
  .two-col{grid-template-columns:1fr 1fr;gap:60px}
  .checklist{grid-template-columns:1fr 1fr;column-gap:70px}
  .terms{grid-template-columns:1fr 1fr;border-top:none;gap:0 60px}
  .terms .t{border-top:1px solid var(--rule-dark)}
  .s2-grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:70px;align-items:start}
  .toc-photo{margin-top:0}
  .toc-photo img{height:460px}
  .s3-grid{display:grid;grid-template-columns:1.2fr 0.8fr;gap:70px;align-items:start}
  .portrait-frame{margin-top:0;min-height:440px}
  .steps{max-width:760px}
}
</style>
</head>
<body>

<!-- ============ PAGE 1 · COVER ============ -->
<section class="pg dark cover" id="cover">
  <div class="cover-media">
    <img src="/static/images/doc-cover.jpg" alt="">
    <div class="cover-overlay"></div>
  </div>
  <div class="cover-top">
    <span class="cb"><img src="/static/images/naim-logo.png" alt="NaiM"><span>Naim Automation Systems Co.</span></span>
    <span>Nairobi · Kenya</span>
  </div>
  <div class="cover-content">
    <img class="cover-logo" src="/static/images/naim-logo.png" alt="NaiM Agency logo">
    <p class="eyebrow">A guide for new clients</p>
    <h1>Your onboarding<br><em>guide</em></h1>
    <p class="sub">Welcome to Naim Automation Systems Co.</p>
  </div>
  <div class="cover-foot">
    <span>Client Onboarding</span>
    <span>MMXXVI</span>
  </div>
</section>

<!-- ============ PAGE 2 · CONTENTS ============ -->
<section class="pg cream" id="contents">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Onboarding · Contents</span>
    </div>
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
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 02 · Contents</span></div>
  </div>
</section>

<!-- ============ PAGE 3 · WELCOME ============ -->
<section class="pg dark" id="welcome">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 01 · Welcome</span>
    </div>
    <div class="s3-grid">
      <div>
        <p class="eyebrow">Section 01</p>
        <h1><em>Welcome.</em></h1>
        <div class="body-copy" style="margin-top:34px;">
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
        <span class="placeholder-label">Portrait to be added</span>
        <div class="caption"><strong>M.A. Salmin</strong>Founder &amp; Systems Architect</div>
      </div>
    </div>
    <div class="page-num">01</div>
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 03 · Welcome</span></div>
  </div>
</section>

<!-- ============ PAGE 4 · GUIDELINES ============ -->
<section class="pg cream" id="guidelines">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 02 · Guidelines</span>
    </div>
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
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 04 · Guidelines</span></div>
  </div>
</section>

<!-- ============ PAGE 5 · BUILD & APPROVAL ============ -->
<section class="pg dark" id="build-approval">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 03 · Build &amp; approval</span>
    </div>
    <p class="eyebrow">Section 03</p>
    <h1>Build &amp; approval <em>process.</em></h1>
    <p class="lede">Every second counts. Once your deposit is received and your materials are in, the build begins.</p>
    <div class="two-col">
      <p>We engineer your system and send progress updates so you are never in the dark. Nothing goes live without your approval — you review, we refine, and only what you approve is deployed.</p>
      <p>If you'd like to make changes at any stage, simply tell your contact person. Changes are always possible; they are simply quoted in writing first, so there are never surprises on the invoice.</p>
    </div>
    <div class="page-num">03</div>
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 05 · Build &amp; approval</span></div>
  </div>
</section>

<!-- ============ PAGE 6 · WHAT WE NEED ============ -->
<section class="pg cream" id="what-we-need">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 04 · What we need</span>
    </div>
    <p class="eyebrow">Section 04</p>
    <h1>What we need <em>from you.</em></h1>
    <p class="lede" style="color:var(--gold-deep);">A few simple items keep your project on schedule.</p>
    <div class="checklist">
      <div class="chk"><span class="n">i.</span><div><h4>One contact person</h4><p>Someone on your side authorised to give approvals — it keeps decisions clean and quick.</p></div></div>
      <div class="chk"><span class="n">ii.</span><div><h4>Access credentials</h4><p>Logins for the accounts your system will connect to, shared securely — never by plain text.</p></div></div>
      <div class="chk"><span class="n">iii.</span><div><h4>A short walkthrough</h4><p>Fifteen minutes on how things are done today, so we build around your real workflow.</p></div></div>
      <div class="chk"><span class="n">iv.</span><div><h4>Sample data</h4><p>A handful of example records — anonymised is perfectly fine.</p></div></div>
      <div class="chk"><span class="n">v.</span><div><h4>Branding assets</h4><p>Your logo and preferred wording, so every document your system generates feels like you.</p></div></div>
      <div class="chk"><span class="n">vi.</span><div><h4>The deposit</h4><p>Your timeline starts the day it is received.</p></div></div>
    </div>
    <div class="page-num">04</div>
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 06 · What we need</span></div>
  </div>
</section>

<!-- ============ PAGE 7 · CONTRACT & INVOICE ============ -->
<section class="pg dark" id="contract-invoice">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 05 · Contract &amp; invoice</span>
    </div>
    <p class="eyebrow">Section 05</p>
    <h1>Contract &amp; <em>invoice.</em></h1>
    <div class="body-copy" style="margin-top:34px;">
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
    <div class="body-copy" style="margin-top:34px;">
      <p>The monthly care plan — hosting, upkeep, monitoring and support — begins the month after final delivery.</p>
    </div>
    <a class="link-cta" href="/docs">
      <span class="txt">Review &amp; sign from your phone</span>
      <span class="url">Open the Client Document Portal →</span>
    </a>
    <div class="page-num">05</div>
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 07 · Contract &amp; invoice</span></div>
  </div>
</section>

<!-- ============ PAGE 8 · THE PROCESS ============ -->
<section class="pg cream" id="the-process">
  <div class="pg-inner">
    <div class="ribbon">
      <span class="rb-brand"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co.</span></span>
      <span class="rb-right">Section 06 · The process</span>
    </div>
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
    <div class="foot-ribbon"><span>Your onboarding guide</span><span>Page 08 · The process</span></div>
  </div>
</section>

<!-- ============ PAGE 9 · THANK YOU (final) ============ -->
<section class="pg dark thanks" id="thank-you">
  <div class="thanks-media">
    <img src="/static/images/doc-thankyou.jpg" alt="">
    <div class="thanks-overlay"></div>
  </div>
  <div class="thanks-content">
    <p class="eyebrow">A final note</p>
    <h1>Thank you.</h1>
    <div class="rule"></div>
    <p class="note">If you have any questions regarding your onboarding, please don't hesitate to contact us on WhatsApp.</p>
  </div>
</section>

<!-- ============ ACKNOWLEDGE & SIGN ============ -->
<section class="pg dark sign-slide" id="sign-section">
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
      <span>I confirm that I have received and read the Welcome &amp; Onboarding Guide of Naim Automation Systems Co., and I understand the process, guidelines and payment structure described in it.</span>
    </label>

    <button type="button" id="doc-submit" data-doc-type="onboarding">
      Sign &amp; Submit This Document →
    </button>
    <p id="doc-msg" class="doc-msg" role="status"></p>

    <div class="submitted-panel" id="submitted-panel" hidden>
      <div class="sp-seal">✦</div>
      <h3>Signed &amp; received.</h3>
      <p>Thank you — your acknowledgement has reached us instantly. <b>M.A. Salmin</b> will be in touch shortly to confirm next steps. Welcome aboard.</p>
      <a class="btn-back" href="/docs">Back to Document Portal</a>
    </div>
  </div>
</section>

<footer style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;padding:28px 20px;background:#1a120d;color:#8d7f65;font-size:0.76rem;">
  <img src="/static/images/naim-logo.png" alt="" style="width:26px;height:26px;">
  <span>© 2026 Naim Automation Systems Co. · Nairobi, Kenya</span>
</footer>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/docs.js"></script>
</body>
</html>`
}
