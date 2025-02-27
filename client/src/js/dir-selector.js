// Connect directory selection button to existing functionality
document.addEventListener("DOMContentLoaded", function () {
  const directorySelectBtn = document.getElementById("directorySelectBtn");
  const indexFilesPanel = document.getElementById("index-files-panel");
  const closeButtons = document.querySelectorAll(".close-btn");
  const originalDropZone = document.getElementById("dropZone");
  const indexBtn = document.getElementById("indexBtn");

  // Show/hide panel functions
  function showPanel(panel) {
    if (panel) panel.classList.add("visible");
  }

  function hidePanel(panel) {
    if (panel) panel.classList.remove("visible");
  }

  // Show directory selection modal when button is clicked
  if (directorySelectBtn) {
    directorySelectBtn.addEventListener("click", function () {
      showPanel(indexFilesPanel);
    });
  }

  // Show index panel when index button is clicked
  if (indexBtn && indexFilesPanel) {
    indexBtn.addEventListener("click", function () {
      showPanel(indexFilesPanel);
    });
  }

  // Close buttons for panels
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest(".modal-panel");
      hidePanel(panel);
    });
  });

  // Connect the modal elements to the original functionality
  const modalIndexFilesBtn = document.getElementById("modalIndexFilesBtn");
  const originalIndexFilesBtn = document.getElementById("indexFilesBtn");

  if (modalIndexFilesBtn && originalIndexFilesBtn) {
    modalIndexFilesBtn.addEventListener("click", function () {
      // Simulate a click on the original button
      originalIndexFilesBtn.click();
    });
  }

  // Mirror the directory path between modal and original
  const modalDirectoryPath = document.getElementById("modalDirectoryPath");
  const originalDirectoryPath = document.getElementById("directoryPath");

  if (modalDirectoryPath && originalDirectoryPath) {
    // When original changes, update modal
    originalDirectoryPath.addEventListener("change", function () {
      modalDirectoryPath.value = originalDirectoryPath.value;
    });

    // When modal changes, update original
    modalDirectoryPath.addEventListener("change", function () {
      originalDirectoryPath.value = modalDirectoryPath.value;
    });

    // Initial value
    modalDirectoryPath.value = originalDirectoryPath.value;

    // Enable if installed
    if (document.body.classList.contains("app-installed")) {
      modalDirectoryPath.disabled = false;
    }
  }

  // Mirror the index status between modal and original
  const modalIndexStatus = document.getElementById("modalIndexStatus");
  const originalIndexStatus = document.getElementById("indexStatus");

  if (modalIndexStatus && originalIndexStatus) {
    // Create a MutationObserver to watch for changes to the original status
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        modalIndexStatus.textContent = originalIndexStatus.textContent;
      });
    });

    // Start observing
    observer.observe(originalIndexStatus, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  // Connect the modal drop zone to the original drop zone
  const modalDropZone = document.getElementById("modalDropZone");

  if (modalDropZone && originalDropZone) {
    // Prevent defaults for all drag events
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      modalDropZone.addEventListener(
        eventName,
        function (e) {
          e.preventDefault();
          e.stopPropagation();
        },
        false
      );
    });

    // Highlight effects
    ["dragenter", "dragover"].forEach((eventName) => {
      modalDropZone.addEventListener(
        eventName,
        function () {
          modalDropZone.classList.add("highlight");
          // Also highlight the original drop zone for any event handlers watching it
          originalDropZone.classList.add("highlight");
        },
        false
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      modalDropZone.addEventListener(
        eventName,
        function () {
          modalDropZone.classList.remove("highlight");
          // Also remove highlight from the original drop zone
          originalDropZone.classList.remove("highlight");
        },
        false
      );
    });

    // Handle drop by forwarding to original drop zone
    modalDropZone.addEventListener(
      "drop",
      function (e) {
        // Create a simulated drop event for the original drop zone
        const event = new Event("drop", { bubbles: true });

        // Copy dataTransfer to the new event
        // Note: This uses defineProperty as dataTransfer is normally read-only
        Object.defineProperty(event, "dataTransfer", {
          value: e.dataTransfer,
          writable: false,
        });

        // Dispatch the event to the original drop zone
        originalDropZone.dispatchEvent(event);
      },
      false
    );
  }

  // Check for installed state and update UI accordingly
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone ||
    document.referrer.includes("android-app://")
  ) {
    document.body.classList.add("app-installed");

    // Enable directory path input in the modal
    if (modalDirectoryPath) {
      modalDirectoryPath.disabled = false;
    }
  }
});

// Add an observer for changes to the file preview section
const filePreview = document.getElementById("file-preview");
if (filePreview) {
  // Create an observer to watch for changes to the file preview
  const observer = new MutationObserver(function (mutations) {
    // When the file preview updates (e.g., with indexed files), update the main table
    if (filePreview.querySelector(".indexed-files")) {
      // Extract the files from the indexed-files list
      const fileItems = filePreview.querySelectorAll(".file-item");
      const files = [];

      fileItems.forEach((item) => {
        const name = item.querySelector(".file-name")?.textContent || "";
        const path = item.querySelector(".file-path")?.textContent || "";
        // Extract date and size if available
        const dateMatch = item.textContent.match(/Modified: ([^,]+)/);
        const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();

        files.push({ name, path, date });
      });

      // Update the main table
      updateMainTable(files);
    }
  });

  // Start observing
  observer.observe(filePreview, { childList: true, subtree: true });
}

// Function to update the main table with files
function updateMainTable(files) {
  const filesTable = document.getElementById("filesTable");
  if (!filesTable) return;

  filesTable.innerHTML = "";

  files.forEach((file) => {
    const row = document.createElement("div");
    row.className = "table-row";

    row.innerHTML = `
      <div class="name-column">${file.name}</div>
      <div class="path-column">${file.path}</div>
      <div class="date-column">${file.date}</div>
      <div class="count-column">${getTotalFiles()}</div>
    `;

    filesTable.appendChild(row);
  });
}

// Function to get the total number of indexed files
function getTotalFiles() {
  // Try to get from localStorage or another source
  const storedCount = localStorage.getItem("totalIndexedFiles");
  if (storedCount) {
    return parseInt(storedCount, 10);
  }

  // If not available, count the files in the current view
  const filePreview = document.getElementById("file-preview");
  if (filePreview) {
    const fileItems = filePreview.querySelectorAll(".file-item");
    return fileItems.length;
  }

  return 0;
}

// Track the total number of indexed files
function updateTotalFilesCount(newFiles) {
  let currentTotal = parseInt(
    localStorage.getItem("totalIndexedFiles") || "0",
    10
  );
  currentTotal += newFiles;
  localStorage.setItem("totalIndexedFiles", currentTotal.toString());
  return currentTotal;
}

// Observe indexStatus for changes that indicate new files were indexed
const indexStatus = document.getElementById("indexStatus");
if (indexStatus) {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const text = indexStatus.textContent;
      // Check if indexing completed
      if (text.includes("Indexed") && text.includes("files successfully")) {
        // Extract the number of files indexed
        const match = text.match(/Indexed (\d+) files/);
        if (match && match[1]) {
          const filesIndexed = parseInt(match[1], 10);
          // Update the total count
          updateTotalFilesCount(filesIndexed);
        }
      }
    });
  });

  // Start observing
  observer.observe(indexStatus, { childList: true, characterData: true });
}
