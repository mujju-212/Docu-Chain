import { Shield, FileCheck, Lock, UserCheck, Clock, Workflow } from "lucide-react";
import RadialOrbitalTimeline from "../ui/radial-orbital-timeline";

// DocuChain Feature Timeline Data
const docuChainTimelineData = [
  {
    id: 1,
    title: "Document Upload",
    date: "Step 1",
    content: "Securely upload documents to IPFS with blockchain-backed immutability. Each document receives a unique hash stored on the Ethereum network.",
    category: "Upload",
    icon: FileCheck,
    relatedIds: [2, 6],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    title: "Blockchain Storage",
    date: "Step 2",
    content: "Document metadata and hash permanently stored on Ethereum blockchain, ensuring tamper-proof records that cannot be altered or deleted.",
    category: "Storage",
    icon: Lock,
    relatedIds: [1, 3],
    status: "completed",
    energy: 95,
  },
  {
    id: 3,
    title: "Multi-Level Approval",
    date: "Step 3",
    content: "Intelligent approval workflow with role-based permissions. Supports sequential and parallel approval chains with automated notifications.",
    category: "Approval",
    icon: UserCheck,
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 75,
  },
  {
    id: 4,
    title: "Smart Contract Execution",
    date: "Step 4",
    content: "Automated smart contract triggers based on approval status. Execute predefined actions when conditions are met without manual intervention.",
    category: "Automation",
    icon: Workflow,
    relatedIds: [3, 5],
    status: "in-progress",
    energy: 60,
  },
  {
    id: 5,
    title: "Instant Verification",
    date: "Step 5",
    content: "Real-time document verification via QR codes or unique IDs. Anyone can verify document authenticity instantly through the blockchain.",
    category: "Verification",
    icon: Shield,
    relatedIds: [4, 6],
    status: "pending",
    energy: 40,
  },
  {
    id: 6,
    title: "Audit Trail",
    date: "Step 6",
    content: "Complete immutable audit trail of all document activities. Track every view, approval, and modification with timestamp and user details.",
    category: "Tracking",
    icon: Clock,
    relatedIds: [5, 1],
    status: "pending",
    energy: 30,
  },
];

export default function RadialOrbitalTimelineDemo() {
  return <RadialOrbitalTimeline timelineData={docuChainTimelineData} />;
}
