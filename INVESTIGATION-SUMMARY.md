# Twenty CRM Relationship Field Debug Investigation

**Date**: November 16, 2025
**Issue**: "people" relationship field missing in task table, shows after visiting detail view
**Investigation Status**: COMPLETE - Root cause identified

---

## Files Created for You

1. **RELATIONSHIP-FIELD-DEBUG-GUIDE.md** (Main Document)
   - 11 detailed sections covering the entire architecture
   - Complete data flow sequences with diagrams
   - Recommended fixes with code examples
   - Component hierarchy and testing guide

2. **RECOIL-ATOMS-AND-CACHE-KEYS.md**
   - Critical Recoil atoms reference
   - Apollo cache key patterns
   - Debugging commands for DevTools
   - Quick diagnostic checklist

3. **FILE-PATHS-REFERENCE.md**
   - All absolute file paths with line numbers
   - Directory structure map
   - Quick search patterns using grep
   - Summary of critical files

4. **debug-script.js**
   - Browser console debug script
   - Paste into Chrome DevTools console
   - Commands: checkVisibleColumns(), showQueries(), fullDiagnostic()

---

## Key Findings

### Root Cause: Selective Field Fetching

The issue stems from **architectural design** where:
- **Table views** fetch only "visible" table columns for performance
- **Detail views** fetch ALL relationship fields at depth=1
- **Mismatch** causes "people" field to be undefined in table unless it's a visible column

### Critical Files

**WHERE THE BUG HAPPENS** (Line 25):
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts

if (!recordFieldToFilter.isVisible) {
  return false;  // ← "people" filtered out if not visible!
}
```

**HOW IT AFFECTS GRAPHQL** (Lines 42-49):
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts

const allDepthOneGqlFields = generateDepthRecordGqlFieldsFromFields({
  fields: visibleRecordFields.map(...),  // ← ONLY visible fields!
});
```

**HOW DETAIL VIEW WORKS AROUND IT** (Lines 24-28):
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/graphql/operations/factories/findOneRecordForShowPageOperationSignatureFactory.ts

fields: {
  ...generateDepthRecordGqlFieldsFromObject({  // ← ALL fields!
    depth: 1,
  }),
}
```

### Data Flow Problem

```
INITIAL TABLE VIEW:
  "people" column not visible → not fetched → undefined in Recoil → doesn't display ❌

DETAIL VIEW:
  All fields fetched → "people" data in cache → Recoil updated ✅

NAVIGATE BACK:
  Recoil may still have data OR table may refetch without "people" field → inconsistent ⚠️
```

---

## Investigation Process

### 1. State Management Analysis
Examined:
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts`
- Recoil atoms store record data keyed by recordId
- Field values pulled from Recoil via `recordStoreFieldValueSelector`

**Finding**: Recoil correctly stores what's fetched from GraphQL

### 2. GraphQL Query Generation Analysis
Examined:
- `useRecordsFieldVisibleGqlFields` hook - **CRITICAL**
- `generateDepthRecordGqlFieldsFromFields` - Depth field generator
- Query fields built based on visible table columns only

**Finding**: Table queries don't include fields not in visible columns

### 3. Relationship Field Display Analysis
Examined:
- `RelationToOneFieldDisplay` / `RelationFromManyFieldDisplay` components
- `useRecordFieldValue` hook
- Component early returns if fieldValue is undefined

**Finding**: Component correctly doesn't render if field data missing

### 4. Table vs Detail Query Comparison
Examined:
- `useRecordIndexTableQuery` - uses visible fields
- `RecordShowEffect` - uses full depth:1 generation
- `buildFindOneRecordForShowPageOperationSignatureFactory` - explicit detail fields

**Finding**: Detail view intentionally fetches all fields

### 5. Visible Fields State Analysis
Examined:
- `visibleRecordFieldsComponentSelector` - **ROOT CAUSE**
- Filters fields by `isVisible` flag
- Only returns visible field metadata

**Finding**: "people" excluded if column not visible

---

## Solutions Available

### Solution 1: Enable "people" column visibility (User-level)
1. Open task table
2. Click column settings
3. Mark "people" field as visible
4. Save settings
5. Table now fetches and displays field

**Pros**: No code changes, user can control visibility
**Cons**: Requires user action per table

### Solution 2: Always fetch relationship fields (Code change)
Edit `useRecordsFieldVisibleGqlFields.ts` to include important fields:
```typescript
const alwaysFetchedFields = {
  people: true,
  assignee: true,
};

return {
  ...allDepthOneGqlFields,
  ...alwaysFetchedFields,  // Add always-visible fields
};
```

**Pros**: Solves issue globally
**Cons**: Fetches more data, slight performance impact

