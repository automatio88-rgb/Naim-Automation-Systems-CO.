// Quotation & Service Agreement Contract — Naim Automation Systems Co.
// TRUE SLIDE DECK: no scrolling. Every page fits the screen (mobile + desktop).
// Content preserved verbatim from the agent-designed document; only pagination changed.
// Honesty-gated: locked until the Onboarding Guide has been signed and submitted.
// Paper #f5efe2 / gold #c8a24a · Playfair Display + Jost. Posts doc_type "quotation".

export function quotationPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Quotation &amp; Service Agreement Contract — Naim Automation Systems Co.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/favicon.ico">
<link rel="icon" type="image/png" sizes="64x64" href="/static/images/favicon.png">
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
  --rail:52px;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{font-family:var(--sans);font-weight:300;background:var(--paper);color:var(--ink);line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}

/* ---------- Locked screen (honesty gate) ---------- */
.lock-screen{display:none;position:fixed;inset:0;z-index:120;background:var(--espresso);color:#e8dbc2;padding:40px 26px;align-items:center;justify-content:center;overflow:hidden}
body.locked .lock-screen{display:flex}
.lock-card{max-width:520px;text-align:center;animation:fadeUp .55s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.lock-card img{width:clamp(56px,9vh,76px);height:auto;margin:0 auto clamp(14px,3vh,26px)}
.lock-card .eyebrow{font-size:0.66rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:14px}
.lock-card h1{font-family:var(--serif);font-weight:500;font-size:clamp(1.7rem,5.4vw,2.5rem);line-height:1.15;color:#f2e7cf;margin-bottom:16px}
.lock-card h1 em{font-style:italic;color:var(--gold-soft)}
.lock-card p{color:#b6a88c;font-size:clamp(0.88rem,2.4vw,0.98rem);max-width:430px;margin:0 auto 22px}
.lock-card .btn-go{display:inline-flex;align-items:center;gap:10px;background:var(--gold);color:#241a10;border-radius:999px;padding:14px 30px;font-weight:500;font-size:0.95rem;letter-spacing:0.05em;transition:background .2s}
.lock-card .btn-go:hover{background:var(--gold-soft)}
.lock-card .small{margin-top:18px;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:#8d7f65}

/* ---------- Rail ---------- */
.rail{position:fixed;top:0;left:0;right:0;z-index:60;height:var(--rail);background:rgba(245,239,226,0.97);border-bottom:1px solid var(--line)}
.rail-in{height:100%;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px}
.rail .rb{display:flex;align-items:center;gap:9px;font-size:0.58rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--ink-faint);white-space:nowrap;overflow:hidden}
.rail .rb img{width:24px;height:24px;flex-shrink:0}
.rail .rc{font-family:var(--serif);font-style:italic;font-size:0.9rem;color:var(--gold-deep);white-space:nowrap}
.pbar{position:fixed;top:var(--rail);left:0;right:0;z-index:60;height:2px;background:rgba(168,134,47,0.18)}
.pbar .bar{height:100%;width:0;background:var(--gold);transition:width .5s ease}

/* ---------- Stage & slides ---------- */
.stage{position:fixed;inset:0;top:calc(var(--rail) + 2px)}
.slide{position:absolute;inset:0;display:none;overflow:hidden;background:var(--paper)}
.slide.active{display:block;animation:sIn .5s ease both}
@keyframes sIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
.slide.back-anim{animation:sBk .5s ease both}
@keyframes sBk{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
.pad{position:absolute;inset:0;padding:clamp(16px,3vh,32px) clamp(18px,4.5vw,64px) clamp(58px,9vh,74px);display:flex;align-items:center;justify-content:center}
.fit{width:100%;max-width:860px}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:0;width:min(58vw,420px);opacity:0.05;pointer-events:none;user-select:none}
.fit,.pad{z-index:1}
.pnum{position:absolute;right:10px;bottom:44px;font-family:var(--serif);font-style:italic;font-size:clamp(76px,14vw,150px);line-height:1;color:rgba(168,134,47,0.12);pointer-events:none;user-select:none}

/* ---------- Side arrows ---------- */
.nav-btn{position:fixed;z-index:70;width:clamp(44px,6vw,54px);height:clamp(44px,6vw,54px);border-radius:50%;border:1px solid var(--gold-deep);background:rgba(245,239,226,0.72);backdrop-filter:blur(6px);color:var(--gold-deep);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .22s}
.nav-btn:hover{background:var(--gold);color:#241a10;border-color:var(--gold)}
.nav-btn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#nav-prev{left:12px;top:50%;transform:translateY(-50%)}
#nav-next{right:12px;top:50%;transform:translateY(-50%)}
.nav-btn[disabled]{opacity:0;pointer-events:none}
#nav-next.pulse{animation:pulse 2.2s ease infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(200,162,74,0.4)}50%{box-shadow:0 0 0 10px rgba(200,162,74,0)}}
.nav-hint{position:fixed;z-index:60;bottom:14px;left:50%;transform:translateX(-50%);font-size:0.6rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--ink-faint);white-space:nowrap;pointer-events:none;transition:opacity .3s}

/* ---------- Confirm prompt ---------- */
.confirm-veil{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:rgba(32,24,17,0.55);backdrop-filter:blur(4px);padding:22px}
.confirm-veil.open{display:flex}
.confirm-card{max-width:400px;width:100%;background:var(--white);border:1px solid var(--gold-soft);border-radius:14px;padding:28px 26px;text-align:center;box-shadow:0 24px 60px -20px rgba(43,33,23,0.4);animation:cIn .3s ease both}
@keyframes cIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}
.confirm-card .q{font-family:var(--serif);font-style:italic;font-size:1.15rem;color:var(--ink);margin-bottom:20px;line-height:1.35}
.confirm-card .yes{display:block;width:100%;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:13px 20px;font-family:var(--sans);font-weight:500;font-size:0.93rem;letter-spacing:0.04em;cursor:pointer;transition:background .2s}
.confirm-card .yes:hover{background:var(--gold-soft)}
.confirm-card .no{display:block;width:100%;margin-top:10px;background:none;border:1px solid var(--line);border-radius:999px;padding:12px 20px;color:var(--ink-soft);font-family:var(--sans);font-weight:300;font-size:0.88rem;cursor:pointer;transition:all .2s}
.confirm-card .no:hover{border-color:var(--gold);color:var(--gold-deep)}

/* ---------- Cover ---------- */
.q-header{display:flex;flex-direction:column;gap:16px;padding-bottom:clamp(14px,2.6vh,24px);border-bottom:1px solid var(--line)}
.q-brand{display:flex;align-items:center;gap:14px}
.q-brand img{width:clamp(44px,7vh,56px);height:auto}
.q-brand .script{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.05rem,3vw,1.3rem);line-height:1.2}
.q-brand .sub{font-size:0.62rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-deep);margin-top:4px}
.q-contacts{display:flex;flex-direction:column;gap:7px;font-size:clamp(0.8rem,2.2vw,0.9rem);color:var(--ink-soft)}
.q-contacts .row{display:flex;align-items:center;gap:10px}
.q-contacts svg{width:16px;height:16px;stroke:var(--gold-deep);fill:none;stroke-width:1.5;flex-shrink:0}
.doc-title{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.8rem,6.4vw,3.2rem);color:var(--gold-deep);text-align:center;margin:clamp(18px,4.5vh,44px) 0 8px;line-height:1.15}
.doc-subtitle{text-align:center;font-size:clamp(0.58rem,1.7vw,0.68rem);letter-spacing:0.3em;text-transform:uppercase;color:var(--ink-faint)}
.cover-copy{text-align:center;max-width:520px;margin:clamp(14px,3vh,26px) auto 0;font-size:clamp(0.86rem,2.3vw,0.96rem);color:var(--ink-soft)}
.cover-meta{margin-top:clamp(16px,3.6vh,30px);text-align:center;font-size:0.6rem;letter-spacing:0.26em;text-transform:uppercase;color:var(--ink-faint)}

/* ---------- Sections ---------- */
.sec-tag{font-size:clamp(0.52rem,1.5vw,0.62rem);letter-spacing:0.26em;text-transform:uppercase;color:var(--gold-deep);font-weight:500;margin-bottom:clamp(10px,2.2vh,22px);padding-bottom:10px;border-bottom:1px solid var(--line)}
.pt-head{text-align:center;margin-bottom:clamp(10px,2.4vh,24px)}
.pt-head .rule{width:64px;border-bottom:1px solid var(--gold);margin:0 auto 12px}
.pt-head .pt{font-size:0.62rem;letter-spacing:0.34em;text-transform:uppercase;color:var(--gold-deep)}
.pt-head h2{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.4rem,4.6vw,2.2rem);margin-top:8px}
.para{font-size:clamp(0.86rem,2.3vw,0.97rem);color:var(--ink-soft);max-width:680px}

