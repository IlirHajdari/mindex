import { showProgress, hideProgress } from "../ui/progress-handler.js";
import { processDataTransferItems } from "./entry-processing.js";
import { processFiles } from "./file-processing.js";

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

// Note: This will need imports from other modules
// import { showProgress, hideProgress } from "../ui/progress-handler.js";
// import { processDataTransferItems } from "./entry-processing.js";
// import { processFiles } from "./file-processing.js";

export { initDragAndDrop };
