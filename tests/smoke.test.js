const G=require('./harness.js');const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
for(const id of Object.keys(G.RCQ.maps).concat(Object.keys(G.RCQ.rooms))){const lv=G.buildLevel(id),m=G.buildMesh(lv);ok(m.main.count>1000,id+' builds '+m.main.count+' vertices');}
G.startGame(null);ok(G.mode=='play'&&G.lv.id=='ow:2,1','a new game starts in Capitol Square');
