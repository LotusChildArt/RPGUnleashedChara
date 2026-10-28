(()=>{
"use strict";
let records=[],ready=null,bypass=false;
const $=(sel,root=document)=>root.querySelector(sel);
const list=()=>$("#inventory-list");
const input=(el,v)=>{if(!el)return;el.value=v==null?"":String(v);el.dispatchEvent(new Event("input",{bubbles:true}));};
const normalize=s=>String(s||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim();
function load(){if(!ready)ready=fetch("/data/gear-v3.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Gear catalog unavailable: "+r.status);return r.json()}).then(j=>{records=j.items||[];return records});return ready}
window.RPGGearReady=load();
const invRow=()=>list()?.querySelector(".inventory-row");
function addInventory(name,record,extra=""){
 let row=[...document.querySelectorAll("#inventory-list .inventory-row")].find(r=>!$(".inventory-item-input",r)?.value.trim());
 if(!row){bypass=true;try{$("#add-inventory-item")?.click()}finally{bypass=false}row=list()?.lastElementChild}
 if(!row)return;
 input($(".inventory-item-input",row),name);
 if(record?.weight!=null)input($(".inventory-weight-input",row),record.weight);
 input($(".inventory-description",row),[record?.sourceText||record?.description||"",extra].filter(Boolean).join("\n"));
}
function addArmor(record,name){
 const b=$("#add-armor");if(!b)return addInventory(name,record);
 bypass=true;try{b.click()}finally{bypass=false}
 const row=[...document.querySelectorAll("#tab1 .armor-entry .armor-row")].at(-1);
 if(!row)return addInventory(name,record);
 const a=[...row.querySelectorAll("input")];input(a[0],name);
 const stats=record.defense.match(/[+-]?\d+/g)||[];
 stats.slice(0,3).forEach((n,i)=>input(a[i+1],n));
 input(a[4],record.sourceText);
}
function addOutfit(record,name,starting=false){
 const row=$("#tab1 .outfit-row");
 if(!row)return addInventory(name,record,starting?"starting clothes":"");
 const fields=row.querySelectorAll("input");
 const existing=fields[0]?.value.trim()||"";
 if(starting){
  // Starting clothes and additional garments belong together in Outfit.
  input(fields[0],existing?existing+", "+name:name);
  input(fields[1],"starting clothes");
  return;
 }
 if(!existing){input(fields[0],name);input(fields[1],record?.sourceText||"");return}
 addInventory(name,record,"Spare outfit/clothing");
}
function matchItem(name){
 const n=normalize(name);
 return records.find(r=>normalize(r.name)===n)
 ||records.find(r=>normalize(r.name)===n.replace(/s$/,""))
 ||null;
}
function equipWeapon(record,name){
 // Use the sheet's established add-weapon handler, preserving its built-in layout.
 const section=$("#tab1");
 const existing=[...section.querySelectorAll(".weapon-card")].find(r=>!r.querySelector("input")?.value.trim());
 if(!existing){bypass=true;try{$("#add-weapon")?.click()}finally{bypass=false}}
 const row=existing||[...section.querySelectorAll(".weapon-card")].at(-1);
 if(!row)return addInventory(name,record);
 const fields=row.querySelectorAll("input");
 if(!fields.length)return addInventory(name,record);
 input(fields[0],name);
 // Exact source details stay visible and editable; never guess unknown combat fields.
 const desc=row.querySelector("textarea");
 if(desc)input(desc,record?.sourceText||"");
 if(fields[1])input(fields[1],record?.damage||"");
 if(fields[2])input(fields[2],record?.sourceText?.match(/Special:\s*([^\n]+)/)?.[1]||"");
}
function place(record,name,mode){
 if(mode==="inventory")return addInventory(name,record);
 if(record?.kind==="armor")return addArmor(record,name);
 if(record?.kind==="weapon")return equipWeapon(record,name);
 if(record?.kind==="outfit")return addOutfit(record,name,mode==="starting");
 addInventory(name,record);
}
const overlay=document.createElement("div");overlay.id="gear-catalog-overlay";overlay.style.cssText="display:none;position:fixed;inset:0;z-index:100020;background:#000b;padding:4vh 12px;overflow:auto";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Gear catalog");document.body.appendChild(overlay);
function openCatalog(mode="inventory"){
 const scope=mode==="weapon"?"weapon":mode==="armor"?"armor":"inventory";
 overlay.style.display="block";
 overlay.innerHTML='<section class="gear-catalog-panel" style="max-width:780px;margin:auto;border-radius:14px;padding:18px;background:#fff;color:#111"><button type="button" id="gear-close" style="float:right">Close</button><h2 id="gear-dialog-title">Gear v3 Catalog</h2><input type="search" id="gear-search" aria-label="Search gear" placeholder="Search gear" style="padding:10px;width:100%"><select id="gear-category" aria-label="Filter category" style="padding:9px;width:100%;margin:8px 0"></select><p id="gear-info">Loading gear…</p><div id="gear-results" style="max-height:60vh;overflow:auto;display:grid;gap:8px"></div><button type="button" id="gear-manual">+ Custom / Manual Item</button></section>';
 $("#gear-dialog-title",overlay).textContent=scope==="weapon"?"Choose a Weapon":scope==="armor"?"Choose Armor":"Gear v3 Catalog";
 $("#gear-close",overlay).onclick=close;
 $("#gear-manual",overlay).onclick=()=>{
  close();
  if(scope==="weapon"){bypass=true;try{$("#add-weapon")?.click()}finally{bypass=false}}
  else if(scope==="armor"){bypass=true;try{$("#add-armor")?.click()}finally{bypass=false}}
  else{bypass=true;try{$("#add-inventory-item")?.click()}finally{bypass=false}}
 };
 load().then(()=>{if(overlay.style.display==="none")return;const scoped=scope==="inventory"?records:records.filter(r=>r.kind===scope);
 let cats=[scope==="weapon"?"All weapons":scope==="armor"?"All armor":"All gear",...new Set(scoped.map(r=>r.category))];const c=$("#gear-category",overlay);cats.forEach((n,i)=>{const o=document.createElement("option");o.value=i?n:"";o.textContent=n;c.appendChild(o)});const search=$("#gear-search",overlay),results=$("#gear-results",overlay);function render(){results.replaceChildren();const q=normalize(search.value),c=$("#gear-category",overlay).value;const matches=scoped.filter(r=>(!c||r.category===c)&&(!q||normalize(r.name+" "+r.description+" "+r.category).includes(q)));$("#gear-info",overlay).textContent=matches.length+" entries. Selecting an item fills the "+(scope==="weapon"?"weapon":scope==="armor"?"armor":"inventory")+" fields.";for(const record of matches){const b=document.createElement("button");b.type="button";b.className="gear-entry";b.style.cssText="text-align:left;border:1px solid #aaa;padding:12px;border-radius:9px;background:#f6f6f6;color:#111";b.innerHTML="<strong></strong><p></p><small></small>";$("strong",b).textContent=record.name+" — "+record.category;$("p",b).textContent=record.description;$("small",b).textContent=record.sourceText.replace(/\n/g," · ").slice(0,380);b.onclick=()=>{const name=record.name;close();if(scope==="weapon")equipWeapon(record,name);else if(scope==="armor")addArmor(record,name);else addInventory(name,record)};results.append(b)}}search.oninput=render;c.onchange=render;render();search.focus()}).catch(e=>{$("#gear-info",overlay).textContent=String(e)});
}
function close(){overlay.style.display="none";overlay.replaceChildren()}
overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay.style.display!=="none")close()});
document.addEventListener("click",e=>{
 if(bypass)return;
 const trigger=e.target.closest?.("#add-inventory-item, #add-weapon, #add-armor");
 if(!trigger)return;
 e.preventDefault();e.stopImmediatePropagation();
 openCatalog(trigger.id==="add-weapon"?"weapon":trigger.id==="add-armor"?"armor":"inventory");
},true);
window.RPGAddGearToSheet=(name,mode="equipped")=>{const item=matchItem(name);place(item,name,mode)};
window.RPGPopulateStartingGear=async pkg=>{
 if(!pkg)return;
 await load().catch(()=>{});
 const raw=String(pkg.text||"");
 // Starting-gear packages use descriptive prose, not stable item IDs. Match only
 // distinct, non-overlapping catalog names; retain the full original text in a note.
 const words=" "+normalize(raw)+" ";
 const matches=records.filter(r=>r.name.length>=4&&words.includes(" "+normalize(r.name)+" ")).sort((a,b)=>b.name.length-a.name.length);
 // Creator origins use everyday descriptions such as "poor clothing" or
 // "walking stick"; map these only when the source has an unambiguous equivalent.
 const aliases=[
  [/\b(?:poor|plain|common|fine|simple|ratty|ragged|noble|flashy|rugged|travel)(?:\s+(?:but|and|rugged|flashy|noble|travel|fine|common))*\s+(?:clothes|clothing)\b/i,"Set of Clothing"],
  [/\b(?:poor|ragged|plain) cloak\b/i,"Cloak"],
  [/\bwalking stick\b/i,"Club"],
  [/\b(?:short ?sword|shortsword)\b/i,"Sword, Short"],
  [/\blongsword\b/i,"Sword, Long"],
  [/\bbastard sword\b/i,"Sword, Bastard"],
  [/\bshortbow\b/i,"Bow, Short"],
  [/\blongbow\b/i,"Bow, Long"],
  [/\b(?:hunting )?spear\b/i,"Spear, Short"],
  [/\b(?:light )?crossbow\b/i,"Crossbow"],
  [/\bheavy coat\b/i,"Heavy Coat"],
  [/\barmored coat\b/i,"Armored Coat"]

 ];
 for(const [pattern,name] of aliases){
  if(pattern.test(raw)){const item=matchItem(name);if(item&&!matches.some(m=>m.name===item.name))matches.push(item);}
 }
 const selected=[];let remaining=normalize(raw);
 for(const item of matches){const n=normalize(item.name);if(!remaining.includes(n)&&!aliases.some(([pattern,name])=>name===item.name&&pattern.test(raw)))continue;selected.push(item);remaining=remaining.replace(n," ")}
 for(const item of selected)place(item,item.name,"starting");
 if(!selected.length){addInventory(pkg.name,null,(pkg.borrowed?"Borrowed from "+pkg.source+". ":"")+raw);return}
 // Preserve every detail of the selected package without turning the package into duplicate equipment.
 const notes=$("#notes-list");if(notes){$("#add-note")?.click();const card=notes.lastElementChild;if(card){input($(".note-title",card),"Starting Gear — "+pkg.name);input($(".note-body",card),(pkg.borrowed?"Borrowed from "+pkg.source+".\n":"")+raw+"\n\nRecognized: "+selected.map(x=>x.name).join(", ")+". Check other contents for manual entry.")}}
};
})();