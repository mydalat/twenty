# 🖼️ Hướng Dẫn: Hiển Thị Thumbnail Image Trong Twenty CRM

**3 Phương Án Hiển Thị Image Thumbnails**

---

## 📋 **TÓM TẮT FIELD TYPES**

Twenty CRM có **27 field types**, nhưng **KHÔNG có IMAGE type riêng**.

### **Field Types Available:**

```typescript
UUID, TEXT, PHONES, EMAILS, DATE_TIME, DATE, BOOLEAN,
NUMBER, NUMERIC, LINKS, CURRENCY, FULL_NAME, RATING,
SELECT, MULTI_SELECT, RELATION, MORPH_RELATION,
POSITION, ADDRESS, RAW_JSON, RICH_TEXT, RICH_TEXT_V2,
ACTOR, ARRAY, TS_VECTOR
```

**Image handling:**
- ❌ No dedicated IMAGE type
- ✅ TEXT field + imageIdentifier
- ✅ LINKS field (domain logos)
- ✅ Attachment relation

---

## ✅ **CÁCH 1: TEXT Field + Image Identifier** ⭐ RECOMMENDED

### **Concept:**

Dùng **TEXT field** lưu URL, đánh dấu là **image identifier** → Tự động hiển thị thumbnail.

### **Backend Code:**

```typescript
// File: your-object.workspace-entity.ts
import { WorkspaceEntity, WorkspaceField } from '...';
import { FieldMetadataType } from '...';

@WorkspaceEntity({
  standardId: 'your-object-id',
  namePlural: 'products',
  nameSingular: 'product',
  labelSingular: 'Product',
  labelPlural: 'Products',
  description: 'Product catalog',
  icon: 'IconBox',

  // ← Set image identifier here!
  imageIdentifierFieldMetadataName: 'imageUrl', // Field name
})
export class ProductWorkspaceEntity extends BaseWorkspaceEntity {

  @WorkspaceField({
    standardId: 'product-image-url',
    type: FieldMetadataType.TEXT,  // ← Just TEXT!
    label: 'Product Image',
    description: 'Product image URL',
    icon: 'IconPhoto',
  })
  imageUrl: string;

  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: 'Name',
  })
  name: string;

  @WorkspaceField({
    type: FieldMetadataType.CURRENCY,
    label: 'Price',
  })
  price: Currency;
}
```

### **Result:**

```
┌─────────────────────────────────────────┐
│ Products Table                          │
├───────────┬─────────────────┬───────────┤
│ Image     │ Name            │ Price     │
├───────────┼─────────────────┼───────────┤
│ [IMG 🖼️] │ Product A       │ $99.00    │
│ [IMG 🖼️] │ Product B       │ $149.00   │
│ [IMG 🖼️] │ Product C       │ $199.00   │
└───────────┴─────────────────┴───────────┘
    ↑
  Auto-generated thumbnail from imageUrl field!
```

### **Pros:**
✅ Zero frontend code needed
✅ Works everywhere (table, kanban, detail page)
✅ Automatic avatar display
✅ Handles broken images gracefully
✅ Mobile responsive

### **Cons:**
❌ Only ONE image identifier per object
❌ Fixed display style (avatar/chip)
❌ Can't have multiple image fields with thumbnails

---

## ✅ **CÁCH 2: LINKS Field (Domain Logo)**

### **Use Case:** Company logos from domain names

### **How it works:**

Twenty fetches company logos automatically from domain names using external service (Clearbit).

### **Backend Code:**

```typescript
// Company object
@WorkspaceField({
  type: FieldMetadataType.LINKS,  // ← LINKS type
  label: 'Domain Name',
})
domainName: LinksMetadata;

// No logo field needed!
```

### **Frontend Logic:**

