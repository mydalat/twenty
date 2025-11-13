# NOTIFICATION & REMINDER SYSTEM - Twenty CRM

Hướng dẫn chi tiết về hệ thống thông báo (notifications) và nhắc nhở (reminders) trong Twenty CRM.

---

## ⚠️ **TÓM TẮT QUAN TRỌNG**

### **Twenty CRM KHÔNG có built-in task reminder tự động!**

❌ **KHÔNG có:**
- Task due date reminders tự động
- Push notifications
- Notification center/inbox
- Built-in notification entity

✅ **CÓ:**
- **Email system** (SMTP)
- **Webhook system** (external integrations)
- **SnackBar** (in-app toast notifications)
- **Workflow automation** (tạo reminders tùy chỉnh)
- **Task có trường dueAt** (due date tracking)

### **Để có task reminders, bạn cần:**

1. ✅ **Tạo Workflow với CRON trigger** (scheduled automation)
2. ✅ **Query tasks có dueAt gần đến**
3. ✅ **Send email hoặc webhook notification**

---

## 📋 **4 LOẠI NOTIFICATION TRONG TWENTY**

---

## ✅ **1. SNACKBAR (In-App Toast Notifications)**

### **Mục Đích:**
- Thông báo ngắn gọn trong app (6 giây)
- Success/Error/Warning/Info messages
- Không persistent (biến mất sau vài giây)

### **Variants:**

| Variant | Icon | Color | Use Case |
|---------|------|-------|----------|
| `Success` | ✓ | Green | Operation thành công |
| `Error` | ⚠ | Red | Lỗi xảy ra |
| `Warning` | ⚠ | Yellow | Cảnh báo |
| `Info` | ℹ | Blue | Thông tin chung |
| `Default` | ⚠ | Gray | Default message |

### **Frontend Usage:**

#### **File:** `packages/twenty-front/src/modules/ui/feedback/snack-bar-manager/components/SnackBar.tsx`

```typescript
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SnackBarVariant } from '@/ui/feedback/snack-bar-manager/components/SnackBar';

function MyComponent() {
  const { enqueueSnackBar } = useSnackBar();

  const handleSuccess = () => {
    enqueueSnackBar('Task created successfully!', {
      variant: SnackBarVariant.Success,
      duration: 6000,
    });
  };

  const handleError = () => {
    enqueueSnackBar('Failed to save task', {
      variant: SnackBarVariant.Error,
      detailedMessage: 'Please check your internet connection',
      duration: 10000,
    });
  };

  const handleWithLink = () => {
    enqueueSnackBar('New update available', {
      variant: SnackBarVariant.Info,
      link: {
        href: '/updates',
        text: 'View details',
      },
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWithLink}>Show Info with Link</button>
    </div>
  );
}
```

### **Props:**

```typescript
{
  message: string;              // Main message
  variant?: SnackBarVariant;    // Success | Error | Warning | Info | Default
  duration?: number;            // Auto-close duration (ms), default 6000
  detailedMessage?: string;     // Additional details
  link?: {                      // Optional link
    href: string;
    text: string;
  };
  onCancel?: () => void;        // Cancel button callback
  onClose?: () => void;         // Close callback
  icon?: ReactNode;             // Custom icon
  dedupeKey?: string;           // Prevent duplicate notifications
}
```

### **Example: Task Due Date Warning**

```typescript
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SnackBarVariant } from '@/ui/feedback/snack-bar-manager/components/SnackBar';

function TaskList() {
  const { enqueueSnackBar } = useSnackBar();

  useEffect(() => {
    // Check for tasks due today
    const tasksDueToday = tasks.filter(task =>
      isToday(task.dueAt) && task.status !== 'DONE'
    );

    if (tasksDueToday.length > 0) {
      enqueueSnackBar(
        `${tasksDueToday.length} task(s) due today!`,
        {
          variant: SnackBarVariant.Warning,
          link: {
            href: '/objects/tasks',
            text: 'View tasks',
          },
          duration: 10000,
        }
      );
    }
  }, [tasks]);

  return <div>...</div>;
}
```

---

## ✅ **2. EMAIL NOTIFICATIONS (SMTP)**

### **Mục Đích:**
- Gửi email notification cho users
- Task reminders
- Status updates
- Reports

### **Backend Email Service:**

#### **File:** `packages/twenty-server/src/engine/core-modules/email/email.service.ts`

