import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './VerifyDocument.css';

const API_URL = 'http://localhost:5000/api';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function VerifyDocument() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const [verificationCode, setVerificationCode] = useState(code || searchParams.get('code') || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto-verify if code is provided in URL
  useEffect(() => {
    if (code || searchParams.get('code')) {
      const codeToVerify = code || searchParams.get('code');
      setVerificationCode(codeToVerify);
      handleVerify(codeToVerify);
    }
  }, [code, searchParams]);

  const handleVerify = async (codeToVerify = verificationCode) => {
    if (!codeToVerify || !codeToVerify.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await fetch(`${API_URL}/approvals/verify/${codeToVerify.trim()}`);
      const data = await response.json();

      if (data.success) {
        setVerificationResult(data.data);
      } else {
        setError(data.message || data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Unable to connect to verification server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // QR Code Scanner functionality
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScannerActive(true);
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please enter the code manually.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScannerActive(false);
  };

  const scanQRCode = () => {
    if (!scannerActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR detection - in production, use a library like jsQR
      // For now, we'll rely on manual entry or URL with code parameter
    }

    if (scannerActive) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const openDocument = (ipfsHash) => {
    if (ipfsHash) {
      window.open(`${PINATA_GATEWAY}${ipfsHash}`, '_blank');
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1>DocuChain Verification</h1>
          </div>
          <p className="verify-subtitle">
            Verify the authenticity of blockchain-certified documents
          </p>
        </div>

        <div className="verify-input-section">
          <div className="input-group">
            <label>Verification Code</label>
            <div className="input-with-button">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="DCH-2025-XXXXXX"
                className="code-input"
                disabled={loading}
              />
              <button 
                className="verify-btn"
                onClick={() => handleVerify()}
                disabled={loading || !verificationCode.trim()}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>

          <div className="scanner-section">
            <button 
              className={`scanner-btn ${scannerActive ? 'active' : ''}`}
              onClick={scannerActive ? stopScanner : startScanner}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {scannerActive ? 'Stop Scanner' : 'Scan QR Code'}
            </button>
            
            {scannerActive && (
              <div className="scanner-view">
                <video ref={videoRef} className="scanner-video" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scanner-overlay">
                  <div className="scanner-frame"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {verificationResult && (
          <div className={`verification-result ${verificationResult.verified ? 'verified' : 'not-verified'}`}>
            <div className="result-header">
              <div className={`status-badge ${verificationResult.verified ? 'verified' : 'not-verified'}`}>
                {verificationResult.verified ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>VERIFIED</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{verificationResult.approval?.status || 'NOT VERIFIED'}</span>
                  </>
                )}
              </div>
              <span className="verification-code">{verificationResult.verification_code}</span>
            </div>

            <div className="result-sections">
              {/* Document Information */}
              <div className="result-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Document Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Document Name</label>
                    <span>{verificationResult.document?.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>File Type</label>
                    <span>{verificationResult.document?.file_type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>File Size</label>
                    <span>{formatFileSize(verificationResult.document?.file_size)}</span>
                  </div>
                  <div className="info-item">
                    <label>Purpose</label>
                    <span>{verificationResult.approval?.purpose || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="document-actions">
                  {verificationResult.document?.stamped_ipfs_hash && (
                    <button 
                      className="doc-btn stamped"
                      onClick={() => openDocument(verificationResult.document.stamped_ipfs_hash)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      Download Certified Document
                    </button>
                  )}
                  <button 
                    className="doc-btn original"
                    onClick={() => openDocument(verificationResult.document?.ipfs_hash)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Original
                  </button>
                </div>
              </div>

              {/* Approval Information */}
              <div className="result-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Approval Details
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Status</label>
                    <span className={`status ${verificationResult.approval?.status?.toLowerCase()}`}>
                      {verificationResult.approval?.status || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Approval Type</label>
                    <span>{verificationResult.approval?.approval_type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Process Type</label>
                    <span>{verificationResult.approval?.process_type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Submitted</label>
                    <span>{formatDate(verificationResult.approval?.submitted_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Completed</label>
                    <span>{formatDate(verificationResult.approval?.completed_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Certified</label>
                    <span>{formatDate(verificationResult.approval?.stamped_at)}</span>
                  </div>
                </div>
              </div>

              {/* Requester Information */}
              <div className="result-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Requester Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <span>{verificationResult.requester?.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{verificationResult.requester?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Institution</label>
                    <span>{verificationResult.requester?.institution || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Approvers */}
              <div className="result-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Approvers
                </h3>
                <div className="approvers-list">
                  {verificationResult.approvers?.map((approver, index) => (
                    <div key={index} className={`approver-item ${approver.has_approved ? 'approved' : approver.has_rejected ? 'rejected' : 'pending'}`}>
                      <div className="approver-info">
                        <span className="approver-name">{approver.name}</span>
                        <span className="approver-role">{approver.role}</span>
                      </div>
                      <div className="approver-status">
                        {approver.has_approved && (
                          <span className="approved-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                            Approved
                          </span>
                        )}
                        {approver.has_rejected && (
                          <span className="rejected-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rejected
                          </span>
                        )}
                        {!approver.has_approved && !approver.has_rejected && (
                          <span className="pending-badge">Pending</span>
                        )}
                      </div>
                      {approver.action_timestamp && (
                        <div className="approver-timestamp">
                          {formatDate(approver.action_timestamp)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockchain Information */}
              <div className="result-section blockchain">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Blockchain Verification
                </h3>
                <div className="blockchain-info">
                  <div className="info-item full-width">
                    <label>Request ID</label>
                    <code>{verificationResult.blockchain?.request_id || 'N/A'}</code>
                  </div>
                  <div className="info-item full-width">
                    <label>Transaction Hash</label>
                    <div className="tx-hash">
                      <code>{verificationResult.blockchain?.tx_hash || 'N/A'}</code>
                      {verificationResult.blockchain?.tx_hash && (
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${verificationResult.blockchain.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="etherscan-link"
                        >
                          View on Etherscan
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="info-item full-width">
                    <label>Document IPFS Hash</label>
                    <code>{verificationResult.document?.ipfs_hash || 'N/A'}</code>
                  </div>
                  {verificationResult.document?.stamped_ipfs_hash && (
                    <div className="info-item full-width">
                      <label>Certified Document IPFS Hash</label>
                      <code>{verificationResult.document.stamped_ipfs_hash}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="verify-footer">
          <p>
            DocuChain uses blockchain technology to ensure document authenticity and integrity.
            Each approved document receives a unique verification code that can be used to verify its authenticity.
          </p>
          <div className="footer-links">
            <a href="/">Return to DocuChain</a>
          </div>
        </div>
      </div>
    </div>
  );
}
