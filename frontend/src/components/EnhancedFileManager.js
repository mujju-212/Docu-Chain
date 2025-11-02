import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { fileManagerService } from '../../services/fileManagerService';
import './FileManagerNew.css';

const EnhancedFileManager = () => {
  const { currentTheme } = useTheme();
  
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
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  
  // Blockchain states
  const [blockchainFiles, setBlockchainFiles] = useState([]);
  const [blockchainFolders, setBlockchainFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fileVersions, setFileVersions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Sharing states
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sharePermissions, setSharePermissions] = useState({
    canRead: true,
    canWrite: false,
    canExecute: false,
    canDelete: false,
    canShare: false
  });
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null, type: 'file' });
  
  // Additional states for new features
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Initialize blockchain connection
  useEffect(() => {
    initializeBlockchainConnection();
  }, []);

  const initializeBlockchainConnection = async () => {
    setIsLoading(true);
    try {
      const result = await fileManagerService.initialize();
      if (result.success) {
        setIsConnected(true);
        await loadBlockchainFiles();
        showNotification('Connected to blockchain successfully!', 'success');
      } else {
        showNotification(`Failed to connect to blockchain: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Blockchain connection error:', error);
      showNotification('Failed to connect to blockchain', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load files from blockchain
  const loadBlockchainFiles = async () => {
    try {
      const result = await fileManagerService.loadFileSystem();
      if (result.success) {
        setBlockchainFiles(result.fileSystem.files);
        setBlockchainFolders(result.fileSystem.folders);
        console.log('Loaded files from blockchain:', result.fileSystem);
      } else {
        showNotification(`Failed to load files: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showNotification('Failed to load files from blockchain', 'error');
    }
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!isConnected) {
      showNotification('Please connect to blockchain first', 'error');
      return;
    }

    setIsProgressModalOpen(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        setUploadProgress(progress * 0.9); // Reserve 10% for blockchain transaction

        const metadata = {
          filePath: currentPath,
          description: `Uploaded via DocuChain on ${new Date().toLocaleString()}`,
          tags: ['user-upload'],
          parentFolderId: getCurrentFolderId()
        };

        const result = await fileManagerService.createFile(file, metadata);
        
        if (result.success) {
          console.log('File uploaded successfully:', result);
          setUploadProgress(((i + 1) / files.length) * 100);
        } else {
          throw new Error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }

      // Reload files after successful upload
      await loadBlockchainFiles();
      showNotification(`Successfully uploaded ${files.length} file(s)!`, 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsProgressModalOpen(false);
      setUploadProgress(0);
      setIsUploadModalOpen(false);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!isConnected) {
      showNotification('Please connect to blockchain first', 'error');
      return;
    }

    if (!newFolderName.trim()) {
      showNotification('Please enter a folder name', 'error');
      return;
    }

    try {
      const result = await fileManagerService.createFolder(
        newFolderName.trim(),
        currentPath,
        getCurrentFolderId()
      );

      if (result.success) {
        await loadBlockchainFiles();
        showNotification(`Folder "${newFolderName}" created successfully!`, 'success');
        setNewFolderName('');
        setIsCreateFolderModalOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Folder creation error:', error);
      showNotification(`Failed to create folder: ${error.message}`, 'error');
    }
  };

  // Handle file update (new version)
  const handleFileUpdate = async (fileId, newFile, description) => {
    if (!isConnected) {
      showNotification('Please connect to blockchain first', 'error');
      return;
    }

    setIsProgressModalOpen(true);
    setUploadProgress(0);

    try {
      setUploadProgress(50);
      
      const result = await fileManagerService.updateFile(fileId, newFile, description);
      
      if (result.success) {
        setUploadProgress(100);
        await loadBlockchainFiles();
        showNotification('File updated successfully with new version!', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('File update error:', error);
      showNotification(`Failed to update file: ${error.message}`, 'error');
    } finally {
      setIsProgressModalOpen(false);
      setUploadProgress(0);
    }
  };

  // Handle file rename
  const handleFileRename = async (fileId, newName) => {
    if (!isConnected) {
      showNotification('Please connect to blockchain first', 'error');
      return;
    }

    try {
      const result = await fileManagerService.renameFile(fileId, newName);
      
      if (result.success) {
        await loadBlockchainFiles();
        showNotification('File renamed successfully!', 'success');
        setRenameItem(null);
        setNewName('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Rename error:', error);
      showNotification(`Failed to rename file: ${error.message}`, 'error');
    }
  };

  // Handle file sharing
  const handleFileShare = async (fileId, shareWithAddress, permissions) => {
    if (!isConnected) {
      showNotification('Please connect to blockchain first', 'error');
      return;
    }

    try {
      const result = await fileManagerService.shareFile(fileId, shareWithAddress, permissions);
      
      if (result.success) {
        showNotification('File shared successfully!', 'success');
        setIsShareModalOpen(false);
        setSelectedRecipients([]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Share error:', error);
      showNotification(`Failed to share file: ${error.message}`, 'error');
    }
  };

  // View file versions
  const viewFileVersions = async (fileId) => {
    try {
      const result = await fileManagerService.getFileVersions(fileId);
      
      if (result.success) {
        setFileVersions(result.versions);
        setIsVersionModalOpen(true);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Version history error:', error);
      showNotification(`Failed to load version history: ${error.message}`, 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Get current folder ID based on path
  const getCurrentFolderId = () => {
    // This would need to be implemented based on your folder structure
    // For now, return null (root folder)
    return null;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Handle context menu
  const handleContextMenu = (event, item, type) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      item,
      type
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null, type: 'file' });
  };

  // Filter and sort files
  const getFilteredAndSortedFiles = () => {
    let filteredFiles = [...blockchainFiles];

    // Apply search filter
    if (searchTerm) {
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (currentFilter !== 'all') {
      filteredFiles = filteredFiles.filter(file => {
        switch (currentFilter) {
          case 'documents':
            return file.type.includes('pdf') || file.type.includes('doc') || file.type.includes('text');
          case 'images':
            return file.type.includes('image');
          case 'videos':
            return file.type.includes('video');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filteredFiles.sort((a, b) => {
      const direction = currentSort.direction === 'asc' ? 1 : -1;
      
      switch (currentSort.field) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'size':
          return direction * (a.size - b.size);
        case 'date':
          return direction * (a.lastModified.getTime() - b.lastModified.getTime());
        case 'type':
          return direction * a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filteredFiles;
  };

  return (
    <div className={`file-manager-new enhanced-blockchain ${currentTheme}`}>
      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <i className={`ri-${isConnected ? 'checkbox-circle' : 'error-warning'}-line`}></i>
          <span>{isConnected ? 'Connected to Blockchain' : 'Not Connected'}</span>
        </div>
        {!isConnected && (
          <button 
            className="btn primary" 
            onClick={initializeBlockchainConnection}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect to Blockchain'}
          </button>
        )}
      </div>

      {/* File Manager Header */}
      <div className="file-manager-header">
        <div className="header-actions">
          <div className="search-box">
            <i className="ri-search-line"></i>
            <input
              type="text"
              placeholder="Search files, descriptions, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="view-controls">
            <button 
              className={`btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="ri-grid-line"></i>
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="ri-list-check"></i>
            </button>
          </div>

          <div className="action-buttons">
            <button 
              className="btn primary"
              onClick={() => setIsUploadModalOpen(true)}
              disabled={!isConnected}
            >
              <i className="ri-upload-2-line"></i>
              Upload Files
            </button>
            <button 
              className="btn secondary"
              onClick={() => setIsCreateFolderModalOpen(true)}
              disabled={!isConnected}
            >
              <i className="ri-folder-add-line"></i>
              New Folder
            </button>
            <button 
              className="btn secondary"
              onClick={loadBlockchainFiles}
              disabled={!isConnected || isLoading}
            >
              <i className="ri-refresh-line"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="filter-sort-controls">
          <div className="filter-buttons">
            {['all', 'documents', 'images', 'videos'].map(filter => (
              <button
                key={filter}
                className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
                onClick={() => setCurrentFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="sort-controls">
            <select 
              value={currentSort.field}
              onChange={(e) => setCurrentSort({ ...currentSort, field: e.target.value })}
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="date">Date</option>
              <option value="type">Type</option>
            </select>
            <button
              className="sort-direction"
              onClick={() => setCurrentSort({ 
                ...currentSort, 
                direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
              })}
            >
              <i className={`ri-arrow-${currentSort.direction === 'asc' ? 'up' : 'down'}-line`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      <div className={`files-container ${viewMode}`}>
        {isLoading ? (
          <div className="loading-state">
            <i className="ri-loader-4-line spin"></i>
            <p>Loading files from blockchain...</p>
          </div>
        ) : blockchainFiles.length === 0 && isConnected ? (
          <div className="empty-state">
            <i className="ri-file-list-line"></i>
            <h3>No Files Yet</h3>
            <p>Upload your first file to get started with blockchain storage!</p>
            <button 
              className="btn primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <i className="ri-upload-2-line"></i>
              Upload Files
            </button>
          </div>
        ) : (
          <div className="files-grid">
            {getFilteredAndSortedFiles().map(file => (
              <div
                key={file.id}
                className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                onClick={() => setCurrentFile(file)}
              >
                <div className="file-icon">
                  {file.isFolder ? (
                    <i className="ri-folder-line"></i>
                  ) : file.type.includes('image') ? (
                    <img src={file.downloadUrl} alt={file.name} onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }} />
                  ) : (
                    <i className={`ri-file-${file.type.includes('pdf') ? 'pdf' : 'text'}-line`}></i>
                  )}
                  <i className="ri-file-line" style={{display: 'none'}}></i>
                </div>

                <div className="file-details">
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-date">{formatDate(file.lastModified)}</span>
                    {file.currentVersion > 1 && (
                      <span className="version-badge">v{file.currentVersion}</span>
                    )}
                  </div>
                  <div className="file-tags">
                    {file.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="file-actions">
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.downloadUrl, '_blank');
                    }}
                    title="Download"
                  >
                    <i className="ri-download-line"></i>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewFileVersions(file.id);
                    }}
                    title="Version History"
                  >
                    <i className="ri-history-line"></i>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentFile(file);
                      setIsShareModalOpen(true);
                    }}
                    title="Share"
                  >
                    <i className="ri-share-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            <i className={`ri-${notification.type === 'success' ? 'check' : 'error-warning'}-line`}></i>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}

      {/* Add all the modals here - Upload, Share, Version History, etc. */}
      {/* This would be a substantial amount of JSX for the modals */}
      
    </div>
  );
};

export default EnhancedFileManager;