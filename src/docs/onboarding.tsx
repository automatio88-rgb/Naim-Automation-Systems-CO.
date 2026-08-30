// Welcome & Onboarding Guide — Naim Automation Systems Co.
// TRUE SLIDE DECK: no scrolling. Every page fits the screen (mobile + desktop).
// Side arrows navigate; a small confirm prompt gates each forward reveal.
// Agent design preserved: espresso #211812 / cream #efe6d6 / gold #c8a24a.

export function onboardingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
  --dk:#e8dbc2; --dk-soft:#b6a88c; --cr:#2b1f18; --cr-soft:#5c4f3e;
  --rule-d:rgba(232,215,180,0.22); --rule-l:rgba(43,31,24,0.22);
  --serif:'Playfair Display',Georgia,serif; --sans:'Jost','Segoe UI',sans-serif;
  --rail:52px;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{font-family:var(--sans);font-weight:300;background:var(--espresso);color:var(--dk);line-height:1.55;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
em{font-style:italic}
h1{font-family:var(--serif);font-weight:500;line-height:1.1;font-size:clamp(1.7rem,5.2vw,3.1rem)}
h1 em{color:var(--gold)}
.eyebrow{font-size:clamp(0.56rem,1.6vw,0.68rem);letter-spacing:0.32em;text-transform:uppercase;color:var(--gold);font-weight:400;margin-bottom:12px}

/* ---------- Rail ---------- */
.rail{position:fixed;top:0;left:0;right:0;z-index:60;height:var(--rail);background:rgba(33,24,18,0.97);border-bottom:1px solid var(--rule-d)}
.rail-in{height:100%;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px}
.rail .rb{display:flex;align-items:center;gap:9px;font-size:0.58rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--dk-soft);white-space:nowrap;overflow:hidden}
.rail .rb img{width:24px;height:24px;flex-shrink:0}
.rail .rc{font-family:var(--serif);font-style:italic;font-size:0.9rem;color:var(--gold-soft);white-space:nowrap}
.pbar{position:fixed;top:var(--rail);left:0;right:0;z-index:60;height:2px;background:rgba(216,188,122,0.15)}
.pbar .bar{height:100%;width:0;background:var(--gold);transition:width .5s ease}

