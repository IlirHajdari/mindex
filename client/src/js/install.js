const butInstall = document.getElementById("buttonInstall");
let deferredPrompt = null;

// Initially hide the install button until we know the app is installable
if (butInstall) {
  butInstall.style.display = "none";
}

// Logic for installing the PWA
// Event handler for the `beforeinstallprompt` event
window.addEventListener("beforeinstallprompt", (event) => {
  // Prevent Chrome 76+ from automatically showing the prompt
  event.preventDefault();

  // Stash the event so it can be triggered later
  deferredPrompt = event;

  // Show the install button
  if (butInstall) {
    butInstall.style.display = "block";
    console.log("App is installable, showing install button");
  }
});

// Click event handler on the install button
butInstall.addEventListener("click", async () => {
  console.log("Install button clicked");

  if (!deferredPrompt) {
    console.log("No installation prompt available");

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      alert("The app is already installed!");
    } else {
      alert(
        "Your browser does not support app installation or the app is already installed."
      );
    }
    return;
  }

  // Show the installation prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);

  // Clear the saved prompt since it can't be used again
  deferredPrompt = null;

  // Hide the install button
  butInstall.style.display = "none";
});

// Handler for the `appinstalled` event
window.addEventListener("appinstalled", (event) => {
  // Log the installation to analytics
  console.log("App was installed successfully!");

  // Hide the install button
  if (butInstall) {
    butInstall.style.display = "none";
  }

  // Add the app-installed class to the body to enable special styling
  document.body.classList.add("app-installed");

  // You could also enable installed-only features here
  const directoryPathInput = document.getElementById("directoryPath");
  if (directoryPathInput) {
    directoryPathInput.disabled = false;
  }
});

// Check if already in standalone mode (installed)
if (window.matchMedia("(display-mode: standalone)").matches) {
  // App is installed, add class to body
  document.body.classList.add("app-installed");

  // Hide install button
  if (butInstall) {
    butInstall.style.display = "none";
  }

  console.log("App is running in standalone mode (installed)");
}