```typescript
import { EmailService } from 'src/engine/core-modules/email/email.service';

@Injectable()
export class TaskReminderService {
  constructor(private readonly emailService: EmailService) {}

  async sendTaskDueReminder(task: Task, assignee: User) {
    await this.emailService.send({
      from: 'noreply@yourcompany.com',
      to: assignee.email,
      subject: `Task Due: ${task.title}`,
      text: `Your task "${task.title}" is due on ${task.dueAt}`,
      html: `
        <h2>Task Due Reminder</h2>
        <p>Your task <strong>${task.title}</strong> is due on <strong>${task.dueAt}</strong></p>
        <a href="https://app.yourcompany.com/objects/task/${task.id}">View Task</a>
      `,
    });
  }
}
```

### **Configuration:**

#### **.env**

```bash
# SMTP Configuration
EMAIL_DRIVER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=noreply@yourcompany.com
EMAIL_FROM_NAME=Twenty CRM
```

### **Available Email Drivers:**

| Driver | Use Case |
|--------|----------|
| `smtp` | Production (Gmail, SendGrid, etc.) |
| `logger` | Development (logs to console) |

**Source:** `packages/twenty-server/src/engine/core-modules/email/enums/email-driver.enum.ts`

---

## ✅ **3. WEBHOOK NOTIFICATIONS (External Systems)**

### **Mục Đích:**
- Send events to external systems (Slack, Discord, custom apps)
- Real-time integrations
- Task due date alerts to Slack

### **Webhook Entity:**

**File:** `packages/twenty-server/src/engine/core-modules/webhook/webhook.entity.ts`

```typescript
{
  targetUrl: string;          // Webhook URL (https://...)
  operations: string[];       // Events to trigger on
  secret?: string;           // Optional webhook secret
  workspaceId: string;       // Workspace ID
}
```

### **Create Webhook via GraphQL:**

```graphql
mutation CreateWebhook {
  createWebhook(data: {
    targetUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    operations: ["task.created", "task.updated"]
    description: "Send task updates to Slack"
  }) {
    id
    targetUrl
    operations
  }
}
```

### **Webhook Operations (Events):**

| Operation | Trigger |
|-----------|---------|
| `task.created` | Task created |
| `task.updated` | Task updated |
| `task.deleted` | Task deleted |
| `company.created` | Company created |
| `person.created` | Person created |
| `*.created` | Any object created |
| `*.updated` | Any object updated |

### **Webhook Payload Example:**

```json
{
  "event": "task.updated",
  "workspaceId": "workspace-uuid",
  "objectName": "task",
  "recordId": "task-uuid",
  "data": {
    "id": "task-uuid",
    "title": "Follow up with client",
    "dueAt": "2025-11-14T10:00:00Z",
    "status": "TODO",
    "assignee": {
      "id": "user-uuid",
      "name": "John Doe"
    }
  },
  "timestamp": "2025-11-13T15:30:00Z"
}
```

### **Example: Slack Notification for Task Due**

**Slack Incoming Webhook:**

