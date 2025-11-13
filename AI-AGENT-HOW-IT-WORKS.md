# 🤖 Cách AI Agent của Twenty CRM Hoạt Động

**Giải thích chi tiết, dễ hiểu với ví dụ thực tế**

---

## 📊 **Architecture Overview (Kiến trúc tổng quan)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Settings  │  │ Chat with  │  │   Create   │  │  Workflow  │       │
│  │  → AI      │  │   Agents   │  │   Custom   │  │  Builder   │       │
│  │            │  │            │  │   Agents   │  │            │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TWENTY BACKEND (NestJS)                          │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      AI ENGINE CORE                                │ │
│  │                                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ Agent        │  │ Model        │  │ AI           │           │ │
│  │  │ Execution    │  │ Registry     │  │ Router       │           │ │
│  │  │ Service      │  │ Service      │  │ Service      │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  │                                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ Tool         │  │ Chat         │  │ Agent        │           │ │
│  │  │ Service      │  │ Service      │  │ Handoff      │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    METADATA MODULES                                │ │
│  │                                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ Agent        │  │ Object       │  │ Field        │           │ │
│  │  │ Metadata     │  │ Metadata     │  │ Metadata     │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        DATABASE                                    │ │
│  │  • Chat threads & messages                                        │ │
│  │  • Agent configurations                                           │ │
│  │  • CRM data (Companies, People, Opportunities)                    │ │
│  │  • Workspace metadata                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              │ HTTPS API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI PROVIDERS                                     │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   OpenAI     │  │  Anthropic   │  │     xAI      │  │  getvoila  │ │
│  │              │  │              │  │              │  │  (custom)  │ │
│  │ • GPT-4o     │  │ • Claude     │  │ • Grok-3     │  │ • Custom   │ │
│  │ • GPT-4o-mini│  │   Opus 4     │  │ • Grok-4     │  │   Models   │ │
│  │ • GPT-4      │  │ • Sonnet 4   │  │ • Grok-mini  │  │            │ │
│  │   Turbo      │  │ • Haiku 3.5  │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Flow Chi Tiết: User Chat với Agent**

### **Ví dụ thực tế:** User muốn tạo company mới

