/**
 * Image Optimizer
 * Automated post-processing for email header images
 *
 * Implements server-side image optimization to enforce a hard file size limit
 * of 100KB for all generated assets, ensuring cross-client compatibility.
 *
 * Features:
 * - Format conversion (PNG → JPEG/WebP)
 * - Dimension resizing to email template widths
 * - Iterative quality adjustment to meet size targets
 * - Metadata stripping for reduced payload
 */

import sharp from "sharp";
import {
  ImageOptimizationConfig,
  ImageOptimizationResult,
  ImageAnalysis,
  ImageOutputFormat,
  IMAGE_SIZE_LIMITS,
  EMAIL_IMAGE_DIMENSIONS,
  DEFAULT_OPTIMIZATION_CONFIG,
} from "@/types/image-optimizer";

/**
 * Extract base64 data from a data URL
 */
function extractBase64FromDataUrl(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }
  return {
    mimeType: matches[1],
    base64: matches[2],
  };
}

/**
 * Convert base64 string to Buffer
 */
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

/**
 * Convert Buffer to base64 string
 */
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

/**
 * Analyze an image to determine optimization needs
 */
export async function analyzeImage(
  imageDataUrl: string
): Promise<ImageAnalysis> {
  const { base64 } = extractBase64FromDataUrl(imageDataUrl);
  const buffer = base64ToBuffer(base64);
  const metadata = await sharp(buffer).metadata();

  const sizeBytes = buffer.length;
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const format = metadata.format || "unknown";

  // Determine if optimization is needed
  const needsOptimization =
    sizeBytes > IMAGE_SIZE_LIMITS.TARGET_SIZE_BYTES ||
    width > EMAIL_IMAGE_DIMENSIONS.MAX_WIDTH;

  // Recommend format based on content type
  // JPEG is best for photographic content (which Imagen generates)
  const recommendedFormat: ImageOutputFormat =
    format === "png" && sizeBytes > IMAGE_SIZE_LIMITS.TARGET_SIZE_BYTES
      ? "jpeg"
      : "jpeg";

  // Recommend width
  const recommendedWidth = Math.min(width, EMAIL_IMAGE_DIMENSIONS.WIDE_WIDTH);

  return {
    width,
    height,
    format,
    sizeBytes,
    needsOptimization,
    recommendedFormat,
    recommendedWidth,
  };
}

/**
 * Optimize an image with the specified format and quality
 */
async function compressWithSettings(
  buffer: Buffer,
  width: number,
  format: ImageOutputFormat,
  quality: number,
  stripMetadata: boolean
): Promise<Buffer> {
  let pipeline = sharp(buffer).resize(width, null, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Strip metadata if requested
  if (stripMetadata) {
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
  }

  // Apply format-specific compression
  switch (format) {
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality,
        mozjpeg: true, // Use mozjpeg for better compression
        chromaSubsampling: "4:2:0",
      });
      break;
    case "webp":
      pipeline = pipeline.webp({
        quality,
        effort: 6, // Higher effort = better compression
        smartSubsample: true,
      });
      break;
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: true,
        quality,
      });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Get MIME type for output format
 */
function getMimeType(format: ImageOutputFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "png":
      return "image/png";
  }
}

/**
 * Optimize an image for email delivery
 *
 * This function performs iterative compression to meet the target file size:
 * 1. Resize to email-appropriate dimensions
 * 2. Convert to efficient format (JPEG/WebP)
 * 3. Progressively reduce quality until size target is met
 *
 * @param imageDataUrl - Base64 data URL of the source image
 * @param config - Optimization configuration options
 * @returns Optimization result with compressed image data
 */
