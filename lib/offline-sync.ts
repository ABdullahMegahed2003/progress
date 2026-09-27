/**
 * Offline Sync Manager for Gym App
 * Automatically saves all data to localStorage first (Offline First)
 * and syncs with MongoDB Atlas API endpoints when internet is online.
 */

export async function syncDataToCloud(endpoint: string, data: unknown): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Save locally immediately
  try {
    if (endpoint.includes("workout-plan")) {
      localStorage.setItem("gym-cloud-plan-cache", JSON.stringify(data));
    } else if (endpoint.includes("workout-log")) {
      localStorage.setItem("gym-cloud-log-cache", JSON.stringify(data));
    }
  } catch (e) {
    console.warn("Local storage cache write failed:", e);
  }

  // 2. Check online status
  if (!navigator.onLine) {
    queuePendingSync(endpoint, data);
    return false;
  }

  // 3. Sync to cloud API endpoint (MongoDB Atlas)
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return true;
    } else {
      queuePendingSync(endpoint, data);
      return false;
    }
  } catch (error) {
    console.warn("Cloud sync network request failed, queued offline:", error);
    queuePendingSync(endpoint, data);
    return false;
  }
}

function queuePendingSync(endpoint: string, data: unknown) {
  try {
    const pending = JSON.parse(localStorage.getItem("gym-pending-sync") ?? "[]");
    pending.push({ endpoint, data, timestamp: Date.now() });
    localStorage.setItem("gym-pending-sync", JSON.stringify(pending));
  } catch (e) {
    console.warn("Queue pending sync error:", e);
  }
}

/**
 * Process all pending offline sync tasks when internet connection is restored
 */
export async function flushPendingSyncQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const raw = localStorage.getItem("gym-pending-sync");
  if (!raw) return;

  try {
    const pending = JSON.parse(raw) as Array<{ endpoint: string; data: unknown }>;
    if (!pending.length) return;

    localStorage.removeItem("gym-pending-sync");

    for (const item of pending) {
      await fetch(item.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.data),
      }).catch(() => undefined);
    }
  } catch (e) {
    console.warn("Error flushing pending sync queue:", e);
  }
}

// Auto-register online event listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushPendingSyncQueue();
  });
}