```
┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: User gửi message                                            │
└─────────────────────────────────────────────────────────────────────┘

User trong UI: "Create a company called Acme Corp with 50 employees"
                    │
                    │ POST /rest/agent-chat/stream
                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ Request payload:                                                      │
│ {                                                                     │
│   "threadId": "thread-abc-123",                                      │
│   "messages": [                                                       │
│     {                                                                 │
│       "role": "user",                                                 │
│       "content": "Create a company called Acme Corp with 50 employees"│
│     }                                                                 │
│   ]                                                                   │
│ }                                                                     │
└───────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Backend xử lý request                                       │
└─────────────────────────────────────────────────────────────────────┘

Backend (AgentChatController):
  1. Validate authentication
  2. Load chat thread (or create new)
  3. Determine which agent to use
     → User đang chat với "Data Manipulator Agent"
  4. Load agent configuration


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Load Agent Configuration                                    │
└─────────────────────────────────────────────────────────────────────┘

Agent Config loaded:
┌───────────────────────────────────────────────────────────────────┐
│ Agent: Data Manipulator Agent                                     │
│                                                                   │
│ • ID: "data-manipulator-agent"                                   │
│ • Model: "auto" → resolves to "gpt-4o" (từ .env)                │
│ • System Prompt:                                                 │
│   "You are a data manipulation assistant that helps users       │
│    create, update, and delete records in their CRM.             │
│    Always confirm before deleting data.                         │
│    When creating records, ask for required fields if missing."  │
│                                                                   │
│ • Available Tools:                                               │
│   ✓ create_company(name, domainName, employees, ...)           │
│   ✓ update_company(id, data)                                    │
│   ✓ delete_company(id)                                          │
│   ✓ find_company(filter)                                        │
│   ✓ create_person(...)                                          │
│   ✓ update_person(...)                                          │
│   ... (100+ auto-generated tools từ database schema)            │
│                                                                   │
│ • Permissions:                                                   │
│   ✓ User có quyền CREATE trên Company                           │
│   ✓ User có quyền READ trên Company                             │
│   ✗ User KHÔNG có quyền DELETE trên Company                     │
└───────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Build LLM Request                                           │
└─────────────────────────────────────────────────────────────────────┘

Backend builds request for getvoila API:

POST https://api.getvoila.ai/v1/chat/completions
Headers:
  Authorization: Bearer YOUR_GETVOILA_API_KEY
  Content-Type: application/json

Body:
{
  "model": "gpt-4o",
  "stream": true,                    // ← Streaming enabled
  "messages": [
    {
      "role": "system",
      "content": "You are a data manipulation assistant that helps..."
    },
    {
      "role": "user",
      "content": "Create a company called Acme Corp with 50 employees"
    }
  ],
  "tools": [                         // ← Available tools
    {
      "type": "function",
      "function": {
        "name": "create_company",
        "description": "Create a new company in the database",
        "parameters": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Company name (required)"
            },
            "domainName": {
              "type": "string",
              "description": "Company domain (e.g., acme.com)"
            },
            "employees": {
              "type": "number",
              "description": "Number of employees"
            },
            "annualRecurringRevenue": {
              "type": "object",
              "description": "ARR in currency format"
            }
          },
          "required": ["name"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "find_company",
        "description": "Search for companies",
        ...
      }
    }
    // ... + 100 other tools
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 5: getvoila API xử lý                                          │
└─────────────────────────────────────────────────────────────────────┘

getvoila receives request → forwards to GPT-4o:

GPT-4o reasoning (internal):
┌───────────────────────────────────────────────────────────────────┐
│ User wants to create a company.                                   │
│ I have access to create_company tool.                            │
│ Required field: name = "Acme Corp" ✓                             │
│ Optional field: employees = 50 ✓                                 │
│ I should call create_company with these parameters.              │
└───────────────────────────────────────────────────────────────────┘

getvoila returns (streaming):

Response chunk 1:
data: {"choices":[{"delta":{"role":"assistant","tool_calls":[{"index":0,"id":"call_xyz789","type":"function","function":{"name":"create_company"}}]}}]}

Response chunk 2:
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"name\""}}]}}]}

Response chunk 3:
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":": \"Acme Corp\", \"employees\": 50}"}}]}}]}

Response chunk 4 (end):
data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}

data: [DONE]


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6: Backend nhận tool call request                              │
└─────────────────────────────────────────────────────────────────────┘

Backend parses response:
┌───────────────────────────────────────────────────────────────────┐
│ Tool Call Detected!                                               │
│                                                                   │
│ Function: create_company                                          │
│ Arguments: {                                                      │
│   "name": "Acme Corp",                                           │
│   "employees": 50                                                │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘

Backend validation:
  1. ✓ Tool exists in available tools
  2. ✓ User has CREATE permission on Company
  3. ✓ Arguments match schema
  4. → Execute tool


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 7: Tool Execution (Database Operation)                         │
└─────────────────────────────────────────────────────────────────────┘

Backend executes:
┌───────────────────────────────────────────────────────────────────┐
│ Tool Service → Database                                           │
│                                                                   │
│ SQL Generated:                                                    │
│ INSERT INTO workspace_abc.company                                 │
│   (id, name, employees, "createdAt", "updatedAt", "workspaceId")│
│ VALUES                                                            │
│   ('550e8400-...', 'Acme Corp', 50, NOW(), NOW(), 'workspace-abc')│
│ RETURNING *;                                                      │
└───────────────────────────────────────────────────────────────────┘

Database returns:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corp",
  "domainName": null,
  "employees": 50,
  "annualRecurringRevenue": null,
  "address": null,
  "createdAt": "2025-11-13T10:30:45.123Z",
  "updatedAt": "2025-11-13T10:30:45.123Z",
  "workspaceId": "workspace-abc-123"
}

Tool execution result saved to chat history


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 8: Send tool result back to LLM                                │
└─────────────────────────────────────────────────────────────────────┘

Backend makes SECOND API call to getvoila:

POST https://api.getvoila.ai/v1/chat/completions
{
  "model": "gpt-4o",
  "stream": true,
  "messages": [
    {
      "role": "system",
      "content": "You are a data manipulation assistant..."
    },
    {
      "role": "user",
      "content": "Create a company called Acme Corp with 50 employees"
    },
    {
      "role": "assistant",
      "tool_calls": [
        {
          "id": "call_xyz789",
          "type": "function",
          "function": {
            "name": "create_company",
            "arguments": "{\"name\": \"Acme Corp\", \"employees\": 50}"
          }
        }
      ]
    },
    {
      "role": "tool",                    // ← Tool result
      "tool_call_id": "call_xyz789",
      "content": "{\"id\": \"550e8400-e29b-41d4-a716-446655440000\", \"name\": \"Acme Corp\", \"employees\": 50}"
    }
  ],
  "tools": [...],
  "temperature": 0.7
}


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 9: LLM generates final user-facing response                   │
└─────────────────────────────────────────────────────────────────────┘

getvoila/GPT-4o reasoning:
┌───────────────────────────────────────────────────────────────────┐
│ Tool execution successful.                                        │
│ Company created with ID 550e8400-...                             │
│ I should inform user in a friendly way.                          │
└───────────────────────────────────────────────────────────────────┘

getvoila returns (streaming):

data: {"choices":[{"delta":{"content":"I've"}}]}
data: {"choices":[{"delta":{"content":" successfully"}}]}
data: {"choices":[{"delta":{"content":" created"}}]}
data: {"choices":[{"delta":{"content":" the"}}]}
data: {"choices":[{"delta":{"content":" company"}}]}
data: {"choices":[{"delta":{"content":" **Acme"}}]}
data: {"choices":[{"delta":{"content":" Corp**"}}]}
data: {"choices":[{"delta":{"content":" with"}}]}
data: {"choices":[{"delta":{"content":" 50"}}]}
data: {"choices":[{"delta":{"content":" employees."}}]}
data: {"choices":[{"delta":{"content":" The"}}]}
data: {"choices":[{"delta":{"content":" company"}}]}
data: {"choices":[{"delta":{"content":" ID"}}]}
data: {"choices":[{"delta":{"content":" is"}}]}
data: {"choices":[{"delta":{"content":" `550e8400-"}}]}
data: {"choices":[{"delta":{"content":"e29b-41d4-"}}]}
data: {"choices":[{"delta":{"content":"a716-446655440000`."}}]}
data: {"choices":[{"delta":{"content":" Would"}}]}
data: {"choices":[{"delta":{"content":" you"}}]}
data: {"choices":[{"delta":{"content":" like"}}]}
data: {"choices":[{"delta":{"content":" to"}}]}
data: {"choices":[{"delta":{"content":" add"}}]}
data: {"choices":[{"delta":{"content":" more"}}]}
data: {"choices":[{"delta":{"content":" details"}}]}
data: {"choices":[{"delta":{"content":" or"}}]}
data: {"choices":[{"delta":{"content":" people"}}]}
data: {"choices":[{"delta":{"content":" to"}}]}
data: {"choices":[{"delta":{"content":" this"}}]}
data: {"choices":[{"delta":{"content":" company?"}}]}
data: {"choices":[{"finish_reason":"stop"}]}

