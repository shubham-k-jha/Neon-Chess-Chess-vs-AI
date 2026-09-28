
const fs=require('fs'),vm=require('vm');const ctx={console,performance,globalThis:{}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('../js/engine.js','utf8'),ctx);const E=ctx.ChessEngine;function A(x,m){if(!x)throw Error(m)}
function move(s,fr,to){let m=E.legalMoves(s).find(m=>m.from.r===fr[0]&&m.from.c===fr[1]&&m.to.r===to[0]&&m.to.c===to[1]);A(m,`missing ${fr}->${to}`);return E.makeMove(s,m)}
let s=E.initialState();s.positions[E.key(s)]=1;
s=move(s,[6,4],[4,4]);s=move(s,[1,4],[3,4]);s=move(s,[7,6],[5,5]);s=move(s,[0,6],[2,5]);s=move(s,[7,5],[5,3]);s=move(s,[0,5],[1,4]); // white bishop out, black bishop out
A(E.legalMoves(s).some(m=>m.castle==='k'),'white castle available'); 
s=move(s,[7,4],[7,6]);A(s.board[7][5]?.t==='r'&&s.board[7][5]?.c==='w','rook castled');
let e=E.initialState();e.positions[E.key(e)]=1;
e=move(e,[6,4],[4,4]);e=move(e,[1,0],[2,0]);e=move(e,[4,4],[3,4]);e=move(e,[1,3],[3,3]);let ep=E.legalMoves(e).find(m=>m.ep);A(ep,'en passant exists');e=E.makeMove(e,ep);A(!e.board[3][3],'captured pawn removed');
let p=E.initialState();p.board=Array.from({length:8},()=>Array(8).fill(null));p.turn='w';p.board[1][0]={c:'w',t:'p'};p.board[7][4]={c:'w',t:'k'};p.board[0][4]={c:'b',t:'k'};p.cast={w:{k:false,q:false},b:{k:false,q:false}};let pm=E.legalMoves(p).find(m=>m.promotion);A(pm,'promotion exists');pm.promote='q';p=E.makeMove(p,pm);A(p.board[0][0].t==='q','promotion applied');
console.log('PASS castling en-passant promotion');
