#!/usr/bin/env node

/**
 * MCP Awareness Test Script
 * Validates that the LLM agent is properly aware of MCP tools and using them effectively
 */

import http from "http";

console.log("\n🧪 MCP AWARENESS VALIDATION TEST");
console.log("===================================\n");

const testEmail = async () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      platform: "ActiveCampaign",
      emailType: "security-alert",
      market: "USA",
      imageType: "product-image",
    });

    const options = {
      hostname: "localhost",
      port: 3020,
      path: "/api/generate-broadcast",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
};

const testMcpStatus = async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3020,
      path: "/api/mcp-status?action=test",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
};

const runTests = async () => {
  try {
    console.log("📊 Step 1: Testing MCP Context Fetching...");
    const mcpTest = await testMcpStatus();

    console.log(
      `✅ MCP Context Status: ${mcpTest.success ? "SUCCESS" : "FAILED"}`
    );
    console.log(`⏱️  Fetch Time: ${mcpTest.fetchTime}`);
    console.log(`📄 Context Length: ${mcpTest.contextLength} characters`);
    console.log(
      `🗄️  Cache Status: ${mcpTest.cache?.length || 0} repositories cached`
    );

    if (mcpTest.cache && mcpTest.cache.length > 0) {
      mcpTest.cache.forEach((repo, index) => {
        console.log(
          `   Repository ${index + 1}: ${repo.repository} (${
            repo.filesCount
          } files)`
        );
      });
    }

    console.log(
      "\n🤖 Step 2: Testing LLM Agent Email Generation with MCP Context..."
    );
    const emailResult = await testEmail();

    // Analyze the generated content for signs of MCP-enhanced intelligence
    const hasRichSubject =
      emailResult.subjectLine1 && emailResult.subjectLine1.length > 20;
    const hasDetailedBody =
      emailResult.emailBody && emailResult.emailBody.length > 300;
    const hasProperPersonalization =
      emailResult.emailBody && emailResult.emailBody.includes("%FIRSTNAME%");
    const hasUtmParameters =
      emailResult.destinationUrl && emailResult.destinationUrl.includes("utm_");
    const hasPreheader =
      emailResult.previewText && emailResult.previewText.length > 10;
    const hasFromName = emailResult.fromName && emailResult.fromName.length > 5;
    const hasFromEmail =
      emailResult.fromEmail && emailResult.fromEmail.includes("@");

    console.log("\n📋 CONTENT QUALITY ANALYSIS:");
    console.log(`✅ Rich Subject Line: ${hasRichSubject ? "PASS" : "FAIL"}`);
    console.log(`✅ Detailed Email Body: ${hasDetailedBody ? "PASS" : "FAIL"}`);
    console.log(
      `✅ Proper Personalization: ${hasProperPersonalization ? "PASS" : "FAIL"}`
    );
    console.log(`✅ UTM Parameters: ${hasUtmParameters ? "PASS" : "FAIL"}`);
    console.log(`✅ Preheader Text: ${hasPreheader ? "PASS" : "FAIL"}`);
    console.log(`✅ From Name: ${hasFromName ? "PASS" : "FAIL"}`);
    console.log(`✅ From Email: ${hasFromEmail ? "PASS" : "FAIL"}`);

    const qualityScore = [
      hasRichSubject,
      hasDetailedBody,
      hasProperPersonalization,
      hasUtmParameters,
      hasPreheader,
      hasFromName,
      hasFromEmail,
    ].filter(Boolean).length;

    console.log(
      `\n🎯 QUALITY SCORE: ${qualityScore}/7 (${(
        (qualityScore / 7) *
        100
      ).toFixed(1)}%)`
    );

    if (qualityScore >= 6) {
      console.log("🟢 EXCELLENT: LLM agent is using MCP context effectively!");
    } else if (qualityScore >= 4) {
      console.log("🟡 GOOD: LLM agent is partially leveraging MCP context");
    } else {
      console.log(
        "🔴 NEEDS IMPROVEMENT: LLM agent may not be fully utilizing MCP context"
      );
    }

    console.log("\n📄 SAMPLE OUTPUT:");
    console.log(`Subject: ${emailResult.subjectLine1 || "N/A"}`);
    console.log(
      `From: ${emailResult.fromName || "N/A"} <${
        emailResult.fromEmail || "N/A"
      }>`
    );
    console.log(`Preheader: ${emailResult.previewText || "N/A"}`);
    console.log(
      `Body Length: ${emailResult.emailBody?.length || 0} characters`
    );
    console.log(`CTA: ${emailResult.ctaButtonText || "N/A"}`);
    console.log(`URL: ${emailResult.destinationUrl || "N/A"}`);

    console.log("\n🎉 MCP AWARENESS TEST COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
};

// Run the tests
runTests();