/* ---------- Stage & slides ---------- */
.stage{position:fixed;inset:0;top:calc(var(--rail) + 2px)}
.slide{position:absolute;inset:0;display:none;overflow:hidden}
.slide.active{display:block;animation:sIn .5s ease both}
@keyframes sIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
.slide.back-anim{animation:sBk .5s ease both}
@keyframes sBk{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
.slide.dark{background:var(--espresso);color:var(--dk)}
.slide.cream{background:var(--cream);color:var(--cr)}
.pad{position:absolute;inset:0;padding:clamp(16px,3.2vh,34px) clamp(18px,4.5vw,64px) clamp(58px,9vh,74px);display:flex;align-items:center;justify-content:center}
.fit{width:100%;max-width:1000px}
.sec-tag{font-size:clamp(0.52rem,1.5vw,0.62rem);letter-spacing:0.26em;text-transform:uppercase;margin-bottom:clamp(10px,2.4vh,26px);padding-bottom:10px}
.slide.dark .sec-tag{color:var(--dk-soft);border-bottom:1px solid var(--rule-d)}
.slide.cream .sec-tag{color:var(--cr-soft);border-bottom:1px solid var(--rule-l)}
.pnum{position:absolute;right:10px;bottom:44px;z-index:1;font-family:var(--serif);font-style:italic;font-size:clamp(80px,16vw,170px);line-height:1;pointer-events:none;user-select:none}
.slide.dark .pnum{color:rgba(216,188,122,0.12)}
.slide.cream .pnum{color:rgba(184,144,64,0.14)}

/* ---------- Side arrows ---------- */
.nav-btn{position:fixed;z-index:70;width:clamp(44px,6vw,54px);height:clamp(44px,6vw,54px);border-radius:50%;border:1px solid var(--gold-soft);background:rgba(33,24,18,0.55);backdrop-filter:blur(6px);color:var(--gold-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .22s;font-size:1.05rem}
.nav-btn:hover{background:var(--gold);color:#241a10;border-color:var(--gold)}
.nav-btn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#nav-prev{left:12px;top:50%;transform:translateY(-50%)}
#nav-next{right:12px;top:50%;transform:translateY(-50%)}
.nav-btn[disabled]{opacity:0;pointer-events:none}
#nav-next.pulse{animation:pulse 2.2s ease infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(200,162,74,0.35)}50%{box-shadow:0 0 0 10px rgba(200,162,74,0)}}
.nav-hint{position:fixed;z-index:60;bottom:14px;left:50%;transform:translateX(-50%);font-size:0.6rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--dk-soft);white-space:nowrap;pointer-events:none;transition:opacity .3s}
.slide-cream-hint .nav-hint{color:var(--cr-soft)}

/* ---------- Confirm prompt ---------- */
.confirm-veil{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:rgba(20,13,9,0.62);backdrop-filter:blur(4px);padding:22px}
.confirm-veil.open{display:flex}
.confirm-card{max-width:400px;width:100%;background:var(--espresso-2);border:1px solid var(--gold-soft);border-radius:14px;padding:28px 26px;text-align:center;animation:cIn .3s ease both}
@keyframes cIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}
.confirm-card .q{font-family:var(--serif);font-style:italic;font-size:1.15rem;color:#f2e7cf;margin-bottom:20px;line-height:1.35}
.confirm-card .yes{display:block;width:100%;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:13px 20px;font-family:var(--sans);font-weight:500;font-size:0.93rem;letter-spacing:0.04em;cursor:pointer;transition:background .2s}
.confirm-card .yes:hover{background:var(--gold-soft)}
.confirm-card .no{display:block;width:100%;margin-top:10px;background:none;border:1px solid var(--rule-d);border-radius:999px;padding:12px 20px;color:var(--dk-soft);font-family:var(--sans);font-weight:300;font-size:0.88rem;cursor:pointer;transition:all .2s}
.confirm-card .no:hover{border-color:var(--gold-soft);color:var(--gold-soft)}

/* ---------- Cover / Thank you ---------- */
.bgm{position:absolute;inset:0}
.bgm img{width:100%;height:100%;object-fit:cover}
.bgm .ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(33,24,18,0.62) 0%,rgba(33,24,18,0.45) 40%,rgba(33,24,18,0.94) 100%)}
.cover-fit{position:relative;z-index:2;text-align:left}
.cover-logo{width:clamp(58px,9vw,88px);height:auto;margin-bottom:clamp(14px,3vh,30px);filter:drop-shadow(0 6px 24px rgba(0,0,0,0.45))}
.cover-sub{margin-top:14px;font-size:clamp(0.82rem,2.4vw,1rem);letter-spacing:0.1em;color:var(--dk-soft)}
.cover-meta{margin-top:clamp(14px,3vh,26px);display:flex;justify-content:space-between;gap:12px;font-size:clamp(0.5rem,1.5vw,0.6rem);letter-spacing:0.22em;text-transform:uppercase;color:var(--dk-soft);border-top:1px solid var(--rule-d);padding-top:12px}
.rule{width:64px;border-bottom:1px solid var(--gold-soft);margin:clamp(10px,2.4vh,22px) 0}
.note{max-width:460px;font-size:clamp(0.88rem,2.4vw,1rem)}

