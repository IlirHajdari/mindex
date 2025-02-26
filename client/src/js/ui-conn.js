// This file connects the new UI elements to your existing functionality
// Add this to your main JS file or include it separately

document.addEventListener("DOMContentLoaded", function () {
  // Connect sidebar buttons to panels
  const filtersBtn = document.getElementById("filtersBtn");
  const indexBtn = document.getElementById("indexBtn");
  const filtersPanel = document.getElementById("filters-panel");
  const indexFilesPanel = document.getElementById("index-files-panel");

  // Move the dropZone to the index panel for functionality
  const originalDropZone = document.getElementById("dropZone");
  const indexContent = indexFilesPanel.querySelector(".index-content");
  if (originalDropZone && indexContent) {
    // Clone necessary elements from the hidden functional components
    const dropZoneClone = originalDropZone.cloneNode(true);
    const dirInputContainer = document
      .getElementById("dirInputContainer")
      .cloneNode(true);
    const indexFilesBtn = document
      .getElementById("indexFilesBtn")
      .cloneNode(true);
    const indexStatus = document.getElementById("indexStatus").cloneNode(true);
    const indexingProgress = document
      .querySelector(".indexing-progress")
      .cloneNode(true);

    // Append them to the visible modal panel
    indexContent.appendChild(dropZoneClone);
    indexContent.appendChild(dirInputContainer);
    indexContent.appendChild(indexFilesBtn);
    indexContent.appendChild(indexStatus);
    indexContent.appendChild(indexingProgress);

    // Connect the new elements to the original element IDs for your JS to work
    dropZoneClone.id = "dropZone";
    dirInputContainer.querySelector("input").id = "directoryPath";
    indexFilesBtn.id = "indexFilesBtn";
    indexStatus.id = "indexStatus";
  }

  // Close buttons for panels
  const closeButtons = document.querySelectorAll(".close-btn");

  // Show modal panel
  function showPanel(panel) {
    panel.classList.add("visible");
  }

  // Hide modal panel
  function hidePanel(panel) {
    panel.classList.remove("visible");
  }

  // Event listeners for sidebar buttons
  filtersBtn.addEventListener("click", () => showPanel(filtersPanel));
  indexBtn.addEventListener("click", () => showPanel(indexFilesPanel));

  // Close buttons
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest(".modal-panel");
      hidePanel(panel);
    });
  });

  // Override the updateIndexedFilesUI function to show files in the main table
  const originalUpdateIndexedFilesUI = window.updateIndexedFilesUI;

  if (typeof originalUpdateIndexedFilesUI === "function") {
    window.updateIndexedFilesUI = function (fileIndex) {
      // Call the original function to keep its functionality
      originalUpdateIndexedFilesUI(fileIndex);

      // Also update the main table with the same data
      const filesTable = document.getElementById("filesTable");
      if (filesTable) {
        filesTable.innerHTML = "";

        Object.values(fileIndex).forEach((file) => {
          const row = document.createElement("div");
          row.className = "table-row";

          row.innerHTML = `
              <div class="name-column">${file.name}</div>
              <div class="path-column">${file.path || ""}</div>
              <div class="date-column">${new Date(
                file.lastModified
              ).toLocaleDateString()}</div>
              <div class="count-column">1</div>
            `;

          row.addEventListener("click", () => {
            // Show file info in the right sidebar
            showFileDetails(file);

            // Also call the original file content viewer if it exists
            if (typeof window.showFileContent === "function") {
              window.showFileContent(file, fileIndex);
            }
          });

          filesTable.appendChild(row);
        });
      }
    };
  }

  // Show file details in the right sidebar
  function showFileDetails(file) {
    const userInfoContent = document.getElementById("userInfoContent");
    const fileInfoContent = document.getElementById("fileInfoContent");
    const thumbnailContent = document.getElementById("thumbnailContent");

    if (userInfoContent) {
      userInfoContent.innerHTML = `
          <p><strong>Owner:</strong> Current User</p>
          <p><strong>Last accessed:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Permissions:</strong> Read, Write</p>
        `;
    }

    if (fileInfoContent) {
      fileInfoContent.innerHTML = `
          <p><strong>Name:</strong> ${file.name}</p>
          <p><strong>Path:</strong> ${file.path || ""}</p>
          <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
          <p><strong>Type:</strong> ${
            file.type || getFileTypeFromName(file.name)
          }</p>
          <p><strong>Modified:</strong> ${new Date(
            file.lastModified
          ).toLocaleString()}</p>
        `;
    }

    if (thumbnailContent) {
      // Generate thumbnail based on file type
      if (file.type && file.type.startsWith("image/")) {
        thumbnailContent.innerHTML = `<div class="thumbnail-preview">Image preview not available</div>`;
      } else {
        const fileIcon = getFileIcon(file.name);
        thumbnailContent.innerHTML = `
            <div class="thumbnail-placeholder">
              <span class="file-icon">${fileIcon}</span>
              <p>Preview not available</p>
            </div>
          `;
      }
    }
  }

  // Get file type from extension
  function getFileTypeFromName(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const types = {
      pdf: "PDF Document",
      doc: "Word Document",
      docx: "Word Document",
      xls: "Excel Spreadsheet",
      xlsx: "Excel Spreadsheet",
      ppt: "PowerPoint",
      pptx: "PowerPoint",
      txt: "Text Document",
      csv: "CSV File",
      json: "JSON File",
      html: "HTML File",
      css: "CSS File",
      js: "JavaScript File",
    };

    return types[ext] || "Unknown File Type";
  }

  // Get icon for file based on type
  function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx", "txt"].includes(ext)) return "📝";
    if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext)) return "🖼️";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    if (["html", "css", "js", "json"].includes(ext)) return "📋";

    return "📎";
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    if (!bytes) return "Unknown";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Sample data for initial state (will be replaced by your actual indexing)
  function loadSampleData() {
    const filesTable = document.getElementById("filesTable");
    if (!filesTable) return;

    const sampleFiles = [
      {
        name: "document.pdf",
        path: "/documents",
        lastModified: Date.now(),
        size: 1024 * 1024 * 2.3,
        type: "application/pdf",
      },
      {
        name: "image.jpg",
        path: "/photos",
        lastModified: Date.now() - 86400000,
        size: 1024 * 512,
        type: "image/jpeg",
      },
      {
        name: "spreadsheet.xlsx",
        path: "/work",
        lastModified: Date.now() - 86400000 * 2,
        size: 1024 * 1024 * 1.5,
        type: "application/vnd.ms-excel",
      },
    ];

    filesTable.innerHTML = "";

    sampleFiles.forEach((file) => {
      const row = document.createElement("div");
      row.className = "table-row";

      row.innerHTML = `
          <div class="name-column">${file.name}</div>
          <div class="path-column">${file.path}</div>
          <div class="date-column">${new Date(
            file.lastModified
          ).toLocaleDateString()}</div>
          <div class="count-column">1</div>
        `;

      row.addEventListener("click", () => showFileDetails(file));

      filesTable.appendChild(row);
    });
  }

  // Load sample data initially (will be replaced when real files are indexed)
  loadSampleData();
});
