(() => {
"use strict";
const button=document.getElementById("rpg-level-up");
if (!button) return;
const panel=document.createElement("div");
panel.id="rpg-levelup-dialog";
panel.style.cssText="display:none;position:fixed;inset:0;z-index:100005;background:#000b;overflow:auto;padding:4vh 12px";
panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Character Level Up");
document.body.appendChild(panel);
let catalog=null,working=null;
const levelInput=()=>document.querySelector('#tab1 .character-header input[placeholder="Level"]');
const progression=()=>window.RPGProgressionState||{completedLevel:0};
function updateButton(){button.textContent="+ Lvl "+(Number(progression().completedLevel||0)+1);}
function featRows(){return [...document.querySelectorAll("#feat-list .feat-row")].filter(r=>r.querySelector(".feat-input")?.value.trim());}
function chosenNames(){return new Set([...featRows().map(r=>r.querySelector(".feat-input").value.trim()),...(working?.operations||[]).filter(o=>o.kind==="feat").map(o=>o.name)]);}
function sourceFeat(name){return catalog?.find(f=>f.name===name);}
function val(selector){return Number(document.querySelector(selector)?.value||0);}
function remaining(){return working.base+working.adjustment-working.operations.reduce((a,o)=>a+o.cost,0);}
function freeRemaining(){return working.freeCount-working.operations.filter(o=>o.kind==="feat"&&o.cost===0&&o.slot!=="proficiency").length;}
function owns(name){return chosenNames().has(name);}
function optionSelect(id,items,placeholder){return '<select id="'+id+'" style="width:100%;padding:9px;margin:5px 0"><option value="">'+placeholder+'</option>'+items.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("")+'</select>';}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
function featSelectItems(){return catalog.filter(f=>!owns(f.name)).map(f=>f.name);}
function rulesLevel(){return Number(progression().completedLevel||0)+1;}
function showMessage(text){const el=panel.querySelector("#rpg-level-message");if(el)el.textContent=text;}
function featState(name){
 const row=featRows().find(r=>r.querySelector(".feat-input").value.trim()===name);
 const o=working.operations.filter(o=>o.name===name);
 let points=Number(row?.querySelectorAll(".feat-level-bubble input")[0]?.value||0),rank=Number(row?.querySelector(".feat-rank-input")?.value||0);
 for(const op of o){if(op.kind==="invest")points++;if(op.kind==="rank")rank++;}
 const threshold=Number(sourceFeat(name)?.levelPointThreshold||row?.querySelectorAll(".feat-level-bubble input")[1]?.value||3)*(rank+1);
 return {points,rank,threshold};
}
function addOperation(op){
 if(op.cost>remaining())return showMessage("Not enough level points.");
 working.operations.push(op);render();
}
function render(){
 const level=working.level,free=freeRemaining(),points=remaining(),hasProf=level!==1||working.operations.some(o=>o.slot==="proficiency")||owns("Light Melee Proficiency");
 const allowAttr=level===1||level%3===0;
 const names=[...chosenNames()].filter(Boolean);
 panel.innerHTML='<div style="background:#fff;color:#111;max-width:800px;margin:0 auto;border-radius:16px;padding:20px;line-height:1.45">'+
 '<h2 style="margin:0 0 8px">Level '+level+' — Character Progression</h2>'+
 '<p style="margin:0 0 12px">Complete each level before moving on. Cancel discards choices made in this window.</p>'+
 '<div style="display:flex;gap:14px;flex-wrap:wrap;font-weight:bold"><span>Level points: '+points+'</span><span>Free feats: '+free+'</span></div>'+
 '<p style="font-size:13px">Base points: '+working.base+'. Adjust for racial/build/GM changes before choosing rewards.</p>'+
 '<label>Level point adjustment <input id="rpg-level-adjust" type="number" value="'+working.adjustment+'" style="width:80px;padding:6px" '+(working.operations.length?"disabled":"")+'></label>'+
 (catalog?'<div style="border-top:1px solid #ddd;margin-top:12px;padding-top:10px">'+
 (level===1&&!hasProf?'<h3>Starting weapon proficiency</h3>'+optionSelect("rpg-level-prof",["Light Melee Proficiency","Medium Melee Proficiency","Heavy Melee Proficiency","Ranged Weapon Proficiency"],"Choose starting proficiency")+'<button id="rpg-level-use-prof" type="button">Select proficiency</button>':"")+
 (free>0?'<h3>Free feat</h3>'+optionSelect("rpg-level-free",featSelectItems(),"Select a free feat")+'<button id="rpg-level-use-free" type="button">Add free feat</button>':"")+
 (points>=3?'<h3>Buy a feat (3 points)</h3>'+optionSelect("rpg-level-buy",featSelectItems(),"Select feat to purchase")+'<button id="rpg-level-use-buy" type="button">Buy feat</button>':"")+
 (points>0?'<h3>Spend level points</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="rpg-level-hp" type="button">+5 Max HP (1)</button><button id="rpg-level-mana" type="button">+5 Max Mana (1)</button></div>'+
 (allowAttr?'<p>Attribute increases available at this level:</p>'+optionSelect("rpg-level-attr",["BOD","DEX","MND","CHA"],"Choose attribute")+'<button id="rpg-level-use-attr" type="button">+1 Attribute (1)</button>':"")+
 (names.length?'<p>Invest in an owned feat (1 point):</p>'+optionSelect("rpg-level-invest",names,"Choose feat")+'<button id="rpg-level-use-invest" type="button">Invest 1 point</button>'+
 (points>=3?'<p>Rank up a feat at its threshold (3 points):</p>'+optionSelect("rpg-level-rank",names,"Choose feat")+'<button id="rpg-level-use-rank" type="button">Rank up</button>':""):""):"")+
 '</div>':'<p>Loading feats…</p>')+
 '<h3>Planned choices</h3><div style="max-height:170px;overflow:auto">'+(working.operations.length?'<ol>'+working.operations.map(o=>'<li>'+esc(o.label)+'</li>').join("")+'</ol>':'<p>No choices yet.</p>')+'</div>'+
 '<p id="rpg-level-message" role="status" style="color:#8a321c;font-size:13px">The picker shows requirements; please confirm eligibility with your GM. Automated prerequisite enforcement is not yet available.</p>'+
 '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button id="rpg-level-undo" type="button" '+(!working.operations.length?"disabled":"")+'>Undo last</button><button id="rpg-level-cancel" type="button">Cancel level up</button><button id="rpg-level-finish" type="button" style="background:#111;color:#fff;padding:10px" '+(points!==0||free!==0||!hasProf?"disabled":"")+'>Complete Level '+level+'</button></div>'+
 '</div>';
 const $=id=>panel.querySelector("#"+id);
 $("rpg-level-adjust").addEventListener("change",e=>{working.adjustment=Math.max(-working.base,Math.min(100,Number(e.target.value||0)));render()});
 $("rpg-level-cancel").onclick=()=>{panel.style.display="none";working=null};
 $("rpg-level-undo").onclick=()=>{working.operations.pop();render()};
 $("rpg-level-finish").onclick=complete;
 const bind=(id,fn)=>{const e=$(id);if(e)e.onclick=fn;};
 const select=id=>$(id)?.value;
 const addFeat=(name,cost,slot)=>{if(!name)return showMessage("Choose a feat first.");if(owns(name))return showMessage("That feat is already on your sheet or planned for this level.");addOperation({kind:"feat",name,cost,slot,label:name+(cost?" — purchased (3 points)":" — free")});};
 bind("rpg-level-use-prof",()=>addFeat(select("rpg-level-prof"),0,"proficiency"));
 bind("rpg-level-use-free",()=>addFeat(select("rpg-level-free"),0,"free"));
 bind("rpg-level-use-buy",()=>addFeat(select("rpg-level-buy"),3,"purchase"));
 bind("rpg-level-hp",()=>addOperation({kind:"hp",cost:1,label:"+5 maximum HP"}));
 bind("rpg-level-mana",()=>addOperation({kind:"mana",cost:1,label:"+5 maximum Mana"}));
 bind("rpg-level-use-attr",()=>{const name=select("rpg-level-attr");if(!name)return showMessage("Choose an attribute.");if(working.operations.some(o=>o.kind==="attr"&&o.name===name))return showMessage("An attribute can increase at most once during this level.");addOperation({kind:"attr",name,cost:1,label:"+1 "+name});});
 bind("rpg-level-use-invest",()=>{const name=select("rpg-level-invest");if(!name)return showMessage("Choose a feat.");const f=featState(name);if(f.points>=f.threshold)return showMessage("This feat has reached its current threshold; rank it up first.");addOperation({kind:"invest",name,cost:1,label:"+1 point in "+name});});
 bind("rpg-level-use-rank",()=>{const name=select("rpg-level-rank");if(!name)return showMessage("Choose a feat.");const f=featState(name);if(f.points<f.threshold)return showMessage("That feat has not reached its level-point threshold.");addOperation({kind:"rank",name,cost:3,label:"Rank up "+name});});
}
async function complete(){
 if(remaining()!==0||freeRemaining()!==0)return;
 if(working.level===1&&!working.operations.some(o=>o.slot==="proficiency")&&!owns("Light Melee Proficiency"))return;
 const operations=working.operations.slice();
 for(const op of operations){
  if(op.kind==="feat"){const f=sourceFeat(op.name);if(f&&window.RPGAddCatalogFeat)window.RPGAddCatalogFeat(f);}
  if(op.kind==="attr"){const e=document.getElementById(op.name.toLowerCase());if(e){e.value=String(Number(e.value||0)+1);e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}}
  if(op.kind==="hp"){
   const e=document.querySelector("#tab1 .health-row .current-max-values input:last-of-type");if(e){e.value=String(Number(e.value||0)+5);e.dispatchEvent(new Event("input",{bubbles:true}));}
  }
  if(op.kind==="mana"){
   const group=[...document.querySelectorAll("#tab5 .current-max-values")].find(x=>x.textContent.includes("/"))||document.querySelector("#tab5 .current-max-values");
   const e=group?.querySelector("input:last-of-type");if(e){e.value=String(Number(e.value||0)+5);e.dispatchEvent(new Event("input",{bubbles:true}));}
  }
  if(op.kind==="invest"||op.kind==="rank"){
   const row=featRows().find(r=>r.querySelector(".feat-input").value.trim()===op.name);
   if(row){if(op.kind==="invest"){const e=row.querySelectorAll(".feat-level-bubble input")[0];e.value=String(Number(e.value||0)+1);}else{const e=row.querySelector(".feat-rank-input");e.value=String(Number(e.value||0)+1);const th=row.querySelectorAll(".feat-level-bubble input")[1];const f=sourceFeat(op.name);if(th&&f)th.value=String(f.levelPointThreshold*(Number(e.value)+1));}}
  }
 }
 window.RPGProgressionState={...progression(),completedLevel:working.level};
 const input=levelInput();if(input){input.value=String(working.level);input.dispatchEvent(new Event("input",{bubbles:true}));}
 panel.style.display="none";working=null;updateButton();
 if(typeof window.RPGSaveCurrentCharacter==="function"){try{await window.RPGSaveCurrentCharacter();}catch(e){console.error("Level up auto-save failed",e);}}
}
button.addEventListener("click",async()=>{
 updateButton();if(working)return;const level=rulesLevel();
 working={level,base:3+level,adjustment:0,freeCount:level===1?2:level%3===0?1:0,operations:[]};
 panel.style.display="block";render();
 try{const r=await fetch("/data/feats-one-v1.json?build=1.55.0",{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const data=await r.json();catalog=data.feats||[];render();}
 catch(e){catalog=[];render();showMessage("Could not load feats database ("+e.message+"). Cancel and refresh the app.");}
});
document.addEventListener("click",()=>{if(!working)updateButton();},true);
updateButton();
})();