/* Fields */
.fields{display:grid;grid-template-columns:1fr;gap:clamp(9px,1.8vh,14px)}
.field{display:flex;flex-direction:column;gap:3px}
.field .k{font-size:0.64rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-faint)}
.field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);padding:7px 2px;font-family:var(--sans);font-weight:400;font-size:0.97rem;color:var(--ink);outline:none;border-radius:0}
.field input:focus{border-bottom-color:var(--gold)}
.field input::placeholder{color:rgba(139,126,104,0.55);font-weight:300}
.field .fixed{font-size:clamp(0.88rem,2.3vw,0.96rem);color:var(--ink);padding:7px 2px;border-bottom:1px solid var(--line-soft)}

/* Cost table */
.cost-table{width:100%;border-collapse:collapse;font-size:clamp(0.8rem,2.2vw,0.93rem)}
.cost-table th{font-size:0.6rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-deep);font-weight:500;text-align:left;padding:8px 6px;border-bottom:1px solid var(--line)}
.cost-table th:last-child{text-align:right}
.cost-table td{padding:clamp(8px,1.7vh,12px) 6px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
.cost-table td.amount{text-align:right;white-space:nowrap;font-weight:400}
.cost-table td.amount .cur{color:var(--ink-faint);font-size:0.78rem;margin-right:5px}
.cost-table input{width:100px;background:transparent;border:none;border-bottom:1px solid var(--line);padding:3px 2px;text-align:right;font-family:var(--sans);font-weight:400;font-size:0.94rem;color:var(--ink);outline:none;border-radius:0}
.cost-table input:focus{border-bottom-color:var(--gold)}
.cost-table input::placeholder{color:rgba(139,126,104,0.5)}
.total-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:clamp(10px,2vh,16px);padding:clamp(10px,2vh,15px) 8px;background:var(--gold-pale);border:1px solid var(--gold-soft)}
.total-row .k{font-family:var(--serif);font-style:italic;font-size:clamp(1rem,2.8vw,1.15rem);color:var(--ink)}
.total-row .v{display:flex;align-items:baseline;gap:8px;white-space:nowrap}
.total-row .cur{font-size:0.78rem;color:var(--ink-faint)}
.total-row input{width:140px;background:transparent;border:none;border-bottom:1px solid var(--gold-deep);padding:3px 2px;text-align:right;font-family:var(--serif);font-weight:500;font-size:1.15rem;color:var(--ink);outline:none;border-radius:0}
.monthly-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:clamp(10px,2vh,18px);padding-top:clamp(9px,1.8vh,14px);border-top:1px solid var(--line)}
.monthly-row .k{font-size:clamp(0.84rem,2.3vw,0.92rem);font-weight:400}
.monthly-row .v{display:flex;align-items:baseline;gap:6px;white-space:nowrap;font-size:0.92rem}
.monthly-row input{width:100px;background:transparent;border:none;border-bottom:1px solid var(--line);padding:3px 2px;text-align:right;font-family:var(--sans);font-weight:400;font-size:0.94rem;color:var(--ink);outline:none;border-radius:0}
.monthly-row input:focus{border-bottom-color:var(--gold)}
.monthly-note{margin-top:8px;font-size:clamp(0.74rem,2vw,0.82rem);color:var(--ink-faint);font-style:italic}

