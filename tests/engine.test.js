
const fs=require('fs'),vm=require('vm');const ctx={console,performance,globalThis:{}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('../js/engine.js','utf8'),ctx);
const E=ctx.ChessEngine; let s=E.initialState(); s.positions[E.key(s)]=1;
function assert(x,m){if(!x)throw Error(m)}
assert(E.legalMoves(s,'w').length===20,'initial white moves');
let e4=E.legalMoves(s).find(m=>m.from.r===6&&m.from.c===4&&m.to.r===4&&m.to.c===4);assert(e4,'e4 exists');s=E.makeMove(s,e4);
assert(E.legalMoves(s,'b').length===20,'initial black response');
let d5=E.legalMoves(s).find(m=>m.from.r===1&&m.from.c===3&&m.to.r===3&&m.to.c===3);s=E.makeMove(s,d5);
let exd5=E.legalMoves(s).find(m=>m.from.r===4&&m.from.c===4&&m.to.r===3&&m.to.c===3);assert(exd5,'exd5 exists');s=E.makeMove(s,exd5);
assert(!E.inCheck(s,'w'),'white not check');
let ai=E.searchBest(s,1);assert(ai.move,'AI returned move');assert(E.legalMoves(s,'b').some(m=>m.from.r===ai.move.from.r&&m.from.c===ai.move.from.c&&m.to.r===ai.move.to.r&&m.to.c===ai.move.to.c),'AI move legal');
console.log('PASS basic + AI');
