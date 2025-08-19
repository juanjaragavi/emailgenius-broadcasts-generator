# Image Generation Feature Documentation

## Overview

The EmailGenius Broadcasts Generator now includes automated AI-powered image generation using Google Cloud's Vertex AI Imagen model. This feature automatically creates visually compelling header images for email campaigns based on the generated email content.

## Architecture

### Components

1. **Vertex AI Service** (`lib/vertexai-imagen.ts`)
   - Handles authentication with GCP Service Account
   - Manages API calls to Vertex AI Imagen model
   - Returns base64-encoded images

2. **API Endpoint** (`app/api/generate-image/route.ts`)
   - Processes image generation requests
   - Handles error management and status codes
   - Provides health check endpoint

3. **Frontend Integration** (`app/page.tsx`)
   - Automatic image generation after email content
   - Image display with loading states
   - Download functionality
   - Error handling with retry options

## Setup Instructions

### Prerequisites

1. Google Cloud Project with billing enabled
2. Vertex AI API enabled in the project
3. Service Account with appropriate permissions

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click **Create Service Account**
4. Provide a name and description
5. Grant the following roles:
   - **Vertex AI User**
   - **Vertex AI Service Agent**
6. Create and download JSON key

### Step 2: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the required values from your Service Account JSON key:
   ```env
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Step 3: Install Dependencies

The required dependencies should already be installed:
```bash
npm install
```

If needed, install manually:
```bash
npm install google-auth-library
```

### Step 4: Start the Application

```bash
npm run dev
```

The application will run on `http://localhost:3020`

## Usage

### Automatic Generation

1. Fill in the broadcast configuration form
2. Click "Generar Broadcast"
3. The image will automatically generate after the email content
4. View the generated image in the results section

### Manual Generation

If automatic generation fails or you want to regenerate:
1. Click "Generar Imagen" button below the image preview
2. Wait for the generation to complete
3. Download the image using the "Descargar" button

### Image Specifications

- **Aspect Ratio**: 16:9 (optimized for email headers)
- **Format**: PNG
- **Resolution**: High-quality, suitable for email campaigns
- **Style**: Ultra-realistic stock photography

## API Reference

### Generate Image Endpoint

**POST** `/api/generate-image`

#### Request Body
```json
{
  "imagePrompt": "Generate an ultra-realistic image of..."
}
```

#### Success Response
```json
{
  "imageUrl": "data:image/png;base64,...",
  "success": true
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": "Stack trace (development only)"
}
```

### Health Check Endpoint

**GET** `/api/generate-image`

#### Response
```json
{
  "message": "Image Generation API is running",
  "health": {
    "configured": true,
    "projectId": "project-id",
    "location": "us-central1",
    "model": "imagen-4.0-generate-preview-06-06",
    "authConfigured": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

### Common Errors and Solutions

1. **Authentication Failed (401)**
   - Verify Service Account credentials in `.env.local`
   - Ensure private key format is correct
   - Check that service account email is valid

2. **Permission Denied (403)**
   - Verify Service Account has Vertex AI permissions
   - Check project IAM settings
   - Ensure Vertex AI API is enabled

3. **Quota Exceeded (429)**
   - Wait and retry later
   - Check GCP quotas and limits
   - Consider upgrading quota limits

4. **Configuration Error (500)**
   - Check all required environment variables
   - Verify project ID is correct
   - Ensure billing is enabled

## Security Considerations

1. **Never commit `.env.local` to version control**
2. **Keep Service Account keys secure**
3. **Use least privilege principle**
4. **Rotate keys regularly**
5. **For production, use Google Secret Manager**

## Image Generation Parameters

The service uses the following parameters for optimal results:

```javascript
{
  aspectRatio: "16:9",
  sampleCount: 1,
  negativePrompt: "Disfigurements, low quality, grainy...",
  enhancePrompt: false,
  personGeneration: "allow_all",
  safetySetting: "block_few",
  addWatermark: false,
  includeRaiReason: true,
  language: "auto"
}
```

## Troubleshooting

### Image Not Generating

1. Check browser console for errors
2. Verify API endpoint is accessible:
   ```bash
   curl http://localhost:3020/api/generate-image
   ```
3. Check server logs for detailed error messages

### Poor Image Quality

1. Review the image prompt for clarity
2. Ensure prompt includes detailed descriptions
3. Check that prompt ends with aspect ratio specification

### Authentication Issues

1. Verify environment variables are loaded:
   ```javascript
   console.log(process.env.GOOGLE_CLOUD_PROJECT)
   ```
2. Test Service Account permissions in GCP Console
3. Regenerate Service Account key if needed

## Performance Optimization

- Images are generated asynchronously
- Base64 encoding for efficient delivery
- Caching considerations for production
- Progressive loading states for better UX

## Future Enhancements

- [ ] Image caching mechanism
- [ ] Multiple aspect ratio options
- [ ] Style customization options
- [ ] Batch image generation
- [ ] Image history and management
- [ ] Advanced prompt templates
- [ ] A/B testing for images

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check server logs for detailed errors
4. Verify GCP project configuration
5. Ensure all dependencies are installed

## License

This feature is part of the EmailGenius Broadcasts Generator project.
