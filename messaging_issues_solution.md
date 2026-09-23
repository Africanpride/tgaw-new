# Fix Real-Time Messaging Without Page Refresh

## Problem Description
When users send or receive messages at `http://localhost:3000/messages`, the messages do not update in real-time. The user has to refresh the page to see incoming messages and updated conversation lists.

### Root Causes Identified
1. **Unjoined Sockets in Inbox / Conversation List View**: Sockets only join a room when a conversation is actively open via `useMessages(conversationId)`. If a user is on `/messages` with no conversation selected (`activeId === null`) or has a different conversation selected, they are never in room `message.conversationId`. When `app/api/v1/messages/route.ts` emits `io.to(message.conversationId).emit("message:new", message)`, the other conversation member never receives the event in `ChatShell`, so the conversation list and badges never update.
2. **Missing Room Re-join on Reconnect**: `useMessages.ts` only called `socket.emit("conversation:join", conversationId)` on component mount or when `conversationId` changed. When Socket.IO reconnects (e.g. after transport upgrade, brief disconnection, or React Strict Mode mount), the server destroys the old socket's room memberships. The new connection never re-joins `conversationId`.
3. **Missing User-Level Sockets on Connection**: Sockets in `server.ts` were never joined to `user:${userId}` or their existing conversation rooms on connection.
4. **`SocketProvider` Lifecycle Issues**:
   - `connected` state was initialized to `false` without checking `socket.connected`. If the socket connected before the listener was attached, `connected` remained `false` forever.
   - The effect cleanup in `SocketProvider` called `s.disconnect()` and set `sharedSocket = null`, breaking the persistent singleton during React 19 remounts.
   - `connect_error` events were ignored.
5. **No Real-Time Notification for New Conversations**: When a new conversation was created via `POST /api/v1/conversations`, no socket event was broadcast to the other participant(s).
6. **Stale Closure in `ChatShell`**: `handleMessageNew` in `ChatShell.tsx` captured `activeId` without a ref, preventing accurate tracking of whether the newly received message belongs to the currently active conversation.

---

## Proposed Changes

### 1. Backend: Server & API Broadcasts

#### [MODIFY] [server.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/server.ts)
- In `io.on("connection", (socket) => { ... })`:
  - Automatically join `user:${userId}` room.
  - Query the database for conversations the user belongs to (`memberIds: { has: userId }`) and automatically join all those conversation rooms so the client is always ready to receive messages and typing indicators.
  - Keep `socket.on("conversation:join")` and `socket.on("conversation:leave")` for dynamic joining.

#### [MODIFY] [app/api/v1/messages/route.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/messages/route.ts)
- When a new message is saved:
  - Broadcast to `io.to(message.conversationId)`.
  - Also broadcast to `io.to("user:" + memberId)` for all members of the conversation to guarantee delivery even if they haven't joined the conversation room.

#### [MODIFY] [app/api/v1/messages/[id]/route.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/messages/[id]/route.ts)
- For `PATCH` (edit) and `DELETE` (delete): broadcast to both `message.conversationId` and all member user rooms (`user:${memberId}`).

#### [MODIFY] [app/api/v1/messages/[id]/reactions/route.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/messages/[id]/reactions/route.ts)
- Broadcast reaction additions and removals to both `targetMessage.conversationId` and all member user rooms (`user:${memberId}`).

#### [MODIFY] [app/api/v1/conversations/route.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/app/api/v1/conversations/route.ts)
- In `POST /api/v1/conversations`: broadcast a `"conversation:new"` event to all member user rooms (`user:${memberId}`) so `ChatShell` adds the new conversation instantly without requiring a page refresh.

---

### 2. Frontend: Client Socket Provider & Hooks

#### [MODIFY] [providers/SocketProvider.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/providers/SocketProvider.tsx)
- Initialize `connected` state to `socket?.connected ?? false`.
- Synchronize `connected` state in `useEffect` (`setConnected(s.connected)`).
- Listen for `connect_error` and log errors.
- Remove destructive `s.disconnect()` and `sharedSocket = null` from the provider effect cleanup, maintaining a stable client socket singleton across route changes and Strict Mode.

#### [MODIFY] [hooks/useMessages.ts](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/hooks/useMessages.ts)
- Re-join room on `connect` event:
  ```ts
  const join = () => socket.emit("conversation:join", conversationId);
  if (socket.connected) join();
  socket.on("connect", join);
  ```
- Ensure cleanup removes `socket.off("connect", join)`.

#### [MODIFY] [components/messages/ChatShell.tsx](file:///home/tl-wr840n/Documents/Projects/development/tgaw-new/components/messages/ChatShell.tsx)
- Use `activeIdRef` to avoid stale closures in `handleMessageNew`.
- When `handleMessageNew` receives a message for the currently active conversation, do not mark as unread (`hasUnread: false`, `unreadCount: 0`).
- Listen for `"conversation:new"` event and automatically call `fetchConversations()`.

---

## Verification Plan

### Automated Tests
1. Run a test script with two socket clients (User A and User B) to verify:
   - User B receives messages sent by User A via `POST /api/v1/messages` without needing to manually refresh.
   - User B receives messages when User B is in the inbox (conversation list) view.
   - User B receives message edits, deletes, and reactions in real time.
2. Run `npm run typecheck` / `bun run typecheck` to ensure full TypeScript type safety.

### Manual Verification
1. Open `http://localhost:3000/messages` in the browser.
2. Send a message to the conversation from another session.
3. Confirm that the message appears immediately in both the conversation list and the open chat view without refreshing.