/* ---------- Two-column frames ---------- */
.cols{display:grid;grid-template-columns:1fr;gap:clamp(14px,3vh,30px);align-items:center}
.photo-frame{display:none;border:1px solid var(--rule-l);padding:10px;background:var(--cream-2)}
.photo-frame img{width:100%;height:100%;object-fit:cover}
.portrait{display:none;position:relative;border:1px solid var(--rule-d);background:var(--espresso-2);padding:12px 12px 14px}
.portrait::before,.portrait::after{content:"";position:absolute;width:26px;height:26px;border:1px solid var(--gold-soft);z-index:3}
.portrait::before{top:8px;left:8px;border-right:none;border-bottom:none}
.portrait::after{bottom:8px;right:8px;border-left:none;border-top:none}
.portrait img{width:100%;height:clamp(200px,36vh,330px);object-fit:cover;object-position:center top}
.portrait .cap{text-align:center;margin-top:10px;font-size:0.56rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--dk-soft)}
.portrait .cap strong{display:block;font-family:var(--serif);font-style:italic;font-size:0.95rem;letter-spacing:0.08em;color:#f2e7cf;font-weight:500;margin-bottom:3px}

/* ---------- Content patterns ---------- */
.toc .row{display:flex;align-items:baseline;gap:14px;padding:clamp(7px,1.5vh,13px) 0;border-bottom:1px solid var(--rule-l);font-size:clamp(0.86rem,2.3vw,1rem)}
.toc .num{font-family:var(--serif);font-style:italic;color:var(--gold-deep);min-width:30px}
.toc .name{flex:1;letter-spacing:0.03em}
.toc .dots{font-size:0.56rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--cr-soft);white-space:nowrap}
.copy p{margin-bottom:clamp(8px,1.8vh,16px);font-size:clamp(0.87rem,2.4vw,1.02rem);max-width:620px}
.sig-line{margin-top:clamp(10px,2.4vh,24px)}
.sig-line .line{width:130px;border-bottom:1px solid var(--gold-soft);margin-bottom:9px}
.sig-line .who strong{display:block;font-family:var(--serif);font-style:italic;font-size:1.05rem;color:#f2e7cf;font-weight:500}
.sig-line .who{font-size:0.6rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--dk-soft)}
.kicker{font-size:0.6rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:8px}
.gl h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.1rem,3vw,1.4rem);margin-bottom:10px}
.gl ul{list-style:none}
.gl li{display:flex;justify-content:space-between;gap:14px;padding:clamp(6px,1.4vh,11px) 0;border-bottom:1px solid var(--rule-l);font-size:clamp(0.82rem,2.2vw,0.95rem)}
.gl li .k{color:var(--cr-soft)}
.gl li .v{text-align:right}
.gl p{margin-bottom:clamp(6px,1.4vh,12px);font-size:clamp(0.84rem,2.2vw,0.96rem)}
.lede{font-family:var(--serif);font-style:italic;font-size:clamp(1rem,2.8vw,1.4rem);color:var(--gold-soft);margin:clamp(8px,1.8vh,18px) 0;max-width:640px;line-height:1.35}
.slide.cream .lede{color:var(--gold-deep)}
.items{margin-top:clamp(6px,1.4vh,14px)}
.it{display:flex;gap:16px;padding:clamp(7px,1.6vh,14px) 0;border-bottom:1px solid var(--rule-l)}
.it .n{font-family:var(--serif);font-style:italic;font-size:clamp(1rem,2.6vw,1.3rem);color:var(--gold-deep);min-width:38px;line-height:1.25}
.it h4{font-family:var(--serif);font-weight:500;font-size:clamp(0.95rem,2.5vw,1.12rem);margin-bottom:2px}
.it p{font-size:clamp(0.78rem,2.1vw,0.9rem);color:var(--cr-soft);line-height:1.45}
.terms{margin-top:clamp(8px,1.8vh,18px);border-top:1px solid var(--rule-d)}
.terms .t{padding:clamp(9px,2vh,18px) 0;border-bottom:1px solid var(--rule-d)}
.terms .k{font-family:var(--serif);font-style:italic;font-size:clamp(1.15rem,3vw,1.5rem);color:var(--gold-soft);margin-bottom:4px}
.terms .v{font-size:clamp(0.84rem,2.2vw,0.97rem)}

