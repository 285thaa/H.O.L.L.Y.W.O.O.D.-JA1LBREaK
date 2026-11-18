window.HJ_CONFIG = { csrf: document.body.dataset.csrf || '', aiEnabled: document.body.dataset.ai === '1' };

const commands = [
  ['/help', 'Show available commands and how to use the workspace.'],
  ['/menu', 'Open the command center navigation.'],
  ['/code', 'Generate code for a described feature or task.'],
  ['/debug', 'Analyze an error, stack trace, or unexpected behavior.'],
  ['/explain', 'Explain code, configuration, or architecture.'],
  ['/optimize', 'Improve performance, maintainability, or resource use.'],
  ['/review', 'Review code quality, reliability, and edge cases.'],
  ['/build', 'Plan and implement a feature step by step.'],
  ['/status', 'Summarize the current project state from supplied context.'],
  ['/reset', 'Clear the current input fields and selections.'],
];
const tools = [
  ['Code Generator', 'Create a complete implementation from requirements.'],
  ['Bug Analyzer', 'Find likely causes and propose tested fixes.'],
  ['UI Architect', 'Design responsive UI structure and components.'],
  ['File Planner', 'Plan folders, files, and integration points.'],
  ['Performance Analyzer', 'Identify bottlenecks and optimization opportunities.'],
  ['Documentation Writer', 'Write setup guides, API docs, and comments.'],
];

const $ = (s) => document.querySelector(s);
const VIEWS = ['dashboard', 'commands', 'lab', 'tools', 'media', 'security', 'notes', 'about'];

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
}
async function copyText(text, okMsg = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return true; }
  catch { toast('Copy blocked: select the text and copy manually'); return false; }
}

/* ---------- navigation (supports #notes style links and the back button) ---------- */
function showView(name, { updateHash = true } = {}) {
  if (!VIEWS.includes(name)) name = 'dashboard';
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('active', x.id === 'view-' + name));
  document.querySelectorAll('.nav').forEach((x) => {
    const on = x.dataset.view === name;
    x.classList.toggle('active', on);
    if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
  });
  if (updateHash) history.replaceState(null, '', name === 'dashboard' ? location.pathname : '#' + name);
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.nav').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.goto)));
window.addEventListener('hashchange', () => showView(location.hash.slice(1), { updateHash: false }));
if (location.hash) showView(location.hash.slice(1), { updateHash: false });

/* ---------- command directory ---------- */
function renderCommands(filter = '') {
  const root = $('#commandList');
  root.innerHTML = '';
  const q = filter.trim().toLowerCase();
  const rows = commands.filter(([c, d]) => (c + ' ' + d).toLowerCase().includes(q));
  if (!rows.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'No commands match that search.';
    root.append(p);
    return;
  }
  rows.forEach(([c, d]) => {
    const row = document.createElement('article');
    row.className = 'command';
    const info = document.createElement('div');
    const name = document.createElement('b'); name.textContent = c;
    const desc = document.createElement('span'); desc.textContent = d;
    info.append(name, desc);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'copy'; btn.textContent = 'COPY';
    btn.setAttribute('aria-label', 'Copy command ' + c);
    btn.addEventListener('click', async () => {
      if (await copyText(c, 'Copied ' + c)) { btn.textContent = 'COPIED'; setTimeout(() => (btn.textContent = 'COPY'), 1200); }
    });
    row.append(info, btn);
    root.append(row);
  });
}
renderCommands();
$('#commandSearch').addEventListener('input', (e) => renderCommands(e.target.value));

/* ---------- developer tools ---------- */
(function renderTools() {
  const root = $('#toolGrid');
  tools.forEach(([name, desc]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tile';
    const title = document.createElement('b'); title.textContent = name;
    const span = document.createElement('span'); span.textContent = desc;
    b.append(title, span);
    b.addEventListener('click', () => {
      $('#toolPrompt').value = 'Please act as my ' + name + '. ' + desc + '\n\n';
      $('#toolPrompt').focus();
    });
    root.append(b);
  });
})();

/* ---------- assistant requests ---------- */
async function post(payload) {
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.HJ_CONFIG.csrf },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new Error(data.error || 'Request failed (HTTP ' + res.status + ').');
  return data;
}

