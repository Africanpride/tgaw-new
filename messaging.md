# Messaging Improvement Plan — Phase 1

> **Goal**: Transform the current bare-bones messaging UI into a premium iMessage-style chat experience with real-time features, mobile-first layout, and rich message interactions.

## Current State Assessment

The existing messaging system has the basic bones — Socket.IO real-time transport, Prisma `Conversation`/`Message` models, and a working send/receive flow — but the **user-facing experience is rudimentary**:

| Problem | Detail |
|---------|--------|
| **Raw IDs displayed** | Conversation list shows truncated MongoDB IDs (`69f4368a`) instead of user names |
| **No avatars** | AvatarFallback renders ID slices, not initials or profile images |
| **No real-time indicators** | No typing, presence, or read receipts |
| **No unread badges** | No way to see which conversations have new messages |
| **Plain input** | Single-line `<Input>` with no emoji picker or multi-line support |
| **Desktop-only layout** | `grid lg:grid-cols-[360px_1fr]` breaks on mobile — no toggle flow |
| **No message actions** | Can't delete, edit, reply to, or react to messages |
| **No username system** | User model has no `username` field; discovery relies on email search |
| **Minimal styling** | Basic shadcn `Card` wrappers, no chat-specific design language |

---

## User Requirements (from interview)

- **Visual**: iMessage-style — minimal, large bubbles, sent/delivered labels, clean contrast
- **Real-time**: Typing indicators, read receipts, online/offline presence — all three
- **Input**: Multi-line auto-expanding textarea + emoji picker (no attachments this phase)
- **Mobile**: WhatsApp-style toggle — show conversation list OR chat view, not both
- **Message actions**: Delete (for self), edit, reply/quote, and emoji reactions
- **Identity**: Add `username` (`@handle`) to User model + onboarding; display full name in chat header, username for search/handles
- **Search**: Not needed this phase
- **Attachments**: Not needed this phase (deferred to Phase 2)

---

## Proposed Changes

### 1. Schema & Data Layer

#### [MODIFY] [`schema.prisma`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/prisma/schema.prisma)

**Add `username` to User model:**
```diff
 model User {
   id            String    @id @map("_id")
   email         String    @unique
+  username      String?   @unique
   passwordHash  String?
   name          String
   ...
 }
```

**Add `MessageReaction` model:**
```prisma
model MessageReaction {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  messageId String   @db.ObjectId
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  emoji     String   // single emoji character, e.g. "❤️", "👍", "😂"
  createdAt DateTime @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
  @@map("message_reaction")
}
```

**Extend `Message` model with edit/delete/reply fields:**
```diff
 model Message {
   id               String       @id @default(auto()) @map("_id") @db.ObjectId
   conversationId   String       @db.ObjectId
   conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
   senderId         String
   body             String
+  editedAt         DateTime?            // non-null = message was edited
+  deletedAt        DateTime?            // non-null = soft-deleted (show "message deleted" placeholder)
+  replyToId        String?    @db.ObjectId  // if set, this message is a reply to another
   attachmentUrl    String?
   readBy           String[]
   createdAt        DateTime     @default(now())
+  reactions        MessageReaction[]

   @@index([conversationId])
+  @@index([replyToId])
 }
```

> [!IMPORTANT]
> `deletedAt` uses soft-delete rather than hard delete so that reply chains remain intact. The UI renders a "This message was deleted" placeholder when `deletedAt` is non-null.

---

#### [MODIFY] [`messageSchema.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/schemas/messageSchema.ts)

Extend Zod schemas for new features:

```ts
// New schemas to add:

export const editMessageSchema = z.object({
  body: z.string().min(1, "Message body is required"),
})

export const reactionSchema = z.object({
  emoji: z.string().emoji("Must be a single emoji").min(1).max(8),
})

// Extend createMessageSchema:
export const createMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  body: z.string().min(1, "Message body is required"),
  replyToId: z.string().optional(),              // NEW
  attachmentUrl: z.string().url().optional().or(z.literal("")),
})
```

---

