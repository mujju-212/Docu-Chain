import React from "react";
import { cn } from "../../lib/utils";
import {
  LogIn,
  FolderPlus,
  FolderOpen,
  Share2,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export function AnimatedBeamDemo() {
  const steps = [
    {
      icon: LogIn,
      title: "Login",
    },
    {
      icon: FolderPlus,
      title: "Create",
    },
    {
      icon: FolderOpen,
      title: "Manage",
    },
    {
      icon: Share2,
      title: "Share",
    },
    {
      icon: MessageSquare,
      title: "Chat",
    },
    {
      icon: CheckCircle,
      title: "Approve",
    },
  ];

  return (
    <div className="relative w-full py-8">
      {/* Desktop View - Horizontal Flow */}
      <div className="flex items-center justify-center gap-4 px-8 flex-wrap md:flex-nowrap">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center gap-3 group">
                <div
                  className={cn(
                    "relative w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl",
                    step.color,
                    step.glow
                  )}
                >
                  <Icon className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className={cn("text-sm font-semibold", step.textColor)}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-gray-600 to-gray-700" />
                  <ArrowRight className="w-5 h-5 text-gray-600 -ml-1" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Central Hub Text */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-300">
            All features integrated in one unified platform
          </span>
        </div>
      </div>
    </div>
  );
}