async function requestAssistant(prompt, mode, target, button) {
  const out = $(target);
  out.classList.remove('hidden', 'err');
  out.classList.add('busy');
  out.textContent = 'Processing request...';
  if (!String(prompt).replace(/Technology:[^\n]*|Perform a secure coding review\. Only assess authorized code\./g, '').trim()) {
    out.classList.remove('busy'); out.classList.add('err');
    out.textContent = 'Enter a request first.';
    return;
  }
  button.disabled = true;
  try {
    const data = await post({ action: 'assistant', prompt, mode });
    out.classList.remove('busy');
    out.textContent = data.answer || 'No response received.';
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'copy rcopy'; c.textContent = 'COPY RESULT';
    c.addEventListener('click', () => copyText(data.answer || '', 'Result copied'));
    out.prepend(c);
  } catch (err) {
    out.classList.remove('busy'); out.classList.add('err');
    out.textContent = err.message || 'Request failed. Check the server connection and try again.';
  } finally {
    button.disabled = false;
  }
}

const runners = {
  quickRun: () => requestAssistant($('#quickPrompt').value, 'general', '#quickResult', $('#quickRun')),
  labRun: () => requestAssistant('Technology: ' + $('#language').value + '\n\n' + $('#labPrompt').value, 'code', '#labResult', $('#labRun')),
  toolRun: () => requestAssistant($('#toolPrompt').value, 'developer-tool', '#toolResult', $('#toolRun')),
  securityRun: () => requestAssistant('Perform a secure coding review. Only assess authorized code.\n\n' + $('#securityPrompt').value, 'security-review', '#securityResult', $('#securityRun')),
};
Object.entries(runners).forEach(([id, fn]) => $('#' + id).addEventListener('click', fn));
[['quickPrompt', 'quickRun'], ['labPrompt', 'labRun'], ['toolPrompt', 'toolRun'], ['securityPrompt', 'securityRun']].forEach(([field, btn]) => {
  $('#' + field).addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runners[btn](); }
  });
});

/* ---------- notes ---------- */
function syncEmpty() {
  $('#notesEmpty').classList.toggle('hidden', $('#notesList').children.length > 0);
}
function buildNote(id, title, body, when) {
  const art = document.createElement('article');
  art.className = 'note'; art.dataset.id = String(id);
  const head = document.createElement('div'); head.className = 'note-head';
  const nb = document.createElement('b'); nb.textContent = title;
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'note-del'; del.textContent = 'DELETE';
  del.setAttribute('aria-label', 'Delete note ' + title);
  head.append(nb, del);
  const np = document.createElement('p'); np.textContent = body;
  const ns = document.createElement('small'); ns.textContent = when;
  art.append(head, np, ns);
  return art;
}
$('#saveNote').addEventListener('click', async () => {
  const status = $('#noteStatus');
  const btn = $('#saveNote');
  const title = $('#noteTitle').value.trim();
  const body = $('#noteBody').value;
  if (!title) { status.textContent = 'Add a title first.'; $('#noteTitle').focus(); return; }
  btn.disabled = true; status.textContent = 'Saving...';
  try {
    const d = await post({ action: 'save_note', title, body });
    status.textContent = 'Saved.';
    $('#notesList').prepend(buildNote(d.id, title, body, 'just now'));
    $('#noteTitle').value = ''; $('#noteBody').value = '';
    syncEmpty();
  } catch (e) {
    status.textContent = e.message || 'Could not save note.';
  } finally {
    btn.disabled = false;
  }
});
$('#notesList').addEventListener('click', async (e) => {
  const btn = e.target.closest('.note-del');
  if (!btn) return;
  const note = btn.closest('.note');
  if (!confirm('Delete this note? This cannot be undone.')) return;
  btn.disabled = true;
  try {
    await post({ action: 'delete_note', id: Number(note.dataset.id) });
    note.remove(); syncEmpty(); toast('Note deleted');
  } catch (err) {
    btn.disabled = false; toast(err.message || 'Could not delete note');
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.activeElement.blur(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}


/* ---------- Media Studio: browser-based FFmpeg (no media server required) ---------- */
let browserFFmpeg = null;
let ffmpegLoadPromise = null;
let mediaOutputUrl = null;
const FFMPEG_VERSION = '0.12.10';
const FFMPEG_CDN = 'https://cdn.jsdelivr.net';
const mediaStatus = (message) => { $('#mediaStatus').textContent = message; };

async function loadFFmpegLibrary() {
  if (window.FFmpegWASM) return window.FFmpegWASM;
  if (!window.__hjFFmpegScriptPromise) {
    window.__hjFFmpegScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = FFMPEG_CDN + '/npm/@ffmpeg/ffmpeg@' + FFMPEG_VERSION + '/dist/umd/ffmpeg.js';
      script.async = true;
      script.onload = () => window.FFmpegWASM ? resolve(window.FFmpegWASM) : reject(new Error('FFmpeg library API was not found.'));
      script.onerror = () => reject(new Error('Could not download FFmpeg. Check your connection and try again.'));
      document.head.append(script);
    });
  }
  return window.__hjFFmpegScriptPromise;
}

async function fetchFFmpegBlob(url, type) {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error('Could not load an FFmpeg component (' + response.status + ').');
  return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type }));
}

