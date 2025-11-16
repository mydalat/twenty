# Twenty CRM - Complete File Paths Reference

## Quick Navigation

All paths are absolute from `/home/user/twenty` directory.

---

## State Management Files

### Recoil Store (Record Data)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts
Lines 4-10: Atom definition
Lines 1-11: Full file
```

### Field Value Selector
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts
Lines 14-31: Main selector get logic
Lines 30-86: Full selector
```

### Record Store Hooks
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/hooks/useUpsertRecordsInStore.ts
Lines 7-30: Hook implementation

/home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/hooks/useRecordFieldValue.tsx
Lines 6-23: Hook implementation
```

---

## GraphQL Query Generation

### Table Visible Fields (CRITICAL)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts
Lines 20-89: Complete hook
Lines 42-49: Critical field selection logic
Lines 78-87: Return statement with field list
```

### Find Many Records Query Generator
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/utils/generateFindManyRecordsQuery.ts
Lines 11-60: Query generation
Lines 42-48: Field mapping
```

### Depth Field Generation
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromObject.ts
Lines 11-23: Hook wrapper

/home/user/twenty/packages/twenty-front/src/modules/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields.ts
Lines 19-80: Field depth generation
Lines 63-78: Relation field handling
```

### Detail View Query Factory
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/graphql/operations/factories/findOneRecordForShowPageOperationSignatureFactory.ts
Lines 12-56: Factory function
Lines 24-28: Critical depth:1 generation
Lines 29-40: Task-specific field handling
```

### Field Metadata Mapping
```
/home/user/twenty/packages/twenty-front/src/modules/object-metadata/utils/mapObjectMetadataToGraphQLQuery.ts
Lines 25-174: Main mapping function
Lines 134-142: Field filtering logic
Lines 149-168: Field mapping
```

---

## Visible Fields State Management

### Visible Record Fields Selector (ROOT CAUSE)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts
Lines 9-68: Complete selector
Lines 23-62: Filter logic - THIS IS WHERE "people" gets filtered out
Lines 25-26: isVisible check
Lines 64-67: Return sorted visible fields
```

### Component Record Fields State
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/currentRecordFieldsComponentState.ts
Location of state holding field visibility flags
```

---

## Relationship Field Display Components

### RelationToOneFieldDisplay (Single Relation)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationToOneFieldDisplay.tsx
Lines 8-37: Component
Lines 14-19: Critical null check - returns null if fieldValue undefined
```

### RelationFromManyFieldDisplay (Multiple Relations)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/RelationFromManyFieldDisplay.tsx
Lines 26-142: Component
Lines 42-44: Early null checks
Lines 66-123: Main rendering logic
```

### Display Hooks
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useRelationToOneFieldDisplay.ts
Lines 17-76: Hook
Lines 38-42: Critical useRecordFieldValue call

/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useRelationFromManyFieldDisplay.ts
Location of the from-many display hook
```

---

## Record Fetching Hooks

### Find Many Records Hook
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts
Lines 31-131: Complete hook
Lines 48-52: recordGqlFields passed to query generation
Lines 88-101: Apollo useQuery execution
```

### Find Many Records Query Hook
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecordsQuery.ts
Lines 12-43: Hook
Lines 31-38: Query generation with recordGqlFields
```

### Find One Record Hook (Detail View)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindOneRecord.ts
Lines 16-89: Complete hook
Lines 34-38: Depth field generation
Lines 56-71: Apollo useQuery execution
```

### Find One Record Query Hook
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindOneRecordQuery.ts
Location of the query hook
```

---

## Table Components

### Main RecordTable Component
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-table/components/RecordTable.tsx
Lines 19-91: Main component

/home/user/twenty/packages/twenty-front/src/modules/object-record/record-table/components/RecordTableContent.tsx
Main table content rendering
```

### Record Index Table Query
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-index/hooks/useRecordIndexTableQuery.ts
Lines 7-34: Critical table query hook
Lines 16-18: useRecordsFieldVisibleGqlFields call
Lines 20-25: useFindManyRecords call with recordGqlFields
```

