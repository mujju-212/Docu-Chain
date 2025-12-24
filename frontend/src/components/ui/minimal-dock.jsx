import React, { useState } from 'react';

const DockItemComponent = ({ item, isHovered, onHover }) => {
  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Animated Gradient Border */}
      <div className={`
        absolute inset-0 rounded-lg
        bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
        opacity-0 blur-sm
        transition-opacity duration-300
        ${isHovered ? 'opacity-100 animate-gradient' : ''}
      `}
      style={{
        animationDuration: '3s',
        backgroundSize: '200% 200%'
      }}
      />
      
      <div
        className={`
          relative flex items-center justify-center
          w-11 h-11 rounded-lg
          bg-black/90 backdrop-blur-[2px]
          border transition-all duration-300 ease-out
          cursor-pointer
          ${isHovered 
            ? 'scale-110 border-white/30 -translate-y-1 shadow-lg shadow-blue-500/20' 
            : 'border-white/10 hover:scale-105 hover:border-white/20 hover:-translate-y-0.5'
          }
        `}
        onClick={item.onClick}
        style={{
          transitionProperty: 'box-shadow, transform, background, border-color'
        }}
      >
        <div className={`
          text-white transition-all duration-300
          ${isHovered ? 'scale-105 drop-shadow-[0_1px_4px_rgba(59,130,246,0.5)]' : ''}
        `}>
          {item.icon}
        </div>
      </div>
      
      {/* Tooltip */}
      <div className={`
        absolute -bottom-10 left-1/2 transform -translate-x-1/2
        px-2.5 py-1 rounded-md
        bg-black/70 backdrop-blur
        text-white text-xs font-normal
        border border-white/5
        transition-all duration-200
        pointer-events-none
        whitespace-nowrap
        ${isHovered 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-1'
        }
        shadow-sm
      `}>
        {item.label}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-black/70 -rotate-45 border-l border-t border-white/5"></div>
        </div>
      </div>
    </div>
  );
};

export const MinimalDock = ({ items }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div className="flex items-end gap-3 px-3 py-2">
      {items.map((item) => (
        <DockItemComponent
          key={item.id}
          item={item}
          isHovered={hoveredItem === item.id}
          onHover={setHoveredItem}
        />
      ))}
    </div>
  );
};
