// Import all needed components from other modules
import {
  hasFileSystemAccessAPI,
  isInstalledPWA,
} from "./utils/feature-detection.js";
import { initDragAndDrop } from "./file-operations/drag-drop.js";
import {
  processFiles,
  processDirectoryHandle,
} from "./file-operations/file-processing.js";
import { initSearch } from "./search/search-engine.js";
import { showProgress, hideProgress } from "./ui/progress-handler.js";

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

// Set up globalThis or window references for UI integration files
window.showFileContent = showFileContent;
window.updateIndexedFilesUI = updateIndexedFilesUI;

// Export functions for use in app.js
export {
  initFileIndexing,
  initSearch,
  setupInstallDetection,
  isInstalledPWA,
  hasFileSystemAccessAPI,
};

// Note: You'll need to import these for the global references
import { showFileContent, updateIndexedFilesUI } from "./ui/file-display.js";
