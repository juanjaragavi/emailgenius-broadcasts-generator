# Environment Variables for GitHub Integration

## Required GitHub App Configuration

To enable automatic file uploads to GitHub repositories, you need to set up the following environment variables:

### GitHub App Authentication

```env
# GitHub App ID (found in your GitHub App settings)
GITHUB_APP_ID=your_app_id_here

# GitHub App Private Key (PEM format - can include \n or real newlines)
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_content_here
-----END PRIVATE KEY-----"

# Target repository owner (GitHub username or organization)
GITHUB_OWNER=juanjaragavi

# Target repository name
GITHUB_REPO=emailgenius-winner-broadcasts-subjects
```

## GitHub App Setup Instructions

### 1. Create a GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in the required information:
   - **App name**: `EmailGenius File Uploader`
   - **Homepage URL**: `https://email.topfinanzas.com`
   - **Description**: `Automated file uploads from EmailGenius application`

### 2. Configure Permissions

Set the following **Repository permissions**:

- **Contents**: Read and Write (to create/update files)
- **Metadata**: Read (to access repository information)
- **Pull requests**: Write (to create pull requests)

### 3. Generate Private Key

1. In your GitHub App settings, scroll to "Private keys"
2. Click "Generate a private key"
3. Download the `.pem` file
4. Copy the content to your `GITHUB_APP_PRIVATE_KEY` environment variable

### 4. Install the App

1. Go to your GitHub App → "Install App"
2. Select your account/organization
3. Choose "Selected repositories" and select `juanjaragavi/emailgenius-winner-broadcasts-subjects`
4. Click "Install"

### 5. Find App ID

1. In your GitHub App settings, note the "App ID" number
2. Add this to your `GITHUB_APP_ID` environment variable

## Production Deployment

### PM2 Ecosystem Configuration

Add the environment variables to your `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "emailgenius-broadcasts-generator",
      script: "npm",
      args: "start",
      cwd: "/var/www/html/emailgenius-broadcasts-generator",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3020,
        // GitHub Configuration
        GITHUB_APP_ID: "your_app_id",
        GITHUB_APP_PRIVATE_KEY:
          "-----BEGIN PRIVATE KEY-----\nyour_key_here\n-----END PRIVATE KEY-----",
        GITHUB_OWNER: "juanjaragavi",
        GITHUB_REPO: "emailgenius-winner-broadcasts-subjects",
        // ... other existing env vars
      },
    },
  ],
};
```

### Environment File (.env.local)

Alternatively, create a `.env.local` file:

```env
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB...
-----END PRIVATE KEY-----"
GITHUB_OWNER=juanjaragavi
GITHUB_REPO=emailgenius-winner-broadcasts-subjects
```

## Security Best Practices

### 1. Private Key Management

- Never commit private keys to version control
- Use environment variables or secure secret management
- Rotate keys periodically

### 2. Repository Access

- Use minimal required permissions
- Install app only on necessary repositories
- Monitor app usage through GitHub audit logs

### 3. Rate Limiting

- GitHub API has rate limits (5,000 requests/hour for apps)
- The application includes automatic retry logic
- Monitor usage to avoid hitting limits

## Testing the Integration

### 1. Health Check

Test the API endpoint:

```bash
curl https://email.topfinanzas.com/api/upload-winner-subject
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-08-21T10:30:00.000Z",
  "config": {
    "hasOwner": true,
    "hasRepo": true,
    "hasAppId": true,
    "allowedExtensions": [".md", ".txt", ".json", ".csv", ".yaml", ".yml"],
    "maxSizeBytes": 1048576
  }
}
```

### 2. File Upload Test

```bash
curl -X POST https://email.topfinanzas.com/api/upload-winner-subject \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-subject.md",
    "content": "# Test Subject\n\nThis is a test upload.",
    "commitMessage": "test: upload via API"
  }'
```

Expected response:

```json
{
  "ok": true,
  "path": "subjects/2025/08/21/test-subject.md",
  "branch": "upload/2025-08-21-1234567890",
  "commitUrl": "https://github.com/juanjaragavi/emailgenius-winner-broadcasts-subjects/commit/abc123",
  "prUrl": "https://github.com/juanjaragavi/emailgenius-winner-broadcasts-subjects/pull/1"
}
```

## Troubleshooting

### Common Issues

1. **Authentication Error (401/403)**
   - Check that GITHUB_APP_ID is correct
   - Verify private key format (ensure newlines are properly escaped)
   - Confirm app is installed on the target repository

2. **Repository Not Found (404)**
   - Verify GITHUB_OWNER and GITHUB_REPO values
   - Check that the app has access to the repository
   - Ensure repository exists and is accessible

3. **Permission Denied**
   - Review app permissions in GitHub App settings
   - Ensure "Contents" permission is set to "Read and Write"
   - Check that app installation includes the target repository

4. **Rate Limiting (429)**
   - Implement exponential backoff
   - Monitor API usage
   - Consider using GitHub Actions for high-volume uploads

### Debugging

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will include detailed error messages in API responses.

## Advanced Configuration

### Custom File Paths

You can customize the file path structure:

```javascript
{
  "filename": "winner-subject.md",
  "content": "...",
  "pathTemplate": "uploads/{year}/{month}/{filename}"
}
```

Available placeholders:

- `{year}` - Current year (2025)
- `{month}` - Current month (01-12)
- `{day}` - Current day (01-31)
- `{filename}` - Sanitized filename

### Metadata Support

Include additional metadata in commits:

```javascript
{
  "filename": "winner-subject.md",
  "content": "...",
  "metadata": {
    "campaign": "summer-2025",
    "market": "USA",
    "platform": "ConvertKit"
  }
}
```

This metadata will be included in the commit message and PR description.
