import { openDB } from "idb";

const initdb = async () =>
  openDB("jate", 1, {
    upgrade(db) {
      if (db.objectStoreNames.contains("jate")) {
        console.log("jate database already exists");
        return;
      }
      db.createObjectStore("jate", { keyPath: "id", autoIncrement: true });
      console.log("jate database created");
    },
  });

// Add logic to a method that accepts some content and adds it to the database
export const putDb = async (content) => {
  try {
    const db = await initdb();
    const tx = db.transaction("jate", "readwrite");
    const store = tx.objectStore("jate");
    await store.put({ id: 1, content }); // Store content with a fixed ID for simplicity
    await tx.done;
    console.log("Content added to database:", content);
  } catch (error) {
    console.error("Error adding content to database:", error);
  }
};

// Add logic for a method that gets all the content from the database
export const getDb = async () => {
  try {
    const db = await initdb();
    const tx = db.transaction("jate", "readonly");
    const store = tx.objectStore("jate");
    const allContent = await store.get(1); // Get content by ID (assuming ID 1)
    await tx.done;
    console.log(
      "Content retrieved from database:",
      allContent?.content || null
    );
    return allContent?.content || null;
  } catch (error) {
    console.error("Error retrieving content from database:", error);
    return null;
  }
};

initdb();
