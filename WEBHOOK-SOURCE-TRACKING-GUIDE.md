# WEBHOOK EVENT TRACKING: UI vs API Source - Twenty CRM

Hướng dẫn chi tiết cách phân biệt nguồn gốc (UI vs API) của thay đổi khi nhận webhook events từ Twenty CRM.

---

## ⚠️ **TÓM TẮT GIẢI PHÁP**

### **✅ Twenty CRM ĐÃ HỖ TRỢ tracking source!**

Mỗi record có field **`createdBy`** (Actor metadata) với field **`source`** cho biết nguồn gốc:

| Source Value | Meaning | Use Case |
|--------------|---------|----------|
| `MANUAL` | User thao tác trên UI | User clicks, edits in UI |
| `API` | API call (API key) | External app, automation |
| `WORKFLOW` | Workflow automation | Scheduled tasks, triggers |
| `AGENT` | AI Agent action | AI-generated changes |
| `EMAIL` | Email sync | Email import/sync |
| `CALENDAR` | Calendar sync | Calendar event sync |
| `IMPORT` | Data import | CSV import, bulk import |
| `SYSTEM` | System-generated | System migrations |
| `WEBHOOK` | Incoming webhook | External webhook trigger |

### **Webhook Payload Structure:**

```json
{
  "event": "task.updated",
  "workspaceId": "workspace-uuid",
  "objectName": "task",
  "recordId": "task-uuid",
  "data": {
    "id": "task-uuid",
    "title": "Updated task",
    "status": "IN_PROGRESS",
    "createdBy": {
      "source": "API",              // ← Nguồn gốc!
      "name": "My Integration",     // ← Tên API key hoặc user
      "workspaceMemberId": null,    // ← null nếu API, có UUID nếu user
      "context": {}
    }
  },
  "updatedFields": ["status"]
}
```

**Cách phân biệt:**
```javascript
if (webhookPayload.data.createdBy.source === 'MANUAL') {
  // User thao tác trên UI
} else if (webhookPayload.data.createdBy.source === 'API') {
  // API call
}
```

---

## 📊 **ACTOR METADATA STRUCTURE**

### **Actor Composite Type:**

**File:** `packages/twenty-server/src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type.ts`

```typescript
export enum FieldActorSource {
  EMAIL = 'EMAIL',
  CALENDAR = 'CALENDAR',
  WORKFLOW = 'WORKFLOW',
  AGENT = 'AGENT',
  API = 'API',
  IMPORT = 'IMPORT',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
  WEBHOOK = 'WEBHOOK',
}

export type ActorMetadata = {
  source: FieldActorSource;        // ← Nguồn gốc
  workspaceMemberId: string | null; // ← UUID nếu user, null nếu API/system
  name: string;                    // ← Tên user hoặc API key
  context: {                       // ← Additional context
    provider?: ConnectedAccountProvider;
  };
};
```

### **Khi Nào Source Được Set:**

#### **1. API Call (via API Key):**

**File:** `packages/twenty-server/src/engine/core-modules/actor/utils/build-created-by-from-api-key.util.ts`

```typescript
export const buildCreatedByFromApiKey = ({
  apiKey,
}: BuildCreatedByFromApiKeyArgs): ActorMetadata => ({
  source: FieldActorSource.API,      // ← Set to API
  name: apiKey.name,                 // ← API key name
  workspaceMemberId: null,           // ← No user
  context: {},
});
```

#### **2. UI Action (User Session):**

**File:** `packages/twenty-server/src/engine/core-modules/actor/utils/build-created-by-from-full-name-metadata.util.ts`

```typescript
export const buildCreatedByFromFullNameMetadata = ({
  fullNameMetadata,
  workspaceMemberId,
}: BuildCreatedByFromFullNameMetadataArgs): ActorMetadata => ({
  workspaceMemberId,                  // ← User ID
  source: FieldActorSource.MANUAL,    // ← Set to MANUAL
  name: `${fullNameMetadata.firstName} ${fullNameMetadata.lastName}`,
  context: {},
});
```

---

## 🎯 **GIẢI PHÁP 1: CHECK `createdBy.source` (Recommended)**

### **Webhook Handler Example (Node.js):**

