// Process files and extract metadata/content
async function processFiles(
  files,
  statusElement,
  progressContainer,
  progressBar
) {
  if (!files || files.length === 0) {
    statusElement.textContent = "No files to process.";
    hideProgress(progressContainer);
    return;
  }

  statusElement.textContent = `Indexing ${files.length} files...`;
  showProgress(progressContainer);

  const fileIndex = {};
  let processedCount = 0;

  const indexPromises = files.map((file) => {
    return new Promise((resolve) => {
      const metadata = {
        name: file.name,
        path: file.relativePath || file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      // Read content for text files, CSVs, DOCX, PDFs, and PowerPoint files
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(md|json|csv|txt|js|html|css|docx|pdf|ppt|pptx)$/i)
      ) {
        const reader = new FileReader();
        reader.onload = function (e) {
          let content = e.target.result;
          if (file.name.match(/\.(csv|docx|pdf|ppt|pptx)$/i)) {
            content = processSpecialFileContent(file, content);
          }
          metadata.content = content || "Content not available";
          fileIndex[metadata.path] = metadata;

          processedCount++;
          if (progressBar) {
            progressBar.style.width = `${
              (processedCount / files.length) * 100
            }%`;
          }
          resolve();
        };
        reader.onerror = function (error) {
          console.error("Error reading file:", error);
          fileIndex[metadata.path] = metadata;

          processedCount++;
          if (progressBar) {
            progressBar.style.width = `${
              (processedCount / files.length) * 100
            }%`;
          }
          resolve();
        };
        reader.readAsText(file); // Read as text for processing
      } else {
        // For non-text/binary files, provide a placeholder thumbnail or download link
        metadata.content = generateFilePreview(file);
        fileIndex[metadata.path] = metadata;

        processedCount++;
        if (progressBar) {
          progressBar.style.width = `${(processedCount / files.length) * 100}%`;
        }
        resolve();
      }
    });
  });

  try {
    await Promise.all(indexPromises);

    // Only save and update UI in production or on user action (not automatically in development)
    if (process.env.NODE_ENV === "production" || isInstalledPWA()) {
      await saveFileIndex(fileIndex);
      updateIndexedFilesUI(fileIndex);
    } else {
      console.log("Skipping file index save/update in development mode");
      updateIndexedFilesUI(fileIndex); // Show files in development for testing
    }

    statusElement.textContent = `Indexed ${files.length} files successfully.`;
  } catch (error) {
    console.error("Error processing files:", error);
    statusElement.textContent = "Error processing files. Please try again.";
  }

  setTimeout(() => {
    hideProgress(progressContainer);
    if (progressBar) progressBar.style.width = "0%";
  }, 1000);
}

// Process a directory handle (for File System Access API)
async function processDirectoryHandle(
  dirHandle,
  statusElement,
  progressContainer,
  progressBar,
  basePath = ""
) {
  const files = [];

  try {
    statusElement.textContent = `Indexing directory: ${dirHandle.name}...`;
    showProgress(progressContainer);

    for await (const entry of dirHandle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === "file") {
        try {
          const file = await entry.getFile();
          file.relativePath = entryPath;
          files.push(file);
        } catch (error) {
          console.error(`Error accessing file ${entryPath}:`, error);
        }
      } else if (entry.kind === "directory") {
        try {
          const subdirFiles = await processDirectoryHandle(
            entry,
            statusElement,
            progressContainer,
            progressBar,
            entryPath
          );
          files.push(...subdirFiles);
        } catch (error) {
          console.error(`Error accessing subdirectory ${entryPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error traversing directory ${dirHandle.name}:`, error);
  }

  if (!basePath) {
    if (files.length > 0) {
      await processFiles(files, statusElement, progressContainer, progressBar);
    } else {
      statusElement.textContent =
        "No files found to index in the selected directory.";
      hideProgress(progressContainer);
    }
  }

  return files;
}

// Note: This will need imports from other modules
// import { isInstalledPWA } from "../utils/feature-detection.js";
// import { processSpecialFileContent } from "../utils/file-utils.js";
// import { generateFilePreview } from "../ui/file-preview.js";
// import { showProgress, hideProgress } from "../ui/progress-handler.js";
// import { saveFileIndex } from "../storage/file-storage.js";
// import { updateIndexedFilesUI } from "../ui/file-display.js";

export { processFiles, processDirectoryHandle };
