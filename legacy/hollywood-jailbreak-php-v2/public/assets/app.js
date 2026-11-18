const commands=[
 ['/help','Show available commands and how to use the workspace.'],
 ['/menu','Open the command center navigation.'],
 ['/code','Generate code for a described feature or task.'],
 ['/debug','Analyze an error, stack trace, or unexpected behavior.'],
 ['/explain','Explain code, configuration, or architecture.'],
 ['/optimize','Improve performance, maintainability, or resource use.'],
 ['/review','Review code quality, reliability, and edge cases.'],
 ['/build','Plan and implement a feature step by step.'],
 ['/status','Summarize the current project state from supplied context.'],
 ['/reset','Clear the current input fields and selections.']
];
const tools=[['Code Generator','Create a complete implementation from requirements.'],['Bug Analyzer','Find likely causes and propose tested fixes.'],['UI Architect','Design responsive UI structure and components.'],['File Planner','Plan folders, files, and integration points.'],['Performance Analyzer','Identify bottlenecks and optimization opportunities.'],['Documentation Writer','Write setup guides, API docs, and comments.']];
const $=s=>document.querySelector(s);
function showView(name){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+name));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view===name));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto)));
function renderCommands(filter=''){const root=$('#commandList');root.innerHTML='';commands.filter(([c,d])=>(c+' '+d).toLowerCase().includes(filter.toLowerCase())).forEach(([c,d])=>{const row=document.createElement('article');row.className='command';const info=document.createElement('div');const name=document.createElement('b');name.textContent=c;const desc=document.createElement('span');desc.textContent=d;info.append(name,desc);const btn=document.createElement('button');btn.className='copy';btn.textContent='COPY';btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(c);btn.textContent='COPIED';setTimeout(()=>btn.textContent='COPY',1200);}catch{btn.textContent='SELECT';}});row.append(info,btn);root.append(row);});}
renderCommands();$('#commandSearch').addEventListener('input',e=>renderCommands(e.target.value));
function renderTools(){const root=$('#toolGrid');tools.forEach(([name,desc])=>{const b=document.createElement('button');b.className='tile';const title=document.createElement('b');title.textContent=name;const span=document.createElement('span');span.textContent=desc;b.append(title,span);b.addEventListener('click',()=>{$('#toolPrompt').value='Please act as my '+name+'. '+desc+'\n\n';$('#toolPrompt').focus();});root.append(b);});}
renderTools();
async function requestAssistant(prompt,mode,target){const out=$(target);out.classList.remove('hidden');out.textContent='PROCESSING REQUEST...';try{const res=await fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':window.HJ_CONFIG.csrf},body:JSON.stringify({action:'assistant',prompt,mode})});const data=await res.json();out.textContent=data.answer||data.error||'No response received.';}catch(err){out.textContent='Request failed. Check the server connection and try again.';}}
$('#quickRun').addEventListener('click',()=>requestAssistant($('#quickPrompt').value,'general','#quickResult'));
$('#labRun').addEventListener('click',()=>requestAssistant('Technology: '+$('#language').value+'\n\n'+$('#labPrompt').value,'code','#labResult'));
$('#toolRun').addEventListener('click',()=>requestAssistant($('#toolPrompt').value,'developer-tool','#toolResult'));
$('#securityRun').addEventListener('click',()=>requestAssistant('Perform a secure coding review. Only assess authorized code.\n\n'+$('#securityPrompt').value,'security-review','#securityResult'));
$('#saveNote').addEventListener('click',async()=>{const status=$('#noteStatus');status.textContent='Saving...';try{const r=await fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':window.HJ_CONFIG.csrf},body:JSON.stringify({action:'save_note',title:$('#noteTitle').value,body:$('#noteBody').value})});const d=await r.json();if(!r.ok)throw new Error(d.error);status.textContent='Saved. Refresh the page to see the updated note list.';$('#noteTitle').value='';$('#noteBody').value='';}catch(e){status.textContent=e.message||'Could not save note.';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.activeElement.blur();}});

if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});}
