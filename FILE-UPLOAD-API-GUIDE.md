# FILE UPLOAD API GUIDE - Twenty CRM

Hướng dẫn chi tiết cách tải lên file/attachment qua GraphQL API và REST API của Twenty CRM.

---

## 📋 **TÓM TẮT**

| Phương Pháp | Endpoint | Hỗ Trợ | Ghi Chú |
|-------------|----------|---------|---------|
| **GraphQL** | `/graphql` | ✅ YES | **Recommended** - Full support |
| **REST API** | `/rest/*` | ⚠️ Limited | Chỉ GET file, KHÔNG có upload |

**KẾT LUẬN**: File upload chỉ hỗ trợ qua **GraphQL API** (không có REST API upload endpoint)

---

## 🎯 **2 BƯỚC TẢI FILE**

### **Bước 1: Upload File → Nhận Signed URL**
```graphql
mutation uploadFile($file: Upload!, $fileFolder: FileFolder)
```

### **Bước 2: Tạo Attachment Record**
```graphql
mutation createOneAttachment($data: AttachmentCreateInput!)
```

---

## 🚀 **PHƯƠNG ÁN 1: GraphQL API (RECOMMENDED)**

### **1.1. Upload File (General)**

#### **GraphQL Mutation:**
```graphql
mutation UploadFile($file: Upload!, $fileFolder: FileFolder) {
  uploadFile(file: $file, fileFolder: $fileFolder) {
    path
    token
  }
}
```

#### **Variables:**
```json
{
  "file": null,
  "fileFolder": "attachment"
}
```

#### **HTTP Request (multipart/form-data):**
```bash
curl -X POST https://api.twenty.com/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F 'operations={"query":"mutation UploadFile($file: Upload!, $fileFolder: FileFolder) { uploadFile(file: $file, fileFolder: $fileFolder) { path token } }","variables":{"file":null,"fileFolder":"attachment"}}' \
  -F 'map={"0":["variables.file"]}' \
  -F '0=@/path/to/document.pdf'
```

#### **Response:**
```json
{
  "data": {
    "uploadFile": {
      "path": "attachment/550e8400-e29b-41d4-a716-446655440000.pdf",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

### **1.2. Upload Image (Auto-Resize)**

#### **GraphQL Mutation:**
```graphql
mutation UploadImage($file: Upload!, $fileFolder: FileFolder) {
  uploadImage(file: $file, fileFolder: $fileFolder) {
    path
    token
  }
}
```

#### **Variables:**
```json
{
  "file": null,
  "fileFolder": "person-picture"
}
```

#### **HTTP Request:**
```bash
curl -X POST https://api.twenty.com/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F 'operations={"query":"mutation UploadImage($file: Upload!, $fileFolder: FileFolder) { uploadImage(file: $file, fileFolder: $fileFolder) { path token } }","variables":{"file":null,"fileFolder":"person-picture"}}' \
  -F 'map={"0":["variables.file"]}' \
  -F '0=@/path/to/avatar.jpg'
