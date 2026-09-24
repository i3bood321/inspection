// Keeps the app working without internet (weak signal in the kitchen).
const CACHE="rounds-v1";
const CORE=["./","./index.html","./manifest.json","./icon-180.png","./icon-192.png","./icon-512.png"];
const LIBS=[
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
 "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"
];
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await c.addAll(CORE);
    for(const u of LIBS){try{const r=await fetch(u,{mode:"cors"});if(r.ok)await c.put(u,r)}catch(err){}}
  })());
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(req,res.clone());return res}).catch(()=>hit);
    return hit||net;
  })());
});
