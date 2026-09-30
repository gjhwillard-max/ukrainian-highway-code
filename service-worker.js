const CACHE="highway-code-v4";
const CORE=["./css/style.css","./js/app.js","./manifest.json"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE))
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  // Always try the network first for pages and JSON so GitHub updates appear immediately.
  const isNavigation=event.request.mode==="navigate";
  const isData=new URL(event.request.url).pathname.endsWith("/data/sections.json");

  if(isNavigation||isData){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          }
          return response;
        })
        .catch(()=>caches.match(event.request).then(r=>r||caches.match("./")))
    );
    return;
  }

  // Static assets can be cache-first.
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});