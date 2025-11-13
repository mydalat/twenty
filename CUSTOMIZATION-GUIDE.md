# 🎯 Twenty CRM Customization Guide

**Complete toolkit for customizing and extending Twenty CRM**

Created by: Claude Code
Date: 2025-11-13
Total Files: 12 (116 KB)

---

## 📚 **Tài Liệu & Tools Đã Tạo**

### **🔍 Part 1: GraphQL API (5 files)**

Để tải và phân tích toàn bộ GraphQL schema từ Twenty CRM:

| File | Size | Purpose |
|------|------|---------|
| **📘 DOWNLOAD-GRAPHQL-SCHEMA.md** | 8.8K | Complete guide: 7 methods to download schema |
| **🔧 download-schema-simple.js** | 4.4K | Node.js script (works on all platforms) |
| **🔧 download-graphql-schema.sh** | 2.2K | Bash script (Linux/Mac) |
| **📄 introspection-query.graphql** | 1.3K | Full GraphQL introspection query |
| **📊 analyze-schema.js** | 6.7K | Analyze and generate schema statistics |

**Quick Start:**
```bash
# Download schema
node download-schema-simple.js

# Analyze
node analyze-schema.js schema-core.json

# Result: schema-core.json, schema-metadata.json
```

---

### **🤖 Part 2: AI Agent Setup (7 files)**

Để enable và customize AI Agents với getvoila API:

| File | Size | Purpose |
|------|------|---------|
| **📘 AI-AGENT-README.md** | 9.1K | Quick start guide & overview |
| **📘 ENABLE-AI-AGENT.md** | 12K | Complete setup (7 methods, troubleshooting) |
| **📘 AI-AGENT-HOW-IT-WORKS.md** | 42K | **Visual workflow & architecture** |
| **⚙️ .env.ai-agent** | 3.4K | Example configuration for all providers |
| **🔧 setup-ai-agent.sh** | 6.8K | Interactive setup wizard |
| **🧪 test-getvoila-api.sh** | 9.2K | API compatibility testing |
| **🔍 check-ai-agent-status.sh** | 7.9K | Diagnose AI Agent configuration |

**Quick Start:**
```bash
# 1. Test API (optional)
./test-getvoila-api.sh https://api.getvoila.ai/v1 YOUR_KEY

# 2. Setup
./setup-ai-agent.sh

# 3. Verify
./check-ai-agent-status.sh

# 4. Start server
yarn start

# 5. Access UI
http://localhost:3000/settings/ai
```

---

## 🎯 **Use Cases & Workflows**

### **Use Case 1: Tìm Hiểu GraphQL API**

**Goal:** Muốn biết Twenty có những API gì, objects nào, fields gì

**Solution:**
```bash
# Step 1: Start server
yarn start

# Step 2: Download schema
node download-schema-simple.js

# Step 3: Analyze
node analyze-schema.js schema-core.json

# Output:
# - List all objects (Companies, People, etc.)
# - List all queries and mutations
# - Field details for each object
# - Enums and scalars
```

**Read:** `DOWNLOAD-GRAPHQL-SCHEMA.md`

---

### **Use Case 2: Enable AI Agent với getvoila**

**Goal:** Muốn dùng custom GPT API (getvoila) thay vì OpenAI trực tiếp

**Solution:**
```bash
# Step 1: Test API compatibility
./test-getvoila-api.sh https://api.getvoila.ai/v1 YOUR_KEY gpt-4o

# Output sẽ check:
# ✅ Basic chat completion
# ✅ Streaming responses
# ✅ Function calling (REQUIRED!)

# Step 2: If compatible, run setup
./setup-ai-agent.sh
# → Choose option 1 (getvoila)
# → Enter API URL, key, models

# Step 3: Start server
yarn start
# → Watch for: [AI] Registered models: ...

# Step 4: Access UI
# → Settings → AI
# → Chat with agents
```

**Read:** `AI-AGENT-README.md` (quick start) or `ENABLE-AI-AGENT.md` (detailed)

---

### **Use Case 3: Hiểu Cách AI Agent Hoạt Động**

**Goal:** Muốn hiểu kiến trúc, workflow, và tính năng của AI Agents

**Solution:**

**Read:** `AI-AGENT-HOW-IT-WORKS.md`

Contains:
- ✅ Architecture diagram
- ✅ Complete flow from user message → database → LLM → response (11 steps)
- ✅ Real example with code snippets
- ✅ Tool generation system
- ✅ Permission system
- ✅ Multi-agent collaboration
- ✅ All 8 advanced features explained

---

### **Use Case 4: Troubleshoot AI Agent Issues**

**Goal:** AI Agent không hoạt động, cần debug

**Solution:**
```bash
# Run diagnostic tool
./check-ai-agent-status.sh

# Will check:
# ✅ Environment variables
# ✅ Server status
# ✅ Available models
# ✅ Registered agents
# ✅ Feature flags
# ✅ Recent logs

# Common fixes provided automatically
```

