// Service worker mínimo: só existe para o navegador oferecer "instalar app".
// Não guarda nada em cache de propósito: os posts precisam estar sempre atualizados.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
