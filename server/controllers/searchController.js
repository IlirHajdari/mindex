const dataStore = require("../services/dataStore");
const { getSnippet } = require("../utils/textUtils");

exports.search = (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = {
      files: [],
      emails: [],
    };

    // Search in indexed files
    for (const [filePath, fileData] of dataStore.indexedFiles.entries()) {
      if (fileData.content.includes(query) || fileData.name.includes(query)) {
        results.files.push({
          name: fileData.name,
          path: filePath,
          snippet: getSnippet(fileData.content, query),
          type: "file",
        });
      }
    }

    // Search in indexed emails
    for (const [emailId, emailData] of dataStore.indexedEmails.entries()) {
      if (
        emailData.subject.includes(query) ||
        emailData.content.includes(query) ||
        emailData.from.includes(query)
      ) {
        results.emails.push({
          id: emailId,
          subject: emailData.subject,
          from: emailData.from,
          date: emailData.date,
          snippet: getSnippet(emailData.content, query),
          type: "email",
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Search failed" });
  }
};
