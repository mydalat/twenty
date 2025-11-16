# Twenty CRM Relationship Field - Comprehensive Debugging Guide

Created: November 16, 2025
Status: Complete investigation with ready-to-use debugging tools

---

## What You Have

Four comprehensive documents created to help you debug the "people" relationship field issue:

### 1. Main Investigation Report
**File**: `INVESTIGATION-SUMMARY.md`
**Read Time**: 10 minutes
**Purpose**: Quick overview of findings, root cause, and recommended solutions

**Contains**:
- Key findings summarized
- Root cause explanation
- 4 solution options
- Next steps to take

**Start Here** if you want a quick understanding of the issue.

---

### 2. Complete Architecture Guide
**File**: `RELATIONSHIP-FIELD-DEBUG-GUIDE.md`
**Read Time**: 30-45 minutes
**Purpose**: In-depth technical breakdown of the entire system

**Contains**:
- 11 detailed sections on state management, GraphQL, components, and display
- Complete data flow sequences with ASCII diagrams
- Full code snippets with line numbers
- Component render hierarchy
- 4 recommended fixes with implementation details
- Testing verification checklist

**Read this** when you need to understand every detail of how the system works.

---

### 3. Developer Reference
**File**: `RECOIL-ATOMS-AND-CACHE-KEYS.md`
**Read Time**: 15-20 minutes
**Purpose**: Quick lookup for Recoil atoms and Apollo cache keys

**Contains**:
- Critical Recoil atoms explained
- Apollo cache key patterns
- Debugging commands for Chrome DevTools
- State flow diagrams (ideal, actual, after detail view)
- Quick diagnostic checklist
- Example GraphQL queries (before/after fix)
- Recoil DevTools setup instructions

**Reference this** when inspecting state during development.

---

### 4. File Paths Reference
**File**: `FILE-PATHS-REFERENCE.md`
**Read Time**: 10-15 minutes
**Purpose**: Complete map of all relevant files with exact line numbers

**Contains**:
- All absolute file paths organized by category
- Line numbers for critical code sections
- Directory structure visualization
- Quick search patterns using grep
- Summary of root cause files
- Key hooks for debugging (data flow and display)

**Use this** for quick navigation to specific files.

---

### 5. Browser Debug Script
**File**: `debug-script.js`
**How to use**: 
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Paste the entire content
4. Run these commands:
   - `checkVisibleColumns()` - See which table columns are visible
   - `showQueries()` - View all captured GraphQL queries
   - `fullDiagnostic()` - Run complete diagnostic

**Purpose**: Monitor GraphQL queries and check table column visibility in real-time

---

## Quick Start: 5-Minute Overview

### The Issue
The "people" relationship field doesn't display in the task table but shows correctly after visiting the detail view.

### The Root Cause
The table view only fetches relationship fields that are marked as "visible" in the current table columns. The detail view fetches ALL relationship fields regardless of visibility. This creates a mismatch.

### The Fix (3 Options)
1. **Easiest**: Enable "people" column in table settings (user-level fix)
2. **Quick**: Always fetch "people" field in the GraphQL query generator
3. **Best**: Implement proper cache synchronization between views

### Critical Files
- **Root Cause**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts` (Line 25)
- **Fetching Logic**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts` (Lines 42-49)
- **Display Logic**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationToOneFieldDisplay.tsx` (Lines 14-19)

---

## How to Verify the Issue

### Step 1: Run Browser Debug Script
```javascript
// In Chrome DevTools console:
checkVisibleColumns()  // Does output include "people"?
```

**If "people" is NOT in visible columns** → That's your problem!

### Step 2: Check GraphQL Query
```javascript
// In Chrome DevTools console:
showQueries()  // Does any query include "people" field?
```

**If no query includes "people"** → Confirms it's not being fetched

### Step 3: Check Recoil Store
Install **Recoil DevTools** extension, then:
1. Open DevTools → "Recoil" tab
2. Find `recordStoreFamilyState`
3. Select your task ID
4. Look for "people" field
5. **If undefined** → It wasn't fetched

### Step 4: Check Apollo Cache
Install **Apollo DevTools** extension, then:
1. Open DevTools → "Apollo" tab
2. Go to "Cache" tab
3. Search for your task ID
4. Expand the record
5. **Look for "people" field** - should be there after detail view

---

## Navigation Guide

### If you want to...

**Understand the issue quickly**
→ Read: `INVESTIGATION-SUMMARY.md`

**Know how to fix it**
→ Read: `INVESTIGATION-SUMMARY.md` (Solutions section)

**Debug it yourself**
→ Use: `debug-script.js` + `RECOIL-ATOMS-AND-CACHE-KEYS.md`

**Understand the architecture**
→ Read: `RELATIONSHIP-FIELD-DEBUG-GUIDE.md`

**Find specific files**
→ Use: `FILE-PATHS-REFERENCE.md`

**Know what Recoil atoms are involved**
→ Reference: `RECOIL-ATOMS-AND-CACHE-KEYS.md`

**Inspect Apollo cache**
→ Reference: `RECOIL-ATOMS-AND-CACHE-KEYS.md` (Apollo Cache Keys section)

**See data flow diagrams**
→ Read: `RELATIONSHIP-FIELD-DEBUG-GUIDE.md` (Section 6) or `RECOIL-ATOMS-AND-CACHE-KEYS.md` (State Flow section)

---

## Implementation Paths

### Path 1: Enable Column (User-Level Fix)
**Time**: 2 minutes
**Steps**:
1. Open task table
2. Click column settings button
3. Find "people" field
4. Check "visible" checkbox
5. Save

**Verify**:
- People field shows in table
- Shows consistently across navigations

---

### Path 2: Always Fetch Field (Code Change)
**Time**: 15 minutes
**File to edit**: `useRecordsFieldVisibleGqlFields.ts`
**Changes**:
```typescript
// Add around line 87:
const alwaysFetchedFields = {
  people: true,
};

