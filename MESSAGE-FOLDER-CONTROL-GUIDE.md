# Twenty CRM - Message Folder Control Guide

## Overview

**Message Folder Control** is a powerful feature in Twenty CRM that allows users to selectively choose which email folders/labels from their connected email accounts should be synced to the CRM. This gives users fine-grained control over what messages are imported, helping to reduce clutter and focus only on relevant communications.

This feature supports:
- **Gmail** (labels)
- **Microsoft** (folders)
- **IMAP** (folders)

Users can:
- View all available folders in a hierarchical tree structure
- Toggle individual folders on/off for syncing
- Search through folder names
- Toggle all folders at once
- See nested folder relationships

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Folder Sync Workflow](#folder-sync-workflow)
5. [Default Sync Behavior](#default-sync-behavior)
6. [GraphQL API](#graphql-api)
7. [Provider-Specific Details](#provider-specific-details)
8. [Testing the Feature](#testing-the-feature)

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Connects Email Account                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            SyncMessageFoldersService.syncMessageFolders()        │
│  • Discovers all folders from email provider (Gmail/MS/IMAP)    │
│  • Creates MessageFolder records with default isSynced values   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MessageFolder Database Table                   │
│  • Stores folder metadata (name, externalId, isSynced, etc.)   │
│  • One-to-many relationship with MessageChannel                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              User Views Folders in Settings UI                   │
│  • SettingsAccountsMessageFoldersCard displays folder tree      │
│  • User toggles isSynced on/off via checkbox                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              GraphQL Mutation Updates MessageFolder              │
│  • updateOneRecord mutation sets isSynced: true/false           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Message Import Service Syncs Only Selected Folders     │
│  • MessagingMessageListFetchService fetches from isSynced=true  │
│  • Messages from unsynced folders are ignored                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **MessageFolderWorkspaceEntity** | `packages/twenty-server/src/modules/messaging/common/standard-objects/message-folder.workspace-entity.ts` | Database entity for storing folder metadata |
| **SyncMessageFoldersService** | `packages/twenty-server/src/modules/messaging/message-folder-manager/services/sync-message-folders.service.ts` | Syncs folders from email providers |
| **GmailGetAllFoldersService** | `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/gmail/gmail-get-all-folders.service.ts` | Gmail-specific folder discovery |
| **MicrosoftGetAllFoldersService** | `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/microsoft/` | Microsoft-specific folder discovery |
| **ImapGetAllFoldersService** | `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/imap/` | IMAP-specific folder discovery |
| **SettingsAccountsMessageFoldersCard** | `packages/twenty-front/src/modules/settings/accounts/components/message-folders/SettingsAccountsMessageFoldersCard.tsx` | Main UI component for folder management |
| **SettingsMessageFoldersTreeItem** | `packages/twenty-front/src/modules/settings/accounts/components/message-folders/SettingsMessageFoldersTreeItem.tsx` | Recursive tree item component |
| **computeMessageFolderTree** | `packages/twenty-front/src/modules/settings/accounts/components/message-folders/utils/computeMessageFolderTree.ts` | Converts flat folder list to hierarchical tree |

---

## Backend Implementation

### 1. MessageFolder Entity

**File:** `packages/twenty-server/src/modules/messaging/common/standard-objects/message-folder.workspace-entity.ts`

The `MessageFolderWorkspaceEntity` stores all folder information:

```typescript
export class MessageFolderWorkspaceEntity extends BaseWorkspaceEntity {
  // Display name of the folder (e.g., "Work", "Personal", "INBOX")
  name: string;

  // Provider's unique identifier (e.g., Gmail label ID, Microsoft folder ID)
  externalId: string | null;

  // Whether this folder should be synced to Twenty
  isSynced: boolean;

  // Whether this is the sent folder (special handling)
  isSentFolder: boolean;

  // Parent folder's external ID (for nested folders)
  parentFolderId: string | null;

  // Cursor for incremental sync (tracking position)
  syncCursor: string;

  // Pending action: FOLDER_DELETION, FOLDER_IMPORT, NONE
  pendingSyncAction: MessageFolderPendingSyncAction;

  // Related message channel
  messageChannel: Relation<MessageChannelWorkspaceEntity>;
  messageChannelId: string;
}
```

**Key Fields:**

- **`name`**: Human-readable folder name (e.g., "Inbox", "Work/Projects")
- **`externalId`**: Provider-specific ID (Gmail: "INBOX", Microsoft: folder GUID)
- **`isSynced`**: **The control flag** - if `false`, messages from this folder are NOT imported
- **`isSentFolder`**: Special flag for sent folders (affects message direction logic)
- **`parentFolderId`**: External ID of parent folder (for nested structures like "Work/Projects/Client-A")
- **`syncCursor`**: Tracks last sync position for incremental updates
- **`pendingSyncAction`**: Enum with values:
  - `FOLDER_DELETION`: Folder marked for deletion
  - `FOLDER_IMPORT`: Folder marked for import
  - `NONE`: No pending action

### 2. Folder Sync Service

**File:** `packages/twenty-server/src/modules/messaging/message-folder-manager/services/sync-message-folders.service.ts`

The `SyncMessageFoldersService` is responsible for:
1. Discovering all folders from the email provider
2. Creating new MessageFolder records
3. Updating existing MessageFolder records
4. Deleting MessageFolder records for folders that no longer exist

**Key Methods:**

#### `syncMessageFolders()`

```typescript
async syncMessageFolders(input: SyncMessageFoldersInput): Promise<void> {
  const { workspaceId, messageChannelId, connectedAccount, manager } = input;

  // Step 1: Discover all folders from email provider
  const folders = await this.discoverAllFolders(connectedAccount);

  // Step 2: Upsert discovered folders into database
  await this.upsertDiscoveredFolders({
    workspaceId,
    messageChannelId,
    folders,
    manager,
  });
}
```

#### `discoverAllFolders()`

```typescript
async discoverAllFolders(
  connectedAccount: MessageChannelWorkspaceEntity['connectedAccount'],
): Promise<MessageFolder[]> {
  switch (connectedAccount.provider) {
    case ConnectedAccountProvider.GOOGLE:
      return await this.gmailGetAllFoldersService.getAllMessageFolders(
        connectedAccount,
      );
    case ConnectedAccountProvider.MICROSOFT:
      return await this.microsoftGetAllFoldersService.getAllMessageFolders(
        connectedAccount,
      );
    case ConnectedAccountProvider.IMAP_SMTP_CALDAV:
      return await this.imapGetAllFoldersService.getAllMessageFolders(
        connectedAccount,
      );
    default:
      throw new Error(`Provider ${connectedAccount.provider} is not supported`);
  }
}
```

**Returns:** Array of `MessageFolder` objects with:
- `externalId`: Provider's folder ID
- `name`: Folder display name
- `isSynced`: Default sync status
- `isSentFolder`: Whether it's the sent folder
- `parentFolderId`: Parent folder's external ID (for nesting)

#### `upsertDiscoveredFolders()`

This method performs intelligent insert/update/delete operations:

```typescript
private async upsertDiscoveredFolders({
  workspaceId,
  messageChannelId,
  folders,
  manager,
}: {
  workspaceId: string;
  messageChannelId: string;
  folders: MessageFolder[];
  manager: WorkspaceEntityManager;
}): Promise<void> {
  // 1. Build map of existing folders
  const existingFolderMap = await this.buildExistingFolderMap({
    messageChannelId,
    messageFolderRepository,
  });

  const inserts: MessageFolderToInsert[] = [];
  const updates: [string, MessageFolderToUpdate][] = [];
  const deletes: string[] = [];

  // 2. Find folders to delete (exist in DB but not in discovered list)
  const discoveredExternalIds = new Set(
    folders.filter((folder) => folder.externalId).map((folder) => folder.externalId!),
  );

  for (const existingFolder of existingFolderMap.values()) {
    if (existingFolder.externalId && !discoveredExternalIds.has(existingFolder.externalId)) {
      deletes.push(existingFolder.id);
    }
  }

  // 3. Process discovered folders (insert new, update existing)
  for (const folder of folders) {
    const existingFolder = this.findExistingFolderInMap(existingFolderMap, folder);

    if (existingFolder) {
      // Update existing folder
      updates.push([
        existingFolder.id,
        {
          name: folder.name,
          externalId: folder.externalId,
          isSentFolder: folder.isSentFolder,
          parentFolderId: folder.parentFolderId,
        },
      ]);
    } else {
      // Insert new folder
      inserts.push({
        id: v4(),
        messageChannelId,
        name: folder.name,
        syncCursor: '',
        isSynced: folder.isSynced,  // Default from provider
        isSentFolder: folder.isSentFolder,
        externalId: folder.externalId,
        parentFolderId: folder.parentFolderId,
      });
    }
  }

  // 4. Execute database operations
  if (inserts.length > 0) {
    await messageFolderRepository.insert(inserts, manager);
  }
  if (updates.length > 0) {
    await messageFolderRepository.updateMany(updates, manager);
  }
  if (deletes.length > 0) {
    await messageFolderRepository.delete(deletes, manager);
  }
}
```

**Important Notes:**
- Existing folders are matched by `externalId` first, then by `name` (for legacy support)
- Updates do NOT change `isSynced` - user preferences are preserved
- Deletes only happen if folder no longer exists in provider's folder list

### 3. Provider Drivers

Each email provider has its own driver that implements the `MessageFolderDriver` interface.

#### Gmail Driver

**File:** `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/gmail/gmail-get-all-folders.service.ts`

```typescript
@Injectable()
export class GmailGetAllFoldersService implements MessageFolderDriver {
  async getAllMessageFolders(
    connectedAccount: Pick<
      ConnectedAccountWorkspaceEntity,
      'provider' | 'refreshToken' | 'accessToken' | 'id' | 'handle'
    >,
  ): Promise<MessageFolder[]> {
    // 1. Get OAuth2 client
    const oAuth2Client = await this.oAuth2ClientManagerService.getGoogleOAuth2Client(
      connectedAccount,
    );

    // 2. Fetch labels from Gmail API
    const gmailClient = oAuth2Client.gmail({ version: 'v1' });
    const response = await gmailClient.users.labels.list({ userId: 'me' });
    const labels = response.data.labels || [];

    // 3. Build folder name to ID map (for parent resolution)
    const labelNameToIdMap = new Map<string, string>();
    for (const label of labels) {
      if (label.name && label.id) {
        labelNameToIdMap.set(label.name, label.id);
      }
    }

    // 4. Convert labels to MessageFolder format
    const folders: MessageFolder[] = [];
    for (const label of labels) {
      if (!label.name || !label.id) continue;

      const isSentFolder = label.id === 'SENT';
      const folderName = extractGmailFolderName(label.name);
      const parentFolderId = getGmailFolderParentId(label.name, labelNameToIdMap);

      folders.push({
        externalId: label.id,
        name: folderName,
        isSynced: this.isSyncedByDefault(label.id),  // Default sync status
        isSentFolder,
        parentFolderId,
      });
    }

    return folders;
  }

  private isSyncedByDefault(labelId: string): boolean {
    // Exclude promotional, social, forums, updates, trash, spam, draft, chat
    return !MESSAGING_GMAIL_DEFAULT_NOT_SYNCED_LABELS.includes(labelId);
  }
}
```

**Gmail-specific notes:**
- Uses Gmail Labels API (`users.labels.list`)
- Gmail labels are hierarchical (e.g., "Work/Projects" becomes nested structure)
- Default NOT synced labels: `CATEGORY_PROMOTIONS`, `CATEGORY_SOCIAL`, `CATEGORY_FORUMS`, `CATEGORY_UPDATES`, `TRASH`, `SPAM`, `DRAFT`, `CHAT`
- Sent folder identified by label ID `SENT`

#### Microsoft Driver

**File:** `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/microsoft/microsoft-get-all-folders.service.ts`

Similar implementation but uses Microsoft Graph API to fetch folders:
- Uses `/me/mailFolders` endpoint
- Fetches folders recursively (including child folders)
- Default synced folders: `INBOX`, `SENT_ITEMS`

#### IMAP Driver

**File:** `packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/imap/imap-get-all-folders.service.ts`

Uses IMAP protocol to list folders:
- Uses `IMAP LIST` command
- Parses folder hierarchy from IMAP response
- Default synced folder: `INBOX`

### 4. When Folder Sync is Triggered

Folder sync is triggered in two scenarios:

#### A. During Message Channel Creation

**File:** `packages/twenty-server/src/engine/core-modules/auth/services/create-message-channel.service.ts:75-80`

```typescript
async createMessageChannel(input: CreateMessageChannelInput): Promise<string> {
  // ... create message channel ...

  // Immediately sync folders after channel creation
  if (isDefined(connectedAccount)) {
    await this.syncMessageFoldersService.syncMessageFolders({
      workspaceId,
      messageChannelId: newMessageChannel.id,
      connectedAccount,
      manager,
    });
  }

  return newMessageChannel.id;
}
```

#### B. During Regular Message Sync

**File:** `packages/twenty-server/src/modules/messaging/message-import-manager/services/messaging-message-list-fetch.service.ts:81-86`

```typescript
public async processMessageListFetch(
  messageChannel: MessageChannelWorkspaceEntity,
  workspaceId: string,
) {
  // ... authenticate ...

  // Sync folders before fetching messages
  await this.syncMessageFoldersService.syncMessageFolders({
    workspaceId,
    messageChannelId: messageChannelWithFreshTokens.id,
    connectedAccount: messageChannelWithFreshTokens.connectedAccount,
    manager: datasource.manager,
  });

  // Fetch message folders
  const messageFolders = await messageFolderRepository.find({
    where: { messageChannelId: messageChannel.id },
  });

  // Only sync messages from folders with isSynced=true
  const messageLists = await this.messagingGetMessageListService.getMessageLists(
    messageChannelWithFreshTokens,
    messageFolders,
  );

  // ... continue with message import ...
}
```

**Key Point:** The message import service only fetches messages from folders where `isSynced=true`.

### 5. Pending Sync Actions

The `pendingSyncAction` field is used to coordinate folder changes during active sync operations.

**File:** `packages/twenty-server/src/modules/messaging/message-channel-manager/query-hooks/message-channel-update-one.pre-query.hook.ts:78-101`

```typescript
@WorkspaceQueryHook(`messageChannel.updateOne`)
export class MessageChannelUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<MessageChannelWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<MessageChannelWorkspaceEntity>> {
    // Check if sync is ongoing
    const isSyncOngoing = ONGOING_SYNC_STAGES.includes(messageChannel.syncStage);

    // Check for pending folder actions
    const folderWithPendingAction = await messageFolderRepository.findOne({
      where: {
        messageChannelId: messageChannel.id,
        pendingSyncAction: Not(MessageFolderPendingSyncAction.NONE),
      },
    });

    const hasPendingFolderActions = !!folderWithPendingAction;

    // Prevent updates during sync with pending actions
    if (isSyncOngoing && hasPendingFolderActions) {
      throw new WorkspaceQueryRunnerException(
        'Cannot update message channel while sync is ongoing with pending actions',
        WorkspaceQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage: msg`Cannot update message channel while sync is ongoing. Please wait for the sync to complete.`,
        },
      );
    }

    return payload;
  }
}
```

**Purpose:** Prevents race conditions when user tries to modify folders during an active sync.

---

## Frontend Implementation

### 1. Main Folder Management Component

**File:** `packages/twenty-front/src/modules/settings/accounts/components/message-folders/SettingsAccountsMessageFoldersCard.tsx`

This is the main UI component for managing message folders.

```typescript
export const SettingsAccountsMessageFoldersCard = () => {
  const [search, setSearch] = useState('');

  // Get selected message channel from state
  const settingsAccountsSelectedMessageChannel = useRecoilValue(
    settingsAccountsSelectedMessageChannelState,
  );

  // Hook to update MessageFolder records
  const { updateOneRecord } = useUpdateOneRecord<MessageFolder>({
    objectNameSingular: CoreObjectNameSingular.MessageFolder,
  });

  // Fetch message channel with folders
  const { record: messageChannel } = useFindOneRecord<MessageChannel>({
    objectNameSingular: CoreObjectNameSingular.MessageChannel,
    objectRecordId: settingsAccountsSelectedMessageChannel?.id,
    recordGqlFields,
  });

  const { messageFolders = [] } = messageChannel ?? {};

  // Filter folders based on search
  const filteredMessageFolders = useMemo(() => {
    return messageFolders.filter((folder) =>
      folder.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [messageFolders, search]);

  // Convert flat list to tree structure
  const folderTreeNodes = useMemo(() => {
    return computeMessageFolderTree(filteredMessageFolders);
  }, [filteredMessageFolders]);

  // Check if all folders are toggled on
  const allFoldersToggled = useMemo(() => {
    return filteredMessageFolders.every((folder) => folder.isSynced);
  }, [filteredMessageFolders]);

  // Toggle all folders at once
  const handleToggleAllFolders = async (messageFoldersToToggle: MessageFolder[]) => {
    if (messageFoldersToToggle.length === 0) return;

    const allSynced = messageFoldersToToggle.every((folder) => folder.isSynced);
    const targetSyncState = !allSynced;

    for (const folder of messageFoldersToToggle) {
      await updateOneRecord({
        idToUpdate: folder.id,
        updateOneRecordInput: { isSynced: targetSyncState },
      });
    }
  };

  // Toggle individual folder
  const handleToggleFolder = async (messageFoldersToToggle: MessageFolder) => {
    await updateOneRecord({
      idToUpdate: messageFoldersToToggle.id,
      updateOneRecordInput: {
        isSynced: !messageFoldersToToggle.isSynced,
      },
    });
  };

  return (
    <Section>
      <Table>
        {/* Search input */}
        <StyledSearchInput
          placeholder={t`Search folders...`}
          value={search}
          onChange={setSearch}
        />

        {/* Toggle all header */}
        <StyledSectionHeader>
          <Label>{t`Toggle all folders`}</Label>
          <Checkbox
            checked={allFoldersToggled}
            onChange={() => handleToggleAllFolders(messageFolders)}
          />
        </StyledSectionHeader>

        {/* Folder tree */}
        <StyledFoldersContainer>
          <StyledTreeList>
            {folderTreeNodes.map((rootFolder) => (
              <SettingsMessageFoldersTreeItem
                key={rootFolder.folder.id}
                folderTreeNode={rootFolder}
                onToggleFolder={handleToggleFolder}
              />
            ))}
          </StyledTreeList>
        </StyledFoldersContainer>
      </Table>
    </Section>
  );
};
```

**Key Features:**
- **Search:** Filter folders by name
- **Toggle All:** Enable/disable all folders at once
- **Hierarchical Display:** Shows nested folder structure
- **Individual Toggle:** Checkbox per folder to control `isSynced`

### 2. Tree Item Component

**File:** `packages/twenty-front/src/modules/settings/accounts/components/message-folders/SettingsMessageFoldersTreeItem.tsx`

Recursive component for rendering folder tree items:

```typescript
export const SettingsMessageFoldersTreeItem = ({
  folderTreeNode,
  onToggleFolder,
  depth = 0,
}: SettingsMessageFoldersTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { folder, children, hasChildren } = folderTreeNode;

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleRowClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <StyledTreeItem hasChildren={hasChildren} depth={depth}>
      <StyledTreeItemContent onClick={handleRowClick}>
        {/* Expand/collapse button for folders with children */}
        {hasChildren && (
          <StyledExpandButton isExpanded={isExpanded} onClick={handleExpandToggle}>
            <IconChevronRight size={16} />
          </StyledExpandButton>
        )}

        <StyledFolderContent>
          <StyledFolderInfo>
            <SettingsAccountsMessageFolderIcon folder={folder} />
            <StyledFolderName>{formatFolderName(folder.name)}</StyledFolderName>
          </StyledFolderInfo>

          {/* Checkbox to toggle isSynced */}
          <Checkbox
            checked={folder.isSynced}
            onChange={() => onToggleFolder(folder)}
            size={CheckboxSize.Small}
          />
        </StyledFolderContent>
      </StyledTreeItemContent>

      {/* Recursively render children */}
      {hasChildren && isExpanded && (
        <StyledNestedList>
          {children.map((child) => (
            <SettingsMessageFoldersTreeItem
              key={child.folder.id}
              folderTreeNode={child}
              onToggleFolder={onToggleFolder}
              depth={depth + 1}
            />
          ))}
        </StyledNestedList>
      )}
    </StyledTreeItem>
  );
};
```

**Key Features:**
- **Recursive Rendering:** Each tree item can render child items
- **Expand/Collapse:** Chevron icon rotates to show state
- **Depth Tracking:** Indentation increases with nesting level
- **Visual Feedback:** Hover effects and animations

### 3. Tree Builder Utility

**File:** `packages/twenty-front/src/modules/settings/accounts/components/message-folders/utils/computeMessageFolderTree.ts`

Converts a flat array of folders into a hierarchical tree structure:

```typescript
export type MessageFolderTreeNode = {
  folder: MessageFolder;
  children: MessageFolderTreeNode[];
  hasChildren: boolean;
};

export const computeMessageFolderTree = (
  folders: MessageFolder[],
): MessageFolderTreeNode[] => {
  // 1. Build map of folders by externalId
  const folderByExternalIdMap = new Map<string, MessageFolder>();
  folders.forEach((folder) => {
    if (isDefined(folder.externalId)) {
      folderByExternalIdMap.set(folder.externalId, folder);
    }
  });

  // 2. Build map of children by parent folder ID
  const childrenMap = new Map<string, MessageFolder[]>();
  folders.forEach((folder) => {
    if (isDefined(folder.parentFolderId)) {
      const parent = folderByExternalIdMap.get(folder.parentFolderId);
      if (isDefined(parent)) {
        const siblings = childrenMap.get(parent.id) || [];
        siblings.push(folder);
        childrenMap.set(parent.id, siblings);
      }
    }
  });

  // 3. Recursively build tree nodes
  const buildTreeNode = (folder: MessageFolder): MessageFolderTreeNode => {
    const children = childrenMap.get(folder.id) || [];
    const sortedChildren = [...children].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return {
      folder,
      children: sortedChildren.map((child) => buildTreeNode(child)),
      hasChildren: children.length > 0,
    };
  };

  // 4. Find root folders (no parent or parent doesn't exist)
  const rootFolders = folders.filter((folder) => {
    if (!folder.parentFolderId) return true;
    return !folderByExternalIdMap.has(folder.parentFolderId);
  });

  // 5. Sort root folders alphabetically
  rootFolders.sort((a, b) => a.name.localeCompare(b.name));

  // 6. Build tree starting from roots
  return rootFolders.map((folder) => buildTreeNode(folder));
};
```

**Algorithm:**
1. Create map of folders by `externalId` (for quick lookup)
2. Create map of children by parent's `id` (groups siblings)
3. Identify root folders (those without a parent, or parent not in list)
4. Recursively build tree nodes starting from roots
5. Sort children alphabetically at each level

**Example:**

Input (flat):
```javascript
[
  { id: '1', externalId: 'A', name: 'Work', parentFolderId: null },
  { id: '2', externalId: 'B', name: 'Projects', parentFolderId: 'A' },
  { id: '3', externalId: 'C', name: 'Client-A', parentFolderId: 'B' },
  { id: '4', externalId: 'D', name: 'Personal', parentFolderId: null },
]
```

Output (tree):
```javascript
[
  {
    folder: { id: '4', name: 'Personal', ... },
    children: [],
    hasChildren: false
  },
  {
    folder: { id: '1', name: 'Work', ... },
    children: [
      {
        folder: { id: '2', name: 'Projects', ... },
        children: [
          {
            folder: { id: '3', name: 'Client-A', ... },
            children: [],
            hasChildren: false
          }
        ],
        hasChildren: true
      }
    ],
    hasChildren: true
  }
]
```

---

## Folder Sync Workflow

### Complete Workflow Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Connects Email Account (Gmail, Microsoft, or IMAP)      │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 2: CreateMessageChannelService.createMessageChannel()           │
│  • Creates MessageChannel record                                     │
│  • Calls syncMessageFoldersService.syncMessageFolders()              │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 3: SyncMessageFoldersService.discoverAllFolders()               │
│  • Routes to provider-specific driver (Gmail/Microsoft/IMAP)         │
│  • Driver calls email provider API to list all folders/labels        │
│  • Returns MessageFolder[] with default isSynced values              │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 4: SyncMessageFoldersService.upsertDiscoveredFolders()          │
│  • Compares discovered folders with existing MessageFolder records   │
│  • INSERT new folders (not in database)                              │
│  • UPDATE existing folders (name, externalId, parentFolderId)        │
│  • DELETE folders (in database but not discovered)                   │
│  • PRESERVES user's isSynced preferences                             │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 5: MessageFolder Records Stored in Database                     │
│  • One record per folder                                             │
│  • Related to MessageChannel via messageChannelId                    │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 6: User Views Settings > Accounts > [Account] > Folders Tab     │
│  • SettingsAccountsMessageFoldersCard renders                        │
│  • Fetches MessageChannel with messageFolders relation               │
│  • Displays hierarchical folder tree with checkboxes                 │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 7: User Toggles Folder Checkbox (isSynced)                      │
│  • handleToggleFolder() calls updateOneRecord mutation                │
│  • GraphQL: updateMessageFolder(id: "...", data: { isSynced: true }) │
│  • Database updated immediately                                      │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 8: Background Worker Triggers Message Sync (Cron Job)           │
│  • MessagingMessageListFetchService.processMessageListFetch()        │
│  • Re-syncs folders (discovers new/deleted folders)                  │
│  • Fetches messageFolders from database                              │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 9: Only Sync Messages from Folders with isSynced=true           │
│  • messagingGetMessageListService.getMessageLists()                  │
│  • Filters folders: messageFolders.filter(f => f.isSynced)          │
│  • Fetches messages only from synced folders                         │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│ STEP 10: Messages Imported to Twenty CRM                             │
│  • Only from folders where isSynced=true                             │
│  • Messages from unsynced folders are ignored                        │
└───────────────────────────────────────────────────────────────────────┘
```

### Detailed Step-by-Step

#### Step 1: Initial Folder Discovery

When a user connects an email account:

1. **User Action:** Connects Gmail/Microsoft/IMAP account
2. **Backend:** Creates `MessageChannel` record
3. **Backend:** Immediately calls `syncMessageFoldersService.syncMessageFolders()`
4. **Provider Driver:** Fetches all folders/labels from email provider
5. **Database:** Creates `MessageFolder` records with default `isSynced` values

**Default `isSynced` Values:**

- **Gmail:**
  - ✅ Synced: `INBOX`, `SENT`, user-created labels
  - ❌ Not synced: `CATEGORY_PROMOTIONS`, `CATEGORY_SOCIAL`, `CATEGORY_FORUMS`, `CATEGORY_UPDATES`, `TRASH`, `SPAM`, `DRAFT`, `CHAT`

- **Microsoft:**
  - ✅ Synced: `INBOX`, `SENT_ITEMS`
  - ❌ Not synced: Other folders (user must enable)

- **IMAP:**
  - ✅ Synced: `INBOX`
  - ❌ Not synced: Other folders (user must enable)

#### Step 2: User Manages Folders

User navigates to: **Settings > Accounts > [Account Name] > Folders Tab**

1. **Frontend:** Fetches `MessageChannel` with `messageFolders` relation
2. **Frontend:** Converts flat list to tree structure via `computeMessageFolderTree()`
3. **Frontend:** Renders `SettingsMessageFoldersCard` with tree
4. **User Action:** Toggles checkbox for folder
5. **Frontend:** Calls `updateOneRecord` mutation
6. **Backend:** Updates `MessageFolder.isSynced` field
7. **Database:** Change persisted immediately

#### Step 3: Regular Sync Honors User Preferences

Background worker runs periodically (e.g., every 5 minutes):

1. **Worker:** Triggers `processMessageListFetch()` for each message channel
2. **Backend:** Re-syncs folders (discovers new/deleted folders)
3. **Backend:** **Preserves** user's `isSynced` preferences during upsert
4. **Backend:** Fetches all `MessageFolder` records for the channel
5. **Backend:** **Filters** to only folders with `isSynced=true`
6. **Backend:** Fetches messages only from synced folders
7. **Backend:** Imports messages to CRM

**Key Point:** User preferences are preserved across syncs. If user disabled a folder, it stays disabled even if new folders are discovered.

---

## Default Sync Behavior

### Gmail Default Sync Settings

**File:** `packages/twenty-server/src/modules/messaging/message-import-manager/drivers/gmail/constants/messaging-gmail-default-not-synced-labels.ts`

```typescript
export const MESSAGING_GMAIL_DEFAULT_NOT_SYNCED_LABELS = [
  'CATEGORY_PROMOTIONS',   // Gmail promotional emails
  'CATEGORY_SOCIAL',       // Social network notifications
  'CATEGORY_FORUMS',       // Forum/mailing list emails
  'CATEGORY_UPDATES',      // Automated update emails
  'TRASH',                 // Deleted emails
  'SPAM',                  // Spam folder
  'DRAFT',                 // Draft emails
  'CHAT',                  // Google Chat messages
];
```

**Rationale:** These labels typically contain noise and are less relevant for CRM purposes.

**Gmail Labels Synced by Default:**
- `INBOX` - Primary inbox
- `SENT` - Sent emails
- `IMPORTANT` - Important emails
- `STARRED` - Starred emails
- User-created labels (custom)

### Microsoft Default Sync Settings

**Microsoft Folders Synced by Default:**
- `INBOX` - Primary inbox
- `SENT_ITEMS` - Sent emails

**Not Synced by Default:**
- `DRAFTS`
- `DELETED_ITEMS`
- `JUNK_EMAIL`
- `ARCHIVE`
- User-created folders

### IMAP Default Sync Settings

**IMAP Folders Synced by Default:**
- `INBOX` - Primary inbox

**Not Synced by Default:**
- All other folders (user must enable manually)

---

## GraphQL API

### Queries

#### Get Message Channel with Folders

```graphql
query GetMessageChannelWithFolders($messageChannelId: ID!) {
  messageChannel(id: $messageChannelId) {
    id
    handle
    type
    visibility
    syncStatus
    connectedAccount {
      id
      handle
      provider
    }
    messageFolders {
      edges {
        node {
          id
          name
          externalId
          isSynced
          isSentFolder
          parentFolderId
          syncCursor
          pendingSyncAction
          createdAt
          updatedAt
        }
      }
    }
  }
}
```

#### Get All Message Folders for a Channel

```graphql
query GetMessageFolders($messageChannelId: ID!) {
  messageFolders(
    filter: { messageChannelId: { eq: $messageChannelId } }
  ) {
    edges {
      node {
        id
        name
        externalId
        isSynced
        isSentFolder
        parentFolderId
        syncCursor
        pendingSyncAction
        messageChannel {
          id
          handle
        }
      }
    }
  }
}
```

### Mutations

#### Toggle Folder Sync Status

```graphql
mutation UpdateMessageFolder($id: ID!, $isSynced: Boolean!) {
  updateMessageFolder(id: $id, data: { isSynced: $isSynced }) {
    id
    name
    isSynced
  }
}
```

**Example (JavaScript):**

```javascript
const { data } = await client.mutate({
  mutation: gql`
    mutation UpdateMessageFolder($id: ID!, $isSynced: Boolean!) {
      updateMessageFolder(id: $id, data: { isSynced: $isSynced }) {
        id
        name
        isSynced
      }
    }
  `,
  variables: {
    id: 'folder-uuid-here',
    isSynced: true,  // Enable sync
  },
});
```

#### Bulk Update Multiple Folders

```graphql
mutation BulkUpdateMessageFolders($folderUpdates: [MessageFolderUpdateInput!]!) {
  updateMessageFolders(data: $folderUpdates) {
    id
    name
    isSynced
  }
}
```

**Example (Enable All Folders):**

```javascript
const folderIds = ['folder-1-uuid', 'folder-2-uuid', 'folder-3-uuid'];

const { data } = await client.mutate({
  mutation: gql`
    mutation BulkUpdateMessageFolders($updates: [MessageFolderUpdateInput!]!) {
      updateMessageFolders(data: $updates) {
        id
        name
        isSynced
      }
    }
  `,
  variables: {
    updates: folderIds.map(id => ({
      id,
      data: { isSynced: true }
    }))
  },
});
```

---

## Provider-Specific Details

### Gmail (Google Workspace)

#### Label Structure

Gmail uses **labels** instead of folders. Labels can be:
- **System labels:** `INBOX`, `SENT`, `TRASH`, `SPAM`, `DRAFT`, `STARRED`, `IMPORTANT`
- **Category labels:** `CATEGORY_PROMOTIONS`, `CATEGORY_SOCIAL`, `CATEGORY_FORUMS`, `CATEGORY_UPDATES`
- **User-created labels:** Custom labels created by user

#### Nested Labels

Gmail supports nested labels using `/` separator:
- `Work` (parent)
- `Work/Projects` (child of Work)
- `Work/Projects/Client-A` (child of Projects)

**How Twenty Handles Nesting:**
1. Driver extracts folder name from label path
2. Sets `parentFolderId` to parent label's external ID
3. Frontend renders as hierarchical tree

**Example:**

Gmail label: `Work/Projects/Client-A`

MessageFolder records:
```javascript
[
  {
    name: 'Work',
    externalId: 'Label_123',
    parentFolderId: null,
  },
  {
    name: 'Projects',
    externalId: 'Label_456',
    parentFolderId: 'Label_123',  // Points to Work
  },
  {
    name: 'Client-A',
    externalId: 'Label_789',
    parentFolderId: 'Label_456',  // Points to Projects
  },
]
```

#### API Details

- **Endpoint:** `gmail.users.labels.list({ userId: 'me' })`
- **OAuth Scopes Required:** `https://www.googleapis.com/auth/gmail.readonly`
- **Rate Limits:** 250 quota units per user per second

### Microsoft (Outlook / Office 365)

#### Folder Structure

Microsoft uses **folders** (not labels). Common folders:
- `INBOX`
- `SENT_ITEMS`
- `DRAFTS`
- `DELETED_ITEMS`
- `JUNK_EMAIL`
- `ARCHIVE`

#### Nested Folders

Microsoft supports nested folders natively:
- `Personal` (parent)
- `Personal/Family` (child)
- `Personal/Family/Photos` (grandchild)

**How Twenty Handles Nesting:**
- Driver recursively fetches child folders
- Sets `parentFolderId` to parent folder's ID
- Frontend renders as hierarchical tree

#### API Details

- **Endpoint:** `GET /me/mailFolders`
- **OAuth Scopes Required:** `Mail.Read`
- **Rate Limits:** Varies by tenant (typically 10,000 requests per 10 minutes)

### IMAP

#### Folder Structure

IMAP folders are server-specific. Common folders:
- `INBOX`
- `Sent`
- `Drafts`
- `Trash`
- `Spam`

#### Nested Folders

IMAP supports nested folders with delimiter (usually `.` or `/`):
- `Work` (parent)
- `Work.Projects` (child) or `Work/Projects` depending on server

**How Twenty Handles Nesting:**
- Driver parses folder hierarchy from IMAP `LIST` response
- Detects delimiter (`.` or `/`)
- Sets `parentFolderId` accordingly

#### Connection Details

- **Protocol:** IMAP4rev1
- **Port:** 993 (SSL/TLS) or 143 (STARTTLS)
- **Authentication:** Username/password or OAuth (if supported by server)

---

## Testing the Feature

### 1. Test Folder Discovery (Backend)

**Test Gmail Folder Discovery:**

```typescript
// packages/twenty-server/src/modules/messaging/message-folder-manager/drivers/gmail/gmail-get-all-folders.service.spec.ts

describe('GmailGetAllFoldersService', () => {
  it('should fetch all Gmail labels', async () => {
    const service = new GmailGetAllFoldersService(...);

    const folders = await service.getAllMessageFolders(connectedAccount);

    expect(folders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'INBOX',
          name: 'INBOX',
          isSynced: true,
          isSentFolder: false,
        }),
        expect.objectContaining({
          externalId: 'SENT',
          name: 'SENT',
          isSynced: true,
          isSentFolder: true,
        }),
        expect.objectContaining({
          externalId: 'CATEGORY_PROMOTIONS',
          name: 'Promotions',
          isSynced: false,  // Not synced by default
          isSentFolder: false,
        }),
      ])
    );
  });

  it('should handle nested labels correctly', async () => {
    const service = new GmailGetAllFoldersService(...);

    const folders = await service.getAllMessageFolders(connectedAccount);

    const workLabel = folders.find(f => f.name === 'Work');
    const projectsLabel = folders.find(f => f.name === 'Projects');

    expect(projectsLabel.parentFolderId).toBe(workLabel.externalId);
  });
});
```

**Test Folder Sync Service:**

```typescript
// packages/twenty-server/src/modules/messaging/message-folder-manager/services/sync-message-folders.service.spec.ts

describe('SyncMessageFoldersService', () => {
  it('should create new folders on initial sync', async () => {
    const service = new SyncMessageFoldersService(...);

    await service.syncMessageFolders({
      workspaceId: 'workspace-123',
      messageChannelId: 'channel-456',
      connectedAccount: mockConnectedAccount,
      manager: mockManager,
    });

    const folders = await messageFolderRepository.find({
      where: { messageChannelId: 'channel-456' }
    });

    expect(folders.length).toBeGreaterThan(0);
    expect(folders).toContainEqual(
      expect.objectContaining({
        name: 'INBOX',
        isSynced: true,
      })
    );
  });

  it('should preserve isSynced on re-sync', async () => {
    // Initial sync
    await service.syncMessageFolders(...);

    // User disables INBOX
    await messageFolderRepository.update(
      { name: 'INBOX' },
      { isSynced: false }
    );

    // Re-sync
    await service.syncMessageFolders(...);

    // Check that isSynced is still false
    const inbox = await messageFolderRepository.findOne({
      where: { name: 'INBOX' }
    });

    expect(inbox.isSynced).toBe(false);  // Preference preserved!
  });

  it('should delete folders that no longer exist', async () => {
    // Initial sync with folder "Old-Project"
    await service.syncMessageFolders(...);

    const initialCount = await messageFolderRepository.count();

    // Mock provider returns folders without "Old-Project"
    mockGmailService.getAllMessageFolders = jest.fn().mockResolvedValue([
      { externalId: 'INBOX', name: 'INBOX', isSynced: true, ... }
    ]);

    // Re-sync
    await service.syncMessageFolders(...);

    const finalCount = await messageFolderRepository.count();

    expect(finalCount).toBeLessThan(initialCount);
  });
});
```

### 2. Test Frontend Components

**Test Folder Tree Builder:**

```typescript
// packages/twenty-front/src/modules/settings/accounts/components/message-folders/utils/computeMessageFolderTree.test.ts

describe('computeMessageFolderTree', () => {
  it('should convert flat list to tree', () => {
    const folders = [
      { id: '1', externalId: 'A', name: 'Work', parentFolderId: null },
      { id: '2', externalId: 'B', name: 'Projects', parentFolderId: 'A' },
      { id: '3', externalId: 'C', name: 'Personal', parentFolderId: null },
    ];

    const tree = computeMessageFolderTree(folders);

    expect(tree).toHaveLength(2);  // 2 root folders
    expect(tree[0].folder.name).toBe('Personal');
    expect(tree[1].folder.name).toBe('Work');
    expect(tree[1].children).toHaveLength(1);
    expect(tree[1].children[0].folder.name).toBe('Projects');
  });

  it('should handle deeply nested folders', () => {
    const folders = [
      { id: '1', externalId: 'A', name: 'A', parentFolderId: null },
      { id: '2', externalId: 'B', name: 'B', parentFolderId: 'A' },
      { id: '3', externalId: 'C', name: 'C', parentFolderId: 'B' },
      { id: '4', externalId: 'D', name: 'D', parentFolderId: 'C' },
    ];

    const tree = computeMessageFolderTree(folders);

    expect(tree).toHaveLength(1);
    expect(tree[0].folder.name).toBe('A');
    expect(tree[0].children[0].folder.name).toBe('B');
    expect(tree[0].children[0].children[0].folder.name).toBe('C');
    expect(tree[0].children[0].children[0].children[0].folder.name).toBe('D');
  });
});
```

**Test Folder Card Component:**

```typescript
// packages/twenty-front/src/modules/settings/accounts/components/message-folders/SettingsAccountsMessageFoldersCard.test.tsx

describe('SettingsAccountsMessageFoldersCard', () => {
  it('should render folder tree', () => {
    const { getByText } = render(
      <SettingsAccountsMessageFoldersCard />,
      {
        recoilState: {
          settingsAccountsSelectedMessageChannelState: mockMessageChannel,
        },
      }
    );

    expect(getByText('Work')).toBeInTheDocument();
    expect(getByText('Projects')).toBeInTheDocument();
    expect(getByText('Personal')).toBeInTheDocument();
  });

  it('should filter folders by search', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SettingsAccountsMessageFoldersCard />
    );

    const searchInput = getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'Work' } });

    expect(getByText('Work')).toBeInTheDocument();
    expect(queryByText('Personal')).not.toBeInTheDocument();
  });

  it('should toggle folder sync status', async () => {
    const mockUpdate = jest.fn();

    const { getByRole } = render(
      <SettingsAccountsMessageFoldersCard />,
      {
        mocks: {
          useUpdateOneRecord: () => ({ updateOneRecord: mockUpdate }),
        },
      }
    );

    const checkbox = getByRole('checkbox', { name: /Work/ });
    fireEvent.click(checkbox);

    expect(mockUpdate).toHaveBeenCalledWith({
      idToUpdate: 'folder-1',
      updateOneRecordInput: { isSynced: false },
    });
  });
});
```

### 3. Manual Testing Steps

#### Test Case 1: Gmail Account - Verify Default Sync

1. Go to Settings > Accounts
2. Click "Connect Google Account"
3. Authorize Gmail access
4. Navigate to the account's "Folders" tab
5. **Verify:**
   - ✅ INBOX is checked (synced)
   - ✅ SENT is checked (synced)
   - ❌ Promotions is unchecked (not synced)
   - ❌ Social is unchecked (not synced)
   - ❌ Trash is unchecked (not synced)

#### Test Case 2: Toggle Folder Sync

1. In Folders tab, uncheck "INBOX"
2. Wait for sync to complete
3. Go to Messages view
4. **Verify:** No new inbox messages appear
5. Go back to Folders tab
6. Re-check "INBOX"
7. Wait for sync to complete
8. **Verify:** Inbox messages now appear in Messages view

#### Test Case 3: Nested Folders

1. In Gmail, create nested labels: `Work/Projects/Client-A`
2. In Twenty, go to Folders tab
3. **Verify:**
   - Work folder appears with expand icon
   - Click expand icon
   - Projects folder appears nested under Work
   - Click expand icon on Projects
   - Client-A folder appears nested under Projects
4. Check "Client-A" folder
5. Send test email with label "Work/Projects/Client-A"
6. **Verify:** Email appears in Twenty Messages

#### Test Case 4: Search Folders

1. Go to Folders tab
2. Type "Project" in search box
3. **Verify:**
   - Only folders containing "Project" are visible
   - Tree structure is maintained (parents shown if child matches)
4. Clear search
5. **Verify:** All folders visible again

#### Test Case 5: Toggle All Folders

1. Go to Folders tab
2. Click "Toggle all folders" checkbox (uncheck)
3. **Verify:** All folder checkboxes are unchecked
4. Click "Toggle all folders" checkbox (check)
5. **Verify:** All folder checkboxes are checked

#### Test Case 6: Folder Changes Sync

1. In Gmail, create new label "New-Project"
2. Wait for next sync cycle (or trigger manually)
3. In Twenty, go to Folders tab
4. **Verify:** "New-Project" folder appears
5. In Gmail, delete label "New-Project"
6. Wait for next sync cycle
7. In Twenty, refresh Folders tab
8. **Verify:** "New-Project" folder is removed

#### Test Case 7: Pending Sync Actions

1. Start a long-running sync (e.g., large inbox)
2. Try to update folder settings during sync
3. **Verify:** UI shows "Sync in progress, please wait" message
4. Wait for sync to complete
5. Try to update folder settings
6. **Verify:** Update succeeds

### 4. API Testing (Postman / curl)

**Example: Get Message Folders**

```bash
curl -X POST https://your-twenty-instance.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "query": "query GetMessageFolders($channelId: ID!) { messageFolders(filter: { messageChannelId: { eq: $channelId } }) { edges { node { id name externalId isSynced isSentFolder parentFolderId } } } }",
    "variables": {
      "channelId": "your-message-channel-id"
    }
  }'
```

**Example: Toggle Folder Sync**

```bash
curl -X POST https://your-twenty-instance.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "query": "mutation UpdateMessageFolder($id: ID!, $isSynced: Boolean!) { updateMessageFolder(id: $id, data: { isSynced: $isSynced }) { id name isSynced } }",
    "variables": {
      "id": "folder-uuid-here",
      "isSynced": false
    }
  }'
```

---

## Summary

The **Message Folder Control** feature in Twenty CRM provides users with granular control over which email folders/labels are synced to the CRM.

**Key Capabilities:**
- ✅ Automatic folder discovery from Gmail, Microsoft, and IMAP accounts
- ✅ Hierarchical folder tree display with expand/collapse
- ✅ Individual and bulk folder toggle controls
- ✅ Search functionality for large folder lists
- ✅ Persistent user preferences across syncs
- ✅ Smart default sync settings (excludes promotions, spam, trash)
- ✅ Real-time updates via GraphQL mutations
- ✅ Support for deeply nested folder structures

**Architecture Highlights:**
- **Backend:** Provider-agnostic folder sync service with driver pattern
- **Frontend:** Recursive tree component with optimistic UI updates
- **Database:** MessageFolder entity with isSynced control flag
- **API:** GraphQL queries and mutations for folder management

This feature gives users the flexibility to focus on relevant communications while reducing noise from promotional emails, automated updates, and other low-priority folders.

---

## Related Documentation

- [Email Sync Architecture](./EMAIL-SYNC-ARCHITECTURE.md) *(if exists)*
- [MessageChannel Entity](./MESSAGE-CHANNEL-GUIDE.md) *(if exists)*
- [Webhook Source Tracking](./WEBHOOK-SOURCE-TRACKING-GUIDE.md)

---

**Last Updated:** 2025-11-15
**Twenty CRM Version:** Latest
**Author:** Claude Code Assistant
