import OBR from 'https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm';

const LINK='com.rpgunleashed.character-sheet/tokenLink';
const BRIDGE='com.rpgunleashed.notes/playerCombatV1';
const fields=['hp','hpMax','mana','manaMax','drArmor','drNatural','drMagic','conditions'];
const allowedConditions=new Set(['fear','wounded','arrowed','bleeding','broken-bone','burning','charmed','poisoned','drunk','confused','frozen','unconscious','taunted','stunned','taunt']);
function parseConditions(raw){
 const parts=String(raw??'').split(',').map(x=>x.trim()).filter(Boolean);
 const list=[];
 for(const part of parts){const m=part.match(/^([a-z][a-z-]*)(?::([0-9]+))?$/i);
  if(!m||!allowedConditions.has(m[1].toLowerCase()))throw Error('Unsupported condition: '+part);
  const stacks=Number(m[2]||1);if(!Number.isSafeInteger(stacks)||stacks<1||stacks>100)throw Error('Invalid condition stacks: '+part);
  list.push({id:m[1].toLowerCase(),stacks});
 }
 return list;
}
function conditionsFrom(root){return [...root.querySelectorAll('.condition-card[data-condition-id]')].map(el=>{
 const n=Number(value(el.querySelector('.condition-stacks'))||1);
 return el.dataset.conditionId+(n>1?':'+n:'');
 }).join(', ')}
