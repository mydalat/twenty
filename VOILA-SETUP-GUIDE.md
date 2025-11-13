# 🚀 Voila API Setup Guide for Twenty CRM

**Quick guide để setup voila wrapper ChatGPT API**

---

## ✅ **Scenario 1: Voila API là OpenAI-Compatible** (99% cases)

### **Bước 1: Kiểm tra compatibility**

```bash
./test-getvoila-api.sh https://api.voila.com/v1 YOUR_VOILA_KEY gpt-4
```

**Expected output:**
```
✅ Basic chat completion
✅ Streaming responses
✅ Function calling / Tools

Score: 3/3
🎉 FULLY COMPATIBLE!
```

Nếu thấy output này → **Chỉ cần config .env, KHÔNG cần sửa code!**

---

### **Bước 2: Config .env**

Edit file: `/home/user/twenty/packages/twenty-server/.env`

```bash
# ============================================
# VOILA API CONFIGURATION
# ============================================

# Voila API endpoint (OpenAI-compatible)
OPENAI_COMPATIBLE_BASE_URL=https://api.voila.com/v1

# Your voila API key
OPENAI_COMPATIBLE_API_KEY=voila_sk_xxxxxxxxxxxxx

# Available models from voila
# List all GPT models your voila account has access to
OPENAI_COMPATIBLE_MODEL_NAMES=gpt-4,gpt-4o,gpt-4-turbo,gpt-3.5-turbo

# Default models (choose from above list)
DEFAULT_AI_SPEED_MODEL_ID=gpt-3.5-turbo
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4

# ============================================
# OPTIONAL: Fallback providers
# ============================================
# Uncomment if you want fallback to direct OpenAI

# OPENAI_API_KEY=sk-proj-direct-openai-key-here
```

---

### **Bước 3: Restart server**

```bash
# Stop server if running (Ctrl+C)

# Start server
cd /home/user/twenty
yarn start
```

**Watch for logs:**
```
[AI] Model Registry Service initializing...
[AI] Registered models from OPENAI_COMPATIBLE: gpt-4, gpt-4o, gpt-4-turbo, gpt-3.5-turbo
[AI] Default speed model: gpt-3.5-turbo
[AI] Default performance model: gpt-4
[AI] ✓ AI Engine ready
```

---

### **Bước 4: Verify trong UI**

1. Open browser: `http://localhost:3000`
2. Login to workspace
3. Go to: **Settings → AI**
4. You should see:
   - ✅ List of voila models in dropdown
   - ✅ Standard agents (Helper, Data Navigator, etc.)
   - ✅ Ability to create custom agents

---

### **Bước 5: Test chat**

1. Click on any agent (e.g., "Data Navigator")
2. Send a message: "Show me all companies"
3. Agent should:
   - ✅ Call `find_company` tool
   - ✅ Query database
   - ✅ Return results

**Example conversation:**
```
You: Show me all companies

Agent: Let me search for companies in your workspace...
       [Calls find_company tool]

       Found 5 companies:
       1. Acme Corp - 50 employees
       2. TechStart Inc - 25 employees
       3. ...
```

---

## ❌ **Scenario 2: Voila API KHÔNG OpenAI-Compatible**

Nếu test script cho kết quả:
```
❌ Function calling / Tools

Score: 2/3 or 1/3
⚠️ NOT FULLY COMPATIBLE
```

→ Có 2 options:

---

### **Option A: Tạo Proxy/Wrapper (RECOMMENDED)**

Tạo middleware server convert voila format ↔ OpenAI format:

