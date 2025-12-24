import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../../services/api';
import { BackgroundBeams } from '../../components/ui/background-beams';
import { Header } from '../../components/ui/header-2';
import { 
  Shield, 
  Key, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  Users,
  Clock,
  Download,
  ExternalLink,
  Link2,
  ArrowLeft,
  Search,
  Camera,
  X
} from 'lucide-react';
import jsQR from 'jsqr';

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function VerifyDocument() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const [verificationCode, setVerificationCode] = useState(code || searchParams.get('code') || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

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
      const url = `${API_URL}/approvals/verify/${codeToVerify.trim()}`;
      console.log('🔍 Verifying document:', { code: codeToVerify.trim(), url });
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📥 Verification response:', { status: response.status, data });

      if (data.success && data.data) {
        console.log('✅ Verification successful:', data.data);
        setVerificationResult(data.data);
        setError(null);
      } else {
        const errorMsg = data.message || data.error || 'Document not found or verification failed';
        console.log('❌ Verification failed:', errorMsg);
        setError(errorMsg);
        setVerificationResult(null);
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(`Unable to connect to server. Please check: ${err.message}`);
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  };

  const verifyFromFile = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const url = `${API_URL}/approvals/verify-file`;
      console.log('📄 Verifying from file:', { fileName: uploadedFile.name, url });
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('📥 File verification response:', { status: response.status, data });
      
      if (response.ok && data.success && data.data) {
        console.log('✅ File verification successful');
        setVerificationResult(data.data);
        setError(null);
      } else {
        const errorMsg = data.error || 'Could not extract verification code from PDF';
        console.log('❌ File verification failed:', errorMsg);
        setError(errorMsg);
        setVerificationResult(null);
      }
    } catch (err) {
      console.error('❌ File verification error:', err);
      setError(`Failed to verify file: ${err.message}`);
      setVerificationResult(null);
    } finally {
      setLoading(false);
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

  // QR Scanner Functions (Using working implementation from VerificationTool)
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      setShowScanner(true);
      setScanning(true);
      setError(null);
      
      // Wait for state update and then set video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.log('Video play error:', err);
            setError('Failed to start video');
          });
        }
      }, 100);
      
      // Start scanning for QR codes using interval (more reliable)
      setTimeout(() => {
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }, 1000);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
      setScanning(false);
      setShowScanner(false);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowScanner(false);
    setScanning(false);
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
      console.log('📷 QR Code detected:', qrCode.data);
      
      // Extract DCH code from QR data
      const codeMatch = qrCode.data.match(/DCH-\d{4}-[A-Z0-9]{6}/i);
      if (codeMatch) {
        const detectedCode = codeMatch[0].toUpperCase();
        console.log('✅ Extracted code:', detectedCode);
        setVerificationCode(detectedCode);
        stopScanner();
        // Auto-verify the detected code
        setTimeout(() => {
          console.log('🔍 Auto-verifying from QR scan...');
          handleVerify(detectedCode);
        }, 300);
      } else {
        // QR found but not a valid DCH code - might be a URL
        const urlMatch = qrCode.data.match(/verify[?/].*?(DCH-\d{4}-[A-Z0-9]{6})/i);
        if (urlMatch) {
          const detectedCode = urlMatch[1].toUpperCase();
          console.log('✅ Extracted code from URL:', detectedCode);
          setVerificationCode(detectedCode);
          stopScanner();
          setTimeout(() => handleVerify(detectedCode), 300);
        }
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <BackgroundBeams className="opacity-40" />
      
      {/* Header - Same as LandingPage */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 px-4 py-12 mt-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/50 mb-6">
              <Shield className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Document Verification
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Verify the authenticity of blockchain-certified documents instantly
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Input Section */}
            <div className="relative">
              <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Key className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Enter Code</h2>
                </div>

                {/* Code Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="DCH-2025-XXXXXX"
                    disabled={loading}
                    className="w-full px-4 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the DCH code from your certified document
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerify()}
                  disabled={loading || !verificationCode.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2 mb-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Verify Document
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black/50 text-gray-400">or scan QR code</span>
                  </div>
                </div>

                {/* QR Scanner Button */}
                <button
                  onClick={startScanner}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2 mb-8"
                >
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black/50 text-gray-400">or upload PDF</span>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition flex items-center justify-center gap-3"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">
                      {uploadedFile ? uploadedFile.name : 'Upload Certified PDF'}
                    </span>
                  </button>

                  {uploadedFile && (
                    <button
                      onClick={verifyFromFile}
                      disabled={loading}
                      className="w-full px-6 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Verify from PDF
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="relative">
              <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl min-h-[600px]">
                {!verificationResult ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
                      <Search className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Verification Yet</h3>
                    <p className="text-gray-400 mb-8 max-w-sm">
                      Enter a verification code or upload a certified PDF to verify document authenticity
                    </p>
                    <div className="text-left space-y-4 bg-gray-900/50 p-6 rounded-xl border border-gray-800 w-full max-w-md">
                      <p className="text-sm font-semibold text-blue-400 mb-4">How to verify:</p>
                      <div className="flex items-start gap-3 text-sm text-gray-400">
                        <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>Enter the DCH code from the top-right corner of your certified document</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-400">
                        <Upload className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>Upload the PDF file for automatic code extraction and verification</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-400">
                        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>View complete blockchain verification and approval details</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status Banner */}
                    <div className={`p-6 rounded-xl ${verificationResult.verified ? 'bg-green-500/10 border border-green-500/50' : 'bg-yellow-500/10 border border-yellow-500/50'}`}>
                      <div className="flex items-center gap-4">
                        {verificationResult.verified ? (
                          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-8 h-8 text-yellow-400" />
                          </div>
                        )}
                        <div>
                          <h3 className={`text-2xl font-bold ${verificationResult.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                            {verificationResult.verified ? 'Document Verified ✓' : 'Pending Approval'}
                          </h3>
                          <p className="text-sm text-gray-400 font-mono mt-1">
                            {verificationResult.verification_code}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Document Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Name</p>
                          <p className="text-sm text-white font-medium">{verificationResult.document?.name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">File Type</p>
                            <p className="text-sm text-gray-300">{verificationResult.document?.file_type?.toUpperCase() || 'PDF'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              verificationResult.approval?.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                              verificationResult.approval?.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {verificationResult.approval?.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Requester
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Name:</span>
                          <span className="text-sm text-white font-medium">{verificationResult.requester?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Email:</span>
                          <span className="text-sm text-gray-300">{verificationResult.requester?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Institution:</span>
                          <span className="text-sm text-gray-300">{verificationResult.requester?.institution || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Approvers */}
                    {verificationResult.approvers && verificationResult.approvers.length > 0 && (
                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-400" />
                          Approval Timeline
                        </h4>
                        <div className="space-y-3">
                          {verificationResult.approvers.map((approver, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                              {approver.has_approved ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              ) : approver.has_rejected ? (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{approver.name}</p>
                                <p className="text-xs text-gray-400">{approver.role}</p>
                                {approver.action_timestamp && (
                                  <p className="text-xs text-gray-500 mt-1">{formatDate(approver.action_timestamp)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockchain Info */}
                    {verificationResult.blockchain?.tx_hash && (
                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Link2 className="w-5 h-5 text-blue-400" />
                          Blockchain
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">IPFS Hash</p>
                            <code className="text-xs text-gray-300 bg-black/50 px-3 py-2 rounded block overflow-x-auto">
                              {verificationResult.document?.ipfs_hash}
                            </code>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Transaction</p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-gray-300 bg-black/50 px-3 py-2 rounded block overflow-x-auto flex-1">
                                {verificationResult.blockchain.tx_hash.slice(0, 20)}...{verificationResult.blockchain.tx_hash.slice(-16)}
                              </code>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${verificationResult.blockchain.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded border border-blue-500/50 transition flex items-center justify-center"
                              >
                                <ExternalLink className="w-4 h-4 text-blue-400" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => openDocument(verificationResult.document?.ipfs_hash)}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          setVerificationResult(null);
                          setVerificationCode('');
                          setUploadedFile(null);
                          setError(null);
                        }}
                        className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              All verifications are recorded on the Ethereum blockchain • Tamper-proof • Publicly verifiable
            </p>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4">
            {/* Close Button */}
            <button
              onClick={stopScanner}
              className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 transition z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Scanner Container */}
            <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Scan QR Code</h3>
                <p className="text-gray-400">Position the QR code within the frame</p>
              </div>

              {/* Video Container */}
              <div className="relative aspect-square bg-black rounded-xl overflow-hidden border-4 border-blue-500/50 shadow-lg">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning Grid - helps with alignment */}
                  <div className="absolute inset-8 border-2 border-dashed border-blue-400/30"></div>
                  
                  {/* Corner Brackets */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-blue-400 animate-pulse"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-blue-400 animate-pulse"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-blue-400 animate-pulse"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-blue-400 animate-pulse"></div>
                  
                  {/* Animated Scanning Line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan"></div>
                  
                  {/* Center Focus Point */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                </div>

                {/* Scanning Status */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Scanning for QR code...</span>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-2">Hold steady • Good lighting required</p>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 text-center">
                  💡 Hold your device steady and ensure good lighting for best results
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
