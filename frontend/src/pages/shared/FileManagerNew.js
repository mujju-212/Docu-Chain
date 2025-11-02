import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../contexts/WalletContext';
import hybridFileManagerService from '../../services/hybridFileManagerService';
import blockchainServiceV2 from '../../services/blockchainServiceV2';
import pinataService from '../../services/pinataService';
import { toggleStarDocument, toggleStarFolder, getStarredDocuments, getStarredFolders, getRecentActivities, addRecentActivity as addRecentActivityAPI } from '../../services/api';
import './FileManagerNew.css';

const FileManager = () => {
  const { currentTheme } = useTheme();
  
  // Get wallet context (global wallet state)
  const { 
    isConnected: isWalletConnectedGlobal,
    address: walletAddressGlobal,
    connect: connectWalletGlobal,
    isLoading: isWalletLoading,
    isMetaMaskInstalled
  } = useWallet();
  
  // Main state
  const [currentSection, setCurrentSection] = useState('section-all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentSort, setCurrentSort] = useState({ field: 'name', direction: 'asc' });
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal states
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  
  // Sharing states
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [currentSharingItems, setCurrentSharingItems] = useState([]);
  const [activeTab, setActiveTab] = useState('connected');
  
  // Notification state
  const [notification, setNotification] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null, type: 'file' });

  // Additional states for new features
  const [clipboard, setClipboard] = useState({ items: [], action: null }); // 'copy' or 'move'
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [versionHistory, setVersionHistory] = useState({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentFolderId, setCurrentFolderId] = useState(null); // Track current folder ID
  const [folderStack, setFolderStack] = useState([{id: null, name: 'Home', path: '/'}]); // Navigation stack
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [trashedItems, setTrashedItems] = useState([]);
  const [deleteItem, setDeleteItem] = useState(null); // Item to be deleted
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Delete confirmation modal
  const [activeMenu, setActiveMenu] = useState(null); // Track which file's menu is open

  // Blockchain states (using global wallet state where possible)
  const [blockchainFiles, setBlockchainFiles] = useState([]);
  const [blockchainFolders, setBlockchainFolders] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  // REMOVED: const [isBlockchainConnected, setIsBlockchainConnected] - Using isWalletConnectedGlobal from context
  // REMOVED: const [walletAccount, setWalletAccount] - Using walletAddressGlobal from context
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [fileVersions, setFileVersions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null); // Current logged in user from database
  const [institutionUsers, setInstitutionUsers] = useState([]);
  const [isUploadingToBlockchain, setIsUploadingToBlockchain] = useState(false);

  // Aliases for clarity (map global context to local names used in component)
  const isBlockchainConnected = isWalletConnectedGlobal;
  const walletAccount = walletAddressGlobal;

  // UI state variables
  const [starredItems, setStarredItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [sharedWithMeItems, setSharedWithMeItems] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Quick Access filtered view state
  const [filteredView, setFilteredView] = useState(null); // 'documents', 'images', 'videos', or null
  const [filteredFiles, setFilteredFiles] = useState([]); // Store all files when filtering is active
  const [totalFileCounts, setTotalFileCounts] = useState({ documents: 0, images: 0, videos: 0, shared: 0 }); // Total counts across all folders

  // File system data - now loaded from blockchain
  const [fileSystem, setFileSystem] = useState({
    currentPath: '/',
    folders: {},
    files: []
  });

  // Helper functions - defined before use
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Unknown';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Unknown';
    }
  };

  // Initialize file manager (backend connection only)
  useEffect(() => {
    console.log('📂 Initializing File Manager...');
    initializeBlockchainConnection();  // This will load everything after authentication
    
    // Note: Wallet connection is handled globally by WalletProvider in App.js
    // No need to initialize blockchain/MetaMask here
  }, []);

  // Listen for wallet connection changes from global context
  useEffect(() => {
    if (isWalletConnectedGlobal && walletAddressGlobal) {
      console.log('✅ Wallet connected globally:', walletAddressGlobal);
      // Load blockchain data when wallet connects
      loadBlockchainData();
    }
  }, [isWalletConnectedGlobal, walletAddressGlobal]);

  // Close active menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking inside a menu container
      if (e.target.closest('.fm-menu-container')) {
        return;
      }
      if (activeMenu !== null) {
        setActiveMenu(null);
      }
    };
    
    const handleScroll = () => {
      if (activeMenu !== null) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scrolls
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenu]);

  // Reload files when currentFolderId changes (for navigation)
  useEffect(() => {
    if (isBlockchainConnected) {
      console.log('🔄 currentFolderId changed to:', currentFolderId);
      console.log('🔄 Reloading files...');
      loadBlockchainFiles();
    }
  }, [currentFolderId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+C or Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedFiles.length > 0) {
        const items = fileSystem.filter(f => selectedFiles.includes(f.id));
        setClipboard({ items, action: 'copy' });
        showNotification('success', 'Copied', `${items.length} item(s) copied to clipboard`);
        e.preventDefault();
      }
      
      // Ctrl+X or Cmd+X - Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedFiles.length > 0) {
        const items = fileSystem.filter(f => selectedFiles.includes(f.id));
        setClipboard({ items, action: 'move' });
        showNotification('info', 'Cut', `${items.length} item(s) cut to clipboard`);
        e.preventDefault();
      }
      
      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.items.length > 0) {
        handlePaste();
        e.preventDefault();
      }
      
      // Delete or Backspace - Delete selected items
      if ((e.key === 'Delete' || (e.key === 'Backspace' && !e.target.matches('input, textarea'))) && selectedFiles.length > 0) {
        const items = fileSystem.filter(f => selectedFiles.includes(f.id));
        if (items.length === 1) {
          handleDelete(items[0]);
        } else if (window.confirm(`Delete ${items.length} items?`)) {
          items.forEach(item => handleDelete(item));
        }
        e.preventDefault();
      }
      
      // F2 - Rename
      if (e.key === 'F2' && selectedFiles.length === 1) {
        const item = fileSystem.find(f => f.id === selectedFiles[0]);
        if (item) {
          setRenameItem(item);
          setNewName(item.name);
        }
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, clipboard, fileSystem]);
  const loadCurrentUser = async () => {
    try {
      // Get current user data from token
      const authToken = localStorage.getItem('token');
      if (authToken) {
        // Parse JWT token to get user info (simplified approach)
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
        setCurrentUser({
          id: tokenPayload.user_id,
          username: tokenPayload.username,
          email: tokenPayload.email,
          role: tokenPayload.role
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadBlockchainData = async () => {
    if (!isBlockchainConnected) return;

    try {
      // Blockchain-specific data loading here (if any)
      console.log('Blockchain data loaded');
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    }
  };

  const initializeBlockchainConnection = async () => {
    console.log('🔄 Initializing file manager connection...');
    setIsLoadingBlockchain(true);
    try {
      // Get auth token from localStorage or context
      const authToken = localStorage.getItem('token');
      console.log('🔑 Auth token found:', authToken ? 'YES' : 'NO');
      
      if (!authToken) {
        console.error('❌ No auth token found');
        showNotification('error', 'Authentication Required', 'Please login to access file manager');
        return;
      }

      console.log('🚀 Attempting to initialize hybrid service...');
      const result = await hybridFileManagerService.initialize(authToken);
      console.log('📋 Initialization result:', result);
      
      if (result.success) {
        console.log('✅ Service initialized successfully');
        console.log('👤 User data:', result.user);
        
        // Load all data in order after successful authentication
        await loadCurrentUser();  // Load user data
        await loadInstitutionUsers();  // Load users for sharing functionality
        await loadBlockchainFiles();  // Load files from database
        await loadStarredItems(); // Load starred items after files
        await loadSharedWithMe();  // Load shared documents
        await loadTotalFileCounts();  // Load total file counts for Quick Access
        await loadRecentActivities(); // Load recent activities from database
        
        showNotification('success', 'Connected', 'Connected to file manager successfully!');
      } else {
        console.error('❌ Service initialization failed:', result.error);
        showNotification('error', 'Connection Failed', `Failed to connect: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 File manager connection error:', error);
      showNotification('error', 'Connection Error', 'Failed to connect to file manager');
    } finally {
      setIsLoadingBlockchain(false);
    }
  };

  // Load files from hybrid service (database + blockchain)
  const loadBlockchainFiles = async () => {
    console.log('🔄 loadBlockchainFiles called');
    console.log('🔍 Loading files for folder:', currentFolderId);
    console.log('🔍 Current path:', currentPath);
    
    try {
      // Load folders for current directory
      const foldersResult = await hybridFileManagerService.getFolders(currentFolderId);
      console.log('📁 Folders result:', foldersResult);
      
      // Load documents for current directory  
      const documentsResult = await hybridFileManagerService.getDocuments(currentFolderId);
      console.log('📄 Documents result:', documentsResult);
      
      if (foldersResult.success && documentsResult.success) {
        const allFiles = [];
        
        // Add folders from current directory
        foldersResult.folders.forEach(folder => {
          console.log('📁 Adding folder:', folder);
          // Use updatedAt (last modified) if available, otherwise fallback to createdAt
          const folderDate = folder.updatedAt || folder.updated_at || folder.createdAt || folder.created_at;
          const itemCount = (folder.documentCount || 0) + (folder.subfolderCount || 0);
          
          allFiles.push({
            id: folder.id,
            name: folder.name,
            type: 'folder',
            size: itemCount > 0 ? `${itemCount} items` : 'Empty',
            modified: formatDate(folderDate),
            date: folderDate,
            owner: 'You',
            shared: folder.isShared || false,
            path: folder.path || `${currentPath}${folder.name}/`,
            parentPath: currentPath, // Add parentPath for filtering
            parentId: folder.parentId || folder.parent_id, // Support both camelCase and snake_case
            isStarred: false,
            isShared: folder.isShared || false
          });
        });
        
        // Add documents from current directory
        documentsResult.documents.forEach(doc => {
          console.log('📄 Adding document:', doc);
          console.log('📄 Document RAW properties:', {
            documentId: doc.documentId,
            document_id: doc.document_id,
            ipfsHash: doc.ipfsHash,
            ipfs_hash: doc.ipfs_hash,
            folderId: doc.folderId,
            folder_id: doc.folder_id
          });
          console.log('📄 Document folderId:', doc.folderId || doc.folder_id, 'vs currentFolderId:', currentFolderId);
          
          const fileType = getFileTypeFromMime(doc.documentType || doc.document_type);
          const docDate = doc.createdAt || doc.created_at;
          const docSize = doc.fileSize || doc.file_size;
          
          const fileObj = {
            id: doc.id,
            name: doc.fileName || doc.file_name,
            type: fileType,
            size: formatFileSize(docSize),
            modified: formatDate(docDate),
            date: docDate,
            owner: 'You',
            shared: doc.isShared || false, // Check if document is shared from backend
            folderId: doc.folderId || doc.folder_id, // Support both camelCase and snake_case
            documentId: doc.documentId || doc.document_id, // Blockchain document ID
            ipfsHash: doc.ipfsHash || doc.ipfs_hash,
            transactionHash: doc.transactionHash || doc.transaction_hash,
            blockNumber: doc.blockNumber || doc.block_number,
            isStarred: false,
            isShared: false
          };
          
          console.log('📄 Created file object with documentId:', fileObj.documentId);
          allFiles.push(fileObj);
        });

        console.log('📋 All files to display:', allFiles);
        console.log('📋 Total files found:', allFiles.length);
        
        // Update state for existing UI components
        setFileSystem(allFiles);
        setBlockchainFiles(documentsResult.documents);
        setBlockchainFolders(foldersResult.folders);
        
        console.log('✅ File system loaded for current directory:', { 
          currentFolderId, 
          folders: foldersResult.folders.length, 
          documents: documentsResult.documents.length 
        });
      } else {
        console.error('Failed to load file system:', foldersResult.error || documentsResult.error);
        showNotification('error', 'Load Failed', foldersResult.error || documentsResult.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showNotification('error', 'Load Error', 'Failed to load files');
    }
  };

  // Load starred items from API
  const loadStarredItems = async () => {
    try {
      const [documentsResult, foldersResult] = await Promise.all([
        getStarredDocuments(),
        getStarredFolders()
      ]);
      
      const starredIds = [];
      
      if (documentsResult.success && documentsResult.documents) {
        documentsResult.documents.forEach(doc => {
          starredIds.push(doc.id);
          // Update the document in blockchainFiles if it exists
          setBlockchainFiles(prev => prev.map(f => 
            f.id === doc.id ? { ...f, isStarred: true } : f
          ));
        });
      }
      
      if (foldersResult.success && foldersResult.folders) {
        foldersResult.folders.forEach(folder => {
          starredIds.push(folder.id);
          // Update the folder in blockchainFolders if it exists
          setBlockchainFolders(prev => prev.map(f => 
            f.id === folder.id ? { ...f, isStarred: true } : f
          ));
        });
      }
      
      setStarredItems(starredIds);
      console.log('✅ Loaded starred items:', starredIds.length);
    } catch (error) {
      console.error('Error loading starred items:', error);
    }
  };

  // Load recent activities from API
  const loadRecentActivities = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No auth token - skipping recent activities load');
        return;
      }
      
      const result = await getRecentActivities(20);
      
      if (result.success && result.activities) {
        setRecentItems(result.activities);
        console.log('✅ Loaded recent activities:', result.activities.length);
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
      // Don't show error notification - this is a background load
    }
  };

  // Load total file counts for Quick Access cards
  const loadTotalFileCounts = async () => {
    try {
      console.log('📊 Loading total file counts...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No auth token - skipping file counts load');
        return;
      }
      
      // Fetch ALL documents recursively from all folders
      const documentsResult = await hybridFileManagerService.getDocuments(null, true);
      
      if (documentsResult.success && documentsResult.documents) {
        const allDocs = documentsResult.documents;
        
        const counts = {
          documents: 0,
          images: 0,
          videos: 0
        };
        
        allDocs.forEach(doc => {
          const fileType = getFileTypeFromMime(doc.documentType || doc.document_type);
          
          // Count by type (getFileTypeFromMime returns: 'pdf', 'doc', 'sheet', 'image', 'video', 'audio', 'other')
          if (fileType === 'pdf' || fileType === 'doc' || fileType === 'sheet') {
            counts.documents++;
          } else if (fileType === 'image') {
            counts.images++;
          } else if (fileType === 'video') {
            counts.videos++;
          }
        });
        
        setTotalFileCounts(counts);
        console.log('✅ Total file counts loaded:', counts);
      }
    } catch (error) {
      console.error('Error loading total file counts:', error);
    }
  };

  // Helper function to convert MIME type to file type
  const getFileTypeFromMime = (mimeType) => {
    if (!mimeType) return 'other';
    
    const mime = mimeType.toLowerCase();
    
    // Document types
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('word') || mime.includes('msword') || mime.includes('doc')) return 'doc';
    if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('sheet')) return 'sheet';
    
    // Image types - check for common image MIME types
    if (mime.includes('image')) return 'image';
    if (mime.includes('jpg') || mime.includes('jpeg') || mime.includes('png') || 
        mime.includes('gif') || mime.includes('svg') || mime.includes('bmp') || 
        mime.includes('webp') || mime.includes('ico')) return 'image';
    
    // Video types - check for common video MIME types
    if (mime.includes('video')) return 'video';
    if (mime.includes('mp4') || mime.includes('avi') || mime.includes('mov') || 
        mime.includes('wmv') || mime.includes('flv') || mime.includes('webm') || 
        mime.includes('mkv') || mime.includes('mpeg')) return 'video';
    
    // Audio types
    if (mime.includes('audio')) return 'audio';
    if (mime.includes('mp3') || mime.includes('wav') || mime.includes('ogg')) return 'audio';
    
    return 'other';
  };

  // Organize folders for existing UI structure
  const organizeFoldersForUI = (folders) => {
    const organized = {};
    folders.forEach(folder => {
      const path = folder.path || '/';
      if (!organized[path]) {
        organized[path] = { folders: [], files: [] };
      }
      organized[path].folders.push({
        id: folder.id,
        name: folder.name,
        type: 'folder'
      });
    });
    return organized;
  };
  // Filter files based on search term
  const filterFiles = (files) => {
    if (!files || !Array.isArray(files)) return [];
    if (!searchTerm.trim()) return files;
    
    return files.filter(file => 
      (file.name && file.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.type && file.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.owner && file.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.hash && file.hash.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get all files recursively from all folders (for Quick Access filtering)
  const getAllFilesRecursively = async () => {
    try {
      console.log('🔍 Fetching ALL files from ALL folders for filtering...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No auth token - cannot fetch files');
        return [];
      }
      
      // Fetch ALL documents recursively from all folders
      const documentsResult = await hybridFileManagerService.getDocuments(null, true);
      
      if (documentsResult.success && documentsResult.documents) {
        const allFiles = documentsResult.documents.map(doc => {
          const fileType = getFileTypeFromMime(doc.documentType || doc.document_type);
          const docDate = doc.createdAt || doc.created_at;
          const docSize = doc.fileSize || doc.file_size;
          
          // Debug: Log file type detection
          console.log(`📄 File: ${doc.fileName || doc.file_name}, MIME: ${doc.documentType || doc.document_type}, Detected Type: ${fileType}`);
          
          return {
            id: doc.id,
            name: doc.fileName || doc.file_name,
            type: fileType,
            size: formatFileSize(docSize),
            modified: formatDate(docDate),
            date: docDate,
            owner: 'You',
            shared: false,
            folderId: doc.folderId || doc.folder_id,
            documentId: doc.documentId || doc.document_id,
            ipfsHash: doc.ipfsHash || doc.ipfs_hash,
            transactionHash: doc.transactionHash || doc.transaction_hash,
            blockNumber: doc.blockNumber || doc.block_number,
            isStarred: false,
            isShared: false
          };
        });
        
        console.log(`✅ Fetched ${allFiles.length} files from all folders`);
        return allFiles;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching all files:', error);
      return [];
    }
  };

  // Get current files and folders
  const getCurrentFiles = () => {
    console.log('🔍 getCurrentFiles called, currentPath:', currentPath);
    console.log('🔍 currentFolderId:', currentFolderId);
    console.log('🔍 filteredView:', filteredView);
    console.log('🔍 fileSystem contents:', fileSystem);
    
    // If we're in a filtered view (Documents, Images, Videos), show ALL files of that type
    if (filteredView && filteredFiles.length > 0) {
      let filtered = [];
      switch(filteredView) {
        case 'documents':
          // Filter for PDF, DOC, SHEET types
          filtered = filteredFiles.filter(file => 
            file.type === 'pdf' || file.type === 'doc' || file.type === 'sheet'
          );
          break;
        case 'images':
          // Filter for IMAGE type
          filtered = filteredFiles.filter(file => file.type === 'image');
          break;
        case 'videos':
          // Filter for VIDEO type
          filtered = filteredFiles.filter(file => file.type === 'video');
          break;
        default:
          filtered = filteredFiles;
      }
      
      console.log(`🔍 Filtered view (${filteredView}) returning ${filtered.length} files from ${filteredFiles.length} total files`);
      return filtered;
    }
    
    // DEBUG: Log each item in fileSystem to see what we have
    if (fileSystem && Array.isArray(fileSystem)) {
      console.log('🔍 DEBUGGING fileSystem items:');
      fileSystem.forEach((item, index) => {
        console.log(`  [${index}] Type: ${item.type}, Name: ${item.name}, folderId: ${item.folderId}, parentId: ${item.parentId}`);
      });
    }
    
    let items = [];
    
    // Use unified fileSystem array
    if (fileSystem && Array.isArray(fileSystem)) {
      items = fileSystem.filter(item => {
        console.log(`🔍 Filtering item: ${item.name} (type: ${item.type})`);
        
        const isFolder = item.type === 'folder';
        const isFile = !isFolder; // Anything that's not a folder is a file
        
        // For root level (currentPath === '/' and currentFolderId is null)
        if (currentPath === '/' && !currentFolderId) {
          console.log(`  → Root level check for ${item.name}`);
          // Show folders that have no parent (root folders)
          if (isFolder) {
            const include = !item.parentId || item.parentId === null;
            console.log(`  → Folder ${item.name}: parentId=${item.parentId}, include=${include}`);
            return include;
          }
          // Show files that have no folder assignment
          if (isFile) {
            const include = !item.folderId || item.folderId === null;
            console.log(`  → File ${item.name}: folderId=${item.folderId}, include=${include}`);
            return include;
          }
        } else {
          console.log(`  → Specific folder check for ${item.name}, looking for currentFolderId: ${currentFolderId}`);
          // For specific folder levels
          if (isFolder) {
            const include = item.parentId === currentFolderId;
            console.log(`  → Folder ${item.name}: parentId=${item.parentId} === currentFolderId=${currentFolderId}? ${include}`);
            return include;
          }
          if (isFile) {
            // Special case: For Received/Sent folders, ALL files in fileSystem should be shown
            // because the backend already handles the filtering for shared documents
            const currentFolderInStack = folderStack[folderStack.length - 1];
            const isSpecialFolder = currentFolderInStack && 
              (currentFolderInStack.name === 'Received' || currentFolderInStack.name === 'Sent');
            
            if (isSpecialFolder) {
              console.log(`  → File ${item.name}: In ${currentFolderInStack.name} folder, showing ALL files from backend`);
              return true; // Show all files returned by backend for special folders
            }
            
            const include = item.folderId === currentFolderId;
            console.log(`  → File ${item.name}: folderId=${item.folderId} === currentFolderId=${currentFolderId}? ${include}`);
            return include;
          }
        }
        console.log(`  → Default false for ${item.name}`);
        return false;
      });
    }
    
    console.log('🔍 getCurrentFiles returning items:', items);
    console.log('🔍 Number of items to display:', items.length);
    return items;
  };

  // Get all starred files from the blockchain data
  const getStarredFiles = () => {
    let starredFiles = [];
    
    try {
      // Use fileSystem array which has properly formatted data (name, size, modified, owner, etc.)
      if (fileSystem && Array.isArray(fileSystem)) {
        starredFiles = fileSystem.filter(item => 
          item && starredItems.includes(item.id)
        );
      } else {
        // Fallback: Check starred folders and files from blockchain data
        if (blockchainFolders && Array.isArray(blockchainFolders)) {
          const folders = blockchainFolders
            .filter(folder => folder && starredItems.includes(folder.id))
            .map(folder => ({
              id: folder.id,
              name: folder.name,
              type: 'folder',
              size: ((folder.documentCount || 0) + (folder.subfolderCount || 0)) > 0 
                ? `${(folder.documentCount || 0) + (folder.subfolderCount || 0)} items` 
                : 'Empty',
              modified: formatDate(folder.updatedAt || folder.updated_at || folder.createdAt || folder.created_at),
              owner: 'You',
              isStarred: true,
              isShared: folder.isShared || false
            }));
          starredFiles.push(...folders);
        }
        
        // Check starred files  
        if (blockchainFiles && Array.isArray(blockchainFiles)) {
          const files = blockchainFiles
            .filter(file => file && starredItems.includes(file.id))
            .map(file => ({
              id: file.id,
              name: file.fileName || file.file_name,
              type: getFileTypeFromMime(file.documentType || file.document_type),
              size: formatFileSize(file.fileSize || file.file_size),
              modified: formatDate(file.createdAt || file.created_at),
              owner: 'You',
              documentId: file.documentId || file.document_id,
              ipfsHash: file.ipfsHash || file.ipfs_hash,
              isStarred: true,
              isShared: false
            }));
          starredFiles.push(...files);
        }
      }
    } catch (error) {
      console.error('Error getting starred files:', error);
    }
    
    return starredFiles;
  };

  // Combined filtering and sorting
  const getProcessedFiles = (files) => {
    return sortFiles(filterByType(filterFiles(files)));
  };





  const getFileIcon = (type) => {
    const icons = {
      pdf: 'ri-file-pdf-line',
      doc: 'ri-file-word-line',
      sheet: 'ri-file-excel-line',
      image: 'ri-image-line',
      video: 'ri-video-line',
      folder: 'ri-folder-line'
    };
    return icons[type] || 'ri-file-3-line';
  };

  const handleSectionChange = async (section) => {
    setCurrentSection(section);
    // Clear selection when switching sections
    setSelectedFiles([]);
    
    // Load trash items if switching to trash section
    if (section === 'section-trash') {
      await loadTrashItems();
    }
  };

  // Load trash items
  const loadTrashItems = async () => {
    try {
      const authToken = localStorage.getItem('token');
      
      // Load trashed folders
      const foldersResponse = await axios.get('http://localhost:5000/api/folders/trash', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Load trashed documents
      const docsResponse = await axios.get('http://localhost:5000/api/documents/trash', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Combine and format trash items
      const trashedFolders = (foldersResponse.data.folders || []).map(folder => ({
        ...folder,
        type: 'folder',
        name: folder.name,
        modified: folder.trashDate || folder.trash_date || folder.updatedAt || folder.updated_at,
        deletedDate: formatDate(folder.trashDate || folder.trash_date || folder.updatedAt || folder.updated_at),
        size: '-',
        originalPath: folder.path || folder.parent_path || '/'
      }));
      
      const trashedDocs = (docsResponse.data.documents || []).map(doc => ({
        ...doc,
        type: doc.documentType || doc.document_type || 'file',
        name: doc.fileName || doc.file_name,
        modified: doc.trashDate || doc.trash_date || doc.updatedAt || doc.updated_at,
        deletedDate: formatDate(doc.trashDate || doc.trash_date || doc.updatedAt || doc.updated_at),
        size: doc.fileSize || doc.file_size,
        originalPath: doc.folder_path || doc.folderPath || '/'
      }));
      
      setTrashedItems([...trashedFolders, ...trashedDocs]);
      
    } catch (error) {
      console.error('Error loading trash:', error);
      showNotification('error', 'Load Failed', 'Failed to load trash items');
    }
  };

  // Load documents shared with me
  const loadSharedWithMe = async () => {
    try {
      const authToken = localStorage.getItem('token');
      
      console.log('📥 Loading documents shared with me...');
      
      const response = await axios.get('http://localhost:5000/api/shares/shared-with-me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      console.log('✅ Shared documents response:', response.data);
      
      if (response.data.success) {
        const sharedDocs = (response.data.documents || []).map(doc => ({
          ...doc,
          type: doc.documentType || doc.document_type || 'file',
          name: doc.fileName || doc.file_name,
          modified: doc.shared_at || doc.updatedAt || doc.updated_at,
          size: doc.fileSize || doc.file_size,
          owner: doc.shared_by?.username || doc.shared_by?.email || 'Unknown',
          isShared: true
        }));
        
        setSharedWithMeItems(sharedDocs);
        
        // Don't automatically add to recent - only add when user actually opens the file
        
        console.log(`✅ Loaded ${sharedDocs.length} shared documents`);
      }
      
    } catch (error) {
      console.error('❌ Error loading shared documents:', error);
      showNotification('error', 'Load Failed', 'Failed to load shared documents');
    }
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Helper function to add recent activity
  const addRecentActivity = useCallback((fileId, fileName, action, fileType = 'file', additionalData = {}) => {
    const newItem = {
      fileId: fileId,
      id: fileId, // Add id for consistency
      name: fileName,
      action: action, // 'uploaded', 'updated', 'opened', 'received', 'created', 'folder-opened'
      time: new Date().toISOString(),
      type: fileType,
      // Store additional data like size, owner, etc.
      size: additionalData.size || 'Unknown',
      owner: additionalData.owner || 'You',
      modified: additionalData.modified || new Date().toISOString(),
      ...additionalData // Include any other data passed
    };
    
    // Update local state
    setRecentItems(prev => {
      // Remove any existing entry for this file/folder
      const filtered = prev.filter(item => item.fileId !== fileId);
      // Add new entry at the beginning and keep only last 20 items
      return [newItem, ...filtered].slice(0, 20);
    });
    
    // Save to database via API
    addRecentActivityAPI({
      fileId: fileId,
      fileName: fileName,
      action: action,
      fileType: fileType,
      size: additionalData.size,
      owner: additionalData.owner,
      documentId: additionalData.documentId,
      ipfsHash: additionalData.ipfsHash
    }).catch(error => {
      console.error('Failed to save recent activity to database:', error);
    });
  }, []);

  // Get file extension helper
  const getFileExtension = (filename) => {
    if (!filename) return 'file';
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(ext)) return 'video';
    return 'file';
  };

  // Format time ago helper
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get activity icon and color
  const getActivityIcon = (action) => {
    const icons = {
      'uploaded': { icon: 'ri-upload-cloud-line', color: '#10b981' },
      'updated': { icon: 'ri-refresh-line', color: '#3b82f6' },
      'opened': { icon: 'ri-eye-line', color: '#6366f1' },
      'received': { icon: 'ri-share-forward-line', color: '#8b5cf6' },
      'created': { icon: 'ri-add-circle-line', color: '#f59e0b' },
      'folder-opened': { icon: 'ri-folder-open-line', color: '#f59e0b' }
    };
    return icons[action] || { icon: 'ri-file-line', color: '#6b7280' };
  };

  // Utility Functions
  const getFileColor = (type) => {
    const colors = {
      pdf: '#b42318',
      doc: '#2563eb',
      sheet: '#059669',
      image: '#7c3aed',
      video: '#dc2626',
      folder: '#f59e0b'
    };
    return colors[type] || currentTheme.primary;
  };

  const getFileTypeName = (type) => {
    const names = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      sheet: 'Spreadsheet',
      image: 'Image',
      video: 'Video'
    };
    return names[type] || 'File';
  };

  // Generate quick access data based on total file counts
  const getQuickAccessItems = () => {
    // Use cached total counts instead of current folder files
    const recentCount = Array.isArray(recentItems) ? recentItems.length : 0;
    const starredCount = Array.isArray(starredItems) ? starredItems.length : 0;
    const sharedCount = Array.isArray(sharedWithMeItems) ? sharedWithMeItems.length : 0;
    
    return [
      { id: 1, name: 'Documents', icon: 'ri-file-text-line', count: totalFileCounts.documents },
      { id: 2, name: 'Images', icon: 'ri-image-line', count: totalFileCounts.images },
      { id: 3, name: 'Videos', icon: 'ri-video-line', count: totalFileCounts.videos },
      { id: 4, name: 'Shared', icon: 'ri-share-line', count: sharedCount },
      { id: 5, name: 'Recent', icon: 'ri-time-line', count: recentCount },
      { id: 6, name: 'Starred', icon: 'ri-star-line', count: starredCount }
    ];
  };

  // Handle Quick Access card clicks
  const handleQuickAccessClick = async (itemName) => {
    console.log('🎯 Quick Access clicked:', itemName);
    
    switch(itemName.toLowerCase()) {
      case 'documents':
        setFilteredView('documents');
        setCurrentSection('section-all');
        // Reset folder navigation to show all files
        setCurrentFolderId(null);
        setCurrentPath('/');
        setFolderStack([{id: null, name: 'Home', path: '/'}]);
        // Load all files from all folders
        const allDocsFiles = await getAllFilesRecursively();
        setFilteredFiles(allDocsFiles);
        showNotification('info', 'Documents Filter', 'Loading all documents from all folders...');
        break;
        
      case 'images':
        setFilteredView('images');
        setCurrentSection('section-all');
        setCurrentFolderId(null);
        setCurrentPath('/');
        setFolderStack([{id: null, name: 'Home', path: '/'}]);
        // Load all files from all folders
        const allImageFiles = await getAllFilesRecursively();
        setFilteredFiles(allImageFiles);
        showNotification('info', 'Images Filter', 'Loading all images from all folders...');
        break;
        
      case 'videos':
        setFilteredView('videos');
        setCurrentSection('section-all');
        setCurrentFolderId(null);
        setCurrentPath('/');
        setFolderStack([{id: null, name: 'Home', path: '/'}]);
        // Load all files from all folders
        const allVideoFiles = await getAllFilesRecursively();
        setFilteredFiles(allVideoFiles);
        showNotification('info', 'Videos Filter', 'Loading all videos from all folders...');
        break;
        
      case 'shared':
        setFilteredView(null);
        setFilteredFiles([]);
        setCurrentSection('section-shared');
        showNotification('info', 'Shared Files', 'Showing files shared with you');
        break;
        
      case 'recent':
        setFilteredView(null);
        setFilteredFiles([]);
        setCurrentSection('section-recent');
        showNotification('info', 'Recent Files', 'Showing your recent activity');
        break;
        
      case 'starred':
        setFilteredView(null);
        setFilteredFiles([]);
        setCurrentSection('section-starred');
        showNotification('info', 'Starred Items', 'Showing your starred items');
        break;
        
      default:
        console.warn('Unknown Quick Access item:', itemName);
    }
  };

  const showNotification = useCallback((type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Context Menu Functions
  const showContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item: item,
      type: type
    });
  };

  const hideContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null, type: 'file' });
  };

  const handleContextAction = (action) => {
    const { item, type } = contextMenu;
    
    switch(action) {
      case 'open':
        if (type === 'file') {
          openFile(item);
        } else {
          showNotification('info', 'Folder Opened', `Opening ${item.name} folder`);
        }
        break;
      case 'share':
        if (type === 'file') {
          shareFile(item);
        } else {
          showNotification('info', 'Share Folder', `Sharing ${item.name} folder`);
        }
        break;
      case 'copy':
        setClipboard({ items: [item], action: 'copy' });
        showNotification('success', 'Copied', `${item.name} copied to clipboard`);
        break;
      case 'move':
        setClipboard({ items: [item], action: 'move' });
        showNotification('info', 'Cut', `${item.name} cut to clipboard`);
        break;
      case 'rename':
        setRenameItem(item);
        setNewName(item.name);
        break;
      case 'delete':
        handleDelete(item);
        break;
      case 'download':
        downloadFile(item);
        break;
      case 'star':
        toggleStar(item);
        break;
      case 'details':
        handleSingleClick(item);
        break;
      case 'version':
        setCurrentFile(item);
        setIsVersionModalOpen(true);
        loadVersionHistory(item);
        break;
      case 'update':
        handleUpdateFile(item);
        break;
      case 'paste':
        handlePaste();
        break;
      case 'refresh':
        loadBlockchainFiles();
        showNotification('success', 'Refreshed', 'File list refreshed');
        break;
      default:
        break;
    }
    hideContextMenu();
  };

  // Paste functionality
  const handlePaste = async () => {
    if (clipboard.items.length === 0) {
      showNotification('warning', 'No Items', 'No items in clipboard to paste');
      return;
    }
    
    try {
      for (const item of clipboard.items) {
        if (item.type === 'folder') {
          if (clipboard.action === 'copy') {
            // Copy folder - create new folder with same name
            const response = await axios.post('http://localhost:5000/api/folders/', {
              name: `${item.name} (Copy)`,
              parent_id: currentFolderId,
              path: currentPath
            }, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('Folder copied:', response.data);
          } else if (clipboard.action === 'move') {
            // Move folder - update parent_id
            const response = await axios.put(`http://localhost:5000/api/folders/${item.id}`, {
              parent_id: currentFolderId,
              path: currentPath
            }, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('Folder moved:', response.data);
          }
        } else {
          // Handle file copy/move
          if (clipboard.action === 'move') {
            // Move file - update folder_id
            const response = await axios.put(`http://localhost:5000/api/documents/${item.id}`, {
              folder_id: currentFolderId
            }, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('File moved:', response.data);
          } else if (clipboard.action === 'copy') {
            // Copy file - use copy endpoint
            const response = await axios.post(`http://localhost:5000/api/documents/${item.id}/copy`, {
              folder_id: currentFolderId
            }, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('File copied:', response.data);
          }
        }
      }
      
      const actionText = clipboard.action === 'copy' ? 'copied' : 'moved';
      const itemCount = clipboard.items.length;
      
      showNotification('success', 'Paste Complete', 
        `${itemCount} item(s) ${actionText} successfully`);
      
      // Clear clipboard if it was a move operation
      if (clipboard.action === 'move') {
        setClipboard({ items: [], action: null });
      }
      
      // Reload blockchain data
      await loadBlockchainFiles();
    } catch (error) {
      console.error('Error pasting items:', error);
      showNotification('error', 'Paste Failed', error.response?.data?.message || 'Failed to paste items');
    }
  };

  // Delete functionality for blockchain files
  const handleDelete = (item) => {
    setDeleteItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === 'folder') {
        // Delete folder via backend API
        const response = await axios.delete(`http://localhost:5000/api/folders/${deleteItem.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          showNotification('success', 'Deleted', `Folder "${deleteItem.name}" deleted successfully`);
          // Reload files
          await loadBlockchainFiles();
        }
      } else {
        // Delete file via backend API
        const response = await axios.delete(`http://localhost:5000/api/documents/${deleteItem.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          showNotification('success', 'Deleted', `File "${deleteItem.name}" deleted successfully`);
          // Reload files
          await loadBlockchainFiles();
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      console.error('Error response:', error.response?.data);
      showNotification('error', 'Delete Failed', error.response?.data?.error || error.response?.data?.message || 'Failed to delete item');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
    }
  };

  // Load version history from database API
  const loadVersionHistory = async (file) => {
    console.log('📜 Loading version history for:', file.name);
    
    if (!file.id) {
      console.warn('⚠️ No document ID found for file');
      showNotification('warning', 'No Version History', 'Document ID not found');
      return;
    }

    try {
      showNotification('info', 'Loading...', 'Fetching version history from database...');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/documents/${file.id}/versions`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success && response.data.versions.length > 0) {
        // Format versions for display
        const formattedVersions = response.data.versions.map(v => ({
          version: v.versionNumber,
          action: v.description || 'File updated',
          user: file.owner || 'You',
          date: v.createdAt,
          size: formatFileSize(v.fileSize),
          ipfsHash: v.ipfsHash,
          fileName: v.fileName,
          fileSize: v.fileSize,
          isCurrent: v.isCurrent
        }));

        setVersionHistory({
          ...versionHistory,
          [file.id]: formattedVersions
        });

        showNotification('success', 'Loaded', `Found ${formattedVersions.length} versions`);
      } else {
        console.log('⚠️ No versions found');
        setVersionHistory({
          ...versionHistory,
          [file.id]: []
        });
        showNotification('info', 'No History', 'No version history available for this file');
      }
    } catch (error) {
      console.error('❌ Error loading version history:', error);
      showNotification('error', 'Load Failed', 'Failed to load version history');
    }
  };

  // Show version history modal
  const handleShowVersionHistory = async (file) => {
    setCurrentFile(file);
    setIsVersionModalOpen(true);
    await loadVersionHistory(file);
  };

  // Update file functionality for blockchain
  const handleUpdateFile = async (file) => {
    console.log('🔄 Update file clicked for:', file);
    console.log('📋 File properties:', {
      id: file.id,
      name: file.name,
      documentId: file.documentId,
      folderId: file.folderId,
      ipfsHash: file.ipfsHash,
      isShared: file.isShared,
      permission: file.permission
    });
    
    // Check if this is a shared document without write permission
    if (file.isShared && file.permission !== 'write') {
      showNotification('error', 'Access Denied', 'You need write permission to update this file.');
      return;
    }
    
    if (!file.documentId && !file.document_id) {
      showNotification('error', 'Update Failed', 'Document ID not found. Please refresh and try again.');
      return;
    }
    
    try {
      // Create a file input for the new version
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      
      input.onchange = async (event) => {
        const newFile = event.target.files[0];
        if (!newFile) {
          console.log('❌ No file selected');
          return;
        }
        
        console.log('📁 New file selected:', newFile.name, newFile.size, 'bytes');
        
        try {
          showNotification('info', 'Uploading...', 'Uploading new version to blockchain...');
          
          // Step 1: Upload new file to IPFS
          console.log('📤 Uploading to IPFS...');
          const ipfsResult = await pinataService.uploadFile(newFile);
          if (!ipfsResult.success) {
            throw new Error(ipfsResult.error || 'IPFS upload failed');
          }
          console.log('✅ IPFS upload successful:', ipfsResult.ipfsHash);
          
          // Step 2: Update document on blockchain (keeps same document_id, creates new version)
          console.log('⛓️ Updating document on blockchain...');
          const docId = file.documentId || file.document_id;
          console.log('📋 Using existing document_id:', docId);
          const blockchainResult = await blockchainServiceV2.updateDocument(
            docId,                     // Existing document ID (bytes32 hash)
            ipfsResult.ipfsHash        // New IPFS hash
          );
          if (!blockchainResult.success) {
            throw new Error(blockchainResult.error || 'Blockchain update failed');
          }
          console.log('✅ Blockchain updated successfully');
          
          // Step 3: Update document in database with new IPFS hash (document_id stays the same)
          console.log('� Updating database...');
          const token = localStorage.getItem('token');
          const updateResponse = await axios.put(
            `http://localhost:5000/api/documents/${file.id}`,
            {
              name: newFile.name,
              ipfs_hash: ipfsResult.ipfsHash,
              file_size: newFile.size,
              file_type: newFile.type
              // document_id stays the same - not updating it
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (updateResponse.data.success) {
            console.log('✅ Database updated successfully');
            const copiesCount = updateResponse.data.copies_updated || 0;
            const message = copiesCount > 0 
              ? `${file.name} updated successfully! All ${copiesCount + 1} copies now show the new version.`
              : `${file.name} updated successfully!`;
            showNotification('success', 'File Updated', message);
            
            // Track recent activity
            addRecentActivity(file.id, newFile.name, 'updated', getFileExtension(newFile.name));
            
            // Reload blockchain files to get updated data
            await loadBlockchainFiles();
            
            // If version history modal is open for this file, reload it
            if (isVersionModalOpen && currentFile && currentFile.id === file.id) {
              console.log('🔄 Reloading version history for updated file...');
              await loadVersionHistory(file);
            }
          } else {
            throw new Error(updateResponse.data.error || 'Database update failed');
          }
        } catch (error) {
          console.error('❌ Error updating file:', error);
          showNotification('error', 'Update Failed', error.message || 'Failed to update file');
        }
      };
      
      input.click();
      console.log('📂 File picker opened');
    } catch (error) {
      console.error('❌ Error initiating file update:', error);
      showNotification('error', 'Update Failed', 'Failed to update file');
    }
  };

  // Rename functionality for blockchain items
  const handleRename = async () => {
    if (!newName.trim() || !renameItem) {
      setRenameItem(null);
      setNewName('');
      return;
    }
    
    // Don't rename if name hasn't changed
    if (newName.trim() === renameItem.name) {
      setRenameItem(null);
      setNewName('');
      return;
    }
    
    try {
      if (renameItem.type === 'folder') {
        // Rename folder via backend API
        const response = await axios.put(`http://localhost:5000/api/folders/${renameItem.id}`, {
          name: newName.trim()
        }, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          showNotification('success', 'Renamed', `Folder renamed to "${newName.trim()}"`);
          await loadBlockchainFiles();
        }
      } else {
        // Rename file via backend API
        const response = await axios.put(`http://localhost:5000/api/documents/${renameItem.id}`, {
          name: newName.trim()
        }, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          showNotification('success', 'Renamed', `File renamed to "${newName.trim()}"`);
          await loadBlockchainFiles();
        }
      }
      
      setRenameItem(null);
      setNewName('');
    } catch (error) {
      console.error('Error renaming item:', error);
      showNotification('error', 'Rename Failed', error.response?.data?.message || 'Failed to rename item');
    }
  };

  // Create new folder/file
  const handleCreateNew = () => {
    setIsCreateFolderModalOpen(true);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      showNotification('error', 'Invalid Name', 'Please enter a folder name');
      return;
    }

    if (!isBlockchainConnected) {
      showNotification('error', 'Not Connected', 'Please connect to the system first');
      return;
    }

    try {
      const result = await hybridFileManagerService.createFolder(
        newFolderName.trim(),
        currentPath,
        getCurrentFolderId()
      );

      if (result.success) {
        await loadBlockchainFiles();
        
        // Track recent activity for folder creation
        if (result.folder && result.folder.id) {
          addRecentActivity(result.folder.id, newFolderName.trim(), 'created', 'folder');
        }
        
        showNotification('success', 'Folder Created', result.message);
        setNewFolderName('');
        setIsCreateFolderModalOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Folder creation error:', error);
      showNotification('error', 'Failed to Create Folder', error.message);
    }
  };

  // Handle file upload with blockchain integration
  const handleFileUpload = async (event) => {
    console.log('🚀 File upload started');
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    console.log('📁 Files selected:', files.map(f => f.name));
    console.log('🔗 Blockchain connected:', isBlockchainConnected);
    console.log('👤 Current user:', currentUser);

    if (!isBlockchainConnected) {
      console.error('❌ Blockchain not connected');
      showNotification('error', 'Blockchain Not Connected', 'Please connect to blockchain first');
      return;
    }

    if (!currentUser) {
      console.error('❌ User not logged in');
      showNotification('error', 'User Not Logged In', 'Please login first');
      return;
    }

    // Validate files before uploading
    const maxSize = 50 * 1024 * 1024; // 50MB
    for (const file of files) {
      const validation = pinataService.validateFile(file, maxSize);
      if (!validation.isValid) {
        console.error('❌ File validation failed:', validation.errors);
        showNotification('error', 'Invalid File', validation.errors.join('. '));
        return;
      }
    }

    setIsProgressModalOpen(true);
    setUploadProgress(0);
    setIsUploadingToBlockchain(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Processing file ${i + 1}/${files.length}: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        const baseProgress = (i / files.length) * 100;
        
        // Step 1: Upload to traditional database (25%)
        console.log('📊 Step 1: Database upload');
        setUploadProgress(baseProgress + 25);
        const metadata = {
          filePath: currentPath,
          description: `Uploaded via DocuChain on ${new Date().toLocaleString()}`,
          tags: 'user-upload,blockchain', // Convert array to comma-separated string
          parentFolderId: getCurrentFolderId() // Keep as UUID or null, don't convert to string
        };

        const result = await hybridFileManagerService.createFile(file, metadata);
        console.log('📊 Database result:', result);
        
        if (!result.success) {
          throw new Error(`Failed to upload ${file.name} to database: ${result.error}`);
        }

        // Step 2: Upload to IPFS via Pinata (50%)
        console.log('🌐 Step 2: IPFS upload');
        setUploadProgress(baseProgress + 50);
        const ipfsResult = await pinataService.uploadFile(file);
        console.log('🌐 IPFS result:', ipfsResult);
        
        if (!ipfsResult.success) {
          throw new Error(`Failed to upload ${file.name} to IPFS: ${ipfsResult.error}`);
        }

        // Step 3: Store metadata on blockchain (75%)
        console.log('⛓️ Step 3: Blockchain upload');
        setUploadProgress(baseProgress + 75);
        
        console.log('⛓️ Blockchain service ready:', blockchainServiceV2.isReady());
        
        console.log('⛓️ Calling uploadDocument with:', {
          fileName: file.name,
          ipfsHash: ipfsResult.ipfsHash,
          fileSize: file.size,
          fileType: file.type
        });

        // Use V2 blockchain upload
        const blockchainResult = await blockchainServiceV2.uploadDocument(
          ipfsResult.ipfsHash,
          file.name,
          file.size,
          file.type || 'document'
        );

        console.log('⛓️ Blockchain result:', blockchainResult);

        if (!blockchainResult.success) {
          throw new Error(`Failed to store ${file.name} on blockchain: ${blockchainResult.error}`);
        }

        // Step 3.5: Update database with blockchain documentId (bytes32 hash)
        console.log('💾 Step 3.5: Saving blockchain documentId to database');
        const documentId = blockchainResult.documentId; // This is the bytes32 hash
        console.log('📝 Blockchain documentId (bytes32):', documentId);
        
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `http://localhost:5000/api/documents/${result.document.id}`,
            {
              document_id: documentId, // Backend expects 'document_id' not 'blockchain_document_id'
              ipfs_hash: ipfsResult.ipfsHash
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ Database updated with blockchain documentId');
        } catch (dbError) {
          console.error('⚠️ Failed to update database with blockchain ID:', dbError);
          // Don't fail the upload, just warn
        }

        // Step 4: Complete (100%)
        setUploadProgress(baseProgress + 100/files.length);
        console.log('✅ File uploaded successfully:', {
          database: result,
          ipfs: ipfsResult,
          blockchain: blockchainResult,
          documentId: documentId
        });
        
        // Track recent activity
        addRecentActivity(result.document.id, file.name, 'uploaded', getFileExtension(file.name));
        
        showNotification('success', 'File Uploaded', `${file.name} uploaded to blockchain successfully!`);
      }

      // Reload files after successful upload
      console.log('🔄 Reloading blockchain files');
      await loadBlockchainFiles();
      await loadTotalFileCounts(); // Update Quick Access counts
    } catch (error) {
      console.error('💥 Upload error:', error);
      showNotification('error', 'Upload Failed', error.message);
    } finally {
      setIsProgressModalOpen(false);
      setUploadProgress(0);
      setIsUploadingToBlockchain(false);
      event.target.value = '';
    }
  };

  // Get current folder ID based on path
  const getCurrentFolderId = () => {
    // Return the current folder ID, null for root/home directory
    return currentFolderId;
  };

  // Navigate into a folder
  const navigateToFolder = (folder) => {
    console.log('🐛 DEBUG: navigateToFolder called with:', folder);
    console.log('🐛 DEBUG: folder properties:', {
      id: folder.id,
      name: folder.name,
      folder_name: folder.folder_name,
      title: folder.title,
      path: folder.path
    });
    
    // Clear any filtered view when navigating into a folder
    if (filteredView) {
      setFilteredView(null);
      setFilteredFiles([]);
      console.log('🔄 Cleared filtered view when navigating into folder');
    }
    
    // Use folder_name if name is undefined
    const folderName = folder.name || folder.folder_name || folder.title || 'Unnamed Folder';
    
    // Track recent activity for folder opening
    addRecentActivity(folder.id, folderName, 'folder-opened', 'folder');
    
    setCurrentFolderId(folder.id);
    setCurrentPath(folder.path || `${currentPath}${folderName}/`);
    setFolderStack(prev => [...prev, {
      id: folder.id,
      name: folderName,
      path: folder.path || `${currentPath}${folderName}/`
    }]);
    // Reload files for the new folder
    loadBlockchainFiles();
  };

  // Navigate back to a folder in the breadcrumb
  const navigateToBreadcrumb = (index) => {
    console.log('🔙 Navigating to breadcrumb index:', index);
    const targetFolder = folderStack[index];
    console.log('🎯 Target folder:', targetFolder);
    setCurrentFolderId(targetFolder.id);
    setCurrentPath(targetFolder.path);
    setFolderStack(prev => prev.slice(0, index + 1));
    // Don't call loadBlockchainFiles here - let useEffect handle it when currentFolderId changes
  };

  // Helper function to determine file type from extension
  const getFileTypeFromExtension = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'xls': 'sheet',
      'xlsx': 'sheet',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video'
    };
    return typeMap[ext] || 'doc';
  };

  // Sort and Filter Functions
  const handleSort = (field) => {
    const direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
    setCurrentSort({ field, direction });
  };

  const sortFiles = (files) => {
    return [...files].sort((a, b) => {
      let aValue = a[currentSort.field];
      let bValue = b[currentSort.field];
      
      if (currentSort.field === 'size') {
        // Convert size strings to numbers for proper sorting
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (currentSort.field === 'modified') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleFilter = (filterType) => {
    setCurrentFilter(filterType);
  };

  const filterByType = (files) => {
    if (currentFilter === 'all') return files;
    return files.filter(file => file.type === currentFilter);
  };

  // File Operations
  const toggleStar = async (file) => {
    try {
      const isFolder = file.type === 'folder';
      const response = isFolder 
        ? await toggleStarFolder(file.id)
        : await toggleStarDocument(file.id);
      
      if (response.success) {
        // Update starred items list
        if (response.isStarred) {
          setStarredItems(prev => [...prev, file.id]);
        } else {
          setStarredItems(prev => prev.filter(id => id !== file.id));
        }
        
        // Update the file/folder in the lists
        if (isFolder) {
          setBlockchainFolders(prev => prev.map(f => 
            f.id === file.id ? { ...f, isStarred: response.isStarred } : f
          ));
        } else {
          setBlockchainFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, isStarred: response.isStarred } : f
          ));
        }
        
        showNotification('success', 'Star Updated', response.message);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      showNotification('error', 'Error', 'Failed to update star status');
    }
  };

  // Single click - show details
  const handleSingleClick = (file) => {
    setCurrentFile(file);
    setIsDetailsModalOpen(true);
  };

  // Double click - open file/folder
  const handleDoubleClick = (file) => {
    console.log('🔍 Double-clicked file:', file);
    
    if (file.type === 'folder') {
      // Navigate into folder
      navigateToFolder(file);
      const folderName = file.name || file.folder_name || file.title || 'Unnamed Folder';
      addRecentActivity(file.id, folderName, 'folder-opened', 'folder', {
        size: file.size || '-',
        owner: file.owner || file.createdBy || 'You',
        modified: file.modified || file.date || file.updatedAt || file.createdAt || new Date().toISOString()
      });
      showNotification('info', 'Folder Opened', `Opened ${folderName} folder`);
    } else {
      // Open file for viewing/editing
      const fileName = file.name || file.fileName || file.file_name || 'Unnamed File';
      const fileSize = file.size || file.fileSize || file.file_size || 'Unknown';
      const fileOwner = file.owner || file.createdBy || file.created_by || 'You';
      const fileModified = file.modified || file.date || file.updatedAt || file.updated_at || file.createdAt || file.created_at || new Date().toISOString();
      
      addRecentActivity(file.id, fileName, 'opened', file.type, {
        size: fileSize,
        owner: fileOwner,
        modified: fileModified,
        documentId: file.documentId || file.document_id,
        ipfsHash: file.ipfsHash || file.ipfs_hash
      });
      setCurrentFile(file);
      setIsFileModalOpen(true);
    }
  };

  // Handle click with timeout for single/double click detection
  const handleFileClick = (file) => {
    if (clickTimeout) {
      // Double click detected
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleDoubleClick(file);
    } else {
      // Start timeout for single click
      const timeout = setTimeout(() => {
        handleSingleClick(file);
        setClickTimeout(null);
      }, 300);
      setClickTimeout(timeout);
    }
  };

  const openFile = (file) => {
    console.log('📂 Opening file:', file);
    
    const fileName = file.name || file.fileName || file.file_name || 'Unnamed File';
    const fileSize = file.size || file.fileSize || file.file_size || 'Unknown';
    const fileOwner = file.owner || file.createdBy || file.created_by || 'You';
    const fileModified = file.modified || file.date || file.updatedAt || file.updated_at || file.createdAt || file.created_at || new Date().toISOString();
    const fileType = file.type || file.documentType || file.document_type || 'file';
    
    addRecentActivity(file.id, fileName, 'opened', fileType, {
      size: fileSize,
      owner: fileOwner,
      modified: fileModified,
      documentId: file.documentId || file.document_id,
      ipfsHash: file.ipfsHash || file.ipfs_hash
    });
    setCurrentFile(file);
    setIsFileModalOpen(true);
  };

  // Share file functionality for blockchain
  // Toggle user selection for sharing
  const toggleUserSelection = (user) => {
    setSelectedRecipients(prev => {
      const isAlreadySelected = prev.find(r => r.id === user.id);
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(r => r.id !== user.id);
      } else {
        // Add with default "read" permission
        return [...prev, { ...user, permission: 'read' }];
      }
    });
  };

  // Search users (filter institutionUsers)
  const searchUsers = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      // Reset to all institution users if search is empty
      loadInstitutionUsers();
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = institutionUsers.filter(user => 
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
    
    // Update the displayed users (could store in separate state if needed)
    setInstitutionUsers(filtered);
  };

  const shareFile = async (file) => {
    try {
      if (file.type === 'folder') {
        // For folders, just open share modal
        setCurrentSharingItems([file]);
        // Load fresh user list
        await loadInstitutionUsers();
        setSelectedRecipients([]);
        setIsShareModalOpen(true);
      } else {
        // For files, implement blockchain-based sharing
        setCurrentSharingItems([file]);
        // Load fresh user list
        await loadInstitutionUsers();
        setSelectedRecipients([]);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      showNotification('error', 'Share Failed', 'Failed to share item');
    }
  };

  // Download file from IPFS
  const downloadFile = async (file) => {
    try {
      if (file.ipfsHash) {
        // Download from IPFS
        const url = `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('success', 'Download Started', 
          `Downloading ${file.name} from IPFS`);
      } else {
        // Fallback for files without IPFS hash
        const content = file.content || `No content available for ${file.name}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      showNotification('error', 'Download Failed', 'Failed to download file');
    }
  };

  // Blockchain-specific functions
  // Use global wallet connect function
  const connectWallet = async () => {
    try {
      console.log('🔗 Connecting wallet via global context...');
      setIsLoadingBlockchain(true);
      
      await connectWalletGlobal();  // Use global connect from WalletContext
      
      showNotification('success', 'Wallet Connected', 
        `Successfully connected to MetaMask!`);
      
      // Blockchain data will be loaded automatically via useEffect watching isWalletConnectedGlobal
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error.message && (error.message.includes('User rejected') || error.message.includes('User denied'))) {
        showNotification('info', 'Connection Cancelled', 'You cancelled the connection request');
      } else if (error.message && error.message.includes('not installed')) {
        showNotification('error', 'MetaMask Not Found', 'Please install MetaMask browser extension');
      } else {
        showNotification('error', 'Connection Error', error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsLoadingBlockchain(false);
    }
  };

  const searchInstitutionUsers = async (searchTerm) => {
    try {
      // Use the existing loadInstitutionUsers function with search term
      await loadInstitutionUsers(searchTerm);
      return institutionUsers;
    } catch (error) {
      console.error('User search error:', error);
      showNotification('error', 'Search Failed', 'Failed to search users');
      return [];
    }
  };

  const shareDocumentOnBlockchain = async (documentId, userAddress, accessType) => {
    try {
      console.log('🔗 shareDocumentOnBlockchain called with:');
      console.log('  documentId:', documentId);
      console.log('  userAddress:', userAddress);
      console.log('  accessType:', accessType);
      
      setIsLoadingBlockchain(true);
      
      // V2 contract: accessType must be "read" or "write" string
      console.log('  Calling blockchainServiceV2.shareDocument...');
      const result = await blockchainServiceV2.shareDocument(documentId, userAddress, accessType);
      console.log('  Blockchain service result:', result);
      
      if (result.success) {
        showNotification('success', 'Document Shared', 'Document shared successfully on blockchain!');
        
        // Return proper object with transaction details
        return {
          success: true,
          transactionHash: result.transactionHash || result.hash,
          blockNumber: result.blockNumber
        };
      } else {
        console.error('  ❌ Blockchain share failed:', result.error);
        showNotification('error', 'Sharing Failed', result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('  ❌ Sharing error:', error);
      showNotification('error', 'Sharing Error', 'Failed to share document');
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsLoadingBlockchain(false);
    }
  };

  const connectWithUser = async (userAddress) => {
    try {
      // In simplified version, users are already available from institution
      // No need for separate connection - just show success
      showNotification('success', 'User Available', 'User is available for sharing!');
      return true;
    } catch (error) {
      console.error('User connection error:', error);
      showNotification('error', 'Connection Error', 'Failed to connect with user');
      return false;
    }
  };

  // Load institution users from database for sharing
  const loadInstitutionUsers = async (searchTerm = '') => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.warn('⚠️ No auth token found');
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/institution`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let users = data.users || [];
        
        // Filter by search term if provided
        if (searchTerm) {
          users = users.filter(user => 
            (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        // Format users for the UI - matching backend response format
        const formattedUsers = users.map(user => ({
          id: user.id,
          username: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          role: user.role,
          department: user.department || 'N/A',
          address: user.walletAddress || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=random`
        }));
        
        console.log(`✅ Loaded ${formattedUsers.length} institution users`);
        setInstitutionUsers(formattedUsers);
      } else {
        console.error('❌ Failed to load institution users:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading institution users:', error);
    }
  };

  // Selection Management
  const toggleItemSelection = (itemId, itemType) => {
    const fullId = `${itemType}_${itemId}`;
    
    setSelectedFiles(prev => {
      if (prev.includes(fullId)) {
        return prev.filter(id => id !== fullId);
      } else {
        return [...prev, fullId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const handleSelectAll = () => {
    const currentItems = getCurrentItems();
    if (selectedFiles.length === currentItems.length) {
      clearSelection();
    } else {
      const allIds = [];
      currentItems.forEach(item => {
        const itemId = item.type === 'folder' ? `folder_${item.path}` : `file_${item.id}`;
        allIds.push(itemId);
      });
      setSelectedFiles(allIds);
    }
  };

  const getCurrentItems = () => {
    return getCurrentFiles(); // Use the blockchain-enabled getCurrentFiles function
  };

  // Navigate back
  const navigateBack = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    setCurrentPath(newPath);
  };

  // Get breadcrumb trail
  const getBreadcrumbs = () => {
    if (currentPath === '/') return [{ name: 'Home', path: '/' }];
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    let path = '';
    parts.forEach(part => {
      path += `/${part}`;
      breadcrumbs.push({ name: part, path });
    });
    return breadcrumbs;
  };

  // Share Modal Functions
  const executeBlockchainShare = async () => {
    console.log('🚀 Starting share execution...');
    console.log('Selected recipients:', selectedRecipients);
    console.log('Current sharing items:', currentSharingItems);
    
    if (selectedRecipients.length === 0) {
      showNotification('warning', 'No Recipients', 'Please select at least one recipient');
      return;
    }

    if (currentSharingItems.length === 0) {
      showNotification('warning', 'No Files', 'Please select files to share');
      return;
    }
    
    setIsProgressModalOpen(true);
    setIsLoadingBlockchain(true);
    
    try {
      let successCount = 0;
      let totalShares = currentSharingItems.length * selectedRecipients.length;
      console.log(`📊 Total shares to process: ${totalShares}`);
      
      for (const item of currentSharingItems) {
        // Normalize file properties (handle both frontend and backend formats)
        const fileName = item.name || item.fileName;
        const fileId = item.id;
        // Backend returns 'document_id' (blockchain documentId - bytes32 hash)
        const blockchainId = item.document_id || item.blockchainId || item.documentId;
        
        console.log(`\n📄 Processing file: ${fileName}`);
        console.log('File data:', item);
        console.log(`  ID: ${fileId}, Blockchain ID: ${blockchainId}`);
        
        // Check if blockchain ID is valid (must be 66 chars starting with 0x)
        const isValidBlockchainId = blockchainId && 
          typeof blockchainId === 'string' && 
          blockchainId.startsWith('0x') && 
          blockchainId.length === 66;
        
        if (!isValidBlockchainId) {
          console.warn(`  ⚠️ Invalid or missing blockchain ID: "${blockchainId}"`);
          console.warn(`  ⚠️ Skipping blockchain share, will only record in database`);
        }
        
        for (const recipient of selectedRecipients) {
          console.log(`  👤 Sharing with: ${recipient.username} (${recipient.email})`);
          console.log('  Recipient data:', recipient);
          
          if (isValidBlockchainId) {
            console.log(`  ✅ File has blockchain ID: ${blockchainId}`);
            
            // Check if recipient has wallet address
            if (!recipient.address) {
              console.warn(`  ⚠️ Recipient ${recipient.username} has no wallet address, skipping blockchain share`);
              // Still record in database
              try {
                const shareResponse = await axios.post(
                  `http://localhost:5000/api/shares/document/${fileId}`,
                  {
                    recipients: [{
                      user_id: recipient.id,
                      permission: recipient.permission
                    }],
                    transaction_hash: null,
                    block_number: null
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (shareResponse.data.success) {
                  console.log(`  ✅ Database share successful (no blockchain)`);
                  successCount++;
                } else {
                  console.error(`  ❌ Database share failed:`, shareResponse.data.error);
                }
              } catch (apiError) {
                console.error(`  ❌ API error:`, apiError.response?.data || apiError.message);
              }
              continue;
            }
            
            // Step 1: Share document on blockchain
            console.log(`  🔗 Sharing on blockchain...`);
            // V2 contract expects "read" or "write" strings (not numbers)
            const accessType = recipient.permission === 'write' ? 'write' : 'read';
            const blockchainResult = await shareDocumentOnBlockchain(
              blockchainId, 
              recipient.address, 
              accessType
            );
            
            if (blockchainResult && blockchainResult.success) {
              console.log(`  ✅ Blockchain share successful:`, blockchainResult);
              
              // Step 2: Record share in database with blockchain reference
              try {
                const shareResponse = await axios.post(
                  `http://localhost:5000/api/shares/document/${fileId}`,
                  {
                    recipients: [{
                      user_id: recipient.id,
                      permission: recipient.permission
                    }],
                    transaction_hash: blockchainResult.transactionHash,
                    block_number: blockchainResult.blockNumber || null
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (shareResponse.data.success) {
                  console.log(`  ✅ Database share successful`);
                  successCount++;
                } else {
                  console.error(`  ❌ Database share failed:`, shareResponse.data.error);
                }
              } catch (apiError) {
                console.error(`  ❌ API error:`, apiError.response?.data || apiError.message);
                // Still count as partial success if blockchain succeeded
                successCount++;
              }
            } else {
              console.error(`  ❌ Blockchain share failed:`, blockchainResult);
            }
          } else {
            // No valid blockchain ID - share only in database
            console.warn(`  ⚠️ No valid blockchain ID - sharing only in database`);
            try {
              const shareResponse = await axios.post(
                `http://localhost:5000/api/shares/document/${fileId}`,
                {
                  recipients: [{
                    user_id: recipient.id,
                    permission: recipient.permission
                  }],
                  transaction_hash: null,
                  block_number: null
                },
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (shareResponse.data.success) {
                console.log(`  ✅ Database share successful (no blockchain)`);
                successCount++;
              } else {
                console.error(`  ❌ Database share failed:`, shareResponse.data.error);
              }
            } catch (apiError) {
              console.error(`  ❌ API error:`, apiError.response?.data || apiError.message);
            }
          }
        }
      }
      
      console.log(`\n📊 Final results: ${successCount}/${totalShares} successful`);
      
      if (successCount > 0) {
        const percentage = Math.round((successCount / totalShares) * 100);
        showNotification('success', 'Share Complete', 
          `Successfully shared ${currentSharingItems.length} item(s) with ${selectedRecipients.length} user(s) (${percentage}% success)`);
        setIsShareModalOpen(false);
        setSelectedRecipients([]);
        setCurrentSharingItems([]);
        
        // Refresh data to show shared status
        await loadBlockchainFiles();
      } else {
        showNotification('error', 'Share Failed', 'Failed to share documents. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Share execution error:', error);
      showNotification('error', 'Share Error', 'An error occurred while sharing');
    } finally {
      setIsProgressModalOpen(false);
      setIsLoadingBlockchain(false);
    }
  };

  const openFileModal = (file) => {
    setCurrentFile(file);
    setIsFileModalOpen(true);
  };

  const closeFileModal = () => {
    setIsFileModalOpen(false);
    setCurrentFile(null);
  };

  const openShareModal = (files = null) => {
    console.log('📂 openShareModal called with:', files);
    
    if (files) {
      let fileObjects = [];
      
      if (Array.isArray(files)) {
        // Handle array of files
        fileObjects = files.map(file => {
          // If it's already an object, use it
          if (typeof file === 'object' && file !== null) {
            return file;
          }
          // If it's an ID, try to find the file
          const foundFile = fileSystem?.files?.find(f => f.id === file) || 
                           blockchainFiles?.find(f => f.id === file);
          return foundFile;
        }).filter(f => f); // Remove any nulls/undefined
      } else {
        // Handle single file
        if (typeof files === 'object' && files !== null) {
          // It's already a file object
          fileObjects = [files];
        } else {
          // It's an ID, try to find it
          const foundFile = fileSystem?.files?.find(f => f.id === files) || 
                           blockchainFiles?.find(f => f.id === files);
          if (foundFile) {
            fileObjects = [foundFile];
          }
        }
      }
      
      // Check if any files are shared documents
      const sharedFiles = fileObjects.filter(f => f.isShared);
      if (sharedFiles.length > 0) {
        showNotification('error', 'Cannot Share', 'You cannot share documents that were shared with you. Only the owner can share these files.');
        return;
      }
      
      console.log('📂 File objects for sharing:', fileObjects);
      setCurrentSharingItems(fileObjects);
      setSelectedFiles(files);
    }
    
    // Load fresh user list
    loadInstitutionUsers();
    setSelectedRecipients([]);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        hideContextMenu();
      }
    };
    
    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // Helper function for context menu item styles
  const getContextMenuItemProps = (action, isDestructive = false) => ({
    onClick: () => handleContextAction(action),
    onMouseEnter: (e) => e.currentTarget.style.backgroundColor = '#f3f4f6',
    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent',
    style: {
      padding: '8px 16px', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      fontSize: '14px', 
      transition: 'background-color 0.15s',
      color: isDestructive ? '#dc2626' : 'inherit'
    }
  });

  return (
    <div className="content">
      <div className="file-manager-content">
        {/* Section Navigation */}
        <div className="section-nav" style={{marginBottom: '24px', borderBottom: '1px solid #e5e5e5', paddingBottom: '16px'}}>
          <div style={{display: 'flex', gap: '24px'}}>
            <button 
              className={`nav-btn ${currentSection === 'section-all' ? 'active' : ''}`}
              onClick={() => handleSectionChange('section-all')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                color: currentSection === 'section-all' ? currentTheme.primary : '#6b7280',
                borderBottom: currentSection === 'section-all' ? `2px solid ${currentTheme.primary}` : 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: currentSection === 'section-all' ? '600' : '400'
              }}>
              <i className="ri-folder-2-line" style={{marginRight: '8px'}}></i> All files
            </button>
            <button 
              className={`nav-btn ${currentSection === 'section-shared' ? 'active' : ''}`}
              onClick={() => handleSectionChange('section-shared')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                color: currentSection === 'section-shared' ? currentTheme.primary : '#6b7280',
                borderBottom: currentSection === 'section-shared' ? `2px solid ${currentTheme.primary}` : 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: currentSection === 'section-shared' ? '600' : '400'
              }}>
              <i className="ri-share-line" style={{marginRight: '8px'}}></i> Shared with me
            </button>
            <button 
              className={`nav-btn ${currentSection === 'section-recent' ? 'active' : ''}`}
              onClick={() => handleSectionChange('section-recent')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                color: currentSection === 'section-recent' ? currentTheme.primary : '#6b7280',
                borderBottom: currentSection === 'section-recent' ? `2px solid ${currentTheme.primary}` : 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: currentSection === 'section-recent' ? '600' : '400'
              }}>
              <i className="ri-time-line" style={{marginRight: '8px'}}></i> Recent
            </button>
            <button 
              className={`nav-btn ${currentSection === 'section-starred' ? 'active' : ''}`}
              onClick={() => handleSectionChange('section-starred')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                color: currentSection === 'section-starred' ? currentTheme.primary : '#6b7280',
                borderBottom: currentSection === 'section-starred' ? `2px solid ${currentTheme.primary}` : 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: currentSection === 'section-starred' ? '600' : '400'
              }}>
              <i className="ri-star-line" style={{marginRight: '8px'}}></i> Starred
            </button>
            <button 
              className={`nav-btn ${currentSection === 'section-trash' ? 'active' : ''}`}
              onClick={() => handleSectionChange('section-trash')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                color: currentSection === 'section-trash' ? currentTheme.primary : '#6b7280',
                borderBottom: currentSection === 'section-trash' ? `2px solid ${currentTheme.primary}` : 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: currentSection === 'section-trash' ? '600' : '400'
              }}>
              <i className="ri-delete-bin-6-line" style={{marginRight: '8px'}}></i> Trash
            </button>
          </div>
        </div>

        {/* Content Header with Search */}
        <div className="content-header" style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            {/* Blockchain Status */}
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: isBlockchainConnected ? '#dcfce7' : '#fee2e2',
                color: isBlockchainConnected ? '#166534' : '#991b1b',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isBlockchainConnected ? '#22c55e' : '#ef4444'
                }}></div>
                {isBlockchainConnected ? 'Blockchain Connected' : 'Blockchain Disconnected'}
              </div>
              
              {!isBlockchainConnected && (
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button
                    onClick={connectWallet}
                    disabled={isLoadingBlockchain}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: currentTheme.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: isLoadingBlockchain ? 'not-allowed' : 'pointer',
                      opacity: isLoadingBlockchain ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="ri-wallet-3-line"></i>
                    {isLoadingBlockchain ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  
                  {/* Install MetaMask link if not detected */}
                  {typeof window.ethereum === 'undefined' && (
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f97316',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
                    >
                      <i className="ri-download-line"></i>
                      Install MetaMask
                    </a>
                  )}
                </div>
              )}
              
              {walletAccount && currentUser && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>{currentUser.username}</span>
                  <span style={{color: '#d1d5db'}}>|</span>
                  <span>{walletAccount.slice(0, 6)}...{walletAccount.slice(-4)}</span>
                </div>
              )}
            </div>
          </div>
            
          <div className="file-search" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{position: 'relative'}}>
              <i className="ri-search-line" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280'}}></i>
              <input 
                type="text"
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '250px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div className="fm-content">
          {/* Quick Access */}
          {currentSection === 'section-all' && (
            <section className="fm-section" id="section-quick">
              <div className="fm-section-head">
                <h3 style={{margin:0}}>Quick access</h3>
                <span className="fm-pill">
                  <i className="ri-pushpin-line"></i> Starred items
                </span>
              </div>
              <div className="fm-qa" id="qaGrid">
                {getQuickAccessItems().map(item => (
                  <div 
                    key={item.id} 
                    className="fm-qa-card"
                    onClick={() => handleQuickAccessClick(item.name)}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="fm-qa-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div>{item.name}</div>
                    <div className="fm-meta">{item.count} items</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All files */}
          {currentSection === 'section-all' && (
            <section className="fm-section" id="section-all">
              <div className="fm-breadcrumb" id="breadcrumb">
                {/* Show filtered view indicator if active */}
                {filteredView && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setFilteredView(null);
                        setFilteredFiles([]);
                        showNotification('info', 'Filter Cleared', 'Showing all files');
                      }}
                    >
                      <i className="ri-home-4-line"></i>
                    </a>
                    <i className="ri-arrow-right-s-line"></i>
                    <span className="fm-current" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#f0f9ff',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      color: '#0ea5e9'
                    }}>
                      <i className={
                        filteredView === 'documents' ? 'ri-file-text-line' :
                        filteredView === 'images' ? 'ri-image-line' :
                        'ri-video-line'
                      }></i>
                      {filteredView.charAt(0).toUpperCase() + filteredView.slice(1)}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setFilteredView(null);
                          setFilteredFiles([]);
                          showNotification('info', 'Filter Cleared', 'Showing all files');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          marginLeft: '4px',
                          color: '#0ea5e9',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <i className="ri-close-circle-line"></i>
                      </button>
                    </span>
                  </>
                )}
                
                {/* Regular breadcrumbs when not in filtered view */}
                {!filteredView && getBreadcrumbs().map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.path}>
                    {index > 0 && <i className="ri-arrow-right-s-line"></i>}
                    {index === getBreadcrumbs().length - 1 ? (
                      <span className="fm-current">{breadcrumb.name}</span>
                    ) : (
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (index === 0) {
                            // Navigate to home - reset to root
                            console.log('🏠 Navigating to Home - resetting to root');
                            console.log('🏠 Before reset - currentFolderId:', currentFolderId, 'currentPath:', currentPath);
                            setCurrentFolderId(null);
                            setCurrentPath('/');
                            setFolderStack([{id: null, name: 'Home', path: '/'}]);
                            setFilteredView(null); // Also clear any filtered view
                            setFilteredFiles([]);
                            // useEffect will handle reloading files when currentFolderId changes
                          } else {
                            // Use navigateToBreadcrumb for non-home breadcrumbs
                            navigateToBreadcrumb(index);
                          }
                        }}
                        data-path={breadcrumb.path}
                      >
                        {index === 0 ? <i className="ri-home-4-line"></i> : breadcrumb.name}
                      </a>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Selection Bar */}
              {selectedFiles.length > 0 && (
                <div className="fm-selection-bar fm-show" id="selectionBar">
                  <div className="fm-selection-info" id="selectionInfo">
                    {selectedFiles.length} items selected
                  </div>
                  <div className="fm-bulk-actions">
                    <button className="fm-btn" onClick={() => openShareModal(selectedFiles)}>
                      <i className="ri-share-line"></i> Share Selected
                    </button>
                    <button className="fm-btn">
                      <i className="ri-download-2-line"></i> Download
                    </button>
                    <button className="fm-btn">
                      <i className="ri-drive-line"></i> Move
                    </button>
                    <button className="fm-btn fm-danger">
                      <i className="ri-delete-bin-line"></i> Delete
                    </button>
                    <button className="fm-btn fm-ghost" onClick={() => setSelectedFiles([])}>
                      <i className="ri-close-line"></i> Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="fm-section-head">
                <h3 style={{margin:0}}>Folders & files</h3>
                <div className="fm-spacer"></div>

                <div className="fm-switch" id="viewSwitch">
                  <button 
                    data-view="grid" 
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}>
                    <i className="ri-grid-line"></i>
                  </button>
                  <button 
                    data-view="list" 
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}>
                    <i className="ri-list-check-2"></i>
                  </button>
                </div>

                <div className="fm-dropdown" style={{position: 'relative'}}>
                  <select 
                    onChange={(e) => handleSort(e.target.value)}
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}>
                    <option value="name">Sort by Name</option>
                    <option value="modified">Sort by Date</option>
                    <option value="size">Sort by Size</option>
                    <option value="type">Sort by Type</option>
                    <option value="owner">Sort by Owner</option>
                  </select>
                </div>

                <div className="fm-dropdown" style={{position: 'relative'}}>
                  <select 
                    onChange={(e) => handleFilter(e.target.value)}
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}>
                    <option value="all">All Types</option>
                    <option value="pdf">PDF Files</option>
                    <option value="doc">Documents</option>
                    <option value="sheet">Spreadsheets</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="folder">Folders</option>
                  </select>
                </div>

                {clipboard.items.length > 0 && (
                  <button 
                    className="fm-btn" 
                    onClick={handlePaste}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      color: '#0ea5e9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                    <i className="ri-clipboard-line" style={{marginRight: '6px'}}></i> 
                    Paste ({clipboard.items.length}) {clipboard.action === 'move' ? '✂️' : '📋'}
                  </button>
                )}

                <button 
                  className="fm-btn" 
                  onClick={() => document.getElementById('hiddenFileInput').click()}
                >
                  <i className="ri-upload-cloud-2-line"></i> Upload files
                </button>
                <button 
                  className="fm-btn fm-primary" 
                  onClick={handleCreateNew}
                >
                  <i className="ri-add-line"></i> Create new
                </button>
              </div>

              {/* Grid view */}
              {viewMode === 'grid' && (
                <div 
                  className="fm-collection" 
                  id="gridView"
                  onContextMenu={(e) => {
                    // Only show empty context menu if clicking on the container itself
                    if (e.target.id === 'gridView' || e.target.id === 'gridItems') {
                      showContextMenu(e, null, 'empty');
                    }
                  }}
                >
                  <div className="fm-grid" id="gridItems">
                    {getProcessedFiles(getCurrentFiles()).map(file => (
                      <div 
                        key={file.id} 
                        className={`fm-card ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file')}>
                        
                        <div 
                          className={`fm-selection-checkbox ${selectedFiles.includes(file.id) ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file.id);
                          }}>
                          {selectedFiles.includes(file.id) && <i className="ri-check-line"></i>}
                        </div>

                        <div className="fm-card-actions">
                          {!file.isShared && (
                            <div className="fm-action-btn" onClick={(e) => {
                              e.stopPropagation();
                              openShareModal([file.id]);
                            }}>
                              <i className="ri-share-line"></i>
                            </div>
                          )}
                          <div 
                            className="fm-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                            }}>
                            <i className="ri-more-line"></i>
                          </div>
                        </div>

                        <div className="fm-thumb">
                          <i className={getFileIcon(file.type)} style={{color: starredItems.includes(file.id) ? '#fbbf24' : 'inherit'}}></i>
                          {starredItems.includes(file.id) && (
                            <i className="ri-star-fill" style={{position: 'absolute', top: '8px', right: '8px', color: '#fbbf24', fontSize: '12px'}}></i>
                          )}
                        </div>
                        <div className="fm-card-name">{renameItem?.id === file.id ? (
                          <input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                            onBlur={handleRename}
                            autoFocus
                            style={{width: '100%', padding: '2px', border: '1px solid #0ea5e9', borderRadius: '3px'}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (file.name || file.folder_name || file.title || 'Unnamed Item')}</div>
                        <div className="fm-meta">{file.size} • {file.modified}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* List view */}
              {viewMode === 'list' && (
                <div className="fm-collection" id="listView">
                  <div className="fm-row fm-header">
                    <div>
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.length === getProcessedFiles(getCurrentFiles()).length && getProcessedFiles(getCurrentFiles()).length > 0}
                        onChange={() => {
                          const processedFiles = getProcessedFiles(getCurrentFiles());
                          if (selectedFiles.length === processedFiles.length) {
                            setSelectedFiles([]);
                          } else {
                            setSelectedFiles(processedFiles.map(f => f.id));
                          }
                        }}
                        style={{margin:0}} 
                      />
                    </div>
                    <div></div>
                    <div>Name</div>
                    <div className="fm-hide-mobile">Last edit</div>
                    <div className="fm-hide-mobile">Owner</div>
                    <div className="fm-hide-mobile">Size</div>
                    <div className="fm-hide-mobile">Shared</div>
                    <div></div>
                  </div>
                  <div id="listItems">
                    {getProcessedFiles(getCurrentFiles()).map(file => (
                      <div 
                        key={file.id} 
                        className={`fm-row ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file')}>
                        
                        <div>
                          <div 
                            className={`fm-row-checkbox ${selectedFiles.includes(file.id) ? 'checked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileSelect(file.id);
                            }}>
                            {selectedFiles.includes(file.id) && <i className="ri-check-line"></i>}
                          </div>
                        </div>
                        <div>
                          <i className={getFileIcon(file.type)} style={{color: starredItems.includes(file.id) ? '#fbbf24' : 'inherit'}}></i>
                          {starredItems.includes(file.id) && (
                            <i className="ri-star-fill" style={{marginLeft: '4px', color: '#fbbf24', fontSize: '12px'}}></i>
                          )}
                        </div>
                        <div>{renameItem?.id === file.id ? (
                          <input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                            onBlur={handleRename}
                            autoFocus
                            style={{width: '90%', padding: '2px', border: '1px solid #0ea5e9', borderRadius: '3px'}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (file.name || file.folder_name || file.title || 'Unnamed Item')}</div>
                        <div className="fm-hide-mobile">{file.modified || 'Unknown'}</div>
                        <div className="fm-hide-mobile">
                          <div className="fm-avatar-sm">{file.owner ? file.owner.charAt(0) : 'U'}</div>
                        </div>
                        <div className="fm-hide-mobile">{file.size || 'Unknown'}</div>
                        <div className="fm-hide-mobile">
                          {file.shared && <i className="ri-share-line"></i>}
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                          }}>
                          <i className="ri-more-line"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Other sections */}
          {currentSection === 'section-shared' && (
            <section className="fm-section" id="section-shared">
              <div className="fm-section-head" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>Shared with me</h3>
                <span className="fm-pill" style={{
                  backgroundColor: currentTheme.primary + '15',
                  color: currentTheme.primary,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  <i className="ri-share-line" style={{marginRight: '6px'}}></i> 
                  {sharedWithMeItems.length} {sharedWithMeItems.length === 1 ? 'document' : 'documents'}
                </span>
              </div>
              
              {sharedWithMeItems.length === 0 ? (
                <div className="fm-empty" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  color: '#9ca3af'
                }}>
                  <i className="ri-share-line" style={{
                    fontSize: '64px',
                    color: '#d1d5db',
                    marginBottom: '20px',
                    opacity: 0.5
                  }}></i>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#6b7280'}}>
                    No shared files
                  </h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#9ca3af'}}>
                    Files shared with you will appear here
                  </p>
                </div>
              ) : (
                <div className="fm-files-list" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  {sharedWithMeItems.map(item => (
                    <div
                      key={item.id}
                      className="fm-list-item"
                      onClick={() => openFile(item)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr auto',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: selectedFiles.includes(item.id) 
                          ? currentTheme.primary + '08'
                          : 'transparent',
                        borderLeft: selectedFiles.includes(item.id) 
                          ? `3px solid ${currentTheme.primary}` 
                          : `3px solid transparent`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${currentTheme.border}`,
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedFiles.includes(item.id)) {
                          e.currentTarget.style.backgroundColor = currentTheme.hover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedFiles.includes(item.id)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {/* File Icon with Share Badge */}
                      <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <i 
                          className={`ri-${item.type === 'folder' ? 'folder' : 'file'}-fill`}
                          style={{
                            color: getFileColor(item.type),
                            fontSize: '32px'
                          }}
                        ></i>
                        <div style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          backgroundColor: '#8b5cf6',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${currentTheme.background}`
                        }}>
                          <i className="ri-share-forward-line" style={{
                            color: 'white',
                            fontSize: '10px'
                          }}></i>
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden'}}>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '14px',
                          color: currentTheme.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap'}}>
                          {/* Permission Badge */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            backgroundColor: item.permission === 'write' 
                              ? '#10b98120' 
                              : '#3b82f620',
                            color: item.permission === 'write' 
                              ? '#059669' 
                              : '#2563eb'
                          }}>
                            <i className={`ri-${item.permission === 'write' ? 'edit' : 'eye'}-line`} 
                               style={{fontSize: '12px'}}></i>
                            {item.permission === 'write' ? 'Can Edit' : 'View Only'}
                          </span>
                          
                          <span>•</span>
                          
                          {/* Shared By */}
                          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <i className="ri-user-line" style={{fontSize: '14px'}}></i>
                            {item.owner}
                          </span>
                          
                          <span>•</span>
                          
                          {/* Date */}
                          <span>{formatDate(item.modified)}</span>
                          
                          {/* Size */}
                          {item.size && item.size !== '0 KB' && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(item.size)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFile(item);
                          }}
                          title="View"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                            e.currentTarget.style.color = currentTheme.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <i className="ri-eye-line" style={{fontSize: '18px'}}></i>
                        </button>
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item);
                          }}
                          title="Download"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                            e.currentTarget.style.color = currentTheme.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <i className="ri-download-line" style={{fontSize: '18px'}}></i>
                        </button>
                        
                        {/* 3-dot menu for shared files */}
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            showContextMenu(e, item, item.type === 'folder' ? 'folder' : 'file');
                          }}
                          title="More options"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                            e.currentTarget.style.color = currentTheme.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <i className="ri-more-2-fill" style={{fontSize: '18px'}}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {currentSection === 'section-recent' && (
            <div className="fm-tab-content" id="recent" style={{display: 'block'}}>
              <div className="fm-section-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>Recent Activity</h3>
                <span className="fm-pill" style={{
                  backgroundColor: currentTheme.primary + '15',
                  color: currentTheme.primary,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  <i className="ri-time-line" style={{marginRight: '6px'}}></i> 
                  {recentItems.length} recent {recentItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              {recentItems.length === 0 ? (
                <div className="fm-empty-state" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  color: '#9ca3af'
                }}>
                  <i className="ri-time-line" style={{
                    fontSize: '64px',
                    color: '#d1d5db',
                    marginBottom: '20px',
                    opacity: 0.5
                  }}></i>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#6b7280'}}>
                    No recent activity
                  </h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#9ca3af'}}>
                    Your file activity will appear here
                  </p>
                </div>
              ) : (
                <div className="fm-files-list" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  {recentItems.map((recentItem, index) => {
                    // Use recent item data directly (it now has all file details)
                    const file = {
                      id: recentItem.fileId || recentItem.id,
                      name: recentItem.name || 'Unknown File',
                      type: recentItem.type || 'pdf',
                      size: recentItem.size || 'Unknown',
                      modified: recentItem.modified || recentItem.time,
                      owner: recentItem.owner || 'You',
                      sharedWith: recentItem.sharedWith || 0,
                      documentId: recentItem.documentId,
                      ipfsHash: recentItem.ipfsHash
                    };
                    
                    const activityInfo = getActivityIcon(recentItem.action);
                    
                    return (
                      <div 
                        key={`${recentItem.fileId}-${index}`} 
                        className="fm-list-item"
                        onClick={() => file.type !== 'folder' && openFile(file)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '50px 1fr auto',
                          gap: '16px',
                          padding: '16px',
                          backgroundColor: 'transparent',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: `1px solid ${currentTheme.border}`,
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* File Icon with Activity Badge */}
                        <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <i className={getFileIcon(file.type)} style={{
                            color: file.type === 'folder' ? '#f59e0b' : getFileColor(file.type),
                            fontSize: '32px'
                          }}></i>
                          <div style={{
                            position: 'absolute',
                            bottom: '-4px',
                            right: '-4px',
                            backgroundColor: activityInfo.color,
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${currentTheme.background}`
                          }}>
                            <i className={activityInfo.icon} style={{
                              color: 'white',
                              fontSize: '10px'
                            }}></i>
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden'}}>
                          <div style={{
                            fontWeight: '500',
                            fontSize: '14px',
                            color: currentTheme.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {file.name}
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280'}}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: activityInfo.color + '20',
                              color: activityInfo.color,
                              fontWeight: '500',
                              textTransform: 'capitalize'
                            }}>
                              {recentItem.action.replace('-', ' ')}
                            </span>
                            <span>•</span>
                            <span>{formatTimeAgo(recentItem.time)}</span>
                            {file.size && file.size !== '0 KB' && (
                              <>
                                <span>•</span>
                                <span>{file.size}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          {file.type !== 'folder' && (
                            <button 
                              className="fm-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFile(file);
                              }}
                              title="Open"
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#6b7280',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                                e.currentTarget.style.color = currentTheme.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6b7280';
                              }}
                            >
                              <i className="ri-eye-line" style={{fontSize: '18px'}}></i>
                            </button>
                          )}
                          <button 
                            className="fm-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                            }}
                            title="More options"
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#6b7280',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                              e.currentTarget.style.color = currentTheme.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            <i className="ri-more-2-line" style={{fontSize: '18px'}}></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentSection === 'section-starred' && (
            <section className="fm-section">
              <div className="fm-section-head" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>Starred Files</h3>
                <span className="fm-pill" style={{
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  <i className="ri-star-fill" style={{marginRight: '6px'}}></i>
                  {filterFiles(getStarredFiles()).length} starred
                </span>
              </div>
              {searchTerm && (
                <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px'}}>
                  <span style={{fontSize: '14px', color: '#1e40af'}}>
                    <i className="ri-search-line" style={{marginRight: '6px'}}></i>
                    Showing starred results for "{searchTerm}"
                  </span>
                </div>
              )}
              {filterFiles(getStarredFiles()).length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  color: '#9ca3af'
                }}>
                  <i className="ri-star-line" style={{
                    fontSize: '64px',
                    color: '#fbbf24',
                    marginBottom: '20px',
                    opacity: 0.3
                  }}></i>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#6b7280'}}>
                    No starred files
                  </h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#9ca3af'}}>
                    Star your important files to find them quickly here
                  </p>
                </div>
              ) : (
                <div className="fm-files-list" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  {filterFiles(getStarredFiles()).map(file => (
                    <div 
                      key={file.id} 
                      className="fm-list-item"
                      onClick={() => handleFileClick(file)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr auto',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: selectedFiles.includes(file.id) 
                          ? currentTheme.primary + '08'
                          : 'transparent',
                        borderLeft: selectedFiles.includes(file.id) 
                          ? `3px solid ${currentTheme.primary}` 
                          : `3px solid transparent`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${currentTheme.border}`,
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedFiles.includes(file.id)) {
                          e.currentTarget.style.backgroundColor = currentTheme.hover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedFiles.includes(file.id)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onContextMenu={(e) => showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file')}
                    >
                      {/* File Icon with Star Badge */}
                      <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <i className={getFileIcon(file.type)} style={{
                          color: file.type === 'folder' ? '#f59e0b' : getFileColor(file.type),
                          fontSize: '32px'
                        }}></i>
                        <div style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          backgroundColor: '#fbbf24',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${currentTheme.background}`
                        }}>
                          <i className="ri-star-fill" style={{
                            color: 'white',
                            fontSize: '10px'
                          }}></i>
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden'}}>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '14px',
                          color: currentTheme.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {file.name}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap'}}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="ri-folder-line" style={{fontSize: '14px'}}></i>
                            {file.type === 'folder' ? 'Folder' : getFileTypeName(file.type)}
                          </span>
                          
                          <span>•</span>
                          
                          <span>{formatDate(file.modified)}</span>
                          
                          {file.size && file.size !== '0 KB' && (
                            <>
                              <span>•</span>
                              <span>{file.size}</span>
                            </>
                          )}
                          
                          {file.sharedWith > 0 && (
                            <>
                              <span>•</span>
                              <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <i className="ri-share-line" style={{fontSize: '14px'}}></i>
                                Shared with {file.sharedWith}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        {!file.isShared && file.type !== 'folder' && (
                          <button 
                            className="fm-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShareModal([file.id]);
                            }}
                            title="Share"
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#6b7280',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                              e.currentTarget.style.color = currentTheme.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            <i className="ri-share-line" style={{fontSize: '18px'}}></i>
                          </button>
                        )}
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(file);
                          }}
                          title="Unstar"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#fbbf24',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef3c7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <i className="ri-star-fill" style={{fontSize: '18px'}}></i>
                        </button>
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                          }}
                          title="More options"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = currentTheme.primary + '15';
                            e.currentTarget.style.color = currentTheme.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <i className="ri-more-2-line" style={{fontSize: '18px'}}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {currentSection === 'section-trash' && (
            <section className="fm-section">
              <div className="fm-section-head" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>Trash</h3>
                {trashedItems.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently delete all items in trash? This action cannot be undone.')) {
                        setTrashedItems([]);
                        showNotification('success', 'Trash Emptied', 'All items permanently deleted');
                      }
                    }}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                  >
                    <i className="ri-delete-bin-line"></i>
                    Empty Trash
                  </button>
                )}
              </div>
              {trashedItems.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  color: '#9ca3af'
                }}>
                  <i className="ri-delete-bin-line" style={{
                    fontSize: '64px',
                    color: '#dc2626',
                    marginBottom: '20px',
                    opacity: 0.3
                  }}></i>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#6b7280'}}>
                    Trash is empty
                  </h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#9ca3af'}}>
                    Deleted files will appear here
                  </p>
                </div>
              ) : (
                <div className="fm-files-list" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  {trashedItems.map((item, index) => (
                    <div 
                      key={`trash-${item.id || index}`} 
                      className="fm-list-item"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 180px',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: 'transparent',
                        borderLeft: `3px solid transparent`,
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${currentTheme.border}`,
                        alignItems: 'center',
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = currentTheme.hover;
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.opacity = '0.7';
                      }}
                    >
                      {/* File Icon with Trash Badge */}
                      <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <i className={getFileIcon(item.type)} style={{
                          color: item.type === 'folder' ? '#f59e0b' : getFileColor(item.type),
                          fontSize: '32px'
                        }}></i>
                        <div style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          backgroundColor: '#dc2626',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${currentTheme.background}`
                        }}>
                          <i className="ri-delete-bin-line" style={{
                            color: 'white',
                            fontSize: '10px'
                          }}></i>
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden'}}>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '14px',
                          color: currentTheme.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap'}}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="ri-folder-line" style={{fontSize: '14px'}}></i>
                            {item.type === 'folder' ? 'Folder' : getFileTypeName(item.type)}
                          </span>
                          
                          <span>•</span>
                          
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#dc2626'
                          }}>
                            <i className="ri-calendar-line" style={{fontSize: '14px'}}></i>
                            Deleted {item.deletedDate}
                          </span>
                          
                          {item.size && item.size !== '0 KB' && (
                            <>
                              <span>•</span>
                              <span>{item.size}</span>
                            </>
                          )}
                          
                          {item.originalPath && (
                            <>
                              <span>•</span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                maxWidth: '300px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                <i className="ri-folder-3-line" style={{fontSize: '14px'}}></i>
                                From: {item.originalPath}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        justifyContent: 'flex-end'
                      }}>
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            showNotification('success', 'Restored', `${item.name} restored`);
                            setTrashedItems(prev => prev.filter((_, i) => i !== index));
                          }}
                          title="Restore"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #3b82f6',
                            backgroundColor: '#eff6ff',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                            e.currentTarget.style.color = '#3b82f6';
                          }}
                        >
                          <i className="ri-refresh-line" style={{fontSize: '18px'}}></i>
                        </button>
                        <button 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Permanently delete this item? This action cannot be undone.')) {
                              setTrashedItems(prev => prev.filter((_, i) => i !== index));
                              showNotification('success', 'Deleted', 'Item permanently deleted');
                            }
                          }}
                          title="Delete Permanently"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #dc2626',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                        >
                          <i className="ri-delete-bin-line" style={{fontSize: '18px'}}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        {/* File Details Modal (Single Click) */}
        {isDetailsModalOpen && currentFile && (
          <div className="fm-modal fm-open">
            <div className="fm-modal-content">
              <div className="fm-modal-header">
                <h3>{currentFile.type === 'folder' ? 'Folder' : 'File'} Details</h3>
                <button className="fm-close-btn" onClick={() => setIsDetailsModalOpen(false)}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="fm-modal-body">
                <div className="fm-file-preview">
                  <i className={getFileIcon(currentFile.type)} style={{fontSize: '64px', color: starredItems.includes(currentFile.id) ? '#fbbf24' : 'inherit'}}></i>
                  <h4>{currentFile.name}</h4>
                  {starredItems.includes(currentFile.id) && (
                    <div style={{color: '#fbbf24', fontSize: '14px', marginTop: '8px'}}>
                      <i className="ri-star-fill"></i> Starred
                    </div>
                  )}
                </div>
                <div className="fm-file-info">
                  <div className="fm-info-row">
                    <label>Type</label>
                    <span>{currentFile.type === 'folder' ? 'Folder' : getFileTypeName(currentFile.type)}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Size</label>
                    <span>{currentFile.size}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Modified</label>
                    <span>{currentFile.modified}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Owner</label>
                    <span>{currentFile.owner}</span>
                  </div>
                  {currentFile.content && (
                    <div className="fm-info-row">
                      <label>Description</label>
                      <span style={{fontSize: '12px', color: '#6b7280'}}>{currentFile.content}</span>
                    </div>
                  )}
                  {currentFile.versions && (
                    <div className="fm-info-row">
                      <label>Versions</label>
                      <span>{currentFile.versions} versions available</span>
                    </div>
                  )}
                  {currentFile.folderContents && (
                    <div className="fm-info-row">
                      <label>Contents</label>
                      <span>{currentFile.folderContents.join(', ')}</span>
                    </div>
                  )}
                  {currentFile.hash && (
                    <div className="fm-info-row">
                      <label>Blockchain Hash</label>
                      <span style={{fontFamily:'monospace', fontSize:'11px', wordBreak: 'break-all'}}>{currentFile.hash}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="fm-modal-footer">
                <button className="fm-btn" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                {currentFile.type !== 'folder' && (
                  <button className="fm-btn" onClick={() => {
                    setIsDetailsModalOpen(false);
                    setIsFileModalOpen(true);
                  }}>
                    <i className="ri-play-line"></i> Open
                  </button>
                )}
                <button className="fm-btn fm-primary" onClick={() => {
                  setIsDetailsModalOpen(false);
                  openShareModal([currentFile.id]);
                }}>
                  <i className="ri-share-line"></i> Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Open Modal (Double Click) */}
        {isFileModalOpen && currentFile && (
          <div className="fm-modal fm-open">
            <div className="fm-modal-content" style={{maxWidth: '800px', width: '90vw'}}>
              <div className="fm-modal-header">
                <h3>
                  <i className={getFileIcon(currentFile.type)} style={{marginRight: '8px'}}></i>
                  {currentFile.name}
                </h3>
                <button className="fm-close-btn" onClick={closeFileModal}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="fm-modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                <div className="fm-file-preview" style={{marginBottom: '24px'}}>
                  {/* Image Preview */}
                  {(currentFile.documentType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(currentFile.name?.split('.').pop()?.toLowerCase())) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <img 
                        src={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                        alt={currentFile.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div style={{display: 'none'}}>
                        <i className="ri-image-line" style={{fontSize: '64px', color: '#6b7280', marginBottom: '16px'}}></i>
                        <p style={{color: '#6b7280'}}>Failed to load image</p>
                      </div>
                    </div>
                  )}

                  {/* PDF Preview */}
                  {(currentFile.documentType === 'application/pdf' || currentFile.name?.toLowerCase().endsWith('.pdf')) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        src={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                        style={{
                          width: '100%',
                          height: '600px',
                          border: 'none'
                        }}
                        title={currentFile.name}
                      />
                      <div style={{padding: '12px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'center'}}>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{color: '#2563eb', textDecoration: 'none', fontSize: '14px'}}
                        >
                          <i className="ri-external-link-line"></i> Open in New Tab
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Office Documents (Word, Excel, PowerPoint) Preview */}
                  {(currentFile.documentType?.includes('word') || 
                    currentFile.documentType?.includes('document') ||
                    currentFile.documentType?.includes('excel') || 
                    currentFile.documentType?.includes('spreadsheet') ||
                    currentFile.documentType?.includes('powerpoint') ||
                    currentFile.documentType?.includes('presentation') ||
                    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(currentFile.name?.split('.').pop()?.toLowerCase())) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`)}`}
                        style={{
                          width: '100%',
                          height: '600px',
                          border: 'none'
                        }}
                        title={currentFile.name}
                      />
                      <div style={{padding: '12px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'center'}}>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{color: '#2563eb', textDecoration: 'none', fontSize: '14px', marginRight: '16px'}}
                        >
                          <i className="ri-external-link-line"></i> Open in New Tab
                        </a>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                          download={currentFile.name}
                          style={{color: '#059669', textDecoration: 'none', fontSize: '14px'}}
                        >
                          <i className="ri-download-line"></i> Download to View
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Text Files Preview */}
                  {(currentFile.documentType?.includes('text') || ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(currentFile.name?.split('.').pop()?.toLowerCase())) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      padding: '20px'
                    }}>
                      <iframe
                        src={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`}
                        style={{
                          width: '100%',
                          height: '400px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          padding: '12px'
                        }}
                        title={currentFile.name}
                      />
                    </div>
                  )}

                  {/* Video Preview */}
                  {(currentFile.documentType?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(currentFile.name?.split('.').pop()?.toLowerCase())) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: '#000000'
                    }}>
                      <video 
                        controls
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: '8px'
                        }}
                      >
                        <source src={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`} type={currentFile.documentType || 'video/mp4'} />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Audio Preview */}
                  {(currentFile.documentType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(currentFile.name?.split('.').pop()?.toLowerCase())) && currentFile.ipfsHash && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-music-line" style={{fontSize: '64px', color: '#8b5cf6', marginBottom: '16px'}}></i>
                      <h4>{currentFile.name}</h4>
                      <audio 
                        controls
                        style={{
                          width: '100%',
                          marginTop: '20px'
                        }}
                      >
                        <source src={`https://gateway.pinata.cloud/ipfs/${currentFile.ipfsHash}`} type={currentFile.documentType || 'audio/mpeg'} />
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  )}

                  {/* Fallback for unsupported types or no IPFS hash */}
                  {!currentFile.ipfsHash && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-file-line" style={{fontSize: '64px', color: '#6b7280', marginBottom: '16px'}}></i>
                      <h4>No Preview Available</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        This file is not stored on IPFS or preview is not available.
                      </p>
                      <button 
                        className="fm-btn fm-primary"
                        onClick={() => downloadFile(currentFile)}
                        style={{marginTop: '12px'}}
                      >
                        <i className="ri-download-line"></i> Download File
                      </button>
                    </div>
                  )}
                  
                  {currentFile.type === 'sheet' && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-file-excel-line" style={{fontSize: '64px', color: '#059669', marginBottom: '16px'}}></i>
                      <h4>Spreadsheet Viewer</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        {currentFile.content}
                      </p>
                      <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '16px'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <thead>
                            <tr style={{backgroundColor: '#f3f4f6'}}>
                              <th style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'left'}}>Item</th>
                              <th style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>Amount</th>
                              <th style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{border: '1px solid #d1d5db', padding: '8px'}}>Development</td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>$50,000</td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>$50,000</td>
                            </tr>
                            <tr>
                              <td style={{border: '1px solid #d1d5db', padding: '8px'}}>Marketing</td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>$25,000</td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>$25,000</td>
                            </tr>
                            <tr style={{fontWeight: 'bold', backgroundColor: '#f9fafb'}}>
                              <td style={{border: '1px solid #d1d5db', padding: '8px'}}>Total</td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px'}}></td>
                              <td style={{border: '1px solid #d1d5db', padding: '8px', textAlign: 'right'}}>$75,000</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {currentFile.type === 'image' && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-image-line" style={{fontSize: '64px', color: '#7c3aed', marginBottom: '16px'}}></i>
                      <h4>Image Viewer</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        {currentFile.content}
                      </p>
                      <div style={{
                        width: '300px',
                        height: '200px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '1px solid #d1d5db'
                      }}>
                        <span style={{color: '#6b7280'}}>Image Preview ({currentFile.size})</span>
                      </div>
                    </div>
                  )}
                  
                  {currentFile.type === 'video' && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-video-line" style={{fontSize: '64px', color: '#dc2626', marginBottom: '16px'}}></i>
                      <h4>Video Player</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        {currentFile.content}
                      </p>
                      <div style={{
                        width: '400px',
                        height: '225px',
                        backgroundColor: '#000',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        <i className="ri-play-circle-line" style={{fontSize: '64px', color: 'white'}}></i>
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {currentFile.size} • 0:00 / 5:23
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="fm-file-info">
                  <div className="fm-info-row">
                    <label>Type</label>
                    <span>{getFileTypeName(currentFile.type)}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Size</label>
                    <span>{currentFile.size}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Modified</label>
                    <span>{currentFile.modified}</span>
                  </div>
                  <div className="fm-info-row">
                    <label>Owner</label>
                    <span>{currentFile.owner}</span>
                  </div>
                  {currentFile.hash && (
                    <div className="fm-info-row">
                      <label>Blockchain Hash</label>
                      <span style={{fontFamily:'monospace', fontSize:'11px', wordBreak: 'break-all'}}>{currentFile.hash}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="fm-modal-footer">
                <button className="fm-btn" onClick={closeFileModal}>Close</button>
                <button className="fm-btn" onClick={() => downloadFile(currentFile)}>
                  <i className="ri-download-line"></i> Download
                </button>
                <button className="fm-btn" onClick={() => {
                  setIsFileModalOpen(false);
                  setCurrentFile(currentFile);
                  setIsVersionModalOpen(true);
                }}>
                  <i className="ri-history-line"></i> Version History
                </button>
                {!currentFile?.isShared && (
                  <button className="fm-btn fm-primary" onClick={() => {
                    closeFileModal();
                    openShareModal([currentFile.id]);
                  }}>
                    <i className="ri-share-line"></i> Share
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Version History Modal */}
        {isVersionModalOpen && currentFile && (
          <div className="fm-modal fm-open">
            <div className="fm-modal-content">
              <div className="fm-modal-header">
                <h3>Version History - {currentFile.name}</h3>
                <button className="fm-close-btn" onClick={() => setIsVersionModalOpen(false)}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="fm-modal-body">
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                  {(versionHistory[currentFile.id] || []).length > 0 ? (
                    (versionHistory[currentFile.id] || []).map((version, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        backgroundColor: index === 0 ? '#f0f9ff' : 'white'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                          <strong>Version {version.version} {index === 0 && '(Current)'}</strong>
                          <span style={{fontSize: '12px', color: '#6b7280'}}>{version.size}</span>
                        </div>
                        <div style={{fontSize: '14px', color: '#374151', marginBottom: '4px'}}>
                          {version.action}
                        </div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                          By {version.user} • {version.date}
                        </div>
                        <div style={{marginTop: '8px', display: 'flex', gap: '8px'}}>
                          <button 
                            onClick={() => {
                              const url = `https://gateway.pinata.cloud/ipfs/${version.ipfsHash}`;
                              window.open(url, '_blank');
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}>
                            <i className="ri-download-line"></i> Download
                          </button>
                          {index !== 0 && (
                            <button 
                              onClick={() => {
                                if (window.confirm(`Restore version ${version.version}? This will create a new version with the old file content.`)) {
                                  // TODO: Implement restore functionality
                                  showNotification('info', 'Coming Soon', 'Restore functionality will be implemented');
                                }
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                              }}>
                              <i className="ri-restart-line"></i> Restore
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{textAlign: 'center', padding: '32px', color: '#6b7280'}}>
                      <i className="ri-history-line" style={{fontSize: '48px', marginBottom: '16px'}}></i>
                      <p>No version history available</p>
                      <p style={{fontSize: '14px', marginTop: '8px'}}>
                        This file has no previous versions. Upload a new version to start tracking changes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="fm-modal-footer">
                <button className="fm-btn" onClick={() => setIsVersionModalOpen(false)}>Close</button>
                {!currentFile?.isShared && (
                  <button className="fm-btn fm-primary" onClick={() => handleUpdateFile(currentFile)}>
                    <i className="ri-upload-line"></i> Upload New Version
                  </button>
                )}
              </div>
            </div>
          </div>
        )}      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fm-modal fm-share-modal fm-open">
          <div className="fm-modal-content">
            <div className="fm-modal-header">
              <h3>
                <i className="ri-share-line"></i> Share Document
                {currentSharingItems.length > 0 && ` - ${currentSharingItems[0].name}`}
              </h3>
              <button className="fm-close-btn" onClick={closeShareModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="fm-modal-body">
              <div className="fm-blockchain-info">
                <h5><i className="ri-links-line"></i> Blockchain Document Sharing</h5>
                <p>Share documents securely with users in your institution. Access permissions are recorded on the blockchain for immutability.</p>
              </div>

              {/* Search Users */}
              <div className="fm-search-section" style={{marginTop: '20px'}}>
                <div className="fm-search-box">
                  <i className="ri-search-line"></i>
                  <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    onChange={(e) => searchUsers(e.target.value)}
                  />
                </div>
              </div>

              {/* Select Recipients */}
              <div className="fm-share-section">
                <h4><i className="ri-team-line"></i> Select Recipients ({institutionUsers.length} available)</h4>
                <div className="fm-user-list" style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  {institutionUsers && institutionUsers.length > 0 ? institutionUsers
                    .filter(user => user.id !== currentUser?.id) // Don't show current user
                    .map(user => {
                      const isSelected = selectedRecipients.find(r => r.id === user.id);
                      return (
                        <div 
                          key={user.id} 
                          className="fm-user-item"
                          onClick={() => toggleUserSelection(user)}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
                            backgroundColor: isSelected ? '#f0fdf4' : 'white',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                              <div className="fm-user-avatar" style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundImage: `url(${user.avatar})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}></div>
                              <div className="fm-user-info">
                                <div className="fm-user-name" style={{fontWeight: '600', fontSize: '14px'}}>
                                  {user.username}
                                  {isSelected && <i className="ri-check-line" style={{marginLeft: '8px', color: '#10b981'}}></i>}
                                </div>
                                <div className="fm-user-details" style={{fontSize: '12px', color: '#6b7280'}}>
                                  {user.email}
                                </div>
                                {user.role && (
                                  <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '2px'}}>
                                    Role: {user.role}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Permission Selector */}
                            {isSelected && (
                              <select
                                value={isSelected.permission}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecipients(prev => 
                                    prev.map(r => 
                                      r.id === user.id 
                                        ? {...r, permission: e.target.value} 
                                        : r
                                    )
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #d1d5db',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  backgroundColor: 'white'
                                }}
                              >
                                <option value="read">👁️ View Only</option>
                                <option value="write">✏️ Can Edit</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                    <div className="fm-no-users" style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#9ca3af'
                    }}>
                      <i className="ri-user-search-line" style={{fontSize: '48px', marginBottom: '12px', display: 'block'}}></i>
                      <p>No users found in your institution.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Recipients Summary */}
              {selectedRecipients.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h5 style={{marginBottom: '8px', fontSize: '14px', fontWeight: '600'}}>
                    <i className="ri-user-add-line"></i> Selected: {selectedRecipients.length} user(s)
                  </h5>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {selectedRecipients.map(recipient => (
                      <div key={recipient.id} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db'
                      }}>
                        <span>{recipient.username}</span>
                        <span style={{color: '#6b7280'}}>
                          ({recipient.permission === 'write' ? '✏️ Edit' : '👁️ View'})
                        </span>
                        <i 
                          className="ri-close-line" 
                          onClick={() => toggleUserSelection(recipient)}
                          style={{cursor: 'pointer', color: '#ef4444', marginLeft: '4px'}}
                        ></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="fm-modal-footer">
              <button className="fm-btn" onClick={closeShareModal}>Cancel</button>
              <button 
                className="fm-btn fm-primary"
                onClick={executeBlockchainShare}
                disabled={selectedRecipients.length === 0}
                style={{
                  opacity: selectedRecipients.length === 0 ? 0.5 : 1,
                  cursor: selectedRecipients.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="ri-send-plane-line"></i> Share with {selectedRecipients.length} user(s)
              </button>
            </div>
          </div>
        </div>
      )}

        </div>

        {/* Context Menu */}
        {contextMenu.show && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998
              }}
              onClick={hideContextMenu}
            />
            <div 
              style={{
                position: 'fixed',
                top: Math.min(contextMenu.y, window.innerHeight - 400),
                left: Math.min(contextMenu.x, window.innerWidth - 200),
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 999,
                minWidth: '180px',
                maxWidth: '220px',
                maxHeight: '350px',
                overflowY: 'auto',
                padding: '6px 0'
              }}>
              
              {contextMenu.type === 'folder' ? (
                // Folder Context Menu
                <>
                  <div {...getContextMenuItemProps('open')}>
                    <i className="ri-folder-open-line"></i> Open
                  </div>
                  <div {...getContextMenuItemProps('share')}>
                    <i className="ri-share-line"></i> Share Folder
                  </div>
                  <div {...getContextMenuItemProps('copy')}>
                    <i className="ri-file-copy-line"></i> Copy
                  </div>
                  <div {...getContextMenuItemProps('move')}>
                    <i className="ri-scissors-line"></i> Cut
                  </div>
                  {clipboard.items.length > 0 && (
                    <div {...getContextMenuItemProps('paste')}>
                      <i className="ri-clipboard-line"></i> Paste {clipboard.items.length} item(s)
                    </div>
                  )}
                  <div {...getContextMenuItemProps('rename')}>
                    <i className="ri-edit-line"></i> Rename
                  </div>
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('delete', true)}>
                    <i className="ri-delete-bin-line"></i> Delete
                  </div>
                </>
              ) : contextMenu.type === 'empty' ? (
                // Empty Space Context Menu
                <>
                  {clipboard.items.length > 0 && (
                    <div {...getContextMenuItemProps('paste')}>
                      <i className="ri-clipboard-line"></i> Paste {clipboard.items.length} item(s)
                    </div>
                  )}
                  <div {...getContextMenuItemProps('refresh')}>
                    <i className="ri-refresh-line"></i> Refresh
                  </div>
                  <div onClick={() => {
                    hideContextMenu();
                    setIsCreateFolderModalOpen(true);
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    transition: 'background-color 0.15s'
                  }}>
                    <i className="ri-folder-add-line"></i> New Folder
                  </div>
                  <div onClick={() => {
                    hideContextMenu();
                    document.getElementById('hiddenFileInput').click();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    transition: 'background-color 0.15s'
                  }}>
                    <i className="ri-upload-line"></i> Upload File
                  </div>
                </>
              ) : (
                // File Context Menu
                <>
                  <div {...getContextMenuItemProps('details')}>
                    <i className="ri-eye-line"></i> View details
                  </div>
                  <div {...getContextMenuItemProps('open')}>
                    <i className="ri-file-line"></i> Open
                  </div>
                  <div {...getContextMenuItemProps('download')}>
                    <i className="ri-download-line"></i> Download
                  </div>
                  {!contextMenu.item?.isShared && (
                    <div {...getContextMenuItemProps('share')}>
                      <i className="ri-share-line"></i> Share
                    </div>
                  )}
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('copy')}>
                    <i className="ri-file-copy-line"></i> Copy
                  </div>
                  <div {...getContextMenuItemProps('move')}>
                    <i className="ri-scissors-line"></i> Cut
                  </div>
                  <div {...getContextMenuItemProps('rename')}>
                    <i className="ri-edit-line"></i> Rename
                  </div>
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('star')}>
                    <i className="ri-star-line"></i> {starredItems.includes(contextMenu.item?.id) ? 'Remove star' : 'Add star'}
                  </div>
                  <div {...getContextMenuItemProps('version')}>
                    <i className="ri-history-line"></i> Version history
                  </div>
                  {!contextMenu.item?.isShared && (
                    <div {...getContextMenuItemProps('update')}>
                      <i className="ri-upload-cloud-line"></i> Update file
                    </div>
                  )}
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('delete', true)}>
                    <i className="ri-delete-bin-line"></i> Delete
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Create Folder Modal */}
        {isCreateFolderModalOpen && (
          <div className="fm-modal fm-open">
            <div className="fm-modal-content" style={{maxWidth: '400px'}}>
              <div className="fm-modal-header">
                <h3>Create New Folder</h3>
                <button className="fm-close-btn" onClick={() => {
                  setIsCreateFolderModalOpen(false);
                  setNewFolderName('');
                }}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="fm-modal-body">
                <div style={{marginBottom: '16px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        createFolder();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="fm-modal-footer">
                <button 
                  className="fm-btn" 
                  onClick={() => {
                    setIsCreateFolderModalOpen(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="fm-btn fm-primary" 
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  style={{
                    opacity: newFolderName.trim() ? 1 : 0.5,
                    cursor: newFolderName.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <i className="ri-folder-add-line"></i> Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deleteItem && (
          <div className="fm-modal fm-open">
            <div className="fm-modal-content" style={{maxWidth: '400px'}}>
              <div className="fm-modal-header">
                <h3>Confirm Delete</h3>
                <button className="fm-close-btn" onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteItem(null);
                }}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="fm-modal-body">
                <div style={{marginBottom: '16px'}}>
                  <p style={{fontSize: '14px', color: '#374151', marginBottom: '12px'}}>
                    Are you sure you want to delete <strong>"{deleteItem.name}"</strong>?
                  </p>
                  {deleteItem.type === 'folder' && (
                    <p style={{fontSize: '13px', color: '#dc2626', marginTop: '8px'}}>
                      <i className="ri-alert-line"></i> This will also delete all files and subfolders inside it.
                    </p>
                  )}
                </div>
              </div>
              <div className="fm-modal-footer">
                <button 
                  className="fm-btn" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteItem(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="fm-btn" 
                  onClick={confirmDelete}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input 
          type="file" 
          id="hiddenFileInput" 
          multiple 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.svg,.webp,.bmp,.tiff,.mp4,.webm,.mov,.avi,.wmv,.ogg"
          onChange={handleFileUpload}
          style={{display:'none'}} 
        />
      </div>
    </div>
  );
};

export default FileManager;