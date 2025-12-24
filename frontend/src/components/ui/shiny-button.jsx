import React, { useId } from 'react';

const GlowButton = ({ 
  children = 'Button', 
  onClick,
  variant = 'blue', // 'blue' or 'purple'
  className = ''
}) => {
  const id = useId().replace(/:/g, '');
  const filters = {
    unopaq: `unopaq-${id}`,
    unopaq2: `unopaq2-${id}`,
    unopaq3: `unopaq3-${id}`,
  };

  // Theme colors matching DocuChain
  const gradients = {
    blue: {
      outer: 'linear-gradient(90deg, #3b82f6 30%, #0000 50%, #06b6d4 70%)',
      middle: 'linear-gradient(90deg, #60a5fa 20%, #0000 45% 55%, #22d3ee 80%)',
      inner: 'linear-gradient(90deg, #93c5fd 30%, #0000 45% 55%, #67e8f9 70%)',
    },
    purple: {
      outer: 'linear-gradient(90deg, #8b5cf6 30%, #0000 50%, #a855f7 70%)',
      middle: 'linear-gradient(90deg, #a78bfa 20%, #0000 45% 55%, #c084fc 80%)',
      inner: 'linear-gradient(90deg, #c4b5fd 30%, #0000 45% 55%, #d8b4fe 70%)',
    }
  };

  const currentGradient = gradients[variant] || gradients.blue;

  return (
    <div className={`relative group ${className}`}>
      {/* SVG Filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter width="300%" x="-100%" height="300%" y="-100%" id={filters.unopaq}>
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 9 0" />
        </filter>
        <filter width="300%" x="-100%" height="300%" y="-100%" id={filters.unopaq2}>
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 3 0" />
        </filter>
        <filter width="300%" x="-100%" height="300%" y="-100%" id={filters.unopaq3}>
          <feColorMatrix values="1 0 0 0.2 0 0 1 0 0.2 0 0 0 1 0.2 0 0 0 0 2 0" />
        </filter>
      </svg>

      {/* Button Container */}
      <button 
        onClick={onClick}
        className="relative outline-none border-none cursor-pointer z-10"
      >
        {/* Outer Glow Layer - Reduced */}
        <div 
          className="absolute inset-0 -z-20 opacity-20 overflow-hidden transition-opacity duration-300
                     group-hover:opacity-30 group-active:opacity-40"
          style={{ filter: `blur(1em) url(#${filters.unopaq})` }}
        >
          <div 
            className="absolute inset-[-150%] group-hover:animate-[spin_12s_linear_infinite]"
            style={{ background: currentGradient.outer }}
          />
        </div>

        {/* Middle Glow Layer - Reduced */}
        <div 
          className="absolute inset-[-0.125em] -z-20 opacity-25 overflow-hidden transition-opacity duration-300
                     group-hover:opacity-40 group-active:opacity-50 rounded-full"
          style={{ filter: `blur(0.15em) url(#${filters.unopaq2})` }}
        >
          <div 
            className="absolute inset-[-150%] group-hover:animate-[spin_12s_linear_infinite]"
            style={{ background: currentGradient.middle }}
          />
        </div>

        {/* Button Border */}
        <div className="p-[2px] bg-black/30 rounded-full backdrop-blur-sm">
          <div className="relative">
            {/* Inner Glow Layer - Subtle */}
            <div 
              className="absolute inset-[-1px] -z-10 opacity-30 overflow-hidden transition-opacity duration-300
                         group-hover:opacity-50 group-active:opacity-60 rounded-full"
              style={{ filter: `blur(1px) url(#${filters.unopaq3})` }}
            >
              <div 
                className="absolute inset-[-150%] group-hover:animate-[spin_12s_linear_infinite]"
                style={{ background: currentGradient.inner }}
              />
            </div>
            
            {/* Button Surface */}
            <div 
              className="flex items-center justify-center px-6 py-2.5 bg-black/60 backdrop-blur-md 
                         text-white font-semibold text-sm rounded-full overflow-hidden
                         transition-all duration-300 hover:bg-black/70 active:scale-95
                         border border-white/10"
            >
              {children}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export { GlowButton };