```javascript
// voila-proxy.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Convert OpenAI request → Voila request
function convertToVoilaFormat(openaiRequest) {
  return {
    // Voila specific format
    prompt: openaiRequest.messages,
    model: openaiRequest.model,
    // ... map other fields
  };
}

// Convert Voila response → OpenAI response
function convertToOpenAIFormat(voilaResponse) {
  return {
    choices: [{
      message: {
        role: "assistant",
        content: voilaResponse.text
      }
    }]
  };
}

app.post('/v1/chat/completions', async (req, res) => {
  try {
    // Convert request
    const voilaRequest = convertToVoilaFormat(req.body);

    // Call voila API
    const response = await axios.post(
      'https://api.voila.com/your-actual-endpoint',
      voilaRequest,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VOILA_API_KEY}`
        }
      }
    );

    // Convert response
    const openaiResponse = convertToOpenAIFormat(response.data);

    res.json(openaiResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8080, () => {
  console.log('Voila proxy running on http://localhost:8080');
});
```

**Run proxy:**
```bash
node voila-proxy.js
```

**Config Twenty to use proxy:**
```bash
# .env
OPENAI_COMPATIBLE_BASE_URL=http://localhost:8080
OPENAI_COMPATIBLE_API_KEY=your_voila_key
OPENAI_COMPATIBLE_MODEL_NAMES=gpt-4,gpt-3.5-turbo
```

---

### **Option B: Sửa Code Twenty (Advanced)**

Nếu muốn tích hợp trực tiếp vào Twenty (không qua proxy):

#### **Files cần sửa:**

**1. Add Voila Provider Enum**

File: `/packages/twenty-server/src/engine/core-modules/ai/constants/ai-models.const.ts`

```typescript
export enum ModelProvider {
  NONE = 'none',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OPENAI_COMPATIBLE = 'open_ai_compatible',
  XAI = 'xai',
  VOILA = 'voila',  // ← ADD THIS
}
```

**2. Add Voila Config Variables**

File: `/packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`

Add around line 1122:

```typescript
@ConfigVariablesMetadata({
  group: ConfigVariablesGroup.LLM,
  isSensitive: true,
  description: 'API key for Voila integration',
  type: ConfigVariableType.STRING,
})
@IsOptional()
VOILA_API_KEY: string;

@ConfigVariablesMetadata({
  group: ConfigVariablesGroup.LLM,
  description: 'Base URL for Voila API',
  type: ConfigVariableType.STRING,
})
@IsOptional()
VOILA_BASE_URL: string;

@ConfigVariablesMetadata({
  group: ConfigVariablesGroup.LLM,
  description: 'Available model names from Voila (comma-separated)',
  type: ConfigVariableType.STRING,
})
@IsOptional()
VOILA_MODEL_NAMES: string;
```

**3. Register Voila Models**

File: `/packages/twenty-server/src/engine/core-modules/ai/services/ai-model-registry.service.ts`

Add method:

```typescript
private buildModelRegistry(): void {
  // ... existing code ...

  // Add voila registration
  const voilaApiKey = this.twentyConfigService.get('VOILA_API_KEY');
  const voilaBaseUrl = this.twentyConfigService.get('VOILA_BASE_URL');

  if (voilaApiKey && voilaBaseUrl) {
    this.registerVoilaModels();
  }
}

private registerVoilaModels(): void {
  const baseUrl = this.twentyConfigService.get('VOILA_BASE_URL');
  const apiKey = this.twentyConfigService.get('VOILA_API_KEY');
  const modelNames = this.twentyConfigService.get('VOILA_MODEL_NAMES');

  // Create custom voila provider
  const voilaProvider = createOpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    // Custom fetch if voila needs special handling
    fetch: async (url, options) => {
      // Transform request if needed
      const transformedOptions = {
        ...options,
        headers: {
          ...options.headers,
          'X-Voila-Custom-Header': 'value', // If voila needs custom headers
        }
      };

      const response = await fetch(url, transformedOptions);

      // Transform response if needed
      return response;
    }
  });

  // Register models
  const models = modelNames.split(',').map(name => name.trim());

  models.forEach((modelId) => {
    this.modelRegistry.set(modelId, {
      modelId,
      provider: ModelProvider.VOILA,
      model: voilaProvider(modelId),
    });
  });
}
```

**4. Add API Key Validation**

Same file, update `validateApiKey` method:

```typescript
async validateApiKey(provider: ModelProvider): Promise<void> {
  let apiKey: string | undefined;

  switch (provider) {
    case ModelProvider.OPENAI:
      apiKey = this.twentyConfigService.get('OPENAI_API_KEY');
      break;
    case ModelProvider.ANTHROPIC:
      apiKey = this.twentyConfigService.get('ANTHROPIC_API_KEY');
      break;
    case ModelProvider.XAI:
      apiKey = this.twentyConfigService.get('XAI_API_KEY');
      break;
    case ModelProvider.OPENAI_COMPATIBLE:
      apiKey = this.twentyConfigService.get('OPENAI_COMPATIBLE_API_KEY');
      break;
    case ModelProvider.VOILA:  // ← ADD THIS
      apiKey = this.twentyConfigService.get('VOILA_API_KEY');
      break;
    default:
      return;
  }

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()} API key not configured`);
  }
}
```

