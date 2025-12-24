import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/ui/header-2';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Footer } from '../components/ui/footer-section';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { 
  Shield, 
  FileCheck, 
  Lock, 
  Zap, 
  Users, 
  Globe,
  Database,
  CheckCircle,
  Clock,
  Search,
  FolderTree,
  Workflow,
  Upload,
  Download,
  Bell,
  QrCode,
  FileText,
  Key,
  BookOpen,
  GraduationCap,
  UserCheck,
  Settings,
  BarChart,
  GitBranch
} from 'lucide-react';

// Reusable Card Component matching home page style
const FeatureCard = ({ icon, title, description }) => {
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

// Role-based Card Component
const RoleCard = ({ icon, role, color, features }) => {
  return (
    <div className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl border border-${color}-500/50 bg-${color}-500/20 flex items-center justify-center`}>
            <div className={`text-${color}-400`}>
              {icon}
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{role}</h3>
        </div>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function Features() {
  const coreFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Blockchain Security",
      description: "Immutable document records stored on Ethereum blockchain with SHA-256 cryptographic hashing for tamper-proof verification and complete transparency."
    },
    {
      icon: <FileCheck className="w-6 h-6" />,
      title: "Instant Verification",
      description: "Generate QR codes for instant document verification. Anyone can verify document authenticity in seconds using unique verification codes."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Smart Contracts",
      description: "Automated workflows powered by Solidity smart contracts ensure transparent, efficient, and trustless document processing."
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: "Approval Workflows",
      description: "Multi-level approval system with sequential and parallel routing, automated notifications, and configurable approval chains."
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "IPFS Storage",
      description: "Decentralized file storage via Pinata IPFS ensures permanent document accessibility, redundancy, and censorship resistance."
    },
    {
      icon: <FolderTree className="w-6 h-6" />,
      title: "Smart Folders",
      description: "Hierarchical folder organization with starring, tagging, color coding, and advanced categorization for perfect organization."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Advanced Search",
      description: "Powerful search engine with real-time indexing, smart filters, and full-text search across all documents and metadata."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Version Control",
      description: "Complete audit trail of all document changes with rollback capability, revision history, and detailed activity logs."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Real-Time Notifications",
      description: "Instant email and in-app notifications for approvals, updates, mentions, and important document events."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Bulk Operations",
      description: "Process multiple documents simultaneously with batch upload, approval requests, downloads, and verification."
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Code Generation",
      description: "Automatic QR code generation for every certified document enables quick mobile scanning and verification."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Public Verification",
      description: "Anyone can verify document authenticity through public verification portal without needing an account or login."
    }
  ];

  const adminFeatures = [
    "Complete system administration and user management",
    "Create, edit, and delete user accounts for faculty and students",
    "Assign and modify roles with granular permission controls",
    "Monitor all system activities through comprehensive dashboards",
    "Manage approval workflows and configure routing rules",
    "Access detailed analytics and generate compliance reports",
    "Configure system settings, notifications, and integrations",
    "Manage folders, categories, and organizational structures",
    "Perform bulk operations on users and documents",
    "View blockchain transaction history and verification logs",
    "Override approvals and manage escalation policies",
    "Set up email templates and notification preferences"
  ];

  const facultyFeatures = [
    "Upload and manage course documents and materials",
    "Create and manage folder structures for courses",
    "Submit approval requests for official documents",
    "Approve or reject student document requests",
    "Participate in multi-level approval workflows",
    "Download documents with blockchain certification",
    "Generate QR codes for document verification",
    "Track approval status in real-time with notifications",
    "Search and filter documents across all courses",
    "Access version history and audit trails",
    "Collaborate with other faculty on document reviews",
    "Receive email and in-app notifications for approvals"
  ];

  const studentFeatures = [
    "Upload documents for faculty review and approval",
    "Request approvals for assignments and projects",
    "Track approval request status in real-time",
    "Download blockchain-certified documents",
    "Verify document authenticity using QR codes",
    "Organize documents in personal folders",
    "Search and filter personal document library",
    "View detailed approval history and comments",
    "Receive notifications for approval updates",
    "Access documents from any device securely",
    "Share verified documents with external parties",
    "View blockchain verification details"
  ];

  return (
    <div className="min-h-screen bg-[#030303] relative">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Modern Education
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Everything you need for secure, efficient, and blockchain-verified document management in educational institutions
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/verify"
              className="px-8 py-4 bg-gray-900 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Try Verification
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Core Features
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Built on cutting-edge blockchain technology with security, scalability, and ease of use in mind
            </p>
          </div>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((feature, idx) => (
              <FeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Role-Based Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Features by Role
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Tailored capabilities for every user role in your educational institution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <RoleCard
              icon={<Settings className="w-8 h-8" />}
              role="Admin"
              color="blue"
              features={adminFeatures}
            />
            <RoleCard
              icon={<BookOpen className="w-8 h-8" />}
              role="Faculty"
              color="green"
              features={facultyFeatures}
            />
            <RoleCard
              icon={<GraduationCap className="w-8 h-8" />}
              role="Student"
              color="purple"
              features={studentFeatures}
            />
          </div>
        </div>
      </section>

      {/* Technology Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built on Industry Standards
            </h2>
            <p className="text-gray-400 text-lg">
              Powered by secure and proven technologies
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { 
                icon: <Lock className="w-10 h-10" />, 
                title: "256-bit", 
                subtitle: "SHA-256 Encryption",
                color: "blue" 
              },
              { 
                icon: <CheckCircle className="w-10 h-10" />, 
                title: "100%", 
                subtitle: "Uptime Guarantee",
                color: "green" 
              },
              { 
                icon: <Zap className="w-10 h-10" />, 
                title: "< 2s", 
                subtitle: "Verification Speed",
                color: "yellow" 
              },
              { 
                icon: <Database className="w-10 h-10" />, 
                title: "∞", 
                subtitle: "IPFS Storage",
                color: "purple" 
              }
            ].map((stat, idx) => (
              <div 
                key={idx}
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
                <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-8 shadow-sm">
                  <div className={`text-${stat.color}-400`}>
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-white">{stat.title}</div>
                  <div className="text-gray-400 text-center">{stat.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Technology Stack
            </h2>
            <p className="text-gray-400 text-lg">
              Built with cutting-edge blockchain and web technologies
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Ethereum",
                description: "Sepolia testnet for smart contracts"
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: "IPFS/Pinata",
                description: "Decentralized file storage"
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Solidity",
                description: "Smart contract development"
              },
              {
                icon: <GitBranch className="w-6 h-6" />,
                title: "PostgreSQL",
                description: "Reliable database system"
              }
            ].map((tech, idx) => (
              <FeatureCard
                key={idx}
                icon={tech.icon}
                title={tech.title}
                description={tech.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="relative rounded-[1.5rem] border-[0.75px] border-gray-800 p-3">
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={80}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm p-12 shadow-sm">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join educational institutions worldwide using DocuChain for secure, blockchain-verified document management
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/auth/register"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-lg inline-flex items-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  Create Account
                </Link>
                <Link
                  to="/verify"
                  className="px-8 py-4 bg-gray-900 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition inline-flex items-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Verify Document
                </Link>
              </div>
            </div>
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
