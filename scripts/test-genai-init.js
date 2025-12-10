const { GoogleGenAI } = require("@google/genai");
try {
  const client = new GoogleGenAI({
    project: "test-project",
    location: "us-central1",
  });
  console.log("Initialized with project/location");
} catch (e) {
  console.log("Error initializing:", e.message);
}
