import React, { useState } from 'react';
import { Header } from '../components/ui/header-2';
import { Footer } from '../components/ui/footer-section';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { 
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Rocket,
  User,
  FileText,
  Lock,
  Share2,
  BadgeCheck,
  Settings,
  CheckCircle
} from 'lucide-react';

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ Categories
  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: <Rocket className="w-5 h-5" /> },
    { id: 'account', label: 'Account & Profile', icon: <User className="w-5 h-5" /> },
    { id: 'documents', label: 'Documents & Files', icon: <FileText className="w-5 h-5" /> },
    { id: 'blockchain', label: 'Blockchain & Security', icon: <Lock className="w-5 h-5" /> },
    { id: 'approval', label: 'Approval Workflow', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'sharing', label: 'Sharing & Collaboration', icon: <Share2 className="w-5 h-5" /> },
    { id: 'verification', label: 'Document Verification', icon: <BadgeCheck className="w-5 h-5" /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <Settings className="w-5 h-5" /> }
  ];

  // FAQ Data
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
5. Choose approval type: Standard or Digital Signature
6. Choose workflow: Sequential or Parallel
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
   • Add the network if missing

3. Clear Browser Cache
   • Hard refresh: Ctrl+Shift+R
   • Clear site data for DocuChain

4. Try Different Browser
   • MetaMask works best on Chrome/Brave

Still not working? Contact support with your browser and MetaMask version.`
      },
      {
        id: 'tr-2',
        question: 'My document upload is failing. Why?',
        answer: `Common upload issues:

❌ File Too Large - Check maximum allowed size
❌ MetaMask Transaction Failed - Ensure wallet is connected
❌ IPFS Upload Error - Check your internet connection
❌ Network Issues - Blockchain might be congested

Fix checklist:
✅ MetaMask connected
✅ Correct network selected
✅ File under size limit
✅ Stable internet connection`
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

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 mb-6">
            <HelpCircle className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Find quick answers to common questions about DocuChain
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <div className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 sticky top-24">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-4 space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearchQuery('');
                        setExpandedFaq(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        activeCategory === cat.id && !searchQuery
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {cat.icon}
                      <span className="text-sm font-medium flex-1 text-left">{cat.label}</span>
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                        {faqData[cat.id]?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-3 space-y-4">
              {searchQuery && (
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <Search className="w-5 h-5" />
                  <span>Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
                </div>
              )}
              
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-gray-400">Try different keywords or browse categories</p>
                </div>
              ) : (
                filteredFaqs.map(faq => (
                  <div 
                    key={faq.id}
                    className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition"
                      >
                        <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-6 pb-6">
                          <div className="text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-800 pt-4">
                            {faq.answer}
                          </div>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
                            <span className="text-sm text-gray-400">Was this helpful?</span>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition text-sm">
                              <ThumbsUp className="w-4 h-4" />
                              Yes
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm">
                              <ThumbsDown className="w-4 h-4" />
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="relative overflow-hidden">
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
}

