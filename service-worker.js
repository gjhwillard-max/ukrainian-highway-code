const CACHE="highway-code-v5";
const CORE=["./","./index.html","./css/style.css","./js/app.js","./manifest.json","./data/sections.json"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
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
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const freshFirst=event.request.mode==="navigate" ||
    (sameOrigin && (
      url.pathname.endsWith(".json") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".html")
    ));

  if(freshFirst){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./")))
    );
    return;
  }

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