```typescript
// packages/twenty-front/src/modules/object-metadata/utils/getLogoUrlFromDomainName.ts

export const getLogoUrlFromDomainName = (domainName: string) => {
  return `https://logo.clearbit.com/${domainName}`;
};
```

### **Example:**

```
Input:  domainName = "acme.com"
Output: Logo URL = "https://logo.clearbit.com/acme.com"
Result: [ACME LOGO] Acme Corp
```

### **Pros:**
✅ No manual upload needed
✅ Always up-to-date logos
✅ Works for any company domain

### **Cons:**
❌ Only for company domains
❌ Requires internet connection
❌ External dependency (Clearbit)
❌ Not applicable to custom objects

---

## ✅ **CÁCH 3: Attachment Relation**

### **Use Case:** Multiple images, file management

### **Backend Code:**

```typescript
// Your object
@WorkspaceEntity({...})
export class ProductWorkspaceEntity {

  @WorkspaceRelation({
    standardId: 'product-attachments',
    type: RelationMetadataType.ONE_TO_MANY,
    label: 'Images',
    description: 'Product images',
    icon: 'IconPhoto',
    inverseSideTarget: () => AttachmentWorkspaceEntity,
    inverseSideFieldKey: 'product',
  })
  images: Relation<AttachmentWorkspaceEntity[]>;
}
```

### **Attachment Entity:**

```typescript
// Built-in Attachment entity
export class AttachmentWorkspaceEntity {
  name: string;
  fullPath: string;
  type: string;

  @WorkspaceField({
    type: FieldMetadataType.SELECT,
    options: [
      { value: 'IMAGE', label: 'Image', color: 'blue' },
      { value: 'VIDEO', label: 'Video', color: 'purple' },
      // ...
    ]
  })
  fileCategory: string;
}
```

### **UI Display:**

```typescript
// Frontend: Display images
const { images } = useRecordData();

const imageAttachments = images.filter(
  att => att.fileCategory === 'IMAGE'
);

return (
  <ImageGallery>
    {imageAttachments.map(img => (
      <Thumbnail
        key={img.id}
        src={img.fullPath}
        onClick={() => openPreview(img)}
      />
    ))}
  </ImageGallery>
);
```

### **Pros:**
✅ Multiple images per record
✅ Full file management (upload, delete)
✅ Supports all file types
✅ Built-in preview modal
✅ File metadata (size, type, date)

### **Cons:**
❌ More complex setup
❌ Requires custom UI code
❌ Not automatic thumbnail in tables
❌ Storage management needed

---

## 🎨 **CÁCH 4: Custom Image Field Display (Advanced)**

### **Use Case:** Multiple image URL fields with custom display

### **Implementation:**

#### **Step 1: Backend (no changes needed)**

```typescript
// Just use TEXT fields
@WorkspaceField({
  type: FieldMetadataType.TEXT,
  label: 'Primary Image',
})
primaryImageUrl: string;

@WorkspaceField({
  type: FieldMetadataType.TEXT,
  label: 'Secondary Image',
})
secondaryImageUrl: string;
```

#### **Step 2: Frontend - Create Custom Display Component**

**File:** `/packages/twenty-front/src/modules/object-record/record-field/meta-types/display/components/ImageUrlFieldDisplay.tsx`

```typescript
import { useImageUrlFieldDisplay } from '../hooks/useImageUrlFieldDisplay';
import styled from '@emotion/styled';

const StyledImageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledThumbnail = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  object-fit: cover;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const StyledPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) => theme.background.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.font.color.light};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledUrl = styled.a`
  color: ${({ theme }) => theme.font.color.secondary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.font.size.sm};

  &:hover {
    text-decoration: underline;
  }
`;

