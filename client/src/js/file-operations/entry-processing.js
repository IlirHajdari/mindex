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

// Note: This will need imports from other modules
// import { processFiles } from "./file-processing.js";
// import { hideProgress } from "../ui/progress-handler.js";

export { processDataTransferItems, processEntry };