#### [MODIFY] [`onboardingSchema.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/lib/schemas/onboardingSchema.ts)

Add a **username step** before or after the name step:

```ts
export const usernameStepSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .transform((v) => v.toLowerCase()),
})
```

Insert into `ONBOARDING_STEPS` after the name step:
```ts
{ id: "username", label: "Username", schema: usernameStepSchema },
```

---

### 2. API Routes

#### [NEW] `app/api/v1/messages/[id]/reactions/route.ts`

- **POST**: Add a reaction (emoji) to a message. Upsert to avoid duplicates per `[messageId, userId, emoji]`.
- **DELETE**: Remove a reaction.
- Emit `message:reaction` socket event to the conversation room.

#### [MODIFY] [`app/api/v1/messages/[id]/route.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/messages/%5Bid%5D/route.ts)

- **PATCH** (existing): Keep read-receipt logic, add `editedAt + body` update branch.
  - Only the sender can edit their own message.
  - Set `editedAt = new Date()` on edit.
- **DELETE** (new): Soft-delete — set `deletedAt = new Date()`. Only the sender can delete. Emit `message:deleted` socket event.

#### [MODIFY] [`app/api/v1/messages/route.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/messages/route.ts)

- **GET**: Include `reactions` relation in query. Include a slim `replyTo` include (just `id`, `body`, `senderId`) when `replyToId` is set.
- **POST**: Accept optional `replyToId` from the validated schema.

#### [MODIFY] [`app/api/v1/conversations/route.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/conversations/route.ts)

- **GET**: Extend the query to include member user data for display:
  ```ts
  include: {
    messages: { orderBy: { createdAt: "desc" }, take: 1 },
    // No relation exists from Conversation to User — resolve member names via a follow-up query
  }
  ```
  Since `memberIds` is a plain `String[]` (no Prisma relation to User), fetch member profiles in a second query:
  ```ts
  const userIds = [...new Set(conversations.flatMap(c => c.memberIds))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true, initials: true, image: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))
  // Attach to response
  ```

#### [NEW] `app/api/v1/users/username-check/route.ts`

- **GET** `?username=<handle>`: Returns `{ available: boolean }`. Used during onboarding to validate uniqueness in real-time.

---

### 3. Socket.IO Real-Time Layer

#### [MODIFY] [`server.ts`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/server.ts) — Socket event handlers

Add the following socket events to the `io.on("connection", ...)` block:

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `typing:start` | Client → Server → Room | `{ conversationId, userId, name }` | Broadcast typing indicator |
| `typing:stop` | Client → Server → Room | `{ conversationId, userId }` | Clear typing indicator |
| `message:deleted` | Server → Room | `{ messageId, conversationId }` | Notify clients of soft-delete |
| `message:edited` | Server → Room | `{ messageId, conversationId, body, editedAt }` | Notify clients of edit |
| `message:reaction` | Server → Room | `{ messageId, conversationId, userId, emoji, action: "add"|"remove" }` | Reaction update |
| `presence:online` | Server → All | `{ userId }` | User connected |
| `presence:offline` | Server → All | `{ userId }` | User disconnected |

**Presence tracking** — maintain an in-memory `Map<userId, Set<socketId>>` on the server:
- On `connection`: add to map, broadcast `presence:online` if this is the first socket for the user.
- On `disconnect`: remove from map, broadcast `presence:offline` if the set is now empty.
- On `presence:query` from client: return the full list of currently online user IDs.

**Read receipts** — when the client opens a conversation:
- Client emits `conversation:join` (already exists).
- Server-side: upon join, auto-mark all messages in that conversation as read by the joining user (batch `readBy` update), then broadcast `message:read` to the room.

---

### 4. UI Components — iMessage-Style Redesign

#### [MODIFY] [`app/(dashboard)/messages/page.tsx`](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/%28dashboard%29/messages/page.tsx)

**Complete rewrite** into a composed component architecture. The page becomes a thin shell:

```tsx
export default function MessagesPage() {
  return <ChatShell />
}
```

All logic moves into the components below.

