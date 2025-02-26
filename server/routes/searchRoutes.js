const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Route to search across files and emails
router.get("/", searchController.search);

module.exports = router;
