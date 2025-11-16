# Windmill Scripts for Twenty CRM File Upload

This folder contains Windmill scripts demonstrating how to upload files and create attachments in Twenty CRM.

## 📁 Available Scripts

### 0. `test-twenty-connection.ts` ⭐ **START HERE**
Test connection to Twenty CRM API before running other scripts.

**Use case:** Diagnose connection issues, verify API URL and API key

**Run this first if you get errors!**

### 1. `upload-file-to-twenty-task.ts`
Upload a file and attach it to a new Task.

**Use case:** Creating tasks with supporting documents (specs, requirements, etc.)

### 2. `upload-file-to-twenty-opportunity.ts`
Upload a file and attach it to a new Opportunity.

**Use case:** Attaching proposals, contracts, quotes to deals

### 3. `simple-file-upload-test.ts`
Simple test to upload a file without creating Task/Opportunity.

**Use case:** Quick test of file upload functionality

---

## ⚙️ Setup in Windmill

### Step 1: Create Resource

1. In Windmill, go to **Resources**
2. Create a new resource with path: `u/chipvn/twenty`
3. Select resource type: **Custom**
4. Add these fields:

```json
{
  "apiUrl": "https://your-twenty-instance.com/graphql",
  "apiKey": "your-api-key-here"
}
```

**How to get API key:**
1. Login to Twenty CRM
2. Go to Settings > Developers > API Keys
3. Click "Create API Key"
4. Copy the generated key

### Step 2: Import Script

1. Go to **Scripts** in Windmill
2. Click **New Script** > **TypeScript**
3. Copy the content from one of the script files
4. Save the script

### Step 3: Run Script

Click **Run** and provide parameters:

#### For Task Script:
- `twenty`: Select resource `u/chipvn/twenty`
- `taskTitle`: e.g., "Review contract"
- `taskBody`: e.g., "Please review the attached contract"
- `taskStatus`: "TODO", "IN_PROGRESS", or "DONE"
- `fileName`: e.g., "contract.pdf"
- `fileContent`: Paste file content as text or upload binary

#### For Opportunity Script:
- `twenty`: Select resource `u/chipvn/twenty`
- `opportunityName`: e.g., "Enterprise Deal - ACME Corp"
- `opportunityAmountMicros`: e.g., 50000000000 (= $50,000)
- `opportunityCurrencyCode`: e.g., "USD"
- `opportunityStage`: "NEW", "MEETING", "PROPOSAL", "NEGOTIATION", or "WON"
- `fileName`: e.g., "proposal.pdf"
- `fileContent`: File content

---

## 💡 Quick Examples

### Example 1: Upload Text File to Task

```typescript
// Parameters:
{
  "taskTitle": "Review project spec",
  "taskBody": "Please review the attached specification document",
  "taskStatus": "TODO",
  "fileName": "project-spec.txt",
  "fileContent": "Project Specification\n\n1. Requirements...\n2. Timeline..."
}
```

### Example 2: Upload PDF to Opportunity

```typescript
// Parameters:
{
  "opportunityName": "Q4 Enterprise Deal",
  "opportunityAmountMicros": 100000000000, // $100,000
  "opportunityCurrencyCode": "USD",
  "opportunityStage": "PROPOSAL",
  "fileName": "proposal.pdf",
  "fileContent": "<binary PDF content or base64>"
}
```

### Example 3: Upload CSV Spreadsheet to Task

```typescript
// Parameters:
{
  "taskTitle": "Analyze sales data",
  "fileName": "sales-data.csv",
  "fileContent": "Date,Revenue,Customers\n2024-01-01,50000,120\n2024-01-02,52000,125"
}
```

---

## 🔧 Advanced Usage

### Uploading Binary Files

To upload binary files (PDF, images, etc.) from Windmill:

**Option 1: Use Windmill File Input**
```typescript
export async function main(
  twenty: TwentyResource,
  uploadedFile: wmill.Resource<"s3_object"> // Windmill file input
) {
  // Read file from Windmill S3
  const fileBuffer = await wmill.s3Download(uploadedFile);

  // Upload to Twenty
  await uploadFile(
    twenty.apiUrl,
    twenty.apiKey,
    fileBuffer,
    uploadedFile.filename
  );
}
```

**Option 2: Fetch from URL**
```typescript
// Download file from URL
const response = await fetch("https://example.com/document.pdf");
const fileBuffer = await response.arrayBuffer();

// Upload to Twenty
await uploadFile(
  twenty.apiUrl,
  twenty.apiKey,
  new Uint8Array(fileBuffer),
  "document.pdf"
);
```

**Option 3: Base64 Encoded**
```typescript
// Decode base64
const fileBuffer = Buffer.from(base64String, 'base64');

// Upload to Twenty
await uploadFile(
  twenty.apiUrl,
  twenty.apiKey,
  fileBuffer,
  "document.pdf"
);
```

---

## 📊 File Categories

The scripts automatically detect file category based on extension:

| Category | Extensions |
|----------|------------|
| **IMAGE** | jpg, jpeg, png, gif, svg, webp, bmp |
| **VIDEO** | mp4, avi, mov, mkv, webm, flv |
| **AUDIO** | mp3, wav, ogg, flac, m4a |
| **TEXT_DOCUMENT** | pdf, doc, docx, txt, rtf, odt |
| **SPREADSHEET** | xls, xlsx, csv, ods |
| **PRESENTATION** | ppt, pptx, odp |
| **ARCHIVE** | zip, rar, 7z, tar, gz, bz2 |
| **OTHER** | Any other extension |

