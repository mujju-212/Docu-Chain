import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import './VerificationTool.css';

const API_URL = 'http://localhost:5000';

export default function VerificationTool() {
  // States
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'scan', 'browse'
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // Browse states
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [documentVersions, setDocumentVersions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // File upload states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('account'); // 'local' or 'account'
  const [scanningImage, setScanningImage] = useState(false);
  const fileInputRef = useRef(null);
  const localFileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Fetch user's approved documents
  const fetchUserDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents?all=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Get all documents - show all but highlight certified ones
        const allDocs = data.documents || [];
        setDocuments(allDocs);
      } else {
        console.error('Failed to fetch documents:', response.status);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Fetch document versions
  const fetchDocumentVersions = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/${documentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocumentVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
      setDocumentVersions([]);
    }
  };

  // Load documents when browse tab is active
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchUserDocuments();
    }
  }, [activeTab, fetchUserDocuments]);

  // Cleanup camera and scanner on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Verify by code
  const handleVerify = async (code = verificationCode) => {
    if (!code || !code.trim()) {
      showNotification('Please enter a verification code', 'warning');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await fetch(`${API_URL}/api/approvals/verify/${code.trim()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationResult(data.data);
        showNotification('Document verified successfully!', 'success');
      } else {
        setError(data.error || data.message || 'Verification failed');
        showNotification(data.error || 'Verification failed', 'error');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify document. Please try again.');
      showNotification('Failed to verify document', 'error');
    } finally {
      setLoading(false);
    }
  };

  // QR Code scanning with canvas
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Scanner functions
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      setShowScanner(true);
      
      // Wait for state update and then set video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.log('Video play error:', err));
        }
      }, 100);
      
      // Start scanning for QR codes
      setTimeout(() => {
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }, 1000);
    } catch (err) {
      console.error('Camera access error:', err);
      showNotification('Unable to access camera. Please enter the code manually.', 'error');
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Use jsQR to detect QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    if (qrCode && qrCode.data) {
      // Extract DCH code from QR data
      const codeMatch = qrCode.data.match(/DCH-\d{4}-[A-Z0-9]{6}/i);
      if (codeMatch) {
        const detectedCode = codeMatch[0].toUpperCase();
        setVerificationCode(detectedCode);
        stopScanner();
        showNotification(`QR Code detected: ${detectedCode}`, 'success');
        // Auto-verify the detected code
        setTimeout(() => handleVerify(detectedCode), 500);
      } else {
        // QR found but not a valid DCH code - might be a URL
        const urlMatch = qrCode.data.match(/verify[?/].*?(DCH-\d{4}-[A-Z0-9]{6})/i);
        if (urlMatch) {
          const detectedCode = urlMatch[1].toUpperCase();
          setVerificationCode(detectedCode);
          stopScanner();
          showNotification(`QR Code detected: ${detectedCode}`, 'success');
          setTimeout(() => handleVerify(detectedCode), 500);
        }
      }
    }
  };

  // Scan QR code from uploaded image file
  const scanQRFromImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (qrCode && qrCode.data) {
            // Extract DCH code from QR data
            const codeMatch = qrCode.data.match(/DCH-\d{4}-[A-Z0-9]{6}/i);
            if (codeMatch) {
              resolve(codeMatch[0].toUpperCase());
            } else {
              // Check for URL pattern
              const urlMatch = qrCode.data.match(/verify[?/].*?(DCH-\d{4}-[A-Z0-9]{6})/i);
              if (urlMatch) {
                resolve(urlMatch[1].toUpperCase());
              } else {
                reject(new Error('QR code found but no valid DCH code'));
              }
            }
          } else {
            reject(new Error('No QR code found in image'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle QR image upload in local upload section
  const handleQRImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file (PNG, JPG, etc.)', 'warning');
      return;
    }
    
    setScanningImage(true);
    try {
      const code = await scanQRFromImage(file);
      setVerificationCode(code);
      showNotification(`QR Code detected: ${code}`, 'success');
      setTimeout(() => handleVerify(code), 500);
    } catch (err) {
      console.error('QR scan error:', err);
      showNotification(err.message || 'Could not find QR code in image', 'error');
    } finally {
      setScanningImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showNotification('Please upload a PDF file', 'warning');
        return;
      }
      setUploadedFile(file);
      showNotification('File uploaded. Click "Verify from File" to check.', 'info');
    }
  };

  // Verify from uploaded file (extract code from PDF)
  const verifyFromFile = async () => {
    if (!uploadedFile) {
      showNotification('Please upload a file first', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // This is a public endpoint - no token required
      const response = await fetch(`${API_URL}/api/approvals/verify-file`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setVerificationResult(data.data);
        showNotification('Document verified from file!', 'success');
      } else {
        showNotification(data.error || 'Could not verify from file', 'error');
      }
    } catch (err) {
      console.error('File verification error:', err);
      showNotification('Failed to verify from file', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle document selection from browse
  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
    setSelectedVersion('latest');
    fetchDocumentVersions(doc.id);
  };

  // Verify selected document - lookup by IPFS hash
  const verifySelectedDocument = async () => {
    if (!selectedDocument) {
      showNotification('Please select a document', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Try to find approval request by document IPFS hash
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/approvals/verify-by-hash/${selectedDocument.ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setVerificationResult(data.data);
        showNotification('Document verified successfully!', 'success');
      } else {
        showNotification(data.error || 'No approval record found for this document', 'warning');
      }
    } catch (err) {
      console.error('Verification error:', err);
      showNotification('This document has not been submitted for approval yet', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Download functions
  const handleDownload = (ipfsHash, fileName) => {
    if (!ipfsHash) return;
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter documents by search
  const filteredDocuments = documents.filter(doc => {
    const docName = doc.fileName || doc.name || '';
    const docId = doc.documentId || '';
    return docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           docId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="verification-tool-container">
      {/* Notification Toast */}
      {notification && (
        <div className={`vt-notification ${notification.type}`}>
          <i className={`ri-${notification.type === 'success' ? 'checkbox-circle' : notification.type === 'error' ? 'error-warning' : notification.type === 'warning' ? 'alert' : 'information'}-line`}></i>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="vt-page-header">
        <div className="vt-header-content">
          <div className="vt-header-icon">
            <i className="ri-shield-check-line"></i>
          </div>
          <div className="vt-header-text">
            <h1>Document Verification</h1>
            <p>Verify the authenticity of blockchain-certified documents</p>
          </div>
        </div>
        <div className="vt-header-stats">
          <div className="vt-stat">
            <i className="ri-file-shield-2-line"></i>
            <span>{documents.length} Verified Documents</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vt-main-content">
        {/* Left Panel - Verification Methods */}
        <div className="vt-verification-panel">
          {/* Tabs */}
          <div className="vt-tabs">
            <button 
              className={`vt-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <i className="ri-keyboard-line"></i>
              <span>Enter Code</span>
            </button>
            <button 
              className={`vt-tab ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => setActiveTab('scan')}
            >
              <i className="ri-qr-scan-2-line"></i>
              <span>Scan QR</span>
            </button>
            <button 
              className={`vt-tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              <i className="ri-folder-open-line"></i>
              <span>Browse</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="vt-tab-content">
            {/* Enter Code Tab */}
            {activeTab === 'code' && (
              <div className="vt-code-section">
                <div className="vt-input-group">
                  <label>
                    <i className="ri-key-2-line"></i>
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    placeholder="DCH-2025-XXXXXX"
                    className="vt-code-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <span className="vt-input-hint">Enter the code from the certified document</span>
                </div>
                <button 
                  className="vt-verify-btn"
                  onClick={() => handleVerify()}
                  disabled={loading || !verificationCode.trim()}
                >
                  {loading ? (
                    <span className="vt-spinner"></span>
                  ) : (
                    <>
                      <i className="ri-search-line"></i>
                      Verify Document
                    </>
                  )}
                </button>

                <div className="vt-divider">
                  <span>or upload a certified PDF</span>
                </div>

                <div className="vt-upload-section">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="vt-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="ri-upload-cloud-line"></i>
                    {uploadedFile ? uploadedFile.name : 'Upload PDF File'}
                  </button>
                  {uploadedFile && (
                    <button 
                      className="vt-verify-file-btn"
                      onClick={verifyFromFile}
                      disabled={loading}
                    >
                      <i className="ri-file-search-line"></i>
                      Verify from File
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scan QR Tab */}
            {activeTab === 'scan' && (
              <div className="vt-scan-section">
                {!showScanner ? (
                  <div className="vt-scan-prompt">
                    <div className="vt-scan-icon">
                      <i className="ri-qr-code-line"></i>
                    </div>
                    <h3>Scan QR Code</h3>
                    <p>Use your camera to scan the QR code on the certified document</p>
                    <button className="vt-scan-btn" onClick={startScanner}>
                      <i className="ri-camera-line"></i>
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <div className="vt-scanner-active">
                    <div className="vt-scanner-container">
                      <video ref={videoRef} autoPlay playsInline className="vt-scanner-video" />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <div className="vt-scanner-overlay">
                        <div className="vt-scanner-frame">
                          <span className="corner tl"></span>
                          <span className="corner tr"></span>
                          <span className="corner bl"></span>
                          <span className="corner br"></span>
                        </div>
                        <div className="vt-scan-line"></div>
                      </div>
                    </div>
                    <p className="vt-scanner-hint">Position the QR code within the frame</p>
                    
                    {/* Manual Code Entry Fallback */}
                    <div className="vt-scanner-fallback">
                      <span className="vt-fallback-text">Can't scan? Enter code manually:</span>
                      <div className="vt-fallback-input">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                          placeholder="DCH-2025-XXXXXX"
                          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                        />
                        <button 
                          onClick={() => handleVerify()}
                          disabled={loading || !verificationCode.trim()}
                        >
                          <i className="ri-check-line"></i>
                        </button>
                      </div>
                    </div>
                    
                    <button className="vt-stop-scan-btn" onClick={stopScanner}>
                      <i className="ri-close-line"></i>
                      Stop Scanner
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Browse Documents Tab */}
            {activeTab === 'browse' && (
              <div className="vt-browse-section">
                {/* Upload Method Toggle */}
                <div className="vt-browse-toggle">
                  <button 
                    className={`vt-toggle-btn ${uploadMethod === 'account' ? 'active' : ''}`}
                    onClick={() => setUploadMethod('account')}
                  >
                    <i className="ri-cloud-line"></i>
                    My Documents
                  </button>
                  <button 
                    className={`vt-toggle-btn ${uploadMethod === 'local' ? 'active' : ''}`}
                    onClick={() => setUploadMethod('local')}
                  >
                    <i className="ri-hard-drive-line"></i>
                    Local Upload
                  </button>
                </div>

                {uploadMethod === 'account' ? (
                  <>
                    {/* Search */}
                    <div className="vt-search-bar">
                      <i className="ri-search-line"></i>
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')}>
                          <i className="ri-close-line"></i>
                        </button>
                      )}
                    </div>

                    {/* Documents List */}
                    <div className="vt-documents-list">
                      {loadingDocs ? (
                        <div className="vt-loading">
                          <span className="vt-spinner"></span>
                          <span>Loading documents...</span>
                        </div>
                      ) : filteredDocuments.length === 0 ? (
                        <div className="vt-empty">
                          <i className="ri-file-search-line"></i>
                          <p>No verified documents found</p>
                          <span>Documents with verification codes will appear here</span>
                        </div>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <div 
                            key={doc.id}
                            className={`vt-doc-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                            onClick={() => handleDocumentSelect(doc)}
                          >
                            <div className="vt-doc-icon">
                              <i className="ri-file-pdf-line"></i>
                            </div>
                            <div className="vt-doc-info">
                              <h4>{doc.fileName || doc.name}</h4>
                              <div className="vt-doc-meta">
                                <span className="vt-doc-code">
                                  <i className="ri-fingerprint-line"></i>
                                  {doc.documentId ? doc.documentId.slice(0, 12) + '...' : 'No ID'}
                                </span>
                                <span className="vt-doc-date">
                                  <i className="ri-calendar-line"></i>
                                  {formatDate(doc.createdAt || doc.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="vt-doc-status">
                              {doc.ipfsHash ? (
                                <span className="vt-badge certified">
                                  <i className="ri-links-line"></i>
                                </span>
                              ) : (
                                <span className="vt-badge pending">
                                  <i className="ri-time-line"></i>
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Version Selector */}
                    {selectedDocument && documentVersions.length > 0 && (
                      <div className="vt-version-selector">
                        <label>
                          <i className="ri-history-line"></i>
                          Select Version
                        </label>
                        <select 
                          value={selectedVersion}
                          onChange={(e) => setSelectedVersion(e.target.value)}
                        >
                          <option value="latest">Latest Version</option>
                          {documentVersions.map((v, i) => (
                            <option key={i} value={v.versionNumber || v.version}>
                              Version {v.versionNumber || v.version} - {formatDate(v.createdAt || v.created_at)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Verify Selected Button */}
                    {selectedDocument && (
                      <button 
                        className="vt-verify-btn"
                        onClick={verifySelectedDocument}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="vt-spinner"></span>
                        ) : (
                          <>
                            <i className="ri-shield-check-line"></i>
                            Verify Selected Document
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  /* Local Upload */
                  <div className="vt-local-upload">
                    {/* Option 1: Upload Certified PDF */}
                    <div 
                      className="vt-drop-zone"
                      onClick={() => localFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type === 'application/pdf') {
                          setUploadedFile(file);
                        }
                      }}
                    >
                      <input
                        type="file"
                        ref={localFileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf"
                        style={{ display: 'none' }}
                      />
                      <i className="ri-file-pdf-line"></i>
                      <h3>Upload Certified PDF</h3>
                      <p>Upload a PDF with embedded verification code</p>
                      {uploadedFile && (
                        <div className="vt-uploaded-file">
                          <i className="ri-file-pdf-line"></i>
                          <span>{uploadedFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    {uploadedFile && (
                      <button 
                        className="vt-verify-btn"
                        onClick={verifyFromFile}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="vt-spinner"></span>
                        ) : (
                          <>
                            <i className="ri-file-search-line"></i>
                            Verify from PDF
                          </>
                        )}
                      </button>
                    )}

                    <div className="vt-divider">
                      <span>or</span>
                    </div>

                    {/* Option 2: Upload QR Code Image */}
                    <div 
                      className="vt-drop-zone vt-qr-upload"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleQRImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <i className="ri-qr-code-line"></i>
                      <h3>Upload QR Code Image</h3>
                      <p>Upload a screenshot or photo of the QR code</p>
                      {scanningImage && (
                        <div className="vt-scanning">
                          <span className="vt-spinner"></span>
                          <span>Scanning QR code...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="vt-error">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <i className="ri-close-line"></i>
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Verification Results */}
        <div className="vt-results-panel">
          {!verificationResult ? (
            <div className="vt-no-result">
              <div className="vt-no-result-icon">
                <i className="ri-file-search-line"></i>
              </div>
              <h3>No Verification Yet</h3>
              <p>Enter a verification code, scan a QR code, or select a document to verify its authenticity</p>
              <div className="vt-help-tips">
                <h4>How to verify:</h4>
                <ul>
                  <li>
                    <i className="ri-keyboard-line"></i>
                    <span>Enter the code from the certified PDF (top-right corner)</span>
                  </li>
                  <li>
                    <i className="ri-qr-scan-line"></i>
                    <span>Scan the QR code printed on the document</span>
                  </li>
                  <li>
                    <i className="ri-folder-open-line"></i>
                    <span>Browse and select from your verified documents</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className={`vt-result ${verificationResult.verified ? 'verified' : 'pending'}`}>
              {/* Status Banner */}
              <div className={`vt-status-banner ${verificationResult.verified ? 'verified' : 'pending'}`}>
                <div className="vt-status-icon">
                  {verificationResult.verified ? (
                    <i className="ri-shield-check-fill"></i>
                  ) : (
                    <i className="ri-time-fill"></i>
                  )}
                </div>
                <div className="vt-status-text">
                  <h2>{verificationResult.verified ? 'Document Verified' : 'Pending Approval'}</h2>
                  <span className="vt-verification-code">
                    <i className="ri-qr-code-line"></i>
                    {verificationResult.verification_code}
                  </span>
                </div>
              </div>

              {/* Document Details */}
              <div className="vt-section">
                <div className="vt-section-header">
                  <i className="ri-file-text-line"></i>
                  <h3>Document Information</h3>
                </div>
                <div className="vt-info-grid">
                  <div className="vt-info-item">
                    <label>Document Name</label>
                    <span>{verificationResult.document?.name || 'N/A'}</span>
                  </div>
                  <div className="vt-info-item">
                    <label>File Type</label>
                    <span>{verificationResult.document?.file_type?.toUpperCase() || 'PDF'}</span>
                  </div>
                  <div className="vt-info-item">
                    <label>Status</label>
                    <span className={`vt-status-badge ${verificationResult.approval?.status?.toLowerCase()}`}>
                      {verificationResult.approval?.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="vt-info-item">
                    <label>Approval Type</label>
                    <span className="capitalize">{verificationResult.approval?.approval_type || 'Standard'}</span>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="vt-download-actions">
                  <button 
                    className="vt-download-btn original"
                    onClick={() => handleDownload(verificationResult.document?.ipfs_hash, verificationResult.document?.name)}
                  >
                    <i className="ri-download-line"></i>
                    Original Document
                  </button>
                  {verificationResult.document?.stamped_ipfs_hash && (
                    <button 
                      className="vt-download-btn certified"
                      onClick={() => handleDownload(verificationResult.document?.stamped_ipfs_hash, `Certified_${verificationResult.document?.name}`)}
                    >
                      <i className="ri-shield-check-line"></i>
                      Certified Copy
                    </button>
                  )}
                </div>
              </div>

              {/* Requester Information */}
              <div className="vt-section">
                <div className="vt-section-header">
                  <i className="ri-user-line"></i>
                  <h3>Requester Information</h3>
                </div>
                <div className="vt-info-grid cols-3">
                  <div className="vt-info-item">
                    <label>Name</label>
                    <span>{verificationResult.requester?.name || 'N/A'}</span>
                  </div>
                  <div className="vt-info-item">
                    <label>Email</label>
                    <span>{verificationResult.requester?.email || 'N/A'}</span>
                  </div>
                  <div className="vt-info-item">
                    <label>Institution</label>
                    <span>{verificationResult.requester?.institution || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Approval Timeline */}
              <div className="vt-section">
                <div className="vt-section-header">
                  <i className="ri-flow-chart"></i>
                  <h3>Approval Timeline</h3>
                </div>
                <div className="vt-timeline">
                  <div className="vt-timeline-item completed">
                    <div className="vt-timeline-marker">
                      <i className="ri-send-plane-fill"></i>
                    </div>
                    <div className="vt-timeline-content">
                      <h4>Submitted</h4>
                      <span>{formatDate(verificationResult.approval?.submitted_at)}</span>
                    </div>
                  </div>
                  
                  {verificationResult.approvers?.map((approver, index) => (
                    <div 
                      key={index} 
                      className={`vt-timeline-item ${approver.has_approved ? 'completed' : approver.has_rejected ? 'rejected' : 'pending'}`}
                    >
                      <div className="vt-timeline-marker">
                        {approver.has_approved ? (
                          approver.is_digital_signature ? (
                            <i className="ri-shield-keyhole-fill"></i>
                          ) : (
                            <i className="ri-checkbox-circle-fill"></i>
                          )
                        ) : approver.has_rejected ? (
                          <i className="ri-close-circle-fill"></i>
                        ) : (
                          <i className="ri-time-fill"></i>
                        )}
                      </div>
                      <div className="vt-timeline-content">
                        <h4>
                          {approver.name}
                          {approver.is_digital_signature && (
                            <span className="vt-digital-badge">
                              <i className="ri-shield-check-fill"></i>
                              Digitally Signed
                            </span>
                          )}
                        </h4>
                        <span className="vt-role">{approver.role}</span>
                        {approver.action_timestamp && (
                          <span className="vt-timestamp">{formatDate(approver.action_timestamp)}</span>
                        )}
                        {approver.wallet_address && approver.is_digital_signature && (
                          <div className="vt-wallet-info">
                            <i className="ri-wallet-3-line"></i>
                            <code>{approver.wallet_address.slice(0, 10)}...{approver.wallet_address.slice(-8)}</code>
                          </div>
                        )}
                        {approver.reason && (
                          <p className="vt-reason">"{approver.reason}"</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {verificationResult.approval?.completed_at && (
                    <div className="vt-timeline-item completed final">
                      <div className="vt-timeline-marker">
                        <i className="ri-flag-fill"></i>
                      </div>
                      <div className="vt-timeline-content">
                        <h4>Completed</h4>
                        <span>{formatDate(verificationResult.approval?.completed_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain Verification */}
              <div className="vt-section blockchain">
                <div className="vt-section-header">
                  <i className="ri-links-line"></i>
                  <h3>Blockchain Verification</h3>
                </div>
                <div className="vt-blockchain-info">
                  <div className="vt-hash-item">
                    <label>IPFS Hash</label>
                    <code>{verificationResult.document?.ipfs_hash || 'N/A'}</code>
                  </div>
                  {verificationResult.blockchain?.tx_hash && (
                    <div className="vt-hash-item">
                      <label>Transaction Hash</label>
                      <code>{verificationResult.blockchain.tx_hash}</code>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${verificationResult.blockchain.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vt-etherscan-link"
                      >
                        <i className="ri-external-link-line"></i>
                        View on Etherscan
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Signature Verification Section */}
              {verificationResult.approval?.approval_type === 'DIGITAL_SIGNATURE' && 
               verificationResult.approvers?.some(a => a.is_digital_signature) && (
                <div className="vt-section digital-signature">
                  <div className="vt-section-header">
                    <i className="ri-shield-keyhole-line"></i>
                    <h3>Digital Signature Verification</h3>
                  </div>
                  <div className="vt-signature-info">
                    <div className="vt-signature-notice">
                      <i className="ri-information-line"></i>
                      <p>This document was cryptographically signed using the signer's private key via MetaMask. 
                         The signature can be mathematically verified to prove authenticity.</p>
                    </div>
                    
                    {verificationResult.approvers?.filter(a => a.is_digital_signature).map((signer, idx) => (
                      <div key={idx} className="vt-signer-card">
                        <div className="vt-signer-header">
                          <div className="vt-signer-icon">
                            <i className="ri-shield-user-fill"></i>
                          </div>
                          <div className="vt-signer-info">
                            <h4>{signer.name}</h4>
                            <span className="vt-signer-role">{signer.role}</span>
                          </div>
                          <div className="vt-verified-badge">
                            <i className="ri-checkbox-circle-fill"></i>
                            Verified
                          </div>
                        </div>
                        
                        <div className="vt-signer-details">
                          <div className="vt-detail-row">
                            <label><i className="ri-wallet-3-line"></i> Wallet Address</label>
                            <code>{signer.wallet_address || signer.digital_signature?.signer_address || 'N/A'}</code>
                          </div>
                          
                          <div className="vt-detail-row">
                            <label><i className="ri-time-line"></i> Signed At</label>
                            <span>{formatDate(signer.digital_signature?.signed_at || signer.action_timestamp)}</span>
                          </div>
                          
                          {signer.signature_hash && (
                            <div className="vt-detail-row">
                              <label><i className="ri-key-2-line"></i> Signature Hash</label>
                              <code className="vt-signature-hash">
                                {signer.signature_hash.slice(0, 20)}...{signer.signature_hash.slice(-16)}
                              </code>
                            </div>
                          )}
                          
                          {signer.blockchain_tx_hash && (
                            <div className="vt-detail-row">
                              <label><i className="ri-links-line"></i> Blockchain TX</label>
                              <div className="vt-tx-link">
                                <code>{signer.blockchain_tx_hash.slice(0, 16)}...{signer.blockchain_tx_hash.slice(-12)}</code>
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${signer.blockchain_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <i className="ri-external-link-line"></i>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="vt-verification-method">
                          <div className="vt-method-header">
                            <i className="ri-shield-check-line"></i>
                            <span>How to Verify This Signature</span>
                          </div>
                          <div className="vt-method-steps">
                            <div className="vt-step">
                              <span className="vt-step-num">1</span>
                              <p>The signer signed a message containing the document hash using their private key in MetaMask</p>
                            </div>
                            <div className="vt-step">
                              <span className="vt-step-num">2</span>
                              <p>The signature was recorded on the Ethereum blockchain</p>
                            </div>
                            <div className="vt-step">
                              <span className="vt-step-num">3</span>
                              <p>To verify: Use <code>ecrecover(message, signature)</code> which returns the signer's wallet address</p>
                            </div>
                            <div className="vt-step">
                              <span className="vt-step-num">4</span>
                              <p>If recovered address matches <code>{signer.wallet_address?.slice(0, 10)}...{signer.wallet_address?.slice(-6)}</code> → Signature is VALID</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Results Button */}
              <button 
                className="vt-clear-btn"
                onClick={() => {
                  setVerificationResult(null);
                  setVerificationCode('');
                  setSelectedDocument(null);
                  setUploadedFile(null);
                }}
              >
                <i className="ri-refresh-line"></i>
                Verify Another Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
