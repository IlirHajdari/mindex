// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

// Import routes
const fileRoutes = require("./routes/fileRoutes");
const emailRoutes = require("./routes/emailRoutes");
const searchRoutes = require("./routes/searchRoutes");
const htmlRoutes = require("./routes/htmlRoutes");

// Apply routes
app.use("/api/files", fileRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/search", searchRoutes);

// Serve frontend on all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
