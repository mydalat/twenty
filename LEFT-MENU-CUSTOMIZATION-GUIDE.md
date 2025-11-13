# LEFT MENU CUSTOMIZATION GUIDE - Twenty CRM

Hướng dẫn chi tiết cách custom menu bên trái (Left Navigation Drawer) trong Twenty CRM.

---

## 📋 **CẤU TRÚC MENU**

Menu bên trái có **3 phần chính**:

```
┌─────────────────────────────┐
│ WORKSPACE NAME              │ ← Header
├─────────────────────────────┤
│ 🔍 Search                   │ ← Fixed Items (Top)
│ ✨ Ask AI                   │
│ ⚙️  Settings                │
├─────────────────────────────┤
│ OPENED                      │ ← Scrollable Section 1
│  📄 Current Object          │
├─────────────────────────────┤
│ FAVORITES (Optional)        │ ← Scrollable Section 2
│  📁 Folder 1                │
│    🔗 Favorite View 1       │
│    🔗 Favorite Record 1     │
├─────────────────────────────┤
│ WORKSPACE                   │ ← Scrollable Section 3
│  👤 People                  │ ← Standard Objects
│  🏢 Companies               │   (Fixed Order)
│  💰 Opportunities           │
│  ✅ Tasks                   │
│  📝 Notes                   │
│  📦 Custom Object 1         │ ← Custom Objects
│  📦 Custom Object 2         │   (By Created Date)
├─────────────────────────────┤
│ REMOTE                      │ ← Scrollable Section 4
│  🔗 External Table 1        │   (Integrations)
├─────────────────────────────┤
│ ❓ Support                  │ ← Fixed Items (Bottom)
└─────────────────────────────┘
```

---

## 🗂️ **FILE STRUCTURE**

### **Frontend Components:**

```
packages/twenty-front/src/modules/navigation/components/
├── MainNavigationDrawer.tsx                    # Main wrapper
├── MainNavigationDrawerFixedItems.tsx          # Search, AI, Settings
└── MainNavigationDrawerScrollableItems.tsx     # Dynamic items

packages/twenty-front/src/modules/object-metadata/components/
├── NavigationDrawerOpenedSection.tsx                     # "Opened" section
├── NavigationDrawerSectionForObjectMetadataItems.tsx    # Object list renderer
├── NavigationDrawerItemForObjectMetadataItem.tsx        # Individual item
└── RemoteNavigationDrawerSection.tsx                     # Remote objects

packages/twenty-front/src/modules/favorites/components/
├── WorkspaceFavorites.tsx                      # Favorites section
└── CurrentWorkspaceMemberFavoritesFolders.tsx  # Favorites folders
```

### **Backend Models:**

```
packages/twenty-server/src/modules/
├── favorite/standard-objects/favorite.workspace-entity.ts
├── favorite-folder/standard-objects/favorite-folder.workspace-entity.ts
└── [object]/standard-objects/[object].workspace-entity.ts
```

---

## 🎯 **4 CÁCH CUSTOM MENU**

---

## ✅ **CÁCH 1: THÊM CUSTOM OBJECT** (Tự Động Xuất Hiện)

### **Khi tạo custom object mới → tự động xuất hiện trong menu!**

### **Qua UI:**

1. Vào **Settings → Objects → + New Object**
2. Điền thông tin:
   - Name Singular: `Product`
   - Name Plural: `Products`
   - Icon: `IconPackage`
   - Label Singular: `Product`
   - Label Plural: `Products`
3. Click **Save**

→ **Tự động** xuất hiện trong menu section "WORKSPACE"!

### **Qua Code (Backend):**

#### **File:** `packages/twenty-server/src/modules/product/standard-objects/product.workspace-entity.ts`

```typescript
import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.product, // Generate new UUID
  namePlural: 'products',
  labelSingular: msg`Product`,
  labelPlural: msg`Products`,
  description: msg`A product`,
  icon: 'IconPackage', // ← Icon hiển thị trong menu
  shortcut: 'D', // ← Keyboard shortcut (optional)
})
export class ProductWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`Product name`,
    icon: 'IconAbc',
  })
  name: string;

  @WorkspaceField({
    type: FieldMetadataType.CURRENCY,
    label: msg`Price`,
    description: msg`Product price`,
    icon: 'IconCurrencyDollar',
  })
  price: number;
}
```

#### **Sync Metadata:**

