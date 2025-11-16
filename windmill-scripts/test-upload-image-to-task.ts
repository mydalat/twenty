/**
 * Windmill Script: Test Upload Base64 Image to Twenty CRM Task
 *
 * This script creates a random task with a base64 encoded image attachment.
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
 * Generate random task title
 */
function generateRandomTaskTitle(): string {
  const adjectives = [
    'Urgent', 'Important', 'Quick', 'Critical', 'High Priority',
    'Routine', 'Simple', 'Complex', 'Strategic', 'Tactical'
  ];

  const nouns = [
    'Review', 'Analysis', 'Report', 'Meeting', 'Planning',
    'Discussion', 'Research', 'Development', 'Testing', 'Documentation'
  ];

  const topics = [
    'Project Proposal', 'Client Contract', 'Budget Plan', 'Marketing Campaign',
    'Product Roadmap', 'Team Structure', 'Security Audit', 'Performance Metrics',
    'User Feedback', 'System Architecture'
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  return `${adj} ${noun}: ${topic}`;
}

/**
 * Default base64 image (1x1 transparent PNG - 68 bytes)
 * This is the smallest valid PNG image
 */
const DEFAULT_BASE64_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Sample base64 images (small colored squares for testing)
 */
const SAMPLE_IMAGES = {
  // Red 8x8 PNG
  red: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAMklEQVQYlWP8z8DwHwjYQQwQYGJAAiAOsgAZ0KQhCmAqwIqRFcBUoEiiq4CpwIoBAFMaCQRaJyWrAAAAAElFTkSuQmCC',

  // Blue 8x8 PNG
  blue: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAMklEQVQYlWNk+M/wHwjYQQwQYGJAAiAOsgAZ0KQhCmAqwIqRFcBUoEiiq4CpwIoBADmBCQRB6Aw7AAAAAElFTkSuQmCC',

  // Green 8x8 PNG
  green: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAMklEQVQYlWNkYGD4D8QMDAwMjCABEAMyYABZGszDxAADyArQLUBWgKwApQKmAtUCAKP3BQQiYb7fAAAAAElFTkSuQmCC',
};

/**
 * Create a Task in Twenty CRM
 */
async function createTask(
  apiUrl: string,
  apiKey: string,
  taskData: {
    title: string;
    status?: string;
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
      status: taskData.status || 'TODO'
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
 * Upload IMAGE to Twenty CRM
 *
 * IMPORTANT: For images, we MUST use uploadImage mutation (not uploadFile)
 * and use a fileFolder that has crop sizes defined in settings.
 *
 * Available fileFolders with crop sizes:
 * - 'profile-picture'
 * - 'workspace-logo'
 * - 'person-picture'
 *
 * We use 'person-picture' as a workaround for task attachments.
 */
async function uploadFile(
  apiUrl: string,
  apiKey: string,
  fileBuffer: Buffer,
  fileName: string,
  fileFolder: string = 'person-picture'  // Changed from 'attachment'
): Promise<FileUploadResponse> {
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  const operations = {
    query: `
      mutation UploadImage($file: Upload!, $fileFolder: FileFolder) {
        uploadImage(file: $file, fileFolder: $fileFolder) {
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

  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ "0": ["variables.file"] }));
  formData.append('0', fileBuffer, {
    filename: fileName,
    contentType: 'image/png'
  });

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
    throw new Error(`Failed to upload image: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.uploadImage;
}

/**
 * Create Attachment record and link to Task
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
 * Main function
 */
export async function main(
  // Resource
  twenty: TwentyResource,

  // Image selection (or custom base64)
  imageChoice: 'red' | 'blue' | 'green' | 'transparent' | 'custom' = 'blue',
  customBase64?: string
) {
  console.log("🚀 Starting Random Task + Image Upload Test...");
  console.log("=" .repeat(60));

  try {
    // Generate random task
    const taskTitle = generateRandomTaskTitle();
    const timestamp = new Date().toISOString();

    console.log(`\n📋 Task Details:`);
    console.log(`   Title: ${taskTitle}`);
    console.log(`   Status: TODO`);
    console.log(`   Created: ${timestamp}`);

    // Step 1: Create Task
    console.log("\n📝 Step 1: Creating task...");
    const task = await createTask(twenty.apiUrl, twenty.apiKey, {
      title: taskTitle,
      status: 'TODO'
    });
    console.log(`✅ Task created successfully`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Title: ${task.title}`);

    // Step 2: Prepare image
    console.log("\n🖼️  Step 2: Preparing image...");
    let base64Image: string;
    let imageName: string;

    if (imageChoice === 'custom' && customBase64) {
      base64Image = customBase64;
      imageName = `custom-image-${Date.now()}.png`;
      console.log(`   Using custom base64 image`);
    } else if (imageChoice === 'transparent') {
      base64Image = DEFAULT_BASE64_IMAGE;
      imageName = `transparent-${Date.now()}.png`;
      console.log(`   Using 1x1 transparent PNG (68 bytes)`);
    } else {
      base64Image = SAMPLE_IMAGES[imageChoice] || SAMPLE_IMAGES.blue;
      imageName = `sample-${imageChoice}-${Date.now()}.png`;
      console.log(`   Using ${imageChoice} 8x8 PNG sample`);
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    console.log(`   Image size: ${imageBuffer.length} bytes`);
    console.log(`   File name: ${imageName}`);

    // Step 3: Upload Image
    console.log("\n📤 Step 3: Uploading image...");
    console.log(`   Note: Using 'person-picture' fileFolder (has crop sizes defined)`);
    console.log(`   This is a workaround since 'attachment' doesn't support images`);
    const uploadResult = await uploadFile(
      twenty.apiUrl,
      twenty.apiKey,
      imageBuffer,
      imageName,
      'person-picture'  // Use fileFolder with crop sizes defined
    );
    console.log(`✅ Image uploaded successfully`);
    console.log(`   Path: ${uploadResult.path}`);

    // Step 4: Create Attachment
    console.log("\n🔗 Step 4: Creating attachment record...");
    const attachment = await createAttachment(
      twenty.apiUrl,
      twenty.apiKey,
      {
        name: imageName,
        fullPath: uploadResult.path,
        fileCategory: 'IMAGE',
        taskId: task.id
      }
    );
    console.log(`✅ Attachment created successfully`);
    console.log(`   ID: ${attachment.id}`);
    console.log(`   Name: ${attachment.name}`);
    console.log(`   Category: ${attachment.fileCategory}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ TEST COMPLETED SUCCESSFULLY!");
    console.log(`\n📊 Summary:`);
    console.log(`   Task: "${task.title}"`);
    console.log(`   Task ID: ${task.id}`);
    console.log(`   Image: ${imageName}`);
    console.log(`   Image Size: ${imageBuffer.length} bytes`);
    console.log(`   Attachment ID: ${attachment.id}`);
    console.log(`\n🔗 View in Twenty CRM:`);
    console.log(`   Go to Tasks and find: "${task.title}"`);
    console.log(`   Check Attachments tab to see the uploaded image`);

    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt
      },
      image: {
        name: imageName,
        size: imageBuffer.length,
        choice: imageChoice
      },
      attachment: {
        id: attachment.id,
        name: attachment.name,
        fullPath: attachment.fullPath,
        fileCategory: attachment.fileCategory,
        createdAt: attachment.createdAt
      },
      message: `✅ Successfully created random task with image attachment!`
    };

  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error(error);
    throw error;
  }
}

/**
 * USAGE:
 *
 * 1. Set resource: u/chipvn/twenty
 * 2. Select image:
 *    - imageChoice: 'red', 'blue', 'green', or 'transparent'
 * 3. Click "Run"
 *
 * The script will:
 * - Generate a random task title
 * - Create the task in Twenty CRM
 * - Upload the selected sample image
 * - Attach the image to the task
 *
 * Expected output:
 * {
 *   success: true,
 *   task: { id: "...", title: "Random Task Title" },
 *   image: { name: "sample-blue-123456.png", size: 120 },
 *   attachment: { id: "...", fileCategory: "IMAGE" }
 * }
 *
 * ADVANCED: Upload your own base64 image
 * - Set imageChoice: 'custom'
 * - Provide customBase64: "your-base64-string-here"
 */
