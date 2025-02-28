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
        // Dynamically import pdf.js and the worker
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        const pdfWorker = await import("pdfjs-dist/build/pdf.worker.mjs");

        // ✅ Set the correct local worker path
        GlobalWorkerOptions.workerSrc = pdfWorker;

        // Read PDF data
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1); // Get the first page for thumbnail

        // Set scale and viewport for rendering
        const scale = 0.5;
        const viewport = page.getViewport({ scale });

        // Create a canvas for rendering
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the first page onto the canvas
        await page.render({ canvasContext: context, viewport }).promise;

        // Convert canvas to image and return as a thumbnail
        resolve(
          `<img src="${canvas.toDataURL()}" alt="PDF Thumbnail" class="file-preview-thumbnail" />`
        );
      } catch (error) {
        console.error("Error generating PDF preview:", error);
        resolve(
          `Preview not available. <a href='${URL.createObjectURL(
            file
          )}' download='${file.name}' target='_blank'>Download ${file.name}</a>`
        );
      }
    };

    reader.onerror = function (error) {
      console.error("Error reading PDF:", error);
      resolve(
        `Preview not available. <a href='${URL.createObjectURL(
          file
        )}' download='${file.name}' target='_blank'>Download ${file.name}</a>`
      );
    };

    // Read the PDF file as an ArrayBuffer
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

export {
  generateFilePreview,
  generatePdfPreview,
  generateDocxPreview,
  generatePptPreview,
  processSpecialFileContent,
};