```

#### **Response:**
```json
{
  "data": {
    "uploadImage": {
      "path": "person-picture/original/550e8400-e29b-41d4-a716-446655440000.jpg",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Lưu ý:** `uploadImage` tự động resize ảnh theo crop sizes được config cho từng folder.

---

### **1.3. Tạo Attachment Record**

Sau khi upload file, tạo Attachment record để lưu metadata:

#### **GraphQL Mutation:**
```graphql
mutation CreateOneAttachment($data: AttachmentCreateInput!) {
  createOneAttachment(data: $data) {
    id
    name
    fullPath
    fileCategory
    createdAt
  }
}
```

#### **Variables:**
```json
{
  "data": {
    "name": "Contract.pdf",
    "fullPath": "attachment/550e8400-e29b-41d4-a716-446655440000.pdf",
    "fileCategory": "TEXT_DOCUMENT",
    "companyId": "company-uuid-here"
  }
}
```

#### **Response:**
```json
{
  "data": {
    "createOneAttachment": {
      "id": "attachment-uuid",
      "name": "Contract.pdf",
      "fullPath": "attachment/550e8400-e29b-41d4-a716-446655440000.pdf",
      "fileCategory": "TEXT_DOCUMENT",
      "createdAt": "2025-11-13T10:30:00.000Z"
    }
  }
}
```

---

## 📂 **FILE FOLDERS (fileFolder Parameter)**

Available folders:

| FileFolder | Sử Dụng | Auto-Resize |
|------------|---------|-------------|
| `attachment` | File đính kèm general | ❌ No |
| `person-picture` | Ảnh người liên hệ | ✅ Yes |
| `profile-picture` | Ảnh đại diện user | ✅ Yes |
| `workspace-logo` | Logo workspace | ✅ Yes |
| `file` | File general | ❌ No |
| `agent-chat` | File trong AI agent chat | ❌ No |
| `serverless-function` | Serverless function code | ❌ No |

**Source:** `packages/twenty-server/src/engine/core-modules/file/interfaces/file-folder.interface.ts`

---

## 🏷️ **FILE CATEGORIES (fileCategory Field)**

Khi tạo Attachment record, chọn `fileCategory`:

| Value | Label | Color | Mô Tả |
|-------|-------|-------|-------|
| `IMAGE` | Image | Yellow | Ảnh (jpg, png, gif, etc.) |
| `VIDEO` | Video | Purple | Video files |
| `AUDIO` | Audio | Pink | File âm thanh |
| `TEXT_DOCUMENT` | Text Document | Blue | Word, PDF, txt |
| `SPREADSHEET` | Spreadsheet | Turquoise | Excel, CSV |
| `PRESENTATION` | Presentation | Orange | PowerPoint, etc. |
| `ARCHIVE` | Archive | Gray | ZIP, RAR, etc. |
| `OTHER` | Other | Gray | Khác |

**Source:** `packages/twenty-server/src/modules/attachment/standard-objects/attachment.workspace-entity.ts:75-124`

---

## 🔗 **ATTACHMENT RELATIONS**

Attachment có thể gắn vào các object sau:

| Relation Field | Object | Description |
|----------------|--------|-------------|
| `companyId` | Company | Gắn vào company |
| `personId` | Person | Gắn vào person (contact) |
| `opportunityId` | Opportunity | Gắn vào opportunity (deal) |
| `taskId` | Task | Gắn vào task |
| `noteId` | Note | Gắn vào note |
| `dashboardId` | Dashboard | Gắn vào dashboard |
| `workflowId` | Workflow | Gắn vào workflow |

**Example:**
```json
{
  "data": {
    "name": "Invoice.pdf",
    "fullPath": "attachment/xxx.pdf",
    "fileCategory": "TEXT_DOCUMENT",
    "companyId": "company-uuid",
    "personId": "person-uuid"
  }
}
```

---

## 📝 **FULL WORKFLOW EXAMPLE**

### **JavaScript/TypeScript Example:**

```typescript
// Step 1: Upload file via GraphQL
async function uploadFileToTwenty(file: File, folder: string = 'attachment') {
  const formData = new FormData();

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
      fileFolder: folder
    }
  };

  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ "0": ["variables.file"] }));
  formData.append('0', file);

  const response = await fetch('https://api.twenty.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });

  const result = await response.json();
  return result.data.uploadFile;
}

// Step 2: Create Attachment record
async function createAttachment(filePath: string, fileName: string, companyId: string) {
  const query = `
    mutation CreateOneAttachment($data: AttachmentCreateInput!) {
      createOneAttachment(data: $data) {
        id
        name
        fullPath
        fileCategory
      }
    }
  `;

  const variables = {
    data: {
      name: fileName,
      fullPath: filePath,
      fileCategory: getFileCategory(fileName), // Helper function
      companyId: companyId
    }
  };

  const response = await fetch('https://api.twenty.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  return result.data.createOneAttachment;
}

// Helper: Detect file category
function getFileCategory(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const categories = {
    'IMAGE': ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
    'VIDEO': ['mp4', 'avi', 'mov', 'mkv', 'webm'],
    'AUDIO': ['mp3', 'wav', 'ogg', 'flac'],
    'TEXT_DOCUMENT': ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    'SPREADSHEET': ['xls', 'xlsx', 'csv', 'ods'],
    'PRESENTATION': ['ppt', 'pptx', 'odp'],
    'ARCHIVE': ['zip', 'rar', '7z', 'tar', 'gz']
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (ext && extensions.includes(ext)) {
      return category;
    }
  }

  return 'OTHER';
}

// Complete workflow
async function uploadAndAttachToCompany(file: File, companyId: string) {
  try {
    // Step 1: Upload file
    console.log('Uploading file...');
    const { path, token } = await uploadFileToTwenty(file, 'attachment');
    console.log('File uploaded:', path);

    // Step 2: Create attachment record
    console.log('Creating attachment record...');
    const attachment = await createAttachment(path, file.name, companyId);
    console.log('Attachment created:', attachment);

    return attachment;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const companyId = 'your-company-uuid';

  const attachment = await uploadAndAttachToCompany(file, companyId);
  console.log('Success!', attachment);
});
```

---

### **Python Example:**

```python
import requests
from pathlib import Path

API_URL = "https://api.twenty.com/graphql"
API_KEY = "your-api-key"

def upload_file_to_twenty(file_path: str, folder: str = "attachment"):
    """Step 1: Upload file to Twenty storage"""

    query = """
    mutation UploadFile($file: Upload!, $fileFolder: FileFolder) {
      uploadFile(file: $file, fileFolder: $fileFolder) {
        path
        token
      }
    }
    """

    operations = {
        "query": query,
        "variables": {
            "file": None,
            "fileFolder": folder
        }
    }

    files = {
        "operations": (None, str(operations).replace("'", '"')),
        "map": (None, '{"0": ["variables.file"]}'),
        "0": open(file_path, "rb")
    }

    headers = {"Authorization": f"Bearer {API_KEY}"}

    response = requests.post(API_URL, headers=headers, files=files)
    result = response.json()

    return result["data"]["uploadFile"]

def create_attachment(file_path: str, file_name: str, company_id: str):
    """Step 2: Create Attachment record"""

    query = """
    mutation CreateOneAttachment($data: AttachmentCreateInput!) {
      createOneAttachment(data: $data) {
        id
        name
        fullPath
        fileCategory
      }
    }
    """

    variables = {
        "data": {
            "name": file_name,
            "fullPath": file_path,
            "fileCategory": get_file_category(file_name),
            "companyId": company_id
        }
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        API_URL,
        headers=headers,
        json={"query": query, "variables": variables}
    )

    result = response.json()
    return result["data"]["createOneAttachment"]

def get_file_category(filename: str) -> str:
    """Helper: Detect file category from extension"""
    ext = Path(filename).suffix.lower().strip('.')

    categories = {
        "IMAGE": ["jpg", "jpeg", "png", "gif", "svg", "webp"],
        "VIDEO": ["mp4", "avi", "mov", "mkv", "webm"],
        "AUDIO": ["mp3", "wav", "ogg", "flac"],
        "TEXT_DOCUMENT": ["pdf", "doc", "docx", "txt", "rtf"],
        "SPREADSHEET": ["xls", "xlsx", "csv", "ods"],
        "PRESENTATION": ["ppt", "pptx", "odp"],
        "ARCHIVE": ["zip", "rar", "7z", "tar", "gz"]
    }

    for category, extensions in categories.items():
        if ext in extensions:
            return category

    return "OTHER"

def upload_and_attach_to_company(file_path: str, company_id: str):
    """Complete workflow"""
    try:
        # Step 1: Upload file
        print(f"Uploading {file_path}...")
        upload_result = upload_file_to_twenty(file_path, "attachment")
        print(f"File uploaded: {upload_result['path']}")

        # Step 2: Create attachment record
        print("Creating attachment record...")
        file_name = Path(file_path).name
        attachment = create_attachment(
            upload_result["path"],
            file_name,
            company_id
        )
        print(f"Attachment created: {attachment['id']}")

        return attachment

    except Exception as e:
        print(f"Upload failed: {e}")
        raise

# Usage
if __name__ == "__main__":
    company_id = "your-company-uuid"
    file_path = "/path/to/contract.pdf"

    attachment = upload_and_attach_to_company(file_path, company_id)
    print("Success!", attachment)
```

---

## 🔐 **AUTHENTICATION**

Tất cả API calls cần authentication:

### **API Key (Recommended):**
```bash
Authorization: Bearer YOUR_API_KEY
```

### **Tạo API Key:**
1. Vào Twenty UI: Settings → Developers → API Keys
2. Click "Create API Key"
3. Copy key (chỉ hiện 1 lần)

**Source:** Twenty uses workspace-based auth via `WorkspaceAuthGuard`

---

## 📥 **DOWNLOAD FILE**

### **REST API Endpoint:**
```
GET /files/{folder}/{filename}?token={jwt_token}
```

### **Example:**
```bash
curl "https://api.twenty.com/files/attachment/550e8400.pdf?token=eyJhbGc..." \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -o downloaded-file.pdf
```

**Source:** `packages/twenty-server/src/engine/core-modules/file/controllers/file.controller.ts:34`

---

## ⚙️ **BACKEND IMPLEMENTATION DETAILS**

### **File Upload Flow:**

```
1. Client uploads file via GraphQL mutation
   ↓
2. FileUploadResolver receives file stream
   ↓
3. FileUploadService processes file:
   - Sanitize (SVG XSS protection)
   - Resize (if uploadImage)
   - Generate UUID filename
   ↓
4. FileStorageService writes to storage (S3/Local)
   ↓
5. FileService encodes JWT token
   ↓
6. Return SignedFileDTO { path, token }
```

### **Key Files:**

| File | Purpose |
|------|---------|
| `file-upload.resolver.ts` | GraphQL mutations (uploadFile, uploadImage) |
| `file-upload.service.ts` | Upload logic, resize, sanitize |
| `file.controller.ts` | REST GET endpoint for download |
| `attachment.workspace-entity.ts` | Attachment object metadata |

---

## 🚫 **REST API UPLOAD - NOT AVAILABLE**

Twenty **KHÔNG** có REST API endpoint cho file upload.

**Lý do:**
- File upload sử dụng `graphql-upload` library
- Multipart upload chỉ support qua GraphQL
- REST API chỉ có GET endpoint cho download

**Workaround nếu bắt buộc dùng REST:**
1. Upload file qua GraphQL
2. Tạo Attachment record qua REST API

---

## 📊 **COMPARISON: GraphQL vs REST**

| Feature | GraphQL | REST API |
|---------|---------|----------|
| **Upload File** | ✅ `uploadFile` mutation | ❌ Not available |
| **Upload Image** | ✅ `uploadImage` mutation | ❌ Not available |
| **Download File** | ✅ Via signed URL | ✅ GET /files/* |
| **Create Attachment** | ✅ `createOneAttachment` | ✅ POST /rest/attachments |
| **List Attachments** | ✅ `findManyAttachments` | ✅ GET /rest/attachments |
| **Update Attachment** | ✅ `updateOneAttachment` | ✅ PATCH /rest/attachments/:id |
| **Delete Attachment** | ✅ `deleteOneAttachment` | ✅ DELETE /rest/attachments/:id |

---

## 🎯 **USE CASES**

### **1. Upload Invoice cho Company:**
```typescript
const file = new File([pdfBlob], "invoice-2024.pdf");
const { path } = await uploadFileToTwenty(file, "attachment");
await createAttachment(path, file.name, companyId);
```

### **2. Upload Avatar cho Person:**
```typescript
const file = new File([imageBlob], "avatar.jpg");
const { path } = await uploadFileToTwenty(file, "person-picture");
// Update person's avatarUrl field
await updatePerson(personId, { avatarUrl: path });
```

### **3. Upload Multiple Files:**
```typescript
const files = [file1, file2, file3];
const attachments = await Promise.all(
  files.map(async (file) => {
    const { path } = await uploadFileToTwenty(file, "attachment");
    return createAttachment(path, file.name, companyId);
  })
);
```

---

## 📚 **RELATED DOCUMENTATION**

- **IMAGE-FIELD-GUIDE.md** - Cách hiển thị image thumbnails
- **DOWNLOAD-GRAPHQL-SCHEMA.md** - Download GraphQL schema
- **CUSTOMIZATION-GUIDE.md** - Custom Twenty CRM guide

---

## ✅ **CHECKLIST**

### **Upload File qua API:**
- [ ] Có API key
- [ ] File < max size (check server config)
- [ ] Chọn đúng `fileFolder`
- [ ] Upload qua GraphQL `uploadFile` mutation
- [ ] Nhận được `path` và `token`
- [ ] Tạo Attachment record với `path`
- [ ] Gắn attachment vào object (company/person/etc.)

---

## 🔧 **TROUBLESHOOTING**

### **Lỗi: "Failed to upload file"**
- Check file size (có thể vượt quá limit)
- Check file type (SVG cần valid XML)
- Check authentication (API key hợp lệ)

### **Lỗi: "File not found" khi download**
- Token expired (attachment folder có expiration)
- File path không đúng
- Workspace ID không match

### **Lỗi: "Couldn't upload the attachment"**
- GraphQL mutation failed
- Network error
- File stream error

---

**Tạo bởi:** Claude Code
**Ngày:** 2025-11-13
**Version:** 1.0