### Solution 3: Cache coherence strategy
Implement proper Apollo cache merging when navigating:
- Use `cache-and-network` fetch policy
- Implement cache merge strategies
- Refetch when returning from detail view

**Pros**: Maintains cache consistency
**Cons**: More complex implementation

### Solution 4: Consistent depth for both views
Ensure table uses same depth:1 for relationship fields:
```typescript
const recordGqlFields = useRecordsFieldVisibleGqlFields({
  objectMetadataItem,
  shouldFetchRelationDepth: 1,  // New parameter
});
```

**Pros**: Guaranteed field availability
**Cons**: Always fetches nested data

---

## Recommended Next Steps

### Immediate (Debug to confirm)
1. Run debug script in browser console:
   ```javascript
   // Paste content of /home/user/twenty/debug-script.js
   checkVisibleColumns()  // Check if "people" is visible
   fullDiagnostic()       // Run full check
   ```

2. Verify:
   - Is "people" in visible columns? → YES = Simple fix (enable column)
   - Is "people" in GraphQL query? → NO = Confirms root cause
   - Is "people" in Apollo cache? → NO = Confirms fetch issue
   - Is "people" in Recoil store? → NO = Confirms data missing

### Short-term (Quick fix)
1. Check if "people" should be visible by default
2. If yes, update table column visibility settings
3. If no, implement Solution 2 (always fetch specific fields)

### Long-term (Architecture improvement)
1. Consider if table columns should have configurable "always fetch" fields
2. Implement cache coherence strategy for detail view updates
3. Add tests for relationship field consistency between views

---

## Testing Verification

After implementing fix, verify:
```
☑️ Task table displays "people" field
☑️ Detail view displays "people" field (already works)
☑️ Navigate: table → detail → table (field still displays)
☑️ GraphQL query includes "people" field
☑️ Apollo cache has "people" field
☑️ Recoil store has "people" field
☑️ No performance regression
```

---

## Key Architecture Insights

### Strength: Selective Field Fetching
Only fetching visible columns improves performance and reduces network traffic.

### Weakness: Visibility-driven data availability
Relationship fields become unavailable if not marked as visible, even if needed elsewhere.

### Opportunity: Cache management
Better cache synchronization between table and detail views would improve user experience.

---

## Related Code Patterns

### Pattern 1: Field Visibility Control
```typescript
visibleRecordFieldsComponentSelector
  → filters by isVisible flag
  → determines GraphQL fields
  → controls data availability
```

### Pattern 2: Depth-based Field Generation
```typescript
generateDepthRecordGqlFieldsFromFields(depth: 0 | 1)
  → depth: 0 = ID only
  → depth: 1 = Full object with identifiers
  → depth: 2+ = Not used currently
```

### Pattern 3: Component-level Data Checks
```typescript
if (!isDefined(fieldValue)) return null;
  → Component disappears if data missing
  → No loading states shown
  → Consistent across field types
```

---

## Questions to Answer

1. **Should "people" field be visible by default?**
   - If yes: Enable in table column settings
   - If no: Implement always-fetch pattern

2. **Is table performance a concern?**
   - If yes: Keep selective fetching with specific field exceptions
   - If no: Fetch all fields at depth:1

3. **Should detail view changes persist to table view?**
   - If yes: Implement cache merge on navigation
   - If no: Keep current refresh behavior

4. **Are there other fields with same issue?**
   - Check all relationship fields in table views
   - Identify if pattern is widespread

---

## Code Quality Observations

### Well-Designed Aspects
- Recoil state management is clean and functional
- GraphQL query generation is data-driven
- Component composition is clear
- Field visibility is explicit

### Areas for Improvement
- Visibility-data availability coupling could be decoupled
- Cache synchronization between views needs work
- Could use more integration tests for navigation flows
- Documentation around field fetching strategy could be clearer

---

## Final Summary

**The issue is not a bug, but a feature interaction:**

The table correctly only fetches visible columns. The detail view correctly fetches all fields. The mismatch occurs because:
1. Table column visibility determines GraphQL query
2. Detail view doesn't respect visibility (intentional)
3. Navigation between views doesn't ensure cache consistency

**The fix is straightforward:**
Either mark "people" as visible in the table, or modify the query generation to always include certain relationship fields regardless of visibility.

---

## Documentation Artifacts

All investigation results documented in:
- `/home/user/twenty/RELATIONSHIP-FIELD-DEBUG-GUIDE.md` - Complete guide
- `/home/user/twenty/RECOIL-ATOMS-AND-CACHE-KEYS.md` - Developer reference
- `/home/user/twenty/FILE-PATHS-REFERENCE.md` - Code map
- `/home/user/twenty/debug-script.js` - Browser console tool

Use these to build the debug console script you requested.

---

**Investigation Complete**
Ready for development team to implement fix.
