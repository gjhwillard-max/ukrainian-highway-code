const selector=document.getElementById("languageMode");
const search=document.getElementById("search");
const cards=[...document.querySelectorAll(".rule-card")];
const noResults=document.getElementById("noResults");

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
    const haystack=(card.innerText+" "+(card.dataset.search||"")).toLowerCase();
    const show=!q||haystack.includes(q);
    card.hidden=!show;
    if(show) visible++;
  });
  noResults.hidden=visible!==0;
}
const saved=localStorage.getItem("languageMode");
if(saved) selector.value=saved;
selector.addEventListener("change",applyLanguage);
search.addEventListener("input",applySearch);
applyLanguage();
applySearch();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}