// Keeps the app working without internet, and picks up new versions right away.
const CACHE="rounds-v2";
const CORE=["./","./index.html","./manifest.json","./icon-180.png","./icon-192.png","./icon-512.png"];
const LIBS=[
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
 "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"
];
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    for(const u of CORE){try{const r=await fetch(u,{cache:"no-cache"});if(r.ok)await c.put(u,r)}catch(err){}}
    for(const u of LIBS){try{const r=await fetch(u,{mode:"cors"});if(r.ok)await c.put(u,r)}catch(err){}}
  })());
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  const isPage=req.mode==="navigate"||(url.origin===location.origin&&(url.pathname.endsWith("/")||url.pathname.endsWith("index.html")));
  if(isPage){
    // network first: always try the newest version, fall back to the saved copy when offline
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      try{const res=await fetch(req,{cache:"no-cache"});if(res&&res.ok)c.put("./index.html",res.clone());return res}
      catch(err){return (await c.match(req,{ignoreSearch:true}))||(await c.match("./index.html"))||Response.error()}
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(req,res.clone());return res}).catch(()=>hit);
    return hit||net;
  })());
});
