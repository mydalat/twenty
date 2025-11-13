# 🤖 Claude (Anthropic) Setup cho Twenty CRM

**Hướng dẫn chi tiết cấu hình AI Agent với Claude models**

---

## 🎯 **TÓM TẮT NHANH**

### **Config Chính Xác:**

```bash
# File: packages/twenty-server/.env

# API Key (Required)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Models (Recommended)
DEFAULT_AI_SPEED_MODEL_ID=claude-3-5-haiku-20241022
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514
```

### **3 Bước Setup:**

```bash
# 1. Test config
./test-claude-setup.sh

# 2. Start server
yarn start

# 3. Access UI
http://localhost:3000/settings/ai
```

---

## 📋 **CLAUDE MODELS - ĐẦY ĐỦ**

### **Model IDs Chính Xác:**

```bash
# Haiku 3.5 - Fast & Cheap
claude-3-5-haiku-20241022

# Sonnet 4 - Balanced (RECOMMENDED)
claude-sonnet-4-20250514

# Opus 4 - Most Powerful
claude-opus-4-20250514
```

---

## 📊 **SO SÁNH CHI TIẾT**

| Model | Speed | Cost | Thinking | Context | Best For |
|-------|-------|------|----------|---------|----------|
| **Haiku 3.5** | ⚡️⚡️⚡️⚡️⚡️ | 💰 | ❌ | 200K | Simple queries |
| **Sonnet 4** | ⚡️⚡️⚡️⚡️ | 💰💰💰 | ✅ | 200K | General tasks ⭐ |
| **Opus 4** | ⚡️⚡️⚡️ | 💰💰💰💰💰 | ✅ | 200K | Complex analysis |

---

## 💰 **PRICING (per 1M tokens)**

```
Haiku 3.5:
  Input:  $0.08
  Output: $0.40

Sonnet 4:
  Input:  $0.30
  Output: $1.50

Opus 4:
  Input:  $1.50
  Output: $7.50
```

**Extended Thinking:** +$0.018 (Sonnet) or +$0.09 (Opus) per query

---

## ⚙️ **CẤU HÌNH CỤ THỂ**

### **Option 1: Pure Claude (Chỉ dùng Anthropic)**

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
DEFAULT_AI_SPEED_MODEL_ID=claude-3-5-haiku-20241022
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514
```

**Kết quả:**
- 3 Claude models available
- Fast queries → Haiku
- Complex queries → Sonnet
- Opus available for manual selection

---

### **Option 2: Claude + OpenAI (Best Mix)**

```bash
# .env
# Anthropic for thinking
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# OpenAI for function calling
OPENAI_API_KEY=sk-proj-xxx

# Defaults
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514
```

**Kết quả:**
- Fast → GPT-4o-mini ($0.015/$0.06)
- Complex → Claude Sonnet 4 (thinking)
- 6+ models trong dropdown

---

### **Option 3: All Providers (Max Flexibility)**

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
OPENAI_COMPATIBLE_BASE_URL=https://api.voila.com/v1
OPENAI_COMPATIBLE_API_KEY=voila-xxx
OPENAI_COMPATIBLE_MODEL_NAMES=custom-1,custom-2

DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514
```

**Kết quả:**
- 10+ models available
- Choose best for each task
- Maximum control

---

## 🚀 **SETUP STEPS CHI TIẾT**

### **Step 1: Lấy Anthropic API Key**

1. Truy cập: https://console.anthropic.com
2. Sign up / Login
3. Go to: API Keys
4. Click: "Create Key"
5. Copy key (format: `sk-ant-api03-...`)

---

### **Step 2: Edit .env File**

```bash
cd /home/user/twenty
nano packages/twenty-server/.env
```

**Add these lines:**

```bash
# ============================================
# CLAUDE (ANTHROPIC) CONFIGURATION
# ============================================

ANTHROPIC_API_KEY=sk-ant-api03-paste-your-key-here

DEFAULT_AI_SPEED_MODEL_ID=claude-3-5-haiku-20241022
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514

# ============================================
# OPTIONAL: Other providers
# ============================================
# OPENAI_API_KEY=sk-proj-...
# XAI_API_KEY=xai-...
```

**Save:** Ctrl+X → Y → Enter

---

### **Step 3: Verify Config**

```bash
./test-claude-setup.sh
```

**Expected output:**

