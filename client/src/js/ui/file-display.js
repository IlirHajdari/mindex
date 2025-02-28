import { formatFileSize, escapeHtml } from "../utils/file-utils.js";

// Update the UI to show indexed files
function updateIndexedFilesUI(fileIndex) {
  const filePreview = document.getElementById("file-preview");
  if (!filePreview) return;

  let html = '<div class="preview-header"><h2>Indexed Files</h2></div>';
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

// Show file content in the preview pane and update side panels
function showFileContent(file, fileIndex) {
  const filePreview = document.getElementById("file-preview");
  if (!filePreview) return;

  // Update file content preview
  let html =
    '<div class="preview-header"><h2>File Preview: ' +
    file.name +
    "</h2></div>";
  html += `<p><strong>Path:</strong> ${file.path}</p>`;
  html += `<p><strong>Size:</strong> ${formatFileSize(file.size)}</p>`;
  html += `<p><strong>Last Modified:</strong> ${new Date(
    file.lastModified
  ).toLocaleString()}</p>`;

  // Handle content display for different file types
  if (typeof file.content === "string" && file.content.includes("<img")) {
    html += `<div class="file-content">${file.content}</div>`;
  } else if (
    typeof file.content === "string" &&
    file.content.includes("<div")
  ) {
    html += `<div class="file-content">${file.content}</div>`;
  } else if (file.content) {
    html += '<div class="file-content">';
    html += `<pre>${escapeHtml(file.content)}</pre>`;
    html += "</div>";
  } else {
    html += "<p>Content preview not available for this file type.</p>";
  }

  html +=
    '<button id="backToFiles" class="preview-back-btn">Back to Indexed Files</button>';

  filePreview.innerHTML = html;

  // Add click handler for back button, now with access to fileIndex
  document
    .getElementById("backToFiles")
    .addEventListener("click", () => updateIndexedFilesUI(fileIndex));

  // Update sidebar panels
  updateSidePanels(file);
}

// New function to update side panels
function updateSidePanels(file) {
  // Update file info panel
  const fileInfoContent = document.getElementById("fileInfoContent");
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

  // Update thumbnail panel
  const thumbnailContent = document.getElementById("thumbnailContent");
  if (thumbnailContent) {
    thumbnailContent.innerHTML = generateThumbnail(file);
  }

  // Update user info panel with placeholder data
  const userInfoContent = document.getElementById("userInfoContent");
  if (userInfoContent) {
    userInfoContent.innerHTML = `
        <p><strong>Owner:</strong> Current User</p>
        <p><strong>Last accessed:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Permissions:</strong> Read, Write</p>
      `;
  }
}

// Helper function to generate a thumbnail
function generateThumbnail(file) {
  // For images
  if (file.type && file.type.startsWith("image/")) {
    return `<div class="thumbnail-preview">
        <img src="${URL.createObjectURL(file)}" alt="${
      file.name
    }" class="thumbnail-image" />
      </div>`;
  }

  // For other file types, show an icon based on file extension
  const extension = file.name.split(".").pop().toLowerCase();
  let fileIcon = "📄"; // Default file icon

  if (["pdf"].includes(extension)) fileIcon = "📄";
  if (["doc", "docx", "txt"].includes(extension)) fileIcon = "📝";
  if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension)) fileIcon = "🖼️";
  if (["xls", "xlsx", "csv"].includes(extension)) fileIcon = "📊";
  if (["ppt", "pptx"].includes(extension)) fileIcon = "📊";
  if (["html", "css", "js", "json"].includes(extension)) fileIcon = "📋";

  return `<div class="thumbnail-placeholder">
      <span class="file-icon">${fileIcon}</span>
      <p>${file.name}</p>
    </div>`;
}

// Helper function to get file type from extension
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

// Export these new functions too
export {
  updateIndexedFilesUI,
  showFileContent,
  updateSidePanels,
  generateThumbnail,
  getFileTypeFromName,
};
