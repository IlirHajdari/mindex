const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");

// Route to fetch emails
router.post("/fetch", emailController.fetchEmails);

// Route to get email content
router.get("/:emailId", emailController.getEmailContent);

module.exports = router;