---

#### [NEW] `components/messages/ChatShell.tsx`

The top-level orchestrator. Manages:
- `activeConversationId` state
- Mobile view toggle: `"list" | "chat"` — on screens < `lg`, show one at a time
- Fetches conversations list + user map
- Passes data down to children

```
┌──────────────────────────────────────────────┐
│               ChatShell                      │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ ConvList     │  │ ChatPanel            │  │
│  │ (hidden on   │  │ (hidden on mobile    │  │
│  │  mobile when │  │  when list is shown) │  │
│  │  chat shown) │  │                      │  │
│  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

#### [NEW] `components/messages/ConversationList.tsx`

**Purpose**: Sidebar listing all conversations.

**Design**:
- **Header**: "Messages" title + "New chat" icon button
- **Start conversation**: Modal/sheet with username search (`@handle` autocomplete) instead of raw email input
- **Each row** (`ConversationRow`):
  - Avatar with user's `image` or `initials` fallback
  - Green presence dot (online) overlay on avatar
  - User's **full name** (bold) + `@username` (muted, smaller)
  - Last message preview (truncated, 1 line)
  - Relative timestamp ("2m", "1h", "Yesterday")
  - **Unread count badge** — computed from messages where `readBy` doesn't include `myId`
- Active row: subtle `bg-muted` highlight with left accent border
- Sorted: most recent message first

---

#### [NEW] `components/messages/ChatPanel.tsx`

**Purpose**: The main chat area — header + message list + input.

**Sub-sections**:

##### Chat Header
- Back arrow (← visible on mobile only, returns to list)
- Avatar + full name + `@username`
- Online/offline status text ("Online" / "Last seen 2h ago")
- Future: action menu (mute, block, info)

##### Message List (`MessageList.tsx`)
- Virtualized scroll (or simple div with `overflow-auto` + scroll-to-bottom on new message)
- Date separators ("Today", "Yesterday", "Sep 15, 2026")
- **Message bubbles** (`ChatBubble.tsx`):

  | Property | Sent (mine) | Received |
  |----------|-------------|----------|
  | Alignment | Right | Left |
  | Background | `bg-primary` (project's purple/indigo) | `bg-muted` |
  | Text color | `text-primary-foreground` | `text-foreground` |
  | Bubble shape | Rounded, larger tail on right | Rounded, larger tail on left |
  | Timestamp | Below text, `11px`, lighter | Below text, `11px`, muted |
  | Status icon | ✓ sent / ✓✓ delivered / ✓✓ read (blue) | — |
  | Edited badge | "(edited)" label next to timestamp | "(edited)" label |

- **Reply preview bar**: If message is a reply, show a thin colored bar + quoted text above the bubble body
- **Reactions row**: Below the bubble, small emoji badges with counts (e.g. `❤️ 3  👍 1`)
- **Deleted messages**: Render as italic gray "This message was deleted" — no bubble styling
- **Typing indicator**: At bottom of message list, "John is typing..." with animated dots

##### Message Bubble Context Menu (long-press / right-click)
- **Reply** — sets the reply-to preview in the input area
- **Edit** (own messages only) — opens inline edit mode in the bubble
- **Delete** (own messages only) — confirmation dialog, then soft-delete
- **React** — quick emoji picker (6 common emojis: ❤️ 👍 😂 😮 😢 🙏) + "more" opens full picker

---

#### [NEW] `components/messages/ChatInput.tsx`

**Purpose**: Multi-line auto-expanding input with emoji picker.

**Design**:
- `<textarea>` that starts at 1 row, auto-expands up to ~5 rows as the user types
- **Reply preview bar** above the textarea when replying (shows quoted message + ✕ to cancel)
- **Emoji picker** button (😊 icon) — opens a popover with emoji grid (use a lightweight library like `emoji-mart` or a custom curated grid)
- **Send button** — enabled only when input is non-empty. Animated icon transition on send.
- `Enter` sends, `Shift+Enter` inserts newline

---

#### [NEW] `components/messages/PresenceIndicator.tsx`

Small composable component — green/gray dot overlaid on an avatar to show online/offline status.

```tsx
<div className="relative">
  <Avatar>...</Avatar>
  <span className={cn(
    "absolute bottom-0 right-0 size-3 rounded-full border-2 border-background",
    online ? "bg-emerald-500" : "bg-muted-foreground/40"
  )} />
