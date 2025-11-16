/**
 * Twenty CRM - Enhanced Relationship Field Debug Script
 *
 * USAGE:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script
 * 4. Run commands (see list at bottom)
 *
 * Created: 2025-11-16
 */

console.log("%c╔════════════════════════════════════════╗", "color: blue; font-weight: bold");
console.log("%c║  TWENTY RELATIONSHIP FIELD DEBUG      ║", "color: blue; font-weight: bold");
console.log("%c╚════════════════════════════════════════╝", "color: blue; font-weight: bold");

// ============================================================================
// 1. CHECK VISIBLE COLUMNS IN TABLE
// ============================================================================
window.checkVisibleColumns = () => {
  console.log("%c\n🔍 CHECKING VISIBLE COLUMNS...", "color: cyan; font-weight: bold");

  const headers = document.querySelectorAll("[role=columnheader]");
  const columns = Array.from(headers).map(h => h.textContent.trim());

  const hasPeople = columns.some(c => c.toLowerCase().includes("people") || c.toLowerCase().includes("assignee"));

  console.log("📋 Visible columns:", columns);
  console.log("📊 Total columns:", columns.length);

  if (hasPeople) {
    console.log("%c✅ People/Assignee field IS visible in table", "color: green; font-weight: bold");
  } else {
    console.log("%c❌ People/Assignee field NOT visible in table", "color: red; font-weight: bold");
    console.log("%c💡 This is likely why relationship data isn't showing!", "color: orange");
  }

  return { columns, hasPeople };
};

// ============================================================================
// 2. MONITOR GRAPHQL QUERIES
// ============================================================================
window.capturedQueries = [];
window.queryStats = { total: 0, withPeople: 0, withAssignee: 0 };

const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, config] = args;

  if (typeof url === "string" && url.includes("graphql")) {
    const body = config?.body ? JSON.parse(config.body) : null;

    if (body?.query) {
      const hasPeople = body.query.includes("people") || body.query.includes("assignee");
      const queryType = body.query.match(/query\s+(\w+)/)?.[1] ||
                       body.query.match(/mutation\s+(\w+)/)?.[1] ||
                       "Unknown";

      window.capturedQueries.push({
        type: queryType,
        hasPeople: hasPeople,
        timestamp: new Date().toLocaleTimeString(),
        query: body.query,
        preview: body.query.substring(0, 150) + "..."
      });

      window.queryStats.total++;
      if (hasPeople) {
        window.queryStats.withPeople++;
        if (body.query.includes("assignee")) window.queryStats.withAssignee++;
      }
    }
  }

  return originalFetch.apply(this, args);
};

// ============================================================================
// 3. SHOW CAPTURED QUERIES
// ============================================================================
window.showQueries = (detailed = false) => {
  console.log("%c\n📡 CAPTURED GRAPHQL QUERIES", "color: cyan; font-weight: bold");
  console.log(`Total queries: ${window.capturedQueries.length}`);
  console.log(`With people/assignee: ${window.queryStats.withPeople}`);
  console.log(`With assignee specifically: ${window.queryStats.withAssignee}`);

  console.log("\n--- Recent Queries ---");
  window.capturedQueries.slice(-10).forEach((q, i) => {
    const icon = q.hasPeople ? "✅" : "❌";
    const offset = window.capturedQueries.length - 10 + i;
    console.log(`${offset + 1}. ${icon} [${q.timestamp}] ${q.type}`);

    if (detailed) {
      console.log(`   Preview: ${q.preview}`);
    }
  });

  if (!detailed) {
    console.log("\n💡 Run showQueries(true) for detailed view");
  }
};

// ============================================================================
// 4. SHOW FULL QUERY TEXT
// ============================================================================
window.showQuery = (index) => {
  if (index < 1 || index > window.capturedQueries.length) {
    console.error("❌ Invalid index. Use 1 to", window.capturedQueries.length);
    return;
  }

  const query = window.capturedQueries[index - 1];
  console.log(`%c\n📝 QUERY #${index} - ${query.type}`, "color: cyan; font-weight: bold");
  console.log(`Time: ${query.timestamp}`);
  console.log(`Has people/assignee: ${query.hasPeople ? "✅ YES" : "❌ NO"}`);
  console.log("\n--- Full Query ---");
  console.log(query.query);

  return query;
};

// ============================================================================
// 5. CHECK RECOIL STATE (if Recoil DevTools available)
// ============================================================================
window.checkRecoilState = () => {
  console.log("%c\n⚛️  CHECKING RECOIL STATE...", "color: cyan; font-weight: bold");

  // Try to access Recoil state through window
  if (window.$recoilDebugStates) {
    console.log("✅ Recoil state accessible");
    console.log(window.$recoilDebugStates);
  } else {
    console.log("⚠️  Recoil state not directly accessible");
    console.log("💡 Install Recoil DevTools extension for better state inspection");
    console.log("   https://chrome.google.com/webstore/detail/recoil-dev-tools/");
  }

  // Check for React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log("✅ React DevTools detected");
  }
};

// ============================================================================
// 6. CHECK APOLLO CACHE
// ============================================================================
window.checkApolloCache = () => {
  console.log("%c\n🗄️  CHECKING APOLLO CACHE...", "color: cyan; font-weight: bold");

  // Try to find Apollo Client instance
  const apolloCache = window.__APOLLO_CLIENT__?.cache;

  if (apolloCache) {
    console.log("✅ Apollo cache found");
    console.log("Cache data:", apolloCache.data);

    // Try to find task records
    const cacheData = apolloCache.extract();
    const taskKeys = Object.keys(cacheData).filter(k => k.includes("task") || k.includes("Task"));

    console.log(`\n📊 Found ${taskKeys.length} task-related cache entries`);
    if (taskKeys.length > 0) {
      console.log("Sample keys:", taskKeys.slice(0, 5));
    }
  } else {
    console.log("⚠️  Apollo cache not directly accessible");
    console.log("💡 Cache might be encapsulated in React component tree");
  }
};