.please-note{padding:clamp(12px,2.4vh,18px) 20px;background:var(--gold-pale);border-left:3px solid var(--gold);font-size:clamp(0.82rem,2.2vw,0.92rem);color:var(--ink-soft);margin-bottom:clamp(12px,2.6vh,24px)}
.please-note strong{color:var(--ink);font-weight:500}

/* Clauses */
.clause{margin-top:clamp(12px,2.6vh,24px);max-width:760px}
.clause h3{font-family:var(--serif);font-weight:500;font-size:clamp(1rem,2.8vw,1.18rem);margin-bottom:clamp(5px,1vh,9px)}
.clause .cl-num{font-style:italic;color:var(--gold-deep);margin-right:10px}
.clause p{font-size:clamp(0.82rem,2.25vw,0.95rem);color:var(--ink-soft)}
.clause b{font-weight:500;color:var(--ink)}
.clause ul{list-style:none;margin-top:4px}
.clause li{position:relative;padding:clamp(3px,0.8vh,6px) 0 clamp(3px,0.8vh,6px) 22px;font-size:clamp(0.82rem,2.25vw,0.95rem);color:var(--ink-soft)}
.clause li::before{content:"—";position:absolute;left:0;color:var(--gold-deep)}
.note-box{margin-top:clamp(12px,2.6vh,24px);padding:clamp(11px,2.2vh,16px) 20px;border:1px dashed var(--line);font-size:clamp(0.76rem,2vw,0.85rem);font-style:italic;color:var(--ink-faint);max-width:760px}