```bash
npx nx run twenty-server:command workspace:sync-metadata
```

→ Object mới xuất hiện trong menu!

### **Vị Trí:**

- Standard objects (Person, Company, Opportunity, Task, Note): **Thứ tự cố định**
- Custom objects: **Sắp xếp theo thời gian tạo** (mới nhất ở dưới)

**Source:** `packages/twenty-front/src/modules/object-metadata/components/NavigationDrawerSectionForObjectMetadataItems.tsx:54-61`

```typescript
const sortedCustomObjectMetadataItems = [...objectMetadataItems]
  .filter((item) => !ORDERED_STANDARD_OBJECTS.includes(item.nameSingular))
  .sort((objectMetadataItemA, objectMetadataItemB) => {
    return new Date(objectMetadataItemA.createdAt) <
      new Date(objectMetadataItemB.createdAt)
      ? 1
      : -1;
  });
```

---

## ✅ **CÁCH 2: REORDER STANDARD OBJECTS**

### **Thay đổi thứ tự Person, Company, Opportunity, Task, Note**

#### **File:** `packages/twenty-front/src/modules/object-metadata/components/NavigationDrawerSectionForObjectMetadataItems.tsx`

**Tìm dòng 12-18:**

```typescript
const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Company,
  CoreObjectNameSingular.Opportunity,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Note,
];
```

### **Example: Đổi thứ tự**

```typescript
const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Company,      // 1. Company lên đầu
  CoreObjectNameSingular.Opportunity,  // 2. Opportunity
  CoreObjectNameSingular.Person,       // 3. Person
  CoreObjectNameSingular.Task,         // 4. Task
  CoreObjectNameSingular.Note,         // 5. Note
];
```

### **Example: Thêm custom object vào fixed order**

Nếu bạn muốn Product luôn ở vị trí cố định (không theo created date):

```typescript
const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Company,
  CoreObjectNameSingular.Opportunity,
  'product',                           // ← Thêm custom object
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Note,
];
```

### **Rebuild Frontend:**

```bash
npx nx build twenty-front
# hoặc restart dev server
npx nx start twenty-front
```

---

## ✅ **CÁCH 3: THÊM CUSTOM FIXED ITEMS** (Search, Settings, etc.)

### **Thêm custom menu item cố định ở top hoặc bottom**

#### **File:** `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerFixedItems.tsx`

**Current code (dòng 38-71):**

```typescript
export const MainNavigationDrawerFixedItems = () => {
  const navigate = useNavigate();
  const { t } = useLingui();
  const isAiEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_AI_ENABLED);

  return (
    !isMobile && (
      <>
        <NavigationDrawerItem
          label={t`Search`}
          Icon={IconSearch}
          onClick={openRecordsSearchPage}
          keyboard={['/']}
        />
        {isAiEnabled && (
          <NavigationDrawerItem
            label={t`Ask AI`}
            Icon={IconSparkles}
            onClick={() => openAskAIPage()}
            keyboard={['@']}
          />
        )}
        <NavigationDrawerItem
          label={t`Settings`}
          to={getSettingsPath(SettingsPath.ProfilePage)}
          onClick={() => navigate(getSettingsPath(SettingsPath.ProfilePage))}
          Icon={IconSettings}
        />
      </>
    )
  );
};
```

### **Example 1: Thêm "Reports" item**

```typescript
import { IconChartBar } from 'twenty-ui/display';

export const MainNavigationDrawerFixedItems = () => {
  const navigate = useNavigate();
  const { t } = useLingui();
  const isAiEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_AI_ENABLED);

  return (
    !isMobile && (
      <>
        <NavigationDrawerItem
          label={t`Search`}
          Icon={IconSearch}
          onClick={openRecordsSearchPage}
          keyboard={['/']}
        />
        {isAiEnabled && (
          <NavigationDrawerItem
            label={t`Ask AI`}
            Icon={IconSparkles}
            onClick={() => openAskAIPage()}
            keyboard={['@']}
          />
        )}
        {/* ← THÊM MỚI */}
        <NavigationDrawerItem
          label={t`Reports`}
          Icon={IconChartBar}
          to="/reports"
          keyboard={['R']}
        />
        <NavigationDrawerItem
          label={t`Settings`}
          to={getSettingsPath(SettingsPath.ProfilePage)}
          onClick={() => navigate(getSettingsPath(SettingsPath.ProfilePage))}
          Icon={IconSettings}
        />
      </>
    )
  );
};
```

