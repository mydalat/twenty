/**
 * Windmill Script: Upload File and Attach to Twenty CRM Opportunity
 *
 * Resource required: u/chipvn/twenty
 * Expected resource structure:
 * {
 *   apiUrl: string,  // e.g., "https://api.twenty.com/graphql"
 *   apiKey: string   // API token
 * }
 *
 * This script demonstrates:
 * 1. Creating a new Opportunity in Twenty CRM
 * 2. Uploading a file via GraphQL multipart/form-data
 * 3. Creating an Attachment record linked to the Opportunity
 */

import * as wmill from "windmill-client";

type TwentyResource = {
  apiUrl: string;
  apiKey: string;
};

type FileUploadResponse = {
  path: string;
  token: string;
};

type Opportunity = {
  id: string;
  name: string;
  amount: {
    amountMicros: number;
    currencyCode: string;
  };
  stage: string;
  createdAt: string;
};

type Attachment = {
  id: string;
  name: string;
  fullPath: string;
  fileCategory: string;
  createdAt: string;
};

/**
 * Helper function to detect file category from filename
 */
function getFileCategory(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const categories: Record<string, string[]> = {
    'IMAGE': ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
    'VIDEO': ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
    'AUDIO': ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    'TEXT_DOCUMENT': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    'SPREADSHEET': ['xls', 'xlsx', 'csv', 'ods'],
    'PRESENTATION': ['ppt', 'pptx', 'odp'],
    'ARCHIVE': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'OTHER';
}

/**
 * Step 1: Create an Opportunity in Twenty CRM
 */
async function createOpportunity(
  apiUrl: string,
  apiKey: string,
  opportunityData: {
    name: string;
    amountMicros?: number;
    currencyCode?: string;
    stage?: string;
    closeDate?: string;
    pointOfContactId?: string;
    companyId?: string;
  }
): Promise<Opportunity> {
  const query = `
    mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) {
        id
        name
        amount {
          amountMicros
          currencyCode
        }
        stage
        closeDate
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      name: opportunityData.name,
      amount: opportunityData.amountMicros ? {
        amountMicros: opportunityData.amountMicros,
        currencyCode: opportunityData.currencyCode || 'USD'
      } : null,
      stage: opportunityData.stage || 'NEW',
      closeDate: opportunityData.closeDate || null,
      pointOfContactId: opportunityData.pointOfContactId || null,
      companyId: opportunityData.companyId || null
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Failed to create opportunity: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.createOpportunity;
}

/**
 * Step 2: Upload file to Twenty CRM
 * Uses GraphQL multipart/form-data upload
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
  // Convert string to Buffer if needed
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
 * Step 3: Create Attachment record and link to Opportunity
 */
async function createAttachment(
  apiUrl: string,
  apiKey: string,
  attachmentData: {
    name: string;
    fullPath: string;
    fileCategory: string;
    opportunityId: string;
  }
): Promise<Attachment> {
  const query = `
    mutation CreateAttachment($data: AttachmentCreateInput!) {
      createAttachment(data: $data) {
        id
        name
        fullPath
        fileCategory
        createdAt
        opportunity {
          id
          name
        }
      }
    }
  `;

  const variables = {
    data: {
      name: attachmentData.name,
      fullPath: attachmentData.fullPath,
      fileCategory: attachmentData.fileCategory,
      opportunityId: attachmentData.opportunityId
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Failed to create attachment: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.createAttachment;
}

/**
 * Main function - Windmill entry point
 */
export async function main(
  // Resource
  twenty: TwentyResource,

  // Opportunity details
  opportunityName: string = "Enterprise Deal - ACME Corp",
  opportunityAmountMicros: number = 50000000000, // $50,000 in micros
  opportunityCurrencyCode: string = "USD",
  opportunityStage: string = "NEW",
  opportunityCloseDate?: string,
  opportunityPointOfContactId?: string,
  opportunityCompanyId?: string,

  // File details
  fileName: string = "proposal.pdf",
  fileContent: string = "This is a sample proposal document uploaded from Windmill to Twenty CRM.\n\nProposal Details:\n- Amount: $50,000\n- Duration: 12 months\n- Deliverables: Custom CRM implementation",
  fileFolder: string = "attachment"
) {
  console.log("🚀 Starting Twenty CRM Opportunity + Attachment creation...");

  try {
    // Step 1: Create Opportunity
    console.log("\n💼 Step 1: Creating opportunity...");
    const opportunity = await createOpportunity(twenty.apiUrl, twenty.apiKey, {
      name: opportunityName,
      amountMicros: opportunityAmountMicros,
      currencyCode: opportunityCurrencyCode,
      stage: opportunityStage,
      closeDate: opportunityCloseDate,
      pointOfContactId: opportunityPointOfContactId,
      companyId: opportunityCompanyId
    });
    console.log(`✅ Opportunity created: ${opportunity.id} - "${opportunity.name}"`);
    console.log(`   Amount: ${opportunity.amount.currencyCode} ${opportunity.amount.amountMicros / 1000000}`);
    console.log(`   Stage: ${opportunity.stage}`);

    // Step 2: Upload File
    console.log("\n📤 Step 2: Uploading file...");
    const uploadResult = await uploadFile(
      twenty.apiUrl,
      twenty.apiKey,
      fileContent,
      fileName,
      fileFolder
    );
    console.log(`✅ File uploaded: ${uploadResult.path}`);

    // Step 3: Create Attachment and link to Opportunity
    console.log("\n🔗 Step 3: Creating attachment record...");
    const fileCategory = getFileCategory(fileName);
    const attachment = await createAttachment(
      twenty.apiUrl,
      twenty.apiKey,
      {
        name: fileName,
        fullPath: uploadResult.path,
        fileCategory: fileCategory,
        opportunityId: opportunity.id
      }
    );
    console.log(`✅ Attachment created: ${attachment.id} - "${attachment.name}"`);

    // Calculate amount in standard currency (divide micros by 1,000,000)
    const amountInCurrency = opportunity.amount.amountMicros / 1000000;

    // Return summary
    return {
      success: true,
      opportunity: {
        id: opportunity.id,
        name: opportunity.name,
        amount: `${opportunity.amount.currencyCode} ${amountInCurrency.toLocaleString()}`,
        stage: opportunity.stage,
        createdAt: opportunity.createdAt
      },
      attachment: {
        id: attachment.id,
        name: attachment.name,
        fullPath: attachment.fullPath,
        fileCategory: attachment.fileCategory,
        createdAt: attachment.createdAt
      },
      message: `✅ Successfully created opportunity "${opportunity.name}" (${opportunity.amount.currencyCode} ${amountInCurrency.toLocaleString()}) with attachment "${attachment.name}"`
    };

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

/**
 * EXAMPLE USAGE IN WINDMILL:
 *
 * 1. Create resource "u/chipvn/twenty" with:
 *    - apiUrl: "https://your-twenty-instance.com/graphql"
 *    - apiKey: "your-api-key-here"
 *
 * 2. Run this script with parameters:
 *    - twenty: u/chipvn/twenty (resource selector)
 *    - opportunityName: "Enterprise Deal - ACME Corp"
 *    - opportunityAmountMicros: 50000000000 (= $50,000)
 *    - opportunityCurrencyCode: "USD"
 *    - opportunityStage: "NEW"
 *    - fileName: "proposal.pdf"
 *    - fileContent: <file content as string or upload via Windmill>
 *
 * 3. Expected output:
 *    {
 *      success: true,
 *      opportunity: { id: "...", name: "Enterprise Deal - ACME Corp", amount: "USD 50,000", ... },
 *      attachment: { id: "...", name: "proposal.pdf", ... }
 *    }
 *
 * NOTES:
 * - Amounts in Twenty are stored in micros (1 USD = 1,000,000 micros)
 * - To upload $50,000: use amountMicros = 50000000000
 * - File content can be provided as string or binary data
 * - Supported file categories: IMAGE, VIDEO, AUDIO, TEXT_DOCUMENT, SPREADSHEET, PRESENTATION, ARCHIVE, OTHER
 */