/* ---------- Sign slide ---------- */
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin-top:clamp(8px,1.6vh,16px)}
.f label{display:block;font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:4px}
.f input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--rule-d);padding:7px 2px;font-family:var(--sans);font-weight:300;font-size:0.95rem;color:var(--dk);outline:none;border-radius:0}
.f input:focus{border-bottom-color:var(--gold)}
.f input::placeholder{color:rgba(182,168,140,0.45)}
.sigw{margin-top:clamp(10px,2vh,20px)}
.sigt{display:block;font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:7px}
.sig-pad-frame{position:relative;height:clamp(110px,17vh,170px);background:#f6efe0;border:1px solid var(--gold-soft);border-radius:6px;overflow:hidden}
.sig-pad-frame canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
.sig-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.8rem;letter-spacing:0.08em;color:#a99a7d;pointer-events:none}
.sig-pad-frame.signed .sig-hint{display:none}
.sig-clear{margin-top:7px;background:none;border:1px solid var(--rule-d);color:var(--dk-soft);font-family:var(--sans);font-weight:300;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;padding:6px 15px;border-radius:999px;cursor:pointer}
.sig-clear:hover{border-color:var(--gold-soft);color:var(--gold-soft)}
.agree-row{display:flex;gap:11px;align-items:flex-start;margin-top:clamp(8px,1.8vh,16px);cursor:pointer;font-size:clamp(0.74rem,2vw,0.86rem);max-width:620px;line-height:1.45}
.agree-row input{margin-top:3px;width:17px;height:17px;accent-color:var(--gold);flex-shrink:0}
#doc-submit{margin-top:clamp(10px,2vh,18px);width:100%;max-width:440px;display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:13px 26px;font-family:var(--sans);font-weight:500;font-size:0.95rem;letter-spacing:0.05em;cursor:pointer;transition:background .2s}
#doc-submit:hover{background:var(--gold-soft)}
#doc-submit:disabled{opacity:0.6;cursor:wait}
.doc-msg{margin-top:8px;font-size:0.84rem;min-height:1.2em}
.doc-msg.err{color:#e5a394}
.submitted-panel{border:1px solid var(--gold-soft);padding:clamp(22px,4vh,40px) 24px;text-align:center;max-width:560px;margin:0 auto}
.submitted-panel .sp-seal{font-size:1.3rem;color:var(--gold-soft);margin-bottom:10px}
.submitted-panel h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.3rem,4vw,1.7rem);color:#f2e7cf;margin-bottom:10px}
.submitted-panel p{max-width:430px;margin:0 auto 18px;font-size:clamp(0.85rem,2.3vw,0.95rem)}
.submitted-panel .btn-next{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#241a10;border-radius:999px;padding:12px 26px;font-weight:500;font-size:0.92rem;margin-bottom:10px}
.submitted-panel .btn-next:hover{background:var(--gold-soft)}
.submitted-panel .btn-back{display:inline-block;border:1px solid var(--gold-soft);color:var(--gold-soft);border-radius:999px;padding:10px 22px;font-size:0.78rem;letter-spacing:0.08em}

/* ---------- Desktop ---------- */
@media(min-width:820px){
  .cols{grid-template-columns:1.15fr 0.85fr;gap:56px}
  .photo-frame,.portrait{display:block}
  .items.two{display:grid;grid-template-columns:1fr 1fr;column-gap:56px;margin-top:clamp(6px,1.4vh,14px)}
  .cols2{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
  .terms{display:grid;grid-template-columns:1fr 1fr;border-top:none;gap:0 48px}
  .terms .t{border-top:1px solid var(--rule-d)}
}
@media(max-width:819px){
  .cols2{display:flex;flex-direction:column;gap:14px}
  #nav-prev{left:10px;top:auto;bottom:12px;transform:none}
  #nav-next{right:10px;top:auto;bottom:12px;transform:none}
  .nav-hint{bottom:24px}
  .pnum{bottom:70px}
}
</style>
</head>
<body>

<!-- Rail -->
<header class="rail">
  <div class="rail-in">
    <span class="rb"><img src="/static/images/naim-logo.png" alt=""><span>Naim Automation Systems Co. · Onboarding</span></span>
    <span class="rc" id="rail-count">01 / 10</span>
  </div>
</header>
<div class="pbar"><div class="bar" id="rail-bar"></div></div>

<!-- Side arrows -->
<button type="button" class="nav-btn" id="nav-prev" aria-label="Previous page" disabled>
  <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
</button>
<button type="button" class="nav-btn pulse" id="nav-next" aria-label="Next page">
  <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
</button>
<p class="nav-hint" id="nav-hint">Tap the arrow to reveal the next page</p>

<!-- Confirm prompt -->
<div class="confirm-veil" id="confirm-veil" role="dialog" aria-modal="true">
  <div class="confirm-card">
    <p class="q">Have you read and understood this page?</p>
    <button type="button" class="yes" id="confirm-yes">Yes — reveal the next page</button>
    <button type="button" class="no" id="confirm-no">Not yet — I'll read it again</button>
  </div>
</div>

<main class="stage" id="deck">

<!-- 1 · COVER -->
<section class="slide dark active" data-gate="0">
  <div class="bgm"><img src="/static/images/doc-cover.jpg" alt=""><div class="ov"></div></div>
  <div class="pad"><div class="fit cover-fit">
    <img class="cover-logo" src="/static/images/naim-logo.png" alt="NaiM Agency logo">
    <p class="eyebrow">A guide for new clients</p>
    <h1>Your onboarding<br><em>guide</em></h1>
    <p class="cover-sub">Welcome to Naim Automation Systems Co.</p>
    <div class="cover-meta"><span>Nairobi · Kenya</span><span>Client Onboarding · MMXXVI</span></div>
  </div></div>
</section>

<!-- 2 · CONTENTS -->
<section class="slide cream" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Onboarding · Contents</p>
    <div class="cols">
      <div>
        <p class="eyebrow">In this guide</p>
        <h1><em>Contents</em></h1>
        <div class="toc" style="margin-top:clamp(8px,2vh,20px);">
          <div class="row"><span class="num">01</span><span class="name">Welcome</span><span class="dots">Page 03</span></div>
          <div class="row"><span class="num">02</span><span class="name">Guidelines</span><span class="dots">Page 04</span></div>
          <div class="row"><span class="num">03</span><span class="name">Build &amp; approval process</span><span class="dots">Page 05</span></div>
          <div class="row"><span class="num">04</span><span class="name">What we need from you</span><span class="dots">Page 06</span></div>
          <div class="row"><span class="num">05</span><span class="name">Contract &amp; invoice</span><span class="dots">Page 07</span></div>
          <div class="row"><span class="num">06</span><span class="name">The process</span><span class="dots">Page 08</span></div>
          <div class="row"><span class="num">—</span><span class="name">Thank you</span><span class="dots">Page 09</span></div>
        </div>
      </div>
      <div class="photo-frame" style="height:clamp(260px,44vh,400px);"><img src="/static/images/doc-agenda.jpg" alt=""></div>
    </div>
  </div></div>
</section>

<!-- 3 · WELCOME -->
<section class="slide dark" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 01 · Welcome</p>
    <div class="cols">
      <div>
        <p class="eyebrow">Section 01</p>
        <h1><em>Welcome.</em></h1>
        <div class="copy" style="margin-top:clamp(8px,2vh,18px);">
          <p>Thank you for choosing Naim Automation Systems Co. as your automation partner. We are thrilled to formally welcome you.</p>
          <p>We build systems that answer every enquiry in minutes, keep records neat and searchable, and put your whole business in your pocket — so your team focuses on the work that matters, not paperwork.</p>
          <p>This guide explains what to expect at every step. Keep it close — it answers most questions before they arise.</p>
        </div>
        <div class="sig-line">
          <div class="line"></div>
          <div class="who"><strong>M.A. Salmin</strong>Founder &amp; Systems Architect</div>
        </div>
      </div>
      <div class="portrait">
        <img src="/static/images/founder.jpg" alt="M.A. Salmin, Founder and Systems Architect">
        <div class="cap"><strong>M.A. Salmin</strong>Founder &amp; Systems Architect</div>
      </div>
    </div>
    <div class="pnum">01</div>
  </div></div>
</section>

<!-- 4 · GUIDELINES -->
<section class="slide cream" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 02 · Guidelines</p>
    <p class="eyebrow">Section 02</p>
    <h1><em>Guidelines.</em></h1>
    <div class="cols2 gl" style="margin-top:clamp(10px,2.4vh,26px);">
      <div>
        <p class="kicker">Working hours &amp; contact</p>
        <h3>When we are here.</h3>
        <ul>
          <li><span class="k">Days</span><span class="v">Monday — Friday</span></li>
          <li><span class="k">Hours</span><span class="v">09:00 — 18:00 EAT</span></li>
          <li><span class="k">Response</span><span class="v">Within one business day</span></li>
          <li><span class="k">Emergencies</span><span class="v">Prioritised</span></li>
        </ul>
      </div>
      <div>
        <p class="kicker">How to reach us</p>
        <h3>Two clean channels.</h3>
        <p>All communication runs through your dedicated Email and WhatsApp channel.</p>
        <p>Kindly consolidate feedback through your appointed contact person — it keeps your project on schedule.</p>
      </div>
    </div>
    <div class="pnum">02</div>
  </div></div>
</section>

<!-- 5 · BUILD & APPROVAL -->
<section class="slide dark" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 03 · Build &amp; approval</p>
    <p class="eyebrow">Section 03</p>
    <h1>Build &amp; approval <em>process.</em></h1>
    <p class="lede">Every second counts. Once your deposit is received and your materials are in, the build begins.</p>
    <div class="cols2 copy">
      <p>We engineer your system and send progress updates so you are never in the dark. Nothing goes live without your approval — you review, we refine, and only what you approve is deployed.</p>
      <p>Changes are always possible at any stage — simply tell your contact person. They are quoted in writing first, so there are never surprises on the invoice.</p>
    </div>
    <div class="pnum">03</div>
  </div></div>
</section>

<!-- 6 · WHAT WE NEED -->
<section class="slide cream" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 04 · What we need</p>
    <p class="eyebrow">Section 04</p>
    <h1>What we need <em>from you.</em></h1>
    <div class="items two">
      <div class="it"><span class="n">i.</span><div><h4>One contact person</h4><p>Authorised to give approvals — keeps decisions clean and quick.</p></div></div>
      <div class="it"><span class="n">ii.</span><div><h4>Access credentials</h4><p>Logins your system connects to, shared securely — never plain text.</p></div></div>
      <div class="it"><span class="n">iii.</span><div><h4>A short walkthrough</h4><p>Fifteen minutes on how things are done today.</p></div></div>
      <div class="it"><span class="n">iv.</span><div><h4>Sample data</h4><p>A handful of example records — anonymised is fine.</p></div></div>
      <div class="it"><span class="n">v.</span><div><h4>Branding assets</h4><p>Your logo and preferred wording, so every document feels like you.</p></div></div>
      <div class="it"><span class="n">vi.</span><div><h4>The deposit</h4><p>Your timeline starts the day it is received.</p></div></div>
    </div>
    <div class="pnum">04</div>
  </div></div>
</section>

<!-- 7 · CONTRACT & INVOICE -->
<section class="slide dark" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 05 · Contract &amp; invoice</p>
    <p class="eyebrow">Section 05</p>
    <h1>Contract &amp; <em>invoice.</em></h1>
    <div class="copy" style="margin-top:clamp(8px,1.8vh,16px);">
      <p>No work is carried out until the Service Agreement has been signed and the deposit received. Our payment structure is simple — no surprises along the way.</p>
    </div>
    <div class="terms">
      <div class="t"><div class="k">50% deposit</div><div class="v">To begin — timeline starts the day it is received.</div></div>
      <div class="t"><div class="k">50% balance</div><div class="v">Only after you watch your finished system perform live.</div></div>
    </div>
    <div class="copy" style="margin-top:clamp(8px,1.8vh,16px);">
      <p>The monthly care plan begins the month after final delivery. The Quotation &amp; Service Agreement Contract is your next document — signed right after this guide.</p>
    </div>
    <div class="pnum">05</div>
  </div></div>
</section>

<!-- 8 · THE PROCESS -->
<section class="slide cream" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Section 06 · The process</p>
    <p class="eyebrow">Section 06</p>
    <h1>The <em>Process.</em></h1>
    <div class="items">
      <div class="it"><span class="n">01</span><div><h4>Book appointment</h4><p>A short consultation so we truly understand your needs.</p></div></div>
      <div class="it"><span class="n">02</span><div><h4>Quotation &amp; agreement</h4><p>An itemised quote and contract — signed from your phone.</p></div></div>
      <div class="it"><span class="n">03</span><div><h4>We build your system</h4><p>Roughly 7–21 business days, with progress updates.</p></div></div>
      <div class="it"><span class="n">04</span><div><h4>Live demo &amp; training</h4><p>You see it work before the balance. Team training follows.</p></div></div>
      <div class="it"><span class="n">05</span><div><h4>Handover &amp; care</h4><p>Owner's manual delivered, then the monthly care plan.</p></div></div>
    </div>
    <div class="pnum">06</div>
  </div></div>
</section>

<!-- 9 · THANK YOU -->
<section class="slide dark" data-gate="0">
  <div class="bgm"><img src="/static/images/doc-thankyou.jpg" alt=""><div class="ov"></div></div>
  <div class="pad"><div class="fit cover-fit">
    <p class="eyebrow">A final note</p>
    <h1>Thank you.</h1>
    <div class="rule"></div>
    <p class="note">Questions about your onboarding? Reach us on WhatsApp any time.</p>
    <p class="note" style="margin-top:12px;color:var(--gold-soft);font-style:italic;">One last step — acknowledge this guide with your signature.</p>
  </div></div>
</section>

<!-- 10 · SIGN -->
<section class="slide dark" data-gate="0" id="sign-section" style="background:var(--espresso-2);">
  <div class="pad"><div class="fit" id="sign-fit">
    <div id="sign-form">
      <p class="eyebrow">Acknowledge · Sign · Submit</p>
      <div class="sgrid">
        <div class="f"><label for="s-name">Full name *</label><input id="s-name" type="text" required placeholder="e.g. Fatma Ali Hassan"></div>
        <div class="f"><label for="s-agency">Agency / company *</label><input id="s-agency" type="text" required placeholder="e.g. Coastal Manpower Ltd"></div>
        <div class="f"><label for="s-phone">Phone / WhatsApp</label><input id="s-phone" type="tel" placeholder="+254 7XX XXX XXX"></div>
        <div class="f"><label for="s-email">Email</label><input id="s-email" type="email" placeholder="you@agency.co.ke"></div>
      </div>
      <div class="sigw">
        <label class="sigt">Draw your signature *</label>
        <div class="sig-pad-frame">
          <canvas id="sig-pad" aria-label="Signature pad"></canvas>
          <span class="sig-hint" id="sig-hint">Sign here with your finger</span>
        </div>
        <button type="button" class="sig-clear" id="sig-clear">Clear &amp; sign again</button>
      </div>
      <label class="agree-row">
        <input type="checkbox" id="s-agree">
        <span>I confirm I have read every page of this Onboarding Guide and understand the process, guidelines and payment structure.</span>
      </label>
      <button type="button" id="doc-submit" data-doc-type="onboarding">Sign &amp; Submit →</button>
      <p id="doc-msg" class="doc-msg" role="status"></p>
    </div>
    <div class="submitted-panel" id="submitted-panel" hidden>
      <div class="sp-seal">✦</div>
      <h3>Signed &amp; received.</h3>
      <p>Your acknowledgement has reached us instantly. Your next document is now unlocked.</p>
      <a class="btn-next" href="/docs/quotation">Continue to the Contract →</a><br>
      <a class="btn-back" href="/docs">Back to Portal</a>
    </div>
  </div></div>
</section>

</main>

<script>
/* Full-screen reveal deck: no scrolling, side arrows, confirm gate, fit-to-screen */
(function () {
  'use strict';
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var cur = 0, maxSeen = 0;
  var railCount = document.getElementById('rail-count');
  var railBar = document.getElementById('rail-bar');
  var btnPrev = document.getElementById('nav-prev');
  var btnNext = document.getElementById('nav-next');
  var hint = document.getElementById('nav-hint');
  var veil = document.getElementById('confirm-veil');

  function pad2(n){ return n < 10 ? '0' + n : '' + n; }

  function fit(slide) {
    var f = slide.querySelector('.fit');
    if (!f) return;
    f.style.transform = '';
    var padEl = slide.querySelector('.pad');
    var avail = padEl.clientHeight - 8;
    var cs = getComputedStyle(padEl);
    avail -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var need = f.scrollHeight;
    if (need > avail && avail > 0) {
      var s = Math.max(0.5, avail / need);
      f.style.transform = 'scale(' + s + ')';
      f.style.transformOrigin = 'center center';
    }
  }

  function render(back) {
    slides.forEach(function (s, i) {
      s.classList.remove('active', 'back-anim');
      if (i === cur) {
        s.classList.add('active');
        if (back) s.classList.add('back-anim');
      }
    });
    railCount.textContent = pad2(cur + 1) + ' / ' + pad2(total);
    railBar.style.width = (((cur + 1) / total) * 100) + '%';
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur === total - 1;
    hint.style.opacity = cur === 0 ? '1' : '0';
    document.body.classList.toggle('slide-cream-hint', slides[cur].classList.contains('cream'));
    fit(slides[cur]);
    if (slides[cur].id === 'sign-section') window.dispatchEvent(new Event('resize'));
  }

  function goNext() {
    if (cur >= total - 1) return;
    var gated = slides[cur].getAttribute('data-gate') === '1';
    if (gated) { veil.classList.add('open'); return; }
    advance();
  }
  function advance() {
    cur++;
    if (cur > maxSeen) maxSeen = cur;
    render(false);
  }
  function goPrev() { if (cur <= 0) return; cur--; render(true); }

  btnNext.addEventListener('click', goNext);
  btnPrev.addEventListener('click', goPrev);
  document.getElementById('confirm-yes').addEventListener('click', function () {
    veil.classList.remove('open'); advance();
  });
  document.getElementById('confirm-no').addEventListener('click', function () {
    veil.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { fit(slides[cur]); }, 120);
  });

  render(false);
})();
</script>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/docs.js"></script>
</body>
</html>`
}
