// Enhanced drag and drop functionality for file indexing

// Check if the File System Access API is available
const hasFileSystemAccessAPI = "showDirectoryPicker" in window;

// Detect if app is running as an installed PWA
function isInstalledPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone ||
    document.referrer.includes("android-app://")
  );
}

// Main initialization function
function initFileIndexing() {
  // Get DOM elements
  const dropZone = document.getElementById("dropZone");
  const statusElement = document.getElementById("indexStatus");
  const directoryInput = document.getElementById("directoryPath");
  const indexButton = document.getElementById("indexFilesBtn");
  const progressBar = document.querySelector(".indexing-progress .bar");
  const progressContainer = document.querySelector(".indexing-progress");

  if (!dropZone || !statusElement || !indexButton) return; // Early return if elements missing

  // Check if we're running as an installed app and update UI accordingly
  if (isInstalledPWA()) {
    document.body.classList.add("app-installed");

    // Enable directory path input if File System Access API is available
    if (hasFileSystemAccessAPI) {
      directoryInput.disabled = false;
      directoryInput.placeholder =
        "Enter directory path or click 'Browse Directories'";
      indexButton.textContent = "Browse Directories";

      // Add badge
      const badge = document.createElement("div");
      badge.className = "app-badge";
      badge.textContent = "Enhanced Mode";
      document.getElementById("file-index")?.appendChild(badge);

      // Update status
      statusElement.textContent =
        "App installed with enhanced file access capabilities";
      statusElement.classList.add("enhanced-status");
    }
  } else {
    // Web version - update UI to focus on drag and drop
    indexButton.textContent = "Select Files";
    if (!hasFileSystemAccessAPI) {
      indexButton.disabled = true;
      indexButton.title = "Install the app for enhanced file access";
    }
  }

  // Initialize drag and drop
  initDragAndDrop(dropZone, statusElement, progressContainer, progressBar);

  // Initialize directory selection
  indexButton.addEventListener("click", async () => {
    if (hasFileSystemAccessAPI) {
      try {
        // Show file picker
        if (isInstalledPWA()) {
          statusElement.textContent = "Please select a directory...";
          const dirHandle = await window.showDirectoryPicker();
          directoryInput.value = dirHandle.name;

          await processDirectoryHandle(
            dirHandle,
            statusElement,
            progressContainer,
            progressBar
          );
        } else {
          statusElement.textContent = "Please select files...";
          const fileHandles = await window.showOpenFilePicker({
            multiple: true,
          });

          const files = await Promise.all(
            fileHandles.map((handle) => handle.getFile())
          );
          await processFiles(
            files,
            statusElement,
            progressContainer,
            progressBar
          );
        }
      } catch (error) {
        console.error("File selection error:", error);
        if (error.name === "AbortError") {
          statusElement.textContent = "File selection cancelled.";
        } else {
          statusElement.textContent =
            "Error accessing files. Please try again.";
        }
        hideProgress(progressContainer);
      }
    } else {
      statusElement.textContent =
        "File system access not available in this browser. Please use drag and drop instead.";
    }
  });
}

// Initialize drag and drop functionality
function initDragAndDrop(
  dropZone,
  statusElement,
  progressContainer,
  progressBar
) {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, { passive: true });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, { passive: true });
  });

  dropZone.addEventListener("drop", handleDrop);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropZone.classList.add("highlight");
  }

  function unhighlight() {
    dropZone.classList.remove("highlight");
  }

  async function handleDrop(e) {
    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    statusElement.textContent = "Processing dropped items...";
    showProgress(progressContainer);

    if (items.length > 0 && items[0].webkitGetAsEntry) {
      await processDataTransferItems(
        items,
        statusElement,
        progressContainer,
        progressBar
      );
    } else if (files.length > 0) {
      await processFiles(
        Array.from(files),
        statusElement,
        progressContainer,
        progressBar
      );
    } else {
      statusElement.textContent = "No valid files or folders were dropped.";
      hideProgress(progressContainer);
    }
  }
}

