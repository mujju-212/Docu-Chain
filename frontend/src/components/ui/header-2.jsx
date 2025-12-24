import React, { useState, useEffect } from 'react';
import { HeaderDesktop } from './header-desktop';
import { HeaderMobile } from './header-mobile';

export function Header() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Use a debounced resize handler to prevent rapid re-renders
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const wasMobile = isMobile;
        const nowMobile = window.innerWidth < 768;
        
        if (wasMobile !== nowMobile) {
          setIsMobile(nowMobile);
          // Close mobile menu when switching to desktop
          if (!nowMobile) {
            setMobileMenuOpen(false);
          }
        }
      }, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [isMobile]);

  console.log('Header render - isMobile:', isMobile, 'menuOpen:', mobileMenuOpen);

  return isMobile ? (
    <HeaderMobile 
      key="mobile" 
      open={mobileMenuOpen} 
      setOpen={setMobileMenuOpen} 
    />
  ) : (
    <HeaderDesktop key="desktop" />
  );
}