export const ImageUrlFieldDisplay = () => {
  const { fieldValue } = useImageUrlFieldDisplay();
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!fieldValue) {
    return <StyledPlaceholder>No image</StyledPlaceholder>;
  }

  return (
    <>
      <StyledImageContainer>
        {!imageError ? (
          <StyledThumbnail
            src={fieldValue}
            alt="Thumbnail"
            onError={() => setImageError(true)}
            onClick={() => setShowPreview(true)}
          />
        ) : (
          <StyledPlaceholder>
            <IconPhoto />
          </StyledPlaceholder>
        )}
        <StyledUrl
          href={fieldValue}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          View image
        </StyledUrl>
      </StyledImageContainer>

      {showPreview && (
        <ImagePreviewModal
          imageUrl={fieldValue}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
```

#### **Step 3: Register in FieldDisplay**

**File:** `/packages/twenty-front/src/modules/object-record/record-field/meta-types/display/components/FieldDisplay.tsx`

```typescript
import { ImageUrlFieldDisplay } from './ImageUrlFieldDisplay';

export const FieldDisplay = () => {
  const { fieldDefinition } = useContext(FieldContext);

  // Check if field name suggests it's an image URL
  const isImageUrlField =
    fieldDefinition.metadata.fieldName.toLowerCase().includes('imageurl') ||
    fieldDefinition.metadata.fieldName.toLowerCase().includes('photourl') ||
    fieldDefinition.metadata.fieldName.toLowerCase().endsWith('url');

  if (fieldDefinition.type === FieldMetadataType.TEXT && isImageUrlField) {
    return <ImageUrlFieldDisplay />;
  }

  // ... existing code for other types
};
```

### **Pros:**
✅ Multiple image fields per object
✅ Custom display style
✅ Click to enlarge
✅ Fallback for broken images
✅ Link to view full image

### **Cons:**
❌ Requires custom code
❌ Need to maintain
❌ Naming convention dependency
❌ More complex than Option 1

---

## 📊 **SO SÁNH CÁC PHƯƠNG ÁN**

| Feature | TEXT + Identifier | LINKS | Attachment | Custom Display |
|---------|-------------------|-------|------------|----------------|
| **Complexity** | 🟢 Easy | 🟢 Easy | 🔴 Complex | 🟡 Medium |
| **Code needed** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Multiple images** | ❌ 1 only | ❌ 1 only | ✅ Yes | ✅ Yes |
| **Auto thumbnail** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **File upload** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Custom styling** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Best for** | Primary image | Company logos | Galleries | Multi-images |

---

## 🎯 **RECOMMENDATIONS**

### **Scenario 1: Object có 1 primary image (Product, Person, etc.)**

→ **Dùng Cách 1: TEXT + Image Identifier**

```typescript
@WorkspaceEntity({
  imageIdentifierFieldMetadataName: 'imageUrl',
})
export class ProductEntity {
  @WorkspaceField({ type: FieldMetadataType.TEXT })
  imageUrl: string;
}
```

**Why:** Zero code, works everywhere, perfect for main object image.

---

### **Scenario 2: Company/Organization với domain**

→ **Dùng Cách 2: LINKS Field**

```typescript
@WorkspaceField({ type: FieldMetadataType.LINKS })
domainName: LinksMetadata;
```

**Why:** Auto-fetch logos, no manual upload.

---

### **Scenario 3: Multiple images, gallery, file management**

→ **Dùng Cách 3: Attachment Relation**

```typescript
@WorkspaceRelation({
  type: RelationMetadataType.ONE_TO_MANY,
  inverseSideTarget: () => AttachmentWorkspaceEntity,
})
images: Relation<AttachmentWorkspaceEntity[]>;
```

**Why:** Full file management, multiple images, preview modal.

---

### **Scenario 4: Multiple image URL fields cần thumbnail**

→ **Dùng Cách 4: Custom Display Component**

```typescript
// Backend: TEXT fields
primaryImageUrl: string;
thumbnailUrl: string;
galleryImageUrl: string;

// Frontend: Custom ImageUrlFieldDisplay component
```

**Why:** Flexible, custom styling, multiple fields.

---

## 🛠️ **EXAMPLE: Tạo Product với Image**

### **Backend:**

```typescript
// File: packages/twenty-server/src/modules/product/standard-objects/product.workspace-entity.ts

import { WorkspaceEntity, WorkspaceField } from '@/engine/decorators';
import { FieldMetadataType } from '@/metadata/field-metadata/field-metadata.entity';
import { BaseWorkspaceEntity } from '@/engine/twenty-orm/base.workspace-entity';

@WorkspaceEntity({
  standardId: 'product',
  namePlural: 'products',
  nameSingular: 'product',
  labelSingular: 'Product',
  labelPlural: 'Products',
  description: 'A product in the catalog',
  icon: 'IconBox',
  imageIdentifierFieldMetadataName: 'imageUrl', // ← Image thumbnail!
})
export class ProductWorkspaceEntity extends BaseWorkspaceEntity {

  @WorkspaceField({
    standardId: 'product-name',
    type: FieldMetadataType.TEXT,
    label: 'Name',
    description: 'Product name',
    icon: 'IconTag',
  })
  name: string;

  @WorkspaceField({
    standardId: 'product-image-url',
    type: FieldMetadataType.TEXT,  // ← TEXT field for image URL
    label: 'Image',
    description: 'Product image URL',
    icon: 'IconPhoto',
  })
  imageUrl: string;

  @WorkspaceField({
    standardId: 'product-price',
    type: FieldMetadataType.CURRENCY,
    label: 'Price',
    description: 'Product price',
    icon: 'IconCurrencyDollar',
  })
  price: Currency;

  @WorkspaceField({
    standardId: 'product-description',
    type: FieldMetadataType.TEXT,
    label: 'Description',
    description: 'Product description',
    icon: 'IconFileText',
  })
  description: string;
}
```

### **Sync Metadata:**

```bash
npx nx run twenty-server:command workspace:sync-metadata
```

### **Result in UI:**

```
Products Table:
┌──────────┬───────────────┬──────────┬─────────────────┐
│ [IMG 🖼️] │ iPhone 15 Pro │ $999.00  │ Latest model... │
│ [IMG 🖼️] │ MacBook Pro   │ $2499.00 │ M3 chip...      │
│ [IMG 🖼️] │ iPad Air      │ $599.00  │ 11-inch...      │
└──────────┴───────────────┴──────────┴─────────────────┘
    ↑
  Auto thumbnail!
```

---

## 📚 **UTILITY FUNCTIONS**

### **Convert to Absolute URL:**

```typescript
// From: packages/twenty-shared/src/utils/image/getImageAbsoluteURI.ts

import { getImageAbsoluteURI } from 'twenty-shared/utils';

const absoluteUrl = getImageAbsoluteURI({
  imageUrl: '/images/product.jpg',  // Relative
  baseUrl: 'https://crm.company.com',
});
// Result: https://crm.company.com/images/product.jpg
```

### **Get Avatar URL:**

```typescript
// From: packages/twenty-front/src/modules/object-metadata/utils/getAvatarUrl.ts

import { getAvatarUrl } from '@/object-metadata/utils/getAvatarUrl';

const avatarUrl = getAvatarUrl({
  objectMetadataItem,
  record,
  imageIdentifierFieldMetadata,
});
```

### **Avatar Type:**

```typescript
// From: packages/twenty-front/src/modules/object-metadata/utils/getAvatarType.ts

import { getAvatarType } from '@/object-metadata/utils/getAvatarType';

const type = getAvatarType({
  objectNameSingular: 'product',
});
// Returns: 'rounded' | 'squared' | 'icon'
```

---

## ✅ **CHECKLIST**

Setup image thumbnail:

- [ ] Choose phương án (1, 2, 3, hoặc 4)
- [ ] Create/update workspace entity
- [ ] Add TEXT field for image URL
- [ ] Set imageIdentifierFieldMetadataName (nếu Cách 1)
- [ ] Run `workspace:sync-metadata`
- [ ] Restart server
- [ ] Check UI - thumbnail xuất hiện
- [ ] Test với URL thật
- [ ] Test broken image fallback

---

## 🎉 **TÓM TẮT**

**Câu trả lời:** Twenty **KHÔNG có IMAGE field type**, nhưng có **4 cách** hiển thị thumbnails:

1. ✅ **TEXT + imageIdentifier** - Easiest, auto thumbnail
2. ✅ **LINKS field** - Auto company logos
3. ✅ **Attachment relation** - Full file management
4. ✅ **Custom display** - Most flexible

**Recommended:** Dùng **Cách 1** cho primary image, **Cách 3** cho galleries, **Cách 4** cho advanced cases.

---

**Files tham khảo:**
- Field types: `/packages/twenty-shared/src/types/FieldMetadataType.ts`
- Person avatar: `/packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`
- Avatar component: `/packages/twenty-ui/src/display/avatar/components/Avatar.tsx`
- Get avatar URL: `/packages/twenty-front/src/modules/object-metadata/utils/getAvatarUrl.ts`