```javascript
const express = require('express');
const app = express();

app.post('/twenty-webhook', express.json(), (req, res) => {
  const { event, data, updatedFields } = req.body;

  // Phân biệt nguồn gốc
  const source = data.createdBy?.source;
  const isUIAction = source === 'MANUAL';
  const isAPIAction = source === 'API';
  const isWorkflowAction = source === 'WORKFLOW';

  console.log(`Event: ${event}`);
  console.log(`Source: ${source}`);
  console.log(`Updated fields: ${updatedFields?.join(', ')}`);

  if (isUIAction) {
    console.log(`✋ User action from UI`);
    console.log(`User: ${data.createdBy.name}`);
    console.log(`User ID: ${data.createdBy.workspaceMemberId}`);

    // Handle UI actions differently
    // e.g., Don't trigger sync back to avoid loops
  } else if (isAPIAction) {
    console.log(`🔌 API action`);
    console.log(`API Key: ${data.createdBy.name}`);

    // Handle API actions
    // e.g., Safe to sync or trigger other actions
  } else if (isWorkflowAction) {
    console.log(`🤖 Workflow automation`);
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### **TypeScript with Type Safety:**

```typescript
import express, { Request, Response } from 'express';

enum FieldActorSource {
  EMAIL = 'EMAIL',
  CALENDAR = 'CALENDAR',
  WORKFLOW = 'WORKFLOW',
  AGENT = 'AGENT',
  API = 'API',
  IMPORT = 'IMPORT',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
  WEBHOOK = 'WEBHOOK',
}

interface ActorMetadata {
  source: FieldActorSource;
  workspaceMemberId: string | null;
  name: string;
  context: Record<string, any>;
}

interface WebhookPayload {
  event: string;
  workspaceId: string;
  objectName: string;
  recordId: string;
  data: {
    id: string;
    createdBy?: ActorMetadata;
    [key: string]: any;
  };
  updatedFields?: string[];
}

const app = express();

app.post('/twenty-webhook', express.json(), (req: Request, res: Response) => {
  const payload = req.body as WebhookPayload;

  const source = payload.data.createdBy?.source;

  switch (source) {
    case FieldActorSource.MANUAL:
      handleUIAction(payload);
      break;
    case FieldActorSource.API:
      handleAPIAction(payload);
      break;
    case FieldActorSource.WORKFLOW:
      handleWorkflowAction(payload);
      break;
    case FieldActorSource.AGENT:
      handleAgentAction(payload);
      break;
    default:
      handleOtherAction(payload);
  }

  res.sendStatus(200);
});

function handleUIAction(payload: WebhookPayload) {
  console.log('✋ User action from UI');
  console.log(`User: ${payload.data.createdBy?.name}`);
  console.log(`User ID: ${payload.data.createdBy?.workspaceMemberId}`);

  // Example: Don't sync back to Twenty to avoid loops
  // Example: Send Slack notification
  sendSlackNotification({
    text: `${payload.data.createdBy?.name} updated ${payload.objectName} via UI`,
    fields: payload.updatedFields,
  });
}

function handleAPIAction(payload: WebhookPayload) {
  console.log('🔌 API action');
  console.log(`API Key: ${payload.data.createdBy?.name}`);

  // Example: Safe to sync to external system
  syncToExternalSystem(payload);
}

function handleWorkflowAction(payload: WebhookPayload) {
  console.log('🤖 Workflow automation');
  // Handle workflow-triggered changes
}

function handleAgentAction(payload: WebhookPayload) {
  console.log('🤖 AI Agent action');
  // Handle AI-generated changes
}

function handleOtherAction(payload: WebhookPayload) {
  console.log(`⚙️ Other action: ${payload.data.createdBy?.source}`);
}

