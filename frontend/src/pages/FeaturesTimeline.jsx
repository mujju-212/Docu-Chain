import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/ui/header-2';
import { Footer } from '../components/ui/footer-section';
import RadialOrbitalTimelineDemo from "../components/blocks/radial-orbital-timeline-demo";
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
  Workflow
} from 'lucide-react';

export default function FeaturesTimeline() {
  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Header */}
      <Header />

      {/* Hero Section with Background */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Modern Education
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Everything you need for secure, efficient, and blockchain-verified document management
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Timeline */}
      <section className="py-20 relative">
        <div className="relative z-10">
          <RadialOrbitalTimelineDemo />
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Complete Feature Set
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Built for educational institutions with security, scalability, and ease of use in mind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Blockchain Security",
                description: "Immutable document records stored on Ethereum blockchain with cryptographic hashing for tamper-proof verification",
                color: "blue"
              },
              {
                icon: <FileCheck className="w-8 h-8" />,
                title: "Instant Verification",
                description: "Generate QR codes for instant document verification. Anyone can verify authenticity in seconds",
                color: "green"
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: "Smart Contract Automation",
                description: "Automated workflows powered by Solidity smart contracts for transparent and efficient processing",
                color: "purple"
              },
              {
                icon: <Workflow className="w-8 h-8" />,
                title: "Multi-Level Approvals",
                description: "Configurable approval workflows with sequential and parallel routing for complex institutional processes",
                color: "cyan"
              },
              {
                icon: <Database className="w-8 h-8" />,
                title: "IPFS Storage",
                description: "Decentralized file storage via Pinata IPFS ensuring permanent accessibility and redundancy",
                color: "orange"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Role-Based Access",
                description: "Three-tier permission system (Admin, Faculty, Student) with granular access controls",
                color: "pink"
              },
              {
                icon: <FolderTree className="w-8 h-8" />,
                title: "Smart Folders",
                description: "Hierarchical folder organization with starring, tagging, and advanced categorization",
                color: "yellow"
              },
              {
                icon: <Search className="w-8 h-8" />,
                title: "Universal Search",
                description: "Powerful search across all documents with real-time indexing and advanced filters",
                color: "indigo"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Version History",
                description: "Complete audit trail of all changes with rollback capability and detailed activity logs",
                color: "red"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Bulk Operations",
                description: "Process multiple documents simultaneously with batch upload, approval, and verification",
                color: "teal"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Real-Time Updates",
                description: "Live notifications and status updates using WebSocket technology for instant collaboration",
                color: "violet"
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: "Automated Notifications",
                description: "Email and in-app notifications for approvals, updates, and important document events",
                color: "emerald"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group p-8 rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-${feature.color}-500/10 border border-${feature.color}-500/30 rounded-xl flex items-center justify-center text-${feature.color}-400 mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "256-bit", label: "SHA-256 Encryption", icon: <Lock className="w-8 h-8 mx-auto mb-4 text-blue-400" /> },
              { number: "100%", label: "Uptime Guarantee", icon: <CheckCircle className="w-8 h-8 mx-auto mb-4 text-green-400" /> },
              { number: "< 2s", label: "Verification Speed", icon: <Zap className="w-8 h-8 mx-auto mb-4 text-yellow-400" /> },
              { number: "∞", label: "Storage via IPFS", icon: <Database className="w-8 h-8 mx-auto mb-4 text-purple-400" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-8 rounded-2xl border border-gray-800 bg-black/50"
              >
                {stat.icon}
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with Beams */}
      <div className="relative overflow-hidden">
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
}