---

## 🎯 Workflow Integration Examples

### Example 1: Email Trigger → Create Task with Attachment

```typescript
// Windmill Flow:
// 1. Email Trigger (receives email with attachment)
// 2. Extract attachment from email
// 3. Run upload-file-to-twenty-task.ts
// 4. Send confirmation email

export async function main(emailData: any) {
  const { subject, body, attachments } = emailData;

  // Create task with first attachment
  if (attachments.length > 0) {
    const attachment = attachments[0];

    return await wmill.runScript(
      "upload-file-to-twenty-task",
      {
        taskTitle: `Email: ${subject}`,
        taskBody: body,
        fileName: attachment.filename,
        fileContent: attachment.content
      }
    );
  }
}
```

### Example 2: Form Submission → Create Opportunity with Proposal

```typescript
// Windmill Flow:
// 1. Webhook trigger (form submission)
// 2. Extract form data
// 3. Run upload-file-to-twenty-opportunity.ts
// 4. Send notification to sales team

export async function main(formData: any) {
  const {
    companyName,
    dealAmount,
    proposalFile
  } = formData;

  return await wmill.runScript(
    "upload-file-to-twenty-opportunity",
    {
      opportunityName: `Deal - ${companyName}`,
      opportunityAmountMicros: dealAmount * 1000000, // Convert to micros
      fileName: proposalFile.name,
      fileContent: proposalFile.content
    }
  );
}
```

### Example 3: Daily Report → Attach to Task

```typescript
// Windmill Schedule: Daily at 9 AM
// Generate report and attach to task

export async function main() {
  // Generate CSV report
  const reportContent = generateDailyReport();
  const todayDate = new Date().toISOString().split('T')[0];

  return await wmill.runScript(
    "upload-file-to-twenty-task",
    {
      taskTitle: `Daily Report - ${todayDate}`,
      taskBody: "Automated daily report",
      taskStatus: "TODO",
      fileName: `daily-report-${todayDate}.csv`,
      fileContent: reportContent
    }
  );
}
```

---

## 🔍 Troubleshooting

### ❌ Error: "Failed to create opportunity: Not Found" (404)

**Cause:** GraphQL endpoint URL is incorrect

**Solution:**
1. Check your Twenty instance URL
2. Update resource `u/chipvn/twenty` with correct URL

**Correct URL formats:**
- ✅ `https://[your-instance].twenty.com/graphql`
- ✅ `https://crm.example.com/graphql` (self-hosted)
- ✅ `http://localhost:3000/graphql` (local dev)

**WRONG formats:**
- ❌ `https://api.twenty.com/graphql` (this is just an example)
- ❌ `https://twenty.com/graphql`
- ❌ `https://[instance].twenty.com/rest/graphql`

**How to find your URL:**
1. Login to your Twenty CRM
2. Open browser DevTools (F12)
3. Go to Network tab
4. Perform any action in Twenty (create task, etc.)
5. Look for GraphQL request
6. Copy the URL from that request

**Quick test:**
Run the `test-twenty-connection.ts` script first to diagnose connection issues.

### ❌ Error: "401 Unauthorized"

**Cause:** Invalid or expired API key

**Solution:**
1. Go to Twenty CRM
2. Settings > Developers > API Keys
3. Create new API key
4. Update resource `u/chipvn/twenty` with new key

### ❌ Error: "Failed to upload file"

**Causes:**
- Invalid API key
- File too large (check Twenty instance limits)
- Network timeout

**Solutions:**
1. Verify API key in resource
2. Check file size (reduce if needed)
3. Increase Windmill timeout setting

### ❌ Error: "GraphQL errors: Field 'opportunityId' not found"

**Cause:** Trying to link attachment to non-existent opportunity

**Solution:**
1. First create the opportunity
2. Then create attachment with the returned opportunity ID
3. Or use the scripts which handle both steps automatically

### ❌ Error: "Cannot read property 'getHeaders' of undefined"

**Cause:** form-data library not imported correctly

**Solution:**
```typescript
// Add at top of script
const FormData = (await import('form-data')).default;
```

### 🔧 Debug Steps

**Step 1: Test Connection**
```bash
# Run test-twenty-connection.ts script
# This will diagnose:
# - URL reachability
# - GraphQL API working
# - API key validity
# - Query permissions
```

**Step 2: Check Resource Configuration**
```json
// u/chipvn/twenty should have:
{
  "apiUrl": "https://YOUR-INSTANCE.twenty.com/graphql",  // ← Check this!
  "apiKey": "your-api-key-here"
}
```

**Step 3: Verify Twenty Instance**
- Open `https://YOUR-INSTANCE.twenty.com` in browser
- Make sure you can login
- Check if GraphQL endpoint exists: `https://YOUR-INSTANCE.twenty.com/graphql`

---

## 📚 Related Documentation

- [FILE-UPLOAD-API-GUIDE.md](../FILE-UPLOAD-API-GUIDE.md) - Complete file upload API documentation
- [Twenty CRM API Docs](https://twenty.com/developers) - Official API documentation
- [Windmill Docs](https://www.windmill.dev/docs) - Windmill platform documentation

---

## 🚀 Next Steps

1. **Test the scripts** with sample data
2. **Customize** for your specific use case
3. **Integrate** into Windmill flows/schedules
4. **Monitor** execution logs for debugging

For questions or issues, check the Twenty CRM documentation or Windmill community forums.
