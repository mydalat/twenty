# Twenty CRM: Recoil Atoms & Apollo Cache Keys Reference

## Critical Recoil Atoms

### 1. Record Store (Main Data Storage)

**Atom Path**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts`

```typescript
// Access in React DevTools Profiler or with Recoil debugging:
recordStoreFamilyState(recordId)
// Example: recordStoreFamilyState("task-uuid-123")

// Structure:
{
  id: "task-uuid-123",
  name: "Buy milk",
  people: [...],        // This is what's missing!
  assignee: {...},
  taskTargets: [...],
  // ... all other fields
}
```

**How to Inspect**:
```javascript
// In Chrome DevTools console (with Recoil extension):
1. Open React DevTools Profiler
2. Look for "recordStoreFamilyState" in Recoil values
3. Check the specific recordId you're debugging
4. Look for "people" field - should be undefined if bug present
```

### 2. Record Loading State

**Atom Path**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordLoadingFamilyState.ts`

```typescript
recordLoadingFamilyState(recordId)
// Returns: boolean indicating if record is loading
```

### 3. Visible Record Fields

**Selector Path**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts`

```typescript
// Returns array of visible field metadata
// This determines which fields go into GraphQL query
[
  { fieldMetadataItemId: "...", isVisible: true },
  { fieldMetadataItemId: "...", isVisible: true },
  // NO "people" field if not marked visible!
]
```

**How to Inspect**:
```javascript
// Check if "people" is in the visible fields list
// If not, that's the root cause!
```

### 4. Field Value Selector (Derived State)

**Selector Path**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts`

```typescript
recordStoreFieldValueSelector({
  recordId: "task-uuid-123",
  fieldName: "people",
  fieldDefinition: { type: "RELATION", metadata: {...} }
})
// Returns: undefined if not fetched, or array if available
```

### 5. Current Record Fields (Component Instance State)

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/currentRecordFieldsComponentState.ts`

```typescript
currentRecordFieldsComponentState.atomFamily({
  instanceId: "table-instance-id"
})
// Contains all fields for a table instance with visibility flags
```

## Apollo Cache Keys

### 1. Task Records Cache Entry

**Pattern**: `Task:{"id":"<uuid>"}`

```javascript
// In Apollo DevTools:
// Search for: Task:{"id":"<your-task-id>"}
// Expected structure:
{
  __typename: "Task",
  id: "task-uuid-123",
  name: "Buy milk",
  people: [{...}],    // Should be here in cache!
  // ... other fields
}
```

**If bug present**: The cache entry won't have "people" field

### 2. FindMany Query Cache

**Pattern**: `FindManyTasks(...)`

```javascript
// Full cache key includes query parameters
// Look in Apollo DevTools under "Queries" tab
// Check if query result includes "people" field

// If visible columns don't include people:
// Query: { id, name, ... } - NO people
// Cache: Task records without people field
```

### 3. FindOne Record Cache

**Pattern**: `Task:{"id":"<uuid>"}`

```javascript
// After viewing detail view, cache should update
// Same key but with complete data:
{
  __typename: "Task",
  id: "task-uuid-123",
  name: "Buy milk",
  people: [{        // ✅ Should be present after detail view
    __typename: "Person",
    id: "person-uuid",
    name: "John Doe",
    avatarUrl: "...",
  }],
  taskTargets: [...]
}
```

## Debugging Commands

### Check if field is in visible columns

```javascript
// In Chrome Console (after injecting debug script):
checkVisibleColumns()

// Output: List of visible column names
// Look for "people" - if not there, that's the bug!
```

### Inspect specific record in Recoil

```javascript
// Using Recoil DevTools or console:
// 1. Find the record ID (from table or detail view URL)
// 2. Check Recoil state for that record

// Example - in Recoil Profiler:
recordStoreFamilyState("task-uuid-123")
// Should show all fields including "people"
// If "people" is undefined, it wasn't fetched
```

### Inspect Apollo cache

```javascript
// Using Apollo DevTools extension:
// 1. Open Apollo DevTools
// 2. Go to "Cache" tab
// 3. Search for your task ID
// 4. Expand the record
// 5. Look for "people" field

// Or in console:
window.__APOLLO_STATE__ // If exposed
// Search for your task ID in the cache
```

### Monitor GraphQL queries

```javascript
// Using the debug script:
showQueries()
// Shows all captured GraphQL queries
// Look for "people" field in query strings
```

## State Flow for "people" Field

### Ideal Flow (Field Visible)

```
GraphQL Query:
  { tasks { id, name, people { id, name, avatar } } }
     ✅ "people" included
         ↓
Apollo Cache:
  Task { people: [...] }
     ✅ Has people data
         ↓
Recoil Store:
  recordStoreFamilyState(id).people = [...]
     ✅ Has people data
         ↓
Component:
  useRecordFieldValue returns people array
     ✅ Renders RecordChip components
         ↓
Display: SHOWS PEOPLE ✅
```

### Actual Flow (Field Not Visible - Bug)

```
GraphQL Query:
  { tasks { id, name } }
     ❌ "people" NOT included (not visible column)
         ↓
