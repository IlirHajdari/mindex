const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

// Route to index files
router.post("/index", fileController.indexFiles);

// Route to get file content
router.get("/:filePath", fileController.getFileContent);

module.exports = router;
