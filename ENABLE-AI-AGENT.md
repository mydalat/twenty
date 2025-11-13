# 🤖 Enable AI Agent trong Twenty CRM

Hướng dẫn chi tiết để enable và custom AI Agent sử dụng getvoila API.

---

## 📋 **Tổng Quan AI Agent**

Twenty CRM có tích hợp AI Agent với các tính năng:

✅ **Multi-Provider Support:**
- OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo)
- Anthropic (Claude Opus 4, Sonnet 4, Haiku 3.5)
- xAI (Grok-3, Grok-4, Grok-mini)
- **OpenAI-Compatible** (Ollama, LM Studio, vLLM, **getvoila**, etc.)

✅ **Agent Capabilities:**
- Tự động tạo tools từ database schema
- Multi-agent collaboration (handoffs)
- Workflow automation
- Web search & Twitter search (xAI models)
- Streaming responses

✅ **Standard Agents:**
- Helper Agent - Documentation & help
- Data Navigator - Data exploration
- Data Manipulator - CRUD operations
- Workflow Builder - Workflow creation

---

## 🚀 **Cách 1: Enable AI Agent với getvoila API** ⭐ (Khuyên dùng cho bạn)

### **Step 1: Chuẩn bị getvoila API credentials**

Truy cập: https://getvoila.ai (hoặc dashboard của bạn) và lấy:
- API Key
- API Endpoint URL (VD: `https://api.getvoila.ai/v1` hoặc custom endpoint)
- Model names available (VD: `gpt-4o`, `gpt-4o-mini`, `claude-3.5-sonnet`)

### **Step 2: Configure Environment Variables**

Thêm vào file `.env` của Twenty:

```bash
# ============================================
# AI AGENT CONFIGURATION - getvoila
# ============================================

# Enable AI feature
# (Đây là feature flag - phải có để enable AI)
# Không cần set trong .env vì tự động enable trong dev mode

# getvoila API Configuration (OpenAI-Compatible)
OPENAI_COMPATIBLE_BASE_URL=https://api.getvoila.ai/v1
OPENAI_COMPATIBLE_API_KEY=your_getvoila_api_key_here
OPENAI_COMPATIBLE_MODEL_NAMES=gpt-4o,gpt-4o-mini,gpt-4-turbo,claude-3.5-sonnet

# Default Models (chọn model mặc định từ getvoila)
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4o

# ============================================
# OPTIONAL: Fallback to original OpenAI/Anthropic
# (Nếu getvoila không available)
# ============================================
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### **Step 3: Restart Server**

```bash
# Stop server nếu đang chạy (Ctrl+C)

# Clear cache (optional nhưng recommended)
rm -rf node_modules/.cache
rm -rf packages/twenty-server/dist

# Restart
yarn start
```

### **Step 4: Verify AI Agent đã enable**

```bash
# Check logs khi server start
# Phải thấy dòng tương tự:
# [AI] Registered models: gpt-4o, gpt-4o-mini, gpt-4-turbo, claude-3.5-sonnet
# [AI] Default speed model: gpt-4o-mini
# [AI] Default performance model: gpt-4o
```

### **Step 5: Access AI Agent trong UI**

1. Login vào Twenty workspace
2. Vào **Settings → AI**
3. Sẽ thấy danh sách agents và models available
4. Click vào agent để chat hoặc configure

---

## 🚀 **Cách 2: Enable AI Agent với OpenAI trực tiếp**

Nếu muốn dùng OpenAI API trực tiếp thay vì getvoila:

```bash
# .env
OPENAI_API_KEY=sk-proj-your-openai-api-key
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4o
```

---

## 🚀 **Cách 3: Dùng nhiều providers cùng lúc**

Có thể config nhiều providers và chọn model khi dùng:

```bash
# .env
# OpenAI models
OPENAI_API_KEY=sk-proj-...

# Anthropic models
ANTHROPIC_API_KEY=sk-ant-...

