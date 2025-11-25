-- Approval System Tables for Blockchain Integration
-- Compatible with DocumentApprovalManager Smart Contract
-- Contract Address: 0x8E1626654e1B04ADF941EbbcEc7E92728327aA54

-- Connect to database
\c "Docu-Chain";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS approved_documents CASCADE;
DROP TABLE IF EXISTS approval_steps CASCADE;
DROP TABLE IF EXISTS approval_requests CASCADE;

-- 1. Approval Requests Table
-- Stores all approval requests created through the smart contract
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Blockchain data
    request_id VARCHAR(66) UNIQUE NOT NULL, -- bytes32 from contract (0x + 64 hex chars)
    document_id VARCHAR(66) NOT NULL, -- bytes32 from contract
    blockchain_tx_hash VARCHAR(66), -- Transaction hash
    
    -- Document information
    document_name VARCHAR(255) NOT NULL,
    document_ipfs_hash VARCHAR(255) NOT NULL,
    document_file_size BIGINT,
    document_file_type VARCHAR(50),
    
    -- Request details
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requester_wallet VARCHAR(42) NOT NULL,
    purpose TEXT,
    version VARCHAR(20) DEFAULT 'v1.0',
    
    -- Approval configuration
    process_type VARCHAR(20) NOT NULL CHECK (process_type IN ('SEQUENTIAL', 'PARALLEL')),
    approval_type VARCHAR(20) NOT NULL CHECK (approval_type IN ('STANDARD', 'DIGITAL_SIGNATURE')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('DRAFT', 'PENDING', 'PARTIAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    expiry_timestamp BIGINT, -- Unix timestamp from contract (0 = no expiry)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    request_metadata JSONB, -- Store any additional data
    
    -- Institution reference (optional)
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    
    CONSTRAINT check_expiry CHECK (expiry_timestamp IS NULL OR expiry_timestamp > 0)
);

-- 2. Approval Steps Table
-- Stores individual approvers and their actions
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to approval request
    request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
    blockchain_request_id VARCHAR(66) NOT NULL, -- For easy blockchain lookup
    
    -- Approver information
    approver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    approver_wallet VARCHAR(42) NOT NULL,
    approver_role VARCHAR(100), -- e.g., "HOD", "Principal", "Dean"
    step_order INTEGER NOT NULL, -- For sequential: 1,2,3... For parallel: all same
    
    -- Approval status
    has_approved BOOLEAN DEFAULT FALSE,
    has_rejected BOOLEAN DEFAULT FALSE,
    action_timestamp BIGINT, -- Unix timestamp from blockchain
    
    -- Digital signature (optional)
    signature_hash VARCHAR(66), -- bytes32 from contract
    
    -- Reason/comment
    reason TEXT,
    
    -- Blockchain transaction
    blockchain_tx_hash VARCHAR(66),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_approval_status CHECK (NOT (has_approved AND has_rejected))
);

-- 3. Approved Documents Table
-- Stores final approved documents with QR codes and stamps
CREATE TABLE approved_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to approval request
    request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
    blockchain_request_id VARCHAR(66) UNIQUE NOT NULL,
    
    -- Document references
    original_document_id VARCHAR(66) NOT NULL, -- Original document bytes32
    approved_document_id VARCHAR(66) UNIQUE NOT NULL, -- New document bytes32 after approval
    
    -- IPFS and verification
    original_ipfs_hash VARCHAR(255) NOT NULL,
    approved_ipfs_hash VARCHAR(255) NOT NULL, -- PDF with stamps and signatures
    document_hash VARCHAR(66) NOT NULL, -- SHA256 hash (bytes32)
    
    -- QR Code data
    qr_code_data TEXT NOT NULL, -- JSON string with verification info
    qr_code_image_url TEXT, -- URL to generated QR code image
    
    -- Approval details
    approval_timestamp BIGINT NOT NULL, -- Unix timestamp from blockchain
    is_valid BOOLEAN DEFAULT TRUE,
    
    -- Blockchain transaction
    blockchain_tx_hash VARCHAR(66),
    
    -- Public verification
    public_verification_url TEXT, -- URL to public verification page
    verification_code VARCHAR(20) UNIQUE, -- Short code for easy verification
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    document_metadata JSONB -- Store approval stamps, signatures, etc.
);

