// Check if the File System Access API is available
const hasFileSystemAccessAPI = "showDirectoryPicker" in window;

// Detect if app is running as an installed PWA
function isInstalledPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone ||
    document.referrer.includes("android-app://")
  );
}

// Export the functions and constants
export { hasFileSystemAccessAPI, isInstalledPWA };
