const path = require("path");

module.exports = (app) => {
  // Serve the main index.html file for any routes to handle client-side routing
  // This should be the last route defined to act as a fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
};
