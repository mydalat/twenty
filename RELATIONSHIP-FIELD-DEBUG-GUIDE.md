# Twenty CRM Frontend Architecture: Relationship Field Display Issue

## Executive Summary

**Issue**: The "people" relationship field doesn't display in the task table but shows correctly after clicking into the detail view and navigating back.

**Root Cause**: The table view only fetches relationship fields that are marked as "visible" in the current table columns. The detail view fetches ALL relationship fields regardless of visibility. This mismatch causes the field to be missing initially but appear after visiting the detail view.

---

## 1. STATE MANAGEMENT ARCHITECTURE

### Recoil Store (Record Storage)

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts` (Line 4-10)

```typescript
export const recordStoreFamilyState = createFamilyState<
  ObjectRecord | null | undefined,
  string
>({
  key: 'recordStoreFamilyState',
  defaultValue: null,
});
```

**How it works**:
- Each record (by ID) has its own Recoil atom: `recordStoreFamilyState(recordId)`
- Stores complete ObjectRecord data including all relationship fields
- Updated whenever GraphQL returns new data or detail view fetches more complete record

**Critical Code Path**:
1. Records fetched via GraphQL → Apollo Client Cache
2. Apollo updates → Recoil Store (via useHandleFindManyRecordsCompleted)
3. Field values read from: `recordStoreFamilyState(recordId)[fieldName]`

### Field Value Selector

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts` (Line 14-87)

```typescript
export const recordStoreFieldValueSelector = selectorFamily({
  key: 'recordStoreFieldValueSelector',
  get: ({ recordId, fieldName, fieldDefinition }) => ({ get }) => {
    // For regular relations:
    return get(recordStoreFamilyState(recordId))?.[fieldName];
    
    // For morph relations: complex logic handling multiple object types
  },
});
```

**Key Insight**: Returns `undefined` if field wasn't fetched from GraphQL

---

## 2. GRAPHQL QUERY GENERATION

### Table View: Selective Field Fetching

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts` (Line 20-89)

**Critical Logic** (Lines 42-49):
```typescript
const allDepthOneGqlFields = generateDepthRecordGqlFieldsFromFields({
  objectMetadataItems,
  fields: visibleRecordFields.map(
    (field) =>
      fieldMetadataItemByFieldMetadataItemId[field.fieldMetadataItemId],
  ),
  depth: 1,
});
```

**What this does**:
1. Gets `visibleRecordFields` from `visibleRecordFieldsComponentSelector`
2. Maps only visible field metadata items
3. Calls `generateDepthRecordGqlFieldsFromFields` with ONLY visible fields
4. Result: Only relationship fields in visible table columns get fetched

**Impact**: If "people" field isn't a visible table column → Not in GraphQL query → Field is `undefined` in Recoil store

### Detail View: Complete Field Fetching

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/graphql/operations/factories/findOneRecordForShowPageOperationSignatureFactory.ts` (Line 12-56)

**Critical Logic** (Lines 24-28):
```typescript
fields: {
  ...generateDepthRecordGqlFieldsFromObject({
    objectMetadataItem,
    objectMetadataItems,
    depth: 1,
  }),
  // ... additional task-specific fields
}
```

**What this does**:
1. Calls `generateDepthRecordGqlFieldsFromObject` with the entire ObjectMetadataItem
2. `depth: 1` means all relationship fields are included
3. All fields are fetched regardless of visibility
4. Special handling for Task: explicit `taskTargets` field with full structure

**Impact**: Detail view includes ALL relationship fields → "people" field is fetched → Recoil store updated with complete data

### Depth Field Generation Logic

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields.ts` (Line 19-80)

**For Relations**:
- If `depth: 1`: Fetches field with identifiers (id, label, image)
- If `depth: 0`: Only fetches the ID reference (`fieldNameId`)
- `shouldOnlyLoadRelationIdentifiers: true` (default): Limits nested data

---

## 3. RELATIONSHIP FIELD DISPLAY COMPONENTS

### Component Rendering Flow

```
RelationToOneFieldDisplay / RelationFromManyFieldDisplay
  ↓
useRelationToOneFieldDisplay / useRelationFromManyFieldDisplay
  ↓
useRecordFieldValue hook
  ↓
recordStoreFieldValueSelector
  ↓
recordStoreFamilyState(recordId)[fieldName]
  ↓
If undefined → Component returns null (no render)
If defined → Renders RecordChip components
```

### RelationToOneFieldDisplay Component

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationToOneFieldDisplay.tsx` (Line 8-37)

```typescript
export const RelationToOneFieldDisplay = () => {
  const { fieldValue, fieldDefinition, generateRecordChipData } =
    useRelationToOneFieldDisplay();

  // CRITICAL: If fieldValue is undefined, returns null (no render)
  if (!isDefined(fieldValue)) {
    return null;
  }

  return <RecordChip record={fieldValue} />;
};
```

**Key Point**: Line 14-19 shows early return if `fieldValue` is undefined

