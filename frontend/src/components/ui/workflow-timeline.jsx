import React from "react";
import { cn } from "../../lib/utils";
import {
  LogIn,
  FolderPlus,
  Settings,
  Share2,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

export function WorkflowTimeline() {
  const steps = [
    {
      icon: LogIn,
      title: "Login",
      description: "Securely access DocuChain",
    },
    {
      icon: FolderPlus,
      title: "Create",
      description: "Upload and organize your documents",
    },
    {
      icon: Settings,
      title: "Manage",
      description: "Track, edit, and control access",
    },
    {
      icon: Share2,
      title: "Share",
      description: "Easily share and collaborate securely",
    },
    {
      icon: MessageSquare,
      title: "Chat",
      description: "Communicate in real-time",
    },
    {
      icon: CheckCircle,
      title: "Approve",
      description: "Review and approve with confidence",
    },
  ];

  return (
    <div className="relative w-full py-16 overflow-hidden">
      {/* Diagonal glowing line */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: "translateZ(0)" }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line
          x1="5%"
          y1="90%"
          x2="95%"
          y2="10%"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          filter="url(#glow)"
          strokeLinecap="round"
        />
      </svg>

      {/* Glowing particles along the line */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${5 + (90 / 5) * i}%`,
              top: `${90 - (80 / 5) * i}%`,
              boxShadow: "0 0 20px rgba(6, 182, 212, 0.8)",
              animationDelay: `${i * 0.3}s`,
              animationDuration: "2s",
            }}
          />
        ))}
      </div>

      {/* Steps positioned along the diagonal */}
      <div className="relative max-w-7xl mx-auto px-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const leftPosition = 5 + (90 / (steps.length - 1)) * index;
          const topPosition = 90 - (80 / (steps.length - 1)) * index;

          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${leftPosition}%`,
                top: `${topPosition}%`,
              }}
            >
              {/* Icon circle */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/50",
                      "flex items-center justify-center",
                      "group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/50",
                      "transition-all duration-300 group-hover:scale-110",
                      "backdrop-blur-sm"
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {/* Pulse ring on hover */}
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
                </div>

                {/* Text content */}
                <div className="text-center min-w-[120px]">
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