### **Example 2: Thêm "Analytics" với external link**

```typescript
import { IconChartLine } from 'twenty-ui/display';

<NavigationDrawerItem
  label={t`Analytics`}
  Icon={IconChartLine}
  onClick={() => window.open('https://analytics.yourcompany.com', '_blank')}
  keyboard={['A']}
/>
```

### **Example 3: Thêm item với badge (notification count)**

```typescript
<NavigationDrawerItem
  label={t`Notifications`}
  Icon={IconBell}
  to="/notifications"
  rightOptions={
    <Badge variant="danger" size="sm">
      5
    </Badge>
  }
/>
```

---

## ✅ **CÁCH 4: MANAGE FAVORITES** (Qua UI hoặc API)

### **Favorites xuất hiện trong menu section "WORKSPACE"**

### **4.1. Qua UI:**

#### **Favorite một Object View:**

1. Vào object page (e.g., `/objects/companies`)
2. Click vào View dropdown
3. Chọn view muốn favorite
4. Click ⭐ icon bên cạnh view name
5. → View xuất hiện trong menu!

#### **Favorite một Record:**

1. Vào record detail page (e.g., `/object/company/uuid`)
2. Click ⭐ icon ở header
3. → Record xuất hiện trong menu!

#### **Tạo Favorite Folder:**

1. Right-click vào "FAVORITES" section
2. Click "New Folder"
3. Đặt tên folder
4. Drag & drop favorites vào folder

### **4.2. Qua GraphQL API:**

#### **Tạo Favorite:**

```graphql
mutation CreateOneFavorite($data: FavoriteCreateInput!) {
  createOneFavorite(data: $data) {
    id
    position
    viewId
    companyId
    personId
  }
}
```

**Variables:**

```json
{
  "data": {
    "position": 0,
    "viewId": "view-uuid-here",
    "forWorkspaceMemberId": "workspace-member-uuid"
  }
}
```

#### **Favorite một Record (Company):**

```json
{
  "data": {
    "position": 0,
    "companyId": "company-uuid-here",
    "forWorkspaceMemberId": "workspace-member-uuid"
  }
}
```

#### **Delete Favorite:**

```graphql
mutation DeleteOneFavorite($id: ID!) {
  deleteOneFavorite(id: $id) {
    id
  }
}
```

#### **Reorder Favorites (Update Position):**

```graphql
mutation UpdateOneFavorite($id: ID!, $data: FavoriteUpdateInput!) {
  updateOneFavorite(id: $id, data: $data) {
    id
    position
  }
}
```

**Variables:**

```json
{
  "id": "favorite-uuid",
  "data": {
    "position": 5
  }
}
```

#### **List All Favorites:**

```graphql
query FindManyFavorites {
  favorites(orderBy: { position: AscNullsFirst }) {
    edges {
      node {
        id
        position
        viewId
        companyId
        personId
        taskId
        noteId
        opportunityId
        forWorkspaceMember {
          id
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
}
```

---

## 🗂️ **FAVORITE DATABASE STRUCTURE**

### **Favorite Entity:**

**File:** `packages/twenty-server/src/modules/favorite/standard-objects/favorite.workspace-entity.ts`

```typescript
export class FavoriteWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({ type: FieldMetadataType.NUMBER })
  position: number; // ← Order trong menu

  // Relations (chỉ 1 trong các này được set)
  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  forWorkspaceMember: Relation<WorkspaceMemberWorkspaceEntity>; // ← Owner

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  person: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  company: Relation<CompanyWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  opportunity: Relation<OpportunityWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  task: Relation<TaskWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  note: Relation<NoteWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  dashboard: Relation<DashboardWorkspaceEntity> | null;

  @WorkspaceRelation({ type: RelationType.MANY_TO_ONE })
  favoriteFolder: Relation<FavoriteFolderWorkspaceEntity> | null;

  @WorkspaceField({ type: FieldMetadataType.UUID })
  viewId: string; // ← View favorite

  @WorkspaceDynamicRelation({ type: RelationType.MANY_TO_ONE })
  custom: Relation<CustomWorkspaceEntity>; // ← Custom object favorite
}
```

---

## 🎨 **ADVANCED CUSTOMIZATION**

### **1. Thay đổi Icon cho Standard Objects**

Không thể thay đổi icon qua UI, phải sửa backend entity:

#### **File:** `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`

