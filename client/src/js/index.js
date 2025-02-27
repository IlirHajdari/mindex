// Import CSS
import "../css/style.css";

// Import any other needed modules from your project
import "./database.js";
import "./editor.js";
import "./header.js";
import "./dir-selector.js";
import "./dragDropIndexer.js";
import "./app.js";
import "./install.js";

// Wait for DOM to be fully loaded before manipulating elements
document.addEventListener("DOMContentLoaded", () => {
  // Your initialization code here
  console.log("Application initialized");

  // Example of safely accessing DOM elements
  const appContainer = document.getElementById("app");
  if (appContainer) {
    // Now it's safe to manipulate this element
    appContainer.innerHTML = "<h1>App is loaded</h1>";
  } else {
    console.warn("App container not found in DOM");
    // Create app container if it doesn't exist
    const newContainer = document.createElement("div");
    newContainer.id = "app";
    document.body.appendChild(newContainer);
    newContainer.innerHTML = "<h1>App is loaded</h1>";
  }

  // Initialize other components
  initializeComponents();
});

function initializeComponents() {
  // Initialize your application components here
  try {
    // Safely initialize components with proper error handling
    console.log("Components initialized");
  } catch (error) {
    console.error("Error initializing components:", error);
  }
}

// Register service worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Use the correct path to your service worker file
    navigator.serviceWorker
      .register("./src-sw.js")
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
