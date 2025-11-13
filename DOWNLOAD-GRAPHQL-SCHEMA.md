# 📥 Cách Tải Toàn Bộ GraphQL Schema Từ Twenty CRM

Twenty CRM có **2 GraphQL APIs**:
- **Core API** (`/graphql`) - Data operations (Companies, People, Opportunities, Tasks...)
- **Metadata API** (`/metadata`) - Workspace configuration (Objects, Fields, Views...)

---

## 🎯 **Cách 1: Sử dụng Built-in Command** ⭐ (Khuyên dùng)

Twenty đã tích hợp sẵn GraphQL Code Generator.

### Yêu cầu:
- Server đang chạy tại `http://localhost:3000`
- Đã có API key (tạo ở Settings → APIs & Webhooks)

### Chạy lệnh:

```bash
# Core API (data operations)
npx nx run twenty-front:graphql:generate

# Hoặc chỉ định cụ thể
npx nx run twenty-front:graphql:generate --configuration=data

# Metadata API
npx nx run twenty-front:graphql:generate --configuration=metadata

# Cả 2 cùng lúc
npx nx run twenty-front:graphql:generate && \
npx nx run twenty-front:graphql:generate --configuration=metadata
```

### Kết quả:
- ✅ `/packages/twenty-front/src/generated/graphql.ts` - Core API types
- ✅ `/packages/twenty-front/src/generated-metadata/graphql.ts` - Metadata API types

### Ưu điểm:
- TypeScript types được generate sẵn
- React hooks được tạo tự động
- Sync với local server của bạn

---

## 🎯 **Cách 2: Script Tự Động** (Tôi đã tạo sẵn)

Tôi đã tạo 2 scripts để bạn download schema:

### A. Bash Script (Linux/Mac):

```bash
# Chạy script
./download-graphql-schema.sh YOUR_API_KEY http://localhost:3000

# Hoặc không cần API key nếu server ở local
./download-graphql-schema.sh
```

### B. Node.js Script (All platforms):

```bash
# Chạy script
node download-schema-simple.js YOUR_API_KEY http://localhost:3000

# Hoặc
node download-schema-simple.js
```

### Kết quả:
- ✅ `schema-core.json` - Core API schema (JSON format)
- ✅ `schema-metadata.json` - Metadata API schema (JSON format)

### Convert sang GraphQL SDL:

```bash
# Cài tool
npm install -g graphql-json-to-sdl

# Convert
graphql-json-to-sdl schema-core.json > schema-core.graphql
graphql-json-to-sdl schema-metadata.json > schema-metadata.graphql
```

---

## 🎯 **Cách 3: Sử dụng `get-graphql-schema` Tool**

Tool chuyên dụng để download GraphQL schema.

### Cài đặt:

```bash
npm install -g get-graphql-schema
# Hoặc
yarn global add get-graphql-schema
```

### Download schema:

```bash
# Core API
get-graphql-schema http://localhost:3000/graphql \
  -h "Authorization=Bearer YOUR_API_KEY" \
  > schema-core.graphql

# Metadata API
get-graphql-schema http://localhost:3000/metadata \
  -h "Authorization=Bearer YOUR_API_KEY" \
  > schema-metadata.graphql
```

### Output dạng JSON:

```bash
# Core API (JSON)
get-graphql-schema http://localhost:3000/graphql \
  -h "Authorization=Bearer YOUR_API_KEY" \
  --json \
  > schema-core.json

# Metadata API (JSON)
get-graphql-schema http://localhost:3000/metadata \
  -h "Authorization=Bearer YOUR_API_KEY" \
  --json \
  > schema-metadata.json
```

---

## 🎯 **Cách 4: Sử dụng GraphQL Rover (Apollo)**

Tool mạnh mẽ từ Apollo GraphQL.

### Cài đặt:

```bash
npm install -g @apollo/rover
```

### Download schema:

```bash
# Core API
rover graph introspect http://localhost:3000/graphql \
  --header "Authorization: Bearer YOUR_API_KEY" \
  > schema-core.graphql

# Metadata API
rover graph introspect http://localhost:3000/metadata \
  --header "Authorization: Bearer YOUR_API_KEY" \
  > schema-metadata.graphql
```

---

## 🎯 **Cách 5: Manual với cURL**

Download thủ công bằng cURL.

### Core API:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"query":"{ __schema { types { name kind description fields { name description type { name kind ofType { name kind } } } } } }"}' \
  | jq '.' > schema-core.json
```

### Hoặc dùng introspection query đầy đủ:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @introspection-query.graphql \
  | jq '.' > schema-core.json
```

---

## 🎯 **Cách 6: Sử dụng GraphQL Playground/GraphiQL**

### Truy cập:

```
http://localhost:3000/graphql
```

### Trong Playground:

1. Click vào tab **"DOCS"** hoặc **"SCHEMA"** bên phải
2. Browse toàn bộ types, queries, mutations
3. Click **"Download Schema"** (nếu có nút)
4. Hoặc run introspection query manual:

