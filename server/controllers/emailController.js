const imap = require("imap-simple");
const { simpleParser } = require("mailparser");
require("dotenv").config();
const dataStore = require("../services/dataStore");

exports.fetchEmails = async (req, res) => {
  try {
    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        tls: true,
        authTimeout: 10000,
      },
    };

    const connection = await imap.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: false };

    const messages = await connection.search(searchCriteria, fetchOptions);
    let emails = [];

    for (let item of messages.slice(0, 5)) {
      let all = item.parts.find((part) => part.which === "TEXT");
      let parsedEmail = await simpleParser(all.body);

      let email = {
        id: item.attributes.uid.toString(),
        subject: parsedEmail.subject || "(No Subject)",
        from: parsedEmail.from.text,
        date: parsedEmail.date,
        content: parsedEmail.text || "(No Content)",
      };

      dataStore.indexedEmails.set(email.id, email);
      emails.push(email);
    }

    connection.end();

    res.json({
      success: true,
      message: `Fetched ${emails.length} emails`,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Error fetching real emails:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
};
