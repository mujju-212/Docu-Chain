# About DocuChain

## 🎯 Project Overview

**DocuChain** is a blockchain-powered document management and verification system designed specifically for educational institutions. It combines the security of Ethereum blockchain with the decentralized storage capabilities of IPFS to create a tamper-proof document ecosystem.

## 🔍 The Problem We Solve

Traditional document management systems face critical challenges:

- **Forgery & Tampering** - Paper and digital documents can be easily forged
- **Verification Delays** - Manual verification takes days or weeks
- **Centralized Risk** - Single points of failure for document storage
- **Lack of Transparency** - No audit trail for document changes
- **Complex Approvals** - Paper-based approval workflows are inefficient

## 💡 Our Solution

DocuChain addresses these challenges through:

### Blockchain Verification
Every document uploaded to DocuChain has its cryptographic hash stored on the Ethereum Sepolia blockchain. This creates an immutable record proving:
- When the document was created
- That it hasn't been modified since
- Who uploaded it

### Decentralized Storage
Documents are stored on IPFS (InterPlanetary File System) via Pinata, ensuring:
- No single point of failure
- Content-addressed storage (files identified by their content hash)
- Permanent availability

### QR Code Verification
Each verified document gets a unique QR code that anyone can scan to:
- Verify authenticity instantly
- View blockchain transaction details
- Check document metadata

### Smart Contract Approvals
Multi-step approval workflows are managed by smart contracts:
- Transparent approval status
- Automated notifications
- Complete audit trail
- Cannot be bypassed or manipulated

## 🏛️ Use Cases

### For Educational Institutions
- Issue tamper-proof certificates and transcripts
- Manage faculty document workflows
- Verify student credentials instantly
- Maintain compliance records

### For Students
- Store verified academic documents
- Share credentials with employers
- Prove document authenticity
- Access documents anywhere

### For Employers & Verifiers
- Instantly verify candidate credentials
- No need to contact institutions
- Reduce hiring fraud
- Save verification time

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Material-UI, Web3.js |
| Backend | Flask 3.0, SQLAlchemy, PostgreSQL |
| Blockchain | Solidity 0.8.19, Ethereum Sepolia |
| Storage | IPFS via Pinata |
| Authentication | JWT with role-based access |

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Dashboard   │ │ File Manager│ │ Approval Workflows  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Backend (Flask API)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Auth/JWT    │ │ Doc Service │ │ Blockchain Service  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└──────────┬─────────────────┬────────────────┬───────────────┘
           │                 │                │
    ┌──────▼──────┐   ┌──────▼──────┐  ┌──────▼──────┐
    │ PostgreSQL  │   │    IPFS     │  │  Ethereum   │
    │  Database   │   │  (Pinata)   │  │  (Sepolia)  │
    └─────────────┘   └─────────────┘  └─────────────┘
```

## 👥 Team

This project was developed as part of an educational initiative to explore blockchain applications in document management.

## 📜 License

This project is open source and available under the MIT License.

## 🔗 Links

- **Repository**: [github.com/mujju-212/Docu-Chain](https://github.com/mujju-212/Docu-Chain)
- **Smart Contracts** (Sepolia):
  - DocumentManagerV2: `0xb19f78B9c32dceaA01DE778Fa46784F5437DF5437DF373`
  - DocumentApprovalManager: `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54`

---

<div align="center">
  <strong>DocuChain</strong> - Securing Documents with Blockchain Technology
</div>