// Update return statement to include:
...alwaysFetchedFields,
```

**Verify**:
- GraphQL query includes "people"
- Recoil store has "people" field
- Component renders correctly

---

### Path 3: Cache Synchronization (Advanced)
**Time**: 1-2 hours
**Involves**:
- Apollo cache merge strategies
- Cache-and-network fetch policy
- RecordShowEffect updates
- Navigation hooks

**Reference**:
- `RELATIONSHIP-FIELD-DEBUG-GUIDE.md` (Fixes section)
- Apollo documentation for merge policies

---

## Testing Checklist

After implementing any fix:

```
[ ] Task table displays "people" field
[ ] Detail view displays "people" field (should already work)
[ ] Navigate: table → detail → table
    [ ] "people" field still visible in table
    [ ] Data is accurate
[ ] Open Chrome DevTools Network tab
    [ ] GraphQL query includes "people" field
    [ ] No errors in console
[ ] Check Recoil state
    [ ] "people" field has data (not undefined)
[ ] Check Apollo cache
    [ ] Task record has "people" field
[ ] Performance acceptable
    [ ] No UI lag or slowdowns
```

---

## File Summary

```
INVESTIGATION-SUMMARY.md
  └─ Executive summary, root cause, solutions
  
RELATIONSHIP-FIELD-DEBUG-GUIDE.md
  ├─ State management (Recoil)
  ├─ GraphQL query generation
  ├─ Relationship field display
  ├─ Table query execution
  ├─ Visible fields state
  ├─ Complete data flow sequences
  ├─ Key files to inspect
  └─ Recommended fixes
  
RECOIL-ATOMS-AND-CACHE-KEYS.md
  ├─ Recoil atoms reference
  ├─ Apollo cache keys
  ├─ Debugging commands
  ├─ State flow diagrams
  ├─ Quick diagnostic checklist
  └─ Example GraphQL queries
  
FILE-PATHS-REFERENCE.md
  ├─ All file paths with line numbers
  ├─ Directory structure map
  ├─ Search patterns
  └─ File summary
  
debug-script.js
  ├─ checkVisibleColumns()
  ├─ showQueries()
  └─ fullDiagnostic()
```

---

## Key Code Snippets

### Where "people" Gets Filtered Out
File: `visibleRecordFieldsComponentSelector.ts`, Line 25
```typescript
if (!recordFieldToFilter.isVisible) {
  return false;  // ← This is the filtering!
}
```

### How Table Fetches Fields
File: `useRecordsFieldVisibleGqlFields.ts`, Lines 42-49
```typescript
const allDepthOneGqlFields = generateDepthRecordGqlFieldsFromFields({
  fields: visibleRecordFields.map(...),  // Only visible!
  depth: 1,
});
```

### How Detail View Fetches All Fields
File: `findOneRecordForShowPageOperationSignatureFactory.ts`, Lines 24-28
```typescript
fields: {
  ...generateDepthRecordGqlFieldsFromObject({
    depth: 1,  // All fields!
  }),
}
```

### Why Component Doesn't Render
File: `RelationToOneFieldDisplay.tsx`, Lines 14-19
```typescript
if (!isDefined(fieldValue)) {
  return null;  // ← Disappears if undefined
}
```

---

## Contact / Questions

If you need to:
- **Understand specific architectural decision** → See `RELATIONSHIP-FIELD-DEBUG-GUIDE.md`
- **Debug state values** → Use `debug-script.js` + DevTools extensions
- **Find a file quickly** → Use `FILE-PATHS-REFERENCE.md`
- **See data flow** → See diagrams in `RELATIONSHIP-FIELD-DEBUG-GUIDE.md` or `RECOIL-ATOMS-AND-CACHE-KEYS.md`

---

## Next Steps

1. **Read**: `INVESTIGATION-SUMMARY.md` (5 min)
2. **Verify**: Run `debug-script.js` in browser (5 min)
3. **Choose**: Pick a solution path (1-2 hours)
4. **Implement**: Make the fix
5. **Test**: Run the verification checklist
6. **Deploy**: Push to production

---

**All documentation is in `/home/user/twenty/` directory**

Ready to debug! Use the guides above to navigate the Twenty CRM frontend architecture and resolve the relationship field display issue.
