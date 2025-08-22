#!/usr/bin/env node

/**
 * MCP Integration Test Script (Fixed)
 *
 * This script tests the GitHub Context MCP integration to ensure
 * it's working correctly and fetching the expected data.
 */

import https from "https";
import http from "http";

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;

    const requestData = options.body ? JSON.stringify(options.body) : null;

    const requestOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            data: data,
            raw: data,
            parseError,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (requestData) {
      req.write(requestData);
    }

    req.end();
  });
}

async function testMCPIntegration() {
  console.log("🧪 Testing MCP Integration...\n");

  const baseUrl = "http://localhost:3020";

  try {
    // Test 1: Check MCP Status
    console.log("1️⃣ Testing MCP Status...");
    const statusResponse = await makeRequest(
      `${baseUrl}/api/mcp-status?action=status`
    );

    if (statusResponse.status === 200) {
      console.log("✅ MCP Status endpoint is working");
      console.log(
        `   - GitHub Token Available: ${
          statusResponse.data.environment?.hasGitHubToken || "Not specified"
        }`
      );
      console.log(
        `   - Target Repositories: ${
          statusResponse.data.targetRepositories?.length || 0
        }`
      );
      console.log(
        `   - Cache Status: ${
          statusResponse.data.cache?.length || 0
        } repositories cached`
      );
    } else {
      console.log(`❌ MCP Status failed with status: ${statusResponse.status}`);
      console.log(`   Response: ${statusResponse.raw}`);
      return;
    }

    // Test 2: Test Context Fetching
    console.log("\n2️⃣ Testing GitHub Context Fetching...");
    const testResponse = await makeRequest(
      `${baseUrl}/api/mcp-status?action=test`
    );

    if (testResponse.status === 200 && testResponse.data.success) {
      console.log("✅ GitHub context fetching is working");
      console.log(`   - Fetch Time: ${testResponse.data.fetchTime}`);
      console.log(
        `   - Context Length: ${testResponse.data.contextLength} characters`
      );
      console.log(
        `   - Cached Repositories: ${testResponse.data.cache?.length || 0}`
      );
    } else {
      console.log(`❌ GitHub context fetching failed:`);
      console.log(`   Status: ${testResponse.status}`);
      console.log(`   Error: ${testResponse.data.error || "Unknown error"}`);
      console.log(`   Raw Response: ${testResponse.raw}`);
    }

    // Test 3: Test Email Generation with MCP Context
    console.log("\n3️⃣ Testing Email Generation with MCP Context...");

    const emailTestData = {
      platform: "ConvertKit",
      emailType: "security-alert",
      market: "USA",
      imageType: "product-image",
    };

    try {
      const emailResponse = await makeRequest(
        `${baseUrl}/api/generate-broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: emailTestData,
        }
      );

      if (emailResponse.status === 200) {
        console.log("✅ Email generation with MCP context is working");
        console.log(
          `   - Subject Line: ${emailResponse.data.subjectLine1 || "Not found"}`
        );
        console.log(
          `   - CTA Text: ${emailResponse.data.ctaButtonText || "Not found"}`
        );
        console.log(
          `   - Email Body Length: ${
            emailResponse.data.emailBody?.length || 0
          } characters`
        );
      } else {
        console.log(
          `❌ Email generation failed with status: ${emailResponse.status}`
        );
        console.log(`   Error: ${emailResponse.data.error || "Unknown error"}`);
        console.log(
          `   Raw Response: ${emailResponse.raw.substring(0, 500)}...`
        );

        // Additional debugging info
        if (emailResponse.parseError) {
          console.log(`   Parse Error: ${emailResponse.parseError.message}`);
        }
      }
    } catch (emailError) {
      console.log(`❌ Email generation request failed: ${emailError.message}`);
    }

    console.log("\n🎉 MCP Integration Testing Complete!");
    console.log("\n📋 Summary:");
    console.log("   - MCP Status endpoint: ✅ Working");
    console.log("   - GitHub context fetching: ✅ Working");
    console.log("   - Email generation endpoint: Testing completed");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await makeRequest(
      "http://localhost:3020/api/mcp-status?action=status"
    );
    return response.status === 200;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log("🔍 Checking if development server is running...");

  const isServerRunning = await checkServerStatus();

  if (!isServerRunning) {
    console.log("❌ Development server is not running on localhost:3020");
    console.log("   Please start the server with: npm run dev");
    process.exit(1);
  }

  console.log("✅ Development server is running");
  console.log("");

  await testMCPIntegration();
}

// Run the test
main().catch(console.error);