app.listen(3000);
```

---

## 🎯 **GIẢI PHÁP 2: CHECK `workspaceMemberId`**

Nếu `workspaceMemberId` null → API/system action
Nếu `workspaceMemberId` có UUID → User action

```javascript
app.post('/twenty-webhook', express.json(), (req, res) => {
  const { data } = req.body;

  if (data.createdBy?.workspaceMemberId) {
    // User action (has workspace member ID)
    console.log('User action from UI');
    console.log(`User ID: ${data.createdBy.workspaceMemberId}`);
  } else {
    // API/System action (no user ID)
    console.log('API or system action');
  }

  res.sendStatus(200);
});
```

**Comparison:**

| `workspaceMemberId` | `source` | Meaning |
|---------------------|----------|---------|
| UUID | `MANUAL` | User action from UI |
| null | `API` | API key action |
| null | `WORKFLOW` | Workflow automation |
| null | `SYSTEM` | System action |
| UUID | `MANUAL` | User action (best check) |

**Recommended:** Check both `source` and `workspaceMemberId` for accuracy.

---

## 🎯 **GIẢI PHÁP 3: ADD CUSTOM TRACKING FIELD**

Nếu cần tracking chi tiết hơn, thêm custom field:

### **Step 1: Create Custom Field**

Qua UI:
1. Settings → Objects → Select object (e.g., Task)
2. Add field: `lastModifiedVia` (SELECT type)
3. Options: `UI`, `API`, `Workflow`, `Import`

Qua Code:
```typescript
@WorkspaceEntity({...})
export class TaskWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.SELECT,
    label: msg`Last Modified Via`,
    options: [
      { value: 'UI', label: 'UI', position: 0, color: 'blue' },
      { value: 'API', label: 'API', position: 1, color: 'green' },
      { value: 'WORKFLOW', label: 'Workflow', position: 2, color: 'purple' },
      { value: 'IMPORT', label: 'Import', position: 3, color: 'orange' },
    ],
  })
  lastModifiedVia: string;
}
```

### **Step 2: Set Field via Middleware**

Create interceptor to auto-set field:

```typescript
// custom-tracking.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CustomTrackingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Detect source
    let modifiedVia = 'UNKNOWN';
    if (request.apiKey) {
      modifiedVia = 'API';
    } else if (request.user) {
      modifiedVia = 'UI';
    } else if (request.workflow) {
      modifiedVia = 'WORKFLOW';
    }

    // Add to request context
    request.customTracking = { modifiedVia };

    return next.handle();
  }
}
```

Apply to resolver:
```typescript
@Mutation()
@UseInterceptors(CustomTrackingInterceptor)
async updateTask(@Args('input') input: UpdateTaskInput, @Context() context) {
  // Auto-include lastModifiedVia
  const enrichedInput = {
    ...input,
    lastModifiedVia: context.customTracking?.modifiedVia,
  };

  return this.taskService.update(enrichedInput);
}
```

---

## 🎯 **GIẢI PHÁP 4: USE AUDIT LOG**

Twenty có audit log feature (nếu enabled):

### **Enable Audit Logging:**

```typescript
@WorkspaceEntity({
  standardId: 'task-uuid',
  namePlural: 'tasks',
  // ... other config
})
@WorkspaceIsAuditLogged() // ← Enable audit log
export class TaskWorkspaceEntity extends BaseWorkspaceEntity {
  // ...
}
```

### **Query Audit Logs:**

```graphql
query GetAuditLogs {
  auditLogs(
    filter: {
      recordId: { eq: "task-uuid" }
      objectName: { eq: "task" }
    }
    orderBy: { createdAt: DescNullsLast }
  ) {
    edges {
      node {
        id
        recordId
        objectName
        action
        createdBy {
          source
          name
          workspaceMemberId
        }
        changes
        createdAt
      }
    }
  }
}
```

**Audit Log có:**
- `createdBy.source`: API, MANUAL, etc.
- `changes`: List of changed fields
- `action`: created, updated, deleted
- `createdAt`: Timestamp

---

## 📝 **USE CASE EXAMPLES**

### **Use Case 1: Prevent Sync Loops**

```javascript
// Webhook handler
app.post('/twenty-webhook', express.json(), async (req, res) => {
  const { event, data } = req.body;

  // Check if change came from our API
  if (data.createdBy?.source === 'API' &&
      data.createdBy?.name === 'My Integration') {
    console.log('Skipping: Change came from our own API call');
    return res.sendStatus(200);
  }

  // Only sync UI changes to external system
  if (data.createdBy?.source === 'MANUAL') {
    console.log('Syncing UI change to external system...');
    await syncToExternalSystem(data);
  }

  res.sendStatus(200);
});
```

### **Use Case 2: Different Notifications for UI vs API**

```javascript
app.post('/twenty-webhook', express.json(), async (req, res) => {
  const { event, data } = req.body;

  if (data.createdBy?.source === 'MANUAL') {
    // User action → Send detailed Slack notification
    await sendSlackMessage({
      channel: '#crm-updates',
      text: `🙋 ${data.createdBy.name} updated task "${data.title}"`,
      details: data.updatedFields,
    });
  } else if (data.createdBy?.source === 'API') {
    // API action → Log to monitoring only
    console.log(`API update: ${data.createdBy.name} updated task ${data.id}`);
    await logToMonitoring({ event, source: 'API', recordId: data.id });
  }

  res.sendStatus(200);
});
```

### **Use Case 3: Rate Limiting by Source**

```javascript
const rateLimits = {
  MANUAL: 100,  // 100 requests/min for UI
  API: 1000,    // 1000 requests/min for API
};

app.post('/twenty-webhook', express.json(), async (req, res) => {
  const { data } = req.body;
  const source = data.createdBy?.source || 'UNKNOWN';

  const rateLimiter = getRateLimiter(source, rateLimits[source]);

  if (!rateLimiter.allow()) {
    console.error(`Rate limit exceeded for source: ${source}`);
    return res.status(429).send('Too many requests');
  }

  // Process webhook
  await processWebhook(req.body);

  res.sendStatus(200);
});
```

### **Use Case 4: Audit Trail with Source**

```javascript
// Store webhook events with source tracking
app.post('/twenty-webhook', express.json(), async (req, res) => {
  const { event, data, updatedFields } = req.body;

  await database.auditTrail.create({
    event,
    recordId: data.id,
    objectName: req.body.objectName,
    source: data.createdBy?.source,
    actor: data.createdBy?.name,
    actorId: data.createdBy?.workspaceMemberId,
    updatedFields,
    timestamp: new Date(),
    payload: req.body,
  });

  res.sendStatus(200);
});