**5. Update .env**

```bash
# Voila Configuration
VOILA_API_KEY=your_voila_key
VOILA_BASE_URL=https://api.voila.com/v1
VOILA_MODEL_NAMES=gpt-4,gpt-4o,gpt-3.5-turbo
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4
```

**6. Rebuild & Restart**

```bash
# Clean build
rm -rf packages/twenty-server/dist
rm -rf node_modules/.cache

# Rebuild
yarn build twenty-server

# Restart
yarn start
```

---

## 📊 **So Sánh 2 Options:**

| Aspect | Option A: Proxy | Option B: Sửa Code |
|--------|-----------------|-------------------|
| **Effort** | 🟢 Low (1-2 hours) | 🔴 High (4-6 hours) |
| **Maintenance** | 🟢 Easy | 🔴 Phức tạp |
| **Flexibility** | 🟢 High | 🟡 Medium |
| **Performance** | 🟡 +1 hop latency | 🟢 Direct |
| **Upgrades** | 🟢 Independent | 🔴 Merge conflicts |
| **Recommended** | ✅ YES | ❌ NO |

**Recommendation:** Dùng **Option A (Proxy)** trừ khi bạn có lý do đặc biệt cần integrate trực tiếp.

---

## 🎯 **Tóm Tắt:**

### **Nếu voila API là OpenAI-compatible:**
```
1. ✅ Không cần sửa code
2. ✅ Chỉ config .env:
   - OPENAI_COMPATIBLE_BASE_URL
   - OPENAI_COMPATIBLE_API_KEY
   - OPENAI_COMPATIBLE_MODEL_NAMES
3. ✅ Restart server
4. ✅ Test trong UI
```

### **Nếu voila API KHÔNG compatible:**
```
Option A (RECOMMENDED):
1. Tạo proxy server (voila-proxy.js)
2. Convert formats
3. Point Twenty to proxy
4. Config .env với proxy URL

Option B (Advanced):
1. Sửa 4-5 files trong Twenty
2. Add custom provider
3. Handle custom format
4. Rebuild & restart
```

---

## 🧪 **Testing Checklist:**

- [ ] Test script cho score 3/3
- [ ] Models xuất hiện trong dropdown
- [ ] Agents list hiển thị
- [ ] Chat với agent thành công
- [ ] Agent gọi tool thành công
- [ ] Tool execution returns data
- [ ] Response streams correctly
- [ ] No errors in console/logs

---

## 🆘 **Troubleshooting:**

### **Issue: Models không xuất hiện**
```bash
# Check .env
cat packages/twenty-server/.env | grep OPENAI_COMPATIBLE

# Check logs
yarn start | grep "Registered models"
```

### **Issue: Agent không gọi tool**
```bash
# Voila API might not support function calling
# → Use Option A (Proxy) to add function calling support
```

### **Issue: Streaming không hoạt động**
```bash
# Check if voila returns SSE format
curl -N -X POST https://api.voila.com/v1/chat/completions \
  -H "Authorization: Bearer KEY" \
  -d '{"model":"gpt-4","messages":[...],"stream":true}'

# Should see: data: {...} lines
```

---

## 📚 **Reference:**

- Full AI Agent docs: `AI-AGENT-HOW-IT-WORKS.md`
- Setup guide: `ENABLE-AI-AGENT.md`
- Test script: `./test-getvoila-api.sh`
- Status check: `./check-ai-agent-status.sh`

---

**Bây giờ bạn có thể setup voila API và sử dụng như các provider khác! 🚀**
