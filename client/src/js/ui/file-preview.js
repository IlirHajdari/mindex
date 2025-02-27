// Generate a preview for non-text files
function generateFilePreview(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  switch (extension) {
    case "pdf":
      return generatePdfPreview(file);
    case "docx":
      return generateDocxPreview(file);
    case "ppt":
    case "pptx":
      return generatePptPreview(file);
    default:
      return (
        "Preview not available. <a href='" +
        URL.createObjectURL(file) +
        "' download='" +
        file.name +
        "' target='_blank'>Download " +
        file.name +
        "</a>"
      );
  }
}

// Generate PDF preview using pdf.js (requires installation)
function generatePdfPreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        // Import pdf.js (ensure it's installed and configured)
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdfData = new Uint8Array(e.target.result);
        const pdf = await getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1); // Get the first page for thumbnail
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;

        resolve(
          `<img src="${canvas.toDataURL()}" alt="PDF Thumbnail" class="file-preview-thumbnail" />`
        );
      } catch (error) {
        console.error("Error generating PDF preview:", error);
        resolve(
          "Preview not available. <a href='" +
            URL.createObjectURL(file) +
            "' download='" +
            file.name +
            "' target='_blank'>Download " +
            file.name +
            "</a>"
        );
      }
    };
    reader.onerror = function (error) {
      console.error("Error reading PDF:", error);
      resolve(
        "Preview not available. <a href='" +
          URL.createObjectURL(file) +
          "' download='" +
          file.name +
          "' target='_blank'>Download " +
          file.name +
          "</a>"
      );
    };
    reader.readAsArrayBuffer(file);
  });
}

// Generate DOCX preview (simple placeholder, requires docx library for full support)
function generateDocxPreview(file) {
  // Placeholder: Basic text or thumbnail (requires docx library for full parsing)
  return `<div class="file-preview-placeholder">DOCX Preview: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0c8AAAAASUVORK5CYII=" alt="DOCX Thumbnail" class="file-preview-thumbnail" /></div>`;
}

// Generate PowerPoint preview (simple placeholder, requires pptxjs for full support)
function generatePptPreview(file) {
  // Placeholder: Basic text or thumbnail (requires pptxjs library for full parsing)
  return `<div class="file-preview-placeholder">PowerPoint Preview: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0c8AAAAASUVORK5CYII=" alt="PPT Thumbnail" class="file-preview-thumbnail" /></div>`;
}

export {
  generateFilePreview,
  generatePdfPreview,
  generateDocxPreview,
  generatePptPreview,
};