async function getBrowserFFmpeg() {
  if (browserFFmpeg) return browserFFmpeg;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;
  ffmpegLoadPromise = (async () => {
    mediaStatus('Loading FFmpeg WebAssembly (~32 MB) for first use…');
    const api = await loadFFmpegLibrary();
    const ffmpeg = new api.FFmpeg();
    const base = FFMPEG_CDN + '/npm/@ffmpeg/core@' + FFMPEG_VERSION + '/dist/umd/';
    const [coreURL, wasmURL, classWorkerURL] = await Promise.all([
      fetchFFmpegBlob(base + 'ffmpeg-core.js', 'text/javascript'),
      fetchFFmpegBlob(base + 'ffmpeg-core.wasm', 'application/wasm'),
      fetchFFmpegBlob(FFMPEG_CDN + '/npm/@ffmpeg/ffmpeg@' + FFMPEG_VERSION + '/dist/umd/814.ffmpeg.js', 'text/javascript')
    ]);
    ffmpeg.on('log', ({ message }) => { if (message) mediaStatus(message.slice(-220)); });
    ffmpeg.on('progress', ({ progress }) => {
      if (Number.isFinite(progress)) mediaStatus('Converting on this device… ' + Math.max(0, Math.min(100, Math.round(progress * 100))) + '%');
    });
    await ffmpeg.load({ coreURL, wasmURL, classWorkerURL });
    browserFFmpeg = ffmpeg;
    mediaStatus('FFmpeg is ready. Choose a media file to convert.');
    return ffmpeg;
  })();
  try { return await ffmpegLoadPromise; }
  catch (error) { ffmpegLoadPromise = null; throw error; }
}

$('#mediaRun').addEventListener('click', async () => {
  const file = $('#mediaFile').files[0];
  const button = $('#mediaRun');
  const download = $('#mediaDownload');
  const preview = $('#mediaPreview');
  const outputName = 'hollywood-jailbreak-converted.mp4';
  if (!file) { mediaStatus('Choose a video or audio file first.'); $('#mediaFile').focus(); return; }
  if (file.size > 250 * 1024 * 1024) { mediaStatus('Choose a file smaller than 250 MB. Smaller files work best on phones.'); return; }
  if (mediaOutputUrl) { URL.revokeObjectURL(mediaOutputUrl); mediaOutputUrl = null; }
  download.classList.add('hidden');
  preview.classList.add('hidden');
  button.disabled = true;
  let inputName = '';
  try {
    const ffmpeg = await getBrowserFFmpeg();
    inputName = 'input' + (file.name.match(/\.[a-z0-9]{1,8}$/i)?.[0] || '.media');
    mediaStatus('Reading source file into browser memory…');
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    mediaStatus('Converting to MP4 (H.264 video / AAC audio)…');
    const args = file.type.startsWith('audio/')
      ? ['-y', '-i', inputName, '-vn', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName]
      : ['-y', '-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName];
    const code = await ffmpeg.exec(args);
    if (code !== 0) throw new Error('FFmpeg could not convert this file. Try a different format or a smaller source.');
    const data = await ffmpeg.readFile(outputName);
    mediaOutputUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
    download.href = mediaOutputUrl;
    download.download = outputName;
    download.classList.remove('hidden');
    preview.src = mediaOutputUrl;
    preview.classList.remove('hidden');
    mediaStatus('Conversion complete. Download your MP4 below.');
    try { await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName); } catch { /* temporary in-memory files */ }
  } catch (error) {
    mediaStatus(error.message || 'Conversion failed. Try another file.');
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('beforeunload', () => {
  if (mediaOutputUrl) URL.revokeObjectURL(mediaOutputUrl);
});
