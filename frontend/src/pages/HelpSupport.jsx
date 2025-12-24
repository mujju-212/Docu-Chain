import React, { useState } from 'react';
import { Header } from '../components/ui/header-2';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Footer } from '../components/ui/footer-section';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { 
  HelpCircle,
  Mail,
  Code,
  Clock,
  Github,
  Shield,
  Lightbulb,
  Info,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileText
} from 'lucide-react';

export default function HelpSupport() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });

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

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <BackgroundBeams className="opacity-40" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 mb-6">
            <HelpCircle className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Help &{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Support
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get personalized help and support for DocuChain
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <MessageSquare className="w-6 h-6" />, title: 'Browse FAQs', description: 'Find quick answers', link: '/faqs' },
              { icon: <Mail className="w-6 h-6" />, title: 'Contact Support', description: 'Get personalized help', link: '#contact' },
              { icon: <Github className="w-6 h-6" />, title: 'Report Bug', description: 'GitHub Issues', link: 'https://github.com/mujju-212/Docu-Chain/issues', external: true },
              { icon: <Shield className="w-6 h-6" />, title: 'Security Tips', description: 'Stay safe online', link: '#resources' }
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.link}
                target={link.external ? '_blank' : '_self'}
                rel="noreferrer"
                className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 group hover:scale-105 transition-transform"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-6">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 flex-shrink-0">
                    {link.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{link.title}</h3>
                    <p className="text-sm text-gray-400">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-400 text-lg">
              Can't find what you're looking for? Reach out to our support team
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <Mail className="w-6 h-6" />, title: 'Support Email', subtitle: 'General inquiries', contact: 'support@Docuchain.tech', link: 'mailto:support@Docuchain.tech' },
              { icon: <Code className="w-6 h-6" />, title: 'Developer Contact', subtitle: 'Technical issues', contact: 'mujju718263@gmail.com', link: 'mailto:mujju718263@gmail.com' },
              { icon: <Clock className="w-6 h-6" />, title: 'Response Time', subtitle: 'We typically respond within', contact: '24-48 hours', link: null }
            ].map((card, idx) => (
              <div key={idx} className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex flex-col items-center text-center overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-8">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{card.subtitle}</p>
                  {card.link ? (
                    <a href={card.link} className="text-blue-400 hover:text-blue-300 transition">{card.contact}</a>
                  ) : (
                    <span className="text-2xl font-bold text-blue-400">{card.contact}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto relative rounded-[1.5rem] border-[0.75px] border-gray-800 p-3">
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={80}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Send className="w-6 h-6 text-blue-400" />
                Send us a Message
              </h3>
              
              <form onSubmit={handleContactSubmit} className="space-y-6">
                {formStatus.message && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    formStatus.type === 'success' 
                      ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                      : 'bg-red-500/10 border border-red-500/50 text-red-400'
                  }`}>
                    {formStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{formStatus.message}</span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="What is this about?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    rows={6}
                    placeholder="Describe your issue or question in detail..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30 relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Additional Resources
            </h2>
            <p className="text-gray-400 text-lg">
              Helpful guides and documentation to get you started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <BookOpen className="w-8 h-8" />, title: 'Documentation', description: 'Complete guides and API references', link: '#' },
              { icon: <FileText className="w-8 h-8" />, title: 'Getting Started', description: 'Step-by-step tutorials for beginners', link: '#' },
              { icon: <Lightbulb className="w-8 h-8" />, title: 'Best Practices', description: 'Tips for secure document management', link: '#' }
            ].map((resource, idx) => (
              <a
                key={idx}
                href={resource.link}
                className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 group hover:scale-105 transition-transform"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex flex-col items-center text-center overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-8">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-4">
                    {resource.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-400">{resource.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
