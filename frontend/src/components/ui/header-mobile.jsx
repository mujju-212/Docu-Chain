import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Home, Layers, CheckCircle, Info, BookOpen, Newspaper, Menu, X } from 'lucide-react';
import { Button, buttonVariants } from './button';
import { GlowButton } from './shiny-button';

export function HeaderMobile({ open, setOpen }) {
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} className="text-white/70" />,
      href: '/',
    },
    {
      id: 'features',
      label: 'Features',
      icon: <Layers size={20} className="text-white/70" />,
      href: '/features',
    },
    {
      id: 'howtouse',
      label: 'How to Use',
      icon: <BookOpen size={20} className="text-white/70" />,
      href: '/how-to-use',
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: <Newspaper size={20} className="text-white/70" />,
      href: '/blog',
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: <CheckCircle size={20} className="text-white/70" />,
      href: '/verify',
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info size={20} className="text-white/70" />,
      href: '/about',
    },
  ];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  const toggleMenu = () => {
    console.log('Toggle menu clicked, current state:', open);
    setOpen(prev => {
      console.log('Setting open from', prev, 'to', !prev);
      return !prev;
    });
  };

  const closeMenu = () => {
    console.log('Closing menu');
    setOpen(false);
  };

  return (
    <>
      {/* Glow Buttons - Fixed Position below header */}
      <div className="flex fixed top-20 right-2 z-[9998] items-center gap-2 scale-[0.65] origin-right">
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

      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-white/10">
        <nav className="flex h-16 w-full items-center justify-between gap-4 px-4">
          {/* DocuChain Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-bold text-white">DocuChain</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={toggleMenu}
            className="flex-shrink-0 p-2 rounded-md bg-white/20 border-2 border-white/50 hover:bg-white/30 hover:border-white/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black shadow-lg"
            aria-label="Toggle mobile menu"
            aria-expanded={open}
          >
            {open ? (
              <X className="size-6 text-white drop-shadow-lg" strokeWidth={2.5} />
            ) : (
              <Menu className="size-6 text-white drop-shadow-lg" strokeWidth={2.5} />
            )}
          </button>
        </nav>
      </header>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeMenu}
          />
          
          {/* Sidebar */}
          <div className="absolute top-16 right-0 bottom-0 left-0 bg-gradient-to-b from-gray-900 to-black border-t border-white/20 animate-in slide-in-from-right duration-300">
            <div className="flex h-full w-full flex-col overflow-y-auto">
              {/* Close button at top of sidebar */}
              <div className="flex justify-end p-4 border-b border-white/10">
                <button
                  type="button"
                  onClick={closeMenu}
                  className="p-2 rounded-full bg-white/20 border-2 border-white/50 hover:bg-white/30 hover:border-white/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
                  aria-label="Close mobile menu"
                >
                  <X className="size-5 text-white drop-shadow-lg" strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="flex-1 px-6 py-6 space-y-6">
                {/* Auth Buttons at Top */}
                <div className="flex gap-3 pb-4 border-b border-white/20">
                  <GlowButton 
                    variant="blue" 
                    className="flex-1 text-sm"
                    onClick={() => { 
                      navigate('/login'); 
                      closeMenu(); 
                    }}
                  >
                    Sign In
                  </GlowButton>
                  <GlowButton 
                    variant="purple" 
                    className="flex-1 text-sm"
                    onClick={() => { 
                      navigate('/register'); 
                      closeMenu(); 
                    }}
                  >
                    Get Started
                  </GlowButton>
                </div>
                
                {/* Navigation Links with Icons */}
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-white hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    >
                      <span className="group-hover:text-blue-400 transition-colors">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}