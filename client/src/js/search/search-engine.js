import { formatFileSize } from "../utils/file-utils.js";
import { showFileContent } from "../ui/file-display.js";

// Initialize search functionality
function initSearch() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchQuery");
  const filePreview = document.getElementById("file-preview");

  if (!searchBtn || !searchInput || !filePreview) return;

  searchBtn.addEventListener("click", () => performSearch(searchInput.value));
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch(searchInput.value);
  });

  async function performSearch(query) {
    if (!query.trim()) {
      filePreview.innerHTML =
        '<div class="preview-header"><h2>Preview</h2></div><p>Enter a search term to find files.</p>';
      return;
    }

    try {
      let fileIndex;
      try {
        fileIndex = JSON.parse(localStorage.getItem("fileIndex")) || {};
      } catch (e) {
        fileIndex = await searchInIndexedDB(query);
      }

      displaySearchResults(query, fileIndex);
    } catch (error) {
      console.error("Search error:", error);
      filePreview.innerHTML =
        '<div class="preview-header"><h2>Search Error</h2></div><p>Error accessing the file index.</p>';
    }
  }

  // Search in IndexedDB
  function searchInIndexedDB(query) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MiniIndexDB", 1);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(["files"], "readonly");
        const objectStore = transaction.objectStore("files");
        const files = {};

        objectStore.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            files[cursor.value.path] = cursor.value;
            cursor.continue();
          } else {
            resolve(files);
          }
        };
      };
    });
  }

  // Display search results
  function displaySearchResults(query, fileIndex) {
    if (process.env.NODE_ENV === "development") return; // Skip UI updates in development

    query = query.toLowerCase();
    const results = [];

    Object.values(fileIndex).forEach((file) => {
      if (file.name.toLowerCase().includes(query)) {
        results.push(file);
        return;
      }
      if (file.content && file.content.toLowerCase().includes(query)) {
        results.push(file);
      }
    });

    if (results.length === 0) {
      filePreview.innerHTML =
        '<div class="preview-header"><h2>No Results</h2></div><p>No files match your search query.</p>';
    } else {
      let html =
        '<div class="preview-header"><h2>Search Results for "' +
        query +
        '"</h2></div>';
      html += '<ul class="search-results">';

      results.forEach((file) => {
        html += `<li data-path="${file.path}" class="file-item">`;
        html += `<strong>${file.name}</strong>`;
        html += `<span class="file-path">(${file.path})</span>`;
        html += `<span class="file-size">${formatFileSize(file.size)}</span>`;
        html += `</li>`;
      });

      html += "</ul>";
      filePreview.innerHTML = html;

      document
        .querySelectorAll(".search-results .file-item")
        .forEach((item) => {
          item.addEventListener("click", function () {
            const path = this.getAttribute("data-path");
            const file = fileIndex[path];
            if (file) showFileContent(file, fileIndex);
          });
        });
    }
  }
}

// Note: This will need imports from other modules
// import { formatFileSize } from "../utils/file-utils.js";
// import { showFileContent } from "../ui/file-display.js";

export { initSearch };