### Table Row Component
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-table/record-table-row/components/RecordTableRow.tsx
Row rendering component

/home/user/twenty/packages/twenty-front/src/modules/object-record/record-table/record-table-cell/components/RecordTableCell.tsx
Cell rendering component
```

---

## Record Show (Detail View)

### RecordShowEffect (Fetches Detail Data)
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/components/RecordShowEffect.tsx
Lines 16-57: Complete component
Lines 23-27: Query factory call
Lines 29-34: useFindOneRecord execution
Lines 36-48: Recoil store update
Lines 50-54: useEffect that updates Recoil
```

### Find One Record For Show Page Factory
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/graphql/operations/factories/findOneRecordForShowPageOperationSignatureFactory.ts
Lines 12-56: Factory
Lines 24-28: generateDepthRecordGqlFieldsFromObject with depth:1
```

---

## Key Hooks for Debugging

### Data Fetching Flow
1. useRecordIndexTableQuery
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-index/hooks/useRecordIndexTableQuery.ts

2. useRecordsFieldVisibleGqlFields
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts
   Note: THIS IS WHERE VISIBLE FIELDS ARE DETERMINED

3. useFindManyRecords
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts

4. useFindManyRecordsQuery
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/hooks/useFindManyRecordsQuery.ts

### Display Flow
1. RelationToOneFieldDisplay / RelationFromManyFieldDisplay
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/display/components/

2. useRelationToOneFieldDisplay / useRelationFromManyFieldDisplay
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/

3. useRecordFieldValue
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/hooks/useRecordFieldValue.tsx

4. recordStoreFieldValueSelector
   Location: /home/user/twenty/packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts

---

## Task-Specific Files

### Task Type Definition
```
/home/user/twenty/packages/twenty-front/src/modules/activities/types/Task.ts
Type definition with assignee and taskTargets
```

### Task Row Component (Activity View)
```
/home/user/twenty/packages/twenty-front/src/modules/activities/tasks/components/TaskRow.tsx
Lines 77-148: Task row rendering
Uses ActivityTargetsInlineCell instead of relationship field
```

### Task Layout Configuration
```
/home/user/twenty/packages/twenty-front/src/modules/object-record/record-show/layouts/task-record-layout.ts
Layout definition for task detail view
```

---

## Configuration & Metadata

### Object Metadata Queries
```
/home/user/twenty/packages/twenty-front/src/modules/object-metadata/graphql/queries.ts
GraphQL queries for metadata
```

### Field Metadata Type
```
/home/user/twenty/packages/twenty-front/src/modules/object-metadata/types/FieldMetadataItem.ts
Field metadata definition including relation info
```

### Object Metadata States
```
/home/user/twenty/packages/twenty-front/src/modules/object-metadata/states/objectMetadataItemsState.ts
All object metadata loaded into Recoil