```javascript
// Custom webhook endpoint that receives from Twenty
app.post('/twenty-webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'task.updated' && data.dueAt) {
    const dueDate = new Date(data.dueAt);
    const now = new Date();
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

    // Alert if task due within 24 hours
    if (hoursUntilDue > 0 && hoursUntilDue < 24) {
      await axios.post('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
        text: `⏰ Task due soon: *${data.title}*`,
        attachments: [{
          color: 'warning',
          fields: [
            { title: 'Due At', value: data.dueAt, short: true },
            { title: 'Status', value: data.status, short: true },
            { title: 'Assignee', value: data.assignee?.name || 'Unassigned', short: true },
          ],
          actions: [{
            type: 'button',
            text: 'View Task',
            url: `https://app.yourcompany.com/object/task/${data.id}`,
          }],
        }],
      });
    }
  }

  res.sendStatus(200);
});
```

---

## ✅ **4. WORKFLOW AUTOMATION (Task Reminders)**

### **Mục Đích:**
- Tạo automated task reminders
- Scheduled notifications (daily, hourly)
- Custom notification logic

### **Workflow với CRON Trigger:**

#### **Tạo Workflow qua UI:**

1. Vào **Settings → Workflows → Create Workflow**
2. Chọn **Trigger Type: Scheduled (CRON)**
3. Set schedule:
   - **Daily at 9 AM**: Check tasks due today
   - **Hourly**: Check tasks due in next hour
4. Add **Action: Send Email** hoặc **Call Webhook**

#### **Workflow Entity Structure:**

**File:** `packages/twenty-server/src/modules/workflow/common/standard-objects/workflow-automated-trigger.workspace-entity.ts`

```typescript
{
  type: 'CRON' | 'DATABASE_EVENT',
  settings: {
    schedule: {
      hour: number,    // 0-23
      minute: number,  // 0-59
      day?: number,    // 1-31 (for daily pattern)
    }
  }
}
```

### **Example 1: Daily Task Reminder at 9 AM**

#### **Workflow Configuration:**

```json
{
  "name": "Daily Task Reminder",
  "trigger": {
    "type": "CRON",
    "settings": {
      "schedule": {
        "hour": 9,
        "minute": 0
      }
    }
  },
  "steps": [
    {
      "type": "CODE",
      "action": "query_tasks_due_today",
      "code": `
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasks = await twenty.object('task').findMany({
          where: {
            dueAt: {
              gte: today.toISOString(),
              lt: tomorrow.toISOString()
            },
            status: { ne: 'DONE' }
          },
          include: {
            assignee: true
          }
        });

        return { tasks };
      `
    },
    {
      "type": "TOOL",
      "action": "send_email",
      "settings": {
        "email": "{{steps.query_tasks_due_today.output.tasks[0].assignee.email}}",
        "subject": "Tasks Due Today",
        "body": "You have {{steps.query_tasks_due_today.output.tasks.length}} task(s) due today"
      }
    }
  ]
}
```

### **Example 2: Task Due in 1 Hour Alert**

```json
{
  "name": "Task Due in 1 Hour",
  "trigger": {
    "type": "CRON",
    "settings": {
      "schedule": {
        "minute": 0  // Run every hour at :00
      }
    }
  },
  "steps": [
    {
      "type": "CODE",
      "action": "check_tasks_due_soon",
      "code": `
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        const tasks = await twenty.object('task').findMany({
          where: {
            dueAt: {
              gte: now.toISOString(),
              lte: oneHourLater.toISOString()
            },
            status: { in: ['TODO', 'IN_PROGRESS'] }
          },
          include: {
            assignee: true
          }
        });

        return { tasks };
      `
    },
    {
      "type": "FOR_EACH",
      "items": "{{steps.check_tasks_due_soon.output.tasks}}",
      "steps": [
        {
          "type": "TOOL",
          "action": "send_email",
          "settings": {
            "email": "{{item.assignee.email}}",
            "subject": "⏰ Task due in 1 hour: {{item.title}}",
            "body": "Your task '{{item.title}}' is due in 1 hour!"
          }
        }
      ]
    }
  ]
}
```

### **CRON Schedule Patterns:**

| Pattern | Description |
|---------|-------------|
| `0 9 * * *` | Daily at 9:00 AM |
| `0 * * * *` | Every hour at :00 |
| `*/30 * * * *` | Every 30 minutes |
| `0 9,17 * * *` | Daily at 9 AM and 5 PM |
| `0 9 * * 1-5` | Weekdays at 9 AM |

**Source:** `packages/twenty-server/src/modules/workflow/workflow-trigger/utils/compute-cron-pattern-from-schedule.ts`

---

## 🛠️ **IMPLEMENTATION GUIDE: TASK DUE DATE REMINDERS**

### **Step 1: Create Task Reminder Workflow**

#### **Via GraphQL API:**

```graphql
mutation CreateTaskReminderWorkflow {
  createOneWorkflow(data: {
    name: "Task Due Reminders"
    position: 0
  }) {
    id
  }
}

mutation CreateWorkflowTrigger($workflowId: ID!) {
  createOneWorkflowAutomatedTrigger(data: {
    type: "CRON"
    settings: {
      schedule: {
        hour: 9
        minute: 0
      }
    }
    workflowId: $workflowId
  }) {
    id
  }
}
```

### **Step 2: Create Backend Service**

#### **File:** `packages/twenty-server/src/modules/task/services/task-reminder.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

