import { Shield, FileCheck, UserCheck, Lock, Sparkles, Clock, Orbit } from "lucide-react";
import { Link } from "react-router-dom";
import { GlowingEffect } from "../ui/glowing-effect";
import { RippleButton } from "../ui/ripple-button";
import { cn } from "../../lib/utils";

export function GlowingCards() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Blockchain-Powered Features
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
          Experience the next generation of document management with cutting-edge technology
        </p>
        
        {/* Interactive Timeline Button */}
        <Link to="/features">
          <RippleButton
            variant="hover"
            hoverRippleColor="#60a5fa"
            className="text-white bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm hover:bg-blue-600/30 transition-all"
          >
            <Orbit className="w-4 h-4 mr-2 inline-block" />
            Explore Interactive Feature Timeline
          </RippleButton>
        </Link>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GridItem
          icon={<Shield className="h-4 w-4" />}
          title="Immutable Security"
          description="Every document is cryptographically secured on the blockchain, ensuring tamper-proof records that can never be altered or forged."
        />
        <GridItem
          icon={<Lock className="h-4 w-4" />}
          title="Smart Contract Automation"
          description="Automated approval workflows powered by Ethereum smart contracts ensure transparency and eliminate manual processing delays."
        />
        <GridItem
          icon={<Sparkles className="h-4 w-4" />}
          title="Multi-Level Approval"
          description="Flexible approval hierarchies support faculty, department heads, and registrar workflows with full audit trails."
        />
        <GridItem
          icon={<FileCheck className="h-4 w-4" />}
          title="Instant Verification"
          description="Verify any document's authenticity in seconds. QR codes and blockchain hashes provide instant validation for employers and institutions."
        />
        <GridItem
          icon={<Clock className="h-4 w-4" />}
          title="Real-Time Updates"
          description="Track document status instantly with live notifications and real-time blockchain confirmations."
        />
        <GridItem
          icon={<UserCheck className="h-4 w-4" />}
          title="Role-Based Access"
          description="Granular permissions ensure students, faculty, and admins see only what they need with military-grade security."
        />
      </ul>
    </div>
  );
}

const GridItem = ({ icon, title, description }) => {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/50 backdrop-blur-sm p-6 shadow-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-blue-500/30 bg-blue-500/10 p-3">
              <div className="text-blue-400">
                {icon}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