/home/user/twenty/packages/twenty-front/src/modules/object-metadata/states/objectMetadataItemByIdSelector.ts
Selector for finding object metadata by ID
```

---

## Testing & Debugging Files

### Debug Script
```
/home/user/twenty/debug-script.js
Browser console debug script
Run checkVisibleColumns(), showQueries(), fullDiagnostic()
```

### Mock Data
```
/home/user/twenty/packages/twenty-front/src/testing/mock-data/tasks.ts
Mock task data for testing
```

---

## Directory Structure Map

```
/home/user/twenty/packages/twenty-front/src/modules/
├── object-record/                    # Main record management
│   ├── record-store/                 # Recoil store for records
│   │   ├── states/
│   │   │   ├── recordStoreFamilyState.ts
│   │   │   └── selectors/
│   │   │       └── recordStoreFieldValueSelector.ts
│   │   └── hooks/
│   │       ├── useRecordFieldValue.tsx
│   │       └── useUpsertRecordsInStore.ts
│   │
│   ├── record-field/                 # Field management
│   │   ├── hooks/
│   │   │   └── useRecordsFieldVisibleGqlFields.ts  ← CRITICAL
│   │   ├── states/
│   │   │   └── visibleRecordFieldsComponentSelector.ts  ← ROOT CAUSE
│   │   └── ui/meta-types/
│   │       ├── display/components/
│   │       │   ├── RelationToOneFieldDisplay.tsx
│   │       │   └── RelationFromManyFieldDisplay.tsx
│   │       └── hooks/
│   │           ├── useRelationToOneFieldDisplay.ts
│   │           └── useRelationFromManyFieldDisplay.ts
│   │
│   ├── record-table/                 # Table rendering
│   │   ├── components/
│   │   │   ├── RecordTable.tsx
│   │   │   └── RecordTableContent.tsx
│   │   ├── record-table-row/
│   │   ├── record-table-cell/
│   │   └── record-table-body/
│   │
│   ├── record-index/                 # Table index/list view
│   │   └── hooks/
│   │       └── useRecordIndexTableQuery.ts  ← TABLE QUERY ORCHESTRATION
│   │
│   ├── record-show/                  # Detail/show view
│   │   ├── components/
│   │   │   └── RecordShowEffect.tsx  ← DETAIL VIEW FETCHING
│   │   └── graphql/operations/factories/
│   │       └── findOneRecordForShowPageOperationSignatureFactory.ts
│   │
│   ├── hooks/                        # Record fetching hooks
│   │   ├── useFindManyRecords.ts
│   │   ├── useFindManyRecordsQuery.ts
│   │   ├── useFindOneRecord.ts
│   │   └── useFindOneRecordQuery.ts
│   │
│   └── graphql/record-gql-fields/    # GraphQL field generation
│       └── utils/
│           ├── generateDepthRecordGqlFieldsFromObject.ts
│           └── generateDepthRecordGqlFieldsFromFields.ts
│
├── object-metadata/                  # Metadata management
│   ├── states/
│   │   └── objectMetadataItemsState.ts
│   └── utils/
│       └── mapObjectMetadataToGraphQLQuery.ts
│
└── activities/                       # Activity/task management
    └── tasks/
        ├── types/Task.ts
        └── components/TaskRow.tsx
```

---

## Quick Search Patterns

To find related files, search for:

### Field visibility filtering:
```
grep -r "isVisible" /home/user/twenty/packages/twenty-front/src/modules/object-record
```

### GraphQL field generation:
```
grep -r "generateDepthRecordGqlFields" /home/user/twenty/packages/twenty-front/src/modules
```

### Relationship display components:
```
grep -r "RelationToOneFieldDisplay\|RelationFromManyFieldDisplay" /home/user/twenty/packages/twenty-front/src/modules
```

### Recoil record store usage:
```
grep -r "recordStoreFamilyState" /home/user/twenty/packages/twenty-front/src/modules
```

### Table query execution:
```
grep -r "useRecordIndexTableQuery\|useRecordsFieldVisibleGqlFields" /home/user/twenty/packages/twenty-front/src/modules
```

---

## Summary

The bug is primarily caused by these two files working together:

1. **Visible Fields Selector** (ROOT CAUSE)
   Location: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/states/visibleRecordFieldsComponentSelector.ts`
   Line 25: `if (!recordFieldToFilter.isVisible) return false;`

2. **Table Query Hook**
   Location: `/home/user/twenty/packages/twenty-front/src/modules/object-record/record-field/hooks/useRecordsFieldVisibleGqlFields.ts`
   Lines 42-49: Only visible fields used for GraphQL query

Result: If "people" field not marked visible in table → not fetched → component displays nothing

Fix location: Either mark "people" as visible in table, or modify `useRecordsFieldVisibleGqlFields.ts` to always include certain relationship fields regardless of visibility.