/* ---------- Sign slide ---------- */
.acceptance-body{font-size:clamp(0.8rem,2.2vw,0.93rem);color:var(--ink-soft);max-width:720px;margin-bottom:clamp(9px,1.9vh,16px)}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px}
.f label{display:block;font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:3px}
.f input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);padding:6px 2px;font-family:var(--sans);font-weight:400;font-size:0.94rem;color:var(--ink);outline:none;border-radius:0}
.f input:focus{border-bottom-color:var(--gold)}
.f input::placeholder{color:rgba(139,126,104,0.5);font-weight:300}
.sigw{margin-top:clamp(9px,1.9vh,16px)}
.sigt{display:block;font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:6px;font-weight:500}
.sig-pad-frame{position:relative;height:clamp(100px,15vh,160px);background:var(--white);border:1px solid var(--gold-soft);border-radius:6px;overflow:hidden}
.sig-pad-frame canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
.sig-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.8rem;letter-spacing:0.08em;color:var(--ink-faint);pointer-events:none}
.sig-pad-frame.signed .sig-hint{display:none}
.sig-clear{margin-top:6px;background:none;border:1px solid var(--line);color:var(--ink-soft);font-family:var(--sans);font-weight:300;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;padding:6px 15px;border-radius:999px;cursor:pointer}
.sig-clear:hover{border-color:var(--gold);color:var(--gold-deep)}
.date-consult{display:grid;grid-template-columns:1fr;gap:9px 18px;margin-top:clamp(9px,1.9vh,16px);align-items:end}
.date-row{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
.date-row .k{font-size:0.6rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-faint)}
.date-row input{background:transparent;border:none;border-bottom:1px solid var(--line);padding:6px 2px;font-family:var(--sans);font-weight:400;font-size:0.94rem;color:var(--ink);outline:none;border-radius:0;width:150px}
.date-row input:focus{border-bottom-color:var(--gold)}
.date-row .btn-today{background:none;border:1px solid var(--gold-soft);color:var(--gold-deep);font-family:var(--sans);font-weight:400;font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;padding:7px 15px;border-radius:999px;cursor:pointer}
.date-row .btn-today:hover{background:var(--gold-pale)}
.consultant-box{padding:10px 14px;border:1px solid var(--line-soft);font-size:0.8rem;color:var(--ink-soft)}
.consultant-box .role{font-size:0.56rem;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:4px}
.consultant-box .name{font-family:var(--serif);font-style:italic;font-size:0.98rem;color:var(--ink)}
.agree-row{display:flex;gap:11px;align-items:flex-start;margin-top:clamp(9px,1.9vh,16px);cursor:pointer;font-size:clamp(0.74rem,2vw,0.86rem);color:var(--ink-soft);max-width:720px;line-height:1.45}
.agree-row input{margin-top:3px;width:17px;height:17px;accent-color:var(--gold);flex-shrink:0}
#doc-submit{margin-top:clamp(10px,2vh,16px);width:100%;max-width:480px;display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--gold);color:#241a10;border:none;border-radius:999px;padding:13px 28px;font-family:var(--sans);font-weight:500;font-size:0.96rem;letter-spacing:0.05em;cursor:pointer;transition:background .2s}
#doc-submit:hover{background:var(--gold-soft)}
#doc-submit:disabled{opacity:0.6;cursor:wait}
.doc-msg{margin-top:8px;font-size:0.84rem;min-height:1.2em}
.doc-msg.err{color:#b0432f}
.submitted-panel{border:1px solid var(--gold-soft);background:var(--white);padding:clamp(24px,4.5vh,44px) 26px;text-align:center;max-width:600px;margin:0 auto}
.submitted-panel .sp-seal{font-size:1.4rem;color:var(--gold);margin-bottom:10px}
.submitted-panel h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.3rem,4vw,1.7rem);margin-bottom:10px}
.submitted-panel p{color:var(--ink-soft);max-width:460px;margin:0 auto 20px;font-size:clamp(0.85rem,2.3vw,0.95rem)}
.submitted-panel .btn-back{display:inline-block;border:1px solid var(--gold);color:var(--gold-deep);border-radius:999px;padding:11px 26px;font-size:0.82rem;letter-spacing:0.1em}

