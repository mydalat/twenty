/**
 * Windmill Script: Upload File and Attach to Twenty CRM Task
 *
 * Resource required: u/chipvn/twenty
 * Expected resource structure:
 * {
 *   apiUrl: string,  // e.g., "https://api.twenty.com/graphql"
 *   apiKey: string   // API token
 * }
 *
 * This script demonstrates:
 * 1. Creating a new Task in Twenty CRM
 * 2. Uploading a file via GraphQL multipart/form-data
 * 3. Creating an Attachment record linked to the Task
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

type Task = {
  id: string;
  title: string;
  status: string;
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
 * Step 1: Create a Task in Twenty CRM
 */
async function createTask(
  apiUrl: string,
  apiKey: string,
  taskData: {
    title: string;
    status?: string;
    dueAt?: string;
    assigneeId?: string;
  }
): Promise<Task> {
  const query = `
    mutation CreateTask($data: TaskCreateInput!) {
      createTask(data: $data) {
        id
        title
        status
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      title: taskData.title,
      status: taskData.status || 'TODO',
      dueAt: taskData.dueAt || null,
      assigneeId: taskData.assigneeId || null
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
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.createTask;
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
 * Step 3: Create Attachment record and link to Task
 */
async function createAttachment(
  apiUrl: string,
  apiKey: string,
  attachmentData: {
    name: string;
    fullPath: string;
    fileCategory: string;
    taskId: string;
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
        task {
          id
          title
        }
      }
    }
  `;

  const variables = {
    data: {
      name: attachmentData.name,
      fullPath: attachmentData.fullPath,
      fileCategory: attachmentData.fileCategory,
      taskId: attachmentData.taskId
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

  // Task details
  taskTitle: string = "Sample Task with Attachment",
  taskStatus: string = "TODO",
  taskDueAt?: string,
  taskAssigneeId?: string,

  // File details
  fileName: string = "demo-document.txt",
  fileContent: string = "This is a sample file content uploaded from Windmill to Twenty CRM.\n\nThis demonstrates the file upload capability.",
  fileFolder: string = "attachment"
) {
  console.log("🚀 Starting Twenty CRM Task + Attachment creation...");

  try {
    // Step 1: Create Task
    console.log("\n📝 Step 1: Creating task...");
    const task = await createTask(twenty.apiUrl, twenty.apiKey, {
      title: taskTitle,
      status: taskStatus,
      dueAt: taskDueAt,
      assigneeId: taskAssigneeId
    });
    console.log(`✅ Task created: ${task.id} - "${task.title}"`);

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

    // Step 3: Create Attachment and link to Task
    console.log("\n🔗 Step 3: Creating attachment record...");
    const fileCategory = getFileCategory(fileName);
    const attachment = await createAttachment(
      twenty.apiUrl,
      twenty.apiKey,
      {
        name: fileName,
        fullPath: uploadResult.path,
        fileCategory: fileCategory,
        taskId: task.id
      }
    );
    console.log(`✅ Attachment created: ${attachment.id} - "${attachment.name}"`);

    // Return summary
    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt
      },
      attachment: {
        id: attachment.id,
        name: attachment.name,
        fullPath: attachment.fullPath,
        fileCategory: attachment.fileCategory,
        createdAt: attachment.createdAt
      },
      message: `✅ Successfully created task "${task.title}" with attachment "${attachment.name}"`
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
 *    - taskTitle: "Review contract"
 *    - fileName: "contract.pdf"
 *    - fileContent: <file content as string or upload via Windmill>
 *
 * 3. Expected output:
 *    {
 *      success: true,
 *      task: { id: "...", title: "Review contract", ... },
 *      attachment: { id: "...", name: "contract.pdf", ... }
 *    }
 */
