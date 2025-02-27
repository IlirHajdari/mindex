// Save the file index
async function saveFileIndex(fileIndex) {
  try {
    // Try localStorage first (small data only)
    const stringifiedIndex = JSON.stringify(fileIndex);
    if (stringifiedIndex.length < 5 * 1024 * 1024) {
      // 5MB limit as an example
      localStorage.setItem("fileIndex", stringifiedIndex);
    } else {
      await saveToIndexedDB(fileIndex);
    }
  } catch (e) {
    console.error("Error saving file index to localStorage:", e);
    await saveToIndexedDB(fileIndex);
  }
}

// Save index to IndexedDB
async function saveToIndexedDB(fileIndex) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MiniIndexDB", 1);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "path" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["files"], "readwrite");
      const objectStore = transaction.objectStore("files");

      objectStore.clear();

      Object.values(fileIndex).forEach((file) => {
        objectStore.add(file);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    };
  });
}

// New function to get data from IndexedDB (this wasn't in the original but is needed)
async function getFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MiniIndexDB", 1);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["files"], "readonly");
      const objectStore = transaction.objectStore("files");
      const files = {};

      objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          files[cursor.value.path] = cursor.value;
          cursor.continue();
        } else {
          resolve(files);
        }
      };
    };
  });
}

export { saveFileIndex, saveToIndexedDB, getFromIndexedDB };
