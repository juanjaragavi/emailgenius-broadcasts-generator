#!/import { supermemoryClient } from './lib/mcp/supermemory-client-direct.js';sr/bin/env node

// Simple test to verify Supermemory functionality
import { supermemoryClient } from "../lib/mcp/supermemory-client-direct.js";

async function testSupermemory() {
  console.log("🧪 Testing Supermemory integration...");

  // Test 1: Add a memory
  console.log("\n1. Testing addToMemory...");
  const testEntry = {
    content: "Test email broadcast content for verification",
    timestamp: new Date().toISOString(),
    metadata: {
      platform: "ConvertKit",
      emailType: "test",
      market: "USA",
      subject: "Test Subject",
      preheader: "Test Preview",
    },
  };

  const added = await supermemoryClient.addToMemory(testEntry);
  console.log("Add result:", added);

  // Test 2: Search memories
  console.log("\n2. Testing searchMemories...");
  const searchResults = await supermemoryClient.searchMemories(
    "test email broadcast"
  );
  console.log("Search results:", searchResults.length, "items found");

  // Test 3: Get context
  console.log("\n3. Testing getContextForGeneration...");
  const context = await supermemoryClient.getContextForGeneration(
    "ConvertKit",
    "test",
    "USA"
  );
  console.log("Context length:", context.length);
  console.log("Context preview:", context.substring(0, 200) + "...");

  console.log("\n✅ Supermemory test completed");
}

testSupermemory().catch(console.error);
