#!/bin/bash

# Test Claude/Anthropic setup for Twenty CRM

echo "🧪 Testing Claude (Anthropic) Configuration..."
echo ""

ENV_FILE="packages/twenty-server/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env not found at $ENV_FILE"
  exit 1
fi

echo "📋 Checking environment variables..."
echo ""

# Check ANTHROPIC_API_KEY
if grep -q "^ANTHROPIC_API_KEY=" "$ENV_FILE"; then
  KEY=$(grep "^ANTHROPIC_API_KEY=" "$ENV_FILE" | cut -d= -f2)
  if [ -n "$KEY" ]; then
    echo "✅ ANTHROPIC_API_KEY: Set (${KEY:0:12}...${KEY: -4})"
  else
    echo "❌ ANTHROPIC_API_KEY: Empty"
  fi
else
  echo "❌ ANTHROPIC_API_KEY: Not configured"
fi

# Check DEFAULT_AI_SPEED_MODEL_ID
if grep -q "^DEFAULT_AI_SPEED_MODEL_ID=" "$ENV_FILE"; then
  MODEL=$(grep "^DEFAULT_AI_SPEED_MODEL_ID=" "$ENV_FILE" | cut -d= -f2)
  echo "✅ DEFAULT_AI_SPEED_MODEL_ID: $MODEL"
else
  echo "⚠️  DEFAULT_AI_SPEED_MODEL_ID: Not set (will use default)"
fi

# Check DEFAULT_AI_PERFORMANCE_MODEL_ID
if grep -q "^DEFAULT_AI_PERFORMANCE_MODEL_ID=" "$ENV_FILE"; then
  MODEL=$(grep "^DEFAULT_AI_PERFORMANCE_MODEL_ID=" "$ENV_FILE" | cut -d= -f2)
  echo "✅ DEFAULT_AI_PERFORMANCE_MODEL_ID: $MODEL"
else
  echo "⚠️  DEFAULT_AI_PERFORMANCE_MODEL_ID: Not set (will use default)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Anthropic API..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_KEY=$(grep "^ANTHROPIC_API_KEY=" "$ENV_FILE" | cut -d= -f2)

if [ -z "$API_KEY" ]; then
  echo "⚠️  Cannot test API - key not set"
  exit 0
fi

echo "Testing with model: claude-3-5-haiku-20241022"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  https://api.anthropic.com/v1/messages \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 50,
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API test successful!"
  echo ""
  echo "Response:"
  echo "$BODY" | jq -r '.content[0].text' 2>/dev/null || echo "$BODY"
else
  echo "❌ API test failed (HTTP $HTTP_STATUS)"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Available Claude Models:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. claude-3-5-haiku-20241022    (Fast & cheap)"
echo "2. claude-sonnet-4-20250514     (Balanced) ⭐"
echo "3. claude-opus-4-20250514       (Most powerful)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. yarn start"
echo "  2. Open http://localhost:3000/settings/ai"
echo "  3. Check if Claude models appear"
echo ""
