const { fetchAds } = require("./xmlParser");

// Simple in-memory cache with timestamp and refresh control
const REFRESH_MS = 12 * 60 * 60 * 1000; // 12 hours
let cachedProps = [];
let lastRefreshAt = 0;
let refreshingPromise = null;

async function refreshNow() {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = (async () => {
    try {
      const data = await fetchAds();
      if (Array.isArray(data)) {
        cachedProps = data;
        lastRefreshAt = Date.now();
        console.log("[Cache] Refrescado: items=", cachedProps.length);
      } else {
        console.warn("[Cache] Refresh devolvió dato no array; se ignora");
      }
    } catch (err) {
      console.error("[Cache] Error en refresh:", err);
    } finally {
      refreshingPromise = null;
    }
    return cachedProps;
  })();
  return refreshingPromise;
}

function needsRefresh() {
  return Date.now() - lastRefreshAt > REFRESH_MS;
}

async function getProps() {
  if (!cachedProps.length) {
    // Lazy first fill
    await refreshNow();
  } else if (needsRefresh()) {
    // Fire-and-forget refresh in background
    refreshNow().catch(() => {});
  }
  return cachedProps;
}

function startAutoRefresh() {
  // Initial fill without blocking server startup
  refreshNow().catch(() => {});
  setInterval(() => {
    refreshNow().catch(() => {});
  }, REFRESH_MS).unref();
}

module.exports = {
  getProps,
  startAutoRefresh,
  refreshNow,
  // Expose for observability/testing
  __cache: {
    get cachedProps() { return cachedProps; },
    get lastRefreshAt() { return lastRefreshAt; },
    REFRESH_MS,
  },
};
