(() => {
 const KEY="rpgUnleashedTheme_v1";
 const chooser=document.getElementById("app-theme-toggle");
 function apply(value) {
  const theme=value==="dark"?"dark":"light";
  document.documentElement.classList.toggle("rpg-dark",theme==="dark");
  if(chooser) chooser.value=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#14171c":"#ffffff");
  try{localStorage.setItem(KEY,theme)}catch(e){console.warn("Theme preference could not be saved",e)}
 }
 let saved="light";
 try{saved=localStorage.getItem(KEY)||"light"}catch(e){}
 apply(saved);
 chooser?.addEventListener("change",e=>apply(e.target.value));
})();