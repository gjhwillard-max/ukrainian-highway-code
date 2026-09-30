const homeView=document.getElementById("homeView");
const readerView=document.getElementById("readerView");
const sectionGrid=document.getElementById("sectionGrid");
const homeLoading=document.getElementById("homeLoading");
const languageMode=document.getElementById("languageMode");
const search=document.getElementById("search");
const content=document.getElementById("content");
const loading=document.getElementById("loading");
const noResults=document.getElementById("noResults");
const sectionHeader=document.getElementById("sectionHeader");
const sectionTitle=document.getElementById("sectionTitle");
const sectionTitleUk=document.getElementById("sectionTitleUk");
const sectionDescription=document.getElementById("sectionDescription");
const sectionCount=document.getElementById("sectionCount");
const officialLink=document.getElementById("officialLink");
const prevSection=document.getElementById("prevSection");
const nextSection=document.getElementById("nextSection");
const backToSections=document.getElementById("backToSections");

let dataset={sections:[]};
let activeIndex=0;

const ukTitles={
  "introduction":"Вступ",
  "rules-for-pedestrians-1-to-35":"Правила для пішоходів (1–35)",
  "rules-for-users-of-powered-wheelchairs-and-mobility-scooters-36-to-46":"Правила для користувачів електричних інвалідних візків і мобільних скутерів (36–46)",
  "rules-about-animals-47-to-58":"Правила щодо тварин (47–58)",
  "rules-for-cyclists-59-to-82":"Правила для велосипедистів (59–82)",
  "rules-for-motorcyclists-83-to-88":"Правила для мотоциклістів (83–88)",
  "rules-for-drivers-and-motorcyclists-89-to-102":"Правила для водіїв і мотоциклістів (89–102)",
  "general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158":"Загальні правила, техніка та поради для всіх водіїв і кермувальників (103–158)",
  "using-the-road-159-to-203":"Користування дорогою (159–203)",
  "road-users-requiring-extra-care-204-to-225":"Учасники дорожнього руху, які потребують особливої уваги (204–225)",
  "driving-in-adverse-weather-conditions-226-to-237":"Керування в несприятливих погодних умовах (226–237)",
  "waiting-and-parking-238-to-252":"Зупинка та паркування (238–252)",
  "motorways-253-to-273":"Автомагістралі",
  "breakdowns-and-incidents-274-to-287":"Поломки та дорожні інциденти",
  "road-works-level-crossings-and-tramways-288-to-307":"Дорожні роботи, залізничні переїзди та трамвайні колії",
  "light-signals-controlling-traffic":"Світлові сигнали регулювання дорожнього руху",
  "signals-to-other-road-users":"Сигнали іншим учасникам дорожнього руху",
  "signals-by-authorised-persons":"Сигнали уповноважених осіб",
  "traffic-signs":"Дорожні знаки",
  "road-markings":"Дорожня розмітка",
  "vehicle-markings":"Маркування транспортних засобів",
  "annex-1-you-and-your-bicycle":"Додаток 1. Ви та ваш велосипед",
  "annex-2-motorcycle-licence-requirements":"Додаток 2. Вимоги до водійського посвідчення для мотоцикла",
  "annex-3-motor-vehicle-documentation-and-learner-driver-requirements":"Додаток 3. Документи на транспортний засіб і вимоги до учнів-водіїв",
  "annex-4-the-road-user-and-the-law":"Додаток 4. Учасник дорожнього руху та закон",
  "annex-5-penalties":"Додаток 5. Штрафи та покарання",
  "annex-6-vehicle-maintenance-safety-and-security":"Додаток 6. Технічне обслуговування, безпека та захист транспортного засобу",
  "annex-7-first-aid-on-the-road":"Додаток 7. Перша допомога на дорозі",
  "annex-8-safety-code-for-new-drivers":"Додаток 8. Кодекс безпеки для нових водіїв",
  "other-information":"Інша інформація"
};

function titleUk(section){
  return ukTitles[section.slug]||"";
}

function normaliseText(html){
  const tmp=document.createElement("div");
  tmp.innerHTML=html||"";
  return (tmp.textContent||"").toLowerCase();
}

function renderHome(){
  homeView.hidden=false;
  readerView.hidden=true;
  sectionGrid.innerHTML=dataset.sections.map((section,i)=>`
    <button class="section-card" type="button" data-index="${i}" aria-label="${section.title}">
      <span class="section-number">${i+1}</span>
      <p class="section-card-en">🇬🇧 ${section.title}</p>
      <p class="section-card-uk">🇺🇦 ${titleUk(section)}</p>
    </button>
  `).join("");

  sectionGrid.querySelectorAll(".section-card").forEach(card=>{
    card.addEventListener("click",()=>{
      const index=Number(card.dataset.index);
      const slug=dataset.sections[index].slug;
      location.hash=encodeURIComponent(slug);
    });
  });

  window.scrollTo({top:0,behavior:"smooth"});
}

function renderSection(){
  if(!dataset.sections.length) return;
  const section=dataset.sections[activeIndex];
  homeView.hidden=true;
  readerView.hidden=false;

  sectionCount.textContent=`Section ${activeIndex+1} of ${dataset.sections.length}`;
  sectionTitle.textContent=section.title;
  sectionTitleUk.textContent=titleUk(section);
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
  loading.hidden=true;
  localStorage.setItem("sectionIndex",String(activeIndex));
  localStorage.setItem("languageMode",mode);
}

function routeFromHash(){
  if(!dataset.sections.length) return;
  const slug=decodeURIComponent(location.hash.replace(/^#/,""));
  if(!slug){
    renderHome();
    return;
  }
  const index=dataset.sections.findIndex(s=>s.slug===slug);
  if(index===-1){
    history.replaceState(null,"",location.pathname+location.search);
    renderHome();
    return;
  }
  activeIndex=index;
  search.value="";
  renderSection();
  window.scrollTo({top:0,behavior:"smooth"});
}

async function loadData(){
  try{
    const response=await fetch("./data/sections.json",{cache:"no-cache"});
    if(!response.ok) throw new Error("Could not load sections");
    dataset=await response.json();
    homeLoading.hidden=true;
    loading.hidden=true;
    routeFromHash();
  }catch(err){
    console.error(err);
    homeLoading.textContent="Could not load the Highway Code sections. Please refresh while online.";
    loading.textContent="Could not load the Highway Code content. Please refresh while online.";
  }
}

const savedMode=localStorage.getItem("languageMode");
if(savedMode) languageMode.value=savedMode;

languageMode.addEventListener("change",renderSection);
search.addEventListener("input",renderSection);
backToSections.addEventListener("click",()=>{location.hash=""});
prevSection.addEventListener("click",()=>{
  if(activeIndex>0){
    const slug=dataset.sections[activeIndex-1].slug;
    location.hash=encodeURIComponent(slug);
  }
});
nextSection.addEventListener("click",()=>{
  if(activeIndex<dataset.sections.length-1){
    const slug=dataset.sections[activeIndex+1].slug;
    location.hash=encodeURIComponent(slug);
  }
});
window.addEventListener("hashchange",routeFromHash);

loadData();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}