data: [DONE]


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 10: Stream response to user                                    │
└─────────────────────────────────────────────────────────────────────┘

Backend streams to frontend via Server-Sent Events:

event: message
data: {"chunk":"I've"}

event: message
data: {"chunk":" successfully"}

event: message
data: {"chunk":" created"}

...

event: message
data: {"chunk":" company?"}

event: done
data: {"messageId":"msg-123"}


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 11: Frontend displays message                                  │
└─────────────────────────────────────────────────────────────────────┘

React UI updates in real-time:

┌───────────────────────────────────────────────────────────────────┐
│ Chat Interface                                                    │
│                                                                   │
│ User:                                                             │
│ Create a company called Acme Corp with 50 employees              │
│                                                                   │
│ Data Manipulator Agent: ●                                        │
│ I've successfully created the company **Acme Corp** with 50      │
│ employees. The company ID is `550e8400-e29b-41d4-a716-           │
│ 446655440000`. Would you like to add more details or people      │
│ to this company?                                                  │
│                                                                   │
│ [Type your message...]                          [Send]            │
└───────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 12: Save to database                                           │
└─────────────────────────────────────────────────────────────────────┘

Backend saves chat history:

Table: chat_message
{
  "id": "msg-user-123",
  "threadId": "thread-abc-123",
  "role": "user",
  "content": "Create a company called Acme Corp with 50 employees",
  "createdAt": "2025-11-13T10:30:45.000Z"
}