/* ---------- Desktop ---------- */
@media(min-width:820px){
  .q-header{flex-direction:row;align-items:flex-start;justify-content:space-between}
  .fields{grid-template-columns:1fr 1fr;gap:12px 40px}
  .clauses2{display:grid;grid-template-columns:1fr 1fr;gap:0 52px;align-items:start}
  .clauses2 .clause{margin-top:clamp(10px,2.2vh,20px)}
  .date-consult{grid-template-columns:auto 1fr;gap:18px 32px}
}
@media(max-width:819px){
  #nav-prev{left:10px;top:auto;bottom:12px;transform:none}
  #nav-next{right:10px;top:auto;bottom:12px;transform:none}
  .nav-hint{bottom:24px}
  .pnum{bottom:70px}
}
</style>
</head>
<body>

<!-- ============ LOCKED SCREEN (honesty gate) ============ -->
<div class="lock-screen">
  <div class="lock-card">
    <img src="/static/images/naim-logo.png" alt="NaiM Agency logo">
    <p class="eyebrow">Step 2 of 2 · Not yet unlocked</p>
    <h1>One document<br><em>comes first.</em></h1>
    <p>This contract unlocks the moment you finish, sign and submit your Onboarding Guide — so everything here makes complete sense when you reach it.</p>
    <a class="btn-go" href="/docs/onboarding">Start with the Onboarding Guide →</a>
    <p class="small"><a href="/docs">← Back to Document Portal</a></p>
  </div>
</div>

<!-- Rail -->
<header class="rail">
  <div class="rail-in">
    <span class="rb"><img src="/static/images/naim-logo.png" alt=""><span>Quotation &amp; Service Agreement Contract</span></span>
    <span class="rc" id="rail-count">01 / 11</span>
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
<section class="slide active" data-gate="0">
  <div class="watermark" aria-hidden="true"><img src="/static/images/naim-logo.png" alt=""></div>
  <div class="pad"><div class="fit">
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
    <h1 class="doc-title">Quotation &amp; Service<br>Agreement Contract</h1>
    <p class="doc-subtitle">One document · Reviewed once · Signed once</p>
    <p class="cover-copy">Part I is your itemised quotation. Part II is the plain-language agreement that protects both of us. One signature covers it all.</p>
    <p class="cover-meta">Naim Automation Systems Co. · Nairobi, Kenya · MMXXVI</p>
  </div></div>
</section>

<!-- 2 · PART I · PROJECT DETAILS -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <div class="pt-head"><div class="rule"></div><p class="pt">Part I · The Quotation</p><h2>Project Details</h2></div>
    <div class="fields">
      <div class="field"><span class="k">Project</span><input type="text" data-name="project" placeholder="e.g. Candidate Intake Automation System"></div>
      <div class="field"><span class="k">Client</span><input type="text" data-name="client" placeholder="Agency / company name"></div>
      <div class="field"><span class="k">Contact No</span><input type="tel" data-name="contact_no" placeholder="+254 7XX XXX XXX"></div>
      <div class="field"><span class="k">Email Address</span><input type="email" data-name="email_address" placeholder="you@agency.co.ke"></div>
      <div class="field"><span class="k">Payment Terms</span><span class="fixed">50% deposit, 50% upon completion</span></div>
      <div class="field"><span class="k">Delivery Timeline</span><span class="fixed">7–21 business days after confirmation &amp; deposit</span></div>
    </div>
    <p class="para" style="margin-top:clamp(12px,2.6vh,22px);"><b style="font-weight:500;color:var(--ink);">Summary of Service —</b> Design, engineering and deployment of the custom automation system(s) itemised next. Includes professional configuration, testing, live demonstration, team training and final handover in production-ready format.</p>
    <div class="pnum">I</div>
  </div></div>
</section>

<!-- 3 · COST BREAKDOWN -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part I · Cost Breakdown</p>
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
  </div></div>
</section>