**Read:** `ENABLE-AI-AGENT.md` → Troubleshooting section

---

### **Use Case 5: Tích Hợp API vào External App**

**Goal:** Muốn gọi Twenty API từ external application

**Solution:**
```bash
# Step 1: Download schema để biết available APIs
node download-schema-simple.js

# Step 2: Convert to OpenAPI format (nếu cần REST)
# Schema đã có trong /rest/open-api/core

# Step 3: Import vào Postman/Insomnia
# File: schema-core.json

# Step 4: Generate client code
npx @graphql-codegen/cli \
  --schema schema-core.json \
  --generates types.ts
```

**Read:** `DOWNLOAD-GRAPHQL-SCHEMA.md` → Section "Integration Examples"

---

### **Use Case 6: Custom Agent cho Business Logic**

**Goal:** Tạo custom agent với specialized prompt và tools

**Solution:**

1. **Via UI:**
   - Settings → AI → Create Agent
   - Set custom prompt, model, tools

2. **Via GraphQL:**
   ```graphql
   mutation {
     createOneAgent(input: {
       name: "sales_assistant"
       label: "Sales Assistant"
       description: "B2B sales qualification"
       prompt: "You are a B2B sales expert..."
       modelId: "gpt-4o"
       responseFormat: { ... }
     }) {
       id
     }
   }
   ```

**Read:** `AI-AGENT-HOW-IT-WORKS.md` → Section "Custom Agents"

---

## 📖 **Documentation Map**

### **Quick Reference:**

```
Need to...                           → Read this file
────────────────────────────────────────────────────────────────
Download GraphQL schema              → DOWNLOAD-GRAPHQL-SCHEMA.md
Understand GraphQL structure         → analyze-schema.js output
Enable AI Agents (quick)             → AI-AGENT-README.md
Enable AI Agents (detailed)          → ENABLE-AI-AGENT.md
Understand AI Agent workflow         → AI-AGENT-HOW-IT-WORKS.md
Configure environment variables      → .env.ai-agent
Test getvoila API compatibility      → ./test-getvoila-api.sh
Setup AI Agent interactively         → ./setup-ai-agent.sh
Troubleshoot AI issues               → ./check-ai-agent-status.sh
```

---

## 🛠️ **Tools Reference**

### **Scripts Cheat Sheet:**

```bash
# ═══════════════════════════════════════════════════════════
# GraphQL Schema Tools
# ═══════════════════════════════════════════════════════════

# Download schema (Node.js - all platforms)
node download-schema-simple.js [API_KEY] [BASE_URL]

# Download schema (Bash - Linux/Mac)
./download-graphql-schema.sh [API_KEY] [BASE_URL]

# Analyze schema
node analyze-schema.js schema-core.json

# ═══════════════════════════════════════════════════════════
# AI Agent Tools
# ═══════════════════════════════════════════════════════════

# Test API compatibility
./test-getvoila-api.sh <api_url> <api_key> [model_name]

# Interactive setup
./setup-ai-agent.sh

# Check status
./check-ai-agent-status.sh

# ═══════════════════════════════════════════════════════════
# Twenty Development
# ═══════════════════════════════════════════════════════════

# Start full stack
yarn start

# Start individual services
npx nx start twenty-front       # Frontend
npx nx start twenty-server      # Backend
npx nx run twenty-server:worker # Background jobs

# Generate GraphQL types
npx nx run twenty-front:graphql:generate

# Database operations
npx nx database:reset twenty-server
npx nx run twenty-server:command workspace:sync-metadata

# Lint & format
npx nx lint twenty-front --fix
npx nx fmt twenty-front
```

---

## 🎓 **Learning Path**

### **For Beginners:**

1. ✅ Read `AI-AGENT-README.md` (10 min)
2. ✅ Run `./setup-ai-agent.sh` (5 min)
3. ✅ Start server and explore UI (15 min)
4. ✅ Chat with standard agents (10 min)

**Total:** 40 minutes to get AI Agents working

### **For Developers:**

1. ✅ Read `DOWNLOAD-GRAPHQL-SCHEMA.md` (15 min)
2. ✅ Download and analyze schema (10 min)
3. ✅ Read `AI-AGENT-HOW-IT-WORKS.md` (30 min)
4. ✅ Read `ENABLE-AI-AGENT.md` (20 min)
5. ✅ Setup custom provider (15 min)
6. ✅ Create custom agent (15 min)

**Total:** 1h 45min to master the system

### **For API Integrators:**

1. ✅ Download GraphQL schema (5 min)
2. ✅ Import to Postman/Insomnia (5 min)
3. ✅ Generate types for your language (10 min)
4. ✅ Test API calls (20 min)

**Total:** 40 minutes to integrate

---

## 🔗 **Important Links**

### **Documentation:**
- Twenty Docs: https://docs.twenty.com
- GraphQL Playground: http://localhost:3000/graphql
- REST API Docs: http://localhost:3000/rest/open-api/core