{
  "id": "msg-asst-456",
  "threadId": "thread-abc-123",
  "role": "assistant",
  "content": "I've successfully created the company **Acme Corp**...",
  "toolCalls": [
    {
      "id": "call_xyz789",
      "name": "create_company",
      "arguments": "{\"name\": \"Acme Corp\", \"employees\": 50}",
      "result": "{\"id\": \"550e8400-...\", \"name\": \"Acme Corp\", ...}"
    }
  ],
  "createdAt": "2025-11-13T10:30:47.000Z"
}

✅ Flow hoàn tất! Ready for next user message.
```

---

## 🎯 **Các Tính Năng Agent Hỗ Trợ**

### **1. Database Operations (Auto-generated Tools)**

**Từ mọi object trong database → tự động generate tools:**

#### **Company Object → 6 tools:**
```typescript
✓ create_company(name, domainName, employees, ...)
  → INSERT INTO company ...

✓ update_company(id, data)
  → UPDATE company SET ... WHERE id = ?

✓ delete_company(id)
  → DELETE FROM company WHERE id = ?

✓ soft_delete_company(id)
  → UPDATE company SET deletedAt = NOW() WHERE id = ?

✓ find_company(filter, orderBy, limit)
  → SELECT * FROM company WHERE ... ORDER BY ...

✓ find_one_company(id)
  → SELECT * FROM company WHERE id = ?
```

#### **Person Object → 6 tools:**
```typescript
✓ create_person(name, email, phone, jobTitle, ...)
✓ update_person(id, data)
✓ delete_person(id)
✓ soft_delete_person(id)
✓ find_person(filter)
✓ find_one_person(id)
```

#### **Opportunity Object → 6 tools:**
```typescript
✓ create_opportunity(name, amount, stage, closeDate, ...)
✓ update_opportunity(id, data)
✓ delete_opportunity(id)
✓ soft_delete_opportunity(id)
✓ find_opportunity(filter)
✓ find_one_opportunity(id)
```

**Total:** 29 standard objects × 6 tools = **174 auto-generated tools**

Plus custom objects bạn tạo thêm!

---

### **2. Complex Multi-Step Operations**

Agent có thể chain tools together:

**Ví dụ:** "Create company Acme Corp and add John Doe as CEO"

```
┌─ Step 1 ─────────────────────────────────────────────────┐
│ Agent calls: create_company("Acme Corp")                 │
│ Result: { id: "company-123", name: "Acme Corp" }        │
└───────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ Step 2 ─────────────────────────────────────────────────┐
│ Agent calls: create_person(                              │
│   name: "John Doe",                                      │
│   jobTitle: "CEO"                                        │
│ )                                                         │
│ Result: { id: "person-456", name: "John Doe" }          │
└───────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ Step 3 ─────────────────────────────────────────────────┐
│ Agent calls: update_person(                              │
│   id: "person-456",                                      │
│   data: { companyId: "company-123" }                    │
│ )                                                         │
│ Result: Person linked to company ✓                       │
└───────────────────────────────────────────────────────────┘
                        │
                        ▼
          Final response to user:
     "Done! Created Acme Corp and added
      John Doe as CEO with link between them."
```

**Limit:** Maximum 10 tool calls per conversation (configurable)

---

### **3. Intelligent Data Search**

Agent có thể search với natural language:

**User:** "Show me all companies in San Francisco with more than 100 employees"

```typescript
Agent calls: find_company({
  filter: {
    and: [
      {
        address: {
          contains: "San Francisco"
        }
      },
      {
        employees: {
          gte: 100
        }
      }
    ]
  },
  orderBy: {
    employees: "DESC"
  }
})
```

**Result:** Agent formats và presents data:
```
Found 15 companies in San Francisco with 100+ employees:

1. **Salesforce** - 73,000 employees
   📍 San Francisco, CA

2. **Stripe** - 8,000 employees
   📍 San Francisco, CA

3. **Airbnb** - 6,200 employees
   📍 San Francisco, CA