<!-- 4 · NOTE + BANKING -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part I · Banking Details</p>
    <div class="please-note">
      <strong>Please note:</strong> Certain components of this project are non-refundable as they cover consultation, systems architecture, and development costs already incurred once the project begins. The Refund Policy in Part II sets out the full detail.
    </div>
    <div class="fields">
      <div class="field"><span class="k">Bank</span><input type="text" data-name="bank" placeholder=""></div>
      <div class="field"><span class="k">Account Type</span><input type="text" data-name="account_type" placeholder=""></div>
      <div class="field"><span class="k">Account Number</span><input type="text" data-name="account_number" placeholder=""></div>
      <div class="field"><span class="k">Branch Code</span><input type="text" data-name="branch_code" placeholder=""></div>
      <div class="field"><span class="k">M-PESA (Till / Paybill)</span><input type="text" data-name="mpesa_till_paybill" placeholder=""></div>
      <div class="field"><span class="k">Reference</span><span class="fixed">Client Name / Project Name</span></div>
    </div>
    <div class="pnum">I</div>
  </div></div>
</section>

<!-- 5 · PART II · CLAUSES 1–2 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <div class="pt-head"><div class="rule"></div><p class="pt">Part II · The Service Agreement</p><h2>Thirteen clear clauses.</h2></div>
    <p class="para" style="text-align:center;margin:0 auto;">Written in plain language. They protect both of us — please read each one.</p>
    <div class="clause">
      <h3><span class="cl-num">1.</span>Parties &amp; Definitions</h3>
      <p>This Service Agreement ("Agreement") is entered into between <b>Naim Automation Systems Co.</b> ("the Provider"), represented by <b>M.A. Salmin</b>, and the Client named in Part I ("the Client"). "System" means the automation system(s) described in the Quotation above, which forms part of this Agreement.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">2.</span>Scope of Services</h3>
      <p>The Provider shall design, build, test and deploy the System as itemised in the Quotation. Work outside the itemised scope ("Change Requests") shall be quoted separately in writing before commencement. Nothing in this Agreement obliges the Provider to perform services not expressly stated.</p>
    </div>
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 6 · CLAUSES 3–4 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part II · Clauses 3 – 4</p>
    <div class="clause" style="margin-top:0;">
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
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 7 · CLAUSES 5–6 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part II · Clauses 5 – 6</p>
    <div class="clause" style="margin-top:0;">
      <h3><span class="cl-num">5.</span>Delivery, Acceptance &amp; Training</h3>
      <p>Delivery timelines (7–21 business days by scope) commence upon receipt of the deposit and all required client materials. Acceptance occurs upon live demonstration of the System performing the agreed functions. The Provider shall train the Client's team and supply handover documentation. A 30-day post-delivery adjustment window is included for refinements within the agreed scope.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">6.</span>Client Obligations</h3>
      <p>The Client shall provide timely access to necessary accounts, information and personnel; ensure the accuracy of data supplied; and appoint a contact person authorised to give approvals. Delays caused by the Client extend delivery timelines accordingly.</p>
    </div>
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 8 · CLAUSES 7–8 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part II · Clauses 7 – 8</p>
    <div class="clause" style="margin-top:0;">
      <h3><span class="cl-num">7.</span>Data Protection &amp; Confidentiality</h3>
      <p>Each party shall keep the other's confidential information strictly confidential. The Provider shall process personal data (including candidate data) only for the purpose of delivering the System, in line with the <b>Kenya Data Protection Act, 2019</b>. The Provider shall implement reasonable technical measures to protect such data and shall not sell or disclose it to third parties.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">8.</span>Intellectual Property</h3>
      <p>Upon full payment, the Client receives a perpetual licence to use the System for its business operations. Underlying frameworks, tooling, know-how and reusable components remain the intellectual property of the Provider. The Provider may reference the project and non-confidential outcomes in its portfolio unless the Client opts out in writing.</p>
    </div>
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 9 · CLAUSES 9–11 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part II · Clauses 9 – 11</p>
    <div class="clause" style="margin-top:0;">
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
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 10 · CLAUSES 12–13 -->
<section class="slide" data-gate="1">
  <div class="pad"><div class="fit">
    <p class="sec-tag">Part II · Clauses 12 – 13 · Final Provisions</p>
    <div class="clause" style="margin-top:0;">
      <h3><span class="cl-num">12.</span>Dispute Resolution &amp; Governing Law</h3>
      <p>The parties shall first attempt to resolve any dispute amicably within 21 days. Unresolved disputes shall be referred to mediation before litigation. This Agreement is governed by the laws of the <b>Republic of Kenya</b>.</p>
    </div>
    <div class="clause">
      <h3><span class="cl-num">13.</span>Entire Agreement</h3>
      <p>This Agreement, together with the Quotation in Part I and any signed annexes, constitutes the entire agreement between the parties and supersedes all prior discussions. Amendments are valid only in writing signed by both parties.</p>
    </div>
    <div class="note-box">
      This document is a professional services template and does not constitute legal advice. Parties are encouraged to seek independent legal review before execution.
    </div>
    <div class="pnum">II</div>
  </div></div>