# getvoila models (custom)
OPENAI_COMPATIBLE_BASE_URL=https://api.getvoila.ai/v1
OPENAI_COMPATIBLE_API_KEY=your_getvoila_key
OPENAI_COMPATIBLE_MODEL_NAMES=custom-model-1,custom-model-2

# Defaults
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=custom-model-1
```

---

## 🎯 **getvoila API Requirements**

Để getvoila API hoạt động với Twenty, endpoint phải tuân thủ **OpenAI API format**:

### **Required Endpoints:**

```
POST /v1/chat/completions
```

### **Request Format:**

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "create_company",
        "description": "Create a new company",
        "parameters": {
          "type": "object",
          "properties": {
            "name": { "type": "string" }
          }
        }
      }
    }
  ]
}
```

### **Response Format (Streaming):**

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":" there"},"index":0}]}

data: [DONE]
```

### **Response Format (Non-streaming):**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

### **Tool Calling Support:**

getvoila API phải support function calling (tools) theo OpenAI format:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "create_company",
              "arguments": "{\"name\": \"Acme Corp\"}"
            }
          }
        ]
      }
    }
  ]
}
```

---

## 🔧 **Troubleshooting**

### **1. AI Agent không xuất hiện trong UI**

**Nguyên nhân:** Feature flag chưa enable

**Giải pháp:**
```bash
# Check database
psql -d twenty_db -c "SELECT * FROM core.\"featureFlag\" WHERE key = 'IS_AI_ENABLED';"

# Enable manually (nếu cần)
psql -d twenty_db -c "INSERT INTO core.\"featureFlag\" (key, value, \"workspaceId\") VALUES ('IS_AI_ENABLED', true, 'YOUR_WORKSPACE_ID');"
```

### **2. Error: "No AI models available"**

**Nguyên nhân:** Environment variables chưa đúng

**Giải pháp:**
```bash
# Check env variables
cd packages/twenty-server
node -e "require('dotenv').config(); console.log(process.env.OPENAI_COMPATIBLE_BASE_URL);"

# Verify trong logs khi server start
grep "Registered models" logs/server.log
```

### **3. Error: "Model not found"**

**Nguyên nhân:** Model name không đúng hoặc không có trong OPENAI_COMPATIBLE_MODEL_NAMES

**Giải pháp:**
```bash
# Check model names
echo $OPENAI_COMPATIBLE_MODEL_NAMES

# Update .env
OPENAI_COMPATIBLE_MODEL_NAMES=correct-model-name-1,correct-model-name-2

# Restart server
yarn start
```

### **4. getvoila API returns errors**

**Nguyên nhân:** API endpoint không tuân thủ OpenAI format

**Giải pháp:**

Test API manually:
```bash
curl -X POST https://api.getvoila.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

Expected response phải theo format OpenAI.

### **5. Agent không gọi được tools/functions**

**Nguyên nhân:** getvoila API không support function calling

**Giải pháp:**
- Verify getvoila API có support `tools` parameter
- Check API documentation: https://docs.getvoila.ai (hoặc docs của bạn)
- Nếu không support, có thể cần wrapper middleware

---

## 📊 **Verify Setup**

### **Test via GraphQL:**

```graphql
# 1. Check available models
query {
  availableAIModels {
    modelId
    label
    provider
  }
}

# 2. List agents
query {
  findManyAgents {
    edges {
      node {
        id
        name
        label
        modelId
      }
    }
  }
}

# 3. Test chat
mutation {
  createChatThread {
    id
  }
}
```

### **Test via REST API:**

```bash
# Get API key first: Settings → APIs & Webhooks

# Create chat thread
curl -X POST http://localhost:3000/rest/agent-chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "threadId": null,
    "messages": [
      {
        "role": "user",
        "content": "Hello, can you help me?"
      }
    ]
  }'
