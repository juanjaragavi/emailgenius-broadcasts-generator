const { GoogleGenAI } = require("@google/genai");
try {
  const client = new GoogleGenAI({
    project: "test-project",
    location: "us-central1",
    googleAuth: {
      credentials: {
        client_email: "test@example.com",
        private_key:
          "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
      },
    },
  });
  console.log("Initialized with credentials");
} catch (e) {
  console.log("Error initializing:", e.message);
}