-- 4. Approval History Table (for audit trail)
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to approval request
    request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'COMPLETED'
    event_description TEXT,
    
    -- Actor information
    actor_id UUID REFERENCES users(id),
    actor_wallet VARCHAR(42),
    actor_role VARCHAR(100),
    
    -- Status change
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Blockchain data
    blockchain_tx_hash VARCHAR(66),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    history_metadata JSONB
);

-- Create Indexes for Performance
CREATE INDEX idx_approval_requests_requester ON approval_requests(requester_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_blockchain_id ON approval_requests(request_id);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at DESC);
CREATE INDEX idx_approval_requests_institution ON approval_requests(institution_id);

CREATE INDEX idx_approval_steps_request ON approval_steps(request_id);
CREATE INDEX idx_approval_steps_approver ON approval_steps(approver_id);
CREATE INDEX idx_approval_steps_blockchain_request ON approval_steps(blockchain_request_id);
CREATE INDEX idx_approval_steps_status ON approval_steps(has_approved, has_rejected);

CREATE INDEX idx_approved_documents_request ON approved_documents(request_id);
CREATE INDEX idx_approved_documents_blockchain_request ON approved_documents(blockchain_request_id);
CREATE INDEX idx_approved_documents_verification ON approved_documents(verification_code);
CREATE INDEX idx_approved_documents_approved_id ON approved_documents(approved_document_id);

CREATE INDEX idx_approval_history_request ON approval_history(request_id);
CREATE INDEX idx_approval_history_actor ON approval_history(actor_id);
CREATE INDEX idx_approval_history_created_at ON approval_history(created_at DESC);

-- Create Triggers for Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_approval_requests_updated_at 
    BEFORE UPDATE ON approval_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_steps_updated_at 
    BEFORE UPDATE ON approval_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approved_documents_updated_at 
    BEFORE UPDATE ON approved_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Comments for Documentation
COMMENT ON TABLE approval_requests IS 'Stores document approval requests created through DocumentApprovalManager smart contract';
COMMENT ON TABLE approval_steps IS 'Stores individual approver steps and their actions for each approval request';
COMMENT ON TABLE approved_documents IS 'Stores final approved documents with QR codes, stamps, and verification details';
COMMENT ON TABLE approval_history IS 'Audit trail of all events in the approval lifecycle';

COMMENT ON COLUMN approval_requests.request_id IS 'Unique bytes32 identifier from smart contract';
COMMENT ON COLUMN approval_requests.process_type IS 'SEQUENTIAL (approve in order) or PARALLEL (any order)';
COMMENT ON COLUMN approval_requests.approval_type IS 'STANDARD (simple approval) or DIGITAL_SIGNATURE (cryptographic signature)';
COMMENT ON COLUMN approval_requests.priority IS 'Priority level: LOW, NORMAL, HIGH, URGENT';

COMMENT ON COLUMN approval_steps.step_order IS 'For sequential: 1,2,3... For parallel: all same (typically 1)';
COMMENT ON COLUMN approval_steps.signature_hash IS 'Optional cryptographic signature hash (bytes32) for digital signatures';

COMMENT ON COLUMN approved_documents.qr_code_data IS 'JSON string containing verification data embedded in QR code';
COMMENT ON COLUMN approved_documents.verification_code IS 'Short alphanumeric code for easy manual verification';

-- Success message
\echo '✅ Approval system tables created successfully!'
\echo '📋 Tables created: approval_requests, approval_steps, approved_documents, approval_history'
\echo '🔗 Contract Address: 0x8E1626654e1B04ADF941EbbcEc7E92728327aA54'
