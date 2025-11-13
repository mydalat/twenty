# 🤖 AI Agent Setup for Twenty CRM

Complete guide and tools for enabling AI Agents with custom getvoila API.

---

## 📦 **Files Included**

| File | Purpose |
|------|---------|
| **ENABLE-AI-AGENT.md** | Complete documentation (7 setup methods, troubleshooting) |
| **.env.ai-agent** | Example environment configuration for all providers |
| **setup-ai-agent.sh** | Interactive setup script (fastest way to configure) |
| **test-getvoila-api.sh** | Test getvoila API compatibility before setup |
| **check-ai-agent-status.sh** | Check current AI Agent status and configuration |
| **AI-AGENT-README.md** | This file - quick start guide |

---

## ⚡ **Quick Start (5 minutes)**

### **Step 1: Test your getvoila API** (Optional but recommended)

```bash
./test-getvoila-api.sh https://api.getvoila.ai/v1 your-api-key gpt-4o-mini
```

This will verify:
- ✅ Basic chat completion
- ✅ Streaming responses
- ✅ Function calling / Tools support (REQUIRED for AI Agents)

### **Step 2: Run setup script**

```bash
./setup-ai-agent.sh
```

Choose option 1 (getvoila) and follow prompts:
- Enter API endpoint (e.g., `https://api.getvoila.ai/v1`)
- Enter API key
- Enter available models (e.g., `gpt-4o,gpt-4o-mini`)
- Choose default models

### **Step 3: Start server**

```bash
yarn start
```

Watch for log messages:
```
[AI] Registered models: gpt-4o, gpt-4o-mini, ...
[AI] Default speed model: gpt-4o-mini
[AI] Default performance model: gpt-4o
```

### **Step 4: Access AI Agents**

Open browser:
```
http://localhost:3000/settings/ai
```

You should see:
- List of available agents (Helper, Data Navigator, etc.)
- AI models dropdown with your getvoila models
- Option to create custom agents

### **Step 5: Test chat with agent**

Click on any agent → Start chatting!

---

## 🎯 **Manual Setup** (Alternative)

If you prefer manual configuration:

### **1. Edit .env file**

```bash
cd packages/twenty-server
nano .env
```

Add:

```bash
# getvoila API
OPENAI_COMPATIBLE_BASE_URL=https://api.getvoila.ai/v1
OPENAI_COMPATIBLE_API_KEY=your_api_key_here
OPENAI_COMPATIBLE_MODEL_NAMES=gpt-4o,gpt-4o-mini,gpt-4-turbo

# Default models
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4o
```

### **2. Restart server**

```bash
yarn start
```

---

## 🔍 **Verify Setup**

Check if AI Agent is working:

```bash
./check-ai-agent-status.sh
```

This will show:
- ✅ Configured providers
- ✅ Server status
- ✅ Available models
- ✅ Registered agents

---

## 📚 **What You Get**

### **Standard Agents (Pre-configured)**

1. **Helper Agent**
   - Documentation and help
   - Searches Twenty docs
   - Model: `auto` (uses default performance model)

2. **Data Navigator**
   - Explore and search data
   - Read-only operations
   - Model: `auto`

3. **Data Manipulator**
   - CRUD operations on records
   - Create, update, delete companies, people, etc.
   - Model: `auto`

4. **Workflow Builder**
   - Create and manage workflows
   - Workflow automation
   - Model: `auto`

### **Agent Capabilities**

Each agent can:
- ✅ **Query database** - Search and read records
- ✅ **Modify data** - Create, update, delete records (if permitted)
- ✅ **Run workflows** - Trigger automations
- ✅ **Hand off to other agents** - Multi-agent collaboration
- ✅ **Stream responses** - Real-time chat experience

### **Custom Agent Creation**

You can create custom agents with:
- Custom system prompts
- Specific model selection
- Custom response formats (JSON schema)
- Limited tool access (permissions)

---

## 🛠️ **Troubleshooting**

### **Problem: AI Agents not showing in UI**

**Solution:**
```bash
# Check if AI is enabled
./check-ai-agent-status.sh

# Check feature flag in database
psql -d twenty_db -c "SELECT * FROM core.\"featureFlag\" WHERE key = 'IS_AI_ENABLED';"

# Feature flag should be auto-enabled in dev mode
# If not, restart server
```

### **Problem: "No AI models available"**

**Solution:**
```bash
# Check .env configuration
cat packages/twenty-server/.env | grep -E "OPENAI|AI_MODEL"

# Verify syntax (no spaces around =)
# ✅ Good: OPENAI_COMPATIBLE_API_KEY=abc123
# ❌ Bad:  OPENAI_COMPATIBLE_API_KEY = abc123

# Restart server
yarn start
```

### **Problem: API calls failing**

**Solution:**
```bash
# Test API directly
./test-getvoila-api.sh https://api.getvoila.ai/v1 your-key gpt-4o-mini

# Check if tool calling is supported
# AI Agents REQUIRE function calling support

# If not supported, you need:
# - Contact getvoila to enable function calling
# - Or create a wrapper/proxy
# - Or use different provider
```