### useRelationToOneFieldDisplay Hook

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useRelationToOneFieldDisplay.ts` (Line 17-76)

```typescript
export const useRelationToOneFieldDisplay = () => {
  const { recordId, fieldDefinition } = useContext(FieldContext);

  const fieldValue = useRecordFieldValue<ObjectRecord | undefined>(
    recordId,
    fieldName,
    fieldDefinition,
  );

  // Returns fieldValue from Recoil store
  return {
    fieldValue,
    fieldDefinition,
    // ... other props
  };
};
```

**Dependency Chain**:
1. `useRecordFieldValue` → reads from Recoil
2. Recoil returns `recordStoreFamilyState(recordId)[fieldName]`
3. If GraphQL query didn't include field → Recoil has undefined
4. Component doesn't render

---

## 4. TABLE QUERY EXECUTION

### Table Query Hook

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-index/hooks/useRecordIndexTableQuery.ts` (Line 7-34)

```typescript
export const useRecordIndexTableQuery = (objectNameSingular: string) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });

  // CRITICAL: Gets only visible fields
  const recordGqlFields = useRecordsFieldVisibleGqlFields({
    objectMetadataItem,
  });

  const { records, loading } = useFindManyRecords({
    objectNameSingular,
    recordGqlFields,  // Only visible fields!
    // ... other params
  });
};
```

**Flow**:
1. `useRecordsFieldVisibleGqlFields` builds query fields
2. Passes to `useFindManyRecords` hook
3. `useFindManyRecords` calls Apollo `useQuery` with these fields
4. Result: Only visible fields fetched from server

### Find Many Records Hook

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts` (Line 31-131)

```typescript
export const useFindManyRecords = ({
  objectNameSingular,
  recordGqlFields,
  // ... other params
}) => {
  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular,
    recordGqlFields,  // These determine what fields are in the query
  });

  const { data, loading, error } = useQuery(
    findManyRecordsQuery,
    { /* Apollo options */ }
  );
};
```

**Key**: `recordGqlFields` parameter controls what data is fetched

---

## 5. VISIBLE FIELDS STATE

### Visible Record Fields Selector

**File**: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts` (Line 9-68)

```typescript
export const visibleRecordFieldsComponentSelector = createComponentSelector({
  get: ({ instanceId }) => ({ get }) => {
    const currentRecordFields = get(
      currentRecordFieldsComponentState.atomFamily({ instanceId })
    );

    // FILTER: Only fields with isVisible = true
    const filteredVisibleAndReadableRecordFields = currentRecordFields.filter(
      (recordFieldToFilter) => {
        if (!recordFieldToFilter.isVisible) {
          return false;  // EXCLUDE non-visible fields
        }
        // ... additional checks
        return isReadable && isActive;
      },
    );
  },
});
```

**Critical Filtering**:
- Line 25: `if (!recordFieldToFilter.isVisible) { return false; }`
- Only fields marked as visible are included
- Table columns visibility directly controls GraphQL query

---

## 6. DATA FLOW SEQUENCES

### Sequence 1: Initial Table View (Bug Occurs)

```
1. User navigates to task table
   ↓
2. useRecordIndexTableQuery executed
   ↓
3. visibleRecordFieldsComponentSelector returns only visible field metadata
   ↓
4. useRecordsFieldVisibleGqlFields called
   ↓
5. generateDepthRecordGqlFieldsFromFields called with ONLY visible fields
   ↓
6. If "people" field not visible:
   - GraphQL query: { id, name, ... } WITHOUT people
   - NOT: { id, name, people { ... } }
   ↓
7. useFindManyRecords → useQuery executes
   ↓
8. Apollo fetches data WITHOUT people field
   ↓
9. Apollo cache: { id: "123", name: "Task 1" }
   ↓
10. Recoil store: recordStoreFamilyState("123") = { id, name }
    people field is UNDEFINED
    ↓
11. Component tries to render: RelationToOneFieldDisplay
    ↓
12. useRecordFieldValue returns undefined
    ↓
13. Component checks: if (!isDefined(fieldValue)) return null
    ↓
14. NOTHING RENDERS ❌
```

### Sequence 2: Navigating to Detail View

```
1. User clicks task row to open detail view
   ↓
2. RecordShowEffect component mounts
   ↓
3. buildFindOneRecordForShowPageOperationSignatureFactory called
   ↓
4. generateDepthRecordGqlFieldsFromObject called with depth: 1
   ↓
5. Generates fields for ALL object fields (not just visible)
   ↓
6. GraphQL query includes: people { id, name, avatar, ... }
   ↓
7. useFindOneRecord → useQuery executes
   ↓
8. Apollo fetches complete record WITH people field
   ↓
9. Apollo cache: { id: "123", name: "Task 1", people: { ... } }
   ↓
10. RecordShowEffect useEffect triggered (line 50-54)
    ↓
11. setRecordStore callback executed
    ↓
12. Recoil updated: recordStoreFamilyState("123").people = { ... }
    ↓
13. Detail view renders RelationFromManyFieldDisplay
    ↓
14. useRecordFieldValue returns people array
    ↓
15. People field RENDERS CORRECTLY ✅
```

