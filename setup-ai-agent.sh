#!/bin/bash

# ============================================
# AI Agent Setup Script for Twenty CRM
# ============================================
# Usage: ./setup-ai-agent.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🤖 AI Agent Setup for Twenty CRM                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
ENV_FILE="packages/twenty-server/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: .env file not found at $ENV_FILE${NC}"
  echo ""
  echo "Please create .env file first:"
  echo "  cp packages/twenty-server/.env.example packages/twenty-server/.env"
  exit 1
fi

echo -e "${BLUE}📝 Current .env location: $ENV_FILE${NC}"
echo ""

# Function to add or update env variable
update_env() {
  local key=$1
  local value=$2
  local file=$3

  if grep -q "^${key}=" "$file" 2>/dev/null; then
    # Key exists, update it
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      # Linux
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
    echo -e "${GREEN}  ✓ Updated ${key}${NC}"
  else
    # Key doesn't exist, add it
    echo "${key}=${value}" >> "$file"
    echo -e "${GREEN}  ✓ Added ${key}${NC}"
  fi
}

# Prompt user for setup type
echo "Choose AI provider:"
echo ""
echo "  1) getvoila API (Custom GPT wrapper) ⭐"
echo "  2) OpenAI API (Direct)"
echo "  3) Anthropic API (Claude)"
echo "  4) xAI API (Grok)"
echo "  5) Multiple providers"
echo "  6) Skip (manual configuration)"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}🔧 Setting up getvoila API...${NC}"
    echo ""

    read -p "Enter getvoila API endpoint (default: https://api.getvoila.ai/v1): " api_url
    api_url=${api_url:-https://api.getvoila.ai/v1}

    read -p "Enter getvoila API key: " api_key

    if [ -z "$api_key" ]; then
      echo -e "${RED}❌ API key is required${NC}"
      exit 1
    fi

    read -p "Enter model names (comma-separated, e.g., gpt-4o,gpt-4o-mini): " models
    models=${models:-gpt-4o,gpt-4o-mini}

    read -p "Enter default speed model (default: gpt-4o-mini): " speed_model
    speed_model=${speed_model:-gpt-4o-mini}

    read -p "Enter default performance model (default: gpt-4o): " perf_model
    perf_model=${perf_model:-gpt-4o}

    echo ""
    echo -e "${BLUE}📝 Updating .env...${NC}"
    update_env "OPENAI_COMPATIBLE_BASE_URL" "$api_url" "$ENV_FILE"
    update_env "OPENAI_COMPATIBLE_API_KEY" "$api_key" "$ENV_FILE"
    update_env "OPENAI_COMPATIBLE_MODEL_NAMES" "$models" "$ENV_FILE"
    update_env "DEFAULT_AI_SPEED_MODEL_ID" "$speed_model" "$ENV_FILE"
    update_env "DEFAULT_AI_PERFORMANCE_MODEL_ID" "$perf_model" "$ENV_FILE"
    ;;

  2)
    echo ""
    echo -e "${YELLOW}🔧 Setting up OpenAI API...${NC}"
    echo ""

    read -p "Enter OpenAI API key: " api_key

    if [ -z "$api_key" ]; then
      echo -e "${RED}❌ API key is required${NC}"
      exit 1
    fi

    echo ""
    echo -e "${BLUE}📝 Updating .env...${NC}"
    update_env "OPENAI_API_KEY" "$api_key" "$ENV_FILE"
    update_env "DEFAULT_AI_SPEED_MODEL_ID" "gpt-4o-mini" "$ENV_FILE"
    update_env "DEFAULT_AI_PERFORMANCE_MODEL_ID" "gpt-4o" "$ENV_FILE"
    ;;

  3)
    echo ""
    echo -e "${YELLOW}🔧 Setting up Anthropic API...${NC}"
    echo ""

    read -p "Enter Anthropic API key: " api_key

    if [ -z "$api_key" ]; then
      echo -e "${RED}❌ API key is required${NC}"
      exit 1
    fi

    echo ""
    echo -e "${BLUE}📝 Updating .env...${NC}"
    update_env "ANTHROPIC_API_KEY" "$api_key" "$ENV_FILE"
    update_env "DEFAULT_AI_SPEED_MODEL_ID" "claude-3-5-haiku-20241022" "$ENV_FILE"
    update_env "DEFAULT_AI_PERFORMANCE_MODEL_ID" "claude-sonnet-4-20250514" "$ENV_FILE"
    ;;

  4)
    echo ""
    echo -e "${YELLOW}🔧 Setting up xAI API...${NC}"
    echo ""

    read -p "Enter xAI API key: " api_key

    if [ -z "$api_key" ]; then
      echo -e "${RED}❌ API key is required${NC}"
      exit 1
    fi

    echo ""
    echo -e "${BLUE}📝 Updating .env...${NC}"
    update_env "XAI_API_KEY" "$api_key" "$ENV_FILE"
    update_env "DEFAULT_AI_SPEED_MODEL_ID" "grok-3-mini" "$ENV_FILE"
    update_env "DEFAULT_AI_PERFORMANCE_MODEL_ID" "grok-4" "$ENV_FILE"
    ;;

  5)
    echo ""
    echo -e "${YELLOW}🔧 Setting up multiple providers...${NC}"
    echo ""
    echo "Please edit $ENV_FILE manually and add all desired API keys."
    echo "See .env.ai-agent for examples."
    exit 0
    ;;

  6)
    echo ""
    echo -e "${YELLOW}⏭️  Skipping automatic setup.${NC}"
    echo ""
    echo "Please configure manually:"
    echo "  1. Edit $ENV_FILE"
    echo "  2. Add AI provider configuration"
    echo "  3. See .env.ai-agent for examples"
    echo "  4. See ENABLE-AI-AGENT.md for detailed guide"
    exit 0
    ;;

  *)
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Configuration saved!${NC}"
echo ""

# Test API connection
echo -e "${BLUE}🧪 Testing API connection...${NC}"
echo ""

if [ "$choice" = "1" ]; then
  # Test getvoila API
  echo "Testing: $api_url/chat/completions"
  response=$(curl -s -X POST "$api_url/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $api_key" \
    -d '{
      "model": "'${models%%,*}'",
      "messages": [{"role": "user", "content": "Hello"}],
      "stream": false,
      "max_tokens": 10
    }' 2>&1)

  if echo "$response" | grep -q "choices\|error"; then
    echo -e "${GREEN}✅ API connection successful!${NC}"
    echo ""
    echo "Response preview:"
    echo "$response" | head -n 5
  else
    echo -e "${RED}⚠️  Could not verify API connection${NC}"
    echo "Response: $response"
    echo ""
    echo "Please verify manually that your getvoila API:"
    echo "  - Accepts OpenAI-compatible requests"
    echo "  - Supports streaming responses"
    echo "  - Supports function calling (tools)"
  fi
fi

echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "  1. Restart Twenty server:"
echo -e "     ${BLUE}yarn start${NC}"
echo ""
echo "  2. Check logs for AI model registration:"
echo "     Look for: [AI] Registered models: ..."
echo ""
echo "  3. Access AI Agents in UI:"
echo "     Settings → AI"
echo ""
echo "  4. Create or chat with agents"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "📚 For detailed documentation, see:"
echo "   - ENABLE-AI-AGENT.md"
echo "   - .env.ai-agent (example config)"
echo ""
