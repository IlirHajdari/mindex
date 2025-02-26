// Import CSS
import "../css/style.css";

// Import functionality from dragDropIndexer
import {
  initFileIndexing,
  initSearch,
  setupInstallDetection,
  isInstalledPWA,
  hasFileSystemAccessAPI,
} from "./dragDropIndexer";

// Application initialization
console.log("Application initialized");

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded - initializing app features");

  // Initialize file indexing functionality (drag & drop + directory access)
  initFileIndexing();

  // Initialize search functionality
  initSearch();

  // Set up installation detection and button functionality
  setupInstallDetection();

  // Log application state
  console.log("App initialized. Installed as PWA:", isInstalledPWA());
  console.log("File System Access API available:", hasFileSystemAccessAPI);

  // Set up additional event listeners
  setupOtherEventListeners();
});

// Set up other event listeners in the application
function setupOtherEventListeners() {
  // Email fetching button
  const fetchEmailsBtn = document.getElementById("fetchEmailsBtn");
  const emailStatus = document.getElementById("emailStatus");

  if (fetchEmailsBtn && emailStatus) {
    fetchEmailsBtn.addEventListener("click", () => {
      emailStatus.textContent = "Syncing emails...";

      // Simulate email fetching (replace with actual implementation)
      setTimeout(() => {
        emailStatus.textContent = "Successfully synced 0 emails";
      }, 1500);
    });
  }
}

// Register service worker for PWA functionality only in production
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/src-sw.js") // Ensure this path matches your Webpack output (e.g., /src-sw.js in dist/)
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

export default {};
