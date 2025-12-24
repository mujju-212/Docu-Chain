import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Home, Layers, CheckCircle, Info, BookOpen, Newspaper } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useScroll } from '../../hooks/use-scroll';
import { MinimalDock } from './minimal-dock';
import { GlowButton } from './shiny-button';

export function HeaderDesktop() {
  const scrolled = useScroll(10);
  const navigate = useNavigate();

  const dockItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/',
    },
    {
      id: 'features',
      label: 'Features',
      icon: <Layers size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/features',
    },
    {
      id: 'howtouse',
      label: 'How to Use',
      icon: <BookOpen size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/how-to-use',
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: <Newspaper size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/blog',
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: <CheckCircle size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/verify',
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info size={22} className="text-white stroke-white" strokeWidth={2.2} />,
      href: '/about',
    },
  ].map(item => ({
    ...item,
    onClick: () => window.location.href = item.href
  }));

  return (
    <>
      {/* Glow Buttons - Fixed Position */}
      <div className="flex fixed top-6 right-8 z-[100] items-center gap-3">
        <GlowButton
          variant="blue"
          onClick={() => navigate('/login')}
        >
          Sign In
        </GlowButton>
        <GlowButton
          variant="purple"
          onClick={() => navigate('/register')}
        >
          Get Started
        </GlowButton>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 mx-auto w-full bg-black/80 backdrop-blur-sm border border-white/10 max-w-5xl rounded-md transition-all ease-out',
          {
            'bg-black/95 supports-[backdrop-filter]:bg-black/50 backdrop-blur-lg top-4 shadow-lg shadow-blue-500/10 border-white/20':
              scrolled,
          }
        )}
      >
        <nav
          className={cn(
            'flex h-16 w-full items-center justify-between gap-4 transition-all ease-out',
            {
              'px-2': scrolled,
              'px-4': !scrolled,
            }
          )}
        >
          {/* DocuChain Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-bold text-white">DocuChain</span>
          </Link>

          {/* Desktop Navigation with Minimal Dock */}
          <MinimalDock items={dockItems} />
        </nav>
      </header>
    </>
  );
}