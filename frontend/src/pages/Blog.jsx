import React from 'react';
import { Header } from '../components/ui/header-2';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Footer } from '../components/ui/footer-section';
import { Timeline } from '../components/ui/timeline';
import { 
  Rocket, 
  Shield, 
  Zap, 
  Database, 
  Cloud, 
  Lock,
  TrendingUp,
  FileCheck,
  Users,
  Layers,
  Globe,
  Settings
} from 'lucide-react';

export default function Blog() {
  const blogPosts = [
    {
      date: "2025-12-20",
      title: "DocuChain Goes Live on Azure",
      description: "Successfully deployed DocuChain to Azure Cloud Platform with PostgreSQL database and enhanced scalability.",
      icon: <Cloud className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-12-15",
      title: "Performance Optimization Complete",
      description: "Achieved 50x performance improvement with database indexing, query optimization, and caching strategies.",
      icon: <TrendingUp className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-12-10",
      title: "Blockchain Integration Enhanced",
      description: "Integrated smart contracts for document verification with Ethereum Sepolia testnet for tamper-proof records.",
      icon: <Shield className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-12-05",
      title: "Multi-Signature Approval System",
      description: "Launched advanced approval workflows supporting sequential and parallel approval chains with digital signatures.",
      icon: <FileCheck className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-11-28",
      title: "IPFS Storage Integration",
      description: "Implemented decentralized file storage using IPFS for secure, distributed document management.",
      icon: <Database className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-11-20",
      title: "Real-Time Chat System",
      description: "Added WebSocket-powered real-time chat with document sharing capabilities for seamless collaboration.",
      icon: <Users className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-11-15",
      title: "Email Notification System",
      description: "Integrated automated email notifications for approvals, shares, and important document activities.",
      icon: <Zap className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-11-10",
      title: "Advanced File Manager",
      description: "Built comprehensive file management system with folder organization, drag-and-drop, and batch operations.",
      icon: <Layers className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-11-01",
      title: "QR Code Verification",
      description: "Implemented QR code-based document verification for instant authenticity checks.",
      icon: <Lock className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-10-25",
      title: "Role-Based Access Control",
      description: "Designed three-tier permission system: Students, Faculty, and Administrators with granular access controls.",
      icon: <Settings className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-10-15",
      title: "Production Scaling Guide",
      description: "Published comprehensive guide for scaling from 50 to 1000+ concurrent users.",
      icon: <Globe className="h-3 w-3" />,
      href: "#",
    },
    {
      date: "2025-10-01",
      title: "DocuChain Project Launch",
      description: "Initiated development of blockchain-powered document management system for educational institutions.",
      icon: <Rocket className="h-3 w-3" />,
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 mb-6">
            <Rocket className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Development{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Updates
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Follow our journey building the future of secure document management
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Timeline
            items={blogPosts}
            initialCount={6}
            showMoreText="Load More Updates"
            showLessText="Show Less"
            dotClassName="bg-gradient-to-b from-blue-500 to-purple-600 ring-1 ring-blue-500/50"
            lineClassName="border-l border-gray-700"
          />
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Key Milestones
            </h2>
            <p className="text-gray-400 text-lg">
              Major achievements in our development journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: 'Blockchain Security', 
                description: 'Immutable document records on Ethereum blockchain',
                stat: '100%'
              },
              { 
                icon: <TrendingUp className="w-8 h-8" />, 
                title: 'Performance', 
                description: 'Optimized for 1000+ concurrent users',
                stat: '50x'
              },
              { 
                icon: <Cloud className="w-8 h-8" />, 
                title: 'Cloud Infrastructure', 
                description: 'Enterprise-grade Azure deployment',
                stat: '99.9%'
              }
            ].map((milestone, idx) => (
              <div key={idx} className="relative rounded-xl border border-gray-800 bg-black/50 backdrop-blur-sm p-8 hover:border-blue-500/50 transition">
                <div className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-4">
                  {milestone.icon}
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-2">{milestone.stat}</div>
                <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                <p className="text-sm text-gray-400">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
