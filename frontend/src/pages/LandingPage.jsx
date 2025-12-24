import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/ui/header-2';
import { HeroSection } from '../components/blocks/hero-section';
import { GlowingCards } from '../components/blocks/glowing-cards';
import { Footer } from '../components/ui/footer-section';
import { BackgroundBeams } from '../components/ui/background-beams';
import { HoverEffect } from '../components/ui/hover-effect';
import { BentoGrid } from '../components/ui/bento-grid';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { WorkflowTimeline } from '../components/ui/workflow-timeline';
import { 
  Shield, 
  FileCheck, 
  CheckCircle, 
  Lock,
  Zap,
  Database,
  QrCode,
  FileText,
  Workflow,
  Search,
  FolderTree,
  Clock,
  Users,
  Globe,
  Bell,
  Upload,
  Hash,
  Link2,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  ExternalLink
} from 'lucide-react';

// Get API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'www.docuchain.tech' || 
       window.location.hostname === 'docuchain.tech')) {
    return 'https://docu-chain-api.azurewebsites.net/api';
  }
  let url = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }
  return url;
};

const API_URL = getApiUrl();

// Reusable GridItem Component (GlowingCards style)
const GridItem = ({ icon, title, description }) => {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-6 shadow-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-blue-500/50 bg-blue-500/20 p-3">
              <div className="text-blue-400">
                {icon}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

// Document Management Features for Hover Effect
const documentFeatures = [
  {
    title: "Smart Folder System",
    description: "Organize documents with hierarchical folders, starring, and advanced categorization. Create custom folder structures that match your institutional workflow.",
    icon: <FolderTree className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Approval Workflows",
    description: "Multi-level approval system with sequential/parallel routing and automated notifications. Configure complex approval chains with ease.",
    icon: <Workflow className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Universal Search",
    description: "Cross-role document discovery with advanced filters and real-time indexing. Find any document instantly with powerful search capabilities.",
    icon: <Search className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Role-Based Access",
    description: "Three-tier system (Admin, Faculty, Student) with granular permissions. Control who can view, edit, approve, and manage documents.",
    icon: <Users className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Version History",
    description: "Complete audit trail of all document changes with rollback capability. Track every modification with timestamps and user attribution.",
    icon: <Clock className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Bulk Operations",
    description: "Process multiple documents simultaneously with batch upload and approval. Save time with efficient bulk document management.",
    icon: <FileCheck className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Real-Time Updates",
    description: "Live notifications and status updates using WebSocket technology for instant collaboration and awareness.",
    icon: <Bell className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Blockchain Security",
    description: "Immutable document records stored on Ethereum blockchain with cryptographic hashing for tamper-proof verification.",
    icon: <Shield className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Global Accessibility",
    description: "Access your documents from anywhere in the world with our cloud-based platform and decentralized storage.",
    icon: <Globe className="w-12 h-12" />,
    link: "/features"
  }
];

// How It Works Workflow Features
const workflowFeatures = [
  {
    title: "Upload & Create",
    description: "Securely upload documents to our decentralized storage system with instant blockchain hash generation. Create new files directly in the platform with automatic versioning and metadata management.",
    icon: <Upload className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Manage & Organize",
    description: "Smart folder management with role-based access control and real-time collaboration. Organize documents with hierarchical structures, starring, and advanced categorization features.",
    icon: <FolderTree className="w-12 h-12" />,
    link: "/features"
  },
  {
    title: "Share & Approve",
    description: "Collaborative workflows with integrated chat, multi-level approval systems, and complete access transparency. Share documents securely with granular permission controls.",
    icon: <CheckCircle className="w-12 h-12" />,
    link: "/features"
  }
];

// Technology Stack for Bento Grid
const technologyStack = [
  {
    title: "Ethereum Blockchain",
    meta: "Sepolia Testnet",
    description: "Immutable document hashes and smart contract execution with cryptographic verification",
    icon: <div className="text-2xl">⟠</div>,
    status: "Live",
    tags: ["Solidity 0.8.19", "Web3.js", "Smart Contracts"],
    colSpan: 1,
    hasPersistentHover: true,
  },
  {
    title: "IPFS Storage",
    meta: "Pinata Gateway",
    description: "Decentralized file storage with content-addressed persistence and global CDN",
    icon: <div className="text-2xl">◉</div>,
    status: "Active",
    tags: ["Pinata API", "CID Hashing", "Decentralized"],
    colSpan: 1,
  },
  {
    title: "Modern Stack",
    meta: "Production Ready",
    description: "React 18 frontend with Flask 3.0 backend and PostgreSQL database for robust performance",
    icon: <div className="text-2xl">⚡</div>,
    status: "Updated",
    tags: ["React 18", "Flask 3.0", "PostgreSQL"],
    colSpan: 1,
  },
];

const LandingPage = () => {
  // Verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Handle verification by code
  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await fetch(`${API_URL}/approvals/verify/${verificationCode.trim()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationResult(data.data);
        setError('');
      } else {
        setError(data.error || data.message || 'Verification failed');
        setVerificationResult(null);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify document. Please try again.');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  };

  // Verify from uploaded PDF
  const verifyFromFile = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }
    
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch(`${API_URL}/approvals/verify-file`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setVerificationResult(data.data);
        setError('');
      } else {
        setError(data.error || 'Could not verify from file');
        setVerificationResult(null);
      }
    } catch (err) {
      console.error('File verification error:', err);
      setError('Failed to verify from file');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle download
  const handleDownload = (ipfsHash, fileName) => {
    if (!ipfsHash) return;
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#030303] relative">
      {/* Sticky Header */}
      <Header />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Main Features Section with Animated Beams */}
      <section id="features" className="py-8 px-4 sm:px-6 lg:px-8 bg-[#030303] relative overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="relative z-10">
          <GlowingCards />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              How DocuChain Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A seamless workflow connecting all your document management needs
            </p>
          </div>

          {/* Workflow Timeline */}
          <WorkflowTimeline />
        </div>
      </section>

      {/* Document Management Suite with GlowingCards style */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-[#030303] relative overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Complete Document Management Suite
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Everything you need for secure, efficient document handling in educational institutions
            </p>
          </div>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentFeatures.map((item, idx) => (
              <GridItem
                key={idx}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Technology Stack with Bento Grid */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/50 to-[#030303] relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built on Cutting-Edge Technology
            </h2>
            <p className="text-gray-400 text-lg">
              Powered by industry-leading blockchain and decentralized storage
            </p>
          </div>
          
          <BentoGrid items={technologyStack} />
        </div>
      </section>

      {/* Document Verification Section */}
      <section id="verify" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#030303] to-black relative overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 mb-6">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Verify Document Authenticity
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Instantly verify any blockchain-certified document using its unique verification code or upload the certified PDF
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Verification Input */}
            <div className="relative">
              <div className="relative rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm p-8 shadow-2xl">
                <GlowingEffect
                  spread={60}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                      <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Enter Verification Code</h3>
                  </div>

                  {/* Code Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      placeholder="DCH-2025-XXXXXX"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the code from the top-right corner of your certified document
                    </p>
                  </div>

                  {/* Verify Button */}
                  <button
                    onClick={handleVerify}
                    disabled={loading || !verificationCode.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2 mb-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verify Document
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-black/50 text-gray-400">or upload certified PDF</span>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf"
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {uploadedFile ? uploadedFile.name : 'Upload PDF File'}
                    </button>

                    {uploadedFile && (
                      <button
                        onClick={verifyFromFile}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                      >
                        <FileCheck className="w-5 h-5" />
                        Verify from PDF
                      </button>
                    )}
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 border border-gray-800 rounded-lg">
                  <QrCode className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-sm text-gray-400">Scan QR Code</p>
                </div>
                <div className="p-4 bg-black/30 border border-gray-800 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-sm text-gray-400">Upload PDF</p>
                </div>
              </div>
            </div>

            {/* Right Panel - Verification Results */}
            <div className="relative">
              <div className="relative rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm p-8 shadow-2xl min-h-[600px]">
                <GlowingEffect
                  spread={60}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                
                <div className="relative z-10">
                  {!verificationResult ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">No Verification Yet</h3>
                      <p className="text-gray-400 mb-6 max-w-sm">
                        Enter a verification code or upload a certified PDF to verify document authenticity
                      </p>
                      <div className="text-left space-y-3 bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <p className="text-sm font-semibold text-blue-400 mb-3">How to verify:</p>
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                          <Key className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>Enter the DCH code from your certified document</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                          <Upload className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>Upload the PDF file for automatic verification</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>View complete blockchain verification details</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Status Banner */}
                      <div className={`p-6 rounded-xl ${verificationResult.verified ? 'bg-green-500/10 border border-green-500/50' : 'bg-yellow-500/10 border border-yellow-500/50'}`}>
                        <div className="flex items-center gap-4">
                          {verificationResult.verified ? (
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-7 h-7 text-green-400" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-7 h-7 text-yellow-400" />
                            </div>
                          )}
                          <div>
                            <h3 className={`text-2xl font-bold ${verificationResult.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                              {verificationResult.verified ? 'Document Verified ✓' : 'Pending Approval'}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono mt-1">
                              {verificationResult.verification_code}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          Document Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Document Name</p>
                            <p className="text-sm text-white font-medium">{verificationResult.document?.name || 'N/A'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">File Type</p>
                              <p className="text-sm text-gray-300">{verificationResult.document?.file_type?.toUpperCase() || 'PDF'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Status</p>
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                                verificationResult.approval?.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                verificationResult.approval?.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {verificationResult.approval?.status || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Requester Info */}
                      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          Requester Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Name:</span>
                            <span className="text-sm text-white font-medium">{verificationResult.requester?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Email:</span>
                            <span className="text-sm text-gray-300">{verificationResult.requester?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Institution:</span>
                            <span className="text-sm text-gray-300">{verificationResult.requester?.institution || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Timeline */}
                      {verificationResult.approvers && verificationResult.approvers.length > 0 && (
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-blue-400" />
                            Approval Timeline
                          </h4>
                          <div className="space-y-3">
                            {verificationResult.approvers.map((approver, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                                {approver.has_approved ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                ) : approver.has_rejected ? (
                                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white">{approver.name}</p>
                                  <p className="text-xs text-gray-400">{approver.role}</p>
                                  {approver.action_timestamp && (
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(approver.action_timestamp)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Info */}
                      {verificationResult.blockchain?.tx_hash && (
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-blue-400" />
                            Blockchain Verification
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-2">IPFS Hash</p>
                              <code className="text-xs text-gray-300 bg-black/50 px-3 py-2 rounded block overflow-x-auto">
                                {verificationResult.document?.ipfs_hash}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Transaction Hash</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-gray-300 bg-black/50 px-3 py-2 rounded block overflow-x-auto flex-1">
                                  {verificationResult.blockchain.tx_hash.slice(0, 20)}...{verificationResult.blockchain.tx_hash.slice(-16)}
                                </code>
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${verificationResult.blockchain.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded border border-blue-500/50 transition"
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-400" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Download Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDownload(verificationResult.document?.ipfs_hash, verificationResult.document?.name)}
                          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download Document
                        </button>
                        <button
                          onClick={() => {
                            setVerificationResult(null);
                            setVerificationCode('');
                            setUploadedFile(null);
                            setError('');
                          }}
                          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              All verifications are recorded on the Ethereum blockchain • Tamper-proof • Publicly verifiable
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-50" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Secure Your Documents?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join educational institutions using blockchain-verified document management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xl text-lg font-semibold">
                Get Started Free
              </button>
            </Link>
            <a href="#verify">
              <button className="px-8 py-4 border-2 border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 transition text-lg font-semibold">
                Verify a Document
              </button>
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Open source • Ethereum-based • No credit card required
          </p>
        </div>
      </section>

      {/* Footer with Beams */}
      <div className="relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;