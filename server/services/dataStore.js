// In-memory data store for the application
// In a production app, you'd want to use a database instead

const indexedFiles = new Map();
const indexedEmails = new Map();

module.exports = {
  indexedFiles,
  indexedEmails,
};
