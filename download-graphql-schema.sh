#!/bin/bash

# Script to download GraphQL schemas from Twenty CRM
# Make sure the server is running at http://localhost:3000

API_KEY="${1:-YOUR_API_KEY_HERE}"
BASE_URL="${2:-http://localhost:3000}"

echo "🔍 Downloading GraphQL schemas from Twenty CRM..."
echo "   Base URL: $BASE_URL"
echo ""

# Function to download schema
download_schema() {
  local endpoint=$1
  local output_file=$2
  local name=$3

  echo "📥 Downloading $name..."

  # GraphQL introspection query
  curl -X POST "$BASE_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d @- << 'EOF' | jq '.' > "$output_file"
{
  "query": "query IntrospectionQuery { __schema { queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description locations args { ...InputValue } } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } } fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } } }"
}
EOF

  if [ $? -eq 0 ]; then
    echo "   ✅ Saved to: $output_file"
  else
    echo "   ❌ Failed to download $name"
  fi
  echo ""
}

# Download Core API Schema (main data operations)
download_schema "/graphql" "schema-core.json" "Core API Schema"

# Download Metadata API Schema (workspace configuration)
download_schema "/metadata" "schema-metadata.json" "Metadata API Schema"

echo "🎉 Done!"
echo ""
echo "📄 Files created:"
echo "   - schema-core.json (Core API - Companies, People, Opportunities, etc.)"
echo "   - schema-metadata.json (Metadata API - Object/Field definitions)"
echo ""
echo "💡 To convert to GraphQL SDL format, you can use tools like:"
echo "   npx graphql-json-to-sdl schema-core.json > schema-core.graphql"
