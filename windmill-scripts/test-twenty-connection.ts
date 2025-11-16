/**
 * Windmill Script: Test Twenty CRM Connection
 *
 * This script helps diagnose connection issues with Twenty CRM API.
 * Use this before running the main upload scripts.
 *
 * Resource required: u/chipvn/twenty
 */

type TwentyResource = {
  apiUrl: string;
  apiKey: string;
};

/**
 * Test 1: Check if API URL is reachable
 */
async function testApiUrl(apiUrl: string) {
  console.log("\n🔗 Test 1: Testing API URL reachability...");
  console.log(`   URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log("   ✅ URL is reachable but requires authentication (expected)");
      return { success: true, message: "URL reachable, needs auth" };
    } else if (response.status === 200) {
      console.log("   ✅ URL is reachable");
      return { success: true, message: "URL reachable" };
    } else if (response.status === 404) {
      console.log("   ❌ URL not found (404) - Check your endpoint URL!");
      return { success: false, message: "404 Not Found - Invalid endpoint" };
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      return { success: false, message: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    console.log(`   ❌ Failed to reach URL: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Test 2: Test GraphQL introspection query with API key
 */
async function testGraphQLIntrospection(apiUrl: string, apiKey: string) {
  console.log("\n🔐 Test 2: Testing GraphQL with API key...");

  const query = `
    query IntrospectionQuery {
      __schema {
        queryType {
          name
        }
        mutationType {
          name
        }
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const result = await response.json();

    if (result.errors) {
      console.log("   ❌ GraphQL errors:");
      console.log(JSON.stringify(result.errors, null, 2));
      return { success: false, message: "GraphQL errors", errors: result.errors };
    }

    if (result.data?.__schema) {
      console.log("   ✅ GraphQL API is working!");
      console.log(`   Query type: ${result.data.__schema.queryType.name}`);
      console.log(`   Mutation type: ${result.data.__schema.mutationType.name}`);
      return { success: true, message: "GraphQL API working" };
    }

    return { success: false, message: "Unexpected response format" };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Test 3: Try to fetch tasks (simple query)
 */
async function testSimpleQuery(apiUrl: string, apiKey: string) {
  console.log("\n📋 Test 3: Testing simple query (fetch tasks)...");

  const query = `
    query GetTasks {
      tasks(first: 1) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const result = await response.json();

    if (result.errors) {
      console.log("   ❌ Query failed:");
      console.log(JSON.stringify(result.errors, null, 2));
      return { success: false, message: "Query failed", errors: result.errors };
    }

    if (result.data?.tasks) {
      const taskCount = result.data.tasks.edges?.length || 0;
      console.log(`   ✅ Query successful! Found ${taskCount} task(s)`);
      if (taskCount > 0) {
        console.log(`   First task: "${result.data.tasks.edges[0].node.title}"`);
      }
      return { success: true, message: "Query successful", taskCount };
    }

    return { success: false, message: "Unexpected response format" };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Test 4: Check API key permissions
 */
async function testApiKeyPermissions(apiUrl: string, apiKey: string) {
  console.log("\n🔑 Test 4: Checking API key permissions...");

  const query = `
    query GetCurrentUser {
      currentWorkspace {
        id
        displayName
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log("   ❌ API key is invalid or expired");
      return { success: false, message: "Invalid or expired API key" };
    }

    const result = await response.json();

    if (result.errors) {
      console.log("   ⚠️  Errors:");
      console.log(JSON.stringify(result.errors, null, 2));
      return { success: false, message: "API key errors", errors: result.errors };
    }

    if (result.data?.currentWorkspace) {
      console.log(`   ✅ API key is valid!`);
      console.log(`   Workspace: ${result.data.currentWorkspace.displayName || result.data.currentWorkspace.id}`);
      return { success: true, message: "API key valid", workspace: result.data.currentWorkspace };
    }

    return { success: false, message: "Could not fetch workspace info" };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Main function
 */
export async function main(twenty: TwentyResource) {
  console.log("🚀 Twenty CRM Connection Test");
  console.log("=" .repeat(60));
  console.log("\n📍 Configuration:");
  console.log(`   API URL: ${twenty.apiUrl}`);
  console.log(`   API Key: ${twenty.apiKey.substring(0, 20)}...`);

  const results: any = {
    apiUrl: twenty.apiUrl,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: URL reachability
  const test1 = await testApiUrl(twenty.apiUrl);
  results.tests.urlReachability = test1;

  if (!test1.success) {
    console.log("\n" + "=".repeat(60));
    console.log("\n❌ DIAGNOSIS: URL is not reachable");
    console.log("\n💡 SOLUTION:");
    console.log("   1. Check your Twenty instance URL");
    console.log("   2. Correct format: https://[instance].twenty.com/graphql");
    console.log("   3. For self-hosted: https://[domain]/graphql");
    console.log("   4. For local dev: http://localhost:3000/graphql");
    console.log("\n   Update your resource 'u/chipvn/twenty' with correct URL");

    return results;
  }

  // Test 2: GraphQL introspection
  const test2 = await testGraphQLIntrospection(twenty.apiUrl, twenty.apiKey);
  results.tests.graphqlIntrospection = test2;

  // Test 3: Simple query
  const test3 = await testSimpleQuery(twenty.apiUrl, twenty.apiKey);
  results.tests.simpleQuery = test3;

  // Test 4: API key permissions
  const test4 = await testApiKeyPermissions(twenty.apiUrl, twenty.apiKey);
  results.tests.apiKeyPermissions = test4;

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY:");
  console.log(`   URL Reachability: ${test1.success ? '✅' : '❌'}`);
  console.log(`   GraphQL API: ${test2.success ? '✅' : '❌'}`);
  console.log(`   Simple Query: ${test3.success ? '✅' : '❌'}`);
  console.log(`   API Key: ${test4.success ? '✅' : '❌'}`);

  const allPassed = test1.success && test2.success && test3.success && test4.success;

  if (allPassed) {
    console.log("\n✅ ALL TESTS PASSED!");
    console.log("   Your Twenty CRM connection is working correctly.");
    console.log("   You can now run the file upload scripts.");
    results.status = "success";
  } else {
    console.log("\n❌ SOME TESTS FAILED");
    console.log("\n💡 TROUBLESHOOTING:");

    if (!test1.success) {
      console.log("\n   Issue: Cannot reach API URL");
      console.log("   Fix: Update resource with correct Twenty instance URL");
      console.log("        Format: https://[your-instance].twenty.com/graphql");
    }

    if (!test2.success || !test4.success) {
      console.log("\n   Issue: API key invalid or expired");
      console.log("   Fix: Generate new API key in Twenty CRM:");
      console.log("        Settings > Developers > API Keys > Create");
    }

    if (!test3.success) {
      console.log("\n   Issue: Query permissions");
      console.log("   Fix: Ensure API key has read/write permissions");
    }

    results.status = "failed";
  }

  console.log("\n" + "=".repeat(60));

  return results;
}

/**
 * USAGE:
 *
 * 1. Set resource: u/chipvn/twenty
 * 2. Click "Run"
 * 3. Check output for diagnostic results
 *
 * Common Issues & Solutions:
 *
 * Issue 1: "404 Not Found"
 * → Fix: Update apiUrl in resource to your actual instance URL
 *    Example: https://my-company.twenty.com/graphql
 *
 * Issue 2: "401 Unauthorized"
 * → Fix: Generate new API key in Twenty CRM
 *
 * Issue 3: "Network error"
 * → Fix: Check if Twenty instance is running and accessible
 */
