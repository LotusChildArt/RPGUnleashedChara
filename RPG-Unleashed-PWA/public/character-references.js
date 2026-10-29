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
for(const label of ["Languages","Skills","Feats","Gear"]){const b=document.createElement("button");b.type="button";b.className="handbook-tab-button";b.dataset.reference=label;b.textContent=label;bar.append(b)}
const cache={};
async function getData(kind){
 if(cache[kind])return cache[kind];
 const url=kind==="Feats"?"/data/feats-one-v1.json":kind==="Skills"?"/data/skills-one-v1.json":"/data/gear-v3.json";
 const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);
 const data=await response.json();
 cache[kind]=kind==="Feats"?(data.feats||[]):(data.items||[]);return cache[kind];
}

const COIN_PATTERN=/(\d+(?:\.\d+)?)\s*(Gold|Gld|GP|G|Silver|Slvr|SP|S|Copper|Cpr|CP|C)\b/gi;
function coinUnit(label){const x=label.toLowerCase();return["gold","gld","gp","g"].includes(x)?100:["silver","slvr","sp","s"].includes(x)?10:1}
function coinMatches(source){
 const matches=[];
 for(const match of String(source||"").matchAll(COIN_PATTERN)){
  // Dice expressions (for example 3d6 GP) are not liquidated currency.
  const prefix=source.slice(0,match.index);
  if(/(?:\d+d|\bd)\s*$/i.test(prefix))continue;
  const amount=Number(match[1])*coinUnit(match[2]);
  if(!Number.isSafeInteger(amount)||amount<0)continue;
  matches.push({start:match.index,end:match.index+match[0].length,copper:amount});
 }
 return matches;
}
function parseCoins(text){
 const source=String(text||"");
 const total=coinMatches(source).reduce((sum,match)=>sum+match.copper,0);
 return Number.isSafeInteger(total)?total:null;
}
function coinText(copper){const g=Math.floor(copper/100),silver=Math.floor(copper%100/10),c=copper%10;return[g&&g+" Gold",silver&&silver+" Silver",c&&c+" Copper"].filter(Boolean).join(", ")||"0 Copper"}
function itemCost(item){
 const m=String(item.sourceText||"").match(/\bCost:\s*([^|\n]+)/i);
 if(!m)return null;
 const cost=parseCoins(m[1]);
 return cost!==null&&coinMatches(m[1]).length?cost:null;
}
function spendCoinsPreservingOtherText(source,newAmount){
 const original=String(source||"");
 const matches=coinMatches(original);
 let rest=original;
 for(let i=matches.length-1;i>=0;i--)rest=rest.slice(0,matches[i].start)+rest.slice(matches[i].end);
 rest=rest.replace(/^[\s,;+\/]+|[\s,;+\/]+$/g,"").replace(/(?:\s*[,;+\/]\s*){2,}/g,", ").trim();
 return [coinText(newAmount),rest].filter(Boolean).join(rest?", ":"");
}
function addGearPurchaseButtons(card,item){
 const actions=document.createElement("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px";
 const take=document.createElement("button");take.type="button";take.textContent="Take";
 const buy=document.createElement("button");buy.type="button";
 const cost=itemCost(item);buy.textContent=cost===null?"Buy (price unavailable)":"Buy · "+coinText(cost);
 buy.disabled=cost===null;
 const info=document.createElement("small");info.setAttribute("role","status");info.style.cssText="display:block;margin-top:6px";
 const add=()=>{if(typeof window.RPGAddGearToSheet!=="function")return false;window.RPGAddGearToSheet(item.name,"inventory");return true};
 take.onclick=()=>{info.textContent=add()?"Added to inventory. Open your character sheet to view it.":"Could not add item to inventory."};
 buy.onclick=()=>{
  const field=document.querySelector("#tab3 .inventory-currency-row input");if(!field){info.textContent="Open a character sheet before purchasing.";return}
  const balance=parseCoins(field.value);if(balance===null){info.textContent="Currency amount could not be calculated.";return}
  if(balance<cost){info.textContent="Insufficient funds ("+coinText(balance)+" available).";return}
  if(!add()){info.textContent="Could not add item; no gold was deducted.";return}
  field.value=spendCoinsPreservingOtherText(field.value,balance-cost);field.dispatchEvent(new Event("input",{bubbles:true}));info.textContent="Purchased "+item.name+" for "+coinText(cost)+".";
 };
 actions.append(buy,take);card.append(actions,info);
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
 category.style.cssText="display:block;width:100%;min-height:44px;padding:10px;margin:8px 0;border:1px solid #888;border-radius:8px;background:var(--rpg-surface,#fff);color:var(--rpg-fg,#111)";
 category.innerHTML='<option value="">All sections</option>';
 const results=document.createElement("div");results.className="rpg-reference-results";
 ref.append(input,category,results);
 category.hidden=kind==="Languages";
 if(kind==="Languages"){results.textContent="Loading language descriptions…";fetch("/data/language-descriptions.json").then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(data=>{const descriptions=data.languages||{};const names=[...new Set([...languages,...Object.keys(descriptions)])];const render=()=>{results.replaceChildren();const q=input.value.toLowerCase();for(const l of names.filter(n=>(n+" "+(descriptions[n]?.speakers||"")+" "+(descriptions[n]?.description||"")).toLowerCase().includes(q))){const item=descriptions[l]||{};const el=document.createElement("article");el.className="rpg-reference-entry";const heading=document.createElement("h3");heading.textContent=l;const speakers=document.createElement("small");speakers.textContent=item.speakers?"Speakers: "+item.speakers:"";const desc=document.createElement("p");const full=String(item.description||"");desc.textContent=full.split(/\n/)[0].trim()||"No language-specific description available.";el.append(heading,speakers,desc);results.append(el)}};input.oninput=render;render()}).catch(e=>results.textContent="Could not load language descriptions: "+e.message);return}
 results.textContent="Loading…";
 getData(kind).then(items=>{if(ref.hidden||h.textContent!==kind)return;
 const sections=[...new Set(items.map(i=>i.category||"Uncategorized"))];
 category.replaceChildren();
 for(const name of ["All sections",...sections]){
   const option=document.createElement("option");option.value=name==="All sections"?"":name;option.textContent=name;category.append(option);
 }
 const render=()=>{results.replaceChildren();const search=input.value.toLowerCase();const section=category.value;for(const item of items.filter(i=>(!section||(i.category||"Uncategorized")===section)&&(i.name+" "+(i.description||"")+" "+(i.category||"")).toLowerCase().includes(search))){const el=document.createElement("article");el.className="rpg-reference-entry";const heading=document.createElement("h3");heading.textContent=item.name;const cat=document.createElement("small");cat.textContent=(item.category||"")+(item.attributes?" · "+item.attributes:"");const desc=document.createElement("p");desc.textContent=item.description||"";el.append(heading,cat,desc);if(kind==="Gear"){const raw=document.createElement("pre");raw.textContent=item.sourceText||"";el.append(raw);addGearPurchaseButtons(el,item)}else{if(item.requirement){const r=document.createElement("p");r.textContent="Requirements: "+item.requirement;el.append(r)}if(item.rankBenefit){const rank=document.createElement("p");rank.textContent="Rank up: "+item.rankBenefit;el.append(rank)}}results.append(el)}};input.oninput=render;category.onchange=render;render()
 }).catch(e=>results.textContent="Could not load "+kind+": "+e.message);
}

const roleOverlay=document.createElement("div");
roleOverlay.id="rpg-role-reference-overlay";
roleOverlay.style.cssText="display:none;position:fixed;inset:0;z-index:100030;background:#000b;overflow:auto;padding:5vh 12px";
roleOverlay.setAttribute("role","dialog");roleOverlay.setAttribute("aria-modal","true");roleOverlay.setAttribute("aria-label","Choose Role Bonus");
document.body.append(roleOverlay);
function closeRole(){roleOverlay.style.display="none";roleOverlay.replaceChildren()}
window.RPGShowRoleReference=async(index,type)=>{
 const feats=type==="gearFeat"||type==="craftFeat",kind=feats?"Feats":"Skills";
 roleOverlay.style.display="block";
 roleOverlay.replaceChildren();
 const card=document.createElement("section");card.className="rpg-reference-panel";
 const title=document.createElement("h2");title.textContent=feats?"Choose a "+(type==="gearFeat"?"Gear":"Craft")+" Feat":"Choose a "+(type==="knowledge"?"Knowledge":"Skill")+" Bonus";
 const closeButton=document.createElement("button");closeButton.type="button";closeButton.textContent="Close";closeButton.onclick=closeRole;
 const search=document.createElement("input");search.type="search";search.placeholder="Search names and descriptions";search.setAttribute("aria-label","Search "+kind);
 const results=document.createElement("div");results.className="rpg-reference-results";results.textContent="Loading…";
 card.append(title,closeButton,search,results);roleOverlay.append(card);
 try{
  const all=await getData(kind);
  const items=all.filter(item=>feats?(type==="gearFeat"?item.category==="Gear":/craft|artisan|alchemy|culinary/i.test(item.name+" "+item.description)):(type==="knowledge"?item.category.startsWith("Knowledge"):!item.category.startsWith("Knowledge")&&item.category!=="Assist"));
  function render(){
   results.replaceChildren();
   const query=search.value.trim().toLowerCase();
   for(const item of items.filter(x=>(x.name+" "+x.description+" "+x.category).toLowerCase().includes(query))){
    const row=document.createElement("article");row.className="rpg-reference-entry";
    const h=document.createElement("h3");h.textContent=item.name;
    const sub=document.createElement("small");sub.textContent=item.category+(item.attributes?" · "+item.attributes:"");
    const desc=document.createElement("p");desc.textContent=item.description||"";
    row.append(h,sub,desc);
    if(item.requirement){const req=document.createElement("p");req.textContent="Requirements: "+item.requirement;row.append(req)}
    if(item.rankBenefit){const rank=document.createElement("p");rank.textContent="Rank up: "+item.rankBenefit;row.append(rank)}
    const pick=document.createElement("button");pick.type="button";pick.textContent="Select "+item.name;pick.onclick=()=>{const value=feats?item.name:item.category.startsWith("Knowledge")?"Knowledge "+item.name:item.name;window.RPGSelectRoleReference?.(index,value);closeRole()};row.append(pick);results.append(row);
   }
   if(!results.childElementCount)results.textContent="No matching entries.";
  }
  search.oninput=render;render();search.focus();
 }catch(e){results.textContent="Could not load "+kind+": "+e.message}
};
roleOverlay.addEventListener("click",e=>{if(e.target===roleOverlay)closeRole()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&roleOverlay.style.display!=="none")closeRole()});


