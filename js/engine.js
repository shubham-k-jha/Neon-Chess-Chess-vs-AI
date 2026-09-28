(() => {
  "use strict";
  const PIECES = { w:{p:"♙",n:"♘",b:"♗",r:"♖",q:"♕",k:"♔"}, b:{p:"♟",n:"♞",b:"♝",r:"♜",q:"♛",k:"♚"} };
  const VALUES = {p:100,n:320,b:330,r:500,q:900,k:20000};
  const files="abcdefgh";
  const KNIGHT=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  const KING=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const BISHOP=[[1,1],[1,-1],[-1,1],[-1,-1]];
  const ROOK=[[1,0],[-1,0],[0,1],[0,-1]];
  const CENTER=[[3,3],[3,4],[4,3],[4,4],[2,2],[2,3],[2,4],[2,5],[3,2],[3,5],[4,2],[4,5],[5,2],[5,3],[5,4],[5,5]];

  function initialBoard(){
    const b=Array.from({length:8},()=>Array(8).fill(null));
    const back=["r","n","b","q","k","b","n","r"];
    for(let c=0;c<8;c++){b[0][c]={c:"b",t:back[c]};b[1][c]={c:"b",t:"p"};b[6][c]={c:"w",t:"p"};b[7][c]={c:"w",t:back[c]};}
    return b;
  }
  function initialState(){return {board:initialBoard(),turn:"w",cast:{w:{k:true,q:true},b:{k:true,q:true}},ep:null,halfmove:0,fullmove:1,history:[],captured:{w:[],b:[]},positions:{},last:null};}
  function cloneBoard(b){return b.map(r=>r.map(p=>p&&{...p}));}
  function cloneState(s){return {...s,board:cloneBoard(s.board),cast:{w:{...s.cast.w},b:{...s.cast.b}},ep:s.ep&&{...s.ep},history:s.history.slice(),captured:{w:s.captured.w.map(x=>({...x})),b:s.captured.b.map(x=>({...x}))},positions:{...s.positions},last:s.last&&{...s.last,from:{...s.last.from},to:{...s.last.to}}};}
  const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
  const enemy=c=>c==="w"?"b":"w";
  function key(s){
    const board=s.board.map(r=>r.map(p=>p?p.c+p.t:".").join("")).join("/");
    return `${board}|${s.turn}|${s.cast.w.k?"K":""}${s.cast.w.q?"Q":""}${s.cast.b.k?"k":""}${s.cast.b.q?"q":""}|${s.ep?s.ep.r+","+s.ep.c:"-"}`;
  }
  function findKing(b,c){for(let r=0;r<8;r++)for(let col=0;col<8;col++){const p=b[r][col];if(p&&p.c===c&&p.t==="k")return {r,c:col};}return null;}
  function isAttacked(b,r,c,by){
    const pd=by==="w"?-1:1;
    for(const dc of [-1,1]){const rr=r-pd,cc=c-dc;if(inside(rr,cc)&&b[rr][cc]?.c===by&&b[rr][cc]?.t==="p")return true;}
    for(const [dr,dc] of KNIGHT){const p=inside(r+dr,c+dc)&&b[r+dr][c+dc];if(p?.c===by&&p.t==="n")return true;}
    for(const [dr,dc] of KING){const p=inside(r+dr,c+dc)&&b[r+dr][c+dc];if(p?.c===by&&p.t==="k")return true;}
    for(const [dr,dc] of BISHOP){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=b[rr][cc];if(p){if(p.c===by&&(p.t==="b"||p.t==="q"))return true;break;}rr+=dr;cc+=dc;}}
    for(const [dr,dc] of ROOK){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=b[rr][cc];if(p){if(p.c===by&&(p.t==="r"||p.t==="q"))return true;break;}rr+=dr;cc+=dc;}}
    return false;
  }
  function inCheck(s,c){const k=findKing(s.board,c);return !k||isAttacked(s.board,k.r,k.c,enemy(c));}

  function pseudoMoves(s,r,c){
    const b=s.board,p=b[r][c]; if(!p)return [];
    const out=[];
    const add=(rr,cc,extra={})=>{
      if(!inside(rr,cc))return;
      const q=b[rr][cc];
      if(q?.c===p.c)return;
      out.push({from:{r,c},to:{r:rr,c:cc},piece:{...p},capture:q?{...q}:null,...extra});
    };
    if(p.t==="p"){
      const d=p.c==="w"?-1:1, start=p.c==="w"?6:1, promoRow=p.c==="w"?0:7;
      if(inside(r+d,c)&&!b[r+d][c]){
        add(r+d,c,{promotion:r+d===promoRow});
        if(r===start&&!b[r+2*d][c])add(r+2*d,c,{double:true});
      }
      for(const dc of [-1,1]){
        const rr=r+d,cc=c+dc;if(!inside(rr,cc))continue;
        if(b[rr][cc]?.c===enemy(p.c))add(rr,cc,{promotion:rr===promoRow});
        if(s.ep&&s.ep.r===rr&&s.ep.c===cc)add(rr,cc,{ep:true,capture:{c:enemy(p.c),t:"p"}});
      }
    } else if(p.t==="n"){
      for(const [dr,dc] of KNIGHT)add(r+dr,c+dc);
    } else if(p.t==="b"||p.t==="r"||p.t==="q"){
      const dirs=p.t==="b"?BISHOP:p.t==="r"?ROOK:[...BISHOP,...ROOK];
      for(const [dr,dc] of dirs){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){if(b[rr][cc]){add(rr,cc);break;}add(rr,cc);rr+=dr;cc+=dc;}}
    } else if(p.t==="k"){
      for(const [dr,dc] of KING)add(r+dr,c+dc);
      const home=p.c==="w"?7:0;
      if(r===home&&c===4&&!inCheck(s,p.c)){
        for(const side of ["k","q"]){
          const rc=side==="k"?7:0, between=side==="k"?[5,6]:[3,2], transit=side==="k"?[5,6]:[3,2];
          if(s.cast[p.c][side]&&b[home][rc]?.c===p.c&&b[home][rc]?.t==="r"&&between.every(x=>!b[home][x])&&transit.every(x=>!isAttacked(b,home,x,enemy(p.c))))
            add(home,side==="k"?6:2,{castle:side});
        }
      }
    }
    return out;
  }

  function applyMove(s,m){
    const n=cloneState(s),b=n.board,p=b[m.from.r][m.from.c];
    b[m.from.r][m.from.c]=null;
    if(m.ep)b[m.from.r][m.to.c]=null;
    if(m.castle){
      const rc=m.castle==="k"?7:0,tc=m.castle==="k"?5:3;
      b[m.from.r][tc]=b[m.from.r][rc];b[m.from.r][rc]=null;
    }
    b[m.to.r][m.to.c]={...p,t:m.promote||p.t};
    n.ep=m.double?{r:(m.from.r+m.to.r)/2,c:m.from.c}:null;
    n.halfmove=(p.t==="p"||m.capture)?0:s.halfmove+1;
    if(s.turn==="b")n.fullmove++;
    if(p.t==="k")n.cast[p.c]={k:false,q:false};
    if(p.t==="r"){
      if(m.from.r===(p.c==="w"?7:0)&&m.from.c===0)n.cast[p.c].q=false;
      if(m.from.r===(p.c==="w"?7:0)&&m.from.c===7)n.cast[p.c].k=false;
    }
    if(m.capture?.t==="r"){
      const cc=m.to.c,rr=m.to.r,ec=m.capture.c,home=ec==="w"?7:0;
      if(rr===home&&cc===0)n.cast[ec].q=false;
      if(rr===home&&cc===7)n.cast[ec].k=false;
    }
    n.turn=enemy(s.turn); n.last=m;
    return n;
  }
  function legalMoves(s,c=s.turn){
    const out=[];
    for(let r=0;r<8;r++)for(let col=0;col<8;col++)if(s.board[r][col]?.c===c){
      for(const m of pseudoMoves(s,r,col)){const n=applyMove(s,m);if(!inCheck(n,c))out.push(m);}
    }
    return out;
  }
  function makeMove(s,m){
    const n=applyMove(s,m), p=m.piece;
    n.history=s.history.concat([moveText(s,m)]);
    if(m.capture)n.captured[p.c].push({...m.capture});
    const k=key(n);n.positions={...s.positions,[k]:(s.positions[k]||0)+1};return n;
  }
  function moveText(s,m){
    if(m.castle)return m.castle==="k"?"O-O":"O-O-O";
    const p=m.piece, capture=!!m.capture;
    let text=p.t==="p"?(capture?files[m.from.c]+"x":""):(p.t.toUpperCase()+(capture?"x":""));
    text+=files[m.to.c]+(8-m.to.r); if(m.promote)text+="="+m.promote.toUpperCase();
    const n=applyMove(s,m); if(inCheck(n,n.turn))text+=legalMoves(n,n.turn).length?" +":"#"; return text;
  }
  function terminal(s){
    const moves=legalMoves(s,s.turn);
    if(!moves.length)return {over:true,type:inCheck(s,s.turn)?"checkmate":"stalemate",winner:inCheck(s,s.turn)?enemy(s.turn):null};
    if(s.halfmove>=100)return {over:true,type:"fifty-move",winner:null};
    if(Object.values(s.positions).some(v=>v>=3))return {over:true,type:"threefold",winner:null};
    if(insufficient(s.board))return {over:true,type:"insufficient",winner:null};
    return {over:false};
  }
  function insufficient(b){
    const pieces=b.flat().filter(p=>p&&p.t!=="k");
    if(!pieces.length)return true;
    if(pieces.length===1&&["b","n"].includes(pieces[0].t))return true;
    if(pieces.every(p=>p.t==="b")){
      const colors=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p?.t==="b")colors.push((r+c)%2);}
      return new Set(colors).size===1;
    }
    return false;
  }

  const PST={
    p:[0,5,5,-5,-10,0,0,0, 0,10,-5,0,5,10,10,0, 0,10,10,20,20,10,10,0, 5,20,20,30,30,20,20,5, 10,20,30,40,40,30,20,10, 50,50,50,50,50,50,50,50, 90,90,90,90,90,90,90,90, 0,0,0,0,0,0,0,0],
    n:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,5,5,0,-20,-40,-30,5,10,15,15,10,5,-30,-30,0,15,20,20,15,0,-30,-30,5,15,20,20,15,5,-30,-30,0,10,15,15,10,0,-30,-40,-20,0,0,0,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
    b:[-20,-10,-10,-10,-10,-10,-10,-20,-10,5,0,0,0,0,5,-10,-10,10,10,10,10,10,10,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
    r:[0,0,0,5,5,0,0,0,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,5,10,10,10,10,10,10,5,0,0,0,0,0,0,0,0],
    q:[-20,-10,-10,0,0,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,0,0,5,5,5,5,0,-5,-5,0,5,5,5,5,0,-5,-10,0,5,5,5,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,0,0,-10,-10,-20],
    k:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
  };

  function evaluate(s,aiColor="b"){
    let score=0, wb=0,bb=0,wm=0,bm=0;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=s.board[r][c];if(!p)continue;let v=VALUES[p.t],idx=p.c==="w"?r*8+c:(7-r)*8+c;let ps=PST[p.t]?.[idx]||0;score+=(p.c==="w"?1:-1)*(v+ps);if(p.t==="b"){p.c==="w"?wb++:bb++;} if(p.t==="n"||p.t==="b")p.c==="w"?wm++:bm++;}
    for(const [r,c] of CENTER){const p=s.board[r][c];if(p)score+=(p.c==="w"?8:-8);}
    const mobilityW=legalMoves(s,"w").length,mobilityB=legalMoves(s,"b").length; score+=(mobilityW-mobilityB)*2;
    if(wm>=2)score+=20;if(bm>=2)score-=20;
    return aiColor==="w"?score:-score;
  }
  function levelConfig(level){
    const l=Math.max(1,Math.min(100,level)), depth=l<12?2:l<30?3:l<55?4:l<75?5:l<90?6:7;
    return {depth,time: l<11?120:l<31?300:l<61?700:l<86?1400:2200,random:Math.max(0,(11-l)/11),quiescence:l>=20?3:1};
  }
  function moveScore(s,m){
    let v=0;if(m.capture)v+=10000+VALUES[m.capture.t]*10-VALUES[m.piece.t];if(m.promotion)v+=9000;if(m.castle)v+=500;
    const child=applyMove(s,m);if(inCheck(child,child.turn))v+=5000;
    return v;
  }
  function ordered(s,moves,ttMove){return moves.slice().sort((a,b)=>((a===ttMove?-1:0)+moveScore(s,b))-((b===ttMove?-1:0)+moveScore(s,a)));}
  function searchBest(s,level){
    const cfg=levelConfig(level),deadline=performance.now()+cfg.time,tt=new Map();let nodes=0,aborted=false;
    function q(pos,alpha,beta,depth){
      if(performance.now()>deadline){aborted=true;return 0;}nodes++;
      const stand=evaluate(pos,"b");
      if(depth<=0)return stand;
      if(pos.turn==="b"){
        if(stand>=beta)return stand; if(stand>alpha)alpha=stand;
        for(const m of ordered(pos,legalMoves(pos).filter(x=>x.capture||x.promotion),null)){const v=q(makeMove(pos,m),alpha,beta,depth-1);if(aborted)return 0;if(v>alpha)alpha=v;if(alpha>=beta)break;}
        return alpha;
      } else {
        if(stand<=alpha)return stand; if(stand<beta)beta=stand;
        for(const m of ordered(pos,legalMoves(pos).filter(x=>x.capture||x.promotion),null)){const v=q(makeMove(pos,m),alpha,beta,depth-1);if(aborted)return 0;if(v<beta)beta=v;if(alpha>=beta)break;}
        return beta;
      }
    }
    function ab(pos,depth,alpha,beta){
      if(performance.now()>deadline){aborted=true;return 0;}nodes++;
      const term=terminal(pos);
      if(term.over){if(term.type==="checkmate")return pos.turn==="b"?-100000-depth:100000+depth;return 0;}
      if(depth===0)return q(pos,alpha,beta,cfg.quiescence);
      const k=key(pos),entry=tt.get(k);
      if(entry&&entry.depth>=depth)return entry.score;
      let value=pos.turn==="b"?-Infinity:Infinity, bestMove=null;
      const moves=ordered(pos,legalMoves(pos),entry?.move);
      for(const m of moves){
        const v=ab(makeMove(pos,m),depth-1,alpha,beta);
        if(aborted)return 0;
        if(pos.turn==="b"){if(v>value){value=v;bestMove=m;}alpha=Math.max(alpha,value);}
        else {if(v<value){value=v;bestMove=m;}beta=Math.min(beta,value);}
        if(beta<=alpha)break;
      }
      tt.set(k,{depth,score:value,move:bestMove});return value;
    }
    let best=null,bestScore=-Infinity,bestDepth=0;
    const root=ordered(s,legalMoves(s),null);
    for(let d=1;d<=cfg.depth;d++){
      let local=null,score=-Infinity;
      for(const m of root){
        const v=ab(makeMove(s,m),d-1,-Infinity,Infinity);
        if(aborted)break;
        if(v>score){score=v;local=m;}
      }
      if(aborted)break;
      if(local){best=local;bestScore=score;bestDepth=d;}
    }
    if(!best)best=root[0];
    if(cfg.random>0&&root.length>1&&Math.random()<cfg.random){
      const pool=root.slice(0,Math.min(4,root.length));best=pool[Math.floor(Math.random()*pool.length)];
    }
    return {move:best,score:bestScore,nodes,depth:bestDepth,time:Math.max(0,Math.round(cfg.time-(deadline-performance.now())))};
  }
  function algebraic(m){return files[m.from.c]+(8-m.from.r)+"-"+files[m.to.c]+(8-m.to.r);}
  globalThis.ChessEngine={PIECES,initialState,cloneState,legalMoves,makeMove,terminal,inCheck,findKing,key,searchBest,levelConfig,algebraic,evaluate};
})();