### Sequence 3: Navigate Back to Table

```
1. User closes detail view, returns to table
   ↓
2. Recoil store still has: recordStoreFamilyState("123").people = { ... }
   ✅ (from detail view update)
   ↓
3. BUT table may re-execute useRecordIndexTableQuery
   ↓
4. If it refetches (depends on Apollo cache policy):
   ↓
5. Same flow as Sequence 1 happens
   ↓
6. Table queries WITHOUT people field
   ↓
7. Apollo cache might be updated with partial data (without people)
   ↓
8. Recoil gets updated from Apollo cache
   ↓
9. recordStoreFamilyState("123").people becomes undefined again
   ↓
10. PEOPLE FIELD DISAPPEARS ❌
    (or shows if Recoil hasn't been refreshed)
```

---

## 7. KEY FILES TO INSPECT

### State Management
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts` - Recoil atom for records
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts` - Field value getter

### Query Generation
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts` - Table field selector
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields.ts` - Depth field generator
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/graphql/operations/factories/findOneRecordForShowPageOperationSignatureFactory.ts` - Detail view query factory

### Display Components
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationToOneFieldDisplay.tsx` - Single relation display
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationFromManyFieldDisplay.tsx` - Multiple relation display
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useRelationToOneFieldDisplay.ts` - Display logic

### Record Fetching
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts` - Table record fetch
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindOneRecord.ts` - Detail record fetch
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-index/hooks/useRecordIndexTableQuery.ts` - Table query orchestration

### Visibility State
- `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts` - Visible fields selector

---

## 8. DEBUGGING WITH CONSOLE SCRIPT

### Using the Debug Script

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Paste the content from `/home/user/twenty/debug-script.js`
4. Run these commands:

```javascript
// Check which columns are visible
checkVisibleColumns()

// View all GraphQL queries being executed
showQueries()

// Run full diagnostic
fullDiagnostic()
```

### What the script does:
- Monitors all GraphQL queries
- Checks if "people" field is included
- Lists all visible table columns
- Provides recommendations

---

## 9. ROOT CAUSE SUMMARY

### The Bug in 3 Points:

1. **Table fetches only visible fields** - if "people" not a table column, it's not fetched
2. **Detail view fetches all fields** - always includes "people" regardless of visibility
3. **Cache/state mismatch** - Recoil store gets stale data when navigating between views

### Why it appears to work after detail view:
- Detail view update populates Recoil with complete record data
- Recoil store now has "people" field value
- If table doesn't refresh from Apollo cache, it still shows the data
- But it's inconsistent and depends on timing

---

## 10. RECOMMENDED FIXES

### Fix 1: Always fetch relationship fields (Recommended)

Modify `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts`:

```typescript
// Add relationship fields that should always be fetched
const alwaysFetchedFields = {
  people: true,  // Add any fields that should always be in table
  assignee: true,
};

return {
  // ... existing fields
  ...allDepthOneGqlFields,
  ...alwaysFetchedFields,  // Always include these
};
```

### Fix 2: Mark field as visible in table settings

1. User goes to table column settings
2. Enables "people" field as visible
3. Field then gets fetched and displayed

### Fix 3: Cache coherence strategy

Ensure Apollo cache properly merges data when navigating:
- Use `cache-and-network` fetch policy
- Implement cache merge strategies
- Refetch when navigating back to table

### Fix 4: Field depth consistency

Ensure both views use consistent depth for fetching:
```typescript
// Table should also fetch depth: 1 for relationship fields
const recordGqlFields = useRecordsFieldVisibleGqlFields({
  objectMetadataItem,
  shouldFetchRelationDepth: 1,  // New param
});
```

---

## 11. TESTING THE FIX

After implementing fix:

1. View task table
2. "people" field displays (or doesn't, if not visible - which is correct)
3. Click into task detail
4. Navigate back to table
5. "people" field display is consistent

---

## Appendix: Component Hierarchy

```
RecordTable
├── RecordTableContent
│   └── RecordTableBody
│       └── RecordTableRow
│           └── RecordTableCell
│               └── RecordTableCellFieldInput / RecordTableCellDisplayMode
│                   └── FieldDisplay
│                       └── RelationToOneFieldDisplay / RelationFromManyFieldDisplay
│                           ├── useRelationToOneFieldDisplay (Hook)
│                           │   └── useRecordFieldValue
│                           │       └── recordStoreFieldValueSelector
│                           │           └── recordStoreFamilyState(recordId)
│                           └── RecordChip
```

---

## Summary

The issue is fundamentally about **selective field fetching in table views**. The architecture is correct - tables should only fetch visible fields for performance. However, the "people" field needs to be either:

1. Marked as visible in the table, OR
2. Always included in fetches, OR  
3. Properly maintained in Apollo cache across navigations

The fact that it displays after viewing the detail confirms the field exists and the display component works - it's purely a data fetching/visibility issue.
