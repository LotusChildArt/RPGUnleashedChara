(()=>{
"use strict";
const ATTRIBUTE_HELP={
 bod:{title:"Body (BOD)",text:"Body determines strength and physical hardiness, contributes to damage with BOD-based attacks, starting Hit Points, and BOD saves.\n\nDeadlift = BOD × 0.1 × character weight. Push/drag = deadlift × 1.5. Encumbered threshold = deadlift ÷ 3.\n\nA character may hold their breath for half their BOD score in rounds without strain. Further rounds require the checks described in RPG Unleashed version b 4.1."},
 dex:{title:"Dexterity (DEX)",text:"Dexterity measures nimbleness and balance. It applies to DEX-based melee and ranged attacks, tasks such as lockpicking, and DEX saves.\n\nMovement speed = DEX × 3, rounded to the nearest 5 feet."},
 mnd:{title:"Mind (MND)",text:"Mind measures thinking, processing information, perception, and memory. It determines the mana pool and MND saves, and affects spellcaster concentration and the spell DCs of certain spellcasters."},
 cha:{title:"Charisma (CHA)",text:"Charisma measures how others perceive the character and the force of their personality. It also determines spell DCs for certain spellcasters."}
};
const creator=document.getElementById("character-creator-screen");
if(!creator)return;
let raceData=null;
let pending=null;
function getRaces(){
 if(raceData)return Promise.resolve(raceData);
 if(!pending)pending=fetch("/data/race-details.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Reference unavailable");return r.json()}).then(d=>(raceData=d.races||{},raceData)).catch(e=>{pending=null;throw e});
 return pending;
}
function helpButton(label,attribute,value){
 const button=document.createElement("button");
 button.type="button";button.className="creator-context-help";
 button.textContent="?";button.setAttribute(attribute,value);
 button.setAttribute("aria-label",label);button.title=label;
 return button;
}
function ensureHelp(){
 for(const row of creator.querySelectorAll("[data-creator-stat-row]")){
   const key=row.dataset.creatorStatRow;
   const title=row.querySelector(".creator-attribute-name");
   if(title&&ATTRIBUTE_HELP[key]&&!title.querySelector(".creator-context-help")){
     title.append(helpButton("Learn about "+ATTRIBUTE_HELP[key].title,"data-help-attribute",key));
   }
 }
 for(const card of creator.querySelectorAll(".creator-race-card.expanded")){
   const body=card.querySelector(".creator-expandable-card-body");
   const name=card.getAttribute("data-creator-race-card");
   if(body&&name&&!body.querySelector("[data-help-race]")){
     body.prepend(helpButton("Read full "+name+" race information","data-help-race",name));
   }
 }
}
const overlay=document.createElement("div");
overlay.className="creator-help-overlay";overlay.hidden=true;
overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
overlay.setAttribute("aria-label","RPG Unleashed reference information");
overlay.innerHTML='<section class="creator-help-panel"><button type="button" class="creator-help-close" aria-label="Close information">×</button><h2></h2><div class="creator-help-content"></div></section>';
document.body.append(overlay);
function open(title,details){
 overlay.querySelector("h2").textContent=title;
 overlay.querySelector(".creator-help-content").textContent=details;
 overlay.hidden=false;
 overlay.querySelector(".creator-help-close").focus();
}
function close(){overlay.hidden=true;}
overlay.addEventListener("click",e=>{if(e.target===overlay||e.target.closest(".creator-help-close"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)close()});
document.addEventListener("click",async e=>{
 const button=e.target.closest?.(".creator-context-help");
 if(!button)return;
 e.preventDefault();e.stopPropagation();
 if(button.dataset.helpAttribute){
   const data=ATTRIBUTE_HELP[button.dataset.helpAttribute];
   if(data)open(data.title,data.text);
 } else if(button.dataset.helpRace){
   const name=button.dataset.helpRace;
   open(name,"Loading race information…");
   try{const races=await getRaces();if(!overlay.hidden)open(name,races[name]||"No detailed race entry is available in the reference document.")}
   catch(err){if(!overlay.hidden)open(name,"Unable to load race information: "+err.message)}
 }
},true);
new MutationObserver(ensureHelp).observe(creator,{childList:true,subtree:true});
ensureHelp();
})();
