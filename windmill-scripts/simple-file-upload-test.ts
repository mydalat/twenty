/**
 * Windmill Script: Simple File Upload Test for Twenty CRM
 *
 * This is a simplified script to test file upload functionality.
 * It only uploads a file without creating Task or Opportunity.
 *
 * Resource required: u/chipvn/twenty
 */

type TwentyResource = {
  apiUrl: string;
  apiKey: string;
};

type FileUploadResponse = {
  path: string;
  token: string;
};

/**
 * Upload file to Twenty CRM
 */
async function uploadFile(
  apiUrl: string,
  apiKey: string,
  fileContent: string | Uint8Array,
  fileName: string,
  fileFolder: string = 'attachment'
): Promise<FileUploadResponse> {
  // Create FormData for multipart upload
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  // GraphQL multipart upload format
  const operations = {
    query: `
      mutation UploadFile($file: Upload!, $fileFolder: FileFolder) {
        uploadFile(file: $file, fileFolder: $fileFolder) {
          path
          token
        }
      }
    `,
    variables: {
      file: null,
      fileFolder: fileFolder
    }
  };

  // Add operations and map
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ "0": ["variables.file"] }));

  // Add file
  const fileBuffer = typeof fileContent === 'string'
    ? Buffer.from(fileContent)
    : Buffer.from(fileContent);

  formData.append('0', fileBuffer, {
    filename: fileName,
    contentType: 'application/octet-stream'
  });

  // Upload file
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...formData.getHeaders()
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.uploadFile;
}

/**
 * Main function
 */
export async function main(
  // Resource
  twenty: TwentyResource,

  // File details
  fileName: string = "test-file.txt",
  fileContent: string = "Hello from Windmill! This is a test file upload to Twenty CRM.\n\nTimestamp: " + new Date().toISOString(),
  fileFolder: string = "attachment"
) {
  console.log("🚀 Testing Twenty CRM file upload...");
  console.log(`📁 File: ${fileName}`);
  console.log(`📂 Folder: ${fileFolder}`);
  console.log(`📏 Size: ${fileContent.length} bytes`);

  try {
    const result = await uploadFile(
      twenty.apiUrl,
      twenty.apiKey,
      fileContent,
      fileName,
      fileFolder
    );

    console.log("\n✅ Upload successful!");
    console.log(`📍 Path: ${result.path}`);
    console.log(`🔑 Token: ${result.token.substring(0, 50)}...`);

    return {
      success: true,
      fileName: fileName,
      filePath: result.path,
      fileToken: result.token,
      uploadedAt: new Date().toISOString(),
      message: `✅ File "${fileName}" uploaded successfully to Twenty CRM`
    };

  } catch (error) {
    console.error("\n❌ Upload failed!");
    console.error(error);

    return {
      success: false,
      fileName: fileName,
      error: error.message,
      message: `❌ Failed to upload file "${fileName}"`
    };
  }
}

/**
 * QUICK TEST:
 *
 * 1. Set resource: u/chipvn/twenty
 * 2. Click "Run" (use default parameters)
 * 3. Check output for success message
 *
 * Expected output:
 * {
 *   success: true,
 *   fileName: "test-file.txt",
 *   filePath: "attachment/xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.txt",
 *   fileToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   uploadedAt: "2024-11-16T10:30:00.000Z"
 * }
 */
