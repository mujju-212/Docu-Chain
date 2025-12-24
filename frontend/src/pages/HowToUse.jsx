import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/ui/header-2';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Footer } from '../components/ui/footer-section';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { 
  BookOpen,
  Building2,
  UserPlus,
  Settings,
  GraduationCap,
  BookOpenCheck,
  FileText,
  FolderTree,
  MessageSquare,
  Users,
  Workflow,
  CheckCircle,
  ArrowRight,
  Shield,
  Upload,
  Download,
  QrCode,
  Bell,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Accordion Section Component
const AccordionSection = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 mb-4">
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
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              {icon}
            </div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
          {isOpen ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </button>
        {isOpen && (
          <div className="p-6 pt-0 space-y-4 text-gray-300">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// Step Component
const Step = ({ number, title, description, substeps }) => {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-400 mb-3">{description}</p>
        {substeps && (
          <ul className="space-y-2 ml-4">
            {substeps.map((substep, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                <span className="text-gray-400 text-sm">{substep}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureGuideCard = ({ icon, title, description }) => {
  return (
    <div className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-6">
        <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
          {icon}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default function HowToUse() {
  return (
    <div className="min-h-screen bg-[#030303] relative">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            How to Use{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              DocuChain
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Complete step-by-step guide to set up and use DocuChain for your educational institution
          </p>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Getting Started
            </h2>
            <p className="text-gray-400 text-lg">
              Follow these steps to set up your institution on DocuChain
            </p>
          </div>

          <AccordionSection 
            title="1. Create Your Institution Account" 
            icon={<Building2 className="w-6 h-6" />}
            defaultOpen={true}
          >
            <Step
              number="1"
              title="Visit Registration Page"
              description="Go to DocuChain and click 'Get Started' or 'Sign Up'"
              substeps={[
                "Navigate to the registration page",
                "Select 'Admin' role for institution setup",
                "You'll be the primary administrator"
              ]}
            />
            <Step
              number="2"
              title="Fill Institution Details"
              description="Provide your institution information"
              substeps={[
                "Institution name (e.g., 'ABC University')",
                "Your name and email address",
                "Create a strong password",
                "Department/designation (optional)"
              ]}
            />
            <Step
              number="3"
              title="Verify Email"
              description="Check your email for verification link"
              substeps={[
                "Open the verification email",
                "Click the verification link",
                "Your account will be activated"
              ]}
            />
            <Step
              number="4"
              title="Login to Dashboard"
              description="Access your admin dashboard"
              substeps={[
                "Enter your email and password",
                "Click 'Login' to access admin panel",
                "You'll see the full admin dashboard"
              ]}
            />
          </AccordionSection>

          <AccordionSection 
            title="2. Set Up Users & Roles" 
            icon={<UserPlus className="w-6 h-6" />}
          >
            <Step
              number="1"
              title="Access User Management"
              description="Navigate to the Users section in admin dashboard"
              substeps={[
                "Click 'Users' in the sidebar menu",
                "You'll see the user management interface",
                "View all existing users and their roles"
              ]}
            />
            <Step
              number="2"
              title="Add Faculty Members"
              description="Create accounts for teaching staff"
              substeps={[
                "Click 'Add User' or '+' button",
                "Select 'Faculty' as role",
                "Enter name, email, department",
                "Faculty can upload, manage, and approve documents",
                "Click 'Create' to send invitation email"
              ]}
            />
            <Step
              number="3"
              title="Add Students"
              description="Create accounts for students"
              substeps={[
                "Click 'Add User' button",
                "Select 'Student' as role",
                "Enter name, email, student ID, course",
                "Students can upload documents and request approvals",
                "Bulk upload option available for multiple students"
              ]}
            />
            <Step
              number="4"
              title="Manage User Permissions"
              description="Edit or update user accounts"
              substeps={[
                "Click edit icon next to any user",
                "Modify details, change roles, or deactivate accounts",
                "Reset passwords if needed",
                "View user activity and document history"
              ]}
            />
          </AccordionSection>
        </div>
      </section>

      {/* Role-Based Guides */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Using DocuChain by Role
            </h2>
            <p className="text-gray-400 text-lg">
              Detailed guides for each user role
            </p>
          </div>

          {/* Admin Guide */}
          <AccordionSection 
            title="Admin Guide" 
            icon={<Settings className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  User Management
                </h4>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Create, edit, and delete user accounts (Faculty & Students)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Assign and modify user roles and permissions</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>View user activity logs and document history</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Bulk user import from CSV/Excel files</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-400" />
                  System Configuration
                </h4>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Configure approval workflows and routing rules</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Set up folder structures and categories</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Manage notification templates and preferences</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Configure blockchain and IPFS settings</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Monitoring & Analytics
                </h4>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>View system-wide dashboard with key metrics</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Monitor approval workflows and pending requests</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Generate compliance and audit reports</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Track blockchain transactions and verification logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </AccordionSection>

          {/* Faculty Guide */}
          <AccordionSection 
            title="Faculty Guide" 
            icon={<BookOpenCheck className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Document Upload & Management
                </h4>
                <Step
                  number="1"
                  title="Upload Documents"
                  description="Add course materials and official documents"
                  substeps={[
                    "Go to 'Documents' section in dashboard",
                    "Click 'Upload' or drag & drop files",
                    "Supported formats: PDF, DOC, DOCX, PPT, XLSX",
                    "Add title, description, tags, and category",
                    "Assign to specific folders or courses"
                  ]}
                />
                <Step
                  number="2"
                  title="Organize in Folders"
                  description="Create folder structure for your courses"
                  substeps={[
                    "Click 'File Manager' in sidebar",
                    "Create folders by course, semester, or type",
                    "Drag and drop documents to organize",
                    "Star important folders for quick access",
                    "Use color coding for better organization"
                  ]}
                />
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-blue-400" />
                  Approval System
                </h4>
                <Step
                  number="1"
                  title="Submit for Approval"
                  description="Request approval for official documents"
                  substeps={[
                    "Select document from your uploads",
                    "Click 'Request Approval' button",
                    "Choose approvers from faculty/admin list",
                    "Add comments or special instructions",
                    "Submit and track in real-time"
                  ]}
                />
                <Step
                  number="2"
                  title="Review Student Requests"
                  description="Approve or reject student submissions"
                  substeps={[
                    "Go to 'Approvals' section",
                    "View pending requests from students",
                    "Click on request to view document details",
                    "Add comments or request modifications",
                    "Approve or Reject with reason",
                    "Student receives instant notification"
                  ]}
                />
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  Document Certification
                </h4>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Approved documents are automatically blockchain-certified</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Download certified PDF with QR code and verification stamp</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Share verification code (DCH-XXXX-XXXXXX) with students</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>View blockchain transaction details and IPFS hash</span>
                  </li>
                </ul>
              </div>
            </div>
          </AccordionSection>

          {/* Student Guide */}
          <AccordionSection 
            title="Student Guide" 
            icon={<GraduationCap className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Submit Documents
                </h4>
                <Step
                  number="1"
                  title="Upload Your Document"
                  description="Submit assignments, projects, or applications"
                  substeps={[
                    "Login to student dashboard",
                    "Click 'Upload Document' or go to Documents section",
                    "Select file from your device (PDF recommended)",
                    "Fill in document details (title, type, course)",
                    "Click 'Upload' to save"
                  ]}
                />
                <Step
                  number="2"
                  title="Request Approval"
                  description="Send document for faculty review"
                  substeps={[
                    "Find your uploaded document",
                    "Click 'Request Approval' button",
                    "Select the faculty member to approve",
                    "Add message or context if needed",
                    "Submit and wait for notification"
                  ]}
                />
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Track Approval Status
                </h4>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>View all approval requests in 'Approvals' tab</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Status indicators: Pending (yellow), Approved (green), Rejected (red)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>Receive email and in-app notifications for updates</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    <span>View comments and feedback from faculty</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Download Certified Documents
                </h4>
                <Step
                  number="1"
                  title="Access Approved Documents"
                  description="Download blockchain-certified files"
                  substeps={[
                    "Go to 'Approved Documents' section",
                    "Click on approved document",
                    "Click 'Download Certified Copy'",
                    "PDF includes QR code and verification details",
                    "Share with employers, universities, or third parties"
                  ]}
                />
                <Step
                  number="2"
                  title="Verify Authenticity"
                  description="Prove document is genuine"
                  substeps={[
                    "Anyone can scan QR code on document",
                    "Or visit docuchain.tech/verify",
                    "Enter verification code (DCH-XXXX-XXXXXX)",
                    "View blockchain proof and document details",
                    "100% tamper-proof verification"
                  ]}
                />
              </div>
            </div>
          </AccordionSection>
        </div>
      </section>

      {/* Feature-Specific Guides */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Feature Guides
            </h2>
            <p className="text-gray-400 text-lg">
              Learn how to use specific DocuChain features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureGuideCard
              icon={<FolderTree className="w-6 h-6" />}
              title="File Manager"
              description="Create folders, organize documents with drag & drop, star favorites, color code categories, and use advanced search filters to find documents instantly."
            />
            <FeatureGuideCard
              icon={<Workflow className="w-6 h-6" />}
              title="Approval Workflows"
              description="Set up multi-level approvals, configure sequential or parallel routing, add approval comments, track approval history, and receive real-time notifications."
            />
            <FeatureGuideCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Chat & Collaboration"
              description="Discuss documents with team members, mention users with @, share files in conversations, create group chats, and receive message notifications."
            />
            <FeatureGuideCard
              icon={<Search className="w-6 h-6" />}
              title="Advanced Search"
              description="Search across all documents by name, content, tags, or metadata. Use filters for date, type, status, and owner. Save frequent searches for quick access."
            />
            <FeatureGuideCard
              icon={<Bell className="w-6 h-6" />}
              title="Notifications"
              description="Configure email and in-app notifications for approvals, mentions, document updates, and system alerts. Set notification preferences per category."
            />
            <FeatureGuideCard
              icon={<Shield className="w-6 h-6" />}
              title="Blockchain Verification"
              description="Every approved document is stored on Ethereum blockchain with IPFS. Verify authenticity using QR codes or verification codes. View transaction details on Etherscan."
            />
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="relative rounded-[1.5rem] border-[0.75px] border-gray-800 p-3">
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={80}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm p-8">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">
                💡 Quick Tips for Success
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Use descriptive names:</strong>
                    <span className="text-gray-300"> Name documents clearly for easy searching</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Organize with folders:</strong>
                    <span className="text-gray-300"> Create a logical folder structure early</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Tag documents:</strong>
                    <span className="text-gray-300"> Add relevant tags for better discoverability</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Check notifications:</strong>
                    <span className="text-gray-300"> Stay updated on approval requests and updates</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Use QR verification:</strong>
                    <span className="text-gray-300"> Share certified documents with embedded QR codes</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white">Backup important docs:</strong>
                    <span className="text-gray-300"> Download certified copies for your records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your institution account and start managing documents with blockchain security
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-lg inline-flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Link>
            <Link
              to="/verify"
              className="px-8 py-4 bg-gray-900 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Try Verification
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
}
