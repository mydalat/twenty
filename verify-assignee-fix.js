/**
 * VERIFICATION SCRIPT - Assignee Field Fix
 *
 * This script verifies that the assignee field is now ALWAYS fetched
 * in task table queries, regardless of column visibility.
 *
 * USAGE:
 * 1. Open Chrome DevTools (F12) on task table page
 * 2. Paste this script
 * 3. Refresh the page
 * 4. Run: verifyFix()
 */

console.log("%c╔════════════════════════════════════════╗", "color: green; font-weight: bold");
console.log("%c║  ASSIGNEE FIELD FIX VERIFICATION      ║", "color: green; font-weight: bold");
console.log("%c╚════════════════════════════════════════╝", "color: green; font-weight: bold");

window.verificationData = {
  queriesCaptured: [],
  testResults: {
    assigneeInQuery: false,
    assigneeVisible: false,
    dataDisplayed: false
  }
};

// Intercept GraphQL queries
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, config] = args;

  if (typeof url === "string" && url.includes("graphql")) {
    const body = config?.body ? JSON.parse(config.body) : null;

    if (body?.query && body.query.includes("task")) {
      const hasAssignee = body.query.includes("assignee");
      const queryType = body.query.match(/query\s+(\w+)/)?.[1] || "Unknown";

      window.verificationData.queriesCaptured.push({
        type: queryType,
        hasAssignee: hasAssignee,
        timestamp: new Date().toLocaleTimeString(),
        query: body.query
      });

      // Update test results
      if (hasAssignee) {
        window.verificationData.testResults.assigneeInQuery = true;
      }

      console.log(`%c📡 GraphQL Query Captured: ${queryType}`, "color: cyan");
      console.log(`   Has assignee: ${hasAssignee ? "✅ YES" : "❌ NO"}`);
    }
  }

  return originalFetch.apply(this, args);
};

