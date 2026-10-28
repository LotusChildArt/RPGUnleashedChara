(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"");
const addLanguage=()=>document.getElementById("add-language");
const languages=typeof RPG_CREATOR_LANGUAGES!=="undefined"?RPG_CREATOR_LANGUAGES:[];
let catalog=null;
const panel=document.createElement("div");panel.id="rpg-language-picker";panel.style.cssText="display:none;position:fixed;inset:0;z-index:100025;background:#000a;overflow:auto;padding:6vh 12px";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");document.body.append(panel);
function close(){panel.style.display="none";panel.replaceChildren();}
function addToSheet(name){
 const list=$("#languages-list");if(!list)return;
 const row=[...list.querySelectorAll(".background-entry-row")].find(r=>!r.querySelector('input[placeholder="Language"]')?.value.trim());
 if(!row){window.RPGLanguageBypass=true;try{addLanguage()?.click()}finally{window.RPGLanguageBypass=false}}
 const item=row||list.querySelector(".background-entry-row:last-child");
 const input=item?.querySelector('input[placeholder="Language"]');
 if(input){input.value=name;input.dispatchEvent(new Event("input",{bubbles:true}))}
}
function showLanguages(){
 panel.style.display="block";
 const card=document.createElement("section");card.className="rpg-reference-panel";
 const title=document.createElement("h2");title.textContent="Choose a Language";
 const closeBtn=document.createElement("button");closeBtn.textContent="Close";closeBtn.onclick=close;
 const search=document.createElement("input");search.type="search";search.placeholder="Search languages";search.setAttribute("aria-label","Search languages");
 const results=document.createElement("div");results.className="rpg-reference-results";
 const other=document.createElement("button");other.textContent="+ Other / Custom Language";other.onclick=()=>{const name=window.prompt("Enter language name");if(name?.trim()){close();addToSheet(name.trim())}};
 function render(){results.replaceChildren();for(const lang of languages.filter(l=>l.toLowerCase().includes(search.value.toLowerCase()))){const b=document.createElement("button");b.textContent=lang;b.onclick=()=>{close();addToSheet(lang)};results.append(b)}}
 search.oninput=render;card.append(title,closeBtn,search,results,other);panel.append(card);render();search.focus();
}
document.addEventListener("click",e=>{if(e.target.closest?.("#add-language")&&!window.RPGLanguageBypass){e.preventDefault();e.stopImmediatePropagation();showLanguages()}},true);
panel.addEventListener("click",e=>{if(e.target===panel)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.style.display!=="none")close()});
// Handbook: keep Conditions intact and show separate browsable reference views.
const bar=$("#handbook-screen .handbook-tab-bar");
const conditions=$("#handbook-screen .handbook-page");
if(!bar||!conditions)return;
const ref=document.createElement("section");ref.id="rpg-handbook-reference";ref.className="handbook-page";ref.hidden=true;conditions.after(ref);
const tabs=[...bar.querySelectorAll(".handbook-tab-button")];
const conditionButton=tabs[0];
if(conditionButton){conditionButton.dataset.reference="Conditions"}
for(const label of ["Languages","Feats","Gear"]){const b=document.createElement("button");b.type="button";b.className="handbook-tab-button";b.dataset.reference=label;b.textContent=label;bar.append(b)}
const cache={};
async function getData(kind){
 if(cache[kind])return cache[kind];
 const url=kind==="Feats"?"/data/feats-one-v1.json":"/data/gear-v3.json";
 const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);
 const data=await response.json();
 cache[kind]=kind==="Feats"?(data.feats||[]):(data.items||[]);return cache[kind];
}
function showReference(kind){
 const isConditions=kind==="Conditions";
 conditions.hidden=!isConditions;ref.hidden=isConditions;
 for(const b of bar.querySelectorAll(".handbook-tab-button"))b.classList.toggle("active",b.dataset.reference===kind);
 if(isConditions)return;
 ref.replaceChildren();
 const h=document.createElement("h2");h.textContent=kind;ref.append(h);
 const input=document.createElement("input");input.type="search";input.placeholder="Search "+kind.toLowerCase();input.setAttribute("aria-label","Search "+kind);
 const category=document.createElement("select");
 category.setAttribute("aria-label","Filter "+kind+" by section");
 category.style.cssText="width:100%;padding:10px;margin:8px 0;border-radius:8px";
 const results=document.createElement("div");results.className="rpg-reference-results";
 ref.append(input,category,results);
 category.hidden=kind==="Languages";
 if(kind==="Languages"){const render=()=>{results.replaceChildren();for(const l of languages.filter(l=>l.toLowerCase().includes(input.value.toLowerCase()))){const el=document.createElement("div");el.className="rpg-reference-entry";el.textContent=l;results.append(el)}};input.oninput=render;render();return}
 results.textContent="Loading…";
 getData(kind).then(items=>{if(ref.hidden||h.textContent!==kind)return;
 const sections=[...new Set(items.map(i=>i.category||"Uncategorized"))];
 category.replaceChildren();
 for(const name of ["All sections",...sections]){
   const option=document.createElement("option");option.value=name==="All sections"?"":name;option.textContent=name;category.append(option);
 }
 const render=()=>{results.replaceChildren();const search=input.value.toLowerCase();const section=category.value;for(const item of items.filter(i=>(!section||(i.category||"Uncategorized")===section)&&(i.name+" "+(i.description||"")+" "+(i.category||"")).toLowerCase().includes(search))){const el=document.createElement("article");el.className="rpg-reference-entry";const heading=document.createElement("h3");heading.textContent=item.name;const cat=document.createElement("small");cat.textContent=item.category||"";const desc=document.createElement("p");desc.textContent=item.description||"";el.append(heading,cat,desc);if(kind==="Gear"){const raw=document.createElement("pre");raw.textContent=item.sourceText||"";el.append(raw)}else{if(item.requirement){const r=document.createElement("p");r.textContent="Requirements: "+item.requirement;el.append(r)}if(item.rankBenefit){const rank=document.createElement("p");rank.textContent="Rank up: "+item.rankBenefit;el.append(rank)}}results.append(el)}};input.oninput=render;category.onchange=render;render()
 }).catch(e=>results.textContent="Could not load "+kind+": "+e.message);
}
bar.addEventListener("click",e=>{const b=e.target.closest?.("[data-reference]");if(b)showReference(b.dataset.reference)});
})();