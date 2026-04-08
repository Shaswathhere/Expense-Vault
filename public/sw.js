const CACHE_NAME = "expense-vault-v1";
const API_CACHE_NAME = "expense-vault-api-v1";

const APP_SHELL_FILES = [
  "/",
  "/manifest.json",
];

// ── Install: pre-cache app shell ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: route requests to the right strategy ─────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Never cache _next chunks in development — they change on every rebuild
  if (url.pathname.startsWith("/_next/")) return;

  // API requests -> network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation requests -> network-first (so auth redirects work)
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (images, manifest) -> cache-first
  event.respondWith(cacheFirst(request));
});

// ── Cache-first strategy ────────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// ── Network-first strategy (for API and navigation) ─────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ── Background sync for offline transaction drafts ──────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-drafts") {
    event.waitUntil(syncDraftTransactions());
  }
});

async function syncDraftTransactions() {
  const db = await openDraftsDB();
  const tx = db.transaction("drafts", "readonly");
  const store = tx.objectStore("drafts");

  const drafts = await idbGetAll(store);
  tx.oncomplete = () => db.close();

  for (const draft of drafts) {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.data),
      });

      if (response.ok) {
        const delDb = await openDraftsDB();
        const delTx = delDb.transaction("drafts", "readwrite");
        delTx.objectStore("drafts").delete(draft.id);
        await new Promise((resolve) => {
          delTx.oncomplete = resolve;
        });
        delDb.close();
      }
    } catch {
      // Will retry on next sync
    }
  }
}

// ── IndexedDB helpers ───────────────────────────────────────────────────────
function openDraftsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("expense-vault-drafts", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