// Query audit trail
const apiChanges = await database.auditTrail.find({
  source: 'API',
  recordId: 'task-uuid',
});

const uiChanges = await database.auditTrail.find({
  source: 'MANUAL',
  recordId: 'task-uuid',
});
```

---

## 🔍 **TESTING**

### **Test Webhook with Different Sources:**

#### **1. Test UI Action:**

1. Login to Twenty UI
2. Update a task
3. Check webhook payload:
   ```json
   {
     "data": {
       "createdBy": {
         "source": "MANUAL",
         "name": "John Doe",
         "workspaceMemberId": "user-uuid"
       }
     }
   }
   ```

#### **2. Test API Action:**

```bash
# Update task via API
curl -X POST https://api.twenty.com/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { updateOneTask(id: \"task-uuid\", data: { status: \"DONE\" }) { id status } }"
  }'

# Check webhook payload:
# {
#   "data": {
#     "createdBy": {
#       "source": "API",
#       "name": "My API Key",
#       "workspaceMemberId": null
#     }
#   }
# }
```

#### **3. Test Workflow Action:**

1. Create workflow with trigger
2. Workflow updates a task
3. Check webhook payload:
   ```json
   {
     "data": {
       "createdBy": {
         "source": "WORKFLOW",
         "name": "Workflow Executor",
         "workspaceMemberId": null
       }
     }
   }
   ```

---

## 📊 **SUMMARY TABLE**

| Action Type | `source` | `workspaceMemberId` | `name` Example |
|-------------|----------|---------------------|----------------|
| User clicks in UI | `MANUAL` | UUID | "John Doe" |
| API call with API key | `API` | null | "My Integration" |
| Workflow automation | `WORKFLOW` | null | "Workflow Executor" |
| AI Agent action | `AGENT` | null | "Sales Agent" |
| Email sync | `EMAIL` | null | "Email Sync" |
| CSV import | `IMPORT` | null | "Data Import" |
| System migration | `SYSTEM` | null | "System" |

---

## ✅ **BEST PRACTICES**

1. **Always check `createdBy.source`** in webhook handlers
2. **Use source to prevent sync loops** (skip if source = your API key name)
3. **Log source for audit trail** (know who/what made changes)
4. **Different handling for UI vs API** (e.g., notifications, rate limits)
5. **Validate webhook signature** (use webhook secret for security)
6. **Handle missing `createdBy`** (fallback to 'UNKNOWN' source)

---

## 🔧 **TROUBLESHOOTING**

### **Issue: `createdBy` is null in webhook**

**Cause:** Object doesn't have `createdBy` field

**Solution:** Add `createdBy` field to object:

```typescript
@WorkspaceEntity({...})
export class MyObjectWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
  })
  createdBy: ActorMetadata;
}
```

### **Issue: All updates show source = API**

**Cause:** Using API key for both UI and API

**Solution:**
- UI should use user session authentication (OAuth/login)
- API should use API key
- Different authentication = different source

### **Issue: Can't differentiate between different APIs**

**Solution:** Create multiple API keys with different names:
- "Zapier Integration"
- "Custom Script"
- "Mobile App"

Check `createdBy.name` in webhook:
```javascript
if (data.createdBy?.name === 'Zapier Integration') {
  // Handle Zapier updates
}
```

---

## 📚 **REFERENCES**

### **Key Files:**

| File | Purpose |
|------|---------|
| `actor.composite-type.ts` | Actor metadata definition & sources |
| `build-created-by-from-api-key.util.ts` | Set source = API for API calls |
| `build-created-by-from-full-name-metadata.util.ts` | Set source = MANUAL for UI |
| `transform-event-to-webhook-event.ts` | Transform events to webhook payload |
| `object-record-update.event.ts` | Update event structure |

---

## 🎯 **QUICK CHECKLIST**

- [ ] Webhook nhận được `createdBy` field
- [ ] Check `createdBy.source` để phân biệt UI vs API
- [ ] Handle MANUAL (UI), API, WORKFLOW sources riêng biệt
- [ ] Prevent sync loops bằng cách skip API events từ chính mình
- [ ] Log source vào audit trail
- [ ] Test với cả UI và API updates
- [ ] Validate webhook signature (security)

---

**Tạo bởi:** Claude Code
**Ngày:** 2025-11-13
**Version:** 1.0
