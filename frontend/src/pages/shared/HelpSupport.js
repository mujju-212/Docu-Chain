import React, { useState } from 'react';
import './HelpSupport.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function HelpSupport() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ Categories
  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: 'ri-rocket-line' },
    { id: 'account', label: 'Account & Profile', icon: 'ri-user-settings-line' },
    { id: 'documents', label: 'Documents & Files', icon: 'ri-file-text-line' },
    { id: 'blockchain', label: 'Blockchain & Security', icon: 'ri-shield-check-line' },
    { id: 'approval', label: 'Approval Workflow', icon: 'ri-checkbox-circle-line' },
    { id: 'sharing', label: 'Sharing & Collaboration', icon: 'ri-share-line' },
    { id: 'verification', label: 'Document Verification', icon: 'ri-verified-badge-line' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: 'ri-tools-line' }
  ];

  // Comprehensive FAQ Data
  const faqData = {
    'getting-started': [
      {
        id: 'gs-1',
        question: 'What is DocuChain?',
        answer: 'DocuChain is a blockchain-powered document management system designed for educational institutions. It provides secure document storage using IPFS (InterPlanetary File System), blockchain verification, multi-signature approval workflows, and tamper-proof document authentication. All critical document operations are recorded on the blockchain, ensuring transparency and immutability.'
      },
      {
        id: 'gs-2',
        question: 'How do I create an account?',
        answer: `To create an account:
1. Go to the registration page and select your role (Student, Faculty, or Admin)
2. Fill in your personal details including email and phone number
3. Enter your institution's name and unique Institution ID (get this from your admin)
4. Submit the registration form
5. Wait for admin approval - you'll receive an email notification
6. Once approved, you can log in with your credentials

Note: You'll need to connect a MetaMask wallet after your first login for blockchain operations.`
      },
      {
        id: 'gs-3',
        question: 'What is MetaMask and why do I need it?',
        answer: `MetaMask is a cryptocurrency wallet that connects your browser to the Ethereum blockchain. In DocuChain, MetaMask is used for:

• Signing blockchain transactions when uploading documents
• Verifying document ownership and authenticity
• Recording document sharing and approval events
• Ensuring tamper-proof document history

To set up MetaMask:
1. Install the MetaMask browser extension (Chrome, Firefox, or Brave)
2. Create a new wallet and securely store your seed phrase
3. Connect to the Polygon Mumbai testnet (we'll guide you through this)
4. Click "Connect Wallet" in DocuChain to link your account`
      },
      {
        id: 'gs-4',
        question: 'What are the different user roles?',
        answer: `DocuChain has three user roles:

👨‍🎓 Student:
• Upload and manage personal documents
• Request document approvals from faculty
• Share documents with others
• Access chat and notifications

👨‍🏫 Faculty:
• All student capabilities
• Approve/reject document requests
• Generate official institution documents
• Access to document templates

👨‍💼 Admin:
• All faculty capabilities
• Manage user accounts and approvals
• Create departments and sections
• Access institution-wide analytics
• Configure institution settings`
      },
      {
        id: 'gs-5',
        question: 'How do I navigate the dashboard?',
        answer: `The dashboard has several key sections:

📊 Overview: Quick stats about your documents, pending approvals, and recent activity

📁 File Manager: Upload, organize, and manage your documents in folders

✅ Document Approval: Send and receive approval requests

📝 Document Generator: Create official documents using templates

💬 Chat: Communicate with other users and share documents

🔍 Verification Tool: Verify document authenticity

⚙️ Settings: Customize your profile, theme, and notifications

Use the sidebar to navigate between sections.`
      }
    ],
    'account': [
      {
        id: 'acc-1',
        question: 'How do I change my name or profile information?',
        answer: `To update your profile:
1. Go to Settings from the sidebar
2. Click on the "Profile" tab
3. Edit your First Name, Last Name, or Phone Number
4. Click "Save Changes"

Note: Your email address cannot be changed as it's used for account identification. Contact support if you need to change your email.`
      },
      {
        id: 'acc-2',
        question: 'How do I change my password?',
        answer: `To change your password:
1. Go to Settings from the sidebar
2. Click on the "Security" tab
3. Enter your current password
4. Enter your new password (minimum 6 characters)
5. Confirm your new password
6. Click "Change Password"

For security, use a strong password with uppercase, lowercase, numbers, and special characters.`
      },
      {
        id: 'acc-3',
        question: 'How do I change the theme/color scheme?',
        answer: `DocuChain offers 12 beautiful theme colors:
1. Go to Settings from the sidebar
2. Click on the "Appearance" tab
3. Select your preferred theme color from the palette
4. The theme changes instantly across the entire application

Available themes: Emerald, Ocean Blue, Royal Purple, Sunset Orange, Cherry Pink, Tropical Teal, Crimson, Deep Indigo, Electric Cyan, Rose Gold, Golden Amber, and Modern Slate.`
      },
      {
        id: 'acc-4',
        question: 'How do I manage notifications?',
        answer: `To customize your notifications:
1. Go to Settings from the sidebar
2. Click on the "Notifications" tab
3. Toggle the following preferences:
   • Push Notifications - Browser notifications
   • Email Alerts - Important updates via email
   • Document Updates - When documents are shared/modified
   • Approval Requests - New approval requests
   • Chat Messages - New message notifications
   • System Announcements - Important system updates

Your preferences are saved automatically.`
      },
      {
        id: 'acc-5',
        question: 'How do I connect or change my MetaMask wallet?',
        answer: `To connect your MetaMask wallet:
1. Make sure MetaMask extension is installed
2. Click "Connect Wallet" in the top navigation bar
3. Select the account you want to connect
4. Approve the connection request in MetaMask

To change your wallet:
1. Open MetaMask extension
2. Switch to a different account
3. Refresh DocuChain - it will detect the new account

Note: Your wallet address is linked to your documents on the blockchain.`
      }
    ],
    'documents': [
      {
        id: 'doc-1',
        question: 'How do I upload a document?',
        answer: `To upload a document:
1. Go to File Manager from the sidebar
2. Navigate to the folder where you want to upload
3. Click the "Upload" button or drag & drop files
4. Wait for the file to upload to IPFS
5. Confirm the blockchain transaction in MetaMask
6. Your document is now securely stored!

Supported formats: PDF, DOC, DOCX, images, and more.
Maximum file size depends on your plan.`
      },
      {
        id: 'doc-2',
        question: 'How do I create folders to organize documents?',
        answer: `To create a new folder:
1. Go to File Manager
2. Click the "New Folder" button
3. Enter a name for your folder
4. Click "Create"

You can create nested folders by navigating into a folder first, then creating a new one. Use the breadcrumb navigation to move between folders.`
      },
      {
        id: 'doc-3',
        question: 'How do I rename or delete a document?',
        answer: `To rename a document:
1. Right-click on the document (or click the three dots menu)
2. Select "Rename"
3. Enter the new name
4. Click "Save"

To delete a document:
1. Right-click on the document
2. Select "Move to Trash"
3. The document moves to your Trash folder

Documents in Trash are kept for 30 days before permanent deletion. You can restore them anytime within this period.`
      },
      {
        id: 'doc-4',
        question: 'What is IPFS and how does it store my documents?',
        answer: `IPFS (InterPlanetary File System) is a decentralized storage network:

🔒 Decentralized: Files are distributed across multiple nodes
📋 Content-Addressed: Files get a unique hash (like QmXx...) based on content
🔗 Immutable: File content cannot be changed without changing the hash
⚡ Fast: Files are served from the nearest available node

When you upload a document:
1. File is encrypted and split into chunks
2. Chunks are distributed across the IPFS network
3. A unique IPFS hash is generated
4. Hash is recorded on blockchain for verification

Your files are accessible globally yet remain secure and private.`
      },
      {
        id: 'doc-5',
        question: 'How do I download a document?',
        answer: `To download a document:
1. Go to File Manager
2. Find the document you want to download
3. Click on the document to select it
4. Click the "Download" button or right-click and select "Download"

The file will be downloaded from IPFS to your local device. For blockchain-verified documents, you can also verify authenticity before downloading.`
      }
    ],
    'blockchain': [
      {
        id: 'bc-1',
        question: 'How does blockchain ensure document security?',
        answer: `DocuChain uses blockchain for immutable record-keeping:

🔐 Immutability: Once recorded, data cannot be altered or deleted
📝 Transparency: All transactions are publicly verifiable
⏰ Timestamping: Exact time of upload/modification is recorded
👤 Ownership Proof: Your wallet address proves document ownership
🔗 Hash Verification: Document content hash ensures integrity

Every important action is recorded:
• Document uploads
• Sharing events
• Approval signatures
• Verification checks

This creates an unbreakable chain of custody for your documents.`
      },
      {
        id: 'bc-2',
        question: 'What is a blockchain transaction hash?',
        answer: `A transaction hash (TX Hash) is a unique identifier for each blockchain operation:

Example: 0x1a2b3c4d5e6f...

It proves that:
✅ The action was recorded on the blockchain
✅ It cannot be altered or deleted
✅ Anyone can verify it on a blockchain explorer

You'll see transaction hashes when:
• Uploading documents
• Sharing with others
• Approving/rejecting requests
• Generating verified documents

Save important transaction hashes for future reference.`
      },
      {
        id: 'bc-3',
        question: 'What network does DocuChain use?',
        answer: `DocuChain currently operates on:

🔷 Polygon Mumbai Testnet
• Faster transactions than Ethereum mainnet
• Lower/zero gas fees for testing
• Compatible with MetaMask
• Perfect for institutional use

Network Details:
• Network Name: Polygon Mumbai
• RPC URL: https://rpc-mumbai.maticvigil.com/
• Chain ID: 80001
• Currency: MATIC (test tokens)

We plan to migrate to Polygon Mainnet for production use.`
      },
      {
        id: 'bc-4',
        question: 'What happens if I lose access to my wallet?',
        answer: `If you lose wallet access:

⚠️ Your documents remain safe in IPFS
⚠️ Blockchain records are permanent
⚠️ You cannot sign new transactions

Prevention tips:
1. Backup your MetaMask seed phrase securely
2. Never share your seed phrase with anyone
3. Consider using a hardware wallet for added security

Recovery options:
• Use your seed phrase to restore your wallet
• Contact support if you need to link a new wallet to your account

Remember: Even DocuChain support cannot recover a lost wallet - only you have access to your seed phrase.`
      },
      {
        id: 'bc-5',
        question: 'Why do I need to confirm transactions in MetaMask?',
        answer: `MetaMask confirmations are required for security:

Each confirmation ensures:
• Only you can authorize blockchain actions
• Your private key signs the transaction
• The action is your explicit consent

You'll need to confirm:
📤 Document uploads
📧 Sharing documents
✅ Approval signatures
🔏 Recording verified documents

Tips:
• Always verify the action details before confirming
• Gas fees are minimal on testnet
• If a transaction fails, try again with slightly higher gas`
      }
    ],
    'approval': [
      {
        id: 'app-1',
        question: 'How do I request document approval?',
        answer: `To request approval for a document:
1. Go to Document Approval from the sidebar
2. Click "New Request" or select a document
3. Choose the document you want approved (must be on blockchain)
4. Select approvers from your institution
5. Choose approval type:
   • Standard: Simple click-to-approve
   • Digital Signature: Cryptographic signature required
6. Choose workflow:
   • Sequential: One after another
   • Parallel: All at once
7. Set priority (Low/Normal/High/Urgent)
8. Add optional expiry date
9. Submit the request

Approvers will be notified and the request appears in their queue.`
      },
      {
        id: 'app-2',
        question: 'What is the difference between Sequential and Parallel approval?',
        answer: `Two workflow options:

📋 Sequential Approval:
• Approvers review one at a time
• Each must approve before the next can see it
• Follows a specific order (e.g., HOD → Principal → Registrar)
• Good for: Formal hierarchical approvals

⚡ Parallel Approval:
• All approvers can review simultaneously
• Everyone sees the request at the same time
• Faster completion
• Good for: Peer reviews, multi-department sign-offs

Choose based on your institution's approval policy.`
      },
      {
        id: 'app-3',
        question: 'How do I approve or reject a document?',
        answer: `To approve/reject a document:
1. Go to Document Approval
2. Click "Received Requests" tab
3. Find the pending request
4. Click to view details
5. Review the document carefully
6. For approval:
   • Click "Approve" button
   • For digital signature: Sign with MetaMask
   • Add optional comments
7. For rejection:
   • Click "Reject" button
   • Provide a reason (required)

The requester will be notified of your decision. Approved documents get an official stamp and QR code.`
      },
      {
        id: 'app-4',
        question: 'What happens after a document is approved?',
        answer: `After full approval:

1. 📄 New PDF Generated
   • Contains approval stamp
   • Shows all approvers' signatures
   • Includes timestamp
   • Has QR code for verification

2. 🔗 Blockchain Recording
   • Approval recorded permanently
   • Transaction hash generated
   • Verification code created

3. 📬 Notification Sent
   • Requester notified
   • Document shared in chat
   • Email notification (if enabled)

4. ✅ Document Available
   • Download from Approval History
   • Share with others
   • Use verification tool to validate`
      },
      {
        id: 'app-5',
        question: 'Can I track the status of my approval requests?',
        answer: `Yes! Track your requests in Document Approval:

1. Go to "Sent Requests" tab
2. View all your requests with status:
   • 🟡 Pending - Waiting for action
   • 🟢 Approved - All approvers accepted
   • 🔴 Rejected - One or more rejected
   • ⏰ Expired - Passed expiry date

Each request shows:
• Approval progress (e.g., 1/3 approved)
• Who has approved/pending
• Timestamps for each action
• Comments from approvers

Click any request to see detailed history.`
      }
    ],
    'sharing': [
      {
        id: 'sh-1',
        question: 'How do I share a document with someone?',
        answer: `Two ways to share documents:

📁 From File Manager:
1. Select the document
2. Click "Share" button
3. Search for the recipient by name or email
4. Select permission level (View/Edit)
5. Confirm blockchain transaction in MetaMask
6. Done! Recipient gets notified

💬 From Chat:
1. Open a conversation
2. Click the document icon
3. Select from your files
4. Choose permission
5. Document is shared in chat

Recipients can access shared documents from "Shared with Me" section.`
      },
      {
        id: 'sh-2',
        question: 'What is the difference between View and Edit permissions?',
        answer: `Permission levels:

👁️ View (Read Only):
• Can view and download the document
• Cannot modify or re-share
• Cannot delete
• Good for: Sharing certificates, reports

✏️ Edit (Read + Write):
• Can view, download, and modify
• Can share with others
• Good for: Collaborative work, drafts

Choose carefully - blockchain records all permissions.`
      },
      {
        id: 'sh-3',
        question: 'How do I revoke access to a shared document?',
        answer: `To revoke sharing access:
1. Go to File Manager
2. Select the shared document
3. Click "Manage Sharing" or view details
4. Find the user you want to remove
5. Click "Revoke Access"
6. Confirm the blockchain transaction

Note: The user will immediately lose access. However, the blockchain records that they previously had access (for audit purposes).`
      },
      {
        id: 'sh-4',
        question: 'Can I share entire folders?',
        answer: `Folder sharing works hierarchically:

• Sharing a folder shares all documents inside
• New files added to the folder are automatically shared
• Subfolders inherit parent permissions
• You can override permissions for specific files

To share a folder:
1. Right-click the folder
2. Select "Share Folder"
3. Add recipients and set permissions
4. Confirm the action

All documents inside will be shared with the same permissions.`
      },
      {
        id: 'sh-5',
        question: 'Where do I find documents shared with me?',
        answer: `Shared documents appear in:

📂 File Manager > "Shared with Me" folder
• See all documents others shared with you
• Filter by sharer or date
• View your access permission

💬 Chat
• Documents shared via chat appear in the conversation
• Quick access from message attachments

🔔 Notifications
• Get notified when someone shares with you
• Click notification to go directly to the document`
      }
    ],
    'verification': [
      {
        id: 'ver-1',
        question: 'How do I verify a document\'s authenticity?',
        answer: `Three ways to verify documents:

📱 Method 1: Scan QR Code
• Open Verification Tool
• Click "Scan QR Code"
• Point camera at the document's QR code
• View instant verification result

📄 Method 2: Upload Document
• Open Verification Tool
• Click "Upload PDF"
• Select the document file
• System extracts and verifies QR code

🔢 Method 3: Enter Verification Code
• Open Verification Tool
• Enter the document's verification code
• Click "Verify"

All methods show the same verification result.`
      },
      {
        id: 'ver-2',
        question: 'What does the verification result show?',
        answer: `A verified document shows:

✅ Authentication Status
• "Verified" or "Not Found"

📋 Document Details
• Document type/name
• Issue date
• Expiry date (if any)

🏛️ Issuer Information
• Institution name
• Department
• Number of approvals

🔗 Blockchain Proof
• Transaction hash
• Block number
• Timestamp

❌ If verification fails:
• Document may be tampered
• QR code may be damaged
• Document may be fake`
      },
      {
        id: 'ver-3',
        question: 'Why does my document not have a QR code?',
        answer: `QR codes are added only to:

✅ Documents that went through approval workflow
✅ Documents with digital signatures
✅ Generated official documents (certificates, etc.)

Documents without QR codes:
❌ Regular uploaded files
❌ Shared documents (originals)
❌ Draft documents

To get a QR code:
1. Request approval for the document
2. Once approved, download the stamped version
3. The stamped PDF includes the verification QR code`
      },
      {
        id: 'ver-4',
        question: 'Can external parties verify my documents?',
        answer: `Yes! Verification is public:

🌐 Public Verification Page
• Share the verification URL with anyone
• No account needed to verify
• Works with QR scan or manual code entry

What outsiders can see:
✅ Document authenticity
✅ Approval status
✅ Institution name
✅ Document type
✅ Issue date

What stays private:
❌ Document content
❌ Requester name
❌ Internal notes
❌ Approver details

Perfect for: Employers, other institutions, government agencies`
      },
      {
        id: 'ver-5',
        question: 'How long are documents verifiable?',
        answer: `Documents remain verifiable indefinitely:

🔗 Blockchain records are permanent
📌 IPFS content is pinned (stored)
✅ Verification codes never expire

Technical details:
• Hash stored on blockchain forever
• IPFS content pinned via Pinata
• Redundant storage ensures availability

Even if DocuChain platform changes, your documents remain verifiable through blockchain explorers.`
      }
    ],
    'troubleshooting': [
      {
        id: 'tr-1',
        question: 'MetaMask is not connecting. What should I do?',
        answer: `Try these solutions:

1. Check MetaMask Extension
   • Is MetaMask installed and unlocked?
   • Try clicking the MetaMask icon first

2. Check Network
   • Ensure you're on Polygon Mumbai Testnet
   • Add the network if missing (Settings > Networks)

3. Clear Browser Cache
   • Hard refresh: Ctrl+Shift+R
   • Clear site data for DocuChain

4. Try Different Browser
   • MetaMask works best on Chrome/Brave

5. Reinstall MetaMask
   • Export your seed phrase first!
   • Remove and reinstall the extension

Still not working? Contact support with your browser and MetaMask version.`
      },
      {
        id: 'tr-2',
        question: 'My document upload is failing. Why?',
        answer: `Common upload issues:

❌ File Too Large
• Check maximum allowed size
• Compress the file if needed

❌ MetaMask Transaction Failed
• Ensure wallet is connected
• Check if you have test MATIC for gas
• Try increasing gas limit

❌ IPFS Upload Error
• Check your internet connection
• Try a different file format
• File might be corrupted

❌ Network Issues
• Blockchain might be congested
• Wait a few minutes and retry

Fix checklist:
✅ MetaMask connected
✅ Correct network selected
✅ File under size limit
✅ Stable internet connection`
      },
      {
        id: 'tr-3',
        question: 'I\'m not receiving notifications. How to fix?',
        answer: `Check these settings:

1. In-App Notifications
   • Go to Settings > Notifications
   • Ensure relevant toggles are ON

2. Browser Notifications
   • Allow notifications for DocuChain in browser settings
   • Check if browser notifications are enabled globally

3. Email Notifications
   • Check spam/junk folder
   • Verify email address in profile
   • Enable email alerts in settings

4. Browser Issues
   • Some browsers block notifications
   • Try a different browser
   • Disable notification-blocking extensions`
      },
      {
        id: 'tr-4',
        question: 'Document shows "Not on Blockchain". What does this mean?',
        answer: `This means the document exists in our database but wasn't recorded on blockchain:

Possible reasons:
• Uploaded before blockchain integration
• Transaction failed during upload
• Network error during recording

Solution:
1. Re-upload the document
2. Ensure MetaMask confirms the transaction
3. Wait for blockchain confirmation

The document is still safe in IPFS, but blockchain features (sharing, verification) require re-upload.`
      },
      {
        id: 'tr-5',
        question: 'Approval request is stuck. What can I do?',
        answer: `If approval request is stuck:

🔍 Check request status:
• Go to Sent Requests
• Check if it's actually pending

📧 Contact approvers:
• They might have missed the notification
• Send a reminder via chat

⏰ Check expiry:
• Request might have expired
• Create a new request if needed

🔄 Blockchain sync issue:
• Wait 5-10 minutes
• Refresh the page
• Check blockchain explorer for transaction status

If nothing works, contact support with the request ID.`
      },
      {
        id: 'tr-6',
        question: 'How do I get test MATIC tokens?',
        answer: `Test MATIC is needed for gas fees on Mumbai Testnet:

🚰 Official Faucet:
1. Go to: https://faucet.polygon.technology/
2. Select "Mumbai"
3. Enter your wallet address
4. Complete captcha and request tokens

🚰 Alternative Faucets:
• https://mumbaifaucet.com
• https://faucet.quicknode.com/polygon/mumbai

Tips:
• Faucets limit requests (usually once per day)
• 0.5 MATIC is enough for many transactions
• Testnet tokens have no real value`
      }
    ]
  };

  // Filter FAQs based on search
  const getFilteredFaqs = () => {
    if (!searchQuery.trim()) {
      return faqData[activeCategory] || [];
    }
    
    const query = searchQuery.toLowerCase();
    const allFaqs = Object.values(faqData).flat();
    return allFaqs.filter(faq => 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query)
    );
  };

  const filteredFaqs = getFilteredFaqs();

  // Toggle FAQ expansion
  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Handle contact form
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormStatus({ 
        type: 'success', 
        message: 'Your message has been sent successfully! We\'ll get back to you within 24-48 hours.' 
      });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setFormStatus({ 
        type: 'error', 
        message: 'Failed to send message. Please try again or email us directly.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick links data
  const quickLinks = [
    { icon: 'ri-question-answer-line', title: 'Browse FAQs', description: 'Find quick answers', link: '#faq', internal: true },
    { icon: 'ri-mail-send-line', title: 'Contact Support', description: 'Get personalized help', link: '#contact', internal: true },
    { icon: 'ri-github-line', title: 'Report Bug', description: 'GitHub Issues', link: 'https://github.com/mujju-212/Docu-Chain/issues' },
    { icon: 'ri-shield-check-line', title: 'Security Tips', description: 'Stay safe online', link: '#resources', internal: true }
  ];

  return (
    <div className="help-support-page">
      {/* Hero Section */}
      <div className="help-hero">
        <div className="help-hero-content">
          <h1><i className="ri-customer-service-2-line"></i> Help & Support</h1>
          <p>Find answers, get help, and learn how to make the most of DocuChain</p>
          
          {/* Search Bar */}
          <div className="help-search">
            <i className="ri-search-line"></i>
            <input
              type="text"
              placeholder="Search for help topics, FAQs, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links-section">
        <div className="quick-links-grid">
          {quickLinks.map((link, index) => (
            <a key={index} href={link.link} className="quick-link-card" target={link.link.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
              <div className="quick-link-icon">
                <i className={link.icon}></i>
              </div>
              <div className="quick-link-info">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
              <i className="ri-arrow-right-s-line"></i>
            </a>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="help-main-content">
        {/* FAQ Section */}
        <div className="faq-section" id="faq">
          <div className="section-header">
            <h2><i className="ri-question-answer-line"></i> Frequently Asked Questions</h2>
            <p>Browse by category or use search to find answers quickly</p>
          </div>

          <div className="faq-container">
            {/* Category Sidebar */}
            <div className="faq-categories">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${activeCategory === cat.id && !searchQuery ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                    setExpandedFaq(null);
                  }}
                >
                  <i className={cat.icon}></i>
                  <span>{cat.label}</span>
                  <span className="faq-count">{faqData[cat.id]?.length || 0}</span>
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="faq-list">
              {searchQuery && (
                <div className="search-results-header">
                  <i className="ri-search-line"></i>
                  Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
              )}
              
              {filteredFaqs.length === 0 ? (
                <div className="no-results">
                  <i className="ri-emotion-sad-line"></i>
                  <h3>No results found</h3>
                  <p>Try different keywords or browse categories</p>
                </div>
              ) : (
                filteredFaqs.map(faq => (
                  <div 
                    key={faq.id} 
                    className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  >
                    <button className="faq-question" onClick={() => toggleFaq(faq.id)}>
                      <span>{faq.question}</span>
                      <i className={`ri-arrow-${expandedFaq === faq.id ? 'up' : 'down'}-s-line`}></i>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="faq-answer">
                        <div className="answer-content">
                          {faq.answer.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                        <div className="faq-feedback">
                          <span>Was this helpful?</span>
                          <button className="feedback-btn yes"><i className="ri-thumb-up-line"></i> Yes</button>
                          <button className="feedback-btn no"><i className="ri-thumb-down-line"></i> No</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section" id="contact">
          <div className="section-header">
            <h2><i className="ri-mail-send-line"></i> Still Need Help?</h2>
            <p>Can't find what you're looking for? Reach out to our support team</p>
          </div>

          <div className="contact-container">
            {/* Contact Info Cards */}
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-icon support">
                  <i className="ri-mail-line"></i>
                </div>
                <h3>Support Email</h3>
                <p>For general inquiries and help</p>
                <a href="mailto:support@Docuchain.tech" className="contact-link">
                  support@Docuchain.tech
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon developer">
                  <i className="ri-code-s-slash-line"></i>
                </div>
                <h3>Developer Contact</h3>
                <p>Technical issues and feedback</p>
                <a href="mailto:mujju718263@gmail.com" className="contact-link">
                  mujju718263@gmail.com
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon response">
                  <i className="ri-time-line"></i>
                </div>
                <h3>Response Time</h3>
                <p>We typically respond within</p>
                <span className="response-time">24-48 hours</span>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <h3><i className="ri-send-plane-line"></i> Send us a Message</h3>
              
              <form onSubmit={handleContactSubmit} className="contact-form">
                {formStatus.message && (
                  <div className={`form-status ${formStatus.type}`}>
                    <i className={formStatus.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
                    {formStatus.message}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="account">Account Issues</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    placeholder="Describe your issue or question in detail..."
                    rows="5"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line"></i>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="resources-section" id="resources">
          <div className="section-header">
            <h2><i className="ri-links-line"></i> Additional Resources</h2>
          </div>

          <div className="resources-grid">
            <div className="resource-card">
              <i className="ri-shield-star-line"></i>
              <h3>Security Best Practices</h3>
              <p>Keep your account and documents secure</p>
              <ul>
                <li>Never share your MetaMask seed phrase</li>
                <li>Use strong, unique passwords</li>
                <li>Always verify URLs before connecting wallet</li>
                <li>Log out when using shared computers</li>
              </ul>
            </div>

            <div className="resource-card">
              <i className="ri-lightbulb-line"></i>
              <h3>Quick Tips</h3>
              <p>Get the most out of DocuChain</p>
              <ul>
                <li>Organize files in folders for easy access</li>
                <li>Use meaningful document names</li>
                <li>Check approval status regularly</li>
                <li>Keep your profile information updated</li>
              </ul>
            </div>

            <div className="resource-card">
              <i className="ri-information-line"></i>
              <h3>About DocuChain</h3>
              <p>Blockchain document management for institutions</p>
              <ul>
                <li>Built with React & Python Flask</li>
                <li>Polygon blockchain network</li>
                <li>IPFS decentralized storage (Pinata)</li>
                <li>Secure document verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="help-footer">
        <div className="footer-content">
          <div className="footer-info">
            <h3>DocuChain</h3>
            <p>Secure. Verified. Blockchain-Powered.</p>
          </div>
          <div className="footer-links">
            <a href="mailto:support@Docuchain.tech">
              <i className="ri-mail-line"></i> support@Docuchain.tech
            </a>
            <a href="mailto:mujju718263@gmail.com">
              <i className="ri-code-line"></i> Developer Contact
            </a>
            <a href="https://github.com/mujju-212/Docu-Chain" target="_blank" rel="noreferrer">
              <i className="ri-github-line"></i> GitHub
            </a>
          </div>
        </div>
        <div className="footer-copyright">
          © 2025 DocuChain. All rights reserved.
        </div>
      </div>
    </div>
  );
}