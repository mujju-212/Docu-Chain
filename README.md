<div align="center">

<img src="assets/logo.png" alt="DocuChain Logo" width="180"/>

# DocuChain

### Blockchain-Powered Document Management for Educational Institutions

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethereum.org/)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)](https://pinata.cloud/)

---

A decentralized document management platform that uses **Ethereum blockchain**, **IPFS storage**, and **smart contract approval workflows** to eliminate document fraud in schools, colleges, and universities. Documents are cryptographically secured, tamper-proof, and verifiable by anyone via QR code — no login required.

---

[Overview](#overview) · [Architecture](#system-architecture) · [User Roles](#user-roles--access-control) · [Features](#core-features) · [Workflows](#key-workflows) · [Database](#database-schema) · [Blockchain](#blockchain-layer) · [API](#api-layer) · [Tech Stack](#technology-stack) · [Setup](#setup--installation)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem & Solution](#the-problem--solution)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [User Roles & Access Control](#user-roles--access-control)
6. [Core Features](#core-features)
   - [Institution Registration & Onboarding](#1-institution-registration--onboarding)
   - [Account Management & Approval](#2-account-management--approval)
   - [File Manager](#3-file-manager)
   - [Document Approval Workflow](#4-document-approval-workflow)
   - [Document Generation](#5-document-generation-from-templates)
   - [Chat & Messaging](#6-chat--real-time-messaging)
   - [Circular Management](#7-circular-management)
   - [Verification Tool](#8-verification-tool)
   - [User Management (Admin)](#9-user-management-admin-only)
   - [Institution Management (Admin)](#10-institution-management-admin-only)
   - [Blockchain Monitor](#11-blockchain-monitor)
   - [Activity Logs](#12-activity-logs)
   - [Notifications](#13-notifications)
   - [Settings & Preferences](#14-settings--preferences)
7. [Key Workflows](#key-workflows)
   - [Document Upload Flow](#document-upload-to-blockchain--ipfs)
   - [Approval Workflow Flow](#document-approval-flow)
   - [Verification Flow](#document-verification-flow)
   - [Chat & File Sharing Flow](#chat--file-sharing-flow)
8. [Database Schema](#database-schema)
9. [Blockchain Layer](#blockchain-layer)
10. [API Layer](#api-layer)
11. [Frontend Architecture](#frontend-architecture)
12. [Setup & Installation](#setup--installation)
13. [Project Structure](#project-structure)
14. [Environment Variables](#environment-variables)
15. [Deployment](#deployment)
16. [Contributing](#contributing)
17. [License](#license)

---

## Overview

DocuChain is a full-stack decentralized application (dApp) built for educational institutions to manage, approve, and verify documents using blockchain technology. Every document uploaded to DocuChain is hashed with SHA-256, stored on IPFS (via Pinata), and its hash is permanently recorded on the Ethereum Sepolia testnet. This creates an immutable proof of existence that can never be altered or forged.

The platform supports three user roles (Admin, Faculty/Staff, Student), each with a dedicated dashboard. It includes a complete file management system, smart contract-powered approval chains (sequential or parallel), template-based document generation, real-time chat with file sharing, institutional circular management, and a public verification portal that anyone can use to check document authenticity by scanning a QR code.

<div align="center">
<img src="assets/readme/architecture-overview.png" alt="DocuChain Architecture Overview" width="800"/>
<br/><em>Figure 1: High-level system architecture — Frontend, Backend API, Ethereum Blockchain, and IPFS storage layers</em>
</div>

---

## The Problem & Solution

### The Problem

Educational institutions face critical challenges with document management:

| Problem | Description |
|---------|-------------|
| **Document Forgery** | Certificates, transcripts, and letters can be easily forged with modern tools. Employers and other institutions have no reliable way to verify authenticity. |
| **Slow Manual Verification** | Verifying a single document requires contacting the issuing institution, which can take days or weeks. |
| **Centralized Vulnerable Storage** | Documents stored on centralized servers are vulnerable to hacking, data loss, and single points of failure. |
| **Paper-Based Approval Chains** | Approvals require physical signatures, routing through multiple offices, and are easily lost or delayed. |
| **No Audit Trail** | There is no immutable record of who created, modified, approved, or shared a document. |
| **Inefficient Communication** | No unified platform for inter-departmental communication, document sharing, and announcements. |

### The Solution

DocuChain solves every one of these problems:

| Problem | DocuChain Solution |
|---------|-------------------|
| Document Forgery | Every document's SHA-256 hash is stored on Ethereum blockchain — any tampering is instantly detectable |
| Slow Verification | QR code on every approved document links to a public verification page — instant, no login required |
| Centralized Storage | Files stored on IPFS (decentralized, content-addressed) — no single point of failure |
| Paper Approvals | Smart contract-based approval workflows with digital signatures — sequential or parallel chains |
| No Audit Trail | Every action (upload, share, approve, reject) is logged in both the database and the blockchain |
| Poor Communication | Built-in real-time chat, group messaging, and circular management system |

<div align="center">
<img src="assets/readme/problem-solution.png" alt="Problem vs Solution" width="750"/>
<br/><em>Figure 2: Problems faced by educational institutions and how DocuChain solves them</em>
</div>

---

## System Architecture

DocuChain is a **4-layer hybrid decentralized architecture** combining traditional web infrastructure with blockchain and IPFS decentralized technology. The architecture ensures that no single layer is a point of failure — even if the backend goes down, documents already on IPFS and blockchain remain accessible and verifiable.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                      LAYER 1 — PRESENTATION (React 18 SPA)                           │
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────────┐   │
│   │                       Public Pages (No Authentication)                       │   │
│   │   Landing Page (/), Features, How-to-Use, Blog, About, FAQs, Help            │   │
│   │   Public Verification Portal (/verify, /verify/:code) — QR scan/upload       │   │
│   └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │
│   │ ADMIN Dashboard │  │ FACULTY Dashbd  │  │ STUDENT Dashbd  │  ← JWT Protected    │
│   │                 │  │                 │  │                 │                      │
│   │ 15 sidebar tools│  │ 11 sidebar tools│  │ 10 sidebar tools│                      │
│   │ + Institution   │  │ + Circular Mgmt │  │                 │                      │
│   │   Management    │  │                 │  │                 │                      │
│   │ + User Mgmt     │  │                 │  │                 │                      │
│   │ + Account Reqs  │  │                 │  │                 │                      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘                     │
│                                                                                      │
│   State: AuthContext │ ThemeContext (12 themes) │ WalletContext (MetaMask)             │
│   Client SDKs: ethers.js (blockchain) │ Pinata SDK (IPFS) │ Socket.IO (real-time)    │
│   UI: Tailwind CSS + Framer Motion │ Inter/Poppins fonts │ RemixIcon + Lucide icons  │
│   Theme: Near-black (#030303) landing │ White (#fff) dashboards │ Green (#18a36f) primary│
│                                                                                      │
└─────────────────┬──────────────────────┬──────────────────────┬──────────────────────┘
                  │                      │                      │
              ① REST API            ② ethers.js            ③ Pinata SDK
              + WebSocket            via MetaMask            (IPFS upload)
              (JWT Bearer)           (wallet signing)        (file pin/unpin)
                  │                      │                      │
                  ▼                      │                      │
┌──────────────────────────────────────┐ │                      │
│                                      │ │                      │
│   LAYER 2 — API & BUSINESS LOGIC     │ │                      │
│   (Flask + SQLAlchemy + SocketIO)    │ │                      │
│                                      │ │                      │
│   ┌───── 18 REST Blueprints ──────┐  │ │                      │
│   │ auth       │ documents       │  │ │                      │
│   │ users      │ folders         │  │ │                      │
│   │ approvals  │ shares          │  │ │                      │
│   │ chat       │ recent          │  │ │                      │
│   │ circulars  │ doc-generation  │  │ │                      │
│   │ institutions│ blockchain     │  │ │                      │
│   │ activity-log│ dashboard      │  │ │                      │
│   │ notifications│ health        │  │ │                      │
│   │ test-stamp │ diagnostic     │  │ │                      │
│   └─────────────────────────────┘  │ │                      │
│                                      │ │                      │
│   ┌───── Services ─────────────┐    │ │                      │
│   │ PDF Stamping (QR + sigs)   │    │ │                      │
│   │ Email (Brevo API + SMTP)   │    │ │                      │
│   │ Approval Folder Management │    │ │                      │
│   │ JWT Auth (access+refresh)  │    │ │                      │
│   └────────────────────────────┘    │ │                      │
│                                      │ │                      │
│   WebSocket Events: chat messages,   │ │                      │
│   typing indicators, online status,  │ │                      │
│   notifications, approval updates    │ │                      │
│                                      │ │                      │
│   Production: Gunicorn + gevent      │ │                      │
│   (async workers, pool_size=20)      │ │                      │
│                                      │ │                      │
└──────────────────┬───────────────────┘ │                      │
                   │                     │                      │
               ④ SQLAlchemy ORM         │                      │
               (connection pooling)      │                      │
                   │                     │                      │
                   ▼                     ▼                      ▼
┌──────────────────────────┐  ┌─────────────────────────────────────────────────┐
│                          │  │                                                 │
│  LAYER 3 — DATA STORE    │  │  LAYER 4 — DECENTRALIZED TRUST LAYER           │
│  (PostgreSQL 15)         │  │                                                 │
│                          │  │  ┌────────────── Ethereum Sepolia ───────────┐  │
│  26 Tables, UUID PKs     │  │  │                                           │  │
│                          │  │  │  DocumentManager.sol     (base CRUD)      │  │
│  ┌─ Users & Auth ───────┐│  │  │  DocumentManagerV2.sol   (+ creator IDs)  │  │
│  │ users                ││  │  │  DocumentApprovalManager.sol (workflows)  │  │
│  │ institutions         ││  │  │                                           │  │
│  │ departments          ││  │  │  Stores: SHA-256 hashes, IPFS CIDs,       │  │
│  │ sections             ││  │  │  timestamps, wallet addresses, approval    │  │
│  └──────────────────────┘│  │  │  status, digital signatures               │  │
│                          │  │  │                                           │  │
│  ┌─ Documents ──────────┐│  │  └───────────────────────────────────────────┘  │
│  │ documents            ││  │                                                 │
│  │ document_shares      ││  │  ┌────────────── IPFS (Pinata) ─────────────┐  │
│  │ document_versions    ││  │  │                                           │  │
│  │ folders              ││  │  │  Actual file content (PDFs, docs, images) │  │
│  │ folder_shares        ││  │  │  Stamped/approved document versions       │  │
│  └──────────────────────┘│  │  │  Content-addressed: each CID is unique    │  │
│                          │  │  │  and immutable per file content            │  │
│  ┌─ Approvals ──────────┐│  │  │                                           │  │
│  │ approval_requests    ││  │  │  Operations: pin (upload), unpin (delete), │  │
│  │ approval_steps       ││  │  │  gateway fetch (download/preview)          │  │
│  │ approved_documents   ││  │  │                                           │  │
│  │ approval_history     ││  │  └───────────────────────────────────────────┘  │
│  └──────────────────────┘│  │                                                 │
│                          │  │  ⑤ Backend stamps approved PDFs with QR codes   │
│  ┌─ Chat & Messaging ──┐│  │    and re-uploads to IPFS (new CID)             │
│  │ conversations        ││  │                                                 │
│  │ conversation_members ││  │  ⑥ Frontend reads blockchain directly for       │
│  │ messages             ││  │    public verification (no backend needed)       │
│  │ message_likes/       ││  │                                                 │
│  │ comments/saved_posts ││  │  ⑦ MetaMask wallet signs all blockchain          │
│  │ user_online_status   ││  │    transactions (user authorization)             │
│  └──────────────────────┘│  │                                                 │
│                          │  └─────────────────────────────────────────────────┘
│  ┌─ Templates ──────────┐│
│  │ document_templates   ││
│  │ generated_documents  ││
│  └──────────────────────┘│
│                          │
│  ┌─ System ─────────────┐│
│  │ notifications        ││
│  │ activity_logs        ││
│  │ recent_activity      ││
│  │ blockchain_transactions│
│  │ wallet_balances      ││
│  └──────────────────────┘│
└──────────────────────────┘
```

### Data Flow — Numbered Connections Explained

| # | Connection | Direction | Protocol | What Flows |
|---|-----------|-----------|----------|------------|
| ① | Frontend ↔ Backend | Bidirectional | REST API (HTTPS) + WebSocket (WSS) | JWT tokens, document metadata, user data, chat messages, approval workflows, notifications, real-time events |
| ② | Frontend → Ethereum | Frontend writes, reads | JSON-RPC via ethers.js + MetaMask | Document hash registration, approval submissions, approval signatures, verification queries, transaction receipts |
| ③ | Frontend → IPFS | Upload/Download | Pinata REST API | File upload (pin), file download (gateway URL), file deletion (unpin), content hash (CID) retrieval |
| ④ | Backend ↔ PostgreSQL | Bidirectional | SQLAlchemy ORM (TCP/SSL) | All relational data: users, documents, folders, shares, approvals, chat, notifications, activity logs, wallet balances |
| ⑤ | Backend → IPFS | Upload | Pinata REST API | Re-upload of PDF-stamped approved documents (QR code + signatures embedded), creates new CID for approved version |
| ⑥ | Frontend → Ethereum | Read only | JSON-RPC (public node) | Public verification portal queries blockchain for stored hashes — no backend, no login, no wallet needed |
| ⑦ | MetaMask → Ethereum | Write | Wallet signing | All blockchain write operations require MetaMask signature — ensures only the wallet owner can authorize on-chain actions |

### Why This Architecture?

| Design Decision | Reason |
|----------------|--------|
| **Frontend talks to blockchain directly** (②) | Eliminates backend as middleman for trust operations — user's wallet signs directly, no key storage on server |
| **Frontend uploads to IPFS directly** (③) | Files go straight to decentralized storage — backend never touches the raw file content for uploads |
| **Backend only stores metadata** (④) | PostgreSQL holds searchable, relational data (names, permissions, workflows) — the actual proof of truth lives on blockchain + IPFS |
| **PDF stamping goes through backend** (⑤) | Server-side PDF manipulation (QR codes, signature hashes) requires backend processing before re-uploading stamped version to IPFS |
| **Public verification bypasses backend** (⑥) | Anyone can verify a document by reading blockchain data directly — even if the DocuChain backend is offline |
| **WebSocket for real-time** (①) | Chat, typing indicators, online status, and live notifications need persistent bidirectional connections |

<div align="center">
<img src="assets/readme/system-architecture-detailed.png" alt="Detailed System Architecture" width="850"/>
<br/><em>Figure 3: Detailed system architecture with data flow between Frontend, Backend, PostgreSQL, Ethereum, and IPFS</em>
</div>

---

## Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with component-based architecture |
| **React Router v6** | Client-side routing with role-based access |
| **Tailwind CSS** | Utility-first responsive styling |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **Radix UI** | Accessible UI primitives |
| **ethers.js + web3.js** | Ethereum blockchain interaction via MetaMask |
| **Socket.IO Client** | Real-time communication (chat, notifications) |
| **Axios** | HTTP client for API calls |
| **html2pdf.js** | Client-side PDF generation |
| **jsQR** | QR code scanning for verification |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Python Flask** | REST API framework |
| **Flask-SQLAlchemy** | ORM for PostgreSQL |
| **Flask-JWT-Extended** | JWT authentication (access + refresh tokens) |
| **Flask-SocketIO** | WebSocket server for real-time features |
| **Flask-CORS** | Cross-origin resource sharing |
| **Flask-Compress** | Gzip response compression |
| **Flask-Migrate** | Database migrations (Alembic) |
| **Gunicorn + gevent** | Production WSGI server with async workers |
| **Brevo API** | Transactional email (primary) |
| **SMTP (Gmail)** | Email fallback |
| **ReportLab / PyPDF2** | PDF stamping with QR codes |

### Blockchain & Storage

| Technology | Purpose |
|-----------|---------|
| **Solidity 0.8.19** | Smart contract language |
| **Ethereum Sepolia** | Testnet for blockchain transactions |
| **Hardhat** | Smart contract development, testing, deployment |
| **MetaMask** | Browser wallet for signing transactions |
| **IPFS (Pinata)** | Decentralized file storage with content addressing |
| **SHA-256** | Document hash generation for integrity verification |

### Database & Infrastructure

| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 15** | Primary relational database (26 tables, UUID keys) |
| **Azure App Service** | Backend hosting (production) |
| **Vercel** | Frontend hosting (production) |

---

## User Roles & Access Control

DocuChain implements a three-tier role-based access system. Each role has a distinct dashboard with different sidebar tools and permissions.

<div align="center">
<img src="assets/readme/user-roles.png" alt="User Roles & Access Control" width="800"/>
<br/><em>Figure 4: Three user roles with their permissions and available tools</em>
</div>

### Role Comparison

| Feature / Tool | Admin | Faculty/Staff | Student |
|---------------|:-----:|:-------------:|:-------:|
| Dashboard with analytics | ✅ Institution-wide | ✅ Department-level | ✅ Personal |
| File Manager (upload, organize, share) | ✅ | ✅ | ✅ |
| Chat & Messaging | ✅ | ✅ | ✅ |
| Document Generation (templates) | ✅ | ✅ | ✅ |
| Document Approval (send requests) | ✅ | ✅ | ✅ |
| Document Approval (approve/reject) | ✅ | ✅ | ❌ |
| Verification Tool | ✅ | ✅ | ✅ |
| Blockchain Monitor | ✅ | ✅ | ✅ |
| Activity Logs | ✅ | ✅ | ✅ |
| Settings & Preferences | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| Account Request Approval | ✅ | ❌ | ❌ |
| Add Users Directly | ✅ | ❌ | ❌ |
| Institution Management | ✅ | ❌ | ❌ |
| Circular Management | ✅ | ✅ | ❌ |

### Dashboard Layout (Common to All Roles)

Every dashboard follows the same layout pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  [DocuChain Logo]  [Connect Wallet]  [Universal Search]  [🔔] [👤] │
├──────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT AREA                                       │
│          │                                                          │
│ Overview │  Welcome, [Username]                                     │
│ My Files │  ┌───────────┬───────────┬───────────┬───────────┐       │
│ Chats    │  │ Analytics │ Analytics │ Analytics │ Analytics │       │
│ Doc Gen  │  │ Card 1    │ Card 2    │ Card 3    │ Card 4    │       │
│ Approval │  └───────────┴───────────┴───────────┴───────────┘       │
│ ...      │                                                          │
│ Settings │  Document Status Overview                                │
│ Help     │  ┌───────────────────────────────────────────────┐       │
│ Logout   │  │ Total │ Approved │ Pending │ Rejected │ ...   │       │
│          │  └───────────────────────────────────────────────┘       │
│          │                                                          │
│          │  Recent Activity Feed                                    │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Header Components:**
- **DocuChain Logo** — Application branding
- **Connect Wallet** — MetaMask wallet connection toggle (required for blockchain operations)
- **Universal Search Bar** — Search for any person (by name or unique ID), document, file, or folder across the institution
- **Notifications** — Real-time notifications for messages, approvals, circulars, shares
- **Profile** — View/edit profile, see online status

---

## Core Features

### 1. Institution Registration & Onboarding

The entry point for DocuChain. An admin creates an institution, which generates a unique institution ID that all members (students, faculty, other admins) must use to register.

**Institution Registration Form:**
- Institution name, type (school/college/university/coaching center)
- Unique institution ID (auto-generated or custom)
- Address, website, email, phone
- Admin details: name, email, phone, password, department, wallet address
- Admin must also enter the exact institution name and unique ID to verify ownership
- OTP verification via email completes registration

**Post-Registration Flow:**
- Institution is created in the database
- Auto-created groups: institution-wide group, department groups, section groups
- Admin dashboard becomes available
- Other users can now register using the institution's unique ID

<div align="center">
<img src="assets/readme/onboarding-flow.png" alt="Institution Onboarding Flow" width="800"/>
<br/><em>Figure 5: Complete institution onboarding flow from registration to user access</em>
</div>

---

### 2. Account Management & Approval

**User Registration (Students, Faculty, New Admins):**
1. Click "Create Account" from login page
2. Select role (Student / Faculty / Admin)
3. Fill details based on role: name, email, phone, password, department (dropdown from admin-created departments), section, wallet address
4. Must enter correct institution name AND unique ID
5. Submit form → request goes to institution admin

**Admin Account Request Queue:**
- Admin sees all pending registration requests
- Can search by name/unique ID, filter by role/department/status
- View full profile details submitted by the user
- Approve or reject each request
- On approval/rejection → email notification sent to user
- Only after approval can the user log in

**Direct User Creation (Admin Only):**
- Admin can bypass the approval queue by directly creating accounts
- Fill the same form on behalf of the user
- Account is immediately active — no approval step needed
- Notification email sent to the user with their credentials

---

### 3. File Manager

The File Manager is the central hub for document organization. It is **identical in functionality** for all three roles — each user sees their own files.

<div align="center">
<img src="assets/readme/file-manager-structure.png" alt="File Manager Structure" width="800"/>
<br/><em>Figure 6: File Manager layout with sidebar navigation, file/folder grid, and context menu actions</em>
</div>

**File Manager Sidebar:**

| Section | Description |
|---------|-------------|
| **My Files** | Root view — all folders and files organized by the user |
| **Recent** | Recently uploaded, opened, or modified files |
| **Shared With Me** | Files/folders shared by other users with this user |
| **Starred** | Quick-access bookmarked files and folders |
| **Trash** | Soft-deleted items (30-day retention before permanent IPFS unpin) |

**System-Created Folders (Auto-generated per user):**

| Folder | Purpose |
|--------|---------|
| **Shared** | Organizes files received via File Manager sharing or Chat |
| **Approval** | Contains two sub-folders: "My Requests" (sent) and "Requests Received" (incoming) |
| **Drafts** | Stores draft documents from the Document Generation tool |

**File Actions (Three-dot context menu):**
- **Download** — Download file to local computer
- **Rename** — Change file name
- **Share** — Share with any connected user; set permission (read/write); shows in Chat too
- **Versions** — View version history (what changed, when, by whom)
- **Properties** — Name, size, created date, last modified, owner, access level, IPFS hash, current hash, shared-with list
- **Copy / Cut** — Move between folders (database-level operation)
- **Delete** — Moves to Trash (soft delete); permanent unpin from IPFS after 30 days or manual trash clear
- **Add to Starred** — Bookmark for quick access
- **Update** — Upload a new version (creates version entry)

**Folder Actions:**
- Share (shares all contents with selected permissions), Rename, Copy, Move, Delete, Properties

**File Upload Process:**
1. User clicks "Upload" in File Manager
2. File uploaded to IPFS via Pinata → receives content hash (CID)
3. SHA-256 hash of file generated
4. Hash + CID stored on Ethereum blockchain via smart contract
5. Metadata (name, size, type, owner, folder, IPFS hash, blockchain tx) stored in PostgreSQL
6. File appears in File Manager with blockchain verification badge

---

### 4. Document Approval Workflow

The core differentiating feature of DocuChain. This is how documents get officially approved with blockchain-verified digital signatures.

<div align="center">
<img src="assets/readme/approval-workflow.png" alt="Document Approval Workflow" width="850"/>
<br/><em>Figure 7: Complete document approval workflow from request creation to final stamped document</em>
</div>

**Who Can Request:** All three roles (Admin, Faculty, Student)
**Who Can Approve:** Admin and Faculty only

#### Sending an Approval Request

1. **Select Document** — Must be a document already uploaded to blockchain (from File Manager), not a local file
2. **Select Recipients (Approvers)** — Search and select users who should approve
3. **Assign Roles** — For each approver, enter their signing role (e.g., "HOD", "Principal", "Dean") — this determines where their signature appears on the document
4. **Select Approval Type:**
   - **Standard Approval** — Simple approve/reject without digital signature
   - **Digital Signature** — Blockchain-verified signature stamped on the document
5. **Select Process Type** (if 2+ approvers):
   - **Sequential** — Must be approved in a specific order (e.g., HOD first, then Principal). If any approver rejects, the entire request is rejected
   - **Parallel** — All approvers can approve in any order. Status only finalizes when all have acted
6. **Enter Purpose** — Description of why approval is needed
7. **Preview** — Review the request before submitting
8. **Save as Draft** (optional) — Continue later from the Drafts folder
9. **Submit** — Creates the approval request on blockchain; notifies all approvers

#### Approver Side (Receiving a Request)

1. Approver sees the request in "Requests Received" list
2. Can search, filter, and sort incoming requests
3. Click to open an application detail view showing:
   - **Document Info:** Name, size, IPFS hash, transaction ID, description
   - **Requester Details:** Name, department, unique ID, email, phone
   - **Blockchain Status:** Current approval progress (who approved, who is pending)
   - **Submission Date/Time**
4. **Preview** — Read the document in the built-in PDF viewer
5. **Download** — Save to local computer
6. **Action Buttons:**
   - If **Digital Signature** requested → "Sign" button (approves + adds blockchain signature)
   - If **Standard** → "Approve" button
   - "Reject" button (with reason)
   - "Close" button

#### What Happens After Approval

1. Each approval generates a **new version** of the document
2. The approved version is **stamped with:**
   - QR code containing verification data and document hash
   - Approver's digital signature hash
   - Approval timestamp
   - Other verification metadata
3. Stamped PDF is **re-uploaded to IPFS** → new CID
4. New version's hash is **recorded on blockchain**
5. When all approvers complete their actions:
   - If all approved → **Final approved document** sent to requester
   - Status updated everywhere: File Manager, Chat, Approval tool
6. **Version history** is preserved: Draft → Each approval step → Final document

#### Status Tracking

Approval status is synced across:
- The Approval tool (My Requests / Requests Received)
- File Manager (Approval folder)
- Chat interface (auto-messages showing status updates)
- Notifications

---

### 5. Document Generation from Templates

A productivity tool that allows users to generate institutional documents from predefined templates without starting from scratch.

**How It Works:**
1. Browse available templates (categorized: student, faculty, admin, all)
2. Select a template (e.g., Circular, Leave Application, Bonafide Certificate)
3. Fill in the required fields — institution details (header, logo, etc.) are auto-populated from institution settings
4. **Save as Draft** — Stored in the Drafts folder in File Manager
5. Or **Finalize** the document:
   - Choose approval type: No Approval / Standard / Digital Signature
   - If approval needed: select approvers, assign roles, select process type
   - Generate → creates the approval request (same workflow as #4 above)
6. Track status in "Recent Requests" or File Manager

**Template Structure:**
- Each template has: name, description, category, icon, color, estimated completion time
- Fields are defined as JSON schema (text inputs, dropdowns, dates, etc.)
- Optional pre-configured approval chain

<div align="center">
<img src="assets/readme/document-generation-flow.png" alt="Document Generation Flow" width="750"/>
<br/><em>Figure 8: Template-based document generation flow</em>
</div>

---

### 6. Chat & Real-Time Messaging

A full-featured real-time communication system integrated with document management and approval workflows.

<div align="center">
<img src="assets/readme/chat-system.png" alt="Chat System Architecture" width="800"/>
<br/><em>Figure 9: Chat system with direct messages, groups, auto-groups, and document sharing integration</em>
</div>

**Chat Types:**

| Type | Description |
|------|-------------|
| **Direct Messages** | One-on-one chat between any two connected users |
| **User-Created Groups** | Custom groups created by any user |
| **Auto-Created Groups** | Automatically created when institution/departments/sections are set up |

**Auto-Created Groups:**
- **Institution Group** — All users in the institution (created when institution is registered)
- **Department Groups** — All users in a department (created when admin creates departments)
- **Section Groups** — All users in a section (created when admin creates sections)
- Users auto-join the appropriate groups when their account is approved

**Document Integration in Chat:**
- **File Sharing:** Share documents from File Manager directly in a chat conversation (same share workflow — select permissions: read/write)
- **Approval Requests:** When an approval request is created (from the Approval tool or Document Generator), it automatically appears in the chat between requester and approver
- **Status Updates:** Approval status changes (approved, rejected, pending) are reflected in chat as auto-generated messages
- Shared files from File Manager also appear as messages in the relevant chat

**Other Chat Features:**
- View user profiles (name, unique ID, role, department) within chat
- Search users by name or unique ID
- Like messages, comment on messages, save/bookmark messages
- Online/offline status tracking
- **Circulars tab** in chat — view latest institution circulars as a feed

---

### 7. Circular Management

Available to **Admin and Faculty** for creating and managing institution-wide announcements.

**Creating a Circular:**
- Title, circular number, issue date, effective date
- Priority level selection
- Content editor
- Target audience: All / Students Only / Faculty Only / Admin Only
- Attach files (optional)
- Save as Draft or Post directly
- Preview before posting

**Managing Circulars:**
- View all posted circulars
- Edit or delete existing circulars
- Filter by priority, target audience, date
- Sort (newest/oldest)
- Manage drafts — edit and post later

**Where Circulars Appear:**
- In the Chat interface under the "Circulars" tab
- Targeted to the selected audience only
- Notifications sent to relevant users

---

### 8. Verification Tool

The public-facing trust layer of DocuChain. Available to all roles, and the public verification portal requires **no login**.

<div align="center">
<img src="assets/readme/verification-flow.png" alt="Verification Flow" width="750"/>
<br/><em>Figure 10: Document verification flow — from upload/QR scan to blockchain verification result</em>
</div>

**How Verification Works:**

1. **Input:** Upload a document from local storage OR select from blockchain-uploaded files
2. **Process:**
   - System extracts data from the QR code embedded in the document
   - Generates the SHA-256 hash of the uploaded file
   - Queries the Ethereum blockchain for the stored hash
   - Compares the two hashes
3. **Output:**
   - **Authentic:** Hashes match — document is genuine and untampered
   - **Tampered:** Hashes don't match — document has been modified
4. **Details Shown:** Original document info, approval status, who issued it, when, to whom, all approver signatures, IPFS hash, transaction hash
5. **Download Analysis Report** — Exportable verification report

**Public Verification (No Login):**
- Route: `/verify` or `/verify/:code`
- Anyone with the document or its verification code can verify authenticity
- Employers, other institutions, or individuals can scan the QR code printed on approved documents

---

### 9. User Management (Admin Only)

Complete control over all user accounts in the institution.

**Features:**
- Search any user by name or unique ID
- Filter by department, section, role (student/faculty/admin), status
- View full profile details of any user
- **Actions:** Edit details, delete account, ban/suspend, reactivate
- See: join date, last login, account status
- **Analytics:** Total users, breakdown by role, new registrations per week/month
- **Export:** Export filtered user lists

---

### 10. Institution Management (Admin Only)

Manage the institution's profile and organizational structure.

**Institution Profile:**
- View and edit: name, type, unique ID, address, website, email, phone
- These details auto-populate in document templates and circular headers

**Department Management:**
- Create departments
- Assign any user as Head of Department (HOD)
- Create sections within departments
- Assign class teachers to sections
- Edit department/section names, change HOD or class teacher
- Departments and sections appear as dropdowns in user registration forms
- Creating departments/sections auto-creates corresponding chat groups

---

### 11. Blockchain Monitor

Analytics dashboard for blockchain activity, available to all users.

**Displays:**
- Connected network and wallet public address
- Average gas price of transactions (daily)
- Total number of blockchain transactions
- Total gas cost spent
- Number of documents uploaded to IPFS
- Total IPFS storage used
- Last upload timestamp and details
- Last transaction details and hash

---

### 12. Activity Logs

An **immutable audit trail** that automatically records every significant action. Users can view but **cannot edit or delete** their logs.

**Logged Actions Include:**
- Login/logout timestamps
- Document uploads, downloads, views
- Document sharing events
- Approval requests sent/received
- Approval actions (approve/reject)
- Profile edits
- Folder creation/deletion
- All blockchain transactions
- Chat messages (metadata only)

**Each Log Entry Contains:**
- Timestamp
- Action type and category
- Description
- Target (document/folder/user)
- IP address and user agent
- Status (success/failed)

---

### 13. Notifications

Real-time notification system in the dashboard header, available to all users.

**Notification Types:**
- New chat messages
- Group messages
- New circulars posted
- Approval requests received
- Approval status updates (approved/rejected)
- Documents shared with you
- Documents generated
- System notifications

**Features:**
- Click to navigate to the relevant item
- Mark individual as read
- Clear all notifications
- Configurable in Settings (choose which types to receive)

---

### 14. Settings & Preferences

Common to all roles.

| Setting | Description |
|---------|-------------|
| **Profile Edit** | Update name, phone, email, department, etc. |
| **Notification Preferences** | Toggle which notification types to receive |
| **Theme** | Change UI color theme (default: green). Individual preference stored per user |
| **System Logs** | Quick access to activity logs |
| **Help & Support** | Usage guides, FAQs, process documentation, contact support |

---

## Key Workflows

### Document Upload to Blockchain & IPFS

```
User selects file
       │
       ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  File uploaded   │────▶│  Pinata uploads   │────▶│  Returns IPFS CID │
│  from browser    │     │  to IPFS network  │     │  (content hash)   │
└─────────────────┘     └──────────────────┘     └────────┬──────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Document hash + │◀────│  Smart contract   │◀────│  SHA-256 hash     │
│  CID recorded    │     │  stores on-chain  │     │  generated        │
│  on Ethereum     │     │  (MetaMask signs) │     │                   │
└────────┬────────┘     └──────────────────┘     └───────────────────┘
         │
         ▼
┌─────────────────┐
│  Metadata saved  │
│  in PostgreSQL   │
│  (name, size,    │
│  owner, folder,  │
│  tx hash, etc.)  │
└─────────────────┘
```

<div align="center">
<img src="assets/readme/document-upload-flow.png" alt="Document Upload Flow" width="800"/>
<br/><em>Figure 11: Document upload flow through IPFS, Blockchain, and Database</em>
</div>

---

### Document Approval Flow

```
REQUESTER                           APPROVER(S)                      FINAL
    │                                    │                             │
    │  1. Select document                │                             │
    │  2. Choose approvers + roles       │                             │
    │  3. Set type (standard/digital)    │                             │
    │  4. Set process (seq/parallel)     │                             │
    │  5. Submit request                 │                             │
    │─────────────────────────────────▶  │                             │
    │                                    │                             │
    │                            6. Review document                    │
    │                            7. Preview in PDF viewer              │
    │                            8a. APPROVE / SIGN                    │
    │                                    │                             │
    │                            ┌───────┴───────┐                     │
    │                            │ New PDF version│                    │
    │                            │ + QR stamp     │                    │
    │                            │ + Signature    │                    │
    │                            │ → Upload IPFS  │                    │
    │                            │ → Record chain │                    │
    │                            └───────┬───────┘                     │
    │                                    │                             │
    │                       [If sequential: next approver]             │
    │                       [If parallel: wait for all]                │
    │                                    │                             │
    │                            9. All complete                       │
    │◀───────────────────────────────────┼─────────────────────────▶  │
    │                                    │                    Final stamped
    │  Status: APPROVED / REJECTED       │                    document with
    │  Visible in: Approval tool,        │                    all signatures
    │  File Manager, Chat,               │                    + QR codes
    │  Notifications                     │                             │
```

---

### Document Verification Flow

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  Upload document  │     │  OR scan QR code  │     │  OR enter verify  │
│  (local/blockchain│     │  on the document  │     │  code from URL    │
└────────┬──────────┘     └────────┬──────────┘     └────────┬──────────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  Extract QR data +       │
                    │  Generate SHA-256 hash   │
                    │  of uploaded file        │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Query Ethereum blockchain│
                    │  for stored hash         │
                    └────────────┬─────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                        ▼                 ▼
               ┌──────────────┐  ┌──────────────┐
               │  MATCH ✅    │  │  MISMATCH ❌  │
               │  Document is │  │  Document has │
               │  authentic & │  │  been tampered│
               │  untampered  │  │  or is forged │
               └──────────────┘  └──────────────┘
                        │
                        ▼
               ┌──────────────────────┐
               │  Show full details:  │
               │  • Issuer info       │
               │  • Approval chain    │
               │  • All signatures    │
               │  • Original CID      │
               │  • Timestamp         │
               │  • Download report   │
               └──────────────────────┘
```

---

### Chat & File Sharing Flow

```
┌──────────────┐                                    ┌──────────────┐
│   User A     │                                    │   User B     │
│              │   Direct Message / Group Chat       │              │
│  Chat UI  ───┼───────────── Text Messages ────────┼──▶ Chat UI   │
│              │                                    │              │
│  File Mgr ───┼─── Share Document (read/write) ───┼──▶ Shared tab │
│              │   (IPFS hash + blockchain record)  │              │
│              │                                    │              │
│  Approval ───┼─── Request Approval ──────────────┼──▶ Chat msg + │
│  Tool        │   (auto-message in chat)           │   Approval   │
│              │                                    │   queue      │
│              │◀── Status Update (approved/rej) ──┼─── Approver   │
│              │   (auto-message in chat)           │   action     │
└──────────────┘                                    └──────────────┘
```

---

## Database Schema

The PostgreSQL database contains **26 tables** organized into 8 logical groups. All primary keys use UUID.

<div align="center">
<img src="assets/readme/database-schema.png" alt="Database Schema ER Diagram" width="900"/>
<br/><em>Figure 12: Complete Entity-Relationship diagram of the 26-table PostgreSQL database</em>
</div>

### Table Groups

#### Users & Institutions

```
institutions (1) ──────┬──────── (N) departments (1) ──── (N) sections
                       │
                       └──────── (N) users
                                      │
                         ┌─────┬──────┼──────┬──────┬──────┐
                         │     │      │      │      │      │
                      documents folders chats notifications activity_logs
```

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `users` | id, unique_id, email, password_hash, role, institution_id, department_id, section_id, wallet_address, theme, status | Core user accounts (UUID PK) |
| `institutions` | id, unique_id, name, type, address, email, website, phone, status | Schools, colleges, universities |
| `departments` | id, name, institution_id, head_of_department | Academic departments within institutions |
| `sections` | id, name, department_id, class_teacher | Class sections within departments |

#### Documents & File Management

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `documents` | id, document_id (blockchain), ipfs_hash, name, file_name, file_size, owner_id, folder_id, blockchain_tx_hash, is_blockchain_verified, status, is_starred, is_in_trash, trash_date | Core document storage with blockchain & IPFS references |
| `document_shares` | id, document_id, shared_by_id, shared_with_id, permission (read/write/admin), blockchain_tx_hash | Sharing permissions for documents |
| `document_versions` | id, document_id, version_number, ipfs_hash, file_name, transaction_id, changes_description, created_by | Version history with IPFS references per version |
| `folders` | id, name, parent_id, path, level, owner_id, is_system_folder, is_in_trash | Hierarchical folder structure (supports nesting) |
| `folder_shares` | id, folder_id, shared_by_id, shared_with_id, permission | Folder sharing permissions |

#### Approval System

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `approval_requests` | id, verification_code, request_id (blockchain bytes32), document_id, document_ipfs_hash, requester_id, requester_wallet, purpose, process_type (SEQUENTIAL/PARALLEL), approval_type (STANDARD/DIGITAL_SIGNATURE), priority, status (DRAFT/PENDING/PARTIAL/APPROVED/REJECTED/CANCELLED/EXPIRED), stamped_document_ipfs_hash | Master approval request record |
| `approval_steps` | id, request_id, approver_id, approver_wallet, approver_role, step_order, has_approved, has_rejected, signature_hash, reason, blockchain_tx_hash | Individual step per approver in the chain |
| `approved_documents` | id, request_id, original_document_id, approved_document_id, original_ipfs_hash, approved_ipfs_hash, document_hash, qr_code_data, verification_code, public_verification_url | Final approved document with QR and verification data |
| `approval_history` | id, request_id, event_type, event_description, actor_id, old_status, new_status, blockchain_tx_hash | Complete audit trail for approval events |

#### Document Templates

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `document_templates` | id, name, description, category, fields (JSONB), approval_chain (JSONB), institution_id, is_system | Reusable template definitions with field schemas |
| `generated_documents` | id, request_id (REQ-YYYY-MM-DD-XXX), template_id, requester_id, form_data (JSONB), generated_content, pdf_ipfs_hash, status, approval_history (JSONB) | Documents created from templates |

#### Chat & Messaging

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `conversations` | id, type (direct/group/circular), name, is_auto_created, auto_type, user1_id, user2_id, institution_id | Chat threads — direct, group, or circular |
| `conversation_members` | id, conversation_id, user_id, role (admin/member), is_muted, last_read_at | Group membership and settings |
| `messages` | id, conversation_id, sender_id, content, message_type (text/document_share/approval_request/system), document_id, share_permission, approval_request_id, is_auto_generated | Chat messages with document/approval integration |
| `user_online_status` | user_id, is_online, last_seen | Real-time online/offline tracking |
| `message_likes` | message_id, user_id | Message reactions |
| `message_comments` | id, message_id, user_id, content, parent_id | Threaded comments on messages |
| `saved_posts` | message_id, user_id | Bookmarked messages |

#### Notifications & Activity

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `notifications` | id, user_id, type, title, message, reference_id, sender_id, is_read | User notifications with type categorization |
| `activity_logs` | id, user_id, action_type, action_category, description, target_id, target_type, ip_address, user_agent | Immutable audit trail (users cannot delete) |
| `recent_activity` | id, user_id, file_id, file_name, action | Quick-access recent file activities |

#### Blockchain Tracking

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `blockchain_transactions` | id, transaction_hash, block_number, user_id, transaction_type, document_id, gas_used, gas_price, status | All blockchain transactions with gas tracking |
| `wallet_balances` | id, user_id, wallet_address, balance_eth, total_spent_eth, today_spent_eth, total_transactions | Cached wallet info and spending stats |

---

## Blockchain Layer

### Smart Contracts

Three Solidity contracts deployed on Ethereum Sepolia testnet:

<div align="center">
<img src="assets/readme/smart-contracts.png" alt="Smart Contract Architecture" width="800"/>
<br/><em>Figure 13: Smart contract architecture — DocumentManager, DocumentManagerV2, and DocumentApprovalManager</em>
</div>

#### DocumentManager.sol (Base Contract)

Basic document CRUD operations on-chain.

| Function | Visibility | Description |
|----------|-----------|-------------|
| `addDocument(docHash, metadata)` | public | Stores document hash and metadata on-chain |
| `getDocument(docId)` | public view | Retrieves document details by ID |
| `getDocuments()` | public view | Returns all documents |
| `updateDocument(docId, metadata)` | public | Updates document metadata |
| `deleteDocument(docId)` | public | Removes a document record |

**Events:** `DocumentAdded`, `DocumentUpdated`, `DocumentDeleted`
**Struct:** `Document { docId, docHash, metadata, timestamp }`

#### DocumentManagerV2.sol (Extended Contract)

Extends V1 with creator/owner tracking.

| Function | Visibility | Description |
|----------|-----------|-------------|
| `addDocument(docHash, metadata, creator)` | public | Stores document with creator address |
| `getDocumentsByCreator(creator)` | public view | Returns all documents by a specific wallet |
| All V1 functions | — | Inherited from DocumentManager |

**Additional State:** `creatorToDocuments` mapping (address → docId[])
**Struct:** `DocumentV2 { docId, docHash, metadata, creator, timestamp }`

#### DocumentApprovalManager.sol (Approval Contract)

Handles document approval workflows on-chain.

| Function | Visibility | Description |
|----------|-----------|-------------|
| `submitForApproval(docId)` | public | Submits a document to the approval queue |
| `approveDocument(docId)` | public | Records approval for a document |
| `rejectDocument(docId, reason)` | public | Records rejection with reason |
| `getApprovalStatus(docId)` | public view | Returns current approval status |
| `getApprovalHistory(docId)` | public view | Returns full approval event history |

**Events:** `DocumentSubmitted`, `DocumentApproved`, `DocumentRejected`
**Access Control:** `OnlyApprover` modifier restricts approve/reject to authorized addresses

### What Gets Stored On-Chain vs Off-Chain

| On-Chain (Ethereum) | Off-Chain (PostgreSQL) |
|---------------------|----------------------|
| Document SHA-256 hash | File name, size, type |
| IPFS CID (content address) | Owner user info |
| Timestamp of upload | Folder organization |
| Owner wallet address | Sharing permissions |
| Approval status | Chat messages |
| Approver signatures | Notification history |
| Approval timestamps | User preferences |
| Transaction hashes | Activity logs (detail) |

| On IPFS (Pinata) |
|-------------------|
| Actual file content (PDF, DOC, images) |
| Stamped/approved versions of documents |
| Content-addressed (immutable per CID) |

---

## API Layer

The Flask backend exposes **18 route blueprints** under the `/api/` prefix. All routes except `/api/health` require JWT authentication.

### API Blueprint Summary

| Blueprint | Prefix | Key Endpoints | Description |
|-----------|--------|--------------|-------------|
| **auth** | `/api/auth` | POST `/login`, `/register`, `/logout`, `/refresh`, `/verify` | Authentication, OTP verification, token management |
| **documents** | `/api/documents` | GET/POST `/`, GET/PUT/DELETE `/<id>`, GET `/<id>/download`, POST `/<id>/share`, GET `/search` | Document CRUD, IPFS upload, sharing, search |
| **users** | `/api/users` | GET `/`, GET/PUT/DELETE `/<id>`, GET `/me`, PUT `/me/update` | User management and profiles |
| **approvals** | `/api/approvals` | GET `/`, GET/PUT/DELETE `/<id>`, POST `/<id>/approve`, POST `/<id>/reject` | Approval workflow management |
| **chat** | `/api/chat` | GET/POST `/`, GET `/<room_id>`, GET `/rooms` | Messaging and conversation management |
| **circulars** | `/api/circulars` | GET/POST `/`, GET/PUT/DELETE `/<id>` | Circular CRUD and management |
| **institutions** | `/api/institutions` | GET/POST `/`, GET/PUT/DELETE `/<id>` | Institution, department, section CRUD |
| **folders** | `/api/folders` | GET/POST `/`, GET/PUT/DELETE `/<id>`, GET `/<id>/documents` | Folder hierarchy CRUD |
| **shares** | `/api/shares` | GET/POST `/`, GET/DELETE `/<id>` | Document/folder share management |
| **recent** | `/api/recent` | GET `/` | Recent activity feed |
| **document-generation** | `/api/document-generation` | POST `/`, GET `/templates` | Template-based document creation |
| **blockchain** | `/api/blockchain` | GET `/transactions`, POST `/submit`, GET `/status` | Blockchain transaction tracking |
| **activity-logs** | `/api/activity-logs` | GET `/`, GET `/<id>` | Immutable audit trail |
| **dashboard** | `/api/dashboard` | GET `/` | Role-specific analytics data |
| **notifications** | `/api/notifications` | GET `/`, POST `/<id>/read` | Notification management |
| **health** | `/api/health` | GET `/` | Health check (no auth) |
| **test-stamping** | `/api/test` | POST `/` | PDF stamping diagnostics |
| **diagnostic** | `/api/diagnostic` | GET `/` | Backend system diagnostics |

### Authentication Flow

```
Register → OTP Verify → Login → JWT Access Token (1 day) + Refresh Token (30 days)
                                        │
                                        ▼
                              All API calls include:
                              Authorization: Bearer <access_token>
                                        │
                                  Token expired?
                                  │            │
                                  No           Yes → POST /api/auth/refresh
                                  │                  with refresh token
                                  ▼                  → New access token
                              Normal response
```

---

## Frontend Architecture

### State Management

React Context-based (no Redux):

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication state, login/logout, token management |
| `ThemeContext` | UI theme preference (color scheme) |
| `WalletContext` | MetaMask wallet connection, network status, account management |

### Routing Structure

```
/                           → Landing Page (public)
/features                   → Features overview (public)
/features-timeline          → Features timeline (public)
/how-to-use                 → Usage guide (public)
/help                       → Help & Support (public)
/faqs                       → FAQ page (public)
/blog                       → Blog (public)
/about                      → About page (public)
/verify                     → Public verification portal (no login)
/verify/:code               → Direct verification by code (no login)
/login                      → Login page
/register                   → Registration page
/forgot-password            → Password reset
/dashboard                  → Role-based dashboard (protected)
    ├── Admin Dashboard     → If user.role === 'admin'
    ├── Faculty Dashboard   → If user.role === 'faculty'
    └── Student Dashboard   → If user.role === 'student'
```

### Service Layer

| Service File | Purpose |
|-------------|---------|
| `api.js` | Centralized Axios instance with JWT interceptors |
| `blockchainServiceV2.js` | ethers.js integration with DocumentManagerV2 contract |
| `blockchainSimpleService.js` | Legacy contract interaction |
| `pinataService.js` | IPFS file upload/pin/unpin via Pinata API |
| `hybridFileManagerService.js` | Combines database (folders/metadata) with blockchain (files) |
| `fileManagerService.js` | Enhanced file operations with IPFS + blockchain |
| `documents.js` | Document API calls (CRUD, share, trash/restore) |

---

## Project Structure

```
DocuChain/
├── README.md                          # This file
├── package.json                       # Root dependencies
├── assets/
│   ├── logo.png                       # DocuChain logo
│   └── readme/                        # README images
│
├── backend/                           # Flask Backend
│   ├── run.py                         # Application entry point
│   ├── wsgi.py                        # WSGI entry for production
│   ├── config.py                      # Environment-based configuration
│   ├── gunicorn.conf.py               # Gunicorn production settings
│   ├── init_db.py                     # Database initialization script
│   ├── requirements.txt               # Python dependencies
│   ├── startup.sh                     # Azure startup script
│   ├── app/
│   │   ├── __init__.py                # Flask app factory (create_app)
│   │   ├── performance.py             # Response time monitoring
│   │   ├── websocket_events.py        # SocketIO event handlers
│   │   ├── models/                    # SQLAlchemy models (11 files)
│   │   │   ├── user.py               # User model
│   │   │   ├── document.py           # Document + DocumentVersion
│   │   │   ├── folder.py             # Folder + FolderShare
│   │   │   ├── institution.py        # Institution + Department + Section
│   │   │   ├── approval.py           # ApprovalRequest + Steps + History
│   │   │   ├── chat.py               # Conversation + Message + Members
│   │   │   ├── document_template.py  # Templates + Generated docs
│   │   │   ├── notification.py       # Notifications
│   │   │   ├── recent_activity.py    # Recent file activities
│   │   │   ├── activity_log.py       # Immutable audit trail
│   │   │   └── blockchain_transaction.py  # Tx tracking + Wallet balances
│   │   ├── routes/                    # API endpoints (18 blueprints)
│   │   │   ├── auth.py               # Authentication & registration
│   │   │   ├── documents.py          # Document CRUD & sharing
│   │   │   ├── users.py              # User management
│   │   │   ├── approvals.py          # Approval workflow
│   │   │   ├── chat.py               # Messaging & conversations
│   │   │   ├── circulars.py          # Circular management
│   │   │   ├── institutions.py       # Institution/department CRUD
│   │   │   ├── folders.py            # Folder management
│   │   │   ├── shares.py             # Sharing management
│   │   │   ├── recent.py             # Recent activity
│   │   │   ├── document_generation.py # Template-based generation
│   │   │   ├── blockchain.py         # Blockchain transaction tracking
│   │   │   ├── activity_log.py       # Activity log retrieval
│   │   │   ├── dashboard.py          # Dashboard analytics
│   │   │   ├── notifications.py      # Notification management
│   │   │   ├── health.py             # Health check
│   │   │   ├── test_stamping.py      # PDF stamping tests
│   │   │   └── diagnostic.py         # System diagnostics
│   │   └── services/                  # Business logic services
│   │       ├── pdf_stamping.py        # PDF stamping with QR + signatures
│   │       ├── email_service.py       # Core SMTP email
│   │       ├── brevo_email_service.py # Brevo transactional email API
│   │       ├── fallback_email_service.py  # Email fallback chain
│   │       └── approval_folder_service.py # Auto-manage approval folders
│   ├── migrations/                    # Database migration scripts
│   └── uploads/                       # Temporary file upload storage
│
├── frontend/                          # React Frontend
│   ├── package.json                   # Frontend dependencies
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── vercel.json                    # Vercel deployment config
│   ├── public/                        # Static assets
│   └── src/
│       ├── App.js                     # Main app with routing
│       ├── contexts/                  # React Context providers
│       │   ├── AuthContext.js         # Authentication state
│       │   ├── ThemeContext.js         # UI theme management
│       │   └── WalletContext.js        # MetaMask wallet state
│       ├── components/                # Reusable components
│       │   ├── Auth/                  # Login, Register forms
│       │   ├── Wallet/               # MetaMask connection
│       │   ├── ui/                   # Base UI components
│       │   ├── layout/               # Layout wrappers
│       │   └── shared/               # Shared across pages
│       ├── pages/                     # Page components
│       │   ├── admin/                # Admin dashboard pages
│       │   ├── faculty/              # Faculty dashboard pages
│       │   ├── student/              # Student dashboard pages
│       │   ├── public/               # Landing, Features, About
│       │   ├── shared/               # FileManager, shared pages
│       │   └── auth/                 # Auth pages
│       ├── services/                  # API & blockchain services
│       │   ├── api.js                # Axios instance + interceptors
│       │   ├── blockchainServiceV2.js # ethers.js contract interaction
│       │   ├── pinataService.js       # IPFS upload via Pinata
│       │   ├── hybridFileManagerService.js  # DB + blockchain files
│       │   └── documents.js           # Document API calls
│       └── contracts/                 # Smart contract ABIs
│
├── blockchain/                        # Smart Contracts
│   ├── hardhat.config.js             # Hardhat configuration
│   ├── package.json                  # Blockchain dependencies
│   └── contracts/
│       ├── DocumentManager.sol        # Base document management
│       ├── DocumentManagerV2.sol      # Extended with creator tracking
│       └── DocumentApprovalManager.sol # Approval workflow contract
│
├── database/                          # Database Scripts
│   ├── schema.sql                    # Complete schema (26 tables)
│   ├── setup_database.sql            # Initial setup
│   ├── sample_data.sql               # Sample data for testing
│   ├── performance_indexes.sql       # Performance optimization indexes
│   └── approval_system_tables.sql    # Approval system DDL
│
└── docs/                              # Documentation
    ├── DocuChain_PRD.txt             # Product Requirements Document
    ├── chaidoc.txt                   # Project brief/concept document
    ├── PROJECT_STRUCTURE.md          # Project structure reference
    ├── blockchain/                   # Blockchain setup guides
    ├── deployment/                   # Deployment guides (Azure, Vercel)
    ├── development/                  # Development logs and guides
    ├── features/                     # Feature documentation
    └── performance/                  # Performance optimization docs
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Flask
FLASK_ENV=development                          # development | production
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/docuchain

# JWT
JWT_SECRET_KEY=your-jwt-secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:5173

# IPFS / Pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain
CONTRACT_ADDRESS=0x_your_deployed_contract_address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
CHAIN_ID=11155111

# Email (Brevo primary)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Uploads
MAX_FILE_SIZE=52428800                         # 50MB
UPLOAD_FOLDER=uploads/
TRASH_RETENTION_DAYS=30
```

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ and pip
- **PostgreSQL** 15+
- **MetaMask** browser extension
- **Pinata** account (for IPFS)
- **Sepolia testnet ETH** (free from faucets)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate              # Windows
# source venv/bin/activate         # macOS/Linux
pip install -r requirements.txt
# Configure .env file (see Environment Variables above)
python init_db.py                  # Initialize database tables
python run.py                      # Start Flask server (port 5000)
```

### Frontend Setup

```bash
cd frontend
npm install
npm start                          # Start React dev server (port 5173)
```

### Blockchain Setup

```bash
cd blockchain
npm install
# Configure hardhat.config.js with Sepolia RPC URL and deployer private key
npx hardhat compile                # Compile smart contracts
npx hardhat run scripts/deploy.js --network sepolia   # Deploy to Sepolia
# Copy contract address to backend .env (CONTRACT_ADDRESS)
```

See [docs/blockchain/BLOCKCHAIN_SETUP_GUIDE.md](docs/blockchain/BLOCKCHAIN_SETUP_GUIDE.md) for detailed instructions.

---

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| **Backend** | Azure App Service | Python 3.9+, Gunicorn with gevent workers, QueuePool (20+30 connections) |
| **Frontend** | Vercel | Static site with `vercel.json` rewrites for SPA routing |
| **Database** | Azure PostgreSQL | Flexible Server with SSL |
| **Blockchain** | Ethereum Sepolia | Contracts deployed via Hardhat |
| **IPFS** | Pinata Cloud | Managed pinning service |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is developed for educational purposes.

---

<div align="center">

**Built with blockchain trust for educational integrity**

DocuChain &copy; 2025

</div>
