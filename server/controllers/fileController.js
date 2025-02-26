const fs = require("fs").promises;
const path = require("path");
const dataStore = require("../services/dataStore");

exports.indexFiles = async (req, res) => {
  try {
    const { directoryPath } = req.body;

    if (!directoryPath) {
      return res.status(400).json({ error: "Directory path is required" });
    }

    // Validate if directory exists
    try {
      const stats = await fs.stat(directoryPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: "Path is not a directory" });
      }
    } catch (error) {
      return res.status(400).json({ error: "Directory does not exist" });
    }

    // Simple file indexing logic
    const files = await fs.readdir(directoryPath);
    const indexedCount = files.length;

    // Index files
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const content = await fs.readFile(filePath, "utf-8");
          dataStore.indexedFiles.set(filePath, {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            content,
          });
        }
      } catch (error) {
        console.error(`Error indexing ${filePath}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Indexed ${indexedCount} files successfully`,
      count: indexedCount,
    });
  } catch (error) {
    console.error("Error indexing files:", error);
    res.status(500).json({ error: "Failed to index files" });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const fileData = dataStore.indexedFiles.get(filePath);

    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({
      success: true,
      file: fileData,
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};
