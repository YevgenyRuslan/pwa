self.addEventListener("install", (event) => {
    console.log("Service Worker instalado!");
    event.waitUntil(
      caches.open("meu-pwa-cache").then((cache) => {
        return cache.addAll(["/"]);
      })
    );
  });
  
  self.addEventListener("fetch", (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  
  self.addEventListener("activate", (event) => {
    console.log("Service Worker ativado!");
  });
  