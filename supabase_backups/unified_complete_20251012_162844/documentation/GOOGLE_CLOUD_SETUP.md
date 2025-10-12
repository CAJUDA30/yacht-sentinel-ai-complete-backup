# Google Cloud Document AI Setup Guide

This guide will help you systematically configure Google Cloud Document AI for yacht document processing.

## Prerequisites
- Google Cloud account
- Access to create projects and enable APIs
- Permission to create service accounts

## Step-by-Step Configuration

### 1. Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named `yachtexcel1` OR use existing project
3. Note your PROJECT_ID (e.g., `yachtexcel1` or `yachtexcel1-123456`)

### 2. Enable Required APIs

Enable these APIs for your project:
```
- Document AI API
- Cloud Storage API (optional, for document storage)
```

Navigate to: **APIs & Services > Library** and search for each API

### 3. Create Document AI Processor

1. Go to **Document AI > Processors**
2. Click **CREATE PROCESSOR**
3. Select **Custom Extractor** (or appropriate processor type)
4. Name it: `Custom Extractor - Yacht Documents`
5. Region: `us` (United States)
6. Click **CREATE**
7. Copy the **Processor ID** (e.g., `8708cd1d9cd87cc1`)

### 4. Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **CREATE SERVICE ACCOUNT**
3. Service account details:
   - Name: `yacht-sentinel-documentai`
   - Description: `Service account for Document AI processing`
4. Grant roles:
   - **Document AI API User**
   - **Storage Object Viewer** (if using Cloud Storage)
5. Click **DONE**

### 5. Generate Service Account Key

1. Click on your newly created service account
2. Go to **KEYS** tab
3. Click **ADD KEY > Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. Save the downloaded JSON file securely

### 6. Configure Environment Variables

1. Open the downloaded JSON key file
2. Copy the **entire content** (it should be a single-line JSON)
3. Edit `supabase/.env.local`:

```bash
# Replace with your actual values
GOOGLE_CLOUD_PROJECT_ID=yachtexcel1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"yachtexcel1",... PASTE ENTIRE JSON HERE ...}
DOCUMENT_AI_PROCESSOR_ID=8708cd1d9cd87cc1
```

### 7. Verify Configuration

Run the verification command:
```bash
npx supabase functions serve gcp-unified-config --env-file supabase/.env.local
```

Then test with:
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/gcp-unified-config \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

Expected response:
```json
{
  "config": {},
  "secrets": {
    "GOOGLE_SERVICE_ACCOUNT_JSON": true,
    "GOOGLE_CLOUD_PROJECT_ID": true
  }
}
```

## Configuration File Structure

The complete `.env.local` should look like:

```bash
GOOGLE_CLOUD_PROJECT_ID=yachtexcel1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"yachtexcel1","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"yacht-sentinel-documentai@yachtexcel1.iam.gserviceaccount.com","client_id":"1234567890","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
DOCUMENT_AI_PROCESSOR_ID=8708cd1d9cd87cc1
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### Error: "Missing GOOGLE_SERVICE_ACCOUNT_JSON"
- Ensure the JSON is pasted as a **single line** without line breaks
- Check that the JSON is valid (use a JSON validator)

### Error: "HTTP 401 Unauthorized"
- Verify service account has correct permissions
- Check that the service account key hasn't been deleted or revoked

### Error: "Processor not found"
- Verify processor ID matches exactly
- Ensure processor is in the `us` region
- Check project ID is correct

### Mock Mode (Development Without Credentials)
If Google Cloud credentials are not yet configured, the system will automatically return mock data with a warning. This allows development to continue while waiting for Google Cloud setup.

## Security Notes

⚠️ **IMPORTANT SECURITY PRACTICES:**
1. **Never commit** `.env.local` to version control (it's in `.gitignore`)
2. **Rotate keys** regularly (every 90 days recommended)
3. **Use principle of least privilege** - only grant necessary permissions
4. **Monitor usage** in Google Cloud Console for unusual activity
5. **Use separate service accounts** for dev/staging/production

## Next Steps

After configuration:
1. Test connection in the SuperAdmin panel
2. Upload a sample yacht document
3. Verify extraction results
4. Configure field mappings in Visual Mapping System

## Support Resources

- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [API Key Security](https://cloud.google.com/docs/authentication/api-keys)