// Process items from drag and drop that may include directories
async function processDataTransferItems(
  items,
  statusElement,
  progressContainer,
  progressBar
) {
  const fileEntries = [];
  const processPromises = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        processPromises.push(processEntry(entry, fileEntries));
      }
    }
  }

  try {
    await Promise.all(processPromises);

    if (fileEntries.length === 0) {
      statusElement.textContent = "No valid files found to index.";
      hideProgress(progressContainer);
      return;
    }

    statusElement.textContent = `Getting file content for ${fileEntries.length} files...`;

    const filePromises = fileEntries.map(
      (entry) =>
        new Promise((resolve, reject) => {
          entry.file((file) => {
            file.relativePath = entry.fullPath;
            resolve(file);
          }, reject);
        })
    );

    const files = await Promise.all(filePromises);
    await processFiles(files, statusElement, progressContainer, progressBar);
  } catch (error) {
    console.error("Error processing entries:", error);
    statusElement.textContent = "Error processing files. Please try again.";
    hideProgress(progressContainer);
  }
}

// Recursively process file system entries (files and directories)
async function processEntry(entry, fileEntries) {
  if (entry.isFile) {
    fileEntries.push(entry);
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let entries = [];

    const readEntries = () =>
      new Promise((resolve, reject) => {
        reader.readEntries((results) => {
          if (results.length) {
            entries = entries.concat(Array.from(results));
            readEntries().then(resolve).catch(reject);
          } else {
            resolve();
          }
        }, reject);
      });

    await readEntries();

    for (const childEntry of entries) {
      await processEntry(childEntry, fileEntries);
    }
  }
}

// Process a directory handle (for File System Access API)
async function processDirectoryHandle(
  dirHandle,
  statusElement,
  progressContainer,
  progressBar,
  basePath = ""
) {
  const files = [];

  try {
    statusElement.textContent = `Indexing directory: ${dirHandle.name}...`;
    showProgress(progressContainer);

    for await (const entry of dirHandle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === "file") {
        try {
          const file = await entry.getFile();
          file.relativePath = entryPath;
          files.push(file);
        } catch (error) {
          console.error(`Error accessing file ${entryPath}:`, error);
        }
      } else if (entry.kind === "directory") {
        try {
          const subdirFiles = await processDirectoryHandle(
            entry,
            statusElement,
            progressContainer,
            progressBar,
            entryPath
          );
          files.push(...subdirFiles);
        } catch (error) {
          console.error(`Error accessing subdirectory ${entryPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error traversing directory ${dirHandle.name}:`, error);
  }

  if (!basePath) {
    if (files.length > 0) {
      await processFiles(files, statusElement, progressContainer, progressBar);
    } else {
      statusElement.textContent =
        "No files found to index in the selected directory.";
      hideProgress(progressContainer);
    }
  }

  return files;
}

// Process files and extract metadata/content
async function processFiles(
  files,
  statusElement,
  progressContainer,
  progressBar
) {
  if (!files || files.length === 0) {
    statusElement.textContent = "No files to process.";
    hideProgress(progressContainer);
    return;
  }

  statusElement.textContent = `Indexing ${files.length} files...`;
  showProgress(progressContainer);

  const fileIndex = {};
  let processedCount = 0;

  const indexPromises = files.map((file) => {
    return new Promise((resolve) => {
      const metadata = {
        name: file.name,
        path: file.relativePath || file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      // Read content for text files, CSVs, DOCX, PDFs, and PowerPoint files
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(md|json|csv|txt|js|html|css|docx|pdf|ppt|pptx)$/i)
      ) {
        const reader = new FileReader();
        reader.onload = function (e) {
          let content = e.target.result;
          if (file.name.match(/\.(csv|docx|pdf|ppt|pptx)$/i)) {
            content = processSpecialFileContent(file, content);
          }
          metadata.content = content || "Content not available";
          fileIndex[metadata.path] = metadata;

          processedCount++;
          if (progressBar) {
            progressBar.style.width = `${
              (processedCount / files.length) * 100
            }%`;
          }
          resolve();
        };
        reader.onerror = function (error) {
          console.error("Error reading file:", error);
          fileIndex[metadata.path] = metadata;

          processedCount++;
          if (progressBar) {
            progressBar.style.width = `${
              (processedCount / files.length) * 100
            }%`;
          }
          resolve();
        };
        reader.readAsText(file); // Read as text for processing
      } else {
        // For non-text/binary files, provide a download link or preview
        metadata.content =
          '<a href="' +
          URL.createObjectURL(file) +
          '" download="' +
          file.name +
          '" target="_blank">Download ' +
          file.name +
          "</a>";
        fileIndex[metadata.path] = metadata;

        processedCount++;
        if (progressBar) {
          progressBar.style.width = `${(processedCount / files.length) * 100}%`;
        }
        resolve();
      }
    });
  });

  try {
    await Promise.all(indexPromises);

    // Only save and update UI in production or on user action (not automatically in development)
    if (process.env.NODE_ENV === "production" || isInstalledPWA()) {
      await saveFileIndex(fileIndex);
      updateIndexedFilesUI(fileIndex);
    } else {
      console.log("Skipping file index save/update in development mode");
      updateIndexedFilesUI(fileIndex); // Show files in development for testing
    }

    statusElement.textContent = `Indexed ${files.length} files successfully.`;
  } catch (error) {
    console.error("Error processing files:", error);
    statusElement.textContent = "Error processing files. Please try again.";
  }

  setTimeout(() => {
    hideProgress(progressContainer);
    if (progressBar) progressBar.style.width = "0%";
  }, 1000);
}

// Process special file types (CSV, DOCX, PDF, PPT/PPTX)
function processSpecialFileContent(file, content) {
  switch (file.name.split(".").pop().toLowerCase()) {
    case "csv":
      // Parse CSV content (simple parsing, assuming comma-separated)
      return content
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim()))
        .map((row) => row.join(" | "))
        .join("\n");
    case "docx":
    case "ppt":
    case "pptx":
      // For DOCX and PowerPoint, provide a download link or basic text extraction
      return (
        "Preview not available. <a href='" +
        URL.createObjectURL(file) +
        "' download='" +
        file.name +
        "' target='_blank'>Download " +
        file.name +
        "</a>"
      );
    case "pdf":
      // For PDFs, provide a download link or embed if possible (basic approach here)
      return (
        "Preview not available. <a href='" +
        URL.createObjectURL(file) +
        "' download='" +
        file.name +
        "' target='_blank'>Download " +
        file.name +
        "</a>"
      );
    default:
      return content || "Content not available";
  }
}