// ============================================================================
// 7. INSPECT TABLE DATA
// ============================================================================
window.inspectTableData = () => {
  console.log("%c\n📋 INSPECTING TABLE DATA...", "color: cyan; font-weight: bold");

  // Find table rows
  const rows = document.querySelectorAll("[data-testid*='row'], [role='row']");
  console.log(`Found ${rows.length} table rows (including header)`);

  // Try to find cells with relationship data
  const peopleCells = document.querySelectorAll("[data-field-name*='people'], [data-field-name*='assignee']");
  console.log(`Found ${peopleCells.length} people/assignee cells`);

  if (peopleCells.length > 0) {
    console.log("\n--- Sample People Cells ---");
    Array.from(peopleCells).slice(0, 3).forEach((cell, i) => {
      console.log(`Cell ${i + 1}:`, {
        textContent: cell.textContent.trim(),
        innerHTML: cell.innerHTML.substring(0, 100),
        isEmpty: !cell.textContent.trim()
      });
    });
  }

  // Check for empty cells that should have data
  const emptyCells = Array.from(peopleCells).filter(c => !c.textContent.trim());
  if (emptyCells.length > 0) {
    console.log(`\n⚠️  Found ${emptyCells.length} empty people/assignee cells`);
    console.log("💡 This indicates missing data!");
  }
};

// ============================================================================
// 8. FULL DIAGNOSTIC
// ============================================================================
window.fullDiagnostic = () => {
  console.clear();
  console.log("%c╔════════════════════════════════════════╗", "color: blue; font-weight: bold");
  console.log("%c║      FULL DIAGNOSTIC REPORT           ║", "color: blue; font-weight: bold");
  console.log("%c╚════════════════════════════════════════╝", "color: blue; font-weight: bold");

  // 1. Columns
  const colResult = window.checkVisibleColumns();

  // 2. Queries
  window.showQueries(false);

  // 3. Table data
  window.inspectTableData();

  // 4. Cache
  window.checkApolloCache();

  // 5. Summary
  console.log("\n%c═══════════════════════════════════════", "color: blue");
  console.log("%c📊 DIAGNOSTIC SUMMARY", "color: yellow; font-weight: bold");
  console.log("%c═══════════════════════════════════════", "color: blue");

  console.log("\n🔍 Issue Indicators:");

  if (!colResult.hasPeople) {
    console.log("❌ People field NOT in visible columns → Data not fetched");
  } else {
    console.log("✅ People field IS visible");
  }

  if (window.queryStats.withPeople === 0) {
    console.log("❌ NO queries fetching people/assignee field");
  } else {
    console.log(`✅ ${window.queryStats.withPeople} queries include people/assignee`);
  }

  console.log("\n💡 Recommended Actions:");
  console.log("1. If field not visible: Add 'People' or 'Assignee' column to table view");
  console.log("2. Check queries with: showQueries(true)");
  console.log("3. Inspect specific query: showQuery(N)");
  console.log("4. Navigate to task detail and back, then run fullDiagnostic() again");

  return {
    columnsVisible: colResult.hasPeople,
    totalQueries: window.queryStats.total,
    queriesWithPeople: window.queryStats.withPeople
  };
};

// ============================================================================
// 9. CLEAR CAPTURED DATA
// ============================================================================
window.clearDebugData = () => {
  window.capturedQueries = [];
  window.queryStats = { total: 0, withPeople: 0, withAssignee: 0 };
  console.log("✅ Debug data cleared");
};

// ============================================================================
// 10. HELP
// ============================================================================
window.debugHelp = () => {
  console.log("%c\n📚 AVAILABLE COMMANDS", "color: yellow; font-weight: bold");
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  COMMAND                      │  DESCRIPTION                       ║
╠═══════════════════════════════════════════════════════════════════╣
║  fullDiagnostic()             │  Run complete diagnostic report    ║
║  checkVisibleColumns()        │  Check which columns are visible   ║
║  showQueries()                │  Show recent GraphQL queries       ║
║  showQueries(true)            │  Show queries with details         ║
║  showQuery(N)                 │  Show full text of query #N        ║
║  inspectTableData()           │  Inspect table DOM elements        ║
║  checkRecoilState()           │  Check Recoil state (if available) ║
║  checkApolloCache()           │  Check Apollo cache                ║
║  clearDebugData()             │  Clear captured query data         ║
║  debugHelp()                  │  Show this help message            ║
╚═══════════════════════════════════════════════════════════════════╝

💡 RECOMMENDED WORKFLOW:
   1. Run: fullDiagnostic()
   2. Navigate through the app (table → detail → back)
   3. Run: fullDiagnostic() again
   4. Compare query differences with: showQueries(true)
   5. If needed, inspect specific query: showQuery(N)
  `);
};

// ============================================================================
// AUTO-RUN ON LOAD
// ============================================================================
console.log("\n✅ Debug script loaded successfully!");
console.log("%c💡 Run: debugHelp() to see available commands", "color: yellow; font-weight: bold");
console.log("%c🚀 Run: fullDiagnostic() to start debugging", "color: green; font-weight: bold");

// Auto-check on load
setTimeout(() => {
  console.log("\n%c⏰ Auto-checking visible columns...", "color: gray");
  window.checkVisibleColumns();
}, 1000);