...
```

---

### **4. Permission-Aware Operations**

Agent respect user permissions:

**Scenario:** User chỉ có READ permission trên Companies

```typescript
User: "Delete company Acme Corp"

Agent reasoning:
  ✓ find_company available
  ✗ delete_company NOT available (permission denied)

Agent response:
  "I don't have permission to delete companies.
   Only users with delete permissions can perform this action.
   Would you like me to help with something else?"
```

---

### **5. Context-Aware Queries**

Agent biết context của user:

**Scenario:** User đang xem company detail page

```typescript
Frontend sends:
{
  "messages": [...],
  "recordIdsByObjectMetadataNameSingular": {
    "company": ["550e8400-e29b-41d4-a716-446655440000"]
  }
}

User: "What opportunities are open?"

Agent reasoning:
  - User is viewing company 550e8400-...
  - Query opportunities for THIS company

Agent calls: find_opportunity({
  filter: {
    companyId: { eq: "550e8400-..." },
    stage: { in: ["NEW", "SCREENING", "MEETING", "PROPOSAL"] }
  }
})
```

---

### **6. Multi-Agent Collaboration (Handoffs)**

Agents có thể consult nhau:

```
┌──────────────────────────────────────────────────────────────┐
│ User chatting with: Helper Agent                            │
└──────────────────────────────────────────────────────────────┘

User: "How do I create a workflow that sends email when
       opportunity stage changes?"

Helper Agent reasoning:
  - This is about workflow creation
  - I have handoff configured to Workflow Builder Agent
  - Let me route this to specialist

Helper Agent: "This is a workflow question. Let me connect you
               with our Workflow Builder specialist..."

┌──────────────────────────────────────────────────────────────┐
│ Handoff initiated → Workflow Builder Agent                   │
└──────────────────────────────────────────────────────────────┘

Workflow Builder Agent: "I can help you create that workflow!
                         Here's what we'll set up:

                         Trigger: When Opportunity.stage changes
                         Action: Send email notification

                         Let me create this for you..."

[Agent creates workflow using create_workflow tool]

Workflow Builder: "Done! Workflow created. It will trigger
                   whenever an opportunity stage changes."
```

---

### **7. Native Model Capabilities**

#### **A. Web Search (OpenAI, Anthropic, xAI)**

```typescript
Agent config:
{
  modelConfiguration: {
    webSearch: { enabled: true }
  }
}

User: "What's the current stock price of Tesla?"

Agent: [Uses web_search tool]
       "According to the latest data, Tesla (TSLA) is
        trading at $242.50, up 3.2% today."
```

#### **B. Twitter/X Search (xAI only)**

```typescript
Agent config:
{
  modelId: "grok-4",
  modelConfiguration: {
    twitterSearch: { enabled: true }
  }
}

User: "What are people saying about the new iPhone?"

Agent: [Uses twitter_search tool]
       "Based on recent tweets, people are excited about:
        - New camera system (87% positive mentions)
        - Battery life improvements (76% positive)
        - Price concerns (45% negative)

        Top trending hashtag: #iPhone16Pro"
```

#### **C. Extended Thinking (Claude Opus/Sonnet)**

```typescript
Agent config:
{
  modelId: "claude-opus-4",
  reasoningBudgetTokens: 12000
}

User: "Analyze sales performance across all regions and
       suggest optimization strategies"

Agent response includes thinking process:

<thinking>
Let me break this down:
1. Need to query opportunities by region
2. Calculate conversion rates
3. Compare metrics
4. Identify patterns
5. Develop actionable recommendations

Starting analysis...
</thinking>

Based on comprehensive analysis of 1,247 opportunities:

**Regional Performance:**
- West: 34% conversion, $2.1M ARR
- East: 28% conversion, $1.8M ARR
- Central: 22% conversion, $1.2M ARR

**Recommendations:**
1. Central region needs more sales training...
2. West region best practices should be...
3. Consider reallocating resources to...
```

---

### **8. Structured Output**

Agent có thể return JSON theo schema:

```typescript
Agent config:
{
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "lead_qualification",
      schema: {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          budget: { type: "string", enum: ["<10K", "10K-50K", "50K-100K", ">100K"] },
          authority: { type: "boolean" },
          need: { type: "string" },
          timeline: { type: "string" },
          recommendation: { type: "string" }
        },
        required: ["score", "budget", "authority", "need", "timeline", "recommendation"]
      }
    }
  }
}

