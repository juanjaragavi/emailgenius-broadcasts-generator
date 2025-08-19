import { GoogleAuth } from "google-auth-library";

interface ImageGenerationResponse {
  predictions: Array<{
    mimeType: string;
    bytesBase64Encoded: string;
  }>;
}

export class VertexAIImageService {
  private auth: GoogleAuth;
  private readonly projectId: string;
  private readonly locationId: string;
  private readonly modelId: string;
  private readonly endpoint: string;

  constructor() {
    // Get project configuration from environment variables
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    this.locationId = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    this.modelId = "imagen-4.0-generate-preview-06-06";
    
    if (!this.projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
    }

    // Configure authentication with Service Account credentials
    const credentials = this.getServiceAccountCredentials();
    
    this.auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    // Build the Vertex AI endpoint URL
    this.endpoint = `https://${this.locationId}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.locationId}/publishers/google/models/${this.modelId}:predict`;
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
      // Get access token using Service Account credentials
      const client = await this.auth.getClient();
      const accessTokenResponse = await client.getAccessToken();
      
      if (!accessTokenResponse.token) {
        throw new Error("Failed to obtain access token from Service Account");
      }

      // Prepare the request body for Imagen
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          aspectRatio: "16:9", // Horizontal aspect ratio for email headers
          sampleCount: 1,
          negativePrompt:
            "Disfigurements, six fingers per hand, low realism, lack of coherence, low-resolution images, grainy textures, lack of detail, abnormal appearances, illegible text, and grammatical and syntax errors, non-coherent situations, distorted human and/or animal bodies, figures, and objects; devices with more than one screen; screens popping out of devices, such as laptops and mobile phones; and people belonging to only one ethnicity.",
          enhancePrompt: false,
          personGeneration: "allow_all",
          safetySetting: "block_few",
          addWatermark: false,
          includeRaiReason: true,
          language: "auto",
        },
      };

      // Make the API request to Vertex AI
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessTokenResponse.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vertex AI API Error:", errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication failed. Please check your Service Account credentials.");
        } else if (response.status === 403) {
          throw new Error("Permission denied. Ensure the Service Account has Vertex AI permissions.");
        } else if (response.status === 429) {
          throw new Error("API quota exceeded. Please try again later.");
        } else {
          throw new Error(
            `Vertex AI request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
      }

      const result: ImageGenerationResponse = await response.json();

      // Validate response structure
      if (!result.predictions || result.predictions.length === 0) {
        throw new Error("No image predictions returned from Vertex AI");
      }

      const prediction = result.predictions[0];
      if (!prediction.bytesBase64Encoded) {
        throw new Error("No image data returned from Vertex AI");
      }

      // Return base64 encoded image as data URL
      const mimeType = prediction.mimeType || "image/png";
      return `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
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
      const client = await this.auth.getClient();
      const token = await client.getAccessToken();
      
      return {
        configured: true,
        projectId: this.projectId,
        location: this.locationId,
        model: this.modelId,
        authConfigured: !!token.token,
      };
    } catch (error) {
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