// Show progress indicator
function showProgress(progressContainer) {
  if (progressContainer) {
    progressContainer.classList.add("active");
  }
}

// Hide progress indicator
function hideProgress(progressContainer) {
  if (progressContainer) {
    progressContainer.classList.remove("active");
  }
}

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

// Update the UI to show indexed files
function updateIndexedFilesUI(fileIndex) {
  const filePreview = document.getElementById("file-preview");
  if (!filePreview) return;

  let html = "<h2>Indexed Files</h2>";
  html += '<ul class="indexed-files">';

  // List individual file names with clickable links
  Object.values(fileIndex).forEach((file) => {
    html += `<li data-path="${file.path}" class="file-item">`;
    html += `<span class="file-name">${file.name}</span>`;
    html += `<span class="file-path">(${file.path})</span>`;
    html += `<span class="file-size">${formatFileSize(file.size)}</span>`;
    html += `</li>`;
  });

  html += "</ul>";

  filePreview.innerHTML = html;

  // Add click handlers for file items
  document.querySelectorAll(".indexed-files .file-item").forEach((item) => {
    item.addEventListener("click", function () {
      const path = this.getAttribute("data-path");
      const file = fileIndex[path];
      if (file) {
        showFileContent(file, fileIndex); // Pass fileIndex to showFileContent
      }
    });
  });
}

// Show file content in the preview pane
function showFileContent(file, fileIndex) {
  const filePreview = document.getElementById("file-preview");
  if (!filePreview) return;

  let html = `<h2>File Preview: ${file.name}</h2>`;
  html += `<p><strong>Path:</strong> ${file.path}</p>`;
  html += `<p><strong>Size:</strong> ${formatFileSize(file.size)}</p>`;
  html += `<p><strong>Last Modified:</strong> ${new Date(
    file.lastModified
  ).toLocaleString()}</p>`;

  // Handle content display for different file types
  if (typeof file.content === "string" && file.content.includes("<a href=")) {
    html += `<div class="file-content">${file.content}</div>`;
  } else if (file.content) {
    html += '<div class="file-content">';
    html += `<pre>${escapeHtml(file.content)}</pre>`;
    html += "</div>";
  } else {
    html += "<p>Content preview not available for this file type.</p>";
  }

  html +=
    '<button id="backToFiles" style="margin-top: 16px;">Back to Indexed Files</button>';

  filePreview.innerHTML = html;

  // Add click handler for back button, now with access to fileIndex
  document
    .getElementById("backToFiles")
    .addEventListener("click", () => updateIndexedFilesUI(fileIndex));
}