let skillAddBypass=false;
document.addEventListener("click",e=>{
 const button=e.target.closest?.("#add-skill-bonus");
 if(!button||skillAddBypass)return;
 e.preventDefault();e.stopImmediatePropagation();
 showSheetSkillPicker();
},true);
async function showSheetSkillPicker(){
 roleOverlay.style.display="block";roleOverlay.replaceChildren();
 const card=document.createElement("section");card.className="rpg-reference-panel";
 const h=document.createElement("h2");h.textContent="Add Skill Bonus";
 const closeButton=document.createElement("button");closeButton.type="button";closeButton.textContent="Close";closeButton.onclick=closeRole;
 const search=document.createElement("input");search.type="search";search.placeholder="Search skills and descriptions";search.setAttribute("aria-label","Search skills");
 const category=document.createElement("select");category.setAttribute("aria-label","Skill category");
 const results=document.createElement("div");results.className="rpg-reference-results";results.textContent="Loading…";
 card.append(h,closeButton,search,category,results);roleOverlay.append(card);
 try{
  const items=await getData("Skills");
  for(const name of ["All categories",...new Set(items.map(x=>x.category))]){const opt=document.createElement("option");opt.value=name==="All categories"?"":name;opt.textContent=name;category.append(opt)}
  function render(){
   results.replaceChildren();const q=search.value.toLowerCase();
   for(const item of items.filter(x=>(!category.value||x.category===category.value)&&(x.name+" "+x.description+" "+x.attributes).toLowerCase().includes(q))){
    const entry=document.createElement("article");entry.className="rpg-reference-entry";
    const heading=document.createElement("h3");heading.textContent=item.name;
    const meta=document.createElement("small");meta.textContent=item.category+" · "+item.attributes;
    const desc=document.createElement("p");desc.textContent=item.description||"";
    const pick=document.createElement("button");pick.type="button";pick.textContent="Select "+item.name;
    pick.onclick=()=>{
     skillAddBypass=true;try{document.getElementById("add-skill-bonus")?.click()}finally{skillAddBypass=false}
     const row=document.querySelector("#skill-bonus-section .skill-bonus-row:last-child");
     const select=row?.querySelector(".skill-select");if(select){const name=item.category.startsWith("Knowledge")?"Knowledge "+item.name:item.name;
      if(![...select.options].some(o=>o.value===name)){const opt=document.createElement("option");opt.value=name;opt.textContent=name;select.add(opt)}
      select.value=name;select.dispatchEvent(new Event("change",{bubbles:true}));
     }
     closeRole();
    };
    entry.append(heading,meta,desc,pick);results.append(entry);
   }
   if(!results.childElementCount)results.textContent="No matching skills.";
  }
  search.oninput=render;category.onchange=render;render();search.focus();
 }catch(err){results.textContent="Unable to load skills: "+err.message}
}

bar.addEventListener("click",e=>{const b=e.target.closest?.("[data-reference]");if(b)showReference(b.dataset.reference)});
})();