```
🧪 Testing Claude (Anthropic) Configuration...

📋 Checking environment variables...

✅ ANTHROPIC_API_KEY: Set (sk-ant-api03...xxxx)
✅ DEFAULT_AI_SPEED_MODEL_ID: claude-3-5-haiku-20241022
✅ DEFAULT_AI_PERFORMANCE_MODEL_ID: claude-sonnet-4-20250514

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Testing Anthropic API...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Testing with model: claude-3-5-haiku-20241022

✅ API test successful!

Response:
Hello! I'm Claude, an AI assistant created by Anthropic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Available Claude Models:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. claude-3-5-haiku-20241022    (Fast & cheap)
2. claude-sonnet-4-20250514     (Balanced) ⭐
3. claude-opus-4-20250514       (Most powerful)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup complete!
```

**Nếu thấy ✅ API test successful → Proceed to Step 4**

---

### **Step 4: Start Server**

```bash
cd /home/user/twenty
yarn start
```

**Watch for logs:**

```
[NestApplication] Nest application successfully started
...
[AI] Model Registry Service initializing...
[AI] Registered models from ANTHROPIC:
     - claude-3-5-haiku-20241022
     - claude-sonnet-4-20250514
     - claude-opus-4-20250514
[AI] Default speed model: claude-3-5-haiku-20241022
[AI] Default performance model: claude-sonnet-4-20250514
[AI] ✓ AI Engine ready
...
Server ready at http://localhost:3000
```

**Key line:** `Registered models from ANTHROPIC`

**Nếu KHÔNG thấy dòng này:**
- Check .env file có đúng không
- Check API key valid không
- Xem error logs

---

### **Step 5: Verify trong UI**