const lastApplied=new Map();
let running=false,ready=false,roomId=null,ownerId=null,checkTimer=null;
const num=(v,fallback=null)=>v===''||v==null?fallback:Number.isFinite(Number(v))?Number(v):fallback;
const value=e=>e?.value??e?.getAttribute('value')??'';
function parseSheet(record){
 const tab1=document.createElement('template'),tab5=document.createElement('template');
 tab1.innerHTML=record?.state?.tabs?.tab1||'';
 tab5.innerHTML=record?.state?.tabs?.tab5||'';
 const a=tab1.content,b=tab5.content;
 const vals=sel=>[...a.querySelectorAll(sel)].map(value);
 const hp=vals('.current-max-field .current-max-values input');
 const dr=vals('.dr-bubbles input');
 const def=vals('.def-bubbles input');
 const attr=id=>num(value(a.querySelector('#'+id)));
 const weapons=[...a.querySelectorAll('.weapon-card')].map(card=>{
  const name=value(card.querySelector('.weapon-main-row input'))?.trim();
  const hit=card.querySelectorAll('.weapon-sub-row .weapon-mini-field input');
  if(!name||hit.length<2)return null;
  return name+': BOD '+(Number(value(hit[0]))>=0?'+':'')+value(hit[0])+' / DEX '+(Number(value(hit[1]))>=0?'+':'')+value(hit[1]);
 }).filter(Boolean);
 const manaCurrent=value(b.querySelector('.mana-current')||b.querySelector('input[placeholder="Manapool"]'));
 const manaMax=value(b.querySelector('.mana-max')||b.querySelector('input[placeholder="Manapool"]'));
 return {name:record.name||'Player',bod:attr('bod'),dex:attr('dex'),mnd:attr('mnd'),cha:attr('cha'),
  hp:num(hp[0]),hpMax:num(hp[1]),mana:num(manaCurrent),manaMax:num(manaMax),
  drArmor:num(dr[0]),drNatural:num(dr[1]),drMagic:num(dr[2]),
  attack:weapons.join(' | '),
  defense:def.length?'BOD '+def[0]+' / DEX '+(def[1]||'—'):'',
  conditions:conditionsFrom(a)};
}
function updateRecord(record,changes){
 const copy=structuredClone(record);
 const a=document.createElement('template'),b=document.createElement('template');
 a.innerHTML=copy.state?.tabs?.tab1||'';
 b.innerHTML=copy.state?.tabs?.tab5||'';
 const set=(root,selector,value)=>{const el=root.querySelector(selector);if(!el)return;el.value=String(value);el.setAttribute('value',String(value))};
 const hp=a.content.querySelectorAll('.current-max-field .current-max-values input');
 const dr=a.content.querySelectorAll('.dr-bubbles input');
 for(const [key,index] of [['hp',0],['hpMax',1]])if(Number.isInteger(changes[key])&&hp[index]){hp[index].value=String(changes[key]);hp[index].setAttribute('value',String(changes[key]))}
 for(const [key,index] of [['drArmor',0],['drNatural',1],['drMagic',2]])if(Number.isInteger(changes[key])&&dr[index]){dr[index].value=String(changes[key]);dr[index].setAttribute('value',String(changes[key]))}
 for(const [key,selector] of [['mana','.mana-current'],['manaMax','.mana-max']])if(Number.isInteger(changes[key]))set(b.content,selector,changes[key]);
 if(Object.prototype.hasOwnProperty.call(changes,'conditions')){
  const desired=parseConditions(changes.conditions);
  const host=a.content.querySelector('.active-condition-list');
  if(!host)throw Error('This saved sheet needs its condition manager restored before receiving GM condition changes.');
  if(host){
   const retained=[...host.querySelectorAll('.condition-card')];
   const used=new Set();
   for(const spec of desired){
    let card=retained.find(x=>x.dataset.conditionId===spec.id&&!used.has(x));
    if(!card){
     card=document.createElement('div');card.className='condition-card';card.dataset.conditionId=spec.id;
     card.innerHTML='<span class="condition-card-name">'+spec.id+'</span><label class="condition-stack-field">Stacks <input class="condition-stacks" type="number" min="1"></label><button class="remove-condition" type="button">×</button>';
    }
    const input=card.querySelector('.condition-stacks');
    if(input){input.value=String(spec.stacks);input.setAttribute('value',String(spec.stacks))}
    used.add(card);host.appendChild(card);
   }
   retained.filter(x=>!used.has(x)).forEach(x=>x.remove());
  }
 }
 copy.state.tabs.tab1=a.innerHTML;copy.state.tabs.tab5=b.innerHTML;
 copy.revision=Number(copy.revision||0)+1;copy.updatedAt=Date.now();
 return copy;
}
async function publish(record,token,prior){
 const data=parseSheet(record);
 const existing=prior||token.metadata?.[BRIDGE]||{};
 const patch=existing.pendingPatch;
 // Preserve a pending GM change until the owner applies it.
 const next={...existing,version:1,roomId,characterId:record.id,ownerId,
  updatedAt:Date.now(),sheetRevision:Number(record.revision||0),stats:data};
 if(patch)next.pendingPatch=patch;else delete next.pendingPatch;
 await OBR.scene.items.updateItems([token.id],items=>{for(const item of items){
  item.metadata||={};
  const latest=item.metadata[BRIDGE]||{};
  item.metadata[BRIDGE]={...latest,...next,
   ...(latest.pendingPatch?{pendingPatch:latest.pendingPatch}:next.pendingPatch?{pendingPatch:next.pendingPatch}:{})};
 }});
}
async function applyPending(record,token,bridge){
 const patch=bridge.pendingPatch;
 if(!patch||typeof patch.id!=='string'||lastApplied.get(record.id)===patch.id)return;
 if(patch.characterId!==record.id||patch.ownerId!==ownerId)return;
 if(Number.isInteger(Number(patch.baseRevision))&&Number(record.revision||0)!==Number(patch.baseRevision)){
  await OBR.scene.items.updateItems([token.id],items=>{for(const item of items){
   const state=item.metadata?.[BRIDGE];
   if(state?.pendingPatch?.id===patch.id){
    state.rejectedPatchId=patch.id;
    state.rejectionReason='The player changed the character sheet. Refresh and retry the GM edit.';
    delete state.pendingPatch;
   }
  }});
  return;
 }
 const changes={};
 for(const key of fields)if(Object.prototype.hasOwnProperty.call(patch.values||{},key)){
  if(key==='conditions'){try{parseConditions(patch.values[key]);changes[key]=patch.values[key]}catch{return}continue}
  const n=num(patch.values[key]);if(!Number.isSafeInteger(n))return;
  changes[key]=n;
 }
 if(!Object.keys(changes).length)return;
 // Apply only the requested fields, keeping unrelated edits made in Chara.
 const active=window.RPGGetActiveCharacterId?.()===record.id;
 if(active&&typeof window.RPGApplyCombatPatchToLiveSheet==='function'){
  await window.RPGApplyCombatPatchToLiveSheet(changes);
 }else{
  const updated=updateRecord(record,changes);
  await window.RPGCharacterStore.putCharacter(updated);
  if(window.RPGOwlbear?.ready)try{await window.RPGOwlbear.syncSharedCharacter(updated)}catch(error){console.warn('Saved GM values locally; Owlbear publish will retry',error)}
 }
 const verifiedRecord=await window.RPGCharacterStore.getCharacterById(record.id);
 if(!verifiedRecord)throw Error('Character disappeared during GM update.');
 const actual=parseSheet(verifiedRecord);
 for(const [key,expected] of Object.entries(changes)){
  if(key==='conditions'){
   const normalize=text=>parseConditions(text).map(x=>x.id+':'+x.stacks).sort().join(',');
   if(normalize(actual.conditions)!==normalize(expected))throw Error('Condition changes did not save');
  }else if(actual[key]!==expected)throw Error('A GM combat change was not saved to Chara: '+key);
 }
 lastApplied.set(record.id,patch.id);
 const items=await OBR.scene.items.getItems([token.id]);
 const latest=items[0]?.metadata?.[BRIDGE];
 if(latest?.pendingPatch?.id===patch.id){
  await OBR.scene.items.updateItems([token.id],list=>{for(const item of list){
   const state=item.metadata?.[BRIDGE];if(state?.pendingPatch?.id===patch.id){
    state.acknowledgedPatchId=patch.id;delete state.pendingPatch;
   }
  }});
 }
}
async function check(){
 if(running||!ready||!window.RPGCharacterStore)return;
 running=true;
 try{
  if(!await OBR.scene.isReady())return;
  const tokens=await OBR.scene.items.getItems(x=>x.layer==='CHARACTER'&&
   x.metadata?.[LINK]?.ownerId===ownerId&&x.metadata?.[LINK]?.roomId===roomId);
  for(const token of tokens){
   const link=token.metadata[LINK],record=await window.RPGCharacterStore.getCharacterById(link.characterId);
   if(!record)continue;
   const bridge=token.metadata?.[BRIDGE];
   if(bridge?.pendingPatch){
    await applyPending(record,token,bridge);
    continue;
   }
   if(!bridge||bridge.characterId!==record.id||
      Number(record.revision||0)!==Number(bridge.sheetRevision||0)){
    await publish(record,token,bridge);
   }
  }
 }catch(error){console.warn('RPG combat bridge sync failed',error)}
 finally{running=false}
}
OBR.onReady(async()=>{
 try{
  roomId=OBR.room.id;ownerId=OBR.player.id;ready=true;
  window.addEventListener('rpg-owlbear-ready',()=>{void check()});
  window.addEventListener('rpg-notes-combat-sheet-saved',()=>{void check()});
  if(checkTimer)clearInterval(checkTimer);
  checkTimer=setInterval(check,2200);await check();
 }catch(error){console.warn('RPG combat bridge unavailable',error)}
});
