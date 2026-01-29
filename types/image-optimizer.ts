/**
 * Image Optimizer Types
 * Interfaces for automated email header image optimization
 */

/**
 * Target file size limits for email images
 * Email clients have varying limits; 100KB is a safe universal target
 */
export const IMAGE_SIZE_LIMITS = {
  /** Hard limit for email images (100KB) */
  MAX_SIZE_BYTES: 102400,
  /** Target size for optimal loading (80KB) */
  TARGET_SIZE_BYTES: 81920,
  /** Warning threshold (90KB) */
  WARNING_SIZE_BYTES: 92160,
} as const;

/**
 * Standard email template widths
 */
export const EMAIL_IMAGE_DIMENSIONS = {
  /** Standard email width */
  STANDARD_WIDTH: 600,
  /** Wide email templates */
  WIDE_WIDTH: 700,
  /** Maximum recommended width */
  MAX_WIDTH: 800,
  /** 16:9 aspect ratio height for standard width */
  STANDARD_HEIGHT_16_9: 338,
  /** 16:9 aspect ratio height for wide width */
  WIDE_HEIGHT_16_9: 394,
  /** 16:9 aspect ratio height for max width */
  MAX_HEIGHT_16_9: 450,
} as const;

/**
 * Supported output formats for email images
 */
export type ImageOutputFormat = "jpeg" | "webp" | "png";

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  /** Target width in pixels (default: 600) */
  targetWidth?: number;
  /** Maximum file size in bytes (default: 100KB) */
  maxSizeBytes?: number;
  /** Output format (default: jpeg for photos, webp for graphics) */
  outputFormat?: ImageOutputFormat;
  /** Initial quality setting 1-100 (default: 85) */
  quality?: number;
  /** Minimum quality to try before giving up (default: 40) */
  minQuality?: number;
  /** Quality decrement step for iterative compression (default: 5) */
  qualityStep?: number;
  /** Whether to preserve aspect ratio (default: true) */
  preserveAspectRatio?: boolean;
  /** Whether to strip metadata (default: true) */
  stripMetadata?: boolean;
}

/**
 * Result of image optimization
 */
export interface ImageOptimizationResult {
  /** Whether optimization was successful */
  success: boolean;
  /** Optimized image as base64 string */
  base64Data: string;
  /** MIME type of the output image */
  mimeType: string;
  /** Data URL ready to use in img src */
  dataUrl: string;
  /** Original size in bytes */
  originalSizeBytes: number;
  /** Final size in bytes */
  finalSizeBytes: number;
  /** Compression ratio achieved */
  compressionRatio: number;
  /** Percentage reduction */
  percentReduction: number;
  /** Final quality setting used */
  qualityUsed: number;
  /** Output format used */
  formatUsed: ImageOutputFormat;
  /** Final dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Warning message if size target wasn't fully met */
  warning?: string;
  /** Error message if optimization failed */
  error?: string;
}

/**
 * Image analysis result before optimization
 */
export interface ImageAnalysis {
  /** Original width */
  width: number;
  /** Original height */
  height: number;
  /** Original format */
  format: string;
  /** Original size in bytes */
  sizeBytes: number;
  /** Whether image needs optimization */
  needsOptimization: boolean;
  /** Recommended output format */
  recommendedFormat: ImageOutputFormat;
  /** Recommended width */
  recommendedWidth: number;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: Required<ImageOptimizationConfig> = {
  targetWidth: EMAIL_IMAGE_DIMENSIONS.STANDARD_WIDTH,
  maxSizeBytes: IMAGE_SIZE_LIMITS.MAX_SIZE_BYTES,
  outputFormat: "jpeg",
  quality: 85,
  minQuality: 40,
  qualityStep: 5,
  preserveAspectRatio: true,
  stripMetadata: true,
};