```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.company,
  namePlural: 'companies',
  labelSingular: msg`Company`,
  labelPlural: msg`Companies`,
  description: msg`A company`,
  icon: 'IconBuildingSkyscraper', // ← Đổi icon ở đây
  shortcut: 'C',
})
export class CompanyWorkspaceEntity extends BaseWorkspaceEntity {
  // ...
}
```

**Available icons:** https://tabler-icons.io/

**Sync metadata:**

```bash
npx nx run twenty-server:command workspace:sync-metadata
```

### **2. Ẩn Standard Objects khỏi Menu**

#### **Option A: Set isActive = false (qua database)**

```sql
UPDATE "metadata"."objectMetadata"
SET "isActive" = false
WHERE "nameSingular" = 'note';
```

→ Note object biến mất khỏi menu!

#### **Option B: Filter trong frontend**

**File:** `NavigationDrawerSectionForObjectMetadataItems.tsx`

```typescript
const filteredObjectMetadataItems = objectMetadataItems.filter(
  (item) => item.nameSingular !== 'note' // ← Ẩn Note
);
```

### **3. Thêm Custom Section**

#### **File:** `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`

**Current code:**

```typescript
export const MainNavigationDrawerScrollableItems = () => {
  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <CurrentWorkspaceMemberFavoritesFolders />
      <WorkspaceFavorites />
      <RemoteNavigationDrawerSection />
    </StyledScrollableItemsContainer>
  );
};
```

**Thêm custom section:**

```typescript
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { IconTools, IconBook } from 'twenty-ui/display';

export const MainNavigationDrawerScrollableItems = () => {
  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <CurrentWorkspaceMemberFavoritesFolders />
      <WorkspaceFavorites />

      {/* ← CUSTOM SECTION MỚI */}
      <NavigationDrawerSection>
        <NavigationDrawerSectionTitle label="Tools" />
        <NavigationDrawerItem
          label="Admin Panel"
          Icon={IconTools}
          to="/admin"
        />
        <NavigationDrawerItem
          label="Documentation"
          Icon={IconBook}
          onClick={() => window.open('https://docs.yourcompany.com')}
        />
      </NavigationDrawerSection>

      <RemoteNavigationDrawerSection />
    </StyledScrollableItemsContainer>
  );
};
```

### **4. Conditional Items (Based on Permissions)**

```typescript
import { useRecoilValue } from 'recoil';
import { currentUserState } from '@/auth/states/currentUserState';

export const MainNavigationDrawerFixedItems = () => {
  const currentUser = useRecoilValue(currentUserState);
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <>
      <NavigationDrawerItem label={t`Search`} Icon={IconSearch} />

      {/* Chỉ admin mới thấy */}
      {isAdmin && (
        <NavigationDrawerItem
          label={t`Admin Dashboard`}
          Icon={IconShield}
          to="/admin"
        />
      )}

      <NavigationDrawerItem label={t`Settings`} Icon={IconSettings} />
    </>
  );
};
```

---

## 🔧 **TROUBLESHOOTING**

### **Object mới tạo không hiện trong menu**

**Nguyên nhân:**

- `isActive = false`
- `isSystem = true`
- Không có read permission

**Giải pháp:**

```sql
-- Check object status
SELECT "nameSingular", "isActive", "isSystem"
FROM "metadata"."objectMetadata"
WHERE "nameSingular" = 'product';

-- Enable object
UPDATE "metadata"."objectMetadata"
SET "isActive" = true, "isSystem" = false
WHERE "nameSingular" = 'product';
```

### **Menu item không có icon**

**Nguyên nhân:** Icon name không tồn tại

**Giải pháp:** Check available icons tại https://tabler-icons.io/

```typescript
icon: 'IconBuildingSkyscraper' // ✅ Đúng
icon: 'building-skyscraper'     // ❌ Sai (không có prefix Icon)
icon: 'IconInvalidName'         // ❌ Sai (icon không tồn tại)
```

### **Favorites không hiển thị**

**Nguyên nhân:**

- `viewId` hoặc `recordId` không hợp lệ
- `forWorkspaceMemberId` sai
- Object bị `isActive = false`

**Giải pháp:**

```graphql
query CheckFavorites {
  favorites {
    edges {
      node {
        id
        viewId
        companyId
        forWorkspaceMember {
          id
        }
      }
    }
  }
}
```

### **Menu order không đúng**

**Nguyên nhân:** Frontend cache hoặc stale state