```

---

## 🎁 **Bonus: Custom AI Provider Integration**

Nếu getvoila API không hoàn toàn compatible với OpenAI format, bạn có thể tạo wrapper middleware:

### **Option 1: API Gateway/Proxy**

Tạo proxy server chuyển đổi getvoila format → OpenAI format:

```javascript
// proxy-server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.post('/v1/chat/completions', async (req, res) => {
  // Convert OpenAI format → getvoila format
  const getvoilaRequest = convertToGetvoilaFormat(req.body);

  // Call getvoila API
  const response = await axios.post(
    'https://api.getvoila.ai/your-endpoint',
    getvoilaRequest,
    { headers: { 'Authorization': `Bearer ${process.env.GETVOILA_API_KEY}` } }
  );

  // Convert getvoila response → OpenAI format
  const openaiResponse = convertToOpenAIFormat(response.data);

  res.json(openaiResponse);
});

app.listen(8080, () => console.log('Proxy running on port 8080'));
```

Then config Twenty:
```bash
OPENAI_COMPATIBLE_BASE_URL=http://localhost:8080
```

### **Option 2: Modify Twenty Source Code**

Tạo custom provider trong Twenty:

File: `/packages/twenty-server/src/engine/core-modules/ai/services/ai-model-registry.service.ts`

```typescript
private registerGetvoilaModels(): void {
  const getvoilaApiKey = this.twentyConfigService.get('GETVOILA_API_KEY');

  if (!getvoilaApiKey) return;

  // Custom implementation cho getvoila
  const getvoilaProvider = createCustomProvider({
    baseURL: 'https://api.getvoila.ai',
    apiKey: getvoilaApiKey,
    // Custom transform logic
  });

  this.modelRegistry.set('getvoila-gpt4', {
    modelId: 'getvoila-gpt4',
    provider: ModelProvider.GETVOILA,
    model: getvoilaProvider('gpt-4'),
  });
}
```

---

## 📚 **API Endpoints Reference**

### **GraphQL API:**

```
Endpoint: http://localhost:3000/metadata
```

**Queries:**
- `findManyAgents` - List all agents
- `findOneAgent(id)` - Get agent details
- `chatThreads` - List chat threads
- `chatMessages(threadId)` - Get messages

**Mutations:**
- `createOneAgent` - Create new agent
- `updateOneAgent` - Update agent config
- `deleteOneAgent` - Delete agent
- `createChatThread` - Start new chat
- `createAgentHandoff` - Setup agent collaboration

### **REST API:**

```
Endpoint: http://localhost:3000/rest/agent-chat/stream
Method: POST
```

**Request:**
```json
{
  "threadId": "uuid-or-null",
  "messages": [
    { "role": "user", "content": "Your message" }
  ],
  "recordIdsByObjectMetadataNameSingular": {
    "company": ["company-id-1", "company-id-2"]
  }
}
```

**Response:** Server-Sent Events (SSE) stream

---

## 🎯 **Summary**

**Quick Setup cho getvoila:**

1. ✅ Add to `.env`:
   ```bash
   OPENAI_COMPATIBLE_BASE_URL=https://api.getvoila.ai/v1
   OPENAI_COMPATIBLE_API_KEY=your_key
   OPENAI_COMPATIBLE_MODEL_NAMES=gpt-4o,gpt-4o-mini
   DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
   DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4o
   ```

2. ✅ Restart server: `yarn start`

3. ✅ Access: Settings → AI

4. ✅ Test chat với agents

**Lưu ý quan trọng:**
- getvoila API **PHẢI** tuân thủ OpenAI API format
- Phải support **streaming** responses
- Phải support **function calling** (tools) để agents hoạt động đúng
- Nếu không compatible, cần tạo proxy/wrapper

---

## 🔗 **Links hữu ích:**

- Twenty AI Docs: (trong source code - không có public docs)
- OpenAI API Reference: https://platform.openai.com/docs/api-reference
- getvoila Docs: https://docs.getvoila.ai (nếu có)
- AI SDK (Vercel): https://sdk.vercel.ai/docs

---

**Tạo bởi:** Claude Code
**Date:** 2025-11-13
**Version:** 1.0