</section>

<!-- 11 · ACCEPTANCE + SIGN -->
<section class="slide" data-gate="0" id="sign-section">
  <div class="pad"><div class="fit">
    <div id="sign-form">
      <p class="sec-tag">Acceptance · Sign right here, on this screen</p>
      <p class="acceptance-body">By signing below, the Client accepts the Quotation in Part I and agrees to all thirteen clauses of the Service Agreement in Part II. One signature covers this entire contract — after you submit, we receive it instantly, acknowledge it, and share your own PDF copy.</p>
      <div class="sgrid">
        <div class="f"><label for="s-name">Your full name *</label><input id="s-name" type="text" required placeholder="e.g. Fatma Ali Hassan"></div>
        <div class="f"><label for="s-agency">Agency / company name *</label><input id="s-agency" type="text" required placeholder="e.g. Coastal Manpower Ltd"></div>
        <div class="f"><label for="s-phone">Phone / WhatsApp</label><input id="s-phone" type="tel" placeholder="+254 7XX XXX XXX"></div>
        <div class="f"><label for="s-email">Email</label><input id="s-email" type="email" placeholder="you@agency.co.ke"></div>
      </div>
      <div class="sigw">
        <label class="sigt">Client — draw your signature below *</label>
        <div class="sig-pad-frame">
          <canvas id="sig-pad" aria-label="Signature pad"></canvas>
          <span class="sig-hint" id="sig-hint">Sign here with your finger</span>
        </div>
        <button type="button" class="sig-clear" id="sig-clear">Clear &amp; sign again</button>
      </div>
      <div class="date-consult">
        <div class="date-row">
          <span class="k">Date of signing</span>
          <input id="sign-date" class="inline-fill" type="text" data-name="date_of_signing" placeholder="DD / MM / YYYY">
          <button type="button" class="btn-today" id="btn-today">Use today's date</button>
        </div>
        <div class="consultant-box">
          <div class="role">Systems Consultant</div>
          <div class="name">M.A. Salmin — Naim Automation Systems Co.</div>
        </div>
      </div>
      <label class="agree-row">
        <input type="checkbox" id="s-agree">
        <span>I have read and accept this Quotation &amp; Service Agreement Contract in full — the cost breakdown, the payment terms and all thirteen clauses — and I sign it as the duly authorised representative of the Client.</span>
      </label>
      <button type="button" id="doc-submit" data-doc-type="quotation">Sign &amp; Submit This Contract →</button>
      <p id="doc-msg" class="doc-msg" role="status"></p>
    </div>
    <div class="submitted-panel" id="submitted-panel" hidden>
      <div class="sp-seal">✦</div>
      <h3>Signed &amp; received.</h3>
      <p>Thank you — your signed contract has reached us instantly. <b>M.A. Salmin</b> will acknowledge it and share your PDF copy, so you always hold the record of our agreement. Welcome aboard.</p>
      <a class="btn-back" href="/docs">Back to Document Portal</a>
    </div>
  </div></div>
</section>

</main>

<script>
/* Honesty gate + full-screen reveal deck: no scrolling, side arrows, confirm gate, fit-to-screen */
(function () {
  'use strict';
  var done = null;
  try { done = localStorage.getItem('naim_done_onboarding'); } catch (e) {}
  if (!done) { document.body.classList.add('locked'); }

  /* Present date helper */
  var btn = document.getElementById('btn-today');
  var dateInput = document.getElementById('sign-date');
  if (btn && dateInput) {
    btn.addEventListener('click', function () {
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      dateInput.value = pad(d.getDate()) + ' / ' + pad(d.getMonth() + 1) + ' / ' + d.getFullYear();
    });
  }

  /* Deck controller */
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
