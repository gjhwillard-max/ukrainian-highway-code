const selector=document.getElementById("languageMode");
const search=document.getElementById("search");
const rulesEl=document.getElementById("rules");
const loading=document.getElementById("loading");
const noResults=document.getElementById("noResults");
let cards=[];

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]));
}

function renderRules(rules){
  rulesEl.innerHTML=rules.map(rule=>`
    <article class="rule-card" data-search="${escapeHtml([
      rule.rule,
      rule.title||"",
      rule.english||"",
      rule.ukrainian||"",
      ...(rule.keywords||[])
    ].join(" ").toLowerCase())}">
      <div class="rule-number">${escapeHtml(rule.rule)}</div>
      ${rule.title?`<h2 class="rule-title">${escapeHtml(rule.title)}</h2>`:""}
      <div class="english language-block">
        <h3>🇬🇧 English</h3>
        <p>${escapeHtml(rule.english)}</p>
      </div>
      <div class="ukrainian language-block">
        <h3>🇺🇦 Українською</h3>
        <p>${escapeHtml(rule.ukrainian)}</p>
      </div>
    </article>
  `).join("");
  cards=[...document.querySelectorAll(".rule-card")];
  loading.hidden=true;
  applyLanguage();
  applySearch();
}

function applyLanguage(){
  const mode=selector.value;
  document.querySelectorAll(".english").forEach(el=>el.hidden=mode==="ukrainian");
  document.querySelectorAll(".ukrainian").forEach(el=>el.hidden=mode==="english");
  localStorage.setItem("languageMode",mode);
}

function applySearch(){
  const q=search.value.trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
    const show=!q||(card.dataset.search||"").includes(q);
    card.hidden=!show;
    if(show) visible++;
  });
  noResults.hidden=visible!==0||cards.length===0;
}

async function loadRules(){
  try{
    const response=await fetch("./data/rules.json",{cache:"no-cache"});
    if(!response.ok) throw new Error("Could not load rules");
    const data=await response.json();
    renderRules(data.rules||[]);
  }catch(error){
    loading.textContent="Could not load the study content. Please refresh while online.";
    console.error(error);
  }
}

const saved=localStorage.getItem("languageMode");
if(saved) selector.value=saved;
selector.addEventListener("change",applyLanguage);
search.addEventListener("input",applySearch);
loadRules();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}