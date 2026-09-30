const sectionSelect=document.getElementById("sectionSelect");
const languageMode=document.getElementById("languageMode");
const search=document.getElementById("search");
const content=document.getElementById("content");
const loading=document.getElementById("loading");
const noResults=document.getElementById("noResults");
const sectionHeader=document.getElementById("sectionHeader");
const sectionTitle=document.getElementById("sectionTitle");
const sectionDescription=document.getElementById("sectionDescription");
const sectionCount=document.getElementById("sectionCount");
const officialLink=document.getElementById("officialLink");
const prevSection=document.getElementById("prevSection");
const nextSection=document.getElementById("nextSection");

let dataset={sections:[]};
let activeIndex=0;

function normaliseText(html){
  const tmp=document.createElement("div");
  tmp.innerHTML=html||"";
  return (tmp.textContent||"").toLowerCase();
}

function renderSection(){
  if(!dataset.sections.length) return;
  const section=dataset.sections[activeIndex];
  sectionSelect.value=String(activeIndex);
  sectionCount.textContent=`Section ${activeIndex+1} of ${dataset.sections.length}`;
  sectionTitle.textContent=section.title;
  sectionDescription.textContent=section.description||"";
  sectionDescription.hidden=!section.description;
  officialLink.href=section.source_url;
  sectionHeader.hidden=false;
  prevSection.disabled=activeIndex===0;
  nextSection.disabled=activeIndex===dataset.sections.length-1;

  const q=search.value.trim().toLowerCase();
  const mode=languageMode.value;
  let shown=0;

  content.innerHTML=(section.blocks||[]).map((block,i)=>{
    const searchText=(block.search_text||normaliseText(block.english_html)+" "+normaliseText(block.ukrainian_html)).toLowerCase();
    if(q && !searchText.includes(q)) return "";
    shown++;
    const english=mode==="ukrainian"?"":`
      <div class="english-wrap">
        <p class="language-label">🇬🇧 English</p>
        <div class="source-html">${block.english_html||""}</div>
      </div>`;
    const ukrainian=mode==="english"?"":`
      <div class="ukrainian-wrap">
        <p class="language-label">🇺🇦 Українською</p>
        <div class="translation-html">${block.ukrainian_html||""}</div>
      </div>`;
    return `<article class="content-block" data-block="${i}">${english}${ukrainian}</article>`;
  }).join("");

  noResults.hidden=shown!==0;
  window.scrollTo({top:0,behavior:"smooth"});
  localStorage.setItem("sectionIndex",String(activeIndex));
  localStorage.setItem("languageMode",mode);
}

function populateSections(){
  sectionSelect.innerHTML=dataset.sections.map((s,i)=>`<option value="${i}">${i+1}. ${s.title}</option>`).join("");
  const saved=Number(localStorage.getItem("sectionIndex"));
  if(Number.isInteger(saved)&&saved>=0&&saved<dataset.sections.length) activeIndex=saved;
  renderSection();
}

async function loadData(){
  try{
    const response=await fetch("./data/sections.json",{cache:"no-cache"});
    if(!response.ok) throw new Error("Could not load sections");
    dataset=await response.json();
    loading.hidden=true;
    populateSections();
  }catch(err){
    console.error(err);
    loading.textContent="The full Highway Code content is still being built. Refresh in a few minutes.";
  }
}

const savedMode=localStorage.getItem("languageMode");
if(savedMode) languageMode.value=savedMode;

sectionSelect.addEventListener("change",()=>{activeIndex=Number(sectionSelect.value);search.value="";renderSection()});
languageMode.addEventListener("change",renderSection);
search.addEventListener("input",renderSection);
prevSection.addEventListener("click",()=>{if(activeIndex>0){activeIndex--;search.value="";renderSection()}});
nextSection.addEventListener("click",()=>{if(activeIndex<dataset.sections.length-1){activeIndex++;search.value="";renderSection()}});

loadData();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}