User: "Qualify this lead: ABC Corp wants CRM solution,
       decision maker is CFO, budget $75K, needs it in Q1"

Agent returns JSON:
{
  "score": 85,
  "budget": "50K-100K",
  "authority": true,
  "need": "CRM solution replacement",
  "timeline": "Q1 2025",
  "recommendation": "High priority lead. Schedule demo with CFO this week. Highlight ROI calculator and Q1 onboarding timeline."
}
```

---

## 🔒 **Security & Permissions**

### **Permission Levels:**

```typescript
┌─────────────────────────────────────────────────────────┐
│ User Role: Sales Rep                                    │
├─────────────────────────────────────────────────────────┤
│ Company:                                                 │
│   ✓ READ    → find_company, find_one_company           │
│   ✓ CREATE  → create_company                            │
│   ✓ UPDATE  → update_company                            │
│   ✗ DELETE  → [NOT AVAILABLE]                           │
│                                                           │
│ Opportunity:                                             │
│   ✓ READ    → find_opportunity, find_one_opportunity   │
│   ✓ CREATE  → create_opportunity                        │
│   ✓ UPDATE  → update_opportunity (own records only)    │
│   ✗ DELETE  → [NOT AVAILABLE]                           │
│                                                           │
│ Person:                                                  │
│   ✓ READ    → find_person, find_one_person             │
│   ✓ CREATE  → create_person                             │
│   ✓ UPDATE  → update_person                             │
│   ✗ DELETE  → [NOT AVAILABLE]                           │
└─────────────────────────────────────────────────────────┘

Agent automatically filters tools based on permissions.
```

---

## 📊 **Usage Tracking & Billing**

```typescript
Every agent conversation tracked:

{
  threadId: "thread-123",
  agentId: "data-manipulator",
  modelId: "gpt-4o",
  inputTokens: 1250,
  outputTokens: 340,
  toolCalls: 2,
  cost: {
    inputCost: 0.003125,   // 1250 tokens × $0.0025/1k
    outputCost: 0.0034,     // 340 tokens × $0.010/1k
    totalCost: 0.006525     // $0.0065 total
  },
  executionTime: 2340,      // 2.34 seconds
  createdAt: "2025-11-13T10:30:45.000Z"
}

→ Workspace dashboard shows:
  - Total tokens used this month
  - Cost breakdown by model
  - Most used agents
  - Tool execution stats
```

---

## 🎓 **Summary: AI Agent Capabilities**

| Tính Năng | Hỗ Trợ | Chi Tiết |
|-----------|--------|----------|
| **Database CRUD** | ✅ | 174 auto-generated tools cho 29 standard objects |
| **Multi-step Operations** | ✅ | Chain up to 10 tool calls |
| **Natural Language Search** | ✅ | Convert queries sang filters |
| **Permission Aware** | ✅ | Respect user permissions |
| **Context Aware** | ✅ | Know current page/record |
| **Multi-Agent Handoffs** | ✅ | Agent-to-agent collaboration |
| **Web Search** | ✅ | OpenAI, Anthropic, xAI |
| **Twitter Search** | ✅ | xAI only |
| **Extended Thinking** | ✅ | Claude Opus/Sonnet |
| **Structured Output** | ✅ | JSON schema validation |
| **Streaming Responses** | ✅ | Real-time chat UX |
| **Custom Agents** | ✅ | User-defined prompts/config |
| **Workflow Integration** | ✅ | Trigger agents from workflows |
| **Usage Tracking** | ✅ | Tokens, costs, performance |
| **Multi-Provider** | ✅ | OpenAI, Anthropic, xAI, custom |

---

## 🚀 **Để Bắt Đầu:**

```bash
# 1. Test getvoila API compatibility
./test-getvoila-api.sh https://api.getvoila.ai/v1 YOUR_KEY gpt-4o-mini

# 2. Setup (interactive)
./setup-ai-agent.sh

# 3. Start server
yarn start

# 4. Access in browser
http://localhost:3000/settings/ai

# 5. Chat với agents!
```

---

**Có câu hỏi nào khác không?** 🤖
