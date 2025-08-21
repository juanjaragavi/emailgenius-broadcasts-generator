// Integration tests for GitHub file upload functionality
// Note: These tests require proper GitHub App configuration

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class GitHubIntegrationTester {
  private API_BASE = process.env.API_BASE || "http://localhost:3020";
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log("🧪 Running GitHub Integration Tests...\n");

    await this.testHealthEndpoint();
    await this.testInvalidFileType();
    await this.testLargeFile();
    await this.testMissingRequired();

    // Only run actual upload test if environment is configured
    if (this.hasGitHubConfig()) {
      await this.testFileUpload();
    } else {
      console.log("⏭️  Skipping upload test - GitHub not configured\n");
    }

    this.printResults();
    return this.results;
  }

  private hasGitHubConfig(): boolean {
    const required = ["GITHUB_APP_ID", "GITHUB_OWNER", "GITHUB_REPO"];
    return required.every((key) => !!process.env[key]);
  }

  private async testHealthEndpoint(): Promise<void> {
    try {
      console.log("1️⃣  Testing health endpoint...");
      const response = await fetch(
        `${this.API_BASE}/api/upload-winner-subject`
      );
      const data = await response.json();

      if (response.status === 200 && data.status === "healthy") {
        this.results.push({ name: "Health Endpoint", passed: true });
        console.log("✅ Health endpoint working\n");
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.results.push({
        name: "Health Endpoint",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("❌ Health endpoint failed\n");
    }
  }

  private async testInvalidFileType(): Promise<void> {
    try {
      console.log("2️⃣  Testing invalid file type rejection...");
      const payload = {
        filename: "test.exe",
        content: "Invalid content",
      };

      const response = await fetch(
        `${this.API_BASE}/api/upload-winner-subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (
        response.status === 400 &&
        data.error?.includes("Invalid file type")
      ) {
        this.results.push({ name: "Invalid File Type", passed: true });
        console.log("✅ Invalid file type properly rejected\n");
      } else {
        throw new Error(
          `Expected 400 with file type error, got: ${JSON.stringify(data)}`
        );
      }
    } catch (error) {
      this.results.push({
        name: "Invalid File Type",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("❌ Invalid file type test failed\n");
    }
  }

  private async testLargeFile(): Promise<void> {
    try {
      console.log("3️⃣  Testing large file rejection...");
      const largeContent = "x".repeat(2 * 1024 * 1024); // 2MB
      const payload = {
        filename: "large-file.md",
        content: largeContent,
      };

      const response = await fetch(
        `${this.API_BASE}/api/upload-winner-subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 400 && data.error?.includes("File too large")) {
        this.results.push({ name: "Large File Rejection", passed: true });
        console.log("✅ Large file properly rejected\n");
      } else {
        throw new Error(
          `Expected 400 with file size error, got: ${JSON.stringify(data)}`
        );
      }
    } catch (error) {
      this.results.push({
        name: "Large File Rejection",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("❌ Large file test failed\n");
    }
  }

  private async testMissingRequired(): Promise<void> {
    try {
      console.log("4️⃣  Testing missing required fields...");
      const payload = {
        filename: "",
        content: "",
      };

      const response = await fetch(
        `${this.API_BASE}/api/upload-winner-subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (
        response.status === 400 &&
        data.error?.includes("filename and content are required")
      ) {
        this.results.push({ name: "Missing Required Fields", passed: true });
        console.log("✅ Missing required fields properly rejected\n");
      } else {
        throw new Error(
          `Expected 400 with required fields error, got: ${JSON.stringify(
            data
          )}`
        );
      }
    } catch (error) {
      this.results.push({
        name: "Missing Required Fields",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("❌ Missing required fields test failed\n");
    }
  }

  private async testFileUpload(): Promise<void> {
    try {
      console.log("5️⃣  Testing actual file upload...");
      const timestamp = new Date().toISOString();
      const payload = {
        filename: `test-upload-${Date.now()}.md`,
        content: `# Test Upload\n\nGenerated at: ${timestamp}\n\nThis is a test file created by the integration test.`,
        commitMessage: `test: automated upload at ${timestamp}`,
        skipPr: true, // Skip PR creation for tests
      };

      const response = await fetch(
        `${this.API_BASE}/api/upload-winner-subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 200 && data.ok) {
        this.results.push({ name: "File Upload", passed: true });
        console.log("✅ File upload successful");
        console.log(`📁 File path: ${data.path}`);
        console.log(`🔗 Commit: ${data.commitUrl}\n`);
      } else {
        throw new Error(`Upload failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.results.push({
        name: "File Upload",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("❌ File upload test failed\n");
    }
  }

  private printResults(): void {
    console.log("📊 Test Results Summary:");
    console.log("========================");

    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;

    this.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.name}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log(`\n🎯 Passed: ${passed}/${total} tests`);

    if (passed === total) {
      console.log("🎉 All tests passed!");
    } else {
      console.log("⚠️  Some tests failed - check configuration");
    }
  }
}

// Manual test runner
export const runManualTest = async () => {
  console.log("🔧 Running manual GitHub integration test...\n");

  try {
    // Health check
    console.log("Testing health endpoint...");
    const healthResponse = await fetch(
      "http://localhost:3020/api/upload-winner-subject"
    );
    const healthData = await healthResponse.json();
    console.log("Health check result:", healthData);

    // File upload test
    console.log("\nTesting file upload...");
    const uploadPayload = {
      filename: `manual-test-${Date.now()}.md`,
      content: `# Manual Test\n\nUpload test at ${new Date().toISOString()}\n\n## Test Details\n\n- Test type: Manual\n- Environment: Development\n- Purpose: Verify GitHub integration`,
      commitMessage: "test: manual upload test from EmailGenius",
      skipPr: false, // Create PR for manual review
      metadata: {
        testType: "manual",
        environment: "development",
        timestamp: new Date().toISOString(),
      },
    };

    const uploadResponse = await fetch(
      "http://localhost:3020/api/upload-winner-subject",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      }
    );

    const uploadData = await uploadResponse.json();
    console.log("Upload result:", uploadData);

    if (uploadData.ok && uploadData.prUrl) {
      console.log(`\n🎉 Success! Pull request created: ${uploadData.prUrl}`);
      console.log(`📁 File location: ${uploadData.path}`);
      console.log(`💾 File size: ${uploadData.metadata?.sizeBytes} bytes`);
    } else if (uploadData.ok) {
      console.log(`\n✅ File uploaded successfully to: ${uploadData.path}`);
      console.log(`🔗 Commit: ${uploadData.commitUrl}`);
    } else {
      console.log(`\n❌ Upload failed: ${uploadData.error}`);
    }
  } catch (error) {
    console.error("❌ Manual test failed:", error);
  }
};

// Run automated tests
export const runAutomatedTests = async (): Promise<TestResult[]> => {
  const tester = new GitHubIntegrationTester();
  return await tester.runAllTests();
};

// CLI runner
if (require.main === module) {
  const testType = process.argv[2] || "automated";

  if (testType === "manual") {
    runManualTest();
  } else {
    runAutomatedTests();
  }
}