// Initialize search functionality
function initSearch() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchQuery");
  const filePreview = document.getElementById("file-preview");

  if (!searchBtn || !searchInput || !filePreview) return;

  searchBtn.addEventListener("click", () => performSearch(searchInput.value));
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch(searchInput.value);
  });

  async function performSearch(query) {
    if (!query.trim()) {
      filePreview.innerHTML =
        "<h2>Preview</h2><p>Enter a search term to find files.</p>";
      return;
    }

    try {
      let fileIndex;
      try {
        fileIndex = JSON.parse(localStorage.getItem("fileIndex")) || {};
      } catch (e) {
        fileIndex = await searchInIndexedDB(query);
      }

      displaySearchResults(query, fileIndex);
    } catch (error) {
      console.error("Search error:", error);
      filePreview.innerHTML =
        "<h2>Search Error</h2><p>Error accessing the file index.</p>";
    }
  }

  // Search in IndexedDB
  function searchInIndexedDB(query) {
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

  // Display search results
  function displaySearchResults(query, fileIndex) {
    if (process.env.NODE_ENV === "development") return; // Skip UI updates in development

    query = query.toLowerCase();
    const results = [];

    Object.values(fileIndex).forEach((file) => {
      if (file.name.toLowerCase().includes(query)) {
        results.push(file);
        return;
      }
      if (file.content && file.content.toLowerCase().includes(query)) {
        results.push(file);
      }
    });

    if (results.length === 0) {
      filePreview.innerHTML =
        "<h2>No Results</h2><p>No files match your search query.</p>";
    } else {
      let html = `<h2>Search Results for "${query}"</h2>`;
      html += '<ul class="search-results">';

      results.forEach((file) => {
        html += `<li data-path="${file.path}" class="file-item">`;
        html += `<strong>${file.name}</strong>`;
        html += `<span class="file-path">(${file.path})</span>`;
        html += `<span class="file-size">${formatFileSize(file.size)}</span>`;
        html += `</li>`;
      });

      html += "</ul>";
      filePreview.innerHTML = html;

      document
        .querySelectorAll(".search-results .file-item")
        .forEach((item) => {
          item.addEventListener("click", function () {
            const path = this.getAttribute("data-path");
            const file = fileIndex[path];
            if (file) showFileContent(file, fileIndex);
          });
        });
    }
  }
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "'");
}

// Setup installation detection and handling
function setupInstallDetection() {
  const installButton = document.getElementById("buttonInstall");
  if (!installButton) return;

  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = "block";
    console.log("App can be installed - showing install button");
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      console.log("Cannot install: No installation prompt available");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Installation ${outcome}`);

    if (outcome === "accepted") {
      installButton.style.display = "none";
    }

    deferredPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    console.log("App was installed");
    installButton.style.display = "none";
    document.body.classList.add("app-installed");

    const directoryInput = document.getElementById("directoryPath");
    if (directoryInput && hasFileSystemAccessAPI) {
      directoryInput.disabled = false;
      directoryInput.placeholder =
        "Enter directory path or click 'Browse Directories'";
    }

    const indexButton = document.getElementById("indexFilesBtn");
    if (indexButton && hasFileSystemAccessAPI) {
      indexButton.textContent = "Browse Directories";
    }

    const statusElement = document.getElementById("indexStatus");
    if (statusElement) {
      statusElement.textContent =
        "App installed with enhanced file access capabilities";
      statusElement.classList.add("enhanced-status");
    }

    const fileIndexCard = document.getElementById("file-index");
    if (fileIndexCard && !fileIndexCard.querySelector(".app-badge")) {
      const badge = document.createElement("div");
      badge.className = "app-badge";
      badge.textContent = "Enhanced Mode";
      fileIndexCard.appendChild(badge);
    }
  });

  if (isInstalledPWA()) {
    document.body.classList.add("app-installed");
    installButton.style.display = "none";

    const fileIndexCard = document.getElementById("file-index");
    if (
      fileIndexCard &&
      !fileIndexCard.querySelector(".app-badge") &&
      hasFileSystemAccessAPI
    ) {
      const badge = document.createElement("div");
      badge.className = "app-badge";
      badge.textContent = "Enhanced Mode";
      fileIndexCard.appendChild(badge);
    }
  }
}

// Export functions for use in app.js
export {
  initFileIndexing,
  initSearch,
  setupInstallDetection,
  isInstalledPWA,
  hasFileSystemAccessAPI,
};