1. **Open browser:** http://localhost:3000
2. **Login** to workspace
3. **Go to:** Settings → AI (http://localhost:3000/settings/ai)

**Check:**
- ✅ Models dropdown có 3 Claude models
- ✅ Agent list hiển thị:
  - Helper Agent
  - Data Navigator
  - Data Manipulator
  - Workflow Builder
- ✅ Có button "Create Agent"

---

### **Step 6: Test Chat**

**Test 1: Simple Query**

1. Click "Data Navigator" agent
2. Send: "Hello, what can you help me with?"

**Expected:**
```
Agent: Hello! I'm the Data Navigator agent. I can help you
explore and search through your CRM data. I have access to
tools for finding companies, people, opportunities, and more.
What would you like to explore?
```

**Test 2: Tool Calling**

Send: "Show me all companies"

**Expected:**
```
Agent: Let me search for companies in your workspace...

[Agent calls find_company tool]
[Database query executes]

Found 5 companies:

1. **Acme Corp**
   • Employees: 50
   • Domain: acme.com

2. **TechStart Inc**
   • Employees: 25
   • Domain: techstart.io

...
```

**Test 3: Extended Thinking (Sonnet/Opus)**

Send: "Analyze our sales pipeline and suggest improvements"

**Expected:**
```
Agent: <thinking>
Let me break down this analysis:
1. Need to query all opportunities
2. Calculate key metrics (win rate, avg deal size)
3. Identify bottlenecks
4. Compare to benchmarks
5. Generate recommendations
Starting analysis...
</thinking>

Based on comprehensive analysis of your sales pipeline:

**Current Metrics:**
- Total opportunities: 127
- Win rate: 28%
- Avg deal size: $45K
- Sales cycle: 42 days

**Bottlenecks Identified:**
1. Long time in "Screening" stage (avg 18 days)
2. Low conversion from "Meeting" to "Proposal" (35%)
3. High drop-off in "Proposal" stage (62% lost)

**Recommendations:**
1. Implement faster screening criteria...
2. Improve demo/meeting quality...
3. Refine proposal templates...
```

---

## 🧠 **EXTENDED THINKING FEATURE**

### **What is it?**

Claude Sonnet 4 và Opus 4 có khả năng "suy nghĩ" trước khi trả lời:

```
User question
    ↓
<thinking>
  Claude internal reasoning
  - Breaking down problem
  - Planning steps
  - Analyzing data
  - Considering alternatives
</thinking>
    ↓
Final response to user
```

### **Configuration:**

File: `/packages/twenty-server/src/engine/metadata-modules/agent/constants/agent-config.const.ts`

```typescript
export const AGENT_CONFIG = {
  REASONING_BUDGET_TOKENS: 12000,  // Max thinking tokens
};
```

### **Cost:**

- **Sonnet 4:** 12,000 tokens × $0.0015 = **$0.018 per query**
- **Opus 4:** 12,000 tokens × $0.0075 = **$0.09 per query**

### **When to use:**

✅ **Use extended thinking for:**
- Complex data analysis
- Strategic planning
- Multi-step reasoning
- Critical decisions

❌ **Don't use for:**
- Simple lookups ("Show company X")
- Quick queries
- High-volume operations

---

## 🎯 **MODEL SELECTION GUIDE**

### **Haiku 3.5 - Use When:**

```
✅ Simple queries
   - "Show me company Acme Corp"
   - "List all people"
   - "What's the status of opportunity X?"

✅ Quick lookups
✅ High-volume operations
✅ Cost-sensitive workloads

❌ Don't use for:
   - Complex analysis
   - Multi-step reasoning
   - Strategic planning
```

---

### **Sonnet 4 - Use When:** ⭐ RECOMMENDED

```
✅ General AI Agent tasks
✅ Data manipulation
   - "Create company X and add person Y as CEO"

✅ Analysis with thinking
   - "Analyze sales pipeline"
   - "Identify top customers"

✅ Workflow automation
   - "Create workflow that..."

✅ Complex queries with multiple steps

This is the sweet spot: powerful + reasonable cost
```

---

### **Opus 4 - Use When:**

```
✅ Critical decisions
✅ Strategic planning
✅ Deep analysis
✅ High-stakes scenarios

Examples:
  - "Should we expand to new market?"
  - "Analyze competitor positioning"
  - "Develop go-to-market strategy"

⚠️  Cost: 5x more expensive than Sonnet
💡 Use only when quality > cost
```

---

## 🔧 **ADVANCED CONFIGURATION**

### **Custom Agent với Specific Model:**

```graphql
mutation {
  createOneAgent(input: {
    name: "strategic_advisor"
    label: "Strategic Advisor"
    description: "High-level strategic analysis"
    prompt: "You are a strategic business advisor with 20 years experience..."

    # Force Opus 4 for this agent
    modelId: "claude-opus-4-20250514"

    # Enable extended thinking
    modelConfiguration: {}
  }) {
    id
  }
}
```

---

### **Agent với Auto Model:**

```graphql
mutation {
  createOneAgent(input: {
    name: "quick_helper"
    label: "Quick Helper"

    # Auto = uses DEFAULT_AI_PERFORMANCE_MODEL_ID
    modelId: "auto"
  }) {
    id
  }
}
```

---

### **Agent với Speed Model:**

```graphql
# Note: No direct way to force speed model
# Workaround: Create agent with Haiku explicitly

mutation {
  createOneAgent(input: {
    name: "fast_lookup"
    label: "Fast Lookup"
    modelId: "claude-3-5-haiku-20241022"  # Force Haiku
  }) {
    id
  }
}
```

---

## 📊 **COST OPTIMIZATION**

### **Strategy 1: Two-Tier System**

```bash
# .env
DEFAULT_AI_SPEED_MODEL_ID=claude-3-5-haiku-20241022  # $0.08/$0.40
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514  # $0.30/$1.50

# Agents set to "auto" use Sonnet
# Create specific agents with Haiku for lookups
```

**Savings:** 73% on simple queries

---

### **Strategy 2: Mix OpenAI + Claude**

```bash
# .env
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini  # $0.015/$0.06 (even cheaper!)
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514  # Thinking
```

**Savings:** 81% on speed tier

---

### **Strategy 3: Context-Based Selection**

```typescript
// Custom logic in agent prompt
"For simple lookups, respond quickly.
For complex analysis, take time to think through the problem."

// Claude will use less thinking tokens for simple queries
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue 1: Models không xuất hiện trong dropdown**

**Nguyên nhân:** API key không được load hoặc sai

**Fix:**
```bash
# Check .env
cat packages/twenty-server/.env | grep ANTHROPIC

# Should see:
# ANTHROPIC_API_KEY=sk-ant-api03-...

# If not there, add it

# Test API manually
./test-claude-setup.sh

# Restart server
yarn start
```

---

### **Issue 2: "Anthropic API key not configured" error**

**Nguyên nhân:** .env không được load

**Fix:**
```bash
# 1. Check file location
ls -la packages/twenty-server/.env

# 2. Check syntax (no spaces around =)
# ✅ Good: ANTHROPIC_API_KEY=sk-ant-...
# ❌ Bad:  ANTHROPIC_API_KEY = sk-ant-...

# 3. Check for quotes (should NOT have quotes)
# ✅ Good: ANTHROPIC_API_KEY=sk-ant-api03-xxx
# ❌ Bad:  ANTHROPIC_API_KEY="sk-ant-api03-xxx"

# 4. Restart server
yarn start
```

---

### **Issue 3: Extended thinking không hoạt động**

**Nguyên nhân:** Đang dùng Haiku (không có thinking)

**Fix:**
```bash
# Check agent config
# Agent modelId should be:
# - "claude-sonnet-4-20250514" ✅
# - "claude-opus-4-20250514" ✅
# - "claude-3-5-haiku-20241022" ❌ (no thinking)

# Update agent to use Sonnet or Opus
```

---

### **Issue 4: High costs**

**Nguyên nhân:** Đang dùng Opus cho mọi query

**Fix:**
```bash
# 1. Check default model
cat packages/twenty-server/.env | grep DEFAULT_AI

# 2. Should be Sonnet, not Opus
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514  ✅
# Not:
# DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-opus-4-20250514  ❌

# 3. Use Opus only for critical queries (manual selection)
```

---

### **Issue 5: API rate limits**

**Nguyên nhân:** Quá nhiều requests

**Fix:**
```bash
# Anthropic rate limits:
# - Haiku: 50,000 tokens/min
# - Sonnet: 40,000 tokens/min
# - Opus: 20,000 tokens/min

# Solutions:
# 1. Add delays between requests
# 2. Use Haiku for high-volume
# 3. Implement request queuing
# 4. Contact Anthropic for higher limits
```

---

## 📚 **COMPARISON: Claude vs OpenAI**

| Feature | Claude (Sonnet 4) | OpenAI (GPT-4o) |
|---------|-------------------|-----------------|
| **Extended Thinking** | ✅ 12K tokens | ❌ No |
| **Function Calling** | ✅ Good | ✅ Excellent |
| **Context Window** | ✅ 200K | ✅ 128K |
| **Streaming** | ✅ Yes | ✅ Yes |
| **Cost** | 💰💰💰 $0.30/$1.50 | 💰💰 $0.25/$1.0 |
| **Speed** | ⚡️⚡️⚡️⚡️ | ⚡️⚡️⚡️⚡️⚡️ |
| **Best For** | Complex reasoning | Function calling |

**Recommendation:** Use both!
- OpenAI for speed & function calling
- Claude for complex analysis & thinking

---

## ✅ **CHECKLIST**

Setup completed when you can check all these:

- [ ] ANTHROPIC_API_KEY set in .env
- [ ] DEFAULT_AI_SPEED_MODEL_ID configured
- [ ] DEFAULT_AI_PERFORMANCE_MODEL_ID configured
- [ ] ./test-claude-setup.sh shows ✅ API test successful
- [ ] Server starts without errors
- [ ] Logs show "Registered models from ANTHROPIC"
- [ ] UI Settings → AI shows 3 Claude models
- [ ] Can chat with agents
- [ ] Agent calls tools successfully
- [ ] Extended thinking works (Sonnet/Opus)

---

## 🎯 **RECOMMENDED SETUP**

**For most users:**

```bash
# .env
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-openai-key-here

DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=claude-sonnet-4-20250514
```

**Why:**
- Fast queries → GPT-4o-mini (cheapest, fastest)
- Complex queries → Claude Sonnet 4 (thinking)
- Best of both worlds
- Flexible per task

**Cost:** ~$0.10 per 1000 queries (mixed workload)

---

## 📖 **RESOURCES**

- Anthropic Console: https://console.anthropic.com
- Claude API Docs: https://docs.anthropic.com
- Twenty AI Docs: `AI-AGENT-HOW-IT-WORKS.md`
- Test script: `./test-claude-setup.sh`
- Full setup: `ENABLE-AI-AGENT.md`

---

**Setup hoàn tất! 🎉**

Bạn đã có Claude AI Agents hoạt động với Twenty CRM.

Next steps:
1. ✅ Test chat với agents
2. ✅ Create custom agents
3. ✅ Monitor costs
4. ✅ Optimize model selection

🤖 Happy AI Agent building with Claude!