**Giải pháp:**

```bash
# Clear browser cache
# Hard reload: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)

# Rebuild frontend
npx nx build twenty-front

# Restart dev server
npx nx start twenty-front
```

---

## 📊 **MENU RENDERING FLOW**

```
1. MainNavigationDrawer.tsx
   ↓
2. Fixed Items (Top)
   - Search
   - Ask AI (if enabled)
   - Settings
   ↓
3. Scrollable Items
   ↓
   3.1. NavigationDrawerOpenedSection
        - Current object (if not in favorites)
   ↓
   3.2. CurrentWorkspaceMemberFavoritesFolders
        - Favorite folders with nested items
   ↓
   3.3. WorkspaceFavorites
        - Favorite views/records
        - Rendered via NavigationDrawerSectionForObjectMetadataItems
   ↓
   3.4. NavigationDrawerSectionForObjectMetadataItems (WORKSPACE)
        ├── Standard Objects (ORDERED_STANDARD_OBJECTS)
        │   1. Person
        │   2. Company
        │   3. Opportunity
        │   4. Task
        │   5. Note
        └── Custom Objects (by createdAt DESC)
   ↓
   3.5. RemoteNavigationDrawerSection
        - Remote objects from integrations
   ↓
4. Fixed Items (Bottom)
   - Support dropdown
```

**Data Sources:**

- **ObjectMetadata** (database) → Object list
- **Favorite** (database) → Favorite items
- **View** (database) → Views per object
- **ORDERED_STANDARD_OBJECTS** (frontend constant) → Order

---

## 📚 **RELATED FILES**

| File | Purpose |
|------|---------|
| `MainNavigationDrawer.tsx` | Main wrapper component |
| `MainNavigationDrawerFixedItems.tsx` | Top fixed items (Search, AI, Settings) |
| `MainNavigationDrawerScrollableItems.tsx` | Dynamic scrollable section |
| `NavigationDrawerSectionForObjectMetadataItems.tsx` | Object list renderer + ORDER config |
| `NavigationDrawerItemForObjectMetadataItem.tsx` | Individual object item with views |
| `WorkspaceFavorites.tsx` | Favorites section |
| `favorite.workspace-entity.ts` | Favorite database model |
| `object-metadata.entity.ts` | Object metadata database model |

---

## ✅ **QUICK CHECKLIST**

### **Để thêm item vào menu:**

- [ ] **Custom Object:** Tạo WorkspaceEntity → sync metadata
- [ ] **Fixed Item:** Sửa `MainNavigationDrawerFixedItems.tsx`
- [ ] **Custom Section:** Sửa `MainNavigationDrawerScrollableItems.tsx`
- [ ] **Favorite:** Tạo favorite qua UI hoặc API

### **Để thay đổi order:**

- [ ] Sửa `ORDERED_STANDARD_OBJECTS` trong `NavigationDrawerSectionForObjectMetadataItems.tsx`
- [ ] Rebuild frontend

### **Để ẩn item:**

- [ ] Set `isActive = false` trong database
- [ ] Hoặc filter trong frontend code

---

## 🎯 **USE CASES**

### **1. Thêm "Products" object vào menu**

```typescript
// Backend: product.workspace-entity.ts
@WorkspaceEntity({
  standardId: 'product-uuid',
  namePlural: 'products',
  labelPlural: msg`Products`,
  icon: 'IconPackage',
})
export class ProductWorkspaceEntity extends BaseWorkspaceEntity {}
```

```bash
npx nx run twenty-server:command workspace:sync-metadata
```

→ Tự động xuất hiện!

### **2. Reorder: Companies lên đầu**

```typescript
// Frontend: NavigationDrawerSectionForObjectMetadataItems.tsx
const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Company,     // ← Lên đầu
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Opportunity,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Note,
];
```

### **3. Thêm "Reports" fixed item**

```typescript
// Frontend: MainNavigationDrawerFixedItems.tsx
<NavigationDrawerItem
  label={t`Reports`}
  Icon={IconChartBar}
  to="/reports"
  keyboard={['R']}
/>
```

### **4. Favorite top 5 customers**

```bash
# Via GraphQL API
for each customer in top5:
  createOneFavorite({
    companyId: customer.id,
    position: index,
    forWorkspaceMemberId: currentUser.id
  })
```

---

**Tạo bởi:** Claude Code
**Ngày:** 2025-11-13
**Version:** 1.0
