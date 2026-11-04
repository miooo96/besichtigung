/* Offline-Speicher fuer das Besichtigungs-Werkzeug.
   Netz zuerst, Zwischenspeicher nur wenn kein Netz da ist: so gibt es nie
   eine alte Fassung, solange Empfang besteht (Lehre vom 05.09.2026), und im
   Funkloch laeuft die Seite trotzdem. Es werden nur die Programmdateien
   gespeichert - die Kundenliste liegt im Geraetespeicher der Seite. */
const CACHE = "besichtigung-v24";  // v24 04.11.2026: Knopf "Aktualisieren", Netz ohne 10-Min-Zwischenspeicher
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
  // "no-cache": immer beim Server nachfragen, ob es Neues gibt. Sonst liefert der Browser bis zu
  // 10 Minuten die alte Fassung (GitHub Pages: max-age=600) - Mirko 04.11.2026 sah deshalb noch die alte.
  // Seitenaufrufe (navigate) duerfen keine Optionen bekommen -> ueber die Adresse; Umleitung -> normal holen.
  const r = ev.request;
  const netz = r.mode === "navigate"
    ? fetch(r.url, { cache: "no-cache" }).then(a => a.redirected ? fetch(r) : a)
    : fetch(r, { cache: "no-cache" });
  ev.respondWith(
    netz.then(antwort => {
      const kopie = antwort.clone();
      caches.open(CACHE).then(c => c.put(ev.request, kopie));
      return antwort;
    }).catch(() => caches.match(ev.request).then(r => r || caches.match("index.html")))
  );
});
