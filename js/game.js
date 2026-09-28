(() => {
"use strict";
const E=window.ChessEngine;
const $=id=>document.getElementById(id);
const glyph=E.PIECES;
let state, snapshots=[], flipped=false, selected=null, legal=[], promotionMove=null, aiBusy=false;
let worker=new Worker("js/worker.js");
let settings=JSON.parse(localStorage.getItem("chessSettings")||'{"level":30,"sound":true,"coords":true,"autoQueen":false}');
const level=$("level"), levelValue=$("levelValue"), difficulty=$("difficulty"), thinking=$("thinking"), nodes=$("nodes");
const board=$("board"), status=$("status"), history=$("history"), captured=$("captured"), overlay=$("gameOverlay"), overlayTitle=$("overlayTitle"), overlayText=$("overlayText");

function cfgLabel(l){if(l<=10)return"Beginner";if(l<=25)return"Easy";if(l<=40)return"Intermediate";if(l<=55)return"Advanced";if(l<=70)return"Strong";if(l<=85)return"Very Strong";if(l<=95)return"Expert";return"Maximum Engine Strength";}
function describeLevel(l){return `${cfgLabel(l)} • ${l===100?"strongest practical engine configuration":"engine depth and search budget scale with level"}`;}
function newGame(){
  state=E.initialState(); state.positions[E.key(state)]=1; snapshots=[]; selected=null;legal=[];promotionMove=null;aiBusy=false;
  thinking.classList.add("hidden"); $("turn").textContent="White"; render(); updateStatus();
}
function snapshot(){snapshots.push(E.cloneState(state));if(snapshots.length>100)snapshots.shift();}
function squareName(r,c){return String.fromCharCode(97+c)+(8-r);}
function render(){
  board.innerHTML="";
  const rows=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7], cols=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  for(let ri=0;ri<8;ri++)for(let ci=0;ci<8;ci++){
    const r=rows[ri],c=cols[ci],p=state.board[r][c],m=legal.find(x=>x.to.r===r&&x.to.c===c);
    const b=document.createElement("button"); b.className=`sq ${(r+c)%2?"dark":"light"}`;
    if(selected?.r===r&&selected?.c===c)b.classList.add("selected");
    if(m)b.classList.add(m.capture?"capture":"target");
    if(state.last&&((state.last.from.r===r&&state.last.from.c===c)||(state.last.to.r===r&&state.last.to.c===c)))b.classList.add("last");
    if(p&&p.c===state.turn&&state.turn==="w"&&!aiBusy)b.setAttribute("aria-label",`${p.c==="w"?"White":"Black"} ${p.t} at ${squareName(r,c)}`);
    b.dataset.r=r;b.dataset.c=c;
    b.innerHTML=p?`<span class="piece ${p.c}">${glyph[p.c][p.t]}</span>`:"";
    b.onclick=()=>handleSquare(r,c);
    board.appendChild(b);
  }
  $("turn").textContent=state.turn==="w"?"White":"Black";
  $("levelValue").textContent=level.value;
  difficulty.textContent=describeLevel(+level.value);
  captured.innerHTML=`<span><b>White:</b> ${state.captured.w.map(p=>glyph[p.c][p.t]).join(" ")||"—"}</span><span><b>Black:</b> ${state.captured.b.map(p=>glyph[p.c][p.t]).join(" ")||"—"}</span>`;
  history.innerHTML=state.history.map((m,i)=>`<div><span>${Math.floor(i/2)+1}${i%2?".":"."}</span><b>${m}</b></div>`).join("");
}
function updateStatus(){
  const t=E.terminal(state), check=E.inCheck(state,state.turn);
  status.className="status "+(check?"check ":"")+(t.over?"over":"");
  if(t.over){
    const title=t.type==="checkmate"?(t.winner==="w"?"You Win!":"AI Wins"):"Draw";
    status.textContent=t.type==="checkmate"?`Checkmate — ${title}`:`${title} — ${t.type.replace("-"," ")}`;
    showOverlay(title, t.type==="checkmate"?`${title}. AI Level ${level.value}.`:"The game ended in a draw.");
  } else status.textContent=check?`${state.turn==="w"?"Your":"AI"} king is in check`:`${state.turn==="w"?"Your turn":"AI thinking…"}`;
}
function showOverlay(title,text){overlayTitle.textContent=title;overlayText.textContent=text;overlay.classList.remove("hidden");}
function hideOverlay(){overlay.classList.add("hidden");}
function handleSquare(r,c){
  if(aiBusy||state.turn!=="w"||state.over)return;
  const p=state.board[r][c];
  if(selected){
    const m=legal.find(x=>x.to.r===r&&x.to.c===c);
    if(m){if(m.promotion&&!settings.autoQueen){promotionMove=m;showPromotion();}else{m.promote=m.promotion?"q":undefined;playMove(m);}return;}
    if(p?.c==="w"){selected={r,c};legal=E.legalMoves(state,"w").filter(m=>m.from.r===r&&m.from.c===c);render();return;}
    selected=null;legal=[];render();return;
  }
  if(p?.c==="w"){selected={r,c};legal=E.legalMoves(state,"w").filter(m=>m.from.r===r&&m.from.c===c);render();}
}
function playMove(m){
  snapshot(); state=E.makeMove(state,m); selected=null;legal=[];promotionMove=null;hidePromotion();render();updateStatus();
  if(!E.terminal(state).over&&state.turn==="b")think();
}
function showPromotion(){
  $("promotionChoices").innerHTML=["q","r","b","n"].map(t=>`<button data-piece="${t}">${glyph.w[t]}<span>${t.toUpperCase()}</span></button>`).join("");
  $("promotion").classList.remove("hidden");
  $("promotionChoices").querySelectorAll("button").forEach(b=>b.onclick=()=>{promotionMove.promote=b.dataset.piece;playMove(promotionMove);});
}
function hidePromotion(){$("promotion").classList.add("hidden");}
function think(){
  aiBusy=true;thinking.classList.remove("hidden");nodes.textContent="Calculating…";render();
  worker.postMessage({type:"think",state:E.cloneState(state),level:+level.value});
}
worker.onmessage=e=>{
  if(e.data.type==="error"){aiBusy=false;thinking.classList.add("hidden");nodes.textContent="Engine error";console.error(e.data.message);updateStatus();return;}
  aiBusy=false;thinking.classList.add("hidden");nodes.textContent=`Depth ${e.data.depth} • ${e.data.nodes.toLocaleString()} nodes • ${e.data.time} ms`;
  if(e.data.move){snapshot();state=E.makeMove(state,e.data.move);}
  render();updateStatus();
};
function undo(){
  if(aiBusy||!snapshots.length)return;
  state=snapshots.pop();selected=null;legal=[];hideOverlay();render();updateStatus();
  if(state.turn==="b"&&snapshots.length){state=snapshots.pop();render();updateStatus();}
}
$("newGame").onclick=()=>{hideOverlay();newGame();};
$("undo").onclick=undo;
$("flip").onclick=()=>{flipped=!flipped;render();};
$("level").oninput=()=>{settings.level=+level.value;localStorage.setItem("chessSettings",JSON.stringify(settings));render();};
$("closeOverlay").onclick=hideOverlay;
$("playAgain").onclick=()=>{hideOverlay();newGame();};
$("promotionCancel").onclick=()=>{promotionMove=null;hidePromotion();selected=null;legal=[];render();};
$("sound").onchange=e=>{settings.sound=e.target.checked;localStorage.setItem("chessSettings",JSON.stringify(settings));};
$("autoQueen").onchange=e=>{settings.autoQueen=e.target.checked;localStorage.setItem("chessSettings",JSON.stringify(settings));};
$("level").value=settings.level; $("sound").checked=settings.sound; $("autoQueen").checked=settings.autoQueen;
newGame();
})();