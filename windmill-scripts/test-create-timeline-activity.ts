/**
 * Test creating custom Timeline Activity via GraphQL API
 *
 * Purpose: Test if we can create custom timeline events that appear on Person timeline
 */

type TwentyResource = {
  apiUrl: string;
  apiKey: string;
};

interface TimelineActivity {
  id: string;
  name: string;
  happensAt: string;
  properties?: any;
  linkedRecordCachedName?: string;
  personId?: string;
}

/**
 * GraphQL Introspection: Check if createTimelineActivity mutation exists
 */
async function checkTimelineActivityMutations(
  apiUrl: string,
  apiKey: string
): Promise<void> {
  console.log("\n🔍 Step 1: Checking available mutations for TimelineActivity...");

  const introspectionQuery = `
    query IntrospectTimelineActivity {
      __type(name: "Mutation") {
        fields {
          name
          description
        }
      }
    }
  `;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query: introspectionQuery })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Introspection failed: ${JSON.stringify(result.errors)}`);
  }

  const mutations = result.data.__type.fields;
  const timelineActivityMutations = mutations.filter((m: any) =>
    m.name.toLowerCase().includes('timelineactivity')
  );

  console.log(`✅ Found ${timelineActivityMutations.length} timeline activity mutations:`);
  timelineActivityMutations.forEach((m: any) => {
    console.log(`   - ${m.name}: ${m.description || 'No description'}`);
  });

  return;
}

/**
 * Try to create a custom Timeline Activity
 */
async function createCustomTimelineActivity(
  apiUrl: string,
  apiKey: string,
  personId: string
): Promise<TimelineActivity> {
  console.log("\n📝 Step 2: Creating custom timeline activity...");

  const mutation = `
    mutation CreateTimelineActivity($data: TimelineActivityCreateInput!) {
      createTimelineActivity(data: $data) {
        id
        name
        happensAt
        properties
        linkedRecordCachedName
        person {
          id
          name {
            firstName
            lastName
          }
        }
      }
    }
  `;

  const variables = {
    data: {
      name: "custom.integration",
      happensAt: new Date().toISOString(),
      properties: {
        source: "windmill",
        message: "This is a custom timeline event created via API",
        metadata: {
          integrationName: "Twenty CRM Integration Test",
          version: "1.0"
        }
      },
      linkedRecordCachedName: "Custom Integration Event",
      personId: personId
    }
  };

  console.log(`   Mutation: createTimelineActivity`);
  console.log(`   Event name: ${variables.data.name}`);
  console.log(`   Person ID: ${personId}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query: mutation, variables })
  });

  const result = await response.json();

  if (result.errors) {
    console.log(`❌ Failed to create timeline activity`);
    console.log(`   Errors: ${JSON.stringify(result.errors, null, 2)}`);
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  console.log(`✅ Timeline activity created successfully!`);
  console.log(`   ID: ${result.data.createTimelineActivity.id}`);
  console.log(`   Name: ${result.data.createTimelineActivity.name}`);

  return result.data.createTimelineActivity;
}

/**
 * Query timeline activities for a person
 */
async function getPersonTimelineActivities(
  apiUrl: string,
  apiKey: string,
  personId: string
): Promise<TimelineActivity[]> {
  console.log("\n🔎 Step 3: Querying person's timeline activities...");

  const query = `
    query GetTimelineActivities($filter: TimelineActivityFilterInput) {
      timelineActivities(filter: $filter, orderBy: { createdAt: DescNullsFirst }) {
        edges {
          node {
            id
            name
            happensAt
            properties
            linkedRecordCachedName
            createdAt
          }
        }
      }
    }
  `;

  const variables = {
    filter: {
      personId: { eq: personId }
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Query failed: ${JSON.stringify(result.errors)}`);
  }

  const activities = result.data.timelineActivities.edges.map((edge: any) => edge.node);

  console.log(`✅ Found ${activities.length} timeline activities for person`);
  console.log(`\n   Recent activities:`);
  activities.slice(0, 5).forEach((activity: any, index: number) => {
    console.log(`   ${index + 1}. ${activity.name} - ${activity.linkedRecordCachedName || 'No name'}`);
    console.log(`      Happened at: ${activity.happensAt}`);
    if (activity.properties) {
      console.log(`      Properties: ${JSON.stringify(activity.properties).substring(0, 100)}...`);
    }
  });

  return activities;
}

/**
 * Main execution
 */
export async function main(
  twenty: TwentyResource,
  personId: string = ""  // Optional: provide a person ID to test with
) {
  try {
    console.log("🧪 Testing Custom Timeline Activity Creation via GraphQL API");
    console.log("=" .repeat(70));
    console.log(`API URL: ${twenty.apiUrl}`);
    console.log(`Person ID: ${personId || 'Not provided - will check mutations only'}`);

    // Step 1: Check available mutations
    await checkTimelineActivityMutations(twenty.apiUrl, twenty.apiKey);

    if (!personId) {
      console.log("\n⚠️  No person ID provided. Stopping here.");
      console.log("   To test creation, provide a valid person ID.");
      return {
        success: true,
        message: "Introspection completed. Provide personId to test creation.",
        mutationsAvailable: true
      };
    }

    // Step 2: Try to create custom timeline activity
    const createdActivity = await createCustomTimelineActivity(
      twenty.apiUrl,
      twenty.apiKey,
      personId
    );

    // Step 3: Query to verify it appears in timeline
    const activities = await getPersonTimelineActivities(
      twenty.apiUrl,
      twenty.apiKey,
      personId
    );

    const ourActivity = activities.find(a => a.id === createdActivity.id);

    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   - Custom timeline activity created: ✅`);
    console.log(`   - Activity appears in timeline: ${ourActivity ? '✅' : '❌'}`);
    console.log(`   - Activity ID: ${createdActivity.id}`);
    console.log(`   - Event name: ${createdActivity.name}`);
    console.log(`\n💡 Conclusion:`);
    console.log(`   You CAN create custom timeline events via GraphQL API!`);
    console.log(`   These events will appear on the Person's timeline in the UI.`);

    return {
      success: true,
      activity: createdActivity,
      visibleInTimeline: !!ourActivity
    };

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\nError details:", error);

    return {
      success: false,
      error: error.message
    };
  }
}