@Injectable()
export class TaskReminderService {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly emailService: EmailService,
  ) {}

  async sendDailyReminders(workspaceId: string) {
    const taskRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<TaskWorkspaceEntity>(
        workspaceId,
        'task',
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await taskRepository.find({
      where: {
        dueAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['TODO', 'IN_PROGRESS'],
        },
      },
      relations: {
        assignee: true,
      },
    });

    for (const task of tasksDueToday) {
      if (task.assignee?.email) {
        await this.emailService.send({
          to: task.assignee.email,
          subject: `Task Due Today: ${task.title}`,
          html: `
            <h2>⏰ Task Reminder</h2>
            <p>Your task <strong>${task.title}</strong> is due today!</p>
            <p><strong>Status:</strong> ${task.status}</p>
            <a href="${process.env.FRONT_BASE_URL}/object/task/${task.id}">
              View Task →
            </a>
          `,
        });
      }
    }

    return {
      sent: tasksDueToday.length,
      tasks: tasksDueToday.map(t => ({ id: t.id, title: t.title })),
    };
  }

  async sendHourlyReminders(workspaceId: string) {
    const taskRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<TaskWorkspaceEntity>(
        workspaceId,
        'task',
      );

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const tasksDueSoon = await taskRepository.find({
      where: {
        dueAt: {
          gte: now,
          lte: oneHourLater,
        },
        status: {
          in: ['TODO', 'IN_PROGRESS'],
        },
      },
      relations: {
        assignee: true,
      },
    });

    for (const task of tasksDueSoon) {
      if (task.assignee?.email) {
        await this.emailService.send({
          to: task.assignee.email,
          subject: `⏰ Task due in 1 hour: ${task.title}`,
          html: `
            <h2>🚨 Urgent: Task Due Soon</h2>
            <p>Your task <strong>${task.title}</strong> is due in 1 hour!</p>
            <p><strong>Due At:</strong> ${task.dueAt}</p>
            <a href="${process.env.FRONT_BASE_URL}/object/task/${task.id}">
              View Task →
            </a>
          `,
        });
      }
    }

    return {
      sent: tasksDueSoon.length,
      tasks: tasksDueSoon.map(t => ({ id: t.id, title: t.title })),
    };
  }
}
```

### **Step 3: Create CRON Job**

#### **File:** `packages/twenty-server/src/modules/task/crons/task-reminder.cron.job.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TaskReminderService } from '../services/task-reminder.service';

@Injectable()
export class TaskReminderCronJob {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly taskReminderService: TaskReminderService,
  ) {}

  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find();

    for (const workspace of workspaces) {
      try {
        await this.taskReminderService.sendDailyReminders(workspace.id);
      } catch (error) {
        console.error(
          `Failed to send reminders for workspace ${workspace.id}:`,
          error,
        );
      }
    }
  }
}
```

### **Step 4: Register CRON**

#### **File:** `packages/twenty-server/src/modules/task/task.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskReminderCronJob } from './crons/task-reminder.cron.job';
import { TaskReminderService } from './services/task-reminder.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TaskReminderService, TaskReminderCronJob],
  exports: [TaskReminderService],
})
export class TaskModule {}
```

#### **Schedule the CRON:**

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskReminderCronJob } from './task-reminder.cron.job';

@Injectable()
export class TaskReminderScheduler {
  constructor(private readonly taskReminderCronJob: TaskReminderCronJob) {}

  // Run daily at 9 AM
  @Cron('0 9 * * *')
  async handleDailyReminders() {
    await this.taskReminderCronJob.handle();
  }

  // Run hourly
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReminders() {
    // Implement hourly reminder logic
  }
}
```

---

## 📊 **TASK ENTITY STRUCTURE**

### **Task Fields:**

**File:** `packages/twenty-server/src/modules/task/standard-objects/task.workspace-entity.ts:86-93`

```typescript
@WorkspaceField({
  standardId: TASK_STANDARD_FIELD_IDS.dueAt,
  type: FieldMetadataType.DATE_TIME,
  label: msg`Due Date`,
  description: msg`Task due date`,
  icon: 'IconCalendarEvent',
})
@WorkspaceIsNullable()
dueAt: Date | null;
```

### **Query Tasks by Due Date:**

#### **GraphQL:**

```graphql
query TasksDueToday {
  tasks(
    filter: {
      and: [
        {
          dueAt: {
            gte: "2025-11-13T00:00:00Z"
            lt: "2025-11-14T00:00:00Z"
          }
        }
        {
          status: {
            neq: "DONE"
          }
        }
      ]
    }
  ) {
    edges {
      node {
        id
        title
        dueAt
        status
        assignee {
          id
          name {
            firstName
            lastName
          }
          email
        }
      }
    }
  }
}
```

