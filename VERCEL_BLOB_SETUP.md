# Vercel Blob Storage Setup

## Overview

The application uses Vercel Blob Storage for storing and managing the brand logo. This requires a `BLOB_READ_WRITE_TOKEN` to be configured.

## Setup Instructions

### 1. Get Your Vercel Blob Token

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard/stores
2. Click "Create Database" or "Create Store"
3. Select "Blob"
4. Give it a name (e.g., "inventos-assets")
5. Select your region
6. Click "Create"
7. Copy the `BLOB_READ_WRITE_TOKEN` value

**Option B: Using Vercel CLI**

```bash
vercel blob create inventos-assets
```

### 2. Add Token to Environment Variables

**For Local Development:**

1. Open your `.env` file
2. Add or update the token:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXX
```

3. Restart your dev server: `npm run dev`

**For Production (Vercel):**

1. Go to your project settings on Vercel
2. Navigate to "Settings" > "Environment Variables"
3. Add:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your token
   - **Environments**: Production, Preview, Development
4. Redeploy your application

### 3. Verify Setup

1. Go to Settings > Branding in your application
2. Try uploading a logo
3. If successful, the logo URL will be from `blob.vercel-storage.com`

## Features

✅ **Automatic Cleanup**: Old logos are automatically deleted when uploading a new one  
✅ **No Manual Storage**: Files are stored in Vercel's CDN  
✅ **Public Access**: Logos are publicly accessible via URL  
✅ **No Size Limits**: No local disk usage

## Troubleshooting

### Error: "Blob storage is not configured"

- Check that `BLOB_READ_WRITE_TOKEN` is set in your `.env` file
- Restart your development server after adding the token

### Error: "Upload failed"

- Verify your token is valid
- Check that your Vercel Blob store is active
- Ensure you have sufficient quota in your Vercel plan

### Logo not displaying

- Check browser console for CORS errors
- Verify the URL is accessible: visit it directly in a browser
- Ensure the blob store has public read access

## Alternative: Use Local Storage (Development Only)

If you want to use local file storage instead for development, you can keep the old implementation by:

1. Comment out the Vercel Blob code
2. Use the file system approach (see git history for the previous implementation)

Note: Local storage won't work on Vercel or other serverless platforms.
