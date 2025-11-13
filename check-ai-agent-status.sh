#!/bin/bash

# ============================================
# Check AI Agent Status in Twenty CRM
# ============================================
# Usage: ./check-ai-agent-status.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🤖 AI Agent Status Check - Twenty CRM                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check .env file
ENV_FILE="packages/twenty-server/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ .env file not found: $ENV_FILE${NC}"
  exit 1
fi

echo -e "${BLUE}📋 Checking Configuration...${NC}"
echo ""

# Check AI-related environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Environment Variables:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_env_var() {
  local var_name=$1
  local var_value=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-)

  if [ -n "$var_value" ]; then
    if [ "$var_name" = "OPENAI_API_KEY" ] || \
       [ "$var_name" = "ANTHROPIC_API_KEY" ] || \
       [ "$var_name" = "XAI_API_KEY" ] || \
       [ "$var_name" = "OPENAI_COMPATIBLE_API_KEY" ]; then
      # Mask sensitive values
      echo -e "${GREEN}✅ ${var_name}${NC} = ${var_value:0:8}...${var_value: -4}"
    else
      echo -e "${GREEN}✅ ${var_name}${NC} = $var_value"
    fi
    return 0
  else
    echo -e "${YELLOW}⚠️  ${var_name}${NC} = (not set)"
    return 1
  fi
}

PROVIDERS_COUNT=0

# Check OpenAI
if check_env_var "OPENAI_API_KEY"; then
  PROVIDERS_COUNT=$((PROVIDERS_COUNT + 1))
fi

# Check Anthropic
if check_env_var "ANTHROPIC_API_KEY"; then
  PROVIDERS_COUNT=$((PROVIDERS_COUNT + 1))
fi

# Check xAI
if check_env_var "XAI_API_KEY"; then
  PROVIDERS_COUNT=$((PROVIDERS_COUNT + 1))
fi

# Check OpenAI Compatible (getvoila, etc.)
echo ""
if check_env_var "OPENAI_COMPATIBLE_BASE_URL"; then
  check_env_var "OPENAI_COMPATIBLE_API_KEY"
  check_env_var "OPENAI_COMPATIBLE_MODEL_NAMES"
  PROVIDERS_COUNT=$((PROVIDERS_COUNT + 1))
fi

echo ""
check_env_var "DEFAULT_AI_SPEED_MODEL_ID"
check_env_var "DEFAULT_AI_PERFORMANCE_MODEL_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Provider Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $PROVIDERS_COUNT -eq 0 ]; then
  echo -e "${RED}❌ No AI providers configured${NC}"
  echo ""
  echo "To enable AI Agents, run:"
  echo -e "  ${BLUE}./setup-ai-agent.sh${NC}"
  exit 1
else
  echo -e "${GREEN}✅ $PROVIDERS_COUNT provider(s) configured${NC}"
fi

echo ""

# Check if server is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Server Status:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if curl -s http://localhost:3000/graphql > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Server is running${NC}"

  # Try to query available models (requires API key)
  echo ""
  echo "To check available AI models, you need an API key."
  echo "Create one at: http://localhost:3000/settings/apis-webhooks"
  echo ""
  read -p "Enter API key (or press Enter to skip): " API_KEY

  if [ -n "$API_KEY" ]; then
    echo ""
    echo "Querying available models..."
    echo ""

    RESPONSE=$(curl -s -X POST http://localhost:3000/metadata \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d '{
        "query": "query { availableAIModels { modelId label provider } }"
      }')

    if echo "$RESPONSE" | jq -e '.data.availableAIModels' > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Available models:${NC}"
      echo ""
      echo "$RESPONSE" | jq -r '.data.availableAIModels[] | "  • \(.modelId) (\(.provider))"'
    else
      echo -e "${YELLOW}⚠️  Could not fetch models${NC}"
      echo "Response: $RESPONSE"
    fi

    echo ""
    echo "Checking agents..."
    echo ""

    AGENTS_RESPONSE=$(curl -s -X POST http://localhost:3000/metadata \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d '{
        "query": "query { findManyAgents { edges { node { id name label modelId } } } }"
      }')

    if echo "$AGENTS_RESPONSE" | jq -e '.data.findManyAgents.edges' > /dev/null 2>&1; then
      AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | jq '.data.findManyAgents.edges | length')
      echo -e "${GREEN}✅ Found $AGENT_COUNT agent(s)${NC}"
      echo ""
      echo "$AGENTS_RESPONSE" | jq -r '.data.findManyAgents.edges[].node | "  • \(.label) (\(.modelId))"'
    else
      echo -e "${YELLOW}⚠️  Could not fetch agents${NC}"
      echo "Response: $AGENTS_RESPONSE"
    fi
  fi
else
  echo -e "${RED}❌ Server is not running${NC}"
  echo ""
  echo "Start the server with:"
  echo -e "  ${BLUE}yarn start${NC}"
fi

echo ""

# Check logs for AI-related entries
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Recent Logs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LOG_FILE="packages/twenty-server/logs/server.log"

if [ -f "$LOG_FILE" ]; then
  echo "Searching for AI-related log entries..."
  echo ""

  grep -i "AI\|model\|agent" "$LOG_FILE" | tail -n 10 || echo "No AI-related logs found"
else
  echo -e "${YELLOW}⚠️  Log file not found: $LOG_FILE${NC}"
  echo ""
  echo "Server logs will appear in the console when running 'yarn start'"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $PROVIDERS_COUNT -gt 0 ]; then
  echo -e "${GREEN}✅ AI configuration is present${NC}"
  echo ""
  echo "Next steps:"
  echo ""
  echo "  1. Ensure server is running:"
  echo -e "     ${BLUE}yarn start${NC}"
  echo ""
  echo "  2. Access AI settings in UI:"
  echo "     http://localhost:3000/settings/ai"
  echo ""
  echo "  3. Create or chat with agents"
  echo ""
  echo "  4. Check GraphQL playground:"
  echo "     http://localhost:3000/graphql"
else
  echo -e "${RED}❌ AI is not configured${NC}"
  echo ""
  echo "To enable AI Agents:"
  echo ""
  echo "  1. Run setup script:"
  echo -e "     ${BLUE}./setup-ai-agent.sh${NC}"
  echo ""
  echo "  2. Or manually edit .env:"
  echo "     See .env.ai-agent for examples"
  echo ""
  echo "  3. Then restart server:"
  echo -e "     ${BLUE}yarn start${NC}"
fi

echo ""
echo "📚 Documentation:"
echo "   - ENABLE-AI-AGENT.md"
echo "   - .env.ai-agent"
echo ""
