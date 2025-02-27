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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Process special file types (CSV, DOCX, PDF, PPT/PPTX) for preview
function processSpecialFileContent(file, content) {
  switch (file.name.split(".").pop().toLowerCase()) {
    case "csv":
      // Parse CSV content into a readable format
      return content
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim()))
        .map((row) => row.join(" | "))
        .join("\n");
    case "docx":
      // Placeholder for DOCX - provide a text preview or thumbnail
      return generateDocxPreview(file);
    case "pdf":
      // Use pdf.js to generate a thumbnail or preview
      return generatePdfPreview(file);
    case "ppt":
    case "pptx":
      // Placeholder for PowerPoint - provide a thumbnail or text preview
      return generatePptPreview(file);
    default:
      return content || "Content not available";
  }
}

export { formatFileSize, escapeHtml, processSpecialFileContent };
