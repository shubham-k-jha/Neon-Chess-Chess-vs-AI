importScripts("engine.js");
self.onmessage=e=>{
  if(e.data.type==="think"){
    try{
      const s=e.data.state;
      const result=ChessEngine.searchBest(s,e.data.level);
      self.postMessage({type:"move",...result});
    }catch(err){self.postMessage({type:"error",message:err?.message||String(err)})}
  }
};