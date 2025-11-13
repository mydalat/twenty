#!/bin/bash

# ============================================
# Test getvoila API Compatibility with Twenty
# ============================================
# Usage: ./test-getvoila-api.sh <api_url> <api_key> <model_name>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${1}"
API_KEY="${2}"
MODEL="${3:-gpt-4o-mini}"

if [ -z "$API_URL" ] || [ -z "$API_KEY" ]; then
  echo ""
  echo "Usage: $0 <api_url> <api_key> [model_name]"
  echo ""
  echo "Example:"
  echo "  $0 https://api.getvoila.ai/v1 your-api-key gpt-4o-mini"
  echo ""
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🧪 Testing getvoila API Compatibility                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}API URL:${NC} $API_URL"
echo -e "${BLUE}Model:${NC} $MODEL"
echo ""

# Test 1: Basic chat completion
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Test 1: Basic Chat Completion (Non-streaming)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "'"$MODEL"'",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in one sentence."}
    ],
    "stream": false,
    "max_tokens": 50
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Request successful${NC}"
  echo ""

  # Check response structure
  if echo "$BODY" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Response format is valid${NC}"
    echo ""
    echo "Response content:"
    echo "$BODY" | jq -r '.choices[0].message.content'
  else
    echo -e "${RED}❌ Response format is invalid${NC}"
    echo "Expected: { choices: [{ message: { content: '...' } }] }"
    echo ""
    echo "Actual response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  fi
else
  echo -e "${RED}❌ Request failed${NC}"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# Test 2: Streaming
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Test 2: Streaming Response${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STREAM_RESPONSE=$(curl -s -N -X POST "$API_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "'"$MODEL"'",
    "messages": [
      {"role": "user", "content": "Count to 3"}
    ],
    "stream": true,
    "max_tokens": 30
  }' | head -n 10)

if echo "$STREAM_RESPONSE" | grep -q "data:"; then
  echo -e "${GREEN}✅ Streaming response detected${NC}"
  echo ""
  echo "First 10 lines of stream:"
  echo "$STREAM_RESPONSE"
  echo ""

  # Check SSE format
  if echo "$STREAM_RESPONSE" | grep -q "data:.*choices"; then
    echo -e "${GREEN}✅ SSE format is valid${NC}"
  else
    echo -e "${RED}⚠️  SSE format might be incorrect${NC}"
    echo "Expected format: data: {json with choices array}"
  fi
else
  echo -e "${RED}❌ Streaming not detected or not working${NC}"
  echo ""
  echo "Response:"
  echo "$STREAM_RESPONSE"
fi

echo ""

# Test 3: Function calling / Tools
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Test 3: Function Calling / Tools Support${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOOLS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "'"$MODEL"'",
    "messages": [
      {"role": "user", "content": "Create a company called Acme Corp"}
    ],
    "tools": [
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
                "description": "The company name"
              }
            },
            "required": ["name"]
          }
        }
      }
    ],
    "stream": false,
    "max_tokens": 100
  }')

TOOLS_HTTP_STATUS=$(echo "$TOOLS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
TOOLS_BODY=$(echo "$TOOLS_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $TOOLS_HTTP_STATUS"
echo ""

if [ "$TOOLS_HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Request with tools successful${NC}"
  echo ""

  # Check if tool was called
  if echo "$TOOLS_BODY" | jq -e '.choices[0].message.tool_calls' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tool calling is supported!${NC}"
    echo ""
    echo "Tool call detected:"
    echo "$TOOLS_BODY" | jq '.choices[0].message.tool_calls'
  else
    echo -e "${YELLOW}⚠️  Tool calling might not be supported${NC}"
    echo ""
    echo "Response:"
    echo "$TOOLS_BODY" | jq '.choices[0].message' 2>/dev/null || echo "$TOOLS_BODY"
    echo ""
    echo "Note: The API might not support function calling."
    echo "AI Agents require function calling to interact with database."
  fi
else
  echo -e "${RED}❌ Request with tools failed${NC}"
  echo ""
  echo "Response:"
  echo "$TOOLS_BODY" | jq '.' 2>/dev/null || echo "$TOOLS_BODY"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 COMPATIBILITY SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COMPAT_SCORE=0
TOTAL_TESTS=3

# Test 1
if [ "$HTTP_STATUS" = "200" ] && echo "$BODY" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Basic chat completion${NC}"
  COMPAT_SCORE=$((COMPAT_SCORE + 1))
else
  echo -e "${RED}❌ Basic chat completion${NC}"
fi

# Test 2
if echo "$STREAM_RESPONSE" | grep -q "data:.*choices"; then
  echo -e "${GREEN}✅ Streaming responses${NC}"
  COMPAT_SCORE=$((COMPAT_SCORE + 1))
else
  echo -e "${RED}❌ Streaming responses${NC}"
fi

# Test 3
if [ "$TOOLS_HTTP_STATUS" = "200" ] && echo "$TOOLS_BODY" | jq -e '.choices[0].message.tool_calls' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Function calling / Tools${NC}"
  COMPAT_SCORE=$((COMPAT_SCORE + 1))
else
  echo -e "${RED}❌ Function calling / Tools${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Score: $COMPAT_SCORE / $TOTAL_TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $COMPAT_SCORE -eq 3 ]; then
  echo -e "${GREEN}🎉 FULLY COMPATIBLE!${NC}"
  echo ""
  echo "Your getvoila API is fully compatible with Twenty AI Agents."
  echo "You can proceed with the setup."
elif [ $COMPAT_SCORE -ge 1 ]; then
  echo -e "${YELLOW}⚠️  PARTIALLY COMPATIBLE${NC}"
  echo ""
  echo "Some features might not work correctly."
  echo ""
  if echo "$TOOLS_BODY" | jq -e '.choices[0].message.tool_calls' > /dev/null 2>&1; then
    :
  else
    echo -e "${RED}CRITICAL:${NC} Function calling is not supported."
    echo "AI Agents require function calling to work with database operations."
    echo ""
    echo "Options:"
    echo "  1. Contact getvoila support to enable function calling"
    echo "  2. Use a proxy/wrapper to add function calling support"
    echo "  3. Use a different provider (OpenAI, Anthropic, etc.)"
  fi
else
  echo -e "${RED}❌ NOT COMPATIBLE${NC}"
  echo ""
  echo "Your API does not appear to be OpenAI-compatible."
  echo "Please check:"
  echo "  - Endpoint URL is correct"
  echo "  - API key is valid"
  echo "  - API follows OpenAI API format"
fi

echo ""