### **Problem: Agent not calling tools/functions**

**Causes:**
- getvoila API doesn't support function calling
- Model doesn't support tools
- Permission issues

**Solution:**
```bash
# Verify in test results
./test-getvoila-api.sh ...

# Look for:
# ✅ Tool calling is supported!

# If not supported, AI Agents cannot interact with database
```

### **Problem: Models not appearing in dropdown**

**Solution:**
```bash
# Check model names syntax
# Must be comma-separated, no quotes
OPENAI_COMPATIBLE_MODEL_NAMES=model1,model2,model3

# ❌ Wrong: OPENAI_COMPATIBLE_MODEL_NAMES="model1, model2"
# ✅ Right: OPENAI_COMPATIBLE_MODEL_NAMES=model1,model2

# Restart server after fixing
```

---

## 🎓 **Advanced Topics**

### **Using Multiple Providers**

You can configure multiple providers simultaneously:

```bash
# .env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_COMPATIBLE_BASE_URL=https://api.getvoila.ai/v1
OPENAI_COMPATIBLE_API_KEY=your-key
OPENAI_COMPATIBLE_MODEL_NAMES=custom-1,custom-2
```

All models from all providers will be available in the dropdown.

### **Model Selection Strategy**

```bash
# Fast, cheap models for lightweight tasks
DEFAULT_AI_SPEED_MODEL_ID=gpt-4o-mini

# Smart, powerful models for complex reasoning
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4o
```

Agents set to `modelId: "auto"` will use the performance model.

### **Creating Custom Agents**

Via GraphQL:

```graphql
mutation {
  createOneAgent(input: {
    name: "my_custom_agent"
    label: "My Custom Agent"
    description: "Does custom things"
    icon: "IconRobot"
    prompt: "You are a helpful assistant that..."
    modelId: "gpt-4o"
  }) {
    id
  }
}
```

### **Agent Handoffs (Multi-Agent)**

Agents can consult other agents:

```graphql
mutation {
  createAgentHandoff(input: {
    sourceAgentId: "agent-1-id"
    targetAgentId: "agent-2-id"
  }) {
    id
  }
}
```

Then Agent 1 can say: "Let me ask the Data Navigator about this..."

---

## 🔒 **Security Notes**

- ✅ API keys are stored in `.env` (gitignored)
- ✅ All API calls require authentication
- ✅ Agents respect workspace permissions
- ✅ Users can only access their own workspace agents
- ✅ Tool execution is permission-checked

**Never commit API keys to git!**

---

## 📊 **Cost Management**

### **Token Usage Tracking**

Twenty tracks usage for billing:
- Input tokens
- Output tokens
- Model costs (configurable)

### **Cost Optimization Tips**

1. Use `DEFAULT_AI_SPEED_MODEL_ID` for simple tasks
2. Reserve expensive models for complex reasoning
3. Set shorter `max_tokens` limits
4. Use streaming to allow early termination

---

## 🔗 **API Reference**

### **GraphQL Endpoints**

```
http://localhost:3000/metadata
```

**Queries:**
- `findManyAgents` - List agents
- `chatThreads` - List chat threads
- `chatMessages(threadId)` - Get messages
- `availableAIModels` - List models

**Mutations:**
- `createOneAgent` - Create agent
- `createChatThread` - Start chat
- `createAgentHandoff` - Setup collaboration

### **REST Endpoint**

```
POST http://localhost:3000/rest/agent-chat/stream
```

For streaming chat responses (Server-Sent Events).

---

## 📖 **Full Documentation**

For comprehensive details, see:
- **ENABLE-AI-AGENT.md** - Complete guide with 7 setup methods
- **.env.ai-agent** - All configuration options explained

---

## 🤝 **Support**

If you encounter issues:

1. **Run diagnostics:**
   ```bash
   ./check-ai-agent-status.sh
   ```

2. **Test API compatibility:**
   ```bash
   ./test-getvoila-api.sh <url> <key> <model>
   ```

3. **Check server logs:**
   ```bash
   yarn start
   # Look for [AI] messages
   ```

4. **Common fixes:**
   - Restart server
   - Check .env syntax
   - Verify API key
   - Test API endpoint separately

---

## 🎉 **Success Checklist**

- [ ] getvoila API tested and compatible
- [ ] `.env` configured with API credentials
- [ ] Server started successfully
- [ ] AI models appear in logs
- [ ] Settings → AI page accessible
- [ ] Agents listed in UI
- [ ] Can chat with agents
- [ ] Agents can call tools/functions

---

## 🚀 **Next Steps**

After setup:

1. **Explore standard agents**
   - Chat with Helper, Data Navigator, etc.

2. **Create custom agents**
   - Specialized for your use case
   - Custom prompts and tools

3. **Setup agent handoffs**
   - Multi-agent collaboration
   - Specialized expertise routing

4. **Integrate with workflows**
   - Trigger agents from workflows
   - Automate with AI

5. **Monitor usage**
   - Track token consumption
   - Optimize costs

---

**Created by:** Claude Code
**Version:** 1.0
**Date:** 2025-11-13

🤖 Happy AI Agent building!
