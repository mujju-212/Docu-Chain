import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GlobalSearch.css';

const GlobalSearch = ({ onNavigate, onOpenChat, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'users', 'documents'
  const [results, setResults] = useState({ users: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const allResults = [...results.users, ...results.documents];
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          if (selected.type === 'user') {
            handleUserClick(selected);
          } else {
            handleDocumentClick(selected);
          }
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Search function with debounce
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults({ users: [], documents: [] });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      const searchPromises = [];

      // Search users if type is 'all' or 'users'
      if (searchType === 'all' || searchType === 'users') {
        searchPromises.push(
          fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : { users: [] })
        );
      } else {
        searchPromises.push(Promise.resolve({ users: [] }));
      }

      // Search documents if type is 'all' or 'documents'
      if (searchType === 'all' || searchType === 'documents') {
        searchPromises.push(
          fetch(`${API_URL}/documents/search?q=${encodeURIComponent(query)}&recursive=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : { documents: [] })
        );
      } else {
        searchPromises.push(Promise.resolve({ documents: [] }));
      }

      const [usersData, documentsData] = await Promise.all(searchPromises);

      setResults({
        users: (usersData.users || []).map(u => ({ ...u, type: 'user' })),
        documents: (documentsData.documents || []).map(d => ({ ...d, type: 'document' }))
      });
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ users: [], documents: [] });
    } finally {
      setLoading(false);
    }
  }, [API_URL, searchType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle user click - open chat with user
  const handleUserClick = async (user) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Create or get direct conversation with user
      const res = await fetch(`${API_URL}/chat/conversations/direct/${user.id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Store the conversation ID for the chat to open
        if (data.conversation?.id || data.id) {
          sessionStorage.setItem('openConversationId', data.conversation?.id || data.id);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    
    // Always navigate to chat page
    if (onOpenChat) {
      onOpenChat(user.id);
    } else if (onNavigate) {
      onNavigate('chat');
    }

    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle document click - navigate to file manager with document path
  const handleDocumentClick = (document) => {
    // Store the document to highlight in session storage
    sessionStorage.setItem('highlightDocument', JSON.stringify({
      id: document.id,
      folderId: document.folder_id || document.folderId || null,
      name: document.name || document.filename
    }));

    // Navigate to file manager
    if (onNavigate) {
      onNavigate('files');
    }

    setIsOpen(false);
    setSearchQuery('');
  };

  // Get user display name
  const getUserDisplayName = (user) => {
    if (user.first_name || user.firstName) {
      return `${user.first_name || user.firstName} ${user.last_name || user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  // Get file icon based on type
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const icons = {
      pdf: 'ri-file-pdf-line',
      doc: 'ri-file-word-line',
      docx: 'ri-file-word-line',
      xls: 'ri-file-excel-line',
      xlsx: 'ri-file-excel-line',
      ppt: 'ri-file-ppt-line',
      pptx: 'ri-file-ppt-line',
      jpg: 'ri-image-line',
      jpeg: 'ri-image-line',
      png: 'ri-image-line',
      gif: 'ri-image-line',
      mp4: 'ri-video-line',
      mp3: 'ri-music-line',
      zip: 'ri-file-zip-line',
      rar: 'ri-file-zip-line',
      txt: 'ri-file-text-line',
      json: 'ri-file-code-line',
      js: 'ri-file-code-line',
      py: 'ri-file-code-line',
    };
    return icons[ext] || 'ri-file-line';
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const hasResults = results.users.length > 0 || results.documents.length > 0;
  const allResults = [...results.users, ...results.documents];

  return (
    <div className="global-search-container" ref={searchRef}>
      {/* Search Input */}
      <div className={`global-search-box ${isOpen ? 'active' : ''}`}>
        <i className="ri-search-line search-icon"></i>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search users, documents..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => {
            setSearchQuery('');
            setResults({ users: [], documents: [] });
            inputRef.current?.focus();
          }}>
            <i className="ri-close-line"></i>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.length >= 2 && (
        <div className="global-search-dropdown" ref={resultsRef}>
          {/* Search Type Filter */}
          <div className="search-type-filter">
            <button 
              className={searchType === 'all' ? 'active' : ''} 
              onClick={() => setSearchType('all')}
            >
              <i className="ri-apps-line"></i> All
            </button>
            <button 
              className={searchType === 'users' ? 'active' : ''} 
              onClick={() => setSearchType('users')}
            >
              <i className="ri-user-line"></i> Users
            </button>
            <button 
              className={searchType === 'documents' ? 'active' : ''} 
              onClick={() => setSearchType('documents')}
            >
              <i className="ri-file-line"></i> Documents
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="search-loading">
              <i className="ri-loader-4-line spin"></i>
              <span>Searching...</span>
            </div>
          )}

          {/* No Results */}
          {!loading && !hasResults && searchQuery.length >= 2 && (
            <div className="search-no-results">
              <i className="ri-search-line"></i>
              <span>No results found for "{searchQuery}"</span>
            </div>
          )}

          {/* User Results */}
          {!loading && results.users.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <i className="ri-user-line"></i>
                <span>Users ({results.users.length})</span>
              </div>
              <div className="search-results-list">
                {results.users.map((user, index) => (
                  <div
                    key={user.id}
                    className={`search-result-item user-item ${selectedIndex === index ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user);
                    }}
                  >
                    <div className="result-avatar">
                      {getUserDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <div className="result-info">
                      <div className="result-name">{getUserDisplayName(user)}</div>
                      <div className="result-details">
                        <span className="result-email">{user.email}</span>
                        {user.unique_id && <span className="result-id">ID: {user.unique_id}</span>}
                        {user.phone && <span className="result-phone">{user.phone}</span>}
                      </div>
                    </div>
                    <div className="result-role">{user.role}</div>
                    <button 
                      className="result-action chat-action" 
                      title="Open Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user);
                      }}
                    >
                      <i className="ri-chat-3-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Results */}
          {!loading && results.documents.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <i className="ri-file-line"></i>
                <span>Documents ({results.documents.length})</span>
              </div>
              <div className="search-results-list">
                {results.documents.map((doc, index) => {
                  const adjustedIndex = results.users.length + index;
                  return (
                    <div
                      key={doc.id}
                      className={`search-result-item document-item ${selectedIndex === adjustedIndex ? 'selected' : ''}`}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="result-icon">
                        <i className={getFileIcon(doc.name || doc.fileName || doc.filename || doc.file_name)}></i>
                      </div>
                      <div className="result-info">
                        <div className="result-name">{doc.name || doc.fileName || doc.filename || doc.file_name || 'Unnamed Document'}</div>
                        <div className="result-details">
                          {(doc.folder_name || doc.folderName) ? (
                            <span className="result-path">
                              <i className="ri-folder-line"></i> {doc.folder_name || doc.folderName}
                            </span>
                          ) : (
                            <span className="result-path">
                              <i className="ri-folder-line"></i> Root
                            </span>
                          )}
                          {(doc.size || doc.fileSize) ? (
                            <span className="result-size">{formatSize(doc.size || doc.fileSize)}</span>
                          ) : null}
                          {(doc.document_type || doc.documentType) && (
                            <span className="result-type">{doc.document_type || doc.documentType}</span>
                          )}
                        </div>
                      </div>
                      <button className="result-action open-action" title="Open in File Manager">
                        <i className="ri-external-link-line"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          {hasResults && (
            <div className="search-hints">
              <span><kbd>↑↓</kbd> Navigate</span>
              <span><kbd>Enter</kbd> Select</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
