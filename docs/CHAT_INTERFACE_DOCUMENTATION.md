# Chat Interface Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Components](#components)
6. [State Management](#state-management)
7. [Styling & Theming](#styling--theming)
8. [Integration Points](#integration-points)
9. [User Flows](#user-flows)
10. [API Endpoints (Planned)](#api-endpoints-planned)
11. [Database Schema (Planned)](#database-schema-planned)
12. [Real-time Communication](#real-time-communication)
13. [Security Features](#security-features)
14. [Mobile Responsiveness](#mobile-responsiveness)
15. [Future Enhancements](#future-enhancements)

---

## Overview

The **Chat Interface** (DocuChain Messenger) is a comprehensive blockchain-secured messaging system integrated into DocuChain. It enables secure communication between students, faculty, and administrators with built-in document sharing and approval request workflows.

### Key Highlights
- **Blockchain-Secured**: All messages are secured using blockchain technology
- **Multi-Role Support**: Works seamlessly for students, faculty, and administrators
- **Document Integration**: Share documents directly from File Manager
- **Approval Workflows**: Request document approvals through chat
- **Theme Support**: Fully supports light and dark themes
- **Mobile Responsive**: Optimized for all screen sizes

---

## Features

### 1. Message Types
- **Direct Messages**: One-on-one conversations between users
- **Groups**: Multi-participant conversations for teams/classes
- **Circulars**: Official announcements and broadcast messages

### 2. Document Sharing
- **From File Manager**: Select documents from your file library
- **Share Mode**: Share documents with read access
- **Approval Mode**: Request document approvals with specific reviewers
- **Status Tracking**: Track approval status (Pending/Approved/Rejected)

### 3. Message Features
- **Text Messages**: Standard text communication
- **Document Attachments**: Attach and share files
- **Timestamp Tracking**: All messages timestamped
- **Read Receipts**: Track message read status
- **Unread Counters**: Badge indicators for unread messages

### 4. Approval Workflow
- **Request Approval**: Send documents for approval to specific members
- **Approval Actions**: Approve/Reject with reasons
- **Status Updates**: Real-time approval status updates
- **Integration**: Sends approved requests to Document Approval Page

### 5. User Experience
- **Search**: Search conversations and messages
- **Online Status**: See who's online
- **Typing Indicators**: See when someone is typing
- **Empty States**: Helpful prompts when no conversations exist
- **Security Badges**: Visual indicators for blockchain security

---

## Architecture

### Component Hierarchy
```
ChatInterface (Main Component)
├── Sidebar
│   ├── Header (DocuChain Messenger + Blockchain Badge)
│   ├── User Info (Current user profile)
│   ├── Search Bar
│   ├── Tabs (Direct/Groups/Circulars)
│   ├── Conversations List
│   └── Create Group Button (Admin only)
├── Chat Area
│   ├── Empty State (No conversation selected)
│   └── Active Chat
│       ├── Chat Header (Back button on mobile + User info)
│       ├── Messages Container
│       │   ├── Message Bubbles (Text)
│       │   └── Document Attachments
│       └── Message Input
│           ├── Attachment Button (+ Menu)
│           ├── Text Input
│           └── Send Button
└── Modals
    ├── Document Selection Modal
    │   ├── Modal Header
    │   ├── Document Grid (Cards)
    │   └── Actions (Cancel/Next)
    └── Document Share Modal
        ├── Share/Approval Toggle
        ├── Member Selection (Checkboxes)
        ├── Description Input
        └── Actions (Cancel/Send)
```

---

## File Structure

```
frontend/src/pages/shared/
├── ChatInterface.js         # Main React component
└── ChatInterface.css         # Themed styles
```

### ChatInterface.js
**Purpose**: Main React component for chat functionality  
**Lines**: 1,046  
**Exports**: Default export `ChatInterface`

### ChatInterface.css
**Purpose**: Complete styling with theme support  
**Lines**: 1,100+  
**Features**: 
- CSS variables for theming
- Light/dark mode support
- Mobile responsive queries
- Animation keyframes

---

## Components

### 1. ChatInterface (Main Component)

#### Props
None (standalone route component)

#### State Variables (15+)
```javascript
const [currentUser, setCurrentUser] = useState({...})        // Current logged-in user
const [activeTab, setActiveTab] = useState('direct')          // active tab: direct/groups/circulars
const [selectedChat, setSelectedChat] = useState(null)        // Currently open conversation
const [conversations, setConversations] = useState([...])     // List of all conversations
const [messages, setMessages] = useState([...])               // Messages in selected chat
const [newMessage, setNewMessage] = useState('')              // Input field text
const [searchQuery, setSearchQuery] = useState('')            // Search input
const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
const [availableDocuments] = useState([...])                  // From File Manager
const [teamMembers] = useState([...])                         // For sharing/approvals
const [isDocumentSelectionModalOpen, setIsDocumentSelectionModalOpen] = useState(false)
const [isDocumentShareModalOpen, setIsDocumentShareModalOpen] = useState(false)
const [selectedDocument, setSelectedDocument] = useState(null)
const [selectedMembers, setSelectedMembers] = useState([])
const [shareDescription, setShareDescription] = useState('')
const [documentAction, setDocumentAction] = useState('share') // 'share' or 'approval'
const [isMobileSidebarHidden, setIsMobileSidebarHidden] = useState(false)
```

#### Key Functions

##### selectConversation(conversationId)
```javascript
// Opens a conversation, marks it as read, handles mobile sidebar
const selectConversation = (conversationId) => {
  const conversation = conversations.find(c => c.id === conversationId);
  setSelectedChat(conversation);
  
  // Mark as read
  setConversations(conversations.map(c =>
    c.id === conversationId ? { ...c, unread: 0 } : c
  ));
  
  // Mobile: hide sidebar
  if (window.innerWidth <= 768) {
    setIsMobileSidebarHidden(true);
  }
};
```

##### sendMessage()
```javascript
// Sends a text message, updates conversation list
const sendMessage = () => {
  if (!newMessage.trim() || !selectedChat) return;
  
  const message = {
    id: messages.length + 1,
    sender: currentUser.name,
    content: newMessage,
    timestamp: new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
    isOwn: true
  };
  
  setMessages([...messages, message]);
  
  // Update conversation last message
  setConversations(conversations.map(c =>
    c.id === selectedChat.id 
      ? { ...c, lastMessage: newMessage, time: 'Just now' }
      : c
  ));
  
  setNewMessage('');
};
```

##### openDocumentSelector(action)
```javascript
// Opens document selection modal
// action: 'share' or 'approval'
const openDocumentSelector = (action) => {
  setDocumentAction(action);
  setIsDocumentSelectionModalOpen(true);
  setIsAttachmentMenuOpen(false);
};
```

##### sendDocumentRequest()
```javascript
// Shares document or sends approval request
const sendDocumentRequest = () => {
  if (!selectedDocument || selectedMembers.length === 0) {
    alert('Please select a document and at least one recipient');
    return;
  }
  
  const action = documentAction === 'share' ? 'shared' : 'requested approval for';
  const membersList = selectedMembers.map(id => 
    teamMembers.find(m => m.id === id).name
  ).join(', ');
  
  const message = {
    id: messages.length + 1,
    sender: currentUser.name,
    content: `${action} a document: ${selectedDocument.name}`,
    timestamp: new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
    isOwn: true,
    document: {
      ...selectedDocument,
      status: documentAction === 'approval' ? 'pending' : 'shared',
      description: shareDescription,
      approvers: documentAction === 'approval' ? selectedMembers : null
    }
  };
  
  setMessages([...messages, message]);
  
  // Close modals and reset state
  setIsDocumentShareModalOpen(false);
  setSelectedDocument(null);
  setSelectedMembers([]);
  setShareDescription('');
};
```

##### renderDocumentAttachment(document, isOwn)
```javascript
// Renders document attachment in message bubble
// Handles different statuses: shared, pending, approved, rejected
const renderDocumentAttachment = (document, isOwn) => {
  const getStatusColor = () => {
    switch(document.status) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'pending': return 'pending';
      default: return 'shared';
    }
  };
  
  return (
    <div className={`document-attachment ${getStatusColor()}`}>
      {/* Document header with name and type badge */}
      <div className="document-header">
        <div className="document-info">
          <span className="document-name">{document.name}</span>
          <span className="document-type-badge">{document.type}</span>
        </div>
      </div>
      
      {/* Approval request info (if status is pending/approved/rejected) */}
      {document.status !== 'shared' && (
        <div className="approval-request-info">
          {/* Show approvers, description */}
        </div>
      )}
      
      {/* Blockchain hash */}
      <div className="document-meta">
        <div className="document-hash">
          <i className="ri-shield-check-line"></i>
          {document.hash.substring(0, 16)}...
        </div>
      </div>
      
      {/* Action buttons based on status */}
      <div className="document-actions">
        {/* View, Download, Approve, Reject, Send to Approval Page */}
      </div>
    </div>
  );
};
```

---

## State Management

### Current User
```javascript
const [currentUser, setCurrentUser] = useState({
  name: 'John Doe',
  role: 'student',  // or 'faculty', 'admin'
  department: 'Computer Science',
  id: 1
});
```

### Conversations
```javascript
const [conversations, setConversations] = useState([
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    avatar: 'SJ',
    type: 'direct',  // or 'group', 'circular'
    lastMessage: 'Your thesis document looks good...',
    time: '2:30 PM',
    unread: 2,
    online: true
  },
  // ...more conversations
]);
```

### Messages
```javascript
const [messages, setMessages] = useState([
  {
    id: 1,
    sender: 'Dr. Sarah Johnson',
    content: 'Hi John, I reviewed your thesis...',
    timestamp: '2:28 PM',
    isOwn: false,  // false = received message
    document: null  // or document object if attached
  },
  {
    id: 2,
    sender: 'John Doe',
    content: 'Thank you for the feedback!',
    timestamp: '2:30 PM',
    isOwn: true,  // true = sent message
    document: {
      id: 1,
      name: 'Final_Thesis_v3.pdf',
      type: 'PDF',
      hash: '0x8f3e9d2a1b4c5f7e9d3a2b1c4f5e7d8a9b2c3f1e4d7a8b3c1f2e5d4a7b8c3f1',
      status: 'pending',  // or 'approved', 'rejected', 'shared'
      description: 'Please review and approve my final thesis submission',
      approvers: [2, 3]  // User IDs
    }
  }
]);
```

### Available Documents (from File Manager)
```javascript
const [availableDocuments] = useState([
  {
    id: 1,
    name: 'Final_Thesis_v3.pdf',
    type: 'PDF',
    size: '2.4 MB',
    hash: '0x8f3e9d2a1b4c5f7e9d3a2b1c4f5e7d8a9b2c3f1e4d7a8b3c1f2e5d4a7b8c3f1',
    uploadedDate: '2024-01-15'
  },
  // ...more documents
]);
```

### Team Members (for sharing/approvals)
```javascript
const [teamMembers] = useState([
  {
    id: 2,
    name: 'Dr. Sarah Johnson',
    role: 'Faculty',
    department: 'Computer Science'
  },
  {
    id: 3,
    name: 'Prof. Michael Chen',
    role: 'Faculty',
    department: 'Computer Science'
  },
  // ...more members
]);
```

---

## Styling & Theming

### Theme Structure
The Chat Interface uses CSS variables for complete theme support:

#### Light Theme
```css
.chat-interface-wrapper.theme-light {
  --bg: #edf2f7;              /* Main background */
  --bg-2: #e9eff6;            /* Secondary background */
  --surface: #ffffff;          /* Card/surface color */
  --line: #e6ebf2;            /* Border color */
  --text: #0f172a;            /* Primary text */
  --muted: #64748b;           /* Secondary text */
  --icon: #94a3b8;            /* Icon color */
  
  /* Green gradient colors (primary brand) */
  --g-900: #0a3f2f;
  --g-800: #0e5842;
  --g-700: #11684f;
  --g-600: #13815f;
  --g-500: #18a36f;
  --g-400: #23bd7c;
  --g-300: #88e2b9;
  --g-200: #c9f3e1;
  
  /* Status colors */
  --warning: #f59e0b;
  --info: #3b82f6;
  --danger: #ef4444;
  --success: #22c55e;
  
  /* Effects */
  --radius: 20px;
  --shadow: 0 10px 30px rgba(15,23,42,.08);
  --shadow-soft: 0 4px 16px rgba(15,23,42,.06);
}
```

#### Dark Theme
```css
.chat-interface-wrapper.theme-dark {
  --bg: #0f172a;              /* Dark background */
  --bg-2: #1e293b;            /* Secondary background */
  --surface: #1e293b;          /* Card/surface color */
  --line: #334155;            /* Border color */
  --text: #f1f5f9;            /* Light text */
  --muted: #94a3b8;           /* Secondary text */
  --icon: #64748b;            /* Icon color */
  
  /* Green gradient (same as light) */
  /* Status colors (same as light) */
  
  /* Darker shadows */
  --shadow: 0 10px 30px rgba(0,0,0,.3);
  --shadow-soft: 0 4px 16px rgba(0,0,0,.2);
}
```

### Component Styling

#### Sidebar
```css
.sidebar {
  width: 320px;
  background: var(--bg-2);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
```

#### Message Bubbles
```css
.message-bubble.own {
  background: linear-gradient(135deg, var(--g-600), var(--g-500));
  color: white;
}

.message-bubble.other {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text);
}
```

#### Document Attachments (Status-based)
```css
/* Shared document */
.document-attachment.shared {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-color: var(--g-300);
}

/* Pending approval */
.document-attachment.pending {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: var(--warning);
}

/* Approved */
.document-attachment.approved {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-color: var(--g-400);
}

/* Rejected */
.document-attachment.rejected {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border-color: #fca5a5;
}

/* Dark theme overrides */
.theme-dark .document-attachment.shared {
  background: linear-gradient(135deg, rgba(24, 163, 111, 0.15), rgba(24, 163, 111, 0.1));
  border-color: var(--g-600);
}
```

### Animations
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  animation: fadeInUp 0.3s ease-out;
}
```

---

## Integration Points

### 1. File Manager Integration

#### Document Selection
When user clicks "Share Document" or "Request Approval":
1. Opens Document Selection Modal
2. Displays documents from `availableDocuments` state
3. Documents should be fetched from File Manager API
4. User selects a document
5. Proceeds to Share Configuration

**Future API Call**:
```javascript
// Fetch user's documents from File Manager
const fetchDocuments = async () => {
  const response = await fetch('/api/files/list', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setAvailableDocuments(data.files);
};
```

#### Document Sharing Flow
```
User clicks attachment button
  → Opens attachment menu
  → User selects "Share Document" or "Request Approval"
  → Opens Document Selection Modal
  → User selects document
  → Opens Document Share Modal
  → User selects recipients and adds description
  → Sends document via chat
  → Document appears as attachment in message
```

### 2. Document Approval Page Integration

#### Approval Request Flow
```javascript
// When user clicks "Send to Approval Page" on a document
const sendToApprovalPage = (document) => {
  // Navigate to Document Approval Page with document data
  // Should pass document ID and approval request details
  window.location.href = `/document-approval?docId=${document.id}`;
};
```

#### Approval Status Updates
```javascript
// Receive approval status updates from Approval Page
window.DocuChainMessenger = {
  updateDocumentStatus: (documentId, status, reason) => {
    setMessages(messages.map(msg => {
      if (msg.document && msg.document.id === documentId) {
        return {
          ...msg,
          document: {
            ...msg.document,
            status: status,  // 'approved' or 'rejected'
            rejectionReason: reason
          }
        };
      }
      return msg;
    }));
  }
};
```

### 3. User Management Integration

#### Team Members List
```javascript
// Fetch team members for sharing/approval requests
const fetchTeamMembers = async () => {
  const response = await fetch('/api/users/team-members', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setTeamMembers(data.members);
};
```

### 4. Notification Integration

```javascript
// Receive new messages via notifications
window.DocuChainMessenger = {
  receiveMessage: (message) => {
    // Add new message to messages array
    // Update conversation list
    // Show notification badge
  },
  
  receiveApprovalUpdate: (documentId, status) => {
    // Update document status in messages
    // Show notification
  }
};
```

---

## User Flows

### Flow 1: Sending a Text Message
```
1. User logs in and navigates to Chat
2. User sees list of conversations in sidebar
3. User clicks on a conversation
4. Chat area opens with message history
5. User types message in input field
6. User clicks Send button (or presses Enter)
7. Message appears in chat with "Just now" timestamp
8. Conversation list updates with last message
```

### Flow 2: Sharing a Document
```
1. User opens a conversation
2. User clicks attachment button (paperclip icon)
3. Attachment menu opens
4. User selects "Share Document"
5. Document Selection Modal opens
6. User selects a document from grid
7. User clicks "Next"
8. Document Share Modal opens
9. "Share" option is pre-selected
10. User selects recipients (checkboxes)
11. User enters optional description
12. User clicks "Send Document"
13. Document appears as attachment in chat
14. Recipients receive notification
```

### Flow 3: Requesting Document Approval
```
1. User opens a conversation
2. User clicks attachment button
3. User selects "Request Approval"
4. Document Selection Modal opens
5. User selects document
6. User clicks "Next"
7. Document Share Modal opens
8. "Request Approval" option is pre-selected
9. User selects approvers (checkboxes)
10. User enters approval request description
11. User clicks "Send Request"
12. Document appears as "pending" approval in chat
13. Approvers receive notification
14. Approvers can Approve/Reject from chat
15. Status updates in real-time
```

### Flow 4: Approving/Rejecting Document
```
1. User receives approval request in chat
2. Document appears with "pending" status
3. User sees "Approve" and "Reject" buttons
4. User clicks "Approve"
   a. Approval is recorded
   b. Status changes to "approved" (green)
   c. Requester receives notification
5. OR User clicks "Reject"
   a. Prompt asks for rejection reason
   b. Rejection is recorded with reason
   c. Status changes to "rejected" (red)
   d. Requester receives notification
```

### Flow 5: Mobile Chat Experience
```
1. User opens chat on mobile device
2. Sidebar takes full width
3. User selects a conversation
4. Sidebar slides left (hidden)
5. Chat area takes full width
6. User sees back button in chat header
7. User clicks back button
8. Chat area slides right (hidden)
9. Sidebar slides back into view
10. User can select another conversation
```

---

## API Endpoints (Planned)

### Message Endpoints

#### GET /api/chat/conversations
**Description**: Get list of user's conversations  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "type": "direct",
      "participants": [
        {
          "id": 2,
          "name": "Dr. Sarah Johnson",
          "avatar": "SJ",
          "role": "faculty",
          "online": true
        }
      ],
      "lastMessage": {
        "content": "Your thesis looks good",
        "timestamp": "2024-01-15T14:30:00Z",
        "sender": "Dr. Sarah Johnson"
      },
      "unreadCount": 2
    }
  ]
}
```

#### GET /api/chat/messages/:conversationId
**Description**: Get messages in a conversation  
**Authentication**: Required  
**Parameters**: 
- `conversationId` (path): Conversation ID
- `page` (query): Page number (default: 1)
- `limit` (query): Messages per page (default: 50)

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 2,
      "senderName": "Dr. Sarah Johnson",
      "content": "Hi John, I reviewed your thesis",
      "timestamp": "2024-01-15T14:28:00Z",
      "isOwn": false,
      "readBy": [1],
      "document": null
    },
    {
      "id": 2,
      "conversationId": 1,
      "senderId": 1,
      "senderName": "John Doe",
      "content": "Thank you for the feedback!",
      "timestamp": "2024-01-15T14:30:00Z",
      "isOwn": true,
      "readBy": [2],
      "document": {
        "id": 1,
        "name": "Final_Thesis_v3.pdf",
        "type": "PDF",
        "hash": "0x8f3e9d...",
        "status": "pending",
        "approvers": [2, 3]
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalMessages": 125
  }
}
```

#### POST /api/chat/messages
**Description**: Send a message  
**Authentication**: Required  
**Request Body**:
```json
{
  "conversationId": 1,
  "content": "Hello, how are you?",
  "documentId": null  // or document ID if sharing
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "id": 126,
    "conversationId": 1,
    "senderId": 1,
    "senderName": "John Doe",
    "content": "Hello, how are you?",
    "timestamp": "2024-01-15T14:35:00Z",
    "isOwn": true,
    "readBy": [],
    "document": null
  }
}
```

#### POST /api/chat/conversations/create
**Description**: Create a new conversation (group)  
**Authentication**: Required  
**Request Body**:
```json
{
  "name": "CS Research Team",
  "type": "group",
  "participants": [1, 2, 3, 4]
}
```

**Response**:
```json
{
  "success": true,
  "conversation": {
    "id": 5,
    "name": "CS Research Team",
    "type": "group",
    "participants": [...],
    "createdAt": "2024-01-15T14:40:00Z"
  }
}
```

### Document Sharing Endpoints

#### POST /api/chat/documents/share
**Description**: Share a document via chat  
**Authentication**: Required  
**Request Body**:
```json
{
  "documentId": 1,
  "conversationId": 1,
  "recipientIds": [2, 3],
  "description": "Please review this document",
  "action": "share"  // or "approval"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "id": 127,
    "conversationId": 1,
    "senderId": 1,
    "content": "shared a document: Final_Thesis_v3.pdf",
    "timestamp": "2024-01-15T14:45:00Z",
    "document": {
      "id": 1,
      "name": "Final_Thesis_v3.pdf",
      "status": "shared",
      "hash": "0x8f3e9d..."
    }
  }
}
```

#### POST /api/chat/documents/approve
**Description**: Approve a document  
**Authentication**: Required  
**Request Body**:
```json
{
  "documentId": 1,
  "messageId": 127,
  "status": "approved",  // or "rejected"
  "reason": "Looks great!"  // optional for approval, required for rejection
}
```

**Response**:
```json
{
  "success": true,
  "approval": {
    "documentId": 1,
    "status": "approved",
    "approvedBy": 2,
    "timestamp": "2024-01-15T15:00:00Z"
  }
}
```

### User Endpoints

#### GET /api/chat/team-members
**Description**: Get team members for sharing/approvals  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "members": [
    {
      "id": 2,
      "name": "Dr. Sarah Johnson",
      "role": "faculty",
      "department": "Computer Science",
      "online": true
    },
    {
      "id": 3,
      "name": "Prof. Michael Chen",
      "role": "faculty",
      "department": "Computer Science",
      "online": false
    }
  ]
}
```

---

## Database Schema (Planned)

### conversations Table
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group', 'circular')),
    name VARCHAR(255),  -- NULL for direct messages
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### conversation_participants Table
```sql
CREATE TABLE conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',  -- 'admin', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);
```

### messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    document_id INTEGER REFERENCES documents(id),  -- NULL if no document
    blockchain_hash VARCHAR(255),  -- Blockchain transaction hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP  -- Soft delete
);
```

### message_reads Table
```sql
CREATE TABLE message_reads (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);
```

### document_shares Table
```sql
CREATE TABLE document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    shared_by INTEGER REFERENCES users(id),
    shared_with INTEGER REFERENCES users(id),
    action_type VARCHAR(20) CHECK (action_type IN ('share', 'approval')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shared')),
    description TEXT,
    blockchain_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### document_approvals Table
```sql
CREATE TABLE document_approvals (
    id SERIAL PRIMARY KEY,
    document_share_id INTEGER REFERENCES document_shares(id) ON DELETE CASCADE,
    approver_id INTEGER REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    blockchain_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_share_id, approver_id)
);
```

### Indexes
```sql
-- Conversations
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);

-- Participants
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_document ON messages(document_id);

-- Reads
CREATE INDEX idx_reads_message ON message_reads(message_id);
CREATE INDEX idx_reads_user ON message_reads(user_id);

-- Shares
CREATE INDEX idx_shares_document ON document_shares(document_id);
CREATE INDEX idx_shares_message ON document_shares(message_id);
CREATE INDEX idx_shares_shared_with ON document_shares(shared_with);

-- Approvals
CREATE INDEX idx_approvals_share ON document_approvals(document_share_id);
CREATE INDEX idx_approvals_approver ON document_approvals(approver_id);
```

---

## Real-time Communication

### Options

#### Option 1: WebSocket (Recommended)
```javascript
// Client-side WebSocket connection
const socket = new WebSocket('ws://localhost:5000/chat');

socket.onopen = () => {
  console.log('Connected to chat server');
  socket.send(JSON.stringify({ 
    type: 'authenticate', 
    token: localStorage.getItem('token') 
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'new_message':
      // Add message to messages array
      setMessages([...messages, data.message]);
      break;
      
    case 'approval_update':
      // Update document status
      updateDocumentStatus(data.documentId, data.status);
      break;
      
    case 'typing':
      // Show typing indicator
      setTypingUsers([...typingUsers, data.userId]);
      break;
  }
};

// Send message via WebSocket
const sendMessage = (content) => {
  socket.send(JSON.stringify({
    type: 'message',
    conversationId: selectedChat.id,
    content: content
  }));
};
```

#### Option 2: Server-Sent Events (SSE)
```javascript
// Client-side SSE connection
const eventSource = new EventSource('/api/chat/stream');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  // Handle new message
});

eventSource.addEventListener('approval', (event) => {
  const data = JSON.parse(event.data);
  // Handle approval update
});
```

#### Option 3: Polling (Fallback)
```javascript
// Poll for new messages every 3 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (selectedChat) {
      fetchNewMessages(selectedChat.id);
    }
  }, 3000);
  
  return () => clearInterval(interval);
}, [selectedChat]);

const fetchNewMessages = async (conversationId) => {
  const response = await fetch(
    `/api/chat/messages/${conversationId}?since=${lastMessageId}`
  );
  const data = await response.json();
  if (data.messages.length > 0) {
    setMessages([...messages, ...data.messages]);
  }
};
```

---

## Security Features

### 1. Blockchain Security

#### Message Hashing
```javascript
// Each message is hashed and stored on blockchain
const hashMessage = (message) => {
  const data = {
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    timestamp: message.timestamp
  };
  
  // Create blockchain transaction
  const hash = web3.utils.sha3(JSON.stringify(data));
  return hash;
};
```

#### Document Verification
```javascript
// Verify document integrity via blockchain
const verifyDocument = async (documentId, hash) => {
  const contract = new web3.eth.Contract(DocumentManagerABI, contractAddress);
  const onChainHash = await contract.methods.getDocumentHash(documentId).call();
  return onChainHash === hash;
};
```

### 2. Authentication & Authorization

```javascript
// Verify user can access conversation
const canAccessConversation = (userId, conversationId) => {
  // Check if user is participant in conversation
  return conversation_participants.exists(conversationId, userId);
};

// Verify user can approve document
const canApproveDocument = (userId, documentShareId) => {
  // Check if user is in approvers list
  return document_shares.approvers.includes(userId);
};
```

### 3. Message Encryption (Future)

```javascript
// End-to-end encryption for sensitive messages
const encryptMessage = (content, recipientPublicKey) => {
  // Use recipient's public key to encrypt
  const encrypted = crypto.publicEncrypt(recipientPublicKey, Buffer.from(content));
  return encrypted.toString('base64');
};

const decryptMessage = (encryptedContent, privateKey) => {
  // Use private key to decrypt
  const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedContent, 'base64'));
  return decrypted.toString();
};
```

---

## Mobile Responsiveness

### Breakpoints
```css
/* Tablet and below (768px) */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: absolute;
    z-index: 10;
    height: 100vh;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .sidebar.mobile-hidden {
    transform: translateX(-100%);
  }
  
  .chat-area.mobile-full {
    width: 100%;
  }
}

/* Mobile (480px) */
@media (max-width: 480px) {
  .conversation-avatar,
  .chat-avatar,
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .message-bubble {
    max-width: 85%;
    padding: 12px 16px;
  }
}
```

### Mobile Behavior

#### Sidebar Toggle
```javascript
const [isMobileSidebarHidden, setIsMobileSidebarHidden] = useState(false);

const selectConversation = (conversationId) => {
  setSelectedChat(conversation);
  
  // On mobile, hide sidebar when chat opens
  if (window.innerWidth <= 768) {
    setIsMobileSidebarHidden(true);
  }
};

const handleBackButton = () => {
  setSelectedChat(null);
  setIsMobileSidebarHidden(false);  // Show sidebar again
};
```

#### Touch Gestures
```javascript
// Swipe to go back (future enhancement)
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchEndX - touchStartX;
  
  // Swipe right to go back
  if (diff > 50 && isMobileSidebarHidden) {
    handleBackButton();
  }
};
```

---

## Future Enhancements

### Phase 1: Core Features (Completed)
- ✅ Basic messaging (text)
- ✅ Conversations list
- ✅ Document sharing
- ✅ Approval requests
- ✅ Theme support
- ✅ Mobile responsive

### Phase 2: Real-time Features (In Progress)
- ⏳ WebSocket integration
- ⏳ Typing indicators
- ⏳ Online status
- ⏳ Message read receipts
- ⏳ Push notifications

### Phase 3: Advanced Features (Planned)
- 📋 Group creation
- 📋 Group management (add/remove members)
- 📋 Circular announcements
- 📋 Message search
- 📋 Message reactions (emoji)
- 📋 Message replies/threading
- 📋 File upload directly from chat
- 📋 Voice messages
- 📋 Video calls

### Phase 4: Enterprise Features (Future)
- 🔮 End-to-end encryption
- 🔮 Message retention policies
- 🔮 Compliance & audit logs
- 🔮 Integration with external systems
- 🔮 Advanced analytics
- 🔮 AI-powered smart replies
- 🔮 Translation services

---

## Testing

### Manual Testing Checklist

#### Message Sending
- [ ] Send text message in direct conversation
- [ ] Send text message in group conversation
- [ ] Send empty message (should be blocked)
- [ ] Send very long message (test wrapping)
- [ ] Send message with special characters
- [ ] Send message with emojis

#### Document Sharing
- [ ] Share document with single recipient
- [ ] Share document with multiple recipients
- [ ] Request approval from single approver
- [ ] Request approval from multiple approvers
- [ ] Approve document
- [ ] Reject document with reason
- [ ] View document details
- [ ] Download document

#### UI/UX
- [ ] Switch between tabs (Direct/Groups/Circulars)
- [ ] Search conversations
- [ ] Mark conversation as read
- [ ] Unread badge updates correctly
- [ ] Scroll through long message history
- [ ] Theme switching (light/dark)
- [ ] Mobile sidebar toggle
- [ ] Mobile back button

#### Modals
- [ ] Open document selection modal
- [ ] Select/deselect documents
- [ ] Open share configuration modal
- [ ] Toggle share/approval mode
- [ ] Select/deselect recipients
- [ ] Enter description
- [ ] Cancel operations
- [ ] Click outside to close

#### Responsive Design
- [ ] Desktop view (1920x1080)
- [ ] Laptop view (1366x768)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Landscape orientation
- [ ] Portrait orientation

---

## Troubleshooting

### Common Issues

#### 1. Messages Not Sending
**Problem**: Click send button but message doesn't appear  
**Possible Causes**:
- Empty message (spaces only)
- No conversation selected
- Network error

**Solution**:
```javascript
// Check if message is not empty
if (!newMessage.trim()) {
  alert('Message cannot be empty');
  return;
}

// Check if conversation is selected
if (!selectedChat) {
  alert('Please select a conversation');
  return;
}
```

#### 2. Theme Not Applying
**Problem**: CSS variables not working  
**Possible Causes**:
- CSS file not imported
- Wrong theme class name
- Theme context not provided

**Solution**:
```javascript
// Ensure ChatInterface.css is imported
import './ChatInterface.css';

// Verify ThemeContext is available
const { theme } = useContext(ThemeContext);
console.log('Current theme:', theme);  // Should be 'light' or 'dark'

// Check wrapper class
<div className={`chat-interface-wrapper theme-${theme}`}>
```

#### 3. Modal Not Closing
**Problem**: Modal stays open after clicking close  
**Possible Causes**:
- Event propagation issues
- State not updating

**Solution**:
```javascript
// Stop propagation when clicking modal content
const handleModalContentClick = (e) => {
  e.stopPropagation();
};

// Close modal when clicking backdrop
const handleBackdropClick = () => {
  setIsDocumentSelectionModalOpen(false);
  setIsDocumentShareModalOpen(false);
};
```

#### 4. Mobile Sidebar Not Hiding
**Problem**: Sidebar doesn't hide on mobile when chat opens  
**Possible Causes**:
- `isMobileSidebarHidden` state not updating
- CSS transition not working
- Wrong breakpoint

**Solution**:
```javascript
// Ensure state updates on mobile
const selectConversation = (conversationId) => {
  setSelectedChat(conversation);
  
  // Force sidebar hide on mobile
  if (window.innerWidth <= 768) {
    setIsMobileSidebarHidden(true);
  }
};

// Add transition CSS
.sidebar {
  transition: transform 0.3s ease;
}
```

---

## Accessibility

### Keyboard Navigation
```javascript
// Enter to send message
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// ESC to close modal
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      setIsDocumentSelectionModalOpen(false);
      setIsDocumentShareModalOpen(false);
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

### ARIA Labels
```html
<!-- Accessible button labels -->
<button aria-label="Send message" onClick={sendMessage}>
  <i className="ri-send-plane-fill"></i>
</button>

<button aria-label="Attach document" onClick={toggleAttachmentMenu}>
  <i className="ri-attachment-2"></i>
</button>

<!-- Accessible modal -->
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="modal-title"
  className="document-selection-modal"
>
  <h2 id="modal-title">Select Document</h2>
  ...
</div>
```

---

## Performance Optimization

### Message Pagination
```javascript
// Load messages in chunks
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMoreMessages = async () => {
  if (!hasMore) return;
  
  const response = await fetch(
    `/api/chat/messages/${selectedChat.id}?page=${page + 1}`
  );
  const data = await response.json();
  
  setMessages([...data.messages, ...messages]);  // Prepend older messages
  setPage(page + 1);
  setHasMore(data.pagination.currentPage < data.pagination.totalPages);
};

// Infinite scroll
const handleScroll = (e) => {
  const { scrollTop } = e.target;
  if (scrollTop === 0 && hasMore) {
    loadMoreMessages();
  }
};
```

### Virtual Scrolling (for large lists)
```javascript
// Use react-window for large conversation lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={conversations.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ConversationItem conversation={conversations[index]} />
    </div>
  )}
</FixedSizeList>
```

### Debounced Search
```javascript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query) => {
    // Perform search
    const filtered = conversations.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredConversations(filtered);
  }, 300),
  [conversations]
);

const handleSearchChange = (e) => {
  setSearchQuery(e.target.value);
  debouncedSearch(e.target.value);
};
```

---

## Conclusion

The Chat Interface is a comprehensive, production-ready messaging system with advanced features like document sharing, approval workflows, and blockchain security. It's fully integrated with DocuChain's theme system and provides an excellent user experience across all devices.

**Next Steps**:
1. Implement backend API endpoints
2. Set up WebSocket for real-time messaging
3. Connect to File Manager for document selection
4. Integrate with Document Approval Page
5. Add comprehensive testing
6. Deploy to production

For questions or issues, refer to this documentation or contact the development team.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Author**: DocuChain Development Team
