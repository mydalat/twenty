#!/usr/bin/env node

/**
 * Simple script to download GraphQL schema from Twenty CRM
 * Usage: node download-schema-simple.js [API_KEY] [BASE_URL]
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

const API_KEY = process.argv[2] || 'YOUR_API_KEY_HERE';
const BASE_URL = process.argv[3] || 'http://localhost:3000';

// GraphQL Introspection Query (minified)
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args { ...InputValue }
      }
    }
  }
  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args { ...InputValue }
      type { ...TypeRef }
      isDeprecated
      deprecationReason
    }
    inputFields { ...InputValue }
    interfaces { ...TypeRef }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes { ...TypeRef }
  }
  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

function downloadSchema(endpoint, outputFile, schemaName) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const postData = JSON.stringify({
      query: introspectionQuery,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${API_KEY}`,
      },
    };

    console.log(`📥 Downloading ${schemaName}...`);
    console.log(`   URL: ${url.href}`);

    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
            console.log(`   ✅ Saved to: ${outputFile}`);
            resolve();
          } catch (error) {
            console.error(`   ❌ Failed to parse response: ${error.message}`);
            reject(error);
          }
        } else {
          console.error(`   ❌ HTTP ${res.statusCode}: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
        console.log('');
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request failed: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔍 Downloading GraphQL schemas from Twenty CRM...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // Download Core API Schema
    await downloadSchema('/graphql', 'schema-core.json', 'Core API Schema');

    // Download Metadata API Schema
    await downloadSchema('/metadata', 'schema-metadata.json', 'Metadata API Schema');

    console.log('🎉 Done!');
    console.log('');
    console.log('📄 Files created:');
    console.log('   - schema-core.json (Core API - Companies, People, Opportunities, etc.)');
    console.log('   - schema-metadata.json (Metadata API - Object/Field definitions)');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. View as SDL: npx graphql-json-to-sdl schema-core.json > schema.graphql');
    console.log('   2. Generate types: npx @graphql-codegen/cli');
    console.log('   3. Use in Postman/Insomnia by importing the JSON files');

  } catch (error) {
    console.error('❌ Failed to download schemas');
    process.exit(1);
  }
}

main();