</div>
```

---

#### [NEW] `components/messages/TypingIndicator.tsx`

Animated three-dot bouncing indicator shown at the bottom of the message list when another user is typing.

---

#### [NEW] `components/messages/ReadReceipt.tsx`

Icon component rendering message delivery status:
- Single check (✓) — sent to server
- Double check (✓✓) — delivered (message exists in DB)
- Double check blue (✓✓) — read (recipient's ID is in `readBy`)

---

### 5. Real-Time Hooks

#### [NEW] `lib/hooks/usePresence.ts`

Custom hook that:
- Subscribes to `presence:online` / `presence:offline` socket events
- Maintains an in-memory `Set<userId>` of online users
- Queries the initial online set on mount via `presence:query`
- Exposes `isOnline(userId): boolean`

#### [NEW] `lib/hooks/useTyping.ts`

Custom hook that:
- Emits `typing:start` on keydown (debounced — emit once, then again only after 3s pause)
- Emits `typing:stop` after 3s of inactivity or on send
- Listens for `typing:start` / `typing:stop` from the active conversation room
- Exposes `typingUsers: { userId: string; name: string }[]`

#### [NEW] `lib/hooks/useMessages.ts`

Consolidates the message-fetching and socket-subscription logic currently inline in the page:
- `loadMessages(conversationId)` — fetches from API
- Listens for `message:new`, `message:edited`, `message:deleted`, `message:reaction`
- Manages the `msgs` state array
- Handles optimistic updates for send
- Auto-scrolls to bottom on new messages

---

### 6. Onboarding — Username Step

#### [MODIFY] Onboarding page/components

Add a new step between "Your Name" and "Contact" where the user chooses a `@username`:

- Input field with `@` prefix
- Real-time availability check (debounced API call to `/api/v1/users/username-check`)
- Green check / red X indicator
- Validation: 3–30 chars, alphanumeric + underscores, auto-lowercased

#### [MODIFY] Onboarding API / server action

Persist `username` to the `User` model on completion.

---

### 7. Mobile Layout

The mobile layout (< `lg` breakpoint) follows the WhatsApp pattern:

```
STATE: "list"                    STATE: "chat"
┌─────────────────────┐          ┌─────────────────────┐
│ ← Messages          │          │ ← Back  John Doe    │
│ ┌─────────────────┐ │          │ ────────────────────│
│ │ 🟢 John Doe     │ │   tap   │ │  Hey!            │ │
│ │  "Hey, how are…" │ │  ──→   │ │       How are you?│ │
│ ├─────────────────┤ │          │ │  I'm good!       │ │
│ │ 🔵 Jane Smith   │ │          │ │                   │ │
│ │  "See you tom…" │ │          │ │  John is typing…  │ │
│ └─────────────────┘ │          │ ────────────────────│
│                     │          │ [😊] [Type here…   ]│
│                     │          │              [Send] │
└─────────────────────┘          └─────────────────────┘
```

- `ChatShell` tracks `view: "list" | "chat"` state (mobile only)
- On conversation tap: `setView("chat")` + `setActiveId(id)`
- Back button in chat header: `setView("list")` + optionally keeps `activeId` so re-tapping is instant
- On desktop (`lg:` and up): always show both side-by-side

---

## Files Changed Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `prisma/schema.prisma` | Add `username` to User, `editedAt`/`deletedAt`/`replyToId` to Message, new `MessageReaction` model |
| MODIFY | `lib/schemas/messageSchema.ts` | Add `editMessageSchema`, `reactionSchema`, extend `createMessageSchema` with `replyToId` |
| MODIFY | `lib/schemas/onboardingSchema.ts` | Add `usernameStepSchema` and insert into steps array |
| MODIFY | `app/api/v1/messages/route.ts` | Include reactions/replyTo in GET, accept `replyToId` in POST |
| MODIFY | `app/api/v1/messages/[id]/route.ts` | Add edit (PATCH) and soft-delete (DELETE) logic |
| NEW | `app/api/v1/messages/[id]/reactions/route.ts` | POST/DELETE for emoji reactions |
| MODIFY | `app/api/v1/conversations/route.ts` | Resolve member names/usernames/avatars for display |
| NEW | `app/api/v1/users/username-check/route.ts` | Username availability check |
| MODIFY | `server.ts` | Add typing, presence, reaction, edit, delete socket events |
| REWRITE | `app/(dashboard)/messages/page.tsx` | Thin shell, delegates to `ChatShell` |
| NEW | `components/messages/ChatShell.tsx` | Orchestrator — manages active conversation, mobile toggle |
| NEW | `components/messages/ConversationList.tsx` | Sidebar with avatars, names, unread badges, presence dots |
| NEW | `components/messages/ChatPanel.tsx` | Chat header + message list + input composition |
| NEW | `components/messages/ChatBubble.tsx` | iMessage-style bubble with status, reply preview, reactions |
| NEW | `components/messages/ChatInput.tsx` | Auto-expanding textarea + emoji picker + reply preview bar |
| NEW | `components/messages/PresenceIndicator.tsx` | Green/gray dot overlay on avatars |
| NEW | `components/messages/TypingIndicator.tsx` | Animated three-dot bouncing indicator |
| NEW | `components/messages/ReadReceipt.tsx` | ✓ / ✓✓ / ✓✓ (blue) status icons |
| NEW | `lib/hooks/usePresence.ts` | Online/offline presence tracking hook |
| NEW | `lib/hooks/useTyping.ts` | Typing indicator emit/listen hook |
| NEW | `lib/hooks/useMessages.ts` | Consolidated message state + socket subscription hook |
| MODIFY | Onboarding page + API | Add username step to onboarding flow |

---

## Verification Plan

### Automated
```bash
npx prisma validate          # Schema changes compile
npx prisma generate          # Client regenerated
npm run build                # Full Next.js build passes with no TS errors
```

### Manual
- [ ] Open two browser tabs logged in as different users
- [ ] Start a conversation by `@username` search
- [ ] Send messages — verify iMessage-style bubbles render correctly
- [ ] Verify typing indicator appears in real-time for the other user
- [ ] Verify read receipts transition: ✓ → ✓✓ → ✓✓ (blue)
- [ ] Verify presence dots update when a user disconnects/reconnects
- [ ] Verify unread badges increment and clear correctly
- [ ] Long-press a message → test Reply, Edit, Delete, React
- [ ] Resize to mobile viewport → verify list/chat toggle works
- [ ] Test emoji picker opens and inserts emoji into the textarea
- [ ] Test multi-line input auto-expands and `Shift+Enter` creates newlines

---

## Open Questions

> [!IMPORTANT]
> **Emoji picker library**: Should we use `@emoji-mart/react` (full-featured, ~50KB gzipped) or build a minimal curated grid of ~100 common emojis to keep the bundle small?

> [!NOTE]
> **"Last seen" timestamps**: The current schema doesn't track the user's last activity timestamp. We can either: (a) add a `lastSeenAt` field to the User model and update it on socket disconnect, or (b) only show "Online" / "Offline" without a timestamp. Which do you prefer?

> [!NOTE]
> **Username migration**: Existing users who already completed onboarding won't have a username. Options: (a) prompt them to set one on next login, (b) auto-generate from their name (e.g. `john_doe_42`), or (c) leave it optional and fall back to displaying their full name. Recommendation: option (a) — show a one-time username prompt.

---

## Deferred to Phase 2

- File/media attachments (image, video, audio, document upload + inline preview)
- Full conversation search + in-chat message search
- Voice notes
- Message forwarding
- Group chat creation/management UI improvements
- Message pinning
- Notification sound preferences