### **UI Access:**
- Main App: http://localhost:3000
- Settings → AI: http://localhost:3000/settings/ai
- Settings → APIs: http://localhost:3000/settings/apis-webhooks

### **Repository:**
- Main Repo: https://github.com/twentyhq/twenty
- Your Branch: `claude/customize-crm-twenty-011CV54yMGVszGXcyaXPRDTL`

---

## 💡 **Pro Tips**

### **Tip 1: Use Context7 MCP**
Twenty documentation mentions using Context7 for API docs:
```bash
# Will auto-fetch library docs when needed
# No need to search manually
```

### **Tip 2: Version Control Your Schema**
```bash
# Download schema periodically
node download-schema-simple.js > schema-$(date +%Y%m%d).json

# Compare changes
diff schema-20251113.json schema-20251120.json
```

### **Tip 3: Test Before Deploy**
```bash
# Always test getvoila API first
./test-getvoila-api.sh ...

# Check compatibility score: 3/3 ✅
# If score < 3, fix issues before setup
```

### **Tip 4: Monitor Token Usage**
```bash
# Check AI costs regularly
# Settings → AI → Usage
# Set budget alerts
```

### **Tip 5: Custom Agents for Specific Workflows**
```
Instead of one general agent, create:
- Sales Qualification Agent
- Data Import Agent
- Report Generator Agent
- etc.

Each with specialized prompts and tools.
```

---

## 🎯 **Next Steps**

After setup, you can:

1. **Extend AI Agents:**
   - Create custom agents
   - Setup agent handoffs
   - Integrate with workflows

2. **Customize CRM:**
   - Add custom objects via UI
   - Create custom fields
   - Build custom views

3. **Integrate External Systems:**
   - Use GraphQL API
   - Setup webhooks
   - Create Zapier integrations

4. **Build Custom UI:**
   - Use Twenty UI components
   - Extend frontend modules
   - Create custom pages

---

## 📊 **Files Summary**

```
/home/user/twenty/
├── 📥 GraphQL Schema Tools/
│   ├── DOWNLOAD-GRAPHQL-SCHEMA.md     (8.8K) Documentation
│   ├── download-schema-simple.js       (4.4K) Auto-download
│   ├── download-graphql-schema.sh      (2.2K) Bash version
│   ├── introspection-query.graphql     (1.3K) Query template
│   └── analyze-schema.js               (6.7K) Schema analyzer
│
├── 🤖 AI Agent Tools/
│   ├── AI-AGENT-README.md              (9.1K) Quick start
│   ├── ENABLE-AI-AGENT.md             (12K)   Complete guide
│   ├── AI-AGENT-HOW-IT-WORKS.md       (42K)   Architecture
│   ├── .env.ai-agent                   (3.4K) Config examples
│   ├── setup-ai-agent.sh               (6.8K) Setup wizard
│   ├── test-getvoila-api.sh            (9.2K) API testing
│   └── check-ai-agent-status.sh        (7.9K) Diagnostics
│
└── 📋 This Guide/
    └── CUSTOMIZATION-GUIDE.md          (this file)

Total: 12 files, 116 KB
```

---

## 🆘 **Getting Help**

### **Issue: Script not working**
```bash
# Make sure scripts are executable
chmod +x *.sh

# Check Node.js version
node --version  # Should be 18+

# Check dependencies
yarn install
```

### **Issue: AI Agent not appearing**
```bash
# Run diagnostics
./check-ai-agent-status.sh

# Common fixes:
# 1. Check .env configuration
# 2. Restart server
# 3. Check feature flags
```

### **Issue: API connection failed**
```bash
# Test API manually
curl -X POST https://api.getvoila.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hi"}]}'

# If fails, check:
# - API key validity
# - Endpoint URL
# - Network/firewall
```

---

## 🎉 **Success Checklist**

- [ ] Downloaded and analyzed GraphQL schema
- [ ] Tested getvoila API (score 3/3)
- [ ] Ran setup-ai-agent.sh successfully
- [ ] Started Twenty server
- [ ] Accessed Settings → AI in UI
- [ ] Saw registered models in dropdown
- [ ] Chatted with at least one agent
- [ ] Agent successfully called a tool
- [ ] Checked usage/billing stats
- [ ] Read all documentation

**If all checked:** You're ready to customize Twenty CRM! 🚀

---

## 📝 **Changelog**

**2025-11-13:**
- ✅ Created GraphQL schema download tools (5 files)
- ✅ Created AI Agent setup tools (7 files)
- ✅ Created this customization guide
- ✅ Total: 12 files, 116 KB of documentation & tools

---

**Questions? Check the docs or run diagnostics!**

```bash
# Quick help
./check-ai-agent-status.sh

# Full docs
cat AI-AGENT-README.md
cat DOWNLOAD-GRAPHQL-SCHEMA.md
```

🤖 Happy customizing!
