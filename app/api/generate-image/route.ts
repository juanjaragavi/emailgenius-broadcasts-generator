import { NextRequest, NextResponse } from "next/server";
import { VertexAIImageService } from "@/lib/vertexai-imagen";

// Initialize Vertex AI Image service
let vertexAIImageService: VertexAIImageService | null = null;

// Initialize the service with error handling
function getImageService(): VertexAIImageService {
  if (!vertexAIImageService) {
    try {
      vertexAIImageService = new VertexAIImageService();
    } catch (error) {
      console.error("Failed to initialize Vertex AI Image Service:", error);
      throw error;
    }
  }
  return vertexAIImageService;
}

export async function POST(request: NextRequest) {
  try {
    const { imagePrompt } = await request.json();

    if (!imagePrompt) {
      return NextResponse.json(
        {
          error: "imagePrompt is required",
        },
        { status: 400 }
      );
    }

    // Ensure the prompt is properly formatted for best results
    let formattedPrompt = imagePrompt;
    
    // If the prompt doesn't start with "Generate", add it
    if (!formattedPrompt.toLowerCase().startsWith("generate")) {
      formattedPrompt = `Generate ${imagePrompt}`;
    }
    
    // If the prompt doesn't end with aspect ratio instruction, add it
    if (!formattedPrompt.includes("16:9 aspect ratio")) {
      formattedPrompt = `${formattedPrompt} Generate the image with a 16:9 aspect ratio.`;
    }

    // Get the image service instance
    const imageService = getImageService();
    
    // Generate the image
    const imageDataUrl = await imageService.generateImage(formattedPrompt);

    return NextResponse.json({ 
      imageUrl: imageDataUrl,
      success: true 
    });
  } catch (error) {
    console.error("Error in image generation API:", error);

    let errorMessage = "Failed to generate image";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Map error messages to appropriate status codes
      if (
        error.message.includes("authentication") ||
        error.message.includes("Authentication failed") ||
        error.message.includes("access token")
      ) {
        statusCode = 401;
        errorMessage = "Authentication failed. Please check Service Account configuration.";
      } else if (
        error.message.includes("Permission denied") ||
        error.message.includes("403")
      ) {
        statusCode = 403;
        errorMessage = "Permission denied. Ensure Service Account has Vertex AI permissions.";
      } else if (
        error.message.includes("quota") ||
        error.message.includes("429")
      ) {
        statusCode = 429;
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (
        error.message.includes("GOOGLE_SERVICE_ACCOUNT_EMAIL") ||
        error.message.includes("GOOGLE_PRIVATE_KEY") ||
        error.message.includes("GOOGLE_CLOUD_PROJECT")
      ) {
        statusCode = 500;
        errorMessage = "Server configuration error. Missing required environment variables.";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.stack : "Unknown error" : undefined,
      },
      { status: statusCode }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const imageService = getImageService();
    const health = await imageService.healthCheck();
    
    return NextResponse.json({
      message: "Image Generation API is running",
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Image Generation API configuration error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
