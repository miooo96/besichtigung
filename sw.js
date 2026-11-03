/* Offline-Speicher fuer das Besichtigungs-Werkzeug.
   Netz zuerst, Zwischenspeicher nur wenn kein Netz da ist: so gibt es nie
   eine alte Fassung, solange Empfang besteht (Lehre vom 05.09.2026), und im
   Funkloch laeuft die Seite trotzdem. Es werden nur die Programmdateien
   gespeichert - die Kundenliste liegt im Geraetespeicher der Seite. */
const CACHE = "besichtigung-v12";  // v12 03.11.2026: Name in jedem Foto eingebrannt + Kopfzeile auf jeder Seite
const DATEIEN = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", ev => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    fetch(ev.request).then(antwort => {
      const kopie = antwort.clone();
      caches.open(CACHE).then(c => c.put(ev.request, kopie));
      return antwort;
    }).catch(() => caches.match(ev.request).then(r => r || caches.match("index.html")))
  );
});
