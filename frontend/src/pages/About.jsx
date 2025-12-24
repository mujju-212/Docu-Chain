import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Mail, ChevronDown, Code, Database, Palette, TestTube, Shield, Blocks, Users, Target, Eye } from 'lucide-react';
import { Header } from '../components/ui/header-2';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Footer } from '../components/ui/footer-section';
import { GlowingEffect } from '../components/ui/glowing-effect';

const About = () => {
  const [expandedCard, setExpandedCard] = useState(null);

  const teamMembers = [
    {
      id: 1,
      name: 'Mujutaba M N',
      role: 'Team Lead',
      specialization: 'Backend & Blockchain',
      avatar: 'MM',
      gradient: 'from-blue-500 to-purple-600',
      social: {
        linkedin: 'https://www.linkedin.com/in/mujutaba-m-n-0ab114302',
        github: 'https://github.com/mujju-212',
        email: 'mujju718263@gmail.com'
      },
      contributions: [
        'Led the project architecture and team coordination',
        'Designed and implemented smart contracts for document management',
        'Built the blockchain integration layer with Hardhat and Ethereum',
        'Developed RESTful APIs for backend services',
        'Implemented secure authentication and authorization systems',
        'Set up database schemas and relationships'
      ],
      technologies: ['Python', 'Flask', 'Solidity', 'Hardhat', 'PostgreSQL', 'Web3.js'],
      icon: Shield
    },
    {
      id: 2,
      name: 'Nandeesh B M',
      role: 'Frontend Developer',
      specialization: 'Frontend & UI/UX',
      avatar: 'NB',
      gradient: 'from-cyan-500 to-blue-600',
      social: {
        linkedin: null, // placeholder
        github: null, // placeholder
        email: null // placeholder
      },
      contributions: [
        'Created responsive and interactive user interfaces',
        'Designed modern UI components with React',
        'Implemented smooth animations using Framer Motion',
        'Developed reusable component library',
        'Built landing page and feature showcases',
        'Ensured cross-browser compatibility and responsiveness'
      ],
      technologies: ['React', 'JavaScript', 'TailwindCSS', 'Framer Motion', 'HTML5', 'CSS3'],
      icon: Code
    },
    {
      id: 3,
      name: 'S Ashlesh Ganigera',
      role: 'Full Stack Developer',
      specialization: 'Database & Frontend',
      avatar: 'AG',
      gradient: 'from-green-500 to-emerald-600',
      social: {
        linkedin: 'https://www.linkedin.com/in/s-ashlesh-ganigera-8850673a2',
        github: null, // placeholder
        email: null // placeholder
      },
      contributions: [
        'Designed efficient database schemas and optimizations',
        'Implemented data migration and backup strategies',
        'Built frontend components for data visualization',
        'Created complex SQL queries and stored procedures',
        'Integrated database with blockchain records',
        'Developed admin dashboard interfaces'
      ],
      technologies: ['PostgreSQL', 'SQL', 'React', 'Python', 'Database Design', 'Data Modeling'],
      icon: Database
    },
    {
      id: 4,
      name: 'Syed Hamza',
      role: 'QA Engineer',
      specialization: 'UI/UX & Testing',
      avatar: 'SH',
      gradient: 'from-purple-500 to-pink-600',
      social: {
        linkedin: null, // placeholder
        github: null, // placeholder
        email: null // placeholder
      },
      contributions: [
        'Conducted comprehensive testing across all modules',
        'Designed user experience flows and wireframes',
        'Performed UI/UX audits and improvements',
        'Created test cases and documented bugs',
        'Ensured application accessibility and usability',
        'Validated blockchain transaction integrity'
      ],
      technologies: ['Manual Testing', 'UI/UX Design', 'Figma', 'User Testing', 'QA Processes'],
      icon: TestTube
    }
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 mb-6">
            <Users className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              DocuChain
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Building the future of secure document management with blockchain technology
          </p>
        </motion.div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <GlowingEffect
                blur={20}
                proximity={100}
                spread={60}
                disabled={false}
                borderWidth={2}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <div className="relative bg-black/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Our Mission</h2>
                <p className="text-gray-400 leading-relaxed">
                  To revolutionize document management in educational institutions by leveraging blockchain technology, 
                  ensuring every document is secure, verifiable, and tamper-proof. We strive to eliminate paperwork chaos 
                  and bring transparency to approval workflows.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative group"
            >
              <GlowingEffect
                blur={20}
                proximity={100}
                spread={60}
                disabled={false}
                borderWidth={2}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <div className="relative bg-black/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Our Vision</h2>
                <p className="text-gray-400 leading-relaxed">
                  To become the leading blockchain-based document management solution for educational institutions worldwide, 
                  setting new standards for security, efficiency, and trust in academic document handling and verification.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Meet Our{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Team
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              The brilliant minds behind DocuChain
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => {
              const Icon = member.icon;
              const isExpanded = expandedCard === member.id;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  <GlowingEffect
                    blur={20}
                    proximity={100}
                    spread={60}
                    disabled={false}
                    borderWidth={2}
                    className="absolute inset-0 z-0 rounded-2xl"
                  />
                  <motion.div
                    layout
                    onClick={() => toggleCard(member.id)}
                    className={`
                      relative bg-black/40 backdrop-blur-sm border border-gray-800 
                      rounded-2xl p-6 cursor-pointer hover:border-gray-700 
                      transition-all duration-300 z-10
                      ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : ''}
                    `}
                  >
                    {/* Card Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-sm text-gray-400 mb-1">{member.role}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">{member.specialization}</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3 mb-4">
                      {member.social.linkedin ? (
                        <a
                          href={member.social.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
                        >
                          <Linkedin className="w-5 h-5 text-blue-400" />
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700/30 border border-gray-600/30 flex items-center justify-center opacity-40 cursor-not-allowed">
                          <Linkedin className="w-5 h-5 text-gray-500" />
                        </div>
                      )}

                      {member.social.github ? (
                        <a
                          href={member.social.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                        >
                          <Github className="w-5 h-5 text-purple-400" />
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700/30 border border-gray-600/30 flex items-center justify-center opacity-40 cursor-not-allowed">
                          <Github className="w-5 h-5 text-gray-500" />
                        </div>
                      )}

                      {member.social.email ? (
                        <a
                          href={`mailto:${member.social.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500/50 transition-all"
                        >
                          <Mail className="w-5 h-5 text-pink-400" />
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700/30 border border-gray-600/30 flex items-center justify-center opacity-40 cursor-not-allowed">
                          <Mail className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-700/50 pt-4 mt-4"
                        >
                          {/* Contributions */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">
                              Key Contributions
                            </h4>
                            <ul className="space-y-2">
                              {member.contributions.map((contribution, idx) => (
                                <motion.li
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-start gap-2 text-sm text-gray-300"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                  <span>{contribution}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* Technologies */}
                          <div>
                            <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider">
                              Technologies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {member.technologies.map((tech, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="px-3 py-1 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-gray-600/50 rounded-full text-xs text-gray-300 font-medium"
                                >
                                  {tech}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      
      <Footer />
    </div>
  );
};

export default About;
