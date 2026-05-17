import { ydoc } from "./syncEngine";

const HANDLE_DB = "luminosity-handle-store";
const HANDLE_KEY = "primary-backup-dir";

/**
 * Persists directory access tokens safely to internal storage.
 */
const storeHandle = async (
  handle: FileSystemDirectoryHandle,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
};

/**
 * Retrieves cached access handles safely.
 */
const getCachedHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  return new Promise((resolve) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("handles", "readonly");
      const storeReq = tx.objectStore("handles").get(HANDLE_KEY);
      storeReq.onsuccess = () => resolve(storeReq.result || null);
      storeReq.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
};

// Global persistence reference tracking
let backupDirHandle: FileSystemDirectoryHandle | null = null;

/**
 * Evaluates execution runtime support for explicit OS file mounting.
 */
export const isFileSystemAccessSupported = (): boolean => {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
};

/**
 * Invokes native file dialogs to mount user targets.
 */
export const mountSystemDirectory = async (): Promise<boolean> =>
{
  console.log("Initiating system directory mounting process...");
  if (!isFileSystemAccessSupported()) return false;
  console.log("File system access API is supported. Prompting user for directory selection...");
  try {
    // Open standard native system folder dialog
    backupDirHandle = await window.showDirectoryPicker({
      id: "luminosity-sync",
      mode: "readwrite",
    });
    await storeHandle(backupDirHandle);
    return true;
  } catch (err) {
    console.warn("User dropped directory allocation request:", err);
    return false;
  }
};

/**
 * Attempts silent restoration of prior file mappings on initialization.
 */
export const restoreCachedDirectoryAccess = async (): Promise<boolean> => {
  if (!isFileSystemAccessSupported()) return false;
  try {
    const handle = await getCachedHandle();
    if (!handle) return false;

    // Verify native security access rights silently
    const perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") {
      backupDirHandle = handle;
      return true;
    }

    // Prompt user verification if prior authorization states dropped
    const requestPerm = await handle.requestPermission({ mode: "readwrite" });
    if (requestPerm === "granted") {
      backupDirHandle = handle;
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

/**
 * Writes active Yjs document payloads directly to local system drives.
 */
export const flushDesktopBackup = async (): Promise<boolean> => {
  if (!backupDirHandle) return false;
  try {
    // Generates simple readable plain-text compilation mirrors
    const jsonTarget = await backupDirHandle.getFileHandle(
      "luminosity_ledger.json",
      { create: true },
    );
    const writableJson = await jsonTarget.createWritable();

    // Safely extract maps entries to standard structured arrays
    const entriesData = Array.from(ydoc.getMap("entries").values());
    await writableJson.write(JSON.stringify(entriesData, null, 2));
    await writableJson.close();

    return true;
  } catch (err) {
    console.error("Native write execution encountered fault:", err);
    return false;
  }
};

// Bind update flush loop directly to core sync runtime. Trailing-edge debounce —
// rapid bursts of edits collapse into a single write, and a write in progress
// won't overlap with the next one (in-flight guard).
const FLUSH_DEBOUNCE_MS = 2000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let pending = false;

const scheduleFlush = () => {
  if (!backupDirHandle) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (flushing) {
      pending = true;
      return;
    }
    flushing = true;
    try {
      await flushDesktopBackup();
    } finally {
      flushing = false;
      if (pending) {
        pending = false;
        scheduleFlush();
      }
    }
  }, FLUSH_DEBOUNCE_MS);
};

ydoc.on("update", scheduleFlush);
