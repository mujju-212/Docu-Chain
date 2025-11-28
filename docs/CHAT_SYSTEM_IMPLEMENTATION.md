# DocuChain Chat System - Complete Implementation Documentation

## Overview

This document describes the comprehensive real-time chat system implemented for DocuChain, enabling secure messaging between users within institutions. The system supports direct messages, group chats, and circular communications with features like read receipts, online status, typing indicators, and document sharing.

---

## Table of Contents

1. [Features Implemented](#features-implemented)
2. [Database Schema](#database-schema)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [WebSocket Events](#websocket-events)
5. [Frontend Components](#frontend-components)
6. [Auto-Message Triggers](#auto-message-triggers)
7. [File Changes Summary](#file-changes-summary)
8. [Setup Instructions](#setup-instructions)
9. [Testing Guide](#testing-guide)

---

## Features Implemented

### Core Chat Features
- ✅ **Direct Messaging**: One-on-one conversations between users
- ✅ **Group Chats**: Multi-user group conversations
- ✅ **Circular Chats**: Institution-wide or department-wide announcements
- ✅ **Real-time Messaging**: WebSocket-based with HTTP polling fallback
- ✅ **Message Persistence**: All conversations stored in PostgreSQL database

### User Experience Features
- ✅ **User Search**: Search users by name, email, phone, or unique ID
- ✅ **Online Status**: Real-time online/offline indicators
- ✅ **Last Seen**: Shows when user was last active
- ✅ **Typing Indicators**: Shows when other users are typing
- ✅ **Read Receipts**: Message status (sent → delivered → read)
- ✅ **Unread Count**: Badge showing unread messages per conversation

### Conversation Management
- ✅ **Pin Conversations**: Keep important chats at top
- ✅ **Mute Notifications**: Silence specific conversations
- ✅ **Block Users**: Block unwanted contacts
- ✅ **Create Groups**: Form group chats with selected members

### Document Integration
- ✅ **Document Sharing**: Share documents within chat
- ✅ **Auto-messages on Share**: Automatic chat message when documents are shared
- ✅ **Approval Requests**: Auto-notify approvers via chat when approval requested

### Auto Groups
- ✅ **Institution Groups**: Automatically created on user login
- ✅ **Department Groups**: Automatically created based on user's department

---

## Database Schema

### New Tables Created

#### `conversations`
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,  -- 'direct', 'group', 'circular'
    name VARCHAR(255),
    description TEXT,
    avatar_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    department_id UUID REFERENCES departments(id),
    user1_id UUID REFERENCES users(id),  -- For direct messages
    user2_id UUID REFERENCES users(id),  -- For direct messages
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `conversation_members`
```sql
CREATE TABLE conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member',  -- 'admin', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    notification_enabled BOOLEAN DEFAULT TRUE
);
```

#### `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'document_share', 'approval_request'
    document_id UUID REFERENCES documents(id),
    document_name VARCHAR(255),
    document_hash VARCHAR(255),
    document_size INTEGER,
    reply_to_id UUID REFERENCES messages(id),
    status VARCHAR(20) DEFAULT 'sent',  -- 'sent', 'delivered', 'read'
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_online_status`
```sql
CREATE TABLE user_online_status (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    socket_id VARCHAR(255)
);
```

---

## Backend API Endpoints

### User Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/users/search?q={query}` | Search users by name, email, phone, unique_id |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | Get all user's conversations |
| POST | `/api/chat/conversations` | Create new conversation (direct/group) |
| GET | `/api/chat/conversations/{id}` | Get conversation details |
| PATCH | `/api/chat/conversations/{id}/settings` | Update mute/pin/block settings |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations/{id}/messages` | Get messages for conversation |
| POST | `/api/chat/conversations/{id}/messages` | Send a new message |
| DELETE | `/api/chat/messages/{id}` | Delete a message |
| GET | `/api/chat/conversations/{id}/poll` | Poll for new messages (HTTP fallback) |

### Online Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/status/online` | Mark user as online |
| POST | `/api/chat/status/offline` | Mark user as offline |

### Group Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/conversations/{id}/members` | Add members to group |
| DELETE | `/api/chat/conversations/{id}/members/{user_id}` | Remove member from group |

### Unread Count
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/unread` | Get total unread message count |

---

## WebSocket Events

### Connection
```javascript
// Client connects with JWT token
socket = io(SOCKET_URL, {
    query: { token: jwtToken },
    transports: ['polling', 'websocket']
});
```

### Events Emitted by Client
| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId }` | Join a conversation room |
| `leave_conversation` | `{ conversationId }` | Leave a conversation room |
| `send_message` | `{ conversationId, content, messageType }` | Send a message |
| `typing_start` | `{ conversationId }` | User started typing |
| `typing_stop` | `{ conversationId }` | User stopped typing |
| `mark_read` | `{ conversationId, messageIds }` | Mark messages as read |

### Events Received by Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | Message object | New message received |
| `message_delivered` | `{ messageId, status }` | Message was delivered |
| `message_read` | `{ messageId, readBy, status }` | Message was read |
| `user_typing` | `{ userId, userName, isTyping }` | Typing indicator |
| `user_online` | `{ userId, online, lastSeen }` | User came online |
| `user_offline` | `{ userId, online, lastSeen }` | User went offline |

---

## Frontend Components

### ChatInterface.js
Main chat component with the following features:

#### State Management
```javascript
// Conversations and messages
const [conversations, setConversations] = useState([]);
const [messages, setMessages] = useState([]);

// Real-time status
const [onlineUsers, setOnlineUsers] = useState({});
const [typingUsers, setTypingUsers] = useState({});

// UI state
const [selectedChat, setSelectedChat] = useState(null);
const [loading, setLoading] = useState(true);
const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
```

#### Key Functions
- `fetchConversations()` - Load user's conversations from API
- `fetchMessages(conversationId)` - Load messages for selected conversation
- `sendMessage()` - Send message via WebSocket or HTTP fallback
- `searchUsers(query)` - Search for users to start conversation
- `startConversation(userId)` - Create new direct message
- `createGroup(name, memberIds)` - Create new group chat
- `handleMessageInputChange()` - Handle typing with indicator

### UI Components
- **Sidebar**: Conversation list with tabs (Direct, Groups, Circulars)
- **Chat Area**: Message display with input
- **User Search Modal**: Find and start conversations
- **Create Group Modal**: Form group chats
- **Profile Modal**: View user profile details

---

## Auto-Message Triggers

### Document Sharing
When a user shares a document with another user, an automatic chat message is created:

**File**: `backend/app/routes/shares.py`
```python
def send_share_chat_message(sharer_id, recipient_id, document, share):
    # Creates/finds direct conversation
    # Sends document_share message type
```

### Approval Requests
When a user requests document approval, automatic messages are sent to all approvers:

**File**: `backend/app/routes/approvals.py`
```python
def send_approval_request_chat_message(requester_id, approver_id, document, approval_request):
    # Creates/finds direct conversation
    # Sends approval_request message type
```

### Auto Groups on Login
When a user logs in, institution and department groups are automatically created:

**File**: `backend/app/routes/auth.py`
- Calls `create_auto_groups_for_user(user_id)` after successful login

---

## File Changes Summary

### New Files Created

| File | Description |
|------|-------------|
| `backend/app/models/chat.py` | Database models for chat system |
| `backend/app/websocket_events.py` | WebSocket event handlers |
| `backend/create_chat_tables.py` | Database migration script |

### Modified Files

| File | Changes |
|------|---------|
| `backend/app/__init__.py` | Added SocketIO init, chat model import |
| `backend/app/models/__init__.py` | Export chat models |
| `backend/app/routes/chat.py` | Complete rewrite with all chat APIs |
| `backend/app/routes/shares.py` | Added auto chat message on share |
| `backend/app/routes/approvals.py` | Added auto chat message on approval request |
| `backend/app/routes/auth.py` | Added auto groups creation on login |
| `backend/run.py` | Updated for SocketIO with threading mode |
| `frontend/src/pages/shared/ChatInterface.js` | Complete rewrite with real API integration |
| `frontend/src/pages/shared/ChatInterface.css` | Added styles for new components |
| `frontend/package.json` | Added socket.io-client dependency |

---

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install flask-socketio
```

**Frontend:**
```bash
cd frontend
npm install socket.io-client
```

### 2. Create Database Tables

```bash
cd backend
python create_chat_tables.py
```

Or the tables will be auto-created on server start via `db.create_all()`.

### 3. Start the Backend

```bash
cd backend
python run.py
```

The server runs with SocketIO in threading mode (compatible with Python 3.13).

### 4. Start the Frontend

```bash
cd frontend
npm start
```

---

## Testing Guide

### Test User Search
1. Click the **+** button next to user profile
2. Type a name, email, or unique ID
3. Verify search results appear after 2+ characters

### Test Direct Messaging
1. Search for a user
2. Click on the user to start conversation
3. Send a message
4. Verify message appears in chat

### Test Group Chat
1. Click **Create Group** button
2. Enter group name
3. Search and add members
4. Click Create
5. Send message to group

### Test Real-time Features
1. Open chat in two browser windows with different users
2. Send message from one - should appear instantly in other
3. Type in one - should show "typing..." in other
4. Close one window - should show "offline" status

### Test Read Receipts
1. Send message (shows single checkmark - sent)
2. Other user receives (shows double checkmark - delivered)
3. Other user views message (shows blue checkmarks - read)

### Test Auto Messages
1. Share a document with another user
2. Check chat - automatic message should appear
3. Request document approval
4. Check approver's chat - automatic message should appear

---

## Technical Notes

### WebSocket Fallback
The system uses HTTP polling as fallback when WebSocket connection fails:
- Frontend attempts WebSocket connection first
- If connection fails, falls back to polling every 5 seconds
- All features work with either transport method

### Python 3.13 Compatibility
- Eventlet doesn't work with Python 3.13 (distutils removed)
- Using `threading` async mode instead
- Set `allow_unsafe_werkzeug=True` for development

### Security
- All API endpoints require JWT authentication
- Users can only access conversations they're members of
- Cross-institution messaging is blocked
- WebSocket connections authenticated via token in query params

---

## Future Enhancements

- [ ] Message reactions (emoji)
- [ ] Message forwarding
- [ ] Voice messages
- [ ] File attachments (images, PDFs)
- [ ] Message search
- [ ] Conversation archives
- [ ] Push notifications
- [ ] End-to-end encryption

---

*Document created: November 29, 2025*
*Last updated: November 29, 2025*