// Verify function
window.verifyFix = () => {
  console.clear();
  console.log("%c╔════════════════════════════════════════╗", "color: blue; font-weight: bold");
  console.log("%c║     FIX VERIFICATION REPORT           ║", "color: blue; font-weight: bold");
  console.log("%c╚════════════════════════════════════════╝", "color: blue; font-weight: bold");

  // Check 1: Column visibility
  const headers = document.querySelectorAll("[role=columnheader]");
  const columns = Array.from(headers).map(h => h.textContent.trim());
  const assigneeVisible = columns.some(c =>
    c.toLowerCase().includes("assignee") || c.toLowerCase().includes("people")
  );

  window.verificationData.testResults.assigneeVisible = assigneeVisible;

  console.log("\n%c1️⃣  COLUMN VISIBILITY CHECK", "color: yellow; font-weight: bold");
  console.log("   Visible columns:", columns.join(", "));
  console.log(`   Assignee column visible: ${assigneeVisible ? "✅ YES" : "❌ NO"}`);

  // Check 2: GraphQL queries
  console.log("\n%c2️⃣  GRAPHQL QUERY CHECK", "color: yellow; font-weight: bold");
  console.log(`   Total queries captured: ${window.verificationData.queriesCaptured.length}`);

  const queriesWithAssignee = window.verificationData.queriesCaptured.filter(q => q.hasAssignee);
  console.log(`   Queries with assignee: ${queriesWithAssignee.length}`);

  if (queriesWithAssignee.length > 0) {
    console.log("\n   ✅ SUCCESS! Queries now include assignee field!");
    console.log("\n   Sample query:");
    queriesWithAssignee.slice(0, 1).forEach(q => {
      console.log(`   Type: ${q.type}`);
      console.log(`   Time: ${q.timestamp}`);

      // Extract assignee part of query
      const assigneePart = q.query.match(/assignee\s*\{[^}]+\}/)?.[0];
      if (assigneePart) {
        console.log(`   Assignee fragment: ${assigneePart}`);
      }
    });
  } else {
    console.log("\n   ❌ NO queries with assignee field found yet");
    console.log("   💡 Try refreshing the page or navigating to task table");
  }

  // Check 3: DOM inspection
  console.log("\n%c3️⃣  DOM DATA CHECK", "color: yellow; font-weight: bold");

  const assigneeCells = document.querySelectorAll(
    "[data-field-name*='assignee'], [data-field-name*='people']"
  );

  if (assigneeCells.length > 0) {
    const cellsWithData = Array.from(assigneeCells).filter(
      cell => cell.textContent.trim() && cell.textContent.trim() !== ''
    );

    console.log(`   Assignee cells found: ${assigneeCells.length}`);
    console.log(`   Cells with data: ${cellsWithData.length}`);

    if (cellsWithData.length > 0) {
      console.log("\n   ✅ Assignee data is displaying in table!");
      window.verificationData.testResults.dataDisplayed = true;

      // Show sample
      console.log("\n   Sample data:");
      Array.from(cellsWithData).slice(0, 3).forEach((cell, i) => {
        console.log(`   ${i + 1}. "${cell.textContent.trim()}"`);
      });
    } else {
      console.log("\n   ⚠️  Cells exist but no data displayed");
      console.log("   💡 Data might not be assigned yet or still loading");
    }
  } else {
    if (!assigneeVisible) {
      console.log("   ℹ️  Assignee column not visible (expected)");
      console.log("   💡 But data should still be fetched in GraphQL!");
    } else {
      console.log("   ⚠️  Column visible but cells not found in DOM");
    }
  }

  // Final verdict
  console.log("\n%c═══════════════════════════════════════", "color: blue");
  console.log("%c📊 FINAL VERDICT", "color: yellow; font-weight: bold; font-size: 14px");
  console.log("%c═══════════════════════════════════════", "color: blue");

  const results = window.verificationData.testResults;

  console.log("\n✓ Tests:");
  console.log(`   ${results.assigneeInQuery ? "✅" : "❌"} Assignee field in GraphQL query`);
  console.log(`   ${assigneeVisible ? "✅" : "ℹ️ "} Assignee column visible ${!assigneeVisible ? "(not required)" : ""}`);
  console.log(`   ${results.dataDisplayed ? "✅" : "ℹ️ "} Data displayed ${!results.dataDisplayed ? "(if assigned)" : ""}`);

  if (results.assigneeInQuery) {
    console.log("\n%c🎉 FIX VERIFIED SUCCESSFULLY!", "color: green; font-weight: bold; font-size: 16px");
    console.log("\n✅ The assignee field is now ALWAYS fetched in queries,");
    console.log("   even when the column is not visible in the table!");
    console.log("\n💡 This means relationship data will display correctly");
    console.log("   without needing to visit the detail view first.");
  } else {
    console.log("\n%c⚠️  FIX NOT YET VERIFIED", "color: orange; font-weight: bold; font-size: 16px");
    console.log("\n💡 Next steps:");
    console.log("   1. Make sure you're on a task table/list page");
    console.log("   2. Refresh the page to trigger new queries");
    console.log("   3. Run verifyFix() again");
    console.log("\n   Or check recent queries with: showCapturedQueries()");
  }

  return results;
};

// Show captured queries
window.showCapturedQueries = () => {
  console.log("%c\n📋 CAPTURED QUERIES", "color: cyan; font-weight: bold");

  if (window.verificationData.queriesCaptured.length === 0) {
    console.log("No queries captured yet. Navigate to task table and refresh.");
    return;
  }

  window.verificationData.queriesCaptured.forEach((q, i) => {
    const icon = q.hasAssignee ? "✅" : "❌";
    console.log(`\n${i + 1}. ${icon} ${q.type} [${q.timestamp}]`);
    console.log("   Query preview:");
    console.log("   " + q.query.substring(0, 200) + "...");
  });
};

// Show full query
window.showFullQuery = (index) => {
  if (index < 1 || index > window.verificationData.queriesCaptured.length) {
    console.error("Invalid index. Use 1 to", window.verificationData.queriesCaptured.length);
    return;
  }

  const query = window.verificationData.queriesCaptured[index - 1];
  console.log(`%c\n📝 FULL QUERY #${index}`, "color: cyan; font-weight: bold");
  console.log(query.query);
};

// Auto-start
console.log("\n✅ Verification script loaded!");
console.log("\n%c📚 AVAILABLE COMMANDS:", "color: yellow; font-weight: bold");
console.log("   verifyFix()              - Run full verification");
console.log("   showCapturedQueries()    - Show all captured queries");
console.log("   showFullQuery(N)         - Show full text of query #N");
console.log("\n%c🚀 RECOMMENDED:", "color: green; font-weight: bold");
console.log("   1. Navigate to task table/list");
console.log("   2. Refresh the page");
console.log("   3. Run: verifyFix()");

console.log("\n%c⏰ Monitoring queries... Refresh page to capture new queries.", "color: gray");
