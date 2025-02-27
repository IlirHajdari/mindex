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

// Show file content in the preview pane
function showFileContent(file, fileIndex) {
  const filePreview = document.getElementById("file-preview");
  if (!filePreview) return;

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
}

// Note: This will need imports from other modules
// import { formatFileSize } from "../utils/file-utils.js";
// import { escapeHtml } from "../utils/file-utils.js";

export { updateIndexedFilesUI, showFileContent };