```graphql
{
  __schema {
    types {
      name
      kind
      description
      fields {
        name
        description
        args {
          name
          type {
            name
            kind
          }
        }
        type {
          name
          kind
        }
      }
    }
    queryType { name }
    mutationType { name }
  }
}
```

---

## 🎯 **Cách 7: Import vào Postman/Insomnia**

### Postman:

1. Download schema bằng một trong các cách trên
2. Postman → Import → Select File → Chọn `schema-core.json`
3. Postman sẽ tạo collection với tất cả queries/mutations

### Insomnia:

1. Download schema
2. Insomnia → Import/Export → Import Data → From File
3. Chọn file `schema-core.json`
4. Insomnia sẽ parse và show docs

---

## 📊 **So Sánh Các Cách:**

| Cách | Ưu điểm | Nhược điểm | Khuyên dùng |
|------|---------|------------|-------------|
| **Built-in Command** | TypeScript types, React hooks auto-gen | Cần setup Nx workspace | ⭐⭐⭐⭐⭐ Devs |
| **Scripts (tôi tạo)** | Đơn giản, không cần cài gì thêm | JSON format | ⭐⭐⭐⭐ Quick & dirty |
| **get-graphql-schema** | SDL format clean | Cần cài tool | ⭐⭐⭐⭐ External teams |
| **Rover** | Mạnh mẽ, nhiều tính năng | Overkill cho simple use | ⭐⭐⭐ Apollo users |
| **cURL manual** | Control tối đa | Phức tạp | ⭐⭐ Debug only |
| **Playground** | Visual, easy explore | Không tự động | ⭐⭐⭐ Learning |
| **Postman/Insomnia** | GUI, testing API | Heavy tools | ⭐⭐⭐⭐ API testing |

---

## 🔑 **Lưu ý về Authentication:**

### Local Development (không cần API key):

```bash
# Nếu server chạy local không có auth
get-graphql-schema http://localhost:3000/graphql > schema.graphql
```

### Production/Remote (cần API key):

```bash
# Tạo API key: Settings → APIs & Webhooks → Create Key
# Thêm header Authorization
get-graphql-schema http://localhost:3000/graphql \
  -h "Authorization=Bearer YOUR_API_KEY" \
  > schema.graphql
```

---

## 💡 **Tips & Tricks:**

### 1. Schema Diff (so sánh changes):

```bash
# Download schema mới
get-graphql-schema http://localhost:3000/graphql > schema-new.graphql

# So sánh với schema cũ
diff schema-old.graphql schema-new.graphql

# Hoặc dùng tool
npx graphql-inspector diff schema-old.graphql schema-new.graphql
```

### 2. Schema Validation:

```bash
# Validate schema file
npx graphql-inspector validate schema.graphql
```

### 3. Schema Visualization:

```bash
# Generate visual diagram
npx graphql-voyager schema.graphql
```

### 4. Auto-complete trong VSCode:

```json
// .vscode/settings.json
{
  "graphql-config.load.rootDir": "./",
  "graphql.schema": "schema-core.graphql"
}
```

---

## 📚 **Files Tôi Đã Tạo Cho Bạn:**

1. ✅ **`introspection-query.graphql`** - Full introspection query
2. ✅ **`download-graphql-schema.sh`** - Bash script tự động
3. ✅ **`download-schema-simple.js`** - Node.js script tự động
4. ✅ **`DOWNLOAD-GRAPHQL-SCHEMA.md`** - Hướng dẫn này

---

## 🚀 **Quick Start (Recommended):**

```bash
# 1. Start Twenty server
yarn start

# 2. Tạo API key (nếu cần)
# Settings → APIs & Webhooks → Create Key

# 3. Download schema
node download-schema-simple.js YOUR_API_KEY

# 4. Convert to GraphQL SDL (optional)
npx graphql-json-to-sdl schema-core.json > schema-core.graphql

# 5. View schema
cat schema-core.graphql
```

---

## ❓ **Troubleshooting:**

### Lỗi "Cannot connect":
```bash
# Kiểm tra server đang chạy
curl http://localhost:3000/graphql

# Kiểm tra port
netstat -an | grep 3000
```

### Lỗi "401 Unauthorized":
```bash
# Kiểm tra API key
curl http://localhost:3000/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"query":"{ __typename }"}'
```

### Schema quá lớn:
```bash
# Lọc chỉ lấy types cần thiết
jq '.data.__schema.types[] | select(.name | startswith("__") | not)' schema.json
```

---

## 🎉 **Hoàn thành!**

Bây giờ bạn có đủ công cụ và kiến thức để tải toàn bộ GraphQL schema từ Twenty CRM!

**Khuyến nghị của tôi:**
- Dev work: Dùng **Built-in Command** (Cách 1)
- Quick export: Dùng **Node.js script** (Cách 2)
- Documentation: Dùng **get-graphql-schema** (Cách 3)
- API Testing: Import vào **Postman/Insomnia** (Cách 7)
