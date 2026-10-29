(()=>{
"use strict";
const refs={};
const sources=[
 ["/data/language-descriptions.json","languages"],
 ["/data/sheet-reference-details.json","details"],
 ["/data/cultural-traits-one-v1.json","traits"],
 ["/data/race-details.json","races"]
];
for(const [url,key] of sources)fetch(url).then(r=>r.ok?r.json():{}).then(data=>refs[key]=data).catch(()=>{});
function detail(kind,raw){
 const name=String(raw||"").trim();
 if(!name)return {title:"No entry",body:"Enter a name to look up its description."};
 if(kind==="languages"){
  const dict=refs.languages?.languages||{};
  const key=Object.keys(dict).find(x=>x.toLowerCase()===name.toLowerCase())||Object.keys(dict).find(x=>x.toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(x.toLowerCase()));
  const item=dict[key];
  return {title:name,body:item?"Speakers: "+item.speakers+"\n\n"+item.description:"No language description found in Races and Templates One v1 for this entry."};
 }
 if(kind==="traits"){
  const flaw=refs.details?.flaws||{},races=refs.traits?.races||{};
  const key=Object.keys(flaw).find(k=>k.toLowerCase()===name.toLowerCase());
  if(key)return {title:key+" — Flaw",body:flaw[key]};
  for(const [race,items] of Object.entries(races)){
   const t=Object.keys(items||{}).find(k=>k.toLowerCase()===name.toLowerCase());
   if(t)return {title:t+" — "+race+" Cultural Trait",body:items[t]};
  }
  return {title:name,body:"This entry has no matching documented trait or flaw description in the current reference."};
 }
 const aspects=refs.details?.aspects||{};
 const key=Object.keys(aspects).find(x=>name.toLowerCase()===x.toLowerCase()||name.toLowerCase().startsWith(x.toLowerCase()));
 if(key)return {title:name,body:aspects[key]};
 const raceBonus=/^Racial (BOD|DEX|MND|CHA|HP|Natural DR)\s*([+-]\d+)$/i.exec(name);
 if(raceBonus)return {title:name,body:"Inherited racial adjustment: "+raceBonus[2]+" "+raceBonus[1]+". This adjustment is already applied to the character's numeric field. The aspect records its origin and must not be applied a second time."};
 return {title:name,body:"No detailed explanation was found in the current source references. This aspect remains editable."};
}
const modal=document.createElement("div");
modal.className="sheet-reference-backdrop";modal.hidden=true;
modal.innerHTML='<section class="sheet-reference-dialog" role="dialog" aria-modal="true" aria-label="Reference details"><button type="button" class="sheet-reference-close" aria-label="Close">×</button><h3></h3><div class="sheet-reference-text"></div></section>';
document.body.append(modal);
function close(){modal.hidden=true;}
modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest(".sheet-reference-close"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()});
function updateHelp(){
 for(const id of ["traits","languages","aspects"]){
  const list=document.getElementById(id+"-list");if(!list)continue;
  for(const row of list.querySelectorAll(".background-entry-row")){
   if(row.querySelector(".sheet-entry-help"))continue;
   const field=row.querySelector("input");if(!field)continue;
   const btn=document.createElement("button");btn.type="button";btn.className="sheet-entry-help";btn.textContent="?";
   btn.title="Information about "+id;btn.setAttribute("aria-label","Information about "+id);
   btn.addEventListener("click",()=>{const data=detail(id,field.value);modal.querySelector("h3").textContent=data.title;modal.querySelector(".sheet-reference-text").textContent=data.body;modal.hidden=false;modal.querySelector(".sheet-reference-close").focus()});
   const remove=row.querySelector(".remove-background-entry");if(remove)remove.before(btn);else row.append(btn);
  }
 }
}
new MutationObserver(updateHelp).observe(document.body,{childList:true,subtree:true});
updateHelp();
const attrList=document.querySelector("#tab1 .attribute-list")||document.querySelector(".attribute-list");
if(attrList){
 const button=document.createElement("button");button.type="button";button.className="sheet-temp-toggle";
 const label=()=>{const active=[...attrList.querySelectorAll(".temp-value input")].some(i=>i.value.trim()&&Number(i.value)!==Number(document.getElementById(i.id.replace(/^temp-/,""))?.value));button.textContent=(attrList.classList.contains("show-temp-attributes")?"Hide":"Show")+" Temp Attributes"+(active?" (Active)":"");button.setAttribute("aria-expanded",String(attrList.classList.contains("show-temp-attributes")));};
 const heading=attrList.querySelector(".attribute-header");
 attrList.before(button);
 button.addEventListener("click",()=>{attrList.classList.toggle("show-temp-attributes");label()});
 attrList.addEventListener("input",label);
 label();
}
})();