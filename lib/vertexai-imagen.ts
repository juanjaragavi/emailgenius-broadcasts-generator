import {
  GoogleGenAI,
  PersonGeneration,
  SafetyFilterLevel,
  ImagePromptLanguage,
} from "@google/genai";
import { optimizeEmailImage, formatFileSize } from "@/lib/image-optimizer";
import { IMAGE_SIZE_LIMITS } from "@/types/image-optimizer";

export class VertexAIImageService {
  private readonly projectId: string;
  private readonly locationId: string;
  private readonly modelId: string;
  private vertex: GoogleGenAI;

  constructor() {
    // Get project configuration from environment variables
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    this.locationId = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    this.modelId = "imagen-4.0-ultra-generate-001"; // Updated to a stable model supported by the new SDK

    if (!this.projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
    }

    // Configure authentication with Service Account credentials
    const credentials = this.getServiceAccountCredentials();

    this.vertex = new GoogleGenAI({
      vertexai: true,
      project: this.projectId,
      location: this.locationId,
      googleAuthOptions: {
        credentials,
      },
    });
  }

  private getServiceAccountCredentials() {
    // Check for service account credentials in environment variables
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!serviceAccountEmail || !privateKey) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required for image generation"
      );
    }

    // Return credentials in the format expected by google-auth-library
    return {
      type: "service_account",
      project_id: this.projectId,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || "",
      private_key: privateKey.replace(/\\n/g, "\n"), // Handle escaped newlines
      client_email: serviceAccountEmail,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
        serviceAccountEmail
      )}`,
    };
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      console.log("🎨 Vertex AI: Generating image...");
      const response = await this.vertex.models.generateImages({
        model: this.modelId,
        prompt: prompt,
        config: {
          aspectRatio: "16:9",
          numberOfImages: 1,
          negativePrompt:
            "Disfigurements, six fingers per hand, low realism, lack of coherence, low-resolution images, grainy textures, lack of detail, abnormal appearances, illegible text, and grammatical and syntax errors, non-coherent situations, distorted human and/or animal bodies, figures, and objects; devices with more than one screen; screens popping out of devices, such as laptops and mobile phones; and people belonging to only one ethnicity.",
          personGeneration: PersonGeneration.ALLOW_ALL,
          safetyFilterLevel: SafetyFilterLevel.BLOCK_ONLY_HIGH,
          includeRaiReason: true,
          language: ImagePromptLanguage.auto,
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No image predictions returned from Vertex AI");
      }

      const generatedImage = response.generatedImages[0];
      if (!generatedImage.image || !generatedImage.image.imageBytes) {
        throw new Error("No image data returned from Vertex AI");
      }

      // Create initial data URL from generated image
      const mimeType = generatedImage.image.mimeType || "image/png";
      const rawDataUrl = `data:${mimeType};base64,${generatedImage.image.imageBytes}`;

      // Calculate original size
      const originalSizeBytes = Buffer.from(
        generatedImage.image.imageBytes,
        "base64"
      ).length;
      console.log(
        `📦 Vertex AI: Raw image size: ${formatFileSize(originalSizeBytes)}`
      );

      // Post-process: Always optimize and convert to JPEG for ActiveCampaign compatibility
      // ActiveCampaign requires JPG format, not PNG
      console.log(
        `🔧 Image Optimizer: Converting to JPEG and compressing (target: <${formatFileSize(IMAGE_SIZE_LIMITS.MAX_SIZE_BYTES)})...`
      );

      const optimizationResult = await optimizeEmailImage(rawDataUrl, {
        targetWidth: 600, // Standard email width for optimal mobile/desktop rendering
        maxSizeBytes: IMAGE_SIZE_LIMITS.MAX_SIZE_BYTES,
        outputFormat: "jpeg", // JPEG required for ActiveCampaign compatibility
        quality: 85,
        minQuality: 40,
      });

      if (optimizationResult.success) {
        console.log(
          `✅ Image Optimizer: Converted to JPEG - ${formatFileSize(optimizationResult.originalSizeBytes)} → ${formatFileSize(optimizationResult.finalSizeBytes)} (${optimizationResult.percentReduction}% reduction, quality: ${optimizationResult.qualityUsed})`
        );

        if (optimizationResult.warning) {
          console.warn(`⚠️ Image Optimizer: ${optimizationResult.warning}`);
        }

        // Validate JPEG format in the output
        if (!optimizationResult.dataUrl.startsWith("data:image/jpeg")) {
          console.error(
            `❌ CRITICAL: Image format validation failed. Expected JPEG but got: ${optimizationResult.dataUrl.substring(0, 30)}`
          );
          throw new Error(
            "Image format error: Expected JPEG format for ActiveCampaign compatibility"
          );
        }

        console.log("✅ Format Validation: JPEG format confirmed");
        return optimizationResult.dataUrl;
      } else {
        console.error(
          `❌ Image Optimizer: Optimization failed - ${optimizationResult.error}`
        );
        // DO NOT fall back to PNG - throw error instead for ActiveCampaign compatibility
        throw new Error(
          `Image optimization failed: ${optimizationResult.error}. JPEG format is required for ActiveCampaign.`
        );
      }
    } catch (error) {
      console.error("Error generating image with Vertex AI:", error);

      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Unknown error occurred during image generation");
      }
    }
  }

  // Health check method to verify service configuration
  async healthCheck(): Promise<{
    configured: boolean;
    projectId: string;
    location: string;
    model: string;
    authConfigured: boolean;
  }> {
    try {
      return {
        configured: true,
        projectId: this.projectId,
        location: this.locationId,
        model: this.modelId,
        authConfigured: true,
      };
    } catch {
      return {
        configured: false,
        projectId: this.projectId,
        location: this.locationId,
        model: this.modelId,
        authConfigured: false,
      };
    }
  }
}
