// Show progress indicator
function showProgress(progressContainer) {
  if (progressContainer) {
    progressContainer.classList.add("active");
  }
}

// Hide progress indicator
function hideProgress(progressContainer) {
  if (progressContainer) {
    progressContainer.classList.remove("active");
  }
}

export { showProgress, hideProgress };