#### **TypeScript (Twenty ORM):**

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const tasks = await taskRepository.find({
  where: {
    dueAt: Between(today, tomorrow),
    status: In(['TODO', 'IN_PROGRESS']),
  },
  relations: {
    assignee: true,
  },
});
```

---

## 🔧 **ALTERNATIVE SOLUTIONS**

### **Option 1: Third-Party Notification Service**

Integrate với:
- **Twilio**: SMS notifications
- **Firebase Cloud Messaging**: Push notifications
- **OneSignal**: Multi-channel notifications
- **Pushover**: Push notifications

### **Option 2: Custom Notification Entity**

Tạo custom Notification object:

```typescript
@WorkspaceEntity({
  standardId: 'notification-uuid',
  namePlural: 'notifications',
  labelSingular: msg`Notification`,
  labelPlural: msg`Notifications`,
})
export class NotificationWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({ type: FieldMetadataType.TEXT })
  title: string;

  @WorkspaceField({ type: FieldMetadataType.TEXT })
  message: string;

  @WorkspaceField({ type: FieldMetadataType.SELECT })
  type: 'TASK_DUE' | 'TASK_ASSIGNED' | 'MENTION';

  @WorkspaceField({ type: FieldMetadataType.BOOLEAN })
  isRead: boolean;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  user: Relation<WorkspaceMemberWorkspaceEntity>;

  @WorkspaceField({ type: FieldMetadataType.UUID })
  relatedRecordId: string;
}
```

Sau đó:
1. Workflow tạo Notification records
2. Frontend poll hoặc subscribe (GraphQL subscriptions)
3. Display trong notification dropdown

### **Option 3: AI Agent Send Email**

Dùng AI Agent với SendEmailTool:

```typescript
// AI Agent prompt
const agent = createAgent({
  name: 'Task Reminder Agent',
  prompt: `
    You are a task reminder agent.
    Check for tasks due today and send email reminders to assignees.

    For each task due today:
    1. Get task details (title, dueAt, assignee)
    2. Send email to assignee with task info
    3. Include link to task page
  `,
  tools: ['sendEmail', 'queryTasks'],
});
```

---

## 📚 **REFERENCE**

### **Key Files:**

| File | Purpose |
|------|---------|
| `task.workspace-entity.ts:86-93` | Task dueAt field definition |
| `email.service.ts` | Email sending service |
| `send-email-tool.ts` | AI Agent email tool |
| `SnackBar.tsx` | In-app toast notifications |
| `webhook.service.ts` | Webhook management |
| `workflow-automated-trigger.workspace-entity.ts` | CRON trigger config |

### **Environment Variables:**

```bash
# Email (SMTP)
EMAIL_DRIVER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=noreply@yourcompany.com

# Frontend URL (for email links)
FRONT_BASE_URL=https://app.yourcompany.com
```

---

## ✅ **CHECKLIST: Implement Task Reminders**

- [ ] Configure SMTP email settings in .env
- [ ] Create TaskReminderService
- [ ] Create CRON job for daily reminders (9 AM)
- [ ] Create CRON job for hourly reminders (optional)
- [ ] Create Workflow with CRON trigger
- [ ] Add query step to find tasks due today
- [ ] Add send email action step
- [ ] Test with sample tasks
- [ ] Monitor email delivery logs
- [ ] (Optional) Add webhook notification to Slack

---

## 🎯 **USE CASES**

### **1. Daily Task Summary Email (9 AM)**

```
Subject: 📋 Your Tasks for Today

Hi John,

You have 3 tasks due today:

1. ✅ Follow up with client ABC
   Due: Today at 2 PM
   [View Task →]

2. 📝 Review proposal
   Due: Today at 4 PM
   [View Task →]

3. 📞 Schedule meeting
   Due: Today at 5 PM
   [View Task →]

Good luck!
- Twenty CRM
```

### **2. Urgent Task Alert (1 hour before)**

```
Subject: 🚨 Task due in 1 hour: Follow up with client

Your task "Follow up with client ABC" is due in 1 hour!

Due At: Today at 2:00 PM
Status: In Progress

[View Task →]
```

### **3. Overdue Task Alert**

```
Subject: ⚠️ Overdue Task: Follow up with client

Your task "Follow up with client ABC" is now overdue!

Due Date: Yesterday at 2:00 PM
Status: To Do

[View Task →]
```

### **4. Weekly Task Summary (Monday morning)**

```
Subject: 📅 Your Tasks for This Week

Hi John,

You have 12 tasks scheduled this week:

TODAY (Monday):
- Task 1
- Task 2

TOMORROW (Tuesday):
- Task 3

...

[View All Tasks →]
```

---

**Tạo bởi:** Claude Code
**Ngày:** 2025-11-13
**Version:** 1.0
