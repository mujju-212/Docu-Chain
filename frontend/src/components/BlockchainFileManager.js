import React, { useState, useEffect } from 'react';
import blockchainService from '../services/blockchainService';
import pinataService from '../services/pinataService';

const BlockchainFileManager = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAccount, setUserAccount] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Registration form state
    const [showRegistration, setShowRegistration] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        username: '',
        email: '',
        userType: 0 // 0: STUDENT, 1: FACULTY, 2: ADMIN
    });

    // Folder creation state
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [selectedParentFolder, setSelectedParentFolder] = useState(0);

    useEffect(() => {
        initializeBlockchain();
    }, []);

    const initializeBlockchain = async () => {
        try {
            const result = await blockchainService.initialize();
            if (result.success) {
                setIsConnected(true);
                setUserAccount(result.account);
                await checkUserRegistration();
                await loadUserData();
            }
        } catch (error) {
            console.error('Blockchain initialization failed:', error);
        }
    };

    const connectWallet = async () => {
        setLoading(true);
        try {
            const result = await blockchainService.connectWallet();
            if (result.success) {
                setIsConnected(true);
                setUserAccount(result.account);
                await checkUserRegistration();
                await loadUserData();
                setError('');
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Failed to connect wallet');
        }
        setLoading(false);
    };

    const checkUserRegistration = async () => {
        try {
            // Check if user is registered by trying to get user documents
            const result = await blockchainService.getUserDocuments();
            setIsRegistered(result.success);
        } catch (error) {
            setIsRegistered(false);
        }
    };

    const registerUser = async () => {
        setLoading(true);
        try {
            const result = await blockchainService.registerUser(
                registrationData.username,
                registrationData.email,
                registrationData.userType
            );

            if (result.success) {
                setIsRegistered(true);
                setShowRegistration(false);
                setError('');
                await loadUserData();
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Registration failed');
        }
        setLoading(false);
    };

    const loadUserData = async () => {
        if (!isRegistered || !isConnected) return;

        try {
            // Load user documents
            const docsResult = await blockchainService.getUserDocuments();
            if (docsResult.success) {
                const documentDetails = await Promise.all(
                    docsResult.documentIds.map(async (id) => {
                        const docResult = await blockchainService.getDocument(id);
                        return docResult.success ? docResult.document : null;
                    })
                );
                setDocuments(documentDetails.filter(doc => doc !== null));
            }

            // Load user folders
            const foldersResult = await blockchainService.getUserFolders();
            if (foldersResult.success) {
                setFolders(foldersResult.folderIds);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };

    const createFolder = async () => {
        if (!folderName.trim()) return;

        setLoading(true);
        try {
            const result = await blockchainService.createFolder(folderName, selectedParentFolder);
            if (result.success) {
                setShowCreateFolder(false);
                setFolderName('');
                setSelectedParentFolder(0);
                await loadUserData();
                setError('');
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Failed to create folder');
        }
        setLoading(false);
    };

    const uploadFile = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setUploadProgress(0);

        try {
            // Step 1: Upload to IPFS via Pinata
            setUploadProgress(25);
            const ipfsResult = await pinataService.uploadFile(selectedFile);
            
            if (!ipfsResult.success) {
                throw new Error(ipfsResult.error);
            }

            setUploadProgress(50);

            // Step 2: Upload to blockchain
            const blockchainResult = await blockchainService.uploadDocument(
                selectedFile.name,
                ipfsResult.ipfsHash,
                selectedParentFolder, // folder ID
                selectedFile.size,
                selectedFile.type
            );

            setUploadProgress(75);

            if (blockchainResult.success) {
                setUploadProgress(100);
                setSelectedFile(null);
                await loadUserData();
                setError('');
            } else {
                throw new Error(blockchainResult.error);
            }
        } catch (error) {
            setError(`Upload failed: ${error.message}`);
        }
        
        setLoading(false);
        setTimeout(() => setUploadProgress(0), 2000);
    };

    const downloadFile = async (document) => {
        try {
            const result = await pinataService.getFileFromIPFS(document.ipfsHash);
            if (result.success) {
                // Create download link
                const url = window.URL.createObjectURL(new Blob([result.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', document.fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } else {
                setError('Failed to download file');
            }
        } catch (error) {
            setError('Download failed');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Connect to DocuChain
                    </h2>
                    <p className="text-gray-600 mb-6 text-center">
                        Connect your MetaMask wallet to access the blockchain document management system.
                    </p>
                    <button
                        onClick={connectWallet}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : 'Connect MetaMask'}
                    </button>
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!isRegistered) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Register on DocuChain
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={registrationData.username}
                                onChange={(e) => setRegistrationData({
                                    ...registrationData,
                                    username: e.target.value
                                })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={registrationData.email}
                                onChange={(e) => setRegistrationData({
                                    ...registrationData,
                                    email: e.target.value
                                })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User Type
                            </label>
                            <select
                                value={registrationData.userType}
                                onChange={(e) => setRegistrationData({
                                    ...registrationData,
                                    userType: parseInt(e.target.value)
                                })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={0}>Student</option>
                                <option value={1}>Faculty</option>
                                <option value={2}>Admin</option>
                            </select>
                        </div>
                        <button
                            onClick={registerUser}
                            disabled={loading || !registrationData.username || !registrationData.email}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">DocuChain File Manager</h1>
                            <p className="text-gray-600">Connected: {userAccount}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCreateFolder(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                New Folder
                            </button>
                            <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                                Upload File
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Uploading...</span>
                            <span className="text-sm text-gray-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Selected File Upload */}
                {selectedFile && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={uploadFile}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? 'Uploading...' : 'Upload to Blockchain'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Your Documents</h3>
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No documents uploaded yet.</p>
                            <p className="text-sm">Upload your first document to get started!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800">{doc.fileName}</h4>
                                            <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                                                <span>Size: {formatFileSize(doc.fileSize)}</span>
                                                <span>Type: {doc.fileType}</span>
                                                <span>Version: {doc.currentVersion}</span>
                                                <span>Created: {formatDate(doc.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => downloadFile(doc)}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                Download
                                            </button>
                                            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
                        <div className="flex justify-between items-center">
                            <span>{error}</span>
                            <button
                                onClick={() => setError('')}
                                className="ml-2 text-red-600 hover:text-red-800"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Folder Modal */}
                {showCreateFolder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
                            <input
                                type="text"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowCreateFolder(false);
                                        setFolderName('');
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createFolder}
                                    disabled={!folderName.trim() || loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockchainFileManager;