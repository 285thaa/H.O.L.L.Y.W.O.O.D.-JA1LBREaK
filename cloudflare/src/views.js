// Server-rendered HTML views.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const VERSION = '1.2.0';
const EFFECTIVE = 'November 18, 2026';

const head = (title, { index = false, description = '' } = {}) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
  (description ? `<meta name="description" content="${esc(description)}">` : '') +
  (index ? '' : '<meta name="robots" content="noindex,nofollow">') +
  '<link rel="stylesheet" href="/assets/app.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#ed263e"><link rel="icon" type="image/png" href="/assets/icons/icon-192.png"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"></head>';

const brand = '<div class="brand center"><span class="mark" aria-hidden="true">H</span><span><b>H.OL.L.Y.W.O.O.D.</b><small>JA1LBREÅK // 285 GARAGE</small></span></div>';

const legalLinks = '<nav class="legal-links" aria-label="Legal"><a href="/legal/terms">Terms</a><a href="/legal/privacy">Privacy</a><a href="/legal/copyright">Copyright &amp; Trademarks</a></nav>';

const copyright = () => `<span>© ${new Date().getFullYear()} 285 Garage. All rights reserved.</span>`;

const authFooter = () => `<div class="auth-foot">${legalLinks}<small>${copyright()}</small></div>`;

export function renderLogin({ preToken, error = '' }) {
  return head('Sign in | Ja1lbreåk') +
    `<body class="auth"><main class="auth-wrap"><form class="authbox" method="post" action="/login">${brand}<h1>Secure <em>Access</em></h1><p class="muted small">Authorized 285 Garage users only.</p><input type="hidden" name="csrf" value="${esc(preToken)}"><label>USERNAME<input name="username" required autocomplete="username" autocapitalize="none" spellcheck="false"></label><label>PASSWORD<input type="password" name="password" required autocomplete="current-password"></label>${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}<button class="primary">SIGN IN ↗</button></form>${authFooter()}</main></body></html>`;
}

export function renderSetup({ preToken, error = '' }) {
  return head('First Admin Setup') +
    `<body class="auth"><main class="auth-wrap"><form class="authbox" method="post" action="/setup"><h1>Initial <em>Setup</em></h1><p class="muted">Create the first administrator account. This page locks itself once an account exists.</p><input type="hidden" name="csrf" value="${esc(preToken)}"><label>SETUP TOKEN<input type="password" name="token" required autocomplete="off"></label><label>ADMIN USERNAME<input name="username" required minlength="3" maxlength="80" autocomplete="username" autocapitalize="none" spellcheck="false"></label><label>STRONG PASSWORD (14+ CHARACTERS)<input type="password" name="password" required minlength="14" autocomplete="new-password"></label>${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}<button class="primary">CREATE ADMIN ↗</button></form>${authFooter()}</main></body></html>`;
}

export function noteHtml(n) {
  return `<article class="note" data-id="${esc(n.id)}"><div class="note-head"><b>${esc(n.title)}</b><button class="note-del" type="button" aria-label="Delete note ${esc(n.title)}">DELETE</button></div><p>${esc(n.body).replace(/\n/g, '<br>')}</p><small>${esc(n.updated_at)}</small></article>`;
}

export function renderLegal({ title, html, user = false }) {
  return head(`${title} | 285 Garage`, { index: true, description: `${title} for the H.OL.L.Y.W.O.O.D. Ja1lbreåk developer dashboard by 285 Garage.` }) +
    `<body class="legal"><a class="skip" href="#main">Skip to content</a><header class="legal-top"><a class="brand" href="/"><span class="mark" aria-hidden="true">H</span><span><b>H.OL.L.Y.W.O.O.D.</b><small>JA1LBREÅK // 285 GARAGE</small></span></a><a class="logout" href="${user ? '/' : '/login'}">${user ? '← BACK TO DASHBOARD' : 'SIGN IN →'}</a></header>` +
    `<main id="main" class="legal-main"><div class="eyebrow">LEGAL</div><h1>${title}</h1><p class="muted small">Effective ${esc(EFFECTIVE)}</p><div class="legal-body">${html}</div></main>` +
    `<footer class="site-foot">${legalLinks}${copyright()}</footer></body></html>`;
}

export function renderLegalIndex() {
  return renderLegal({
    title: 'Legal',
    html: '<ul class="legal-list"><li><a href="/legal/terms">Terms of Use</a><span>Who can use the Dashboard and how.</span></li><li><a href="/legal/privacy">Privacy Policy</a><span>What is stored, and for how long.</span></li><li><a href="/legal/copyright">Copyright &amp; Trademarks</a><span>Ownership, third-party marks, and infringement reports.</span></li></ul>',
  });
}

export function renderIndex({ user, notes, aiEnabled, csrf }) {
  const notesHtml = notes.map(noteHtml).join('');
  const nav = [
    ['dashboard', '▦', 'Dashboard'], ['commands', '⌘', 'Command Directory'], ['lab', '⌁', 'Code Lab'],
    ['tools', '⚒', 'Developer Tools'], ['media', '▶', 'Media Studio'], ['security', '⬡', 'Security Center'], ['notes', '▤', 'Project Notes'], ['about', 'ⓘ', 'About'],
  ].map(([v, i, l], idx) => `<button class="nav${idx === 0 ? ' active' : ''}" data-view="${v}" type="button"${idx === 0 ? ' aria-current="page"' : ''}><span class="ico" aria-hidden="true">${i}</span><span>${l}</span></button>`).join('');

  return head('H.OL.L.Y.W.O.O.D. Ja1lbreåk | 285 Garage') + `<body data-csrf="${esc(csrf)}" data-ai="${aiEnabled ? '1' : '0'}"><a class="skip" href="#main">Skip to content</a><div class="shell">
<header class="topbar"><a class="brand" href="/"><span class="mark" aria-hidden="true">H</span><span><b>H.OL.L.Y.W.O.O.D.</b><small>JA1LBREÅK // 285 GARAGE</small></span></a><div class="topright"><span class="online"><i aria-hidden="true"></i> SYSTEM ONLINE</span><span class="user">${esc(user.username)}</span><a class="logout" href="/logout">LOG OUT</a></div></header>
<div class="layout"><aside class="sidebar"><div class="side-label">COMMAND CENTER</div><nav id="nav" aria-label="Dashboard sections">${nav}</nav><div class="side-foot">AUTHORIZED DEVELOPMENT ONLY<br><span>BUILD · DEBUG · DEPLOY</span></div></aside>
<main class="main" id="main">
<section class="view active" id="view-dashboard"><div class="eyebrow">285 GARAGE / DEVELOPER CONSOLE</div><h1>Command <em>Center</em></h1><p class="muted">Your development workspace. Pick a tool and get to work.</p>
<div class="stats"><article><small>ENVIRONMENT</small><b>WORKERS / D1</b><span>Cloudflare edge hosted</span></article><article><small>ACCESS LEVEL</small><b>${esc(String(user.role).toUpperCase())}</b><span>Authenticated session</span></article><article><small>AI ASSISTANT</small><b>${aiEnabled ? 'CONNECTED' : 'LOCAL MODE'}</b><span>${aiEnabled ? 'Server-side API configured' : 'Configure API to enable AI'}</span></article></div>
<div class="panel hero"><div><div class="eyebrow">READY FOR INPUT</div><h2>What are we building today?</h2><p class="muted">Describe a task, inspect a bug, or generate a starting point.</p></div><label class="sr-only" for="quickPrompt">Your request</label><textarea id="quickPrompt" placeholder="Example: Review this FiveM ESX Lua resource and find the nil value error..."></textarea><div class="actions"><button class="primary" id="quickRun" type="button">RUN REQUEST ↗</button><span class="hint">Ctrl + Enter to run</span></div><div id="quickResult" class="result hidden" role="status" aria-live="polite"></div></div>
<div class="quickgrid"><button type="button" data-goto="lab"><b>01 / CODE LAB</b><span>Generate code and snippets</span></button><button type="button" data-goto="commands"><b>02 / COMMANDS</b><span>Browse developer commands</span></button><button type="button" data-goto="tools"><b>03 / DEV TOOLS</b><span>Review, debug, optimize</span></button></div>
</section>
<section class="view" id="view-commands"><div class="eyebrow">DIRECTORY / 10 COMMANDS</div><h1>Command <em>Directory</em></h1><label class="sr-only" for="commandSearch">Search commands</label><input id="commandSearch" class="search" type="search" placeholder="Search commands or descriptions..."><div id="commandList" class="command-list"></div></section>
<section class="view" id="view-lab"><div class="eyebrow">WORKSPACE / CODE LAB</div><h1>Code <em>Lab</em></h1><div class="panel"><label>LANGUAGE / STACK<select id="language"><option>Lua / FiveM ESX</option><option>PHP</option><option>JavaScript</option><option>Python</option><option>HTML / CSS</option><option>C#</option><option>SQL / MySQL</option><option>API Development</option></select></label><label>TASK<textarea id="labPrompt" placeholder="Describe what you want to build, fix, or explain..."></textarea></label><div class="actions"><button class="primary" id="labRun" type="button">GENERATE / ANALYZE ↗</button><span class="hint">Ctrl + Enter to run</span></div><div id="labResult" class="result hidden" role="status" aria-live="polite"></div></div></section>
<section class="view" id="view-tools"><div class="eyebrow">WORKBENCH / UTILITIES</div><h1>Developer <em>Tools</em></h1><div class="toolgrid" id="toolGrid"></div><div class="panel"><label>SELECTED TOOL REQUEST<textarea id="toolPrompt" placeholder="Pick a tool above, then paste code or describe the task..."></textarea></label><div class="actions"><button class="primary" id="toolRun" type="button">EXECUTE TOOL ↗</button><span class="hint">Ctrl + Enter to run</span></div><div id="toolResult" class="result hidden" role="status" aria-live="polite"></div></div></section>
<section class="view" id="view-media"><div class="eyebrow">CREATOR WORKFLOW / ON-DEVICE PROCESSING</div><h1>Media <em>Studio</em></h1><p class="muted">Convert video and audio to MP4 directly in this browser. Your source file stays on this device; no media-server account or upload is required.</p><div class="panel"><label for="mediaFile">SOURCE VIDEO OR AUDIO FILE</label><input id="mediaFile" type="file" accept="video/*,audio/*,.mp4,.mov,.mkv,.avi,.webm,.mp3,.wav,.m4a,.aac,.flac,.ogg"><p class="hint">Best results with files under 250 MB. Your browser needs enough free memory for the source and output.</p><div class="actions"><button class="primary" id="mediaRun" type="button">CONVERT TO MP4 ↗</button><span id="mediaStatus" class="hint" role="status" aria-live="polite">Choose a file. FFmpeg downloads on first use (~32 MB).</span></div><video id="mediaPreview" class="media-preview hidden" controls playsinline></video><a id="mediaDownload" class="logout hidden" href="#">DOWNLOAD CONVERTED MP4 ↓</a></div><div class="toolgrid"><article class="tile"><b>FFmpeg · Available now</b><span>H.264 video and AAC audio conversion runs locally in your browser.</span></article><article class="tile"><b>PySceneDetect · Planned</b><span>Scene detection needs a future browser-compatible integration or hosted compute.</span></article><article class="tile"><b>Auto-Editor · Planned</b><span>Automatic silence removal is not enabled in this browser build.</span></article><article class="tile"><b>WhisperX · Planned</b><span>Speech transcription needs a separate model/runtime and more resources.</span></article><article class="tile"><b>Remotion · Planned</b><span>Branded rendering is not enabled in this browser build.</span></article><article class="tile"><b>Privacy</b><span>Selected media is processed locally and is not uploaded by this tool.</span></article></div><p class="muted small">FFmpeg WebAssembly is downloaded from jsDelivr the first time you use the tool. Processing speed and supported formats depend on your device and browser. Keep this page open until conversion finishes.</p></section>
<section class="view" id="view-security"><div class="eyebrow">PROTECTION / REVIEW</div><h1>Security <em>Center</em></h1><div class="toolgrid"><article class="tile"><b>Secure coding</b><span>Safer patterns and defensive design</span></article><article class="tile"><b>Input validation</b><span>Validate and normalize untrusted input</span></article><article class="tile"><b>Permissions</b><span>Review roles and access boundaries</span></article><article class="tile"><b>Dependencies</b><span>Audit package versions and known risks</span></article><article class="tile"><b>Privacy</b><span>Minimize sensitive data exposure</span></article><article class="tile"><b>Authorized testing</b><span>Test only systems you own or may assess</span></article></div><div class="panel"><label>PASTE CODE / SECURITY QUESTION<textarea id="securityPrompt" placeholder="Paste code for a secure coding review..."></textarea></label><div class="actions"><button class="primary" id="securityRun" type="button">START SECURITY REVIEW ↗</button><span class="hint">Ctrl + Enter to run</span></div><div id="securityResult" class="result hidden" role="status" aria-live="polite"></div></div></section>
<section class="view" id="view-notes"><div class="eyebrow">WORKSPACE / SAVED NOTES</div><h1>Project <em>Notes</em></h1><div class="panel"><label>NOTE TITLE<input id="noteTitle" maxlength="160" placeholder="e.g. 285 Garage vehicle catalog"></label><label>NOTE<textarea id="noteBody" placeholder="Save implementation notes, TODOs, or project context. Do not store passwords or API keys here."></textarea></label><div class="actions"><button class="primary" id="saveNote" type="button">SAVE NOTE</button><span id="noteStatus" class="hint" role="status" aria-live="polite"></span></div></div><div id="notesList" class="notes">${notesHtml}</div><p id="notesEmpty" class="muted empty${notes.length ? ' hidden' : ''}">No notes yet. Saved notes show up here.</p></section>
<section class="view" id="view-about"><div class="eyebrow">SYSTEM / INFORMATION</div><h1>About <em>Ja1lbreåk</em></h1><div class="panel"><h2>H.OL.L.Y.W.O.O.D. Ja1lbreåk</h2><p class="muted">A 285 Garage developer command center for code generation, debugging, architecture, documentation, and responsible security review. It is a development workspace, not a device or console jailbreak tool.</p><p>Version ${VERSION} · Cloudflare Workers / D1</p><p class="muted">AI output is advisory. Review, test, and back up code before production deployment.</p><p class="muted small">Built by Isaiah Daniels for 285 Garage and Tha A 285 RP.</p></div><div class="panel"><h2>Legal</h2><p class="muted">Grand Theft Auto, FiveM, and other third-party names belong to their owners. 285 Garage is not affiliated with or endorsed by them.</p>${legalLinks}</div></section>
</main></div><footer class="site-foot">${legalLinks}<span>H.OL.L.Y.W.O.O.D. JA1LBREÅK · 285 GARAGE // DEV SYSTEM</span>${copyright()}</footer></div>
<div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
<script src="/assets/app.js" defer></script></body></html>`;
}