export async function optimizeEmailImage(
  imageDataUrl: string,
  config?: ImageOptimizationConfig
): Promise<ImageOptimizationResult> {
  const startTime = Date.now();
  const settings = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };

  try {
    // Extract and analyze the source image
    const { base64 } = extractBase64FromDataUrl(imageDataUrl);
    const sourceBuffer = base64ToBuffer(base64);
    const originalSizeBytes = sourceBuffer.length;

    // Get source image dimensions
    const metadata = await sharp(sourceBuffer).metadata();
    const sourceWidth = metadata.width || settings.targetWidth;
    const sourceHeight = metadata.height || 0;

    // Calculate target dimensions maintaining aspect ratio
    const targetWidth = Math.min(sourceWidth, settings.targetWidth);
    const aspectRatio = sourceHeight / sourceWidth;
    const targetHeight = Math.round(targetWidth * aspectRatio);

    // Determine output format
    const outputFormat = settings.outputFormat;
    let currentQuality = settings.quality;
    let optimizedBuffer: Buffer;
    let attempts = 0;
    const maxAttempts =
      Math.ceil(
        (settings.quality - settings.minQuality) / settings.qualityStep
      ) + 1;

    // Iterative compression to meet size target
    do {
      optimizedBuffer = await compressWithSettings(
        sourceBuffer,
        targetWidth,
        outputFormat,
        currentQuality,
        settings.stripMetadata
      );

      attempts++;

      // If still too large, reduce quality
      if (
        optimizedBuffer.length > settings.maxSizeBytes &&
        currentQuality > settings.minQuality
      ) {
        currentQuality = Math.max(
          settings.minQuality,
          currentQuality - settings.qualityStep
        );
      } else {
        break;
      }
    } while (attempts < maxAttempts);

    const finalSizeBytes = optimizedBuffer.length;
    const compressionRatio = originalSizeBytes / finalSizeBytes;
    const percentReduction =
      ((originalSizeBytes - finalSizeBytes) / originalSizeBytes) * 100;

    // Check if we met the target
    let warning: string | undefined;
    if (finalSizeBytes > settings.maxSizeBytes) {
      warning = `Could not compress below ${settings.maxSizeBytes} bytes. Final size: ${finalSizeBytes} bytes at quality ${currentQuality}`;
    }

    const base64Data = bufferToBase64(optimizedBuffer);
    const mimeType = getMimeType(outputFormat);

    return {
      success: true,
      base64Data,
      mimeType,
      dataUrl: `data:${mimeType};base64,${base64Data}`,
      originalSizeBytes,
      finalSizeBytes,
      compressionRatio: parseFloat(compressionRatio.toFixed(2)),
      percentReduction: parseFloat(percentReduction.toFixed(1)),
      qualityUsed: currentQuality,
      formatUsed: outputFormat,
      dimensions: {
        width: targetWidth,
        height: targetHeight,
      },
      processingTimeMs: Date.now() - startTime,
      warning,
    };
  } catch (error) {
    return {
      success: false,
      base64Data: "",
      mimeType: "",
      dataUrl: "",
      originalSizeBytes: 0,
      finalSizeBytes: 0,
      compressionRatio: 0,
      percentReduction: 0,
      qualityUsed: 0,
      formatUsed: settings.outputFormat,
      dimensions: { width: 0, height: 0 },
      processingTimeMs: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : "Unknown optimization error",
    };
  }
}

/**
 * Quick check if an image needs optimization
 */
export async function needsOptimization(
  imageDataUrl: string
): Promise<boolean> {
  try {
    const analysis = await analyzeImage(imageDataUrl);
    return analysis.needsOptimization;
  } catch {
    return true; // Assume optimization needed if analysis fails
  }
}

/**
 * Get optimization recommendation for an image
 */
export async function getOptimizationRecommendation(
  imageDataUrl: string
): Promise<{
  needsOptimization: boolean;
  currentSizeKB: number;
  estimatedSizeKB: number;
  recommendation: string;
}> {
  try {
    const analysis = await analyzeImage(imageDataUrl);
    const currentSizeKB = parseFloat((analysis.sizeBytes / 1024).toFixed(1));

    // Estimate final size based on typical compression ratios
    const estimatedRatio = analysis.format === "png" ? 0.15 : 0.5;
    const estimatedSizeKB = parseFloat(
      ((analysis.sizeBytes * estimatedRatio) / 1024).toFixed(1)
    );

    let recommendation: string;
    if (!analysis.needsOptimization) {
      recommendation = "Image is already optimized for email delivery.";
    } else if (analysis.sizeBytes > IMAGE_SIZE_LIMITS.MAX_SIZE_BYTES * 10) {
      recommendation = `Image is ${currentSizeKB}KB. Will convert to ${analysis.recommendedFormat.toUpperCase()} and resize to ${analysis.recommendedWidth}px width. Estimated final size: ~${estimatedSizeKB}KB.`;
    } else {
      recommendation = `Image is ${currentSizeKB}KB. Light optimization recommended to ensure email deliverability.`;
    }

    return {
      needsOptimization: analysis.needsOptimization,
      currentSizeKB,
      estimatedSizeKB,
      recommendation,
    };
  } catch (error) {
    return {
      needsOptimization: true,
      currentSizeKB: 0,
      estimatedSizeKB: 0,
      recommendation: `Unable to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