Apollo Cache:
  Task { id, name }
     ❌ No people data
         ↓
Recoil Store:
  recordStoreFamilyState(id).people = undefined
     ❌ No people data
         ↓
Component:
  useRecordFieldValue returns undefined
     ❌ Component returns null early
         ↓
Display: NOTHING ❌
```

### After Detail View (Misleading)

```
Detail View GraphQL:
  { task { id, name, people { ... }, taskTargets, ... } }
     ✅ All fields including people
         ↓
Apollo Cache:
  Task { people: [...], taskTargets: [...], ... }
     ✅ Has all data
         ↓
Recoil Store:
  recordStoreFamilyState(id).people = [...]
     ✅ Updated with people data
         ↓
Back to Table:
  Table may use Recoil cached value
  OR might refetch (which won't include people)
         ↓
Display: SOMETIMES SHOWS ⚠️ (inconsistent!)
```

## Key Files for Inspection

### 1. Recoil Atom Definition
`/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts`

Look for:
- Atom key: `'recordStoreFamilyState'`
- Type: `ObjectRecord | null | undefined`

### 2. Visible Fields Selector
`/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts`

Look for:
- Filter: `if (!recordFieldToFilter.isVisible) return false;`
- This is where "people" gets filtered out!

### 3. Field Value Selector
`/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts`

Look for:
- Line 31: `return get(recordStoreFamilyState(recordId))?.[fieldName];`
- If fieldName doesn't exist in recordStoreFamilyState, returns undefined

### 4. Query Field Generator
`/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts`

Look for:
- Line 44-46: Maps only visible field metadata
- Line 42-49: `generateDepthRecordGqlFieldsFromFields` called with visible fields ONLY

### 5. Display Component
`/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationToOneFieldDisplay.tsx`

Look for:
- Line 14-19: `if (!isDefined(fieldValue)) return null;`
- This is where the component disappears if field is undefined

## Quick Diagnostic Checklist

```
1. Check table columns:
   [ ] Open table column settings
   [ ] Is "people" marked as visible?
   [ ] If NO → ROOT CAUSE FOUND
   
2. Check GraphQL query:
   [ ] Open DevTools Network tab
   [ ] Find GraphQL request for tasks
   [ ] Does query include "people" field?
   [ ] If NO → Confirms "people" not in visible columns
   
3. Check Recoil state:
   [ ] Use Recoil DevTools extension
   [ ] Find recordStoreFamilyState(recordId)
   [ ] Does record have "people" field?
   [ ] If NO → Wasn't fetched by GraphQL
   
4. Check Apollo cache:
   [ ] Use Apollo DevTools extension
   [ ] Find Task cache entry
   [ ] Does it have "people" field?
   [ ] If NO → Wasn't in GraphQL response
   
5. Check component render:
   [ ] Open React DevTools
   [ ] Find RelationToOneFieldDisplay component
   [ ] Check props for fieldValue
   [ ] If undefined → Component returns null
```

## Solution Verification

After implementing fix, verify:

```
✅ "people" appears in visible columns list
✅ "people" field appears in GraphQL query
✅ "people" field appears in Apollo cache
✅ "people" field appears in Recoil store
✅ Component receives defined fieldValue
✅ RecordChip renders the people
✅ Display is consistent in table and detail view
```

---

## Example GraphQL Queries

### Current (Bug) - Without "people"

```graphql
query FindManyTasks($filter: TaskFilterInput, $orderBy: [TaskOrderByInput]) {
  tasks(filter: $filter, orderBy: $orderBy) {
    edges {
      node {
        __typename
        id
        name
        status
        dueAt
        assignee {
          id
          name
        }
        taskTargets {
          id
        }
        createdAt
        updatedAt
      }
    }
  }
}
```

### Fixed - With "people"

```graphql
query FindManyTasks($filter: TaskFilterInput, $orderBy: [TaskOrderByInput]) {
  tasks(filter: $filter, orderBy: $orderBy) {
    edges {
      node {
        __typename
        id
        name
        status
        dueAt
        assignee {
          id
          name
        }
        people {          # ✅ ADDED
          id
          name
          avatarUrl
        }
        taskTargets {
          id
        }
        createdAt
        updatedAt
      }
    }
  }
}
```

---

## Recoil DevTools Extension

To install and use Recoil DevTools:

1. **Chrome**: Install "Recoil DevTools" extension from Chrome Web Store
2. **Firefox**: Install via Mozilla Add-ons
3. Open DevTools → "Recoil" tab
4. View all atom/selector values in real-time
5. Change values to test behavior
6. View dependency graph

Key things to check:
- `recordStoreFamilyState` → find your task ID → look for "people" field
- `visibleRecordFieldsComponentSelector` → see which fields are visible
- Track state changes as you navigate table ↔ detail

---

## Summary

The debug process:
1. Check if "people" is in **visible columns** (most likely cause)
2. Check if "people" is in **GraphQL query** 
3. Check if "people" is in **Apollo cache**
4. Check if "people" is in **Recoil store**
5. Check if **component receives defined fieldValue**

If "people" is missing at any step, that's where to focus the fix.
