import OBR from '@owlbear-rodeo/sdk';

const KEY='com.rpgunleashed.notes/npcTokenV1';
const RENDERER='https://rpgunleashednotes.onrender.com/npc-battlefield.js';
const fields=['hp','hpMax','mana','manaMax','drArmor','drNatural','drMagic','nl'];
const integer=(value)=>{const n=Number(value);return Number.isFinite(n)?n:0};

export async function loadNPC(tokenId){
 if(!tokenId||!(await OBR.scene.isReady()))return null;
 const token=(await OBR.scene.items.getItems([tokenId]))[0];
 const tag=token?.metadata?.[KEY];
 if(!tag?.combatantId||!tag?.stats||tag.roomId!==OBR.room.id)return null;
 if((await OBR.player.getRole())!=='GM')throw Error('Only the GM can edit NPC controls.');
 const stats=tag.stats;
 return {npc:true,record:{__notesNPC:true,id:tag.combatantId,npcTokenId:tokenId,
  name:stats.name||'NPC',...Object.fromEntries(fields.map(k=>[k,integer(stats[k])])),
  conditions:String(stats.conditions||''),conditionDetails:Array.isArray(stats.conditionDetails)?stats.conditionDetails:[],
  npcUpdatedAt:Number(stats.updatedAt)||0},remoteEditSession:null};
}

export async function saveNPC(record){
 if((await OBR.player.getRole())!=='GM')throw Error('Only the GM can edit NPC controls.');
 const tokenId=record?.npcTokenId;
 if(!tokenId||!(await OBR.scene.isReady()))throw Error('NPC token unavailable.');
 const token=(await OBR.scene.items.getItems([tokenId]))[0];
 const tag=token?.metadata?.[KEY];
 if(!tag?.combatantId||tag.combatantId!==record.id||tag.roomId!==OBR.room.id)throw Error('The NPC token is no longer linked to this combatant.');
 const oldTime=Number(tag.stats?.updatedAt)||0;
 if(oldTime>Number(record.npcUpdatedAt||0))throw Error('NPC stats changed elsewhere. Close and reopen RPG Controls before editing.');
 const updatedAt=Math.max(Date.now(),oldTime+1);
 const stats={...tag.stats,name:record.name,...Object.fromEntries(fields.map(k=>[k,integer(record[k])])),
  conditions:String(record.conditions||''),conditionDetails:Array.isArray(record.conditionDetails)?record.conditionDetails:[],updatedAt};
 await OBR.scene.items.updateItems([tokenId],items=>{for(const item of items){
  item.metadata||={};item.metadata[KEY]={...tag,stats};
 }});
 const updated={...record,npcUpdatedAt:updatedAt};
 try{
  await import(RENDERER);
  if(!window.RPGNPCBattlefield?.ready)await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('NPC HUD renderer was not ready.')),5000);
   window.addEventListener('rpg-npc-owlbear-state',()=>{if(window.RPGNPCBattlefield?.ready){clearTimeout(timeout);resolve()}},{once:true});
  });
  await window.RPGNPCBattlefield.updateHUD({...updated,tokenLinks:{[OBR.room.id]:tokenId}});
 }catch(error){
  console.error('NPC stats saved, but HUD refresh was unsuccessful:',error);
  throw Error('NPC stats saved to the token, but HUD refresh failed: '+error.message);
 }
 return {record:updated,remoteEditSession:null,npc:true};
}
