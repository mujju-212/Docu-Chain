import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { io } from 'socket.io-client';
import blockchainServiceV2 from '../../services/blockchainServiceV2';

// Get API URL with production domain fallback (same logic as api.js)
const getApiUrl = () => {
  // If on production domain without env var, use production API
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'www.docuchain.tech' || 
       window.location.hostname === 'docuchain.tech')) {
    return 'https://docu-chain-api.azurewebsites.net/api';
  }
  
  let url = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  // Force HTTPS in production (when not localhost)
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }
  return url;
};

const API_URL = getApiUrl();
import {
    requestApprovalOnBlockchain,
    approveDocumentOnBlockchain,
    rejectDocumentOnBlockchain,
    getApprovalRequestFromBlockchain
} from '../../utils/metamask';
import Web3 from 'web3';
import './ChatInterface.css';
import './ChatInterface.mobile.css';

// For socket, remove /api suffix
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

// Helper function to format timestamp properly with local timezone
const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
        // Parse the ISO timestamp - if it doesn't have timezone info, treat as UTC
        let date;
        if (typeof timestamp === 'string') {
            // Add 'Z' suffix if not present to indicate UTC
            const isoString = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
            date = new Date(isoString);
        } else {
            date = new Date(timestamp);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return timestamp; // Return original if parsing fails
        }
        
        // Format in local time
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    } catch (e) {
        console.error('Error formatting time:', e);
        return timestamp;
    }
};

// Helper function for relative time (e.g., "2 minutes ago", "Yesterday")
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
        let date;
        if (typeof timestamp === 'string') {
            const isoString = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
            date = new Date(isoString);
        } else {
            date = new Date(timestamp);
        }
        
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    } catch (e) {
        return '';
    }
};

// Helper function for last seen time
const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    try {
        let date;
        if (typeof timestamp === 'string') {
            const isoString = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
            date = new Date(isoString);
        } else {
            date = new Date(timestamp);
        }
        
        if (isNaN(date.getTime())) return 'Unknown';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Online';
        if (diffMins < 5) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric'
        });
    } catch (e) {
        return 'Unknown';
    }
};

const ChatInterface = () => {
    const { currentTheme } = useTheme();
    // The theme context provides color themes (green, blue, etc.)
    // ChatInterface CSS uses theme-light/theme-dark for mode
    // Default to 'light' mode for now
    const theme = 'light';
    
    // Get current user from localStorage - try multiple sources
    const [currentUser, setCurrentUser] = useState(() => {
        // Try getting the full user object first
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('🔐 Auth Check - User:', storedUser ? 'Found' : 'Not found', '| Token:', token ? 'Found' : 'Not found');
        
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                console.log('👤 Current User from "user":', parsed);
                return parsed;
            } catch (e) {
                console.error('❌ Failed to parse user from localStorage:', e);
            }
        }
        
        // Fallback: Build user object from individual items
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        
        if (userId) {
            const fallbackUser = {
                id: userId,
                email: userEmail,
                role: userRole,
                name: userName,
                firstName: userName?.split(' ')[0] || '',
                lastName: userName?.split(' ').slice(1).join(' ') || ''
            };
            console.log('👤 Current User from individual items:', fallbackUser);
            return fallbackUser;
        }
        
        return null;
    });

    // Effect to update currentUser if localStorage changes (e.g., after fresh login)
    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem('user');
            const userId = localStorage.getItem('userId');
            
            // Always try to build user from available data
            let userObj = null;
            
            if (storedUser) {
                try {
                    userObj = JSON.parse(storedUser);
                    console.log('🔄 User from "user" key:', userObj);
                } catch (e) {
                    console.error('Failed to parse user:', e);
                }
            }
            
            // If no user object or it doesn't have id, build from individual items
            if ((!userObj || !userObj.id) && userId) {
                const userEmail = localStorage.getItem('userEmail');
                const userRole = localStorage.getItem('userRole');
                const userName = localStorage.getItem('userName');
                userObj = {
                    id: userId,
                    email: userEmail,
                    role: userRole,
                    name: userName,
                    firstName: userName?.split(' ')[0] || '',
                    lastName: userName?.split(' ').slice(1).join(' ') || ''
                };
                console.log('🔄 Built user from individual items:', userObj);
                
                // Also save this to 'user' key for future use
                localStorage.setItem('user', JSON.stringify(userObj));
            }
            
            // Update state if we have a user and it's different
            if (userObj && userObj.id && (!currentUser || currentUser.id !== userObj.id)) {
                console.log('✅ Setting currentUser:', userObj);
                setCurrentUser(userObj);
            }
        };
        
        // Check immediately and also set up storage event listener
        checkUser();
        window.addEventListener('storage', checkUser);
        
        // Also check periodically in case of issues
        const interval = setInterval(checkUser, 2000);
        
        return () => {
            window.removeEventListener('storage', checkUser);
            clearInterval(interval);
        };
    }, [currentUser]);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentDocumentAction, setCurrentDocumentAction] = useState('share');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isDocumentShareModalOpen, setIsDocumentShareModalOpen] = useState(false);
    const [isDocumentSelectionModalOpen, setIsDocumentSelectionModalOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isMobileSidebarHidden, setIsMobileSidebarHidden] = useState(() => {
        // Initialize based on screen size - on mobile, start with sidebar visible (no chat selected)
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            // Check if there's a cached selected chat
            const cachedChat = sessionStorage.getItem('chat_selectedChat');
            return cachedChat ? true : false;
        }
        return false;
    });
    const [showMobileCircularsFeed, setShowMobileCircularsFeed] = useState(false);
    
    // New State for enhanced features
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [searchInConversation, setSearchInConversation] = useState('');
    
    // New states for user search and real data
    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [creationType, setCreationType] = useState('group');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Circulars feed state
    const [circularsFeed, setCircularsFeed] = useState([]);
    const [canPostCircular, setCanPostCircular] = useState(false);
    const [circularsList, setCircularsList] = useState([]);
    const [newCircularPost, setNewCircularPost] = useState('');
    const [selectedCircularId, setSelectedCircularId] = useState('');
    const [circularAttachment, setCircularAttachment] = useState(null);
    const circularFileInputRef = useRef(null);
    
    // Enhanced Circulars state
    const [circularView, setCircularView] = useState('feed'); // 'feed', 'create', or 'saved'
    const [circularImages, setCircularImages] = useState([]); // Local image uploads
    const [circularBlockchainDoc, setCircularBlockchainDoc] = useState(null); // Blockchain document
    const [showDocumentPicker, setShowDocumentPicker] = useState(false);
    const [availableBlockchainDocs, setAvailableBlockchainDocs] = useState([]);
    const [circularComments, setCircularComments] = useState({}); // { postId: [comments] }
    const [showCommentsFor, setShowCommentsFor] = useState(null); // postId to show comments
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [savedPosts, setSavedPosts] = useState(new Set());
    const [savedPostsList, setSavedPostsList] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [editPostContent, setEditPostContent] = useState('');
    const [postOptionsMenu, setPostOptionsMenu] = useState({ show: false, postId: null, x: 0, y: 0 });
    const [circularOptionsMenu, setCircularOptionsMenu] = useState({ show: false, circularId: null, x: 0, y: 0 });
    const [editingCircular, setEditingCircular] = useState(null);
    const [editCircularName, setEditCircularName] = useState('');
    const circularImageInputRef = useRef(null);

    // Shared documents modal state
    const [isSharedDocsModalOpen, setIsSharedDocsModalOpen] = useState(false);
    const [sharedDocuments, setSharedDocuments] = useState([]);
    const [approvalRequests, setApprovalRequests] = useState([]);
    const [signedDocuments, setSignedDocuments] = useState([]);
    const [loadingSharedDocs, setLoadingSharedDocs] = useState(false);
    const [sharedDocsTab, setSharedDocsTab] = useState('shared'); // 'shared', 'approvals', 'signed'
    
    // Loading state for documents in share modal
    const [loadingDocuments, setLoadingDocuments] = useState(false);

    // Message context menu state
    const [messageContextMenu, setMessageContextMenu] = useState({ show: false, x: 0, y: 0, message: null });

    // Search in conversation state
    const [isSearchingInConversation, setIsSearchingInConversation] = useState(false);
    const [conversationSearchResults, setConversationSearchResults] = useState([]);

    // Group details modal state
    const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
    const [groupDetails, setGroupDetails] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState([]);

    // Sharing progress state
    const [sharingProgress, setSharingProgress] = useState({
        isSharing: false,
        step: 0, // 0: idle, 1: preparing, 2: uploading, 3: confirming, 4: complete
        message: '',
        error: null
    });

    // Group bulk share state
    const [groupShareMode, setGroupShareMode] = useState(false);
    const [groupShareProgress, setGroupShareProgress] = useState({
        current: 0,
        total: 0,
        currentMember: '',
        completed: [],
        failed: []
    });

    // In-app modal state (replaces browser confirm/alert)
    const [appModal, setAppModal] = useState({
        show: false,
        type: 'alert', // 'alert', 'confirm', 'prompt'
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        inputValue: '',
        inputPlaceholder: ''
    });

    const messagesContainerRef = useRef(null);
    const contextMenuRef = useRef(null);
    const messageContextMenuRef = useRef(null);
    const socketRef = useRef(null);
    const lastMessageTimeRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    // Online status state
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});

    // Real data from API (with cache initialization)
    const [conversations, setConversations] = useState(() => {
        try {
            const cached = sessionStorage.getItem('chat_conversations');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [messages, setMessages] = useState(() => {
        try {
            const cached = sessionStorage.getItem('chat_messages');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [availableDocuments, setAvailableDocuments] = useState(() => {
        try {
            const cached = sessionStorage.getItem('chat_documents');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [teamMembers, setTeamMembers] = useState([]);
    
    // Restore selectedChat from sessionStorage
    const [selectedChat, setSelectedChat] = useState(() => {
        const cached = sessionStorage.getItem('chat_selectedChat');
        return cached ? parseInt(cached) : null;
    });
    
    // Restore activeTab from sessionStorage
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('chat_activeTab') || 'direct';
    });
    
    // Cache conversations when they change
    useEffect(() => {
        if (conversations.length > 0) {
            sessionStorage.setItem('chat_conversations', JSON.stringify(conversations));
        }
    }, [conversations]);
    
    // Cache messages when they change (limit to last 100 for performance)
    useEffect(() => {
        if (messages.length > 0) {
            const toCache = messages.slice(-100);
            sessionStorage.setItem('chat_messages', JSON.stringify(toCache));
        }
    }, [messages]);
    
    // Cache documents when they change
    useEffect(() => {
        if (availableDocuments.length > 0) {
            sessionStorage.setItem('chat_documents', JSON.stringify(availableDocuments));
        }
    }, [availableDocuments]);
    
    // Cache selectedChat when it changes
    useEffect(() => {
        if (selectedChat) {
            sessionStorage.setItem('chat_selectedChat', selectedChat.toString());
        } else {
            sessionStorage.removeItem('chat_selectedChat');
        }
    }, [selectedChat]);
    
    // Sync mobile sidebar state with selectedChat and window resize
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && selectedChat) {
                // On mobile with a selected chat, hide sidebar to show chat area
                setIsMobileSidebarHidden(true);
            } else if (isMobile && !selectedChat) {
                // On mobile with no selected chat, show sidebar (conversation list)
                setIsMobileSidebarHidden(false);
            }
            // On desktop, sidebar is always visible (handled by CSS)
        };
        
        // Run on mount and when selectedChat changes
        handleResize();
        
        // Listen for resize events
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [selectedChat]);
    
    // Cache activeTab when it changes
    useEffect(() => {
        sessionStorage.setItem('chat_activeTab', activeTab);
    }, [activeTab]);
    
    // Document selection modal filters
    const [docSearchQuery, setDocSearchQuery] = useState('');
    const [docSortBy, setDocSortBy] = useState('date'); // date, name, type, size
    const [docSortOrder, setDocSortOrder] = useState('desc'); // asc, desc
    const [docFilterType, setDocFilterType] = useState('all'); // all, pdf, image, doc, etc.
    const [sharePermission, setSharePermission] = useState('read'); // read, write

    // Multi-recipient approval state
    const [isMultiRecipientModalOpen, setIsMultiRecipientModalOpen] = useState(false);
    const [approvalRecipients, setApprovalRecipients] = useState([]);
    const [approvalWorkflow, setApprovalWorkflow] = useState('parallel'); // 'parallel' or 'sequential'
    const [approvalType, setApprovalType] = useState('standard'); // 'standard' or 'digital'
    const [approvalPurpose, setApprovalPurpose] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [approvalUserSearch, setApprovalUserSearch] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [approvalProgress, setApprovalProgress] = useState({
        isProcessing: false,
        step: 0,
        message: '',
        error: null
    });

    // Approval action state (for approve/reject from chat)
    const [approvalActionModal, setApprovalActionModal] = useState({
        show: false,
        type: '', // 'approve' or 'reject'
        request: null,
        message: null
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [isApprovalActionProcessing, setIsApprovalActionProcessing] = useState(false);

    // In-app modal helpers (replaces browser confirm/alert/prompt)
    const showAlert = useCallback((title, message) => {
        setAppModal({
            show: true,
            type: 'alert',
            title,
            message,
            onConfirm: () => setAppModal(prev => ({ ...prev, show: false })),
            onCancel: null,
            inputValue: '',
            inputPlaceholder: ''
        });
    }, []);

    const showConfirm = useCallback((title, message, onConfirm) => {
        setAppModal({
            show: true,
            type: 'confirm',
            title,
            message,
            onConfirm: () => {
                setAppModal(prev => ({ ...prev, show: false }));
                if (onConfirm) onConfirm();
            },
            onCancel: () => setAppModal(prev => ({ ...prev, show: false })),
            inputValue: '',
            inputPlaceholder: ''
        });
    }, []);

    const showPrompt = useCallback((title, message, placeholder, onConfirm) => {
        setAppModal({
            show: true,
            type: 'prompt',
            title,
            message,
            onConfirm: (value) => {
                setAppModal(prev => ({ ...prev, show: false }));
                if (onConfirm) onConfirm(value);
            },
            onCancel: () => setAppModal(prev => ({ ...prev, show: false })),
            inputValue: '',
            inputPlaceholder: placeholder || ''
        });
    }, []);

    // Get auth header
    const getAuthHeader = useCallback(() => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    // Fetch all users for approval recipient selection
    const fetchAllUsersForApproval = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch(`${API_URL}/users/institution`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                // Filter out current user (already filtered by backend, but just in case)
                const users = (data.users || []).filter(u => 
                    String(u.id) !== String(currentUser?.id)
                );
                console.log('📋 Loaded users for approval:', users.length);
                setAllUsers(users);
            } else {
                console.error('Failed to fetch users:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [getAuthHeader, currentUser]);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('📡 Fetching conversations... Token present:', !!token);
            
            if (!token) {
                console.error('❌ No token found in localStorage');
                setLoading(false);
                return;
            }
            
            const response = await fetch(`${API_URL}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('📥 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Conversations received:', data.conversations?.length || 0, 'conversations');
                console.log('📋 Conversations data:', data.conversations);
                setConversations(data.conversations || []);
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to fetch conversations:', response.status, errorText);
            }
        } catch (error) {
            console.error('❌ Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch circulars feed
    const fetchCircularsFeed = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/chat/circulars/feed`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setCircularsFeed(data.feed || []);
                setCanPostCircular(data.canPost || false);
                setCircularsList(data.circulars || []);
                if (data.circulars?.length > 0 && !selectedCircularId) {
                    setSelectedCircularId(data.circulars[0].id);
                }
                
                // Initialize liked and saved posts from server response
                const liked = new Set();
                const saved = new Set();
                (data.feed || []).forEach(item => {
                    if (item.userLiked) liked.add(item.id);
                    if (item.userSaved) saved.add(item.id);
                });
                setLikedPosts(liked);
                setSavedPosts(saved);
            }
        } catch (error) {
            console.error('Error fetching circulars feed:', error);
        }
    }, [getAuthHeader, selectedCircularId]);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId) => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                if (data.messages && data.messages.length > 0) {
                    lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [getAuthHeader]);

    // Poll for new messages (HTTP fallback when WebSocket not connected)
    const pollMessages = useCallback(async () => {
        if (!selectedChat) return;
        
        // Skip if WebSocket is connected
        if (socketRef.current && socketRef.current.connected) return;
        
        try {
            const params = lastMessageTimeRef.current 
                ? `?since=${encodeURIComponent(lastMessageTimeRef.current)}` 
                : '';
            
            const response = await fetch(
                `${API_URL}/chat/conversations/${selectedChat}/poll${params}`,
                { headers: getAuthHeader() }
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    // Filter out own messages and duplicates
                    const newMessages = data.messages.filter(msg => 
                        msg.senderId !== currentUser?.id && 
                        msg.sender_id !== currentUser?.id
                    );
                    
                    if (newMessages.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
                            return [...prev, ...uniqueNew];
                        });
                    }
                    lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
                }
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    }, [selectedChat, getAuthHeader, currentUser]);

    // Update online status
    const updateOnlineStatus = useCallback(async (isOnline) => {
        try {
            await fetch(`${API_URL}/chat/status/${isOnline ? 'online' : 'offline'}`, {
                method: 'POST',
                headers: getAuthHeader()
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }, [getAuthHeader]);

    // Search users
    const searchUsers = useCallback(async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}/chat/users/search?q=${encodeURIComponent(query)}`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    }, [getAuthHeader]);

    // Fetch user's documents for sharing (get ALL documents)
    const fetchDocuments = useCallback(async () => {
        console.log('📄 Starting fetchDocuments...');
        console.log('📄 API_URL:', API_URL);
        setLoadingDocuments(true);
        try {
            const headers = getAuthHeader();
            console.log('📄 Auth headers:', headers.Authorization ? 'Token present' : 'No token');
            
            const url = `${API_URL}/documents?all=true`;
            console.log('📄 Fetching from URL:', url);
            
            const response = await fetch(url, {
                headers: headers
            });
            
            console.log('📄 Documents response status:', response.status);
            console.log('📄 Documents response URL:', response.url);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📄 Fetched documents SUCCESS:', data.documents?.length || 0, data);
                const docs = data.documents || data || [];
                setAvailableDocuments(docs);
                // Update sessionStorage with fresh data
                sessionStorage.setItem('chat_documents', JSON.stringify(docs));
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to fetch documents:', response.status, errorText);
                setAvailableDocuments([]);
                // Clear stale cache
                sessionStorage.removeItem('chat_documents');
            }
        } catch (error) {
            console.error('❌ Error fetching documents:', error);
            console.error('❌ Error details:', error.message, error.stack);
            setAvailableDocuments([]);
            // Clear stale cache
            sessionStorage.removeItem('chat_documents');
        } finally {
            console.log('📄 fetchDocuments complete, setting loadingDocuments to false');
            setLoadingDocuments(false);
        }
    }, [getAuthHeader]);

    // Initial data load (don't wait for WebSocket)
    useEffect(() => {
        // Always try to fetch on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('🔄 ChatInterface mounted - Token:', !!token, 'User:', !!storedUser);
        
        if (token && storedUser) {
            console.log('👤 Auth found, fetching conversations immediately...');
            fetchConversations();
            fetchDocuments();
            
            // Also set currentUser if not set
            if (!currentUser) {
                try {
                    setCurrentUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error('Failed to parse user');
                }
            }
        } else {
            console.log('⚠️ No auth found, stopping loading');
            setLoading(false);
        }
    }, []); // Empty deps - run only on mount

    // Re-fetch when currentUser changes
    useEffect(() => {
        if (currentUser) {
            console.log('👤 currentUser changed, re-fetching...');
            fetchConversations();
        }
    }, [currentUser, fetchConversations]);

    // Check for openConversationId from GlobalSearch and auto-select that conversation
    useEffect(() => {
        const openConversationId = sessionStorage.getItem('openConversationId');
        if (openConversationId && conversations.length > 0) {
            const conversationToOpen = conversations.find(c => c.id === parseInt(openConversationId) || c.id === openConversationId);
            if (conversationToOpen) {
                console.log('🔓 Auto-opening conversation from GlobalSearch:', conversationToOpen.id);
                setSelectedChat(conversationToOpen.id);
                setActiveTab('direct');
                sessionStorage.removeItem('openConversationId');
            } else {
                // Conversation not found, maybe it was just created - clear anyway
                sessionStorage.removeItem('openConversationId');
            }
        }
    }, [conversations]);

    // Fetch circulars when switching to circulars tab
    useEffect(() => {
        if (activeTab === 'circulars' && currentUser) {
            fetchCircularsFeed();
        }
    }, [activeTab, currentUser, fetchCircularsFeed]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Close post options menu
            if (postOptionsMenu.show && !e.target.closest('.post-options-wrapper')) {
                setPostOptionsMenu({ show: false, postId: null, x: 0, y: 0 });
            }
            // Close circular options menu
            if (circularOptionsMenu.show && !e.target.closest('.circular-options-wrapper')) {
                setCircularOptionsMenu({ show: false, circularId: null, x: 0, y: 0 });
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [postOptionsMenu.show, circularOptionsMenu.show]);

    // Initialize Socket.IO connection (optional enhancement)
    useEffect(() => {
        if (!currentUser) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Create socket connection
        try {
            socketRef.current = io(SOCKET_URL, {
                query: { token },
                transports: ['polling'],  // Use polling only - more reliable with Flask-SocketIO threading mode
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
                timeout: 10000,
                forceNew: true
            });
            
            const socket = socketRef.current;
            
            // Connection events
            socket.on('connect', () => {
                console.log('✅ Connected to chat server via WebSocket');
            });
            
            socket.on('disconnect', () => {
                console.log('❌ Disconnected from chat server');
            });
            
            socket.on('connect_error', (error) => {
                console.warn('WebSocket connection failed, using HTTP fallback:', error.message);
            });
        
        // New message received (from OTHER users only - sender uses message_sent)
        socket.on('new_message', (message) => {
            console.log('📨 new_message received:', message);
            
            // Skip if this is our own message (we already added it optimistically)
            if (message.senderId === currentUser?.id || message.sender_id === currentUser?.id) {
                console.log('⏭️ Skipping own message in new_message handler');
                return;
            }
            
            setMessages(prev => {
                // Avoid duplicates by checking both id and tempId
                if (prev.find(m => m.id === message.id)) {
                    console.log('⏭️ Skipping duplicate message');
                    return prev;
                }
                return [...prev, message];
            });
            
            // Update conversation list
            setConversations(prev => prev.map(conv => {
                if (conv.id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: message.content,
                        lastMessageAt: message.createdAt,
                        unreadCount: selectedChat === conv.id ? 0 : (conv.unreadCount || 0) + 1
                    };
                }
                return conv;
            }));
        });

        // Message sent confirmation (updates temp ID with real ID)
        socket.on('message_sent', (data) => {
            console.log('✅ message_sent confirmation:', data);
            if (data.tempId && data.message) {
                setMessages(prev => prev.map(msg => 
                    msg.id === data.tempId ? { ...msg, id: data.message.id, status: 'sent' } : msg
                ));
            }
        });
        
        // Message delivered status
        socket.on('message_delivered', (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
            ));
        });
        
        // Message read status
        socket.on('message_read', (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.messageId ? { ...msg, status: 'read' } : msg
            ));
        });
        
        // User typing indicator
        socket.on('user_typing', (data) => {
            if (data.isTyping) {
                setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName }));
            } else {
                setTypingUsers(prev => {
                    const newState = { ...prev };
                    delete newState[data.userId];
                    return newState;
                });
            }
        });
        
        // User online/offline status
        socket.on('user_online', (data) => {
            setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: true, lastSeen: data.lastSeen } }));
        });
        
        socket.on('user_offline', (data) => {
            setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: false, lastSeen: data.lastSeen } }));
        });
        
        } catch (error) {
            console.warn('Failed to initialize WebSocket:', error);
        }
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [currentUser, fetchConversations, fetchDocuments, selectedChat]);

    // Polling fallback ref
    const pollIntervalRef = useRef(null);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat);
            
            // Join the conversation room via WebSocket if connected
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('join_conversation', { conversationId: selectedChat });
            } else {
                // Start HTTP polling as fallback
                pollIntervalRef.current = setInterval(pollMessages, 5000);
            }
            
            return () => {
                // Leave the conversation room when deselecting
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('leave_conversation', { conversationId: selectedChat });
                }
                // Clear polling interval
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }
    }, [selectedChat, fetchMessages, pollMessages]);

    // Mark messages as read when viewing
    useEffect(() => {
        if (selectedChat && socketRef.current && socketRef.current.connected && messages.length > 0) {
            const unreadMessageIds = messages
                .filter(m => m.senderId !== currentUser?.id && m.status !== 'read')
                .map(m => m.id);
            if (unreadMessageIds.length > 0) {
                socketRef.current.emit('mark_read', { 
                    conversationId: selectedChat, 
                    messageIds: unreadMessageIds 
                });
            }
        }
    }, [selectedChat, messages, currentUser]);

    // Debounce user search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (userSearchQuery.length >= 2) {
                searchUsers(userSearchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [userSearchQuery, searchUsers]);

    // Instantly show latest messages (bottom) when chat is opened
    useEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            // Instantly set scroll position to bottom without animation
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [selectedChat]);
    
    // Also scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages.length]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setIsContextMenuOpen(false);
            }
            if (messageContextMenuRef.current && !messageContextMenuRef.current.contains(event.target)) {
                setMessageContextMenu({ show: false, x: 0, y: 0, message: null });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Simulate typing indicator (for demo)
    useEffect(() => {
        if (selectedChat === 2) {
            const timer = setTimeout(() => setIsTyping(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [selectedChat]);

    // Filter conversations based on search and active tab
    // When searching, also search for new users if no conversation matches
    const filteredConversations = conversations.filter(conv => {
        const name = conv.name || conv.user?.name || conv.otherUser?.name || 'Unknown';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'direct' ? conv.type === 'direct' :
                          activeTab === 'groups' ? conv.type === 'group' :
                          activeTab === 'circulars' ? conv.type === 'circular' : true;
        return matchesSearch && matchesTab;
    });

    // Debug log for conversations filtering
    console.log(`🔍 Filtering: ${conversations.length} total conversations, ${filteredConversations.length} match tab "${activeTab}"`);
    if (conversations.length > 0) {
        console.log('📊 Conversation types:', conversations.map(c => ({ id: c.id, type: c.type, name: c.name })));
    }

    // Search for users when typing in search bar (for new connections)
    useEffect(() => {
        if (searchQuery.length >= 2 && activeTab === 'direct') {
            searchUsers(searchQuery);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, activeTab, searchUsers]);

    // Filter search results to exclude users who already have conversations
    const newUsersToConnect = searchResults.filter(user => {
        return !conversations.some(conv => 
            conv.type === 'direct' && 
            (conv.userId === user.id || conv.otherUserId === user.id)
        );
    });

    // Profile Modal Functions
    const openProfileModal = () => {
        setIsProfileModalOpen(true);
        setIsContextMenuOpen(false);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    // Context Menu Functions
    const toggleContextMenu = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenuPosition({
            x: rect.left,
            y: rect.bottom + 5
        });
        setIsContextMenuOpen(!isContextMenuOpen);
    };

    const handleMuteConversation = async () => {
        const conv = conversations.find(c => c.id === selectedChat);
        await updateConversationSettings('isMuted', !conv?.isMuted);
        setIsContextMenuOpen(false);
    };

    const handlePinConversation = async () => {
        const conv = conversations.find(c => c.id === selectedChat);
        await updateConversationSettings('isPinned', !conv?.isPinned);
        setIsContextMenuOpen(false);
    };

    const handleBlockUser = async () => {
        const conv = conversations.find(c => c.id === selectedChat);
        if (conv && conv.type === 'direct') {
            const isBlocking = !conv?.isBlocked;
            setIsContextMenuOpen(false);
            
            showConfirm(
                isBlocking ? 'Block User' : 'Unblock User',
                isBlocking 
                    ? `Are you sure you want to block ${conv.name}? You won't receive messages from them.`
                    : `Are you sure you want to unblock ${conv.name}?`,
                async () => {
                    await updateConversationSettings('isBlocked', isBlocking);
                    // Update local state
                    setConversations(prev => prev.map(c => 
                        c.id === selectedChat ? { ...c, isBlocked: isBlocking } : c
                    ));
                }
            );
        }
    };

    const handleViewSharedDocuments = async () => {
        setIsContextMenuOpen(false);
        setIsSharedDocsModalOpen(true);
        setLoadingSharedDocs(true);
        setSharedDocsTab('shared');
        
        try {
            // Fetch shared documents for this conversation
            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/shared-documents`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setSharedDocuments(data.documents || []);
                setApprovalRequests(data.approvals || []);
                setSignedDocuments(data.signed || []);
            } else {
                // Fallback: Extract documents from messages
                extractDocumentsFromMessages();
            }
        } catch (error) {
            console.error('Error fetching shared documents:', error);
            extractDocumentsFromMessages();
        }
        setLoadingSharedDocs(false);
    };

    // Helper function to extract documents from messages
    const extractDocumentsFromMessages = () => {
        // Shared documents
        const sharedDocs = messages.filter(msg => 
            (msg.messageType || msg.message_type) === 'document_share' || 
            (msg.messageType || msg.message_type) === 'document_generated'
        ).map(msg => ({
            id: msg.documentId || msg.document_id || msg.document?.id,
            name: msg.documentName || msg.document_name || msg.document?.name || 'Document',
            hash: msg.documentHash || msg.document_hash || msg.document?.hash,
            size: msg.documentSize || msg.document_size || msg.document?.size,
            sharedAt: msg.createdAt || msg.timestamp,
            sharedBy: msg.senderName || msg.sender,
            isOwn: msg.isOwn
        }));
        
        // Approval requests
        const approvals = messages.filter(msg => 
            (msg.messageType || msg.message_type) === 'approval_request' ||
            (msg.messageType || msg.message_type) === 'digital_signature_request'
        ).map(msg => ({
            id: msg.approvalRequestId || msg.approval_request_id || msg.documentId || msg.document_id,
            name: msg.documentName || msg.document_name || msg.document?.name || 'Document',
            hash: msg.documentHash || msg.document_hash || msg.document?.hash,
            size: msg.documentSize || msg.document_size,
            requestedAt: msg.createdAt || msg.timestamp,
            requestedBy: msg.senderName || msg.sender,
            type: (msg.messageType || msg.message_type) === 'digital_signature_request' ? 'signature' : 'approval',
            status: 'pending',
            isOwn: msg.isOwn
        }));
        
        // Signed/Approved documents
        const signed = messages.filter(msg => 
            (msg.messageType || msg.message_type) === 'approval_approved' ||
            (msg.messageType || msg.message_type) === 'approval_signed' ||
            (msg.messageType || msg.message_type) === 'approval_rejected'
        ).map(msg => ({
            id: msg.documentId || msg.document_id,
            name: msg.documentName || msg.document_name || msg.document?.name || 'Document',
            hash: msg.documentHash || msg.document_hash,
            size: msg.documentSize || msg.document_size,
            processedAt: msg.createdAt || msg.timestamp,
            processedBy: msg.senderName || msg.sender,
            status: (msg.messageType || msg.message_type) === 'approval_rejected' ? 'rejected' : 
                    (msg.messageType || msg.message_type) === 'approval_signed' ? 'signed' : 'approved',
            isOwn: msg.isOwn
        }));
        
        setSharedDocuments(sharedDocs);
        setApprovalRequests(approvals);
        setSignedDocuments(signed);
    };

    const handleDeleteMessage = async (messageId) => {
        setMessageContextMenu({ show: false, x: 0, y: 0, message: null });
        
        showConfirm(
            'Delete Message',
            'Are you sure you want to delete this message?',
            async () => {
                try {
                    const response = await fetch(`${API_URL}/chat/messages/${messageId}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });

                    if (response.ok) {
                        // Update local state - show deleted message
                        setMessages(prev => prev.map(msg => 
                            msg.id === messageId 
                                ? { ...msg, content: 'This message was deleted', isDeleted: true }
                                : msg
                        ));
                    } else {
                        const error = await response.json();
                        showAlert('Error', error.error || 'Failed to delete message');
                    }
                } catch (error) {
                    console.error('Error deleting message:', error);
                    showAlert('Error', 'Failed to delete message');
                }
            }
        );
    };

    const handleMessageContextMenu = (e, msg, isOwn) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only allow context menu for own messages
        if (!isOwn) return;
        
        setMessageContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            message: msg
        });
    };

    const handleSearchInConversation = () => {
        setIsContextMenuOpen(false);
        setIsSearchingInConversation(true);
        setSearchInConversation('');
        setConversationSearchResults([]);
    };

    const performConversationSearch = (query) => {
        setSearchInConversation(query);
        if (query.length < 2) {
            setConversationSearchResults([]);
            return;
        }
        
        const results = messages.filter(msg => 
            msg.content?.toLowerCase().includes(query.toLowerCase())
        );
        setConversationSearchResults(results);
    };

    const scrollToMessage = (messageId) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            setTimeout(() => messageElement.classList.remove('highlight-message'), 2000);
        }
    };

    const handleRequestDocument = () => {
        closeProfileModal();
        openDocumentSelector('approval');
    };

    const handleReportUser = () => {
        closeProfileModal();
        showPrompt(
            'Report User',
            'Please provide a reason for reporting this user:',
            'Enter reason...',
            (reason) => {
                if (reason) {
                    showAlert('User Reported', `User has been reported.\n\nReason: ${reason}\n\nThis will be reviewed by administrators.`);
                }
            }
        );
    };

    const selectConversation = (id) => {
        setSelectedChat(id);
        const conversation = conversations.find(c => c.id === id);
        
        // Mark as read
        setConversations(conversations.map(c => 
            c.id === id ? { ...c, unread: 0 } : c
        ));

        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            setIsMobileSidebarHidden(true);
        }
    };

    const goBackToConversations = () => {
        setSelectedChat(null);
        setIsMobileSidebarHidden(false);
    };

    // Start a new conversation with a user
    const startConversation = async (user) => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'direct',
                    userId: user.id
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Refresh conversations and select the new one
                await fetchConversations();
                setSelectedChat(data.conversation.id);
                setIsUserSearchModalOpen(false);
                setUserSearchQuery('');
                setSearchQuery(''); // Clear main search bar
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            showAlert('Error', 'Failed to start conversation');
        }
    };

    // Create a new group or circular
    const createGroup = async () => {
        if (!newGroupName.trim()) {
            showAlert('Required', `Please enter a ${creationType} name`);
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/chat/conversations`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: creationType,
                    name: newGroupName,
                    members: newGroupMembers.map(m => m.id)
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                await fetchConversations();
                
                // If creating a circular, refresh the circulars feed too
                if (creationType === 'circular') {
                    await fetchCircularsFeed();
                    // Auto-select the newly created circular
                    if (data.conversation?.id) {
                        setSelectedCircularId(data.conversation.id);
                    }
                }
                
                setSelectedChat(data.conversation.id);
                setIsCreateGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupMembers([]);
                showAlert('Success', `${creationType === 'circular' ? 'Circular' : 'Group'} created successfully!`);
            }
        } catch (error) {
            console.error(`Error creating ${creationType}:`, error);
            showAlert('Error', `Failed to create ${creationType}`);
        }
    };

    // ============== GROUP MANAGEMENT FUNCTIONS ==============

    // Open group details modal
    const openGroupDetails = async () => {
        if (!selectedConversation || selectedConversation.type === 'direct') return;
        
        setLoadingGroupDetails(true);
        setIsGroupDetailsModalOpen(true);
        
        try {
            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setGroupDetails(data.conversation);
                setGroupMembers(data.conversation.membersList || []);
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            showAlert('Error', 'Failed to load group details');
        } finally {
            setLoadingGroupDetails(false);
        }
    };

    // Check if current user is group admin
    const isGroupAdmin = () => {
        if (!groupDetails || !currentUser) return false;
        const currentMember = groupMembers.find(m => String(m.userId) === String(currentUser.id));
        return currentMember?.role === 'admin' || String(groupDetails.createdBy) === String(currentUser.id);
    };

    // Check if group is default/auto-created (can't leave)
    const isDefaultGroup = () => {
        return groupDetails?.isAutoCreated === true;
    };

    // Exit group
    const exitGroup = async () => {
        if (isDefaultGroup()) {
            showAlert('Cannot Exit', 'You cannot leave default institution groups.');
            return;
        }

        showConfirm(
            'Exit Group',
            `Are you sure you want to leave "${groupDetails?.name}"? You will no longer receive messages from this group.`,
            async () => {
                try {
                    const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/members/${currentUser.id}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });
                    
                    if (response.ok) {
                        showAlert('Left Group', 'You have left the group successfully.');
                        setIsGroupDetailsModalOpen(false);
                        setSelectedChat(null);
                        await fetchConversations();
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to leave group');
                    }
                } catch (error) {
                    console.error('Error leaving group:', error);
                    showAlert('Error', error.message || 'Failed to leave group');
                }
            }
        );
    };

    // Remove member from group (admin only)
    const removeMember = async (memberId, memberName) => {
        if (!isGroupAdmin()) {
            showAlert('Access Denied', 'Only group admins can remove members.');
            return;
        }

        showConfirm(
            'Remove Member',
            `Are you sure you want to remove ${memberName} from the group?`,
            async () => {
                try {
                    const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/members/${memberId}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });
                    
                    if (response.ok) {
                        setGroupMembers(prev => prev.filter(m => String(m.userId) !== String(memberId)));
                        showAlert('Removed', `${memberName} has been removed from the group.`);
                    }
                } catch (error) {
                    console.error('Error removing member:', error);
                    showAlert('Error', 'Failed to remove member');
                }
            }
        );
    };

    // Search for users to add to group
    const searchMembersToAdd = async (query) => {
        if (!query || query.length < 2) {
            setMemberSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                // Filter out existing members
                const existingIds = groupMembers.map(m => String(m.userId));
                const filteredResults = (data.users || []).filter(u => !existingIds.includes(String(u.id)));
                setMemberSearchResults(filteredResults);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    // Add member to group
    const addMemberToGroup = async (user) => {
        if (!isGroupAdmin()) {
            showAlert('Access Denied', 'Only group admins can add members.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/members`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    members: [user.id]
                })
            });
            
            if (response.ok) {
                // Refresh group details
                await openGroupDetails();
                setIsAddMemberModalOpen(false);
                setMemberSearchQuery('');
                setMemberSearchResults([]);
                showAlert('Added', `${user.name || user.email} has been added to the group.`);
            }
        } catch (error) {
            console.error('Error adding member:', error);
            showAlert('Error', 'Failed to add member');
        }
    };

    // Delete group (admin only, custom groups only)
    const deleteGroup = async () => {
        if (!isGroupAdmin()) {
            showAlert('Access Denied', 'Only group admins can delete the group.');
            return;
        }

        if (isDefaultGroup()) {
            showAlert('Cannot Delete', 'Default institution groups cannot be deleted.');
            return;
        }

        showConfirm(
            'Delete Group',
            `Are you sure you want to delete "${groupDetails?.name}"? This action cannot be undone and all messages will be lost.`,
            async () => {
                try {
                    const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });
                    
                    if (response.ok) {
                        showAlert('Deleted', 'Group has been deleted successfully.');
                        setIsGroupDetailsModalOpen(false);
                        setSelectedChat(null);
                        await fetchConversations();
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete group');
                    }
                } catch (error) {
                    console.error('Error deleting group:', error);
                    showAlert('Error', error.message || 'Failed to delete group');
                }
            }
        );
    };

    // Post to circular (feed style) with optional file attachment
    const postToCircular = async () => {
        const content = newCircularPost.trim();
        if (!content || !selectedCircularId) return;
        
        try {
            let documentId = null;
            let documentName = null;
            let documentHash = null;
            
            // If there's an attachment, upload it first
            if (circularAttachment) {
                const formData = new FormData();
                formData.append('file', circularAttachment);
                formData.append('title', circularAttachment.name);
                formData.append('description', `Circular attachment: ${content.substring(0, 50)}...`);
                
                const uploadResponse = await fetch(`${API_URL}/documents/upload`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    documentId = uploadData.document?.id || uploadData.id;
                    documentName = circularAttachment.name;
                    documentHash = uploadData.document?.ipfs_hash || uploadData.ipfs_hash;
                } else {
                    showAlert('Error', 'Failed to upload attachment');
                    return;
                }
            }
            
            // Send the message with optional document attachment
            const messageBody = {
                content,
                messageType: documentId ? 'document' : 'text'
            };
            
            if (documentId) {
                messageBody.documentId = documentId;
                messageBody.documentName = documentName;
                messageBody.documentHash = documentHash;
            }
            
            const response = await fetch(`${API_URL}/chat/conversations/${selectedCircularId}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody)
            });
            
            if (response.ok) {
                setNewCircularPost('');
                setCircularAttachment(null);
                // Refresh feed
                fetchCircularsFeed();
                showAlert('Success', 'Announcement posted successfully!');
            } else {
                showAlert('Error', 'Failed to post announcement');
            }
        } catch (error) {
            console.error('Error posting to circular:', error);
            showAlert('Error', 'Failed to post announcement');
        }
    };

    // Handle circular file selection
    const handleCircularFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showAlert('Error', 'File size must be less than 10MB');
                return;
            }
            setCircularAttachment(file);
        }
    };

    // Remove circular attachment
    const removeCircularAttachment = () => {
        setCircularAttachment(null);
        if (circularFileInputRef.current) {
            circularFileInputRef.current.value = '';
        }
    };

    // ========== ENHANCED CIRCULAR FUNCTIONS ==========
    
    // Handle local image selection for circular post
    const handleCircularImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const validImages = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showAlert('Error', 'Only image files are allowed');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showAlert('Error', `Image ${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });
        
        // Convert to base64 for preview and storage
        validImages.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCircularImages(prev => [...prev, {
                    file,
                    name: file.name,
                    preview: reader.result,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
        
        if (circularImageInputRef.current) {
            circularImageInputRef.current.value = '';
        }
    };
    
    // Remove image from circular post
    const removeCircularImage = (index) => {
        setCircularImages(prev => prev.filter((_, i) => i !== index));
    };
    
    // Fetch available blockchain documents for attachment
    const fetchBlockchainDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/documents/my-documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setAvailableBlockchainDocs(data.documents || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching blockchain docs:', error);
        }
    };
    
    // Select a blockchain document for circular
    const selectBlockchainDocument = (doc) => {
        setCircularBlockchainDoc({
            id: doc.id,
            name: doc.fileName || doc.file_name || doc.name,
            ipfsHash: doc.ipfsHash || doc.ipfs_hash,
            size: doc.fileSize || doc.file_size,
            verified: true
        });
        setShowDocumentPicker(false);
    };
    
    // Remove blockchain document from circular
    const removeBlockchainDocument = () => {
        setCircularBlockchainDoc(null);
    };
    
    // Enhanced post to circular with images and blockchain docs
    const postEnhancedCircular = async () => {
        const content = newCircularPost.trim();
        if (!content) {
            showAlert('Error', 'Please write something for your announcement');
            return;
        }
        
        try {
            // Build the post data
            const postData = {
                content,
                messageType: 'circular_post',
                images: [],
                blockchainDocument: null
            };
            
            // Upload images if any
            if (circularImages.length > 0) {
                const imageUrls = [];
                for (const img of circularImages) {
                    // For local images, we'll store base64 or upload to server
                    // Here we'll store base64 for simplicity
                    imageUrls.push({
                        url: img.preview,
                        name: img.name
                    });
                }
                postData.images = imageUrls;
            }
            
            // Add blockchain document if attached
            if (circularBlockchainDoc) {
                postData.blockchainDocument = circularBlockchainDoc;
                postData.documentId = circularBlockchainDoc.id;
                postData.documentName = circularBlockchainDoc.name;
                postData.documentHash = circularBlockchainDoc.ipfsHash;
            }
            
            // Get target circular (use first one if none selected)
            const targetCircularId = selectedCircularId || (circularsList.length > 0 ? circularsList[0].id : null);
            
            if (!targetCircularId) {
                showAlert('Error', 'No circular channel available. Please create one first.');
                return;
            }
            
            const response = await fetch(`${API_URL}/chat/conversations/${targetCircularId}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            if (response.ok) {
                // Reset form
                setNewCircularPost('');
                setCircularImages([]);
                setCircularBlockchainDoc(null);
                setCircularView('feed');
                
                // Refresh feed
                fetchCircularsFeed();
                showAlert('🎉 Posted!', 'Your announcement has been posted successfully!');
            } else {
                const error = await response.json();
                showAlert('Error', error.message || 'Failed to post announcement');
            }
        } catch (error) {
            console.error('Error posting circular:', error);
            showAlert('Error', 'Failed to post announcement');
        }
    };
    
    // Fetch comments for a post
    const fetchComments = async (postId) => {
        setLoadingComments(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCircularComments(prev => ({
                    ...prev,
                    [postId]: data.comments || []
                }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
        setLoadingComments(false);
    };
    
    // Post a comment
    const postComment = async (postId) => {
        if (!newComment.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment.trim() })
            });
            
            if (response.ok) {
                setNewComment('');
                fetchComments(postId);
            } else {
                showAlert('Error', 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };
    
    // Toggle like on a post
    const toggleLike = async (postId) => {
        const isLiked = likedPosts.has(postId);
        
        // Optimistic update for liked state
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (isLiked) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
        
        // Optimistic update for like count in feed
        setCircularsFeed(prev => prev.map(item => {
            if (item.id === postId) {
                return {
                    ...item,
                    likesCount: isLiked ? (item.likesCount || 1) - 1 : (item.likesCount || 0) + 1
                };
            }
            return item;
        }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to toggle like');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setLikedPosts(prev => {
                const newSet = new Set(prev);
                if (isLiked) {
                    newSet.add(postId);
                } else {
                    newSet.delete(postId);
                }
                return newSet;
            });
            // Revert feed count
            setCircularsFeed(prev => prev.map(item => {
                if (item.id === postId) {
                    return {
                        ...item,
                        likesCount: isLiked ? (item.likesCount || 0) + 1 : (item.likesCount || 1) - 1
                    };
                }
                return item;
            }));
        }
    };
    
    // Toggle save/bookmark on a post
    const toggleSave = async (postId) => {
        const isSaved = savedPosts.has(postId);
        
        // Optimistic update
        setSavedPosts(prev => {
            const newSet = new Set(prev);
            if (isSaved) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}/save`, {
                method: isSaved ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showAlert(isSaved ? 'Removed' : 'Saved!', isSaved ? 'Post removed from saved' : 'Post saved successfully');
            } else {
                throw new Error('Failed to toggle save');
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            // Revert on error
            setSavedPosts(prev => {
                const newSet = new Set(prev);
                if (isSaved) {
                    newSet.add(postId);
                } else {
                    newSet.delete(postId);
                }
                return newSet;
            });
        }
    };
    
    // Fetch saved posts
    const fetchSavedPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/saved-posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSavedPostsList(data.posts || []);
            }
        } catch (error) {
            console.error('Error fetching saved posts:', error);
        }
    };
    
    // Share post (copy link)
    const sharePost = (postId) => {
        const url = `${window.location.origin}/circulars/${postId}`;
        navigator.clipboard.writeText(url).then(() => {
            showAlert('Copied!', 'Link copied to clipboard');
        }).catch(() => {
            showAlert('Share', 'Share functionality coming soon!');
        });
    };
    
    // Edit post
    const startEditPost = (post) => {
        setEditingPost(post.id);
        setEditPostContent(post.content);
        setPostOptionsMenu({ show: false, postId: null, x: 0, y: 0 });
    };
    
    const cancelEditPost = () => {
        setEditingPost(null);
        setEditPostContent('');
    };
    
    const saveEditPost = async (postId) => {
        if (!editPostContent.trim()) {
            showAlert('Error', 'Post content cannot be empty');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: editPostContent.trim() })
            });
            
            if (response.ok) {
                // Update local feed
                setCircularsFeed(prev => prev.map(item => {
                    if (item.id === postId) {
                        return { ...item, content: editPostContent.trim(), editedAt: new Date().toISOString() };
                    }
                    return item;
                }));
                setEditingPost(null);
                setEditPostContent('');
                showAlert('Updated!', 'Post updated successfully');
            } else {
                const error = await response.json();
                showAlert('Error', error.error || 'Failed to update post');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            showAlert('Error', 'Failed to update post');
        }
    };
    
    // Delete post
    const deletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/messages/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Remove from local feed
                setCircularsFeed(prev => prev.filter(item => item.id !== postId));
                setPostOptionsMenu({ show: false, postId: null, x: 0, y: 0 });
                showAlert('Deleted', 'Post deleted successfully');
            } else {
                const error = await response.json();
                showAlert('Error', error.error || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showAlert('Error', 'Failed to delete post');
        }
    };
    
    // Toggle post options menu
    const togglePostOptions = (e, postId) => {
        e.stopPropagation();
        if (postOptionsMenu.show && postOptionsMenu.postId === postId) {
            setPostOptionsMenu({ show: false, postId: null, x: 0, y: 0 });
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setPostOptionsMenu({
                show: true,
                postId: postId,
                x: rect.left,
                y: rect.bottom + 5
            });
        }
    };
    
    // Toggle comments panel
    const toggleComments = (postId) => {
        if (showCommentsFor === postId) {
            setShowCommentsFor(null);
        } else {
            setShowCommentsFor(postId);
            fetchComments(postId);
        }
    };
    
    // Toggle circular options menu
    const toggleCircularOptions = (e, circularId) => {
        e.stopPropagation();
        if (circularOptionsMenu.show && circularOptionsMenu.circularId === circularId) {
            setCircularOptionsMenu({ show: false, circularId: null, x: 0, y: 0 });
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setCircularOptionsMenu({ 
                show: true, 
                circularId,
                x: rect.left - 175,
                y: rect.top
            });
        }
    };
    
    // Start editing a circular
    const startEditCircular = (circular) => {
        setEditingCircular(circular.id);
        setEditCircularName(circular.name);
        setCircularOptionsMenu({ show: false, circularId: null, x: 0, y: 0 });
    };
    
    // Save edited circular name
    const saveEditCircular = async (circularId) => {
        if (!editCircularName.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/conversations/${circularId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editCircularName.trim() })
            });
            
            if (response.ok) {
                // Update circular in list
                setCircularsList(prev => prev.map(c => 
                    c.id === circularId ? { ...c, name: editCircularName.trim() } : c
                ));
                setEditingCircular(null);
                setEditCircularName('');
                showAlert('Success', 'Circular updated successfully');
            } else {
                showAlert('Error', 'Failed to update circular');
            }
        } catch (error) {
            console.error('Error updating circular:', error);
            showAlert('Error', 'Failed to update circular');
        }
    };
    
    // Cancel editing circular
    const cancelEditCircular = () => {
        setEditingCircular(null);
        setEditCircularName('');
    };
    
    // Delete a circular channel (creator only)
    const deleteCircular = async (circularId) => {
        if (!window.confirm('Are you sure you want to delete this circular channel? This will delete all posts for everyone.')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/conversations/${circularId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Remove from lists
                setCircularsList(prev => prev.filter(c => c.id !== circularId));
                setCircularsFeed(prev => prev.filter(f => f.circularId !== circularId));
                if (selectedCircularId === circularId) {
                    setSelectedCircularId(null);
                }
                setCircularOptionsMenu({ show: false, circularId: null, x: 0, y: 0 });
                showAlert('Deleted', 'Circular channel deleted successfully');
            } else {
                const data = await response.json();
                showAlert('Error', data.error || 'Failed to delete circular');
            }
        } catch (error) {
            console.error('Error deleting circular:', error);
            showAlert('Error', 'Failed to delete circular');
        }
    };
    
    // Leave a circular channel (hide from user's view)
    const leaveCircular = async (circularId) => {
        if (!window.confirm('Leave this circular? You won\'t see new posts but can rejoin later.')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/conversations/${circularId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Remove from user's list (just hide locally)
                setCircularsList(prev => prev.filter(c => c.id !== circularId));
                setCircularsFeed(prev => prev.filter(f => f.circularId !== circularId));
                setCircularOptionsMenu({ show: false, circularId: null, x: 0, y: 0 });
                showAlert('Left', 'You have left the circular');
            } else {
                showAlert('Error', 'Failed to leave circular');
            }
        } catch (error) {
            console.error('Error leaving circular:', error);
            showAlert('Error', 'Failed to leave circular');
        }
    };
    
    // ========== END ENHANCED CIRCULAR FUNCTIONS ==========

    const sendMessage = async () => {
        const content = messageInput.trim();
        if (!content || !selectedChat) return;

        // Generate temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`;

        // Use WebSocket if connected
        if (socketRef.current && socketRef.current.connected) {
            // Optimistically add message to UI
            const optimisticMessage = {
                id: tempId,
                conversationId: selectedChat,
                senderId: currentUser?.id,
                content,
                messageType: 'text',
                status: 'sending',
                createdAt: new Date().toISOString(),
                isOwn: true
            };
            setMessages(prev => [...prev, optimisticMessage]);
            
            socketRef.current.emit('send_message', {
                conversationId: selectedChat,
                content,
                messageType: 'text',
                tempId
            });
            setMessageInput('');
            
            // Stop typing indicator
            if (socketRef.current) {
                socketRef.current.emit('typing_stop', { conversationId: selectedChat });
            }
            return;
        }

        // Fallback to HTTP
        try {
            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    messageType: 'text'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, {
                    ...data.message,
                    isOwn: true,
                    senderName: 'You'
                }]);
                setMessageInput('');
                
                // Update conversation in list
                setConversations(prev => prev.map(c => 
                    c.id === selectedChat 
                        ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() } 
                        : c
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showAlert('Error', 'Failed to send message');
        }
    };

    // Handle typing indicator
    const handleMessageInputChange = (e) => {
        setMessageInput(e.target.value);
        
        // Emit typing indicator
        if (socketRef.current && selectedChat) {
            socketRef.current.emit('typing_start', { conversationId: selectedChat });
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.emit('typing_stop', { conversationId: selectedChat });
                }
            }, 2000);
        }
    };

    // Update conversation settings (mute, pin, etc.)
    const updateConversationSettings = async (setting, value) => {
        try {
            await fetch(`${API_URL}/chat/conversations/${selectedChat}/settings`, {
                method: 'PATCH',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [setting]: value })
            });
            
            setConversations(prev => prev.map(c => 
                c.id === selectedChat ? { ...c, [setting]: value } : c
            ));
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const openDocumentSelector = (action) => {
        setCurrentDocumentAction(action);
        setIsDocumentSelectionModalOpen(true);
        setIsAttachmentMenuOpen(false);
        // Refresh documents when opening share modal
        fetchDocuments();
    };

    const closeDocumentSelectionModal = () => {
        setIsDocumentSelectionModalOpen(false);
        // Don't clear selectedDocument here - it might be needed for the share modal
    };
    
    const cancelDocumentSelection = () => {
        setIsDocumentSelectionModalOpen(false);
        setSelectedDocument(null);  // Clear when user cancels
    };

    const proceedWithSelectedDocument = () => {
        if (!selectedDocument) {
            showAlert('Required', 'Please select a document first.');
            return;
        }
        // Just close the selection modal, keep the selected document
        setIsDocumentSelectionModalOpen(false);
        setIsDocumentShareModalOpen(true);
    };

    const closeDocumentModal = () => {
        setIsDocumentShareModalOpen(false);
        setDescription('');
        setSelectedMembers([]);
        setSelectedDocument(null);  // Clear document when share modal is closed
        setSharePermission('read');  // Reset permission
    };

    // Open multi-recipient modal for approval requests
    const openMultiRecipientModal = () => {
        setIsDocumentShareModalOpen(false);
        setIsMultiRecipientModalOpen(true);
        // Pre-select current chat recipient if available
        const recipientId = selectedConversation?.userId || selectedConversation?.user_id;
        if (recipientId) {
            setApprovalRecipients([String(recipientId)]);
        } else {
            setApprovalRecipients([]);
        }
        fetchAllUsersForApproval();
    };

    const closeMultiRecipientModal = () => {
        setIsMultiRecipientModalOpen(false);
        setApprovalRecipients([]);
        setApprovalWorkflow('parallel');
        setApprovalType('standard');
        setApprovalPurpose('');
        setApprovalUserSearch('');
        setApprovalProgress({
            isProcessing: false,
            step: 0,
            message: '',
            error: null
        });
    };

    const toggleApprovalRecipient = (userId) => {
        const userIdStr = String(userId);
        setApprovalRecipients(prev => {
            const isAlreadySelected = prev.some(id => String(id) === userIdStr);
            if (isAlreadySelected) {
                return prev.filter(id => String(id) !== userIdStr);
            } else {
                return [...prev, userIdStr];
            }
        });
    };

    // Submit approval request with blockchain integration
    const submitApprovalRequest = async () => {
        if (!selectedDocument) {
            showAlert('Error', 'No document selected');
            return;
        }

        if (approvalRecipients.length === 0) {
            showAlert('Error', 'Please select at least one approver');
            return;
        }

        setApprovalProgress({
            isProcessing: true,
            step: 1,
            message: 'Preparing approval request...',
            error: null
        });

        try {
            // Get approver details with wallet addresses
            const approverDetails = [];
            const missingWallets = [];

            for (const userId of approvalRecipients) {
                const user = allUsers.find(u => String(u.id) === String(userId));
                if (user) {
                    const walletAddress = user.walletAddress || user.wallet_address;
                    const userName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                    if (!walletAddress) {
                        missingWallets.push(userName);
                    } else {
                        approverDetails.push({
                            id: user.id,
                            name: userName,
                            email: user.email,
                            walletAddress: walletAddress
                        });
                    }
                }
            }

            if (missingWallets.length > 0) {
                setApprovalProgress({
                    isProcessing: true,
                    step: 1,
                    message: '',
                    error: `The following approvers don't have wallet addresses: ${missingWallets.join(', ')}. They must connect MetaMask first.`
                });
                return;
            }

            // Step 2: Connect wallet and create blockchain request
            setApprovalProgress(prev => ({
                ...prev,
                step: 2,
                message: 'Connecting to blockchain...'
            }));

            const web3Instance = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const currentWallet = accounts[0];

            // Generate document ID for blockchain
            const documentId = web3Instance.utils.randomHex(32);
            const docHash = selectedDocument.ipfsHash || selectedDocument.ipfs_hash || selectedDocument.hash;
            const docName = selectedDocument.fileName || selectedDocument.name || 'Document';

            setApprovalProgress(prev => ({
                ...prev,
                message: 'Please confirm transaction in MetaMask...'
            }));

            // Create blockchain approval request
            const processTypeStr = approvalWorkflow === 'sequential' ? 'SEQUENTIAL' : 'PARALLEL';
            const approvalTypeStr = approvalType === 'digital' ? 'DIGITAL_SIGNATURE' : 'STANDARD';
            const approverWallets = approverDetails.map(a => a.walletAddress);

            console.log('🔗 Creating approval on blockchain:', {
                documentId,
                ipfsHash: docHash,
                approvers: approverWallets,
                processType: processTypeStr,
                approvalType: approvalTypeStr
            });

            const blockchainResult = await requestApprovalOnBlockchain(
                documentId,
                docHash || '',
                approverWallets,
                processTypeStr,
                approvalTypeStr,
                'NORMAL',
                0,
                'v1.0'
            );

            if (!blockchainResult.requestId) {
                throw new Error('Blockchain did not return a request ID');
            }

            console.log('✅ Blockchain approval created:', blockchainResult);

            setApprovalProgress(prev => ({
                ...prev,
                step: 3,
                message: 'Saving to database...'
            }));

            // Save to backend
            const backendResponse = await fetch(`${API_URL}/approvals/request`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId: blockchainResult.requestId,
                    documentId: documentId,
                    documentName: docName,
                    documentIpfsHash: docHash,
                    documentFileSize: selectedDocument.fileSize || selectedDocument.file_size || 0,
                    documentFileType: selectedDocument.documentType || 'application/pdf',
                    requesterWallet: currentWallet,
                    approvers: approverDetails.map((approver, index) => ({
                        userId: approver.id,
                        wallet: approver.walletAddress,
                        role: 'Approver',
                        stepOrder: index + 1
                    })),
                    processType: processTypeStr,
                    approvalType: approvalTypeStr,
                    priority: 'NORMAL',
                    purpose: approvalPurpose || 'Approval request from Chat',
                    blockchainTxHash: blockchainResult.transactionHash,
                    metadata: {
                        purpose: approvalPurpose,
                        recipients: approverDetails.map(a => ({ id: a.id, name: a.name, email: a.email }))
                    }
                })
            });

            if (!backendResponse.ok) {
                const error = await backendResponse.json();
                throw new Error(error.error || 'Failed to save approval request');
            }

            const backendData = await backendResponse.json();
            console.log('✅ Backend approval saved:', backendData);

            setApprovalProgress(prev => ({
                ...prev,
                step: 4,
                message: 'Sending notifications...'
            }));

            // Send chat messages to all approvers
            for (const approver of approverDetails) {
                // Find or create conversation with this user
                let conversationId = selectedChat;
                
                // Check if we need to find a different conversation
                const existingConv = conversations.find(c => 
                    c.userId === approver.id || c.user_id === approver.id
                );
                
                if (existingConv) {
                    conversationId = existingConv.id;
                }

                // Chat message is auto-created by backend approval API via create_approval_request_message
            }

            setApprovalProgress(prev => ({
                ...prev,
                step: 5,
                message: approvalType === 'digital' 
                    ? '✅ Digital signature request sent successfully!'
                    : '✅ Approval request sent successfully!'
            }));

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Refresh messages
            if (selectedChat) {
                fetchMessages(selectedChat);
            }

            // Close modal
            closeMultiRecipientModal();
            setSelectedDocument(null);
            setDescription('');

            showAlert('Success', `${approvalType === 'digital' ? 'Digital signature' : 'Approval'} request sent to ${approverDetails.length} recipient(s)!`);

        } catch (error) {
            console.error('❌ Error submitting approval:', error);
            setApprovalProgress({
                isProcessing: true,
                step: 2,
                message: '',
                error: error.message || 'Failed to submit approval request'
            });
        }
    };

    // Track approval status - fetch from backend
    const handleTrackApprovalStatus = async (msg) => {
        const approvalRequestId = msg.approvalRequestId || msg.approval_request_id;
        const messageType = msg.messageType || msg.message_type;
        const isDigitalSig = messageType === 'digital_signature_request';
        const docName = msg.documentName || msg.document_name || 'Document';
        
        if (!approvalRequestId) {
            showAlert('❌ Error', 'No approval request ID found for tracking.');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/approvals/status/${approvalRequestId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const approval = data.data || data;
                
                // Format status info
                const status = (approval.status || 'PENDING').toUpperCase();
                const approvalType = approval.approvalType || approval.approval_type;
                const isDigital = approvalType === 'DIGITAL_SIGNATURE' || approvalType === 'digital' || isDigitalSig;
                
                let statusIcon = '⏳';
                let statusText = 'Pending';
                
                if (status === 'APPROVED' || status === 'SIGNED') {
                    statusIcon = isDigital ? '✍️' : '✅';
                    statusText = isDigital ? 'Digitally Signed' : 'Approved';
                } else if (status === 'REJECTED') {
                    statusIcon = '❌';
                    statusText = 'Rejected';
                } else if (status === 'CANCELLED') {
                    statusIcon = '🚫';
                    statusText = 'Cancelled';
                } else {
                    statusIcon = '⏳';
                    statusText = 'Pending';
                }
                
                // Get approval steps info
                let stepsInfo = '';
                if (approval.steps && approval.steps.length > 0) {
                    const approved = approval.steps.filter(s => s.hasApproved).length;
                    const total = approval.steps.length;
                    stepsInfo = `\n\n📊 Progress: ${approved}/${total} ${isDigital ? 'signed' : 'approved'}`;
                    
                    // List approvers
                    stepsInfo += '\n\n👥 Approvers:';
                    approval.steps.forEach((step, idx) => {
                        const approverName = step.approver?.name || step.approverRole || 'Unknown';
                        const stepStatus = step.hasApproved ? (isDigital ? '✍️ Signed' : '✅ Approved') : 
                                          step.hasRejected ? '❌ Rejected' : '⏳ Pending';
                        stepsInfo += `\n  ${idx + 1}. ${approverName} - ${stepStatus}`;
                    });
                }
                
                // Format dates
                let dateInfo = '';
                if (approval.submittedAt || approval.submitted_at) {
                    const submitted = new Date(approval.submittedAt || approval.submitted_at);
                    dateInfo += `\n\n📅 Submitted: ${submitted.toLocaleDateString()} ${submitted.toLocaleTimeString()}`;
                }
                if (approval.completedAt || approval.completed_at) {
                    const completed = new Date(approval.completedAt || approval.completed_at);
                    dateInfo += `\n✅ Completed: ${completed.toLocaleDateString()} ${completed.toLocaleTimeString()}`;
                }
                
                showAlert(
                    `${statusIcon} Approval Status: ${statusText}`, 
                    `📄 Document: ${docName}\n🔖 Type: ${isDigital ? 'Digital Signature' : 'Standard Approval'}${stepsInfo}${dateInfo}`
                );
            } else {
                showAlert('❌ Error', 'Failed to fetch approval status. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching approval status:', error);
            showAlert('❌ Error', `Failed to fetch status: ${error.message}`);
        }
    };

    // Handle approval action from chat (approve/sign document)
    const handleApproveFromChat = async (msg) => {
        const approvalRequestId = msg.approvalRequestId || msg.approval_request_id;
        const messageType = msg.messageType || msg.message_type;
        const isDigitalSig = messageType === 'digital_signature_request';

        setApprovalActionModal({
            show: true,
            type: 'approve',
            request: { id: approvalRequestId, messageType, isDigitalSig },
            message: msg
        });
    };

    // Handle rejection from chat
    const handleRejectFromChat = async (msg) => {
        const approvalRequestId = msg.approvalRequestId || msg.approval_request_id;
        
        setApprovalActionModal({
            show: true,
            type: 'reject',
            request: { id: approvalRequestId },
            message: msg
        });
        setRejectionReason('');
    };

    // Confirm approval action
    const confirmApprovalAction = async () => {
        const { type, request, message } = approvalActionModal;
        
        setIsApprovalActionProcessing(true);

        try {
            // Check if MetaMask is installed
            if (!window.ethereum) {
                throw new Error('Please install MetaMask to approve/reject documents');
            }

            // Get the blockchain request ID from the approval request
            const approvalResponse = await fetch(`${API_URL}/approvals/status/${request.id}`, {
                headers: getAuthHeader()
            });

            if (!approvalResponse.ok) {
                throw new Error('Could not fetch approval request details');
            }

            const approvalData = await approvalResponse.json();
            const blockchainRequestId = approvalData.data?.requestId || approvalData.requestId;

            if (!blockchainRequestId || !blockchainRequestId.startsWith('0x')) {
                throw new Error('This approval request does not have a valid blockchain ID');
            }

            console.log('🔍 Processing approval action:', {
                type,
                blockchainRequestId,
                isDigitalSig: request.isDigitalSig
            });

            // Connect wallet
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (type === 'approve') {
                // Check if request exists and user is approver
                try {
                    const blockchainRequest = await getApprovalRequestFromBlockchain(blockchainRequestId);
                    console.log('📦 Blockchain request:', blockchainRequest);
                } catch (checkError) {
                    console.warn('⚠️ Could not verify blockchain request:', checkError);
                }

                // Create signature hash for digital signature
                let signatureHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                
                if (request.isDigitalSig) {
                    const web3Instance = new Web3(window.ethereum);
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    const docHash = message.documentHash || message.document_hash || 'document';
                    const sigMessage = `I digitally sign this document: ${docHash}`;
                    const signature = await web3Instance.eth.personal.sign(sigMessage, accounts[0], '');
                    signatureHash = web3Instance.utils.keccak256(signature);
                }

                // Approve on blockchain
                const result = await approveDocumentOnBlockchain(blockchainRequestId, '', signatureHash);
                console.log('✅ Blockchain approval result:', result);

                // Update backend using blockchain request ID
                const updateResponse = await fetch(`${API_URL}/approvals/approve/${blockchainRequestId}`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        blockchainTxHash: result.transactionHash,
                        reason: request.isDigitalSig ? 'Digitally signed' : 'Approved',
                        signatureHash: signatureHash,
                        isDigitalSignature: request.isDigitalSig,
                        gasUsed: result.gasUsed,
                        gasPrice: result.gasPrice,
                        blockNumber: result.blockNumber
                    })
                });

                if (!updateResponse.ok) {
                    console.warn('Backend update failed but blockchain succeeded');
                }

                showAlert('Success', request.isDigitalSig ? '✍️ Document digitally signed!' : '✅ Document approved!');

            } else if (type === 'reject') {
                if (!rejectionReason.trim()) {
                    showAlert('Required', 'Please provide a reason for rejection');
                    setIsApprovalActionProcessing(false);
                    return;
                }

                // Reject on blockchain
                const result = await rejectDocumentOnBlockchain(blockchainRequestId, rejectionReason);
                console.log('✅ Blockchain rejection result:', result);

                // Update backend using blockchain request ID
                await fetch(`${API_URL}/approvals/reject/${blockchainRequestId}`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        blockchainTxHash: result.transactionHash,
                        reason: rejectionReason,
                        gasUsed: result.gasUsed,
                        gasPrice: result.gasPrice,
                        blockNumber: result.blockNumber
                    })
                });

                showAlert('Rejected', '❌ Document rejected');
            }

            // Refresh messages
            if (selectedChat) {
                fetchMessages(selectedChat);
            }

            setApprovalActionModal({ show: false, type: '', request: null, message: null });
            setRejectionReason('');

        } catch (error) {
            console.error('❌ Approval action error:', error);
            showAlert('Error', error.message || 'Failed to process approval');
        } finally {
            setIsApprovalActionProcessing(false);
        }
    };

    const toggleMemberSelection = (memberId) => {
        setSelectedMembers(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const sendDocumentRequest = async () => {
        if (!selectedDocument) {
            showAlert('Required', 'No document selected.');
            return;
        }

        if (!selectedChat) {
            showAlert('Required', 'Please select a conversation first.');
            return;
        }

        // Get recipient user ID from conversation
        const recipientId = selectedConversation?.userId || selectedConversation?.user_id;
        if (!recipientId && currentDocumentAction === 'share') {
            showAlert('Error', 'Could not determine recipient. Please select a valid chat.');
            return;
        }

        // Get document name from correct field
        const docName = selectedDocument.fileName || selectedDocument.name || 'Document';
        const docHash = selectedDocument.ipfsHash || selectedDocument.ipfs_hash || selectedDocument.hash;
        const docSize = selectedDocument.fileSize || selectedDocument.size;
        const docType = selectedDocument.documentType || selectedDocument.type;

        // Start sharing animation
        setSharingProgress({
            isSharing: true,
            step: 1,
            message: 'Preparing document...',
            error: null
        });

        try {
            // Step 1: Preparing
            await new Promise(resolve => setTimeout(resolve, 400));
            
            let transactionHash = null;
            let blockNumber = null;

            // For document sharing, record on blockchain first (like FileManager does)
            if (currentDocumentAction === 'share') {
                setSharingProgress(prev => ({
                    ...prev,
                    step: 2,
                    message: 'Connecting to blockchain...'
                }));

                // Get document's blockchain ID (bytes32 hash) - similar to FileManagerNew pattern
                let blockchainId = selectedDocument.documentId || selectedDocument.document_id || selectedDocument.blockchainId;
                
                // DEBUG: Log all document fields to find the correct blockchain ID field
                console.log('🔍 DEBUG - Full selectedDocument:', JSON.stringify(selectedDocument, null, 2));
                console.log('🔍 DEBUG - Trying fields:');
                console.log('  - documentId:', selectedDocument.documentId);
                console.log('  - document_id:', selectedDocument.document_id);
                console.log('  - blockchainId:', selectedDocument.blockchainId);
                console.log('  - id:', selectedDocument.id);
                console.log('📄 Raw blockchain ID:', blockchainId);
                
                // Normalize blockchainId - ensure it has 0x prefix (some old documents may have been stored without it)
                if (blockchainId && typeof blockchainId === 'string') {
                    if (!blockchainId.startsWith('0x')) {
                        // Check if it's a 64-char hex string (missing 0x prefix)
                        if (/^[a-fA-F0-9]{64}$/.test(blockchainId)) {
                            blockchainId = '0x' + blockchainId;
                            console.log('🔧 Normalized blockchain ID (added 0x prefix):', blockchainId);
                        }
                    }
                }
                
                // Check if blockchain ID is valid (must be 66 chars starting with 0x)
                const isValidBlockchainId = blockchainId && 
                    typeof blockchainId === 'string' && 
                    blockchainId.startsWith('0x') && 
                    blockchainId.length === 66;
                
                console.log('📄 Final blockchain ID:', blockchainId);
                console.log('✅ Valid blockchain ID:', isValidBlockchainId);

                // Get recipient's wallet address
                const recipientResponse = await fetch(`${API_URL}/users/${recipientId}`, {
                    headers: getAuthHeader()
                });
                
                let recipientWallet = null;
                if (recipientResponse.ok) {
                    const recipientData = await recipientResponse.json();
                    recipientWallet = recipientData.user?.wallet_address || recipientData.user?.walletAddress;
                    console.log('👤 Recipient wallet:', recipientWallet);
                }

                // Only try blockchain share if both document has valid blockchain ID AND recipient has wallet
                if (isValidBlockchainId && recipientWallet) {
                    try {
                        setSharingProgress(prev => ({
                            ...prev,
                            message: 'Verifying document on blockchain...'
                        }));

                        // Initialize blockchain service if needed
                        if (!blockchainServiceV2.isInitialized) {
                            await blockchainServiceV2.initialize();
                        }

                        // FIRST: Verify document exists on blockchain before trying to share
                        console.log('🔍 Verifying document exists on blockchain...');
                        const documentExists = await blockchainServiceV2.documentExists(blockchainId);
                        
                        if (!documentExists) {
                            throw new Error('DOCUMENT_NOT_ON_BLOCKCHAIN');
                        }
                        
                        console.log('✅ Document verified on blockchain');

                        setSharingProgress(prev => ({
                            ...prev,
                            message: 'Please confirm transaction in MetaMask...'
                        }));

                        // Call smart contract via blockchainServiceV2 (same as FileManagerNew)
                        console.log('🔗 Calling blockchainServiceV2.shareDocument...');
                        const blockchainResult = await blockchainServiceV2.shareDocument(
                            blockchainId,
                            recipientWallet,
                            sharePermission  // 'read' or 'write'
                        );

                        if (blockchainResult.success) {
                            transactionHash = blockchainResult.transactionHash;
                            blockNumber = blockchainResult.blockNumber;
                            console.log('✅ Blockchain transaction successful:', blockchainResult);
                        } else {
                            throw new Error(blockchainResult.error || 'Blockchain share failed');
                        }
                    } catch (blockchainError) {
                        console.error('❌ Blockchain transaction failed:', blockchainError.message);
                        
                        // Extract meaningful error message
                        let errorMsg = 'Blockchain sharing failed';
                        if (blockchainError.message === 'DOCUMENT_NOT_ON_BLOCKCHAIN') {
                            errorMsg = 'This document exists in the database but is NOT registered on the blockchain. The blockchain document ID in the database does not match any document on-chain. Please re-upload it to blockchain from File Manager.';
                        } else if (blockchainError.message.includes('Document does not exist')) {
                            errorMsg = 'This document is not registered on the blockchain. Please upload it to blockchain first from File Manager.';
                        } else if (blockchainError.message.includes('user rejected') || blockchainError.message.includes('User denied')) {
                            errorMsg = 'Transaction was rejected in MetaMask.';
                        } else if (blockchainError.message.includes('insufficient funds')) {
                            errorMsg = 'Insufficient ETH for gas fees.';
                        } else if (blockchainError.message.includes('Only owner can share') || blockchainError.message.includes('Only the document owner')) {
                            errorMsg = blockchainError.message; // Use the detailed message from blockchainServiceV2
                        } else {
                            errorMsg = `Blockchain error: ${blockchainError.message.substring(0, 150)}`;
                        }
                        
                        // Show error and stop - NO DB fallback
                        setSharingProgress({
                            isSharing: true,
                            step: 2,
                            message: '',
                            error: errorMsg
                        });
                        
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        setSharingProgress({
                            isSharing: false,
                            step: 0,
                            message: '',
                            error: null
                        });
                        return; // Stop here - don't continue with DB sharing
                    }
                } else {
                    // No valid blockchain ID or no recipient wallet - show error
                    let errorMsg = '';
                    if (!isValidBlockchainId) {
                        errorMsg = 'This document does not have a valid blockchain ID. Please upload it to blockchain first from File Manager.';
                    } else {
                        errorMsg = 'Recipient does not have a wallet address linked. They need to add their wallet in Profile settings.';
                    }
                    
                    console.error('❌ Cannot share:', errorMsg);
                    setSharingProgress({
                        isSharing: true,
                        step: 2,
                        message: '',
                        error: errorMsg
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    setSharingProgress({
                        isSharing: false,
                        step: 0,
                        message: '',
                        error: null
                    });
                    return; // Stop here
                }

                setSharingProgress(prev => ({
                    ...prev,
                    message: 'Saving share record...'
                }));

                // Save share to database (only if blockchain succeeded)
                const shareResponse = await fetch(`${API_URL}/shares/document/${selectedDocument.id}`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipients: [{
                            user_id: recipientId,
                            permission: sharePermission
                        }],
                        transaction_hash: transactionHash,
                        block_number: blockNumber
                    })
                });

                if (!shareResponse.ok) {
                    const errorData = await shareResponse.json();
                    throw new Error(errorData.message || 'Failed to share document');
                }
                
                const shareData = await shareResponse.json();
                console.log('✅ Document share recorded:', shareData);
            } else {
                setSharingProgress(prev => ({
                    ...prev,
                    step: 2,
                    message: currentDocumentAction === 'digital_signature' ? 'Creating signature request...' : 
                             'Creating approval request...'
                }));
            }

            // Step 3: Send chat message notification
            setSharingProgress(prev => ({
                ...prev,
                step: 3,
                message: 'Sending notification...'
            }));

            const messageType = currentDocumentAction === 'share' ? 'document_share' : 
                               currentDocumentAction === 'digital_signature' ? 'digital_signature' : 
                               'approval_request';

            // Build content with blockchain info if available
            let content = currentDocumentAction === 'share' 
                ? `📄 Shared document: ${docName}`
                : currentDocumentAction === 'digital_signature'
                ? `✍️ Digital signature request: ${docName}`
                : `📋 Approval request: ${docName}`;
            
            // Add permission info for shares
            if (currentDocumentAction === 'share') {
                content += ` (${sharePermission === 'write' ? '✏️ Edit Access' : '👁️ View Only'})`;
                if (transactionHash && transactionHash.startsWith('0x') && transactionHash.length === 66) {
                    content += ' 🔗';  // Blockchain verified indicator
                }
            }

            // Get blockchain document ID
            const blockchainDocId = selectedDocument.documentId || selectedDocument.document_id || selectedDocument.blockchainId;

            // The chat message is auto-generated by the share API, but we can also send explicitly
            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    messageType,
                    documentId: selectedDocument.id,
                    documentName: docName,
                    documentHash: docHash,
                    documentSize: docSize,
                    documentType: docType,
                    // Blockchain sharing info
                    permission: sharePermission,
                    transactionHash: transactionHash,
                    blockNumber: blockNumber,
                    blockchainDocumentId: blockchainDocId,
                    description: description || null,
                    isAutoGenerated: false // User-initiated, not auto-generated
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Determine if blockchain verified
                const isBlockchainVerified = transactionHash && 
                    transactionHash.startsWith('0x') && 
                    transactionHash.length === 66;
                
                // Step 4: Complete
                setSharingProgress(prev => ({
                    ...prev,
                    step: 4,
                    message: currentDocumentAction === 'share' 
                        ? (isBlockchainVerified 
                            ? `✅ Document shared! Blockchain verified (${sharePermission === 'write' ? 'Edit' : 'View'} access)` 
                            : `✅ Document shared! (${sharePermission === 'write' ? 'Edit' : 'View'} access)`)
                        : currentDocumentAction === 'digital_signature' 
                        ? '✅ Signature request sent!' 
                        : '✅ Approval request sent!'
                }));
                
                await new Promise(resolve => setTimeout(resolve, 800));
                
                setMessages(prev => [...prev, {
                    ...data.message,
                    isOwn: true,
                    senderName: 'You'
                }]);
                
                // Reset and close
                setSharingProgress({
                    isSharing: false,
                    step: 0,
                    message: '',
                    error: null
                });
                closeDocumentModal();
            } else {
                throw new Error('Failed to send document');
            }
        } catch (error) {
            console.error('Error sending document:', error);
            setSharingProgress({
                isSharing: false,
                step: 0,
                message: '',
                error: 'Failed to send document. Please try again.'
            });
            showAlert('Error', 'Failed to send document');
        }
    };

    // Share document with all group members (DATABASE ONLY - no blockchain for groups)
    const shareWithAllGroupMembers = async () => {
        if (!selectedDocument) {
            showAlert('Required', 'No document selected.');
            return;
        }

        if (!selectedChat || !selectedConversation) {
            showAlert('Required', 'Please select a group first.');
            return;
        }

        const docName = selectedDocument.fileName || selectedDocument.name || 'Document';

        // Start sharing progress
        setSharingProgress({
            isSharing: true,
            step: 1,
            message: 'Sharing document with group...',
            error: null
        });

        try {
            // Step 2: Send chat message with document to group
            setSharingProgress(prev => ({
                ...prev,
                step: 2,
                message: 'Sending to group...'
            }));

            const content = `📄 Shared document: ${docName}`;

            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    messageType: 'document_share',
                    documentId: selectedDocument.id,
                    documentName: docName,
                    documentHash: selectedDocument.ipfsHash || selectedDocument.ipfs_hash,
                    documentSize: selectedDocument.fileSize || selectedDocument.size,
                    documentType: selectedDocument.documentType || selectedDocument.type,
                    permission: 'read',  // Groups always get read-only
                    isGroupShare: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to share document');
            }

            const data = await response.json();

            // Step 3: Complete
            setSharingProgress({
                isSharing: true,
                step: 4,
                message: '✅ Document shared with group!',
                error: null
            });

            await new Promise(resolve => setTimeout(resolve, 800));

            // Add message to chat
            setMessages(prev => [...prev, {
                ...data.message,
                isOwn: true,
                senderName: 'You'
            }]);

            // Reset and close
            setSharingProgress({
                isSharing: false,
                step: 0,
                message: '',
                error: null
            });
            closeDocumentModal();

        } catch (error) {
            console.error('Error sharing to group:', error);
            setSharingProgress({
                isSharing: false,
                step: 0,
                message: '',
                error: null
            });
            showAlert('Error', 'Failed to share document with group');
        }
    };

    const resetGroupShare = () => {
        setGroupShareMode(false);
        setSharingProgress({
            isSharing: false,
            step: 0,
            message: '',
            error: null
        });
        setGroupShareProgress({
            current: 0,
            total: 0,
            currentMember: '',
            completed: [],
            failed: []
        });
    };

    const renderDocumentAttachment = (document, isOwn) => {
        const statusIcons = {
            approved: <i className="ri-checkbox-circle-line status-approved"></i>,
            rejected: <i className="ri-close-circle-line status-rejected"></i>,
            pending: <i className="ri-time-line status-pending"></i>,
            shared: <i className="ri-share-line status-approved"></i>,
            'approval-request': <i className="ri-time-line status-pending"></i>
        };

        return (
            <div className={`document-attachment ${document.type}`}>
                <div className="document-header">
                    <div className="document-info">
                        <i className="ri-file-text-line"></i>
                        <span className="document-name">{document.name}</span>
                        <span className="document-type-badge">{document.type.toUpperCase()}</span>
                    </div>
                    {statusIcons[document.type]}
                </div>
                
                {document.requestType === 'approval-request' && document.approvalMembers && (
                    <div className="approval-request-info">
                        <strong>Approval requested from:</strong>
                        <div className="approval-members">
                            {document.approvalMembers.map((member, idx) => (
                                <span key={idx} className="member-tag">{member}</span>
                            ))}
                        </div>
                        {document.description && (
                            <div style={{ marginTop: '8px' }}>
                                <strong>Description:</strong> {document.description}
                            </div>
                        )}
                    </div>
                )}
                
                <div className="document-meta">
                    <span>{document.size}</span>
                    <div className="document-hash">
                        <i className="ri-hashtag icon-sm"></i>
                        <span>{document.hash}</span>
                    </div>
                </div>
                
                <div className="document-actions">
                    <button className="document-action-btn" onClick={() => showAlert('Opening Document', `Opening: ${document.name}`)}>
                        <i className="ri-eye-line icon-sm"></i>
                        View
                    </button>
                    <button className="document-action-btn" onClick={() => showAlert('Downloading', `Downloading: ${document.name}`)}>
                        <i className="ri-download-line icon-sm"></i>
                        Download
                    </button>
                    
                    {!isOwn && document.requestType === 'approval-request' && (
                        <>
                            <button className="document-action-btn approve" onClick={() => showAlert('Document Approved', `Successfully approved: ${document.name}`)}>
                                <i className="ri-check-line icon-sm"></i>
                                Approve
                            </button>
                            <button className="document-action-btn reject" onClick={() => {
                                showPrompt(
                                    'Reject Document',
                                    `Rejecting: ${document.name}\n\nPlease provide a reason:`,
                                    'Enter rejection reason...',
                                    (reason) => {
                                        if (reason) {
                                            showAlert('Document Rejected', `Document rejected.\n\nReason: ${reason}`);
                                        }
                                    }
                                );
                            }}>
                                <i className="ri-close-line icon-sm"></i>
                                Reject
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Render a shared document card in messages
    const renderDocumentCard = (msg, isOwn) => {
        const docName = msg.documentName || msg.document_name || 'Document';
        const docHash = msg.documentHash || msg.document_hash;
        const docSize = msg.documentSize || msg.document_size;
        const messageType = msg.messageType || msg.message_type || 'document_share';
        const approvalId = msg.approvalRequestId || msg.approval_request_id;
        
        // Blockchain info
        const txHash = msg.transactionHash || msg.transaction_hash;
        const blockNum = msg.blockNumber || msg.block_number;
        const permission = msg.sharePermission || msg.share_permission || msg.permission;
        const isBlockchainVerified = txHash && txHash.startsWith('0x') && txHash.length === 66;
        
        // Determine card type
        const isApprovalRequest = messageType === 'approval_request' || messageType === 'digital_signature_request';
        const isApprovalStatus = messageType.startsWith('approval_');
        const isShare = messageType === 'document_share' || messageType === 'document_generated';
        
        // Get status from message type
        let status = 'shared';
        let statusLabel = 'Shared';
        let statusClass = 'shared';
        let statusIcon = 'ri-share-line';
        
        if (isApprovalRequest) {
            status = 'pending';
            statusLabel = messageType === 'digital_signature_request' ? 'Digital Signature Requested' : 'Approval Requested';
            statusClass = 'pending';
            statusIcon = messageType === 'digital_signature_request' ? 'ri-quill-pen-line' : 'ri-time-line';
        } else if (messageType === 'approval_approved' || messageType === 'approval_signed') {
            status = 'approved';
            statusLabel = messageType === 'approval_signed' ? 'Digitally Signed' : 'Approved';
            statusClass = 'approved';
            statusIcon = messageType === 'approval_signed' ? 'ri-quill-pen-fill' : 'ri-checkbox-circle-fill';
        } else if (messageType === 'approval_rejected') {
            status = 'rejected';
            statusLabel = 'Rejected';
            statusClass = 'rejected';
            statusIcon = 'ri-close-circle-fill';
        } else if (messageType === 'document_generated') {
            statusLabel = 'Document Generated';
            statusIcon = 'ri-file-add-line';
        }
        
        const handleViewDocument = () => {
            if (docHash) {
                window.open(`https://gateway.pinata.cloud/ipfs/${docHash}`, '_blank');
            } else {
                showAlert('View Document', `Opening: ${docName}`);
            }
        };
        
        const handleDownloadDocument = async () => {
            if (docHash) {
                try {
                    showAlert('Downloading...', 'Please wait while the file is being downloaded.');
                    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${docHash}`);
                    if (!response.ok) throw new Error('Download failed');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = docName || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Download error:', error);
                    // Fallback to opening in new tab
                    window.open(`https://gateway.pinata.cloud/ipfs/${docHash}`, '_blank');
                }
            } else {
                showAlert('Download', 'No file available for download');
            }
        };
        
        // Get purpose/description from message content or metadata
        const purpose = msg.purpose || msg.content || '';
        
        const handleViewTransaction = () => {
            if (txHash) {
                window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
            }
        };
        
        return (
            <div className={`document-card ${statusClass} ${isOwn ? 'own' : ''} ${isBlockchainVerified ? 'blockchain-verified' : ''}`}>
                <div className="document-card-header">
                    <div className="document-card-icon">
                        <i className="ri-file-pdf-line"></i>
                    </div>
                    <div className="document-card-info">
                        <h4 className="document-card-name">{docName}</h4>
                        <div className={`document-card-status ${statusClass}`}>
                            <i className={statusIcon}></i>
                            <span>{statusLabel}</span>
                            {permission && isShare && (
                                <span className={`permission-badge ${permission}`}>
                                    <i className={permission === 'write' ? 'ri-edit-line' : 'ri-eye-line'}></i>
                                    {permission === 'write' ? 'Edit' : 'View'}
                                </span>
                            )}
                        </div>
                    </div>
                    {isBlockchainVerified && (
                        <div className="blockchain-badge" title="Verified on Blockchain" onClick={handleViewTransaction}>
                            <i className="ri-links-line"></i>
                        </div>
                    )}
                </div>
                
                {/* Purpose/Description - Show for approval requests */}
                {isApprovalRequest && purpose && !purpose.includes('📋') && !purpose.includes('✍️') && (
                    <div className="document-card-purpose">
                        <i className="ri-message-2-line"></i>
                        <span>{purpose}</span>
                    </div>
                )}
                
                {docHash && (
                    <div className="document-card-meta">
                        <div className="document-card-hash">
                            <i className="ri-shield-check-line"></i>
                            <span>IPFS: {docHash.substring(0, 8)}...{docHash.substring(docHash.length - 6)}</span>
                        </div>
                        {docSize && <span className="document-card-size">{(docSize / 1024).toFixed(1)} KB</span>}
                    </div>
                )}
                
                {/* Blockchain transaction info */}
                {isBlockchainVerified && (
                    <div className="document-card-blockchain">
                        <div className="blockchain-tx" onClick={handleViewTransaction}>
                            <i className="ri-external-link-line"></i>
                            <span>Tx: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 6)}</span>
                        </div>
                        {blockNum && <span className="blockchain-block">Block #{blockNum}</span>}
                    </div>
                )}
                
                <div className="document-card-actions">
                    <button className="doc-action-btn view" onClick={handleViewDocument}>
                        <i className="ri-eye-line"></i>
                        View
                    </button>
                    <button className="doc-action-btn download" onClick={handleDownloadDocument}>
                        <i className="ri-download-line"></i>
                        Download
                    </button>
                    {/* Track Status button for sender on approval requests */}
                    {isOwn && isApprovalRequest && (
                        <button 
                            className="doc-action-btn track"
                            onClick={() => handleTrackApprovalStatus(msg)}
                        >
                            <i className="ri-radar-line"></i>
                            Track
                        </button>
                    )}
                </div>
                
                {/* Show approval actions for receiver if pending */}
                {!isOwn && isApprovalRequest && status === 'pending' && (
                    <div className="document-card-approval-actions">
                        <button 
                            className="approval-action-btn approve"
                            onClick={() => handleApproveFromChat(msg)}
                        >
                            <i className="ri-check-line"></i>
                            {messageType === 'digital_signature_request' ? 'Sign' : 'Approve'}
                        </button>
                        <button 
                            className="approval-action-btn reject"
                            onClick={() => handleRejectFromChat(msg)}
                        >
                            <i className="ri-close-line"></i>
                            Reject
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Check if message has document content
    const hasDocumentContent = (msg) => {
        const messageType = msg.messageType || msg.message_type || '';
        const documentTypes = [
            'document_share', 
            'document_generated',
            'approval_request',
            'approval_approved',
            'approval_rejected',
            'approval_signed',
            'digital_signature_request',
            'digital_signature'
        ];
        return documentTypes.includes(messageType) ||
               messageType.startsWith('approval_') ||
               msg.documentId || 
               msg.document_id ||
               (msg.documentName || msg.document_name) ||
               (msg.documentHash || msg.document_hash);
    };

    const selectedConversation = conversations.find(c => c.id === selectedChat);

    // Helper to format timestamp - uses the global formatRelativeTime function
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        return formatRelativeTime(timestamp);
    };

    // Get user display name
    const getUserDisplayName = () => {
        if (!currentUser) return 'User';
        return currentUser.firstName 
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`
            : currentUser.name || currentUser.email || 'User';
    };

    // Format last seen - uses the global formatLastSeen function
    const formatLastSeenLocal = (lastSeen) => {
        if (!lastSeen) return '';
        return formatLastSeen(lastSeen);
    };

    if (loading) {
        return (
            <div className={`chat-interface-wrapper theme-${theme}`} style={{ visibility: 'visible', opacity: 1, backgroundColor: '#ffffff' }}>
                <div className="chat-container" style={{ visibility: 'visible', opacity: 1, backgroundColor: '#ffffff' }}>
                    <div className="loading-state" style={{ visibility: 'visible', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '200px' }}>
                        <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: '#18a36f' }}></i>
                        <p style={{ color: '#0f172a', marginTop: '1rem' }}>Loading conversations...</p>
                        <small style={{color: '#999', marginTop: '10px'}}>
                            Token: {localStorage.getItem('token') ? '✓' : '✗'} | 
                            User: {localStorage.getItem('user') ? '✓' : '✗'}
                        </small>
                    </div>
                </div>
            </div>
        );
    }

    // Debug log for render
    console.log('🎨 Rendering ChatInterface - conversations:', conversations.length, 'activeTab:', activeTab);
    
    // Mobile view detection
    const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div className={`chat-interface-wrapper theme-${theme}`} data-mobile={isMobileView} data-chat-selected={!!selectedChat}>
            <div className="chat-container">
                {/* Chat Sidebar / Conversations Page */}
                <div 
                    className={`chat-sidebar ${selectedChat || showMobileCircularsFeed ? 'mobile-hidden' : ''}`}
                >
                    {/* Header */}
                    <div className="chat-sidebar-header">
                        <div className="chat-header-title">
                            <i className="ri-message-3-line"></i>
                            <h2>DocuChain Messenger</h2>
                        </div>
                        <div className="blockchain-badge">
                            <i className="ri-shield-check-line"></i>
                            <span>Secure Messaging</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="search-container-top">
                        <div className="search-input">
                            <i className="ri-search-line search-icon"></i>
                            <input 
                                type="text" 
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <i 
                                    className="ri-close-circle-fill clear-icon" 
                                    onClick={() => setSearchQuery('')}
                                    title="Clear search"
                                ></i>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs" data-active={activeTab}>
                        <button 
                            className={`tab ${activeTab === 'direct' ? 'active' : ''}`}
                            onClick={() => setActiveTab('direct')}
                        >
                            Direct
                        </button>
                        <button 
                            className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            Groups
                        </button>
                        <button 
                            className={`tab ${activeTab === 'circulars' ? 'active' : ''}`}
                            onClick={() => setActiveTab('circulars')}
                        >
                            Circulars
                        </button>
                    </div>

                    {/* Conversations List OR Circulars List */}
                    <div className="conversations-list">
                        {activeTab === 'circulars' ? (
                            /* Circulars List (sidebar) - Feed shows in main area */
                            <div className="circulars-sidebar-list">
                                {/* View Feed Button - Mobile Only - At Top */}
                                <button 
                                    className="view-feed-mobile-btn"
                                    onClick={() => {
                                        setShowMobileCircularsFeed(true);
                                        setIsMobileSidebarHidden(true);
                                    }}
                                >
                                    <i className="ri-newspaper-line"></i>
                                    <span>View Announcements Feed</span>
                                    <i className="ri-arrow-right-s-line"></i>
                                </button>
                                
                                <div className="circulars-sidebar-header">
                                    <span className="sidebar-section-title">Available Circulars</span>
                                    <span className="circulars-count">{circularsList.length}</span>
                                </div>
                                {circularsList.length === 0 ? (
                                    <div className="empty-circulars-sidebar">
                                        <i className="ri-megaphone-line"></i>
                                        <p>No circulars available</p>
                                    </div>
                                ) : (
                                    circularsList.map(circular => (
                                        <div 
                                            key={circular.id} 
                                            className={`circular-list-item ${selectedCircularId === circular.id ? 'active' : ''}`}
                                            onClick={() => setSelectedCircularId(circular.id)}
                                        >
                                            <div className="circular-item-icon">
                                                <i className="ri-megaphone-line"></i>
                                            </div>
                                            {editingCircular === circular.id ? (
                                                <div className="circular-edit-inline" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        type="text"
                                                        value={editCircularName}
                                                        onChange={(e) => setEditCircularName(e.target.value)}
                                                        className="circular-edit-input"
                                                        autoFocus
                                                        onKeyPress={(e) => e.key === 'Enter' && saveEditCircular(circular.id)}
                                                    />
                                                    <div className="circular-edit-btns">
                                                        <button onClick={() => saveEditCircular(circular.id)} className="save-btn">
                                                            <i className="ri-check-line"></i>
                                                        </button>
                                                        <button onClick={cancelEditCircular} className="cancel-btn">
                                                            <i className="ri-close-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="circular-item-info">
                                                        <span className="circular-item-name">{circular.name}</span>
                                                        <span className="circular-item-posts">
                                                            {circularsFeed.filter(f => f.circularId === circular.id).length} posts
                                                        </span>
                                                    </div>
                                                    {/* Options button - for everyone */}
                                                    <div className="circular-options-wrapper">
                                                        <button 
                                                            className="circular-options-btn"
                                                            onClick={(e) => toggleCircularOptions(e, circular.id)}
                                                        >
                                                            <i className="ri-more-2-fill"></i>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                                <div className="view-all-feed-hint desktop-only">
                                    <i className="ri-arrow-right-line"></i>
                                    <span>View announcements feed on the right</span>
                                </div>
                            </div>
                        ) : (
                        /* Show existing conversations */
                        filteredConversations.length === 0 && newUsersToConnect.length === 0 && !isSearching ? (
                            <div className="empty-conversations">
                                <i className="ri-chat-3-line"></i>
                                <p>No conversations yet</p>
                                <span>Search for users to start chatting</span>
                                <small style={{color: '#999', marginTop: '10px', display: 'block'}}>
                                    Debug: Total={conversations.length} Filtered={filteredConversations.length} Tab={activeTab}
                                </small>
                                <button 
                                    onClick={() => fetchConversations()} 
                                    style={{marginTop: '10px', padding: '8px 16px', background: '#4a90d9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                                >
                                    Refresh Conversations
                                </button>
                            </div>
                        ) : (
                        <>
                            {/* Existing Conversations */}
                            {filteredConversations.map(conv => {
                                // Check if user is online via WebSocket state
                                const isUserOnline = conv.type === 'direct' && conv.userId 
                                    ? (onlineUsers[conv.userId]?.online ?? conv.online)
                                    : conv.online;
                                
                                return (
                                <div 
                                    key={conv.id}
                                    className={`conversation-item ${selectedChat === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''} ${conv.isBlocked ? 'blocked' : ''}`}
                                    onClick={() => selectConversation(conv.id)}
                                >
                                    <div className="conversation-content">
                                        <div className={`conversation-avatar ${conv.type}`}>
                                            {conv.type === 'direct' ? (
                                                <div className="avatar-circle-sm">
                                                    {conv.avatar}
                                                    {isUserOnline && !conv.isBlocked && <div className="online-indicator-sm"></div>}
                                                </div>
                                            ) : (
                                                <div className="avatar-circle-sm group">
                                                    <i className="ri-team-line"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="conversation-details">
                                            <div className="conversation-header">
                                                <div className="conversation-name-row">
                                                    {conv.isPinned && <i className="ri-pushpin-fill pin-icon"></i>}
                                                    <div className="conversation-name">{conv.name}</div>
                                                </div>
                                                <div className="conversation-time">{formatTimestamp(conv.lastMessageAt)}</div>
                                            </div>
                                            <div className="conversation-footer">
                                                <div className="conversation-message">
                                                    {conv.isMuted && <i className="ri-notification-off-line muted-icon"></i>}
                                                    {typingUsers[conv.userId] ? (
                                                        <span className="typing-text">typing...</span>
                                                    ) : (
                                                        conv.lastMessage
                                                    )}
                                                </div>
                                                {conv.unread > 0 && <div className="unread-badge">{conv.unread}</div>}
                                            </div>
                                            {conv.type !== 'direct' && <div className="conversation-meta">{conv.memberCount || conv.members} members</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                            })}

                            {/* Search Results - New Users to Connect */}
                            {newUsersToConnect.length > 0 && activeTab === 'direct' && (
                                <>
                                    <div className="search-results-header">
                                        <span>Search Results</span>
                                    </div>
                                    {newUsersToConnect.map(user => (
                                        <div 
                                            key={`search-${user.id}`}
                                            className="conversation-item search-result"
                                            onClick={() => startConversation(user)}
                                        >
                                            <div className="conversation-content">
                                                <div className="conversation-avatar direct">
                                                    <div className="avatar-circle-sm">
                                                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                </div>
                                                <div className="conversation-details">
                                                    <div className="conversation-header">
                                                        <div className="conversation-name">{user.name || 'Unknown User'}</div>
                                                    </div>
                                                    <div className="conversation-footer">
                                                        <div className="conversation-message user-email">{user.email}</div>
                                                        <button className="connect-btn">
                                                            <i className="ri-message-3-line"></i>
                                                            Chat
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Loading indicator */}
                            {isSearching && searchQuery.length >= 2 && (
                                <div className="search-loading-inline">
                                    <i className="ri-loader-4-line spin"></i>
                                    <span>Searching...</span>
                                </div>
                            )}
                        </>
                        )
                        )}
                    </div>

                    {/* Create Group Button */}
                    {activeTab === 'groups' && (
                        <button className="create-group-btn" onClick={() => {
                            setCreationType('group');
                            setIsCreateGroupModalOpen(true);
                            fetchAllUsersForApproval(); // Load users for member selection
                        }}>
                            <i className="ri-add-line"></i>
                            Create Group
                        </button>
                    )}

                    {/* Create Circular Button - only for admin/faculty */}
                    {activeTab === 'circulars' && canPostCircular && (
                        <button className="create-group-btn" onClick={() => {
                            setCreationType('circular');
                            setIsCreateGroupModalOpen(true);
                            fetchAllUsersForApproval(); // Load users for member selection
                        }}>
                            <i className="ri-add-line"></i>
                            Create Circular
                        </button>
                    )}
                </div>

                {/* Chat Area */}
                <div className={`chat-area ${selectedChat ? 'mobile-visible' : ''} ${activeTab === 'circulars' && showMobileCircularsFeed ? 'mobile-feed-visible' : ''}`}>
                    {activeTab === 'circulars' ? (
                        /* Enhanced Circulars Feed with Create/View Tabs */
                        <div className="circulars-main-feed">
                            {/* Circulars Header with View Toggle */}
                            <div className="circulars-header">
                                <div className="circulars-header-left">
                                    <button 
                                        className="back-btn mobile-only" 
                                        onClick={() => {
                                            setShowMobileCircularsFeed(false);
                                            setIsMobileSidebarHidden(false);
                                        }}
                                    >
                                        <i className="ri-arrow-left-line"></i>
                                    </button>
                                    <div className="circulars-header-info">
                                        <div className="circulars-icon">
                                            <i className="ri-megaphone-line"></i>
                                        </div>
                                        <div className="circulars-title">
                                            <h3>Announcements & Circulars</h3>
                                            <p>{circularsFeed.length} announcement{circularsFeed.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* View Toggle - Saved for everyone, Create only for faculty/admin */}
                                <div className="circulars-view-toggle">
                                    <button 
                                        className={`view-toggle-btn ${circularView === 'feed' ? 'active' : ''}`}
                                        onClick={() => setCircularView('feed')}
                                    >
                                        <i className="ri-newspaper-line"></i>
                                        <span>Feed</span>
                                    </button>
                                    {canPostCircular && (
                                        <button 
                                            className={`view-toggle-btn ${circularView === 'create' ? 'active' : ''}`}
                                            onClick={() => {
                                                setCircularView('create');
                                                fetchBlockchainDocuments();
                                            }}
                                        >
                                            <i className="ri-add-circle-line"></i>
                                            <span>Create</span>
                                        </button>
                                    )}
                                    <button 
                                        className={`view-toggle-btn ${circularView === 'saved' ? 'active' : ''}`}
                                        onClick={() => {
                                            setCircularView('saved');
                                            fetchSavedPosts();
                                        }}
                                    >
                                        <i className="ri-bookmark-line"></i>
                                        <span>Saved</span>
                                    </button>
                                    <button 
                                        className={`view-toggle-btn ${circularView === 'myposts' ? 'active' : ''}`}
                                        onClick={() => setCircularView('myposts')}
                                    >
                                        <i className="ri-file-user-line"></i>
                                        <span>My Posts</span>
                                    </button>
                                </div>
                                
                                <div className="circulars-header-right">
                                    {canPostCircular ? (
                                        <div className="circulars-role-badge admin">
                                            <i className="ri-shield-check-line"></i>
                                            {currentUser?.role === 'admin' ? 'Admin' : 'Faculty'}
                                        </div>
                                    ) : (
                                        <div className="circulars-role-badge student">
                                            <i className="ri-eye-line"></i>
                                            View Only
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Circulars Content Area */}
                            <div className="circulars-feed-content">
                                
                                {/* CREATE VIEW - Only for Faculty/Admin */}
                                {canPostCircular && circularView === 'create' && (
                                    <div className="circular-create-view">
                                        {circularsList.length === 0 ? (
                                            <div className="no-circulars-prompt">
                                                <div className="prompt-icon">
                                                    <i className="ri-megaphone-line"></i>
                                                </div>
                                                <h4>No Circular Channels Yet</h4>
                                                <p>Create a circular channel first to start posting announcements.</p>
                                                <button 
                                                    className="create-circular-btn"
                                                    onClick={() => {
                                                        setCreationType('circular');
                                                        setIsCreateGroupModalOpen(true);
                                                        fetchAllUsersForApproval();
                                                    }}
                                                >
                                                    <i className="ri-add-line"></i>
                                                    Create Circular Channel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="circular-create-card">
                                                {/* User Info Header */}
                                                <div className="create-card-header">
                                                    <div className="create-avatar">
                                                        {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="create-user-info">
                                                        <span className="create-user-name">{currentUser?.firstName} {currentUser?.lastName}</span>
                                                        <div className="create-user-meta">
                                                            <span className="create-role-badge">{currentUser?.role}</span>
                                                            <span className="create-visibility">
                                                                <i className="ri-global-line"></i>
                                                                Public Post
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Post Content */}
                                                <div className="create-card-body">
                                                    {/* Channel Selector */}
                                                    <div className="create-channel-select">
                                                        <label>
                                                            <i className="ri-megaphone-line"></i>
                                                            Post to:
                                                        </label>
                                                        <select 
                                                            value={selectedCircularId} 
                                                            onChange={(e) => setSelectedCircularId(e.target.value)}
                                                        >
                                                            {!selectedCircularId && <option value="">Select channel...</option>}
                                                            {circularsList.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Text Area */}
                                                    <textarea 
                                                        className="create-content-input"
                                                        placeholder="What's your announcement? Write something for students and faculty..."
                                                        value={newCircularPost}
                                                        onChange={(e) => setNewCircularPost(e.target.value)}
                                                        rows={5}
                                                    />
                                                    
                                                    {/* Image Previews */}
                                                    {circularImages.length > 0 && (
                                                        <div className="create-images-preview">
                                                            {circularImages.map((img, idx) => (
                                                                <div key={idx} className="image-preview-item">
                                                                    <img src={img.preview} alt={img.name} />
                                                                    <button 
                                                                        className="remove-image-btn"
                                                                        onClick={() => removeCircularImage(idx)}
                                                                    >
                                                                        <i className="ri-close-line"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Blockchain Document Attachment */}
                                                    {circularBlockchainDoc && (
                                                        <div className="create-blockchain-doc">
                                                            <div className="blockchain-doc-icon">
                                                                <i className="ri-shield-check-fill"></i>
                                                            </div>
                                                            <div className="blockchain-doc-info">
                                                                <span className="doc-name">{circularBlockchainDoc.name}</span>
                                                                <span className="doc-verified">
                                                                    <i className="ri-checkbox-circle-fill"></i>
                                                                    Blockchain Verified
                                                                </span>
                                                            </div>
                                                            <button 
                                                                className="remove-doc-btn"
                                                                onClick={removeBlockchainDocument}
                                                            >
                                                                <i className="ri-close-line"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Actions Footer */}
                                                <div className="create-card-footer">
                                                    <div className="create-tools">
                                                        {/* Image Upload */}
                                                        <input 
                                                            type="file"
                                                            ref={circularImageInputRef}
                                                            onChange={handleCircularImageSelect}
                                                            style={{ display: 'none' }}
                                                            accept="image/*"
                                                            multiple
                                                        />
                                                        <button 
                                                            className="create-tool-btn"
                                                            onClick={() => circularImageInputRef.current?.click()}
                                                            title="Add Photos"
                                                        >
                                                            <i className="ri-image-add-line"></i>
                                                            <span>Photo</span>
                                                        </button>
                                                        
                                                        {/* Blockchain Document */}
                                                        <button 
                                                            className={`create-tool-btn ${circularBlockchainDoc ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setShowDocumentPicker(true);
                                                                fetchBlockchainDocuments();
                                                            }}
                                                            title="Attach Blockchain Document"
                                                        >
                                                            <i className="ri-links-line"></i>
                                                            <span>Document</span>
                                                        </button>
                                                    </div>
                                                    
                                                    <button 
                                                        className="create-post-btn"
                                                        onClick={postEnhancedCircular}
                                                        disabled={!newCircularPost.trim() || !selectedCircularId}
                                                    >
                                                        <i className="ri-send-plane-fill"></i>
                                                        Post Announcement
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* FEED VIEW - For Everyone (Feed, Saved, My Posts) */}
                                {(circularView === 'feed' || circularView === 'saved' || circularView === 'myposts' || !canPostCircular) && (
                                    <>
                                        {/* My Posts Empty State */}
                                        {circularView === 'myposts' && circularsFeed.filter(item => item.isOwner).length === 0 ? (
                                            <div className="empty-circulars-feed">
                                                <div className="empty-feed-icon">
                                                    <i className="ri-file-user-line"></i>
                                                </div>
                                                <h3>No Posts Yet</h3>
                                                <p>Posts you create will appear here.</p>
                                                {canPostCircular && (
                                                    <button 
                                                        className="empty-create-btn"
                                                        onClick={() => setCircularView('create')}
                                                    >
                                                        <i className="ri-add-line"></i>
                                                        Create Post
                                                    </button>
                                                )}
                                            </div>
                                        ) : circularView === 'saved' && circularsFeed.filter(item => savedPosts.has(item.id)).length === 0 ? (
                                            <div className="empty-circulars-feed">
                                                <div className="empty-feed-icon">
                                                    <i className="ri-bookmark-line"></i>
                                                </div>
                                                <h3>No Saved Posts</h3>
                                                <p>Posts you save will appear here for easy access later.</p>
                                                <button 
                                                    className="empty-create-btn"
                                                    onClick={() => setCircularView('feed')}
                                                >
                                                    <i className="ri-arrow-left-line"></i>
                                                    Browse Feed
                                                </button>
                                            </div>
                                        ) : circularsFeed.length === 0 ? (
                                            <div className="empty-circulars-feed">
                                                <div className="empty-feed-icon">
                                                    <i className="ri-notification-3-line"></i>
                                                </div>
                                                <h3>No Announcements Yet</h3>
                                                <p>Circulars and announcements from faculty and administration will appear here.</p>
                                                {canPostCircular && (
                                                    <button 
                                                        className="empty-create-btn"
                                                        onClick={() => setCircularView('create')}
                                                    >
                                                        <i className="ri-add-line"></i>
                                                        Create First Announcement
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="circulars-feed-scroll">
                                                {(circularView === 'saved' 
                                                    ? circularsFeed.filter(item => savedPosts.has(item.id))
                                                    : circularView === 'myposts'
                                                    ? circularsFeed.filter(item => item.isOwner)
                                                    : circularsFeed
                                                ).map(item => (
                                                    <div key={item.id} className="feed-post-card">
                                                        {/* Post Header */}
                                                        <div className="feed-post-header">
                                                            <div className="post-avatar">
                                                                {item.sender?.firstName?.[0]?.toUpperCase() || item.sender?.name?.[0]?.toUpperCase() || 'A'}
                                                            </div>
                                                            <div className="post-meta">
                                                                <div className="post-author">
                                                                    <span className="author-name">{item.sender?.name || item.sender?.firstName}</span>
                                                                    {item.sender?.role && (
                                                                        <span className={`author-role-badge ${item.sender.role?.toLowerCase()}`}>
                                                                            {item.sender.role}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="post-info">
                                                                    <span className="post-channel">
                                                                        <i className="ri-megaphone-line"></i>
                                                                        {item.circularName || 'General'}
                                                                    </span>
                                                                    <span className="post-separator">•</span>
                                                                    <span className="post-time">
                                                                        {formatRelativeTime(item.createdAt)}
                                                                        {item.editedAt && <span className="edited-badge"> (edited)</span>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Options button - only show for owner or admin */}
                                                            {(item.isOwner || currentUser?.role === 'admin') && (
                                                                <div className="post-options-wrapper">
                                                                    <button 
                                                                        className="post-options-btn"
                                                                        onClick={(e) => togglePostOptions(e, item.id)}
                                                                    >
                                                                        <i className="ri-more-2-fill"></i>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Post Content - Editable or Display */}
                                                        <div className="feed-post-content">
                                                            {editingPost === item.id ? (
                                                                <div className="edit-post-form">
                                                                    <textarea 
                                                                        value={editPostContent}
                                                                        onChange={(e) => setEditPostContent(e.target.value)}
                                                                        className="edit-post-textarea"
                                                                        rows={5}
                                                                    />
                                                                    <div className="edit-post-actions">
                                                                        <button className="cancel-edit-btn" onClick={cancelEditPost}>
                                                                            Cancel
                                                                        </button>
                                                                        <button className="save-edit-btn" onClick={() => saveEditPost(item.id)}>
                                                                            <i className="ri-check-line"></i>
                                                                            Save Changes
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="post-text">{item.content}</p>
                                                            )}
                                                            
                                                            {/* Images Grid */}
                                                            {item.images && item.images.length > 0 && (
                                                                <div className={`post-images-grid images-${Math.min(item.images.length, 4)}`}>
                                                                    {item.images.slice(0, 4).map((img, idx) => (
                                                                        <div key={idx} className="post-image-item">
                                                                            <img src={img.url || img} alt="" />
                                                                            {idx === 3 && item.images.length > 4 && (
                                                                                <div className="more-images-overlay">
                                                                                    +{item.images.length - 4}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Blockchain Document */}
                                                            {item.blockchainDocument && (
                                                                <div 
                                                                    className="post-blockchain-doc"
                                                                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${item.blockchainDocument.ipfsHash}`, '_blank')}
                                                                >
                                                                    <div className="blockchain-doc-badge">
                                                                        <i className="ri-shield-check-fill"></i>
                                                                    </div>
                                                                    <div className="blockchain-doc-details">
                                                                        <span className="doc-title">{item.blockchainDocument.name}</span>
                                                                        <span className="doc-subtitle">
                                                                            <i className="ri-checkbox-circle-fill"></i>
                                                                            Blockchain Verified Document
                                                                        </span>
                                                                    </div>
                                                                    <i className="ri-external-link-line"></i>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Legacy Document Support */}
                                                            {item.hasDocument && item.document && !item.blockchainDocument && (
                                                                <div 
                                                                    className="post-document-attachment"
                                                                    onClick={() => item.document.ipfsHash && window.open(`https://gateway.pinata.cloud/ipfs/${item.document.ipfsHash}`, '_blank')}
                                                                >
                                                                    <div className="doc-icon">
                                                                        <i className="ri-file-text-line"></i>
                                                                    </div>
                                                                    <div className="doc-info">
                                                                        <span className="doc-name">{item.document.name}</span>
                                                                        <span className="doc-action">Click to view</span>
                                                                    </div>
                                                                    <i className="ri-external-link-line"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Post Stats */}
                                                        <div className="feed-post-stats">
                                                            <span className="stat-item">
                                                                <i className="ri-heart-fill"></i>
                                                                {item.likesCount || 0} likes
                                                            </span>
                                                            <span className="stat-item" onClick={() => toggleComments(item.id)}>
                                                                {item.commentsCount || 0} comments
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Post Actions */}
                                                        <div className="feed-post-actions">
                                                            <button 
                                                                className={`post-action-btn ${likedPosts.has(item.id) ? 'liked' : ''}`}
                                                                onClick={() => toggleLike(item.id)}
                                                            >
                                                                <i className={likedPosts.has(item.id) ? 'ri-heart-fill' : 'ri-heart-line'}></i>
                                                                <span>Like</span>
                                                            </button>
                                                            <button 
                                                                className="post-action-btn"
                                                                onClick={() => toggleComments(item.id)}
                                                            >
                                                                <i className="ri-chat-1-line"></i>
                                                                <span>Comment</span>
                                                            </button>
                                                            <button 
                                                                className="post-action-btn"
                                                                onClick={() => sharePost(item.id)}
                                                            >
                                                                <i className="ri-share-forward-line"></i>
                                                                <span>Share</span>
                                                            </button>
                                                            <button 
                                                                className={`post-action-btn ${savedPosts.has(item.id) ? 'saved' : ''}`}
                                                                onClick={() => toggleSave(item.id)}
                                                            >
                                                                <i className={savedPosts.has(item.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'}></i>
                                                                <span>{savedPosts.has(item.id) ? 'Saved' : 'Save'}</span>
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Comments Section */}
                                                        {showCommentsFor === item.id && (
                                                            <div className="feed-post-comments">
                                                                <div className="comments-list">
                                                                    {loadingComments ? (
                                                                        <div className="comments-loading">
                                                                            <i className="ri-loader-4-line spin"></i>
                                                                            Loading comments...
                                                                        </div>
                                                                    ) : circularComments[item.id]?.length > 0 ? (
                                                                        circularComments[item.id].map(comment => (
                                                                            <div key={comment.id} className="comment-item">
                                                                                <div className="comment-avatar">
                                                                                    {comment.sender?.firstName?.[0]?.toUpperCase() || 'U'}
                                                                                </div>
                                                                                <div className="comment-content">
                                                                                    <div className="comment-bubble">
                                                                                        <span className="comment-author">{comment.sender?.name}</span>
                                                                                        <p className="comment-text">{comment.content}</p>
                                                                                    </div>
                                                                                    <div className="comment-meta">
                                                                                        <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                                                                                        <button className="comment-like-btn">Like</button>
                                                                                        <button className="comment-reply-btn">Reply</button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="no-comments">
                                                                            <p>No comments yet. Be the first to comment!</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Comment Input */}
                                                                <div className="comment-input-section">
                                                                    <div className="comment-input-avatar">
                                                                        {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                                                                    </div>
                                                                    <div className="comment-input-wrapper">
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Write a comment..."
                                                                            value={newComment}
                                                                            onChange={(e) => setNewComment(e.target.value)}
                                                                            onKeyPress={(e) => e.key === 'Enter' && postComment(item.id)}
                                                                        />
                                                                        <button 
                                                                            className="send-comment-btn"
                                                                            onClick={() => postComment(item.id)}
                                                                            disabled={!newComment.trim()}
                                                                        >
                                                                            <i className="ri-send-plane-fill"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {/* Document Picker Modal */}
                            {showDocumentPicker && (
                                <div className="modal-overlay" onClick={() => setShowDocumentPicker(false)}>
                                    <div className="document-picker-modal" onClick={e => e.stopPropagation()}>
                                        <div className="picker-header">
                                            <h3>
                                                <i className="ri-links-line"></i>
                                                Select Blockchain Document
                                            </h3>
                                            <button onClick={() => setShowDocumentPicker(false)}>
                                                <i className="ri-close-line"></i>
                                            </button>
                                        </div>
                                        <div className="picker-body">
                                            {availableBlockchainDocs.length === 0 ? (
                                                <div className="no-docs-available">
                                                    <i className="ri-file-forbid-line"></i>
                                                    <p>No blockchain documents available</p>
                                                    <span>Upload documents first in File Manager</span>
                                                </div>
                                            ) : (
                                                <div className="docs-list">
                                                    {availableBlockchainDocs.map(doc => (
                                                        <div 
                                                            key={doc.id} 
                                                            className="doc-picker-item"
                                                            onClick={() => selectBlockchainDocument(doc)}
                                                        >
                                                            <div className="doc-picker-icon">
                                                                <i className="ri-file-shield-2-line"></i>
                                                            </div>
                                                            <div className="doc-picker-info">
                                                                <span className="doc-picker-name">{doc.fileName || doc.file_name || doc.name}</span>
                                                                <span className="doc-picker-meta">
                                                                    <i className="ri-shield-check-fill"></i>
                                                                    Verified on Blockchain
                                                                </span>
                                                            </div>
                                                            <i className="ri-add-line"></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !selectedChat ? (
                        /* Empty State */
                        <div className="empty-state">
                            <div className="empty-state-content">
                                <i className="ri-team-line empty-state-icon"></i>
                                <h3>Welcome to DocuChain Messenger</h3>
                                <p>Select a conversation to start secure messaging</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="chat-header">
                                <div className="chat-header-left">
                                    <button className="back-btn" onClick={goBackToConversations}>
                                        <i className="ri-arrow-left-line"></i>
                                    </button>
                                    <div 
                                        className="chat-header-content" 
                                        onClick={selectedConversation?.type === 'direct' ? openProfileModal : openGroupDetails} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="chat-avatar">
                                            {selectedConversation?.type === 'direct' ? (
                                                <div className="avatar-circle">
                                                    {selectedConversation?.avatar || <i className="ri-user-line"></i>}
                                                    {(onlineUsers[selectedConversation?.userId]?.online ?? selectedConversation?.online) && <div className="online-indicator-chat"></div>}
                                                </div>
                                            ) : (
                                                <div className="group-avatar-circle">
                                                    <i className="ri-team-line"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="chat-info">
                                            <h3>{selectedConversation?.name}</h3>
                                            <p className="chat-status">
                                                {selectedConversation?.type === 'direct' ? (
                                                    typingUsers[selectedConversation?.userId] ? (
                                                        <span className="typing-indicator-text">
                                                            <span className="typing-dots">
                                                                <span></span><span></span><span></span>
                                                            </span>
                                                            typing...
                                                        </span>
                                                    ) : (onlineUsers[selectedConversation?.userId]?.online ?? selectedConversation?.online) ? (
                                                        <span className="online-status">Online</span>
                                                    ) : (
                                                        <span className="last-seen">
                                                            Last seen {formatLastSeenLocal(
                                                                onlineUsers[selectedConversation?.userId]?.lastSeen || selectedConversation?.lastSeen
                                                            )}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="group-tap-hint">
                                                        {selectedConversation?.members || selectedConversation?.memberCount} members • Tap for info
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-header-actions">
                                    <button 
                                        className="header-action-btn" 
                                        onClick={handleViewSharedDocuments}
                                        title="View shared documents & requests"
                                    >
                                        <i className="ri-folder-shared-line"></i>
                                    </button>
                                    <button className="chat-options" onClick={toggleContextMenu}>
                                        <i className="ri-more-2-line"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="messages-container" ref={messagesContainerRef}>
                                {messages.map((msg, index) => {
                                    // Get current user ID - handle various formats
                                    const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.user_id;
                                    // Get sender ID - handle both camelCase and snake_case
                                    const senderId = msg.senderId || msg.sender_id;
                                    
                                    // Compare as strings to handle type mismatches (UUID vs string)
                                    const isOwn = msg.isOwn === true || 
                                                  (currentUserId && senderId && String(senderId) === String(currentUserId));
                                    
                                    // Debug log for first message only
                                    if (index === 0) {
                                        console.log('🔍 Message ownership check:', {
                                            currentUserId,
                                            senderId,
                                            isOwn,
                                            msgIsOwn: msg.isOwn,
                                            currentUserObj: currentUser
                                        });
                                    }
                                    
                                    return (
                                        <div 
                                            key={msg.id} 
                                            data-message-id={msg.id}
                                            className={`message ${isOwn ? 'own' : 'other'} ${msg.isDeleted ? 'deleted' : ''} ${hasDocumentContent(msg) ? 'has-document' : ''}`}
                                            onContextMenu={(e) => handleMessageContextMenu(e, msg, isOwn)}
                                        >
                                            <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${msg.isDeleted ? 'deleted' : ''} ${hasDocumentContent(msg) ? 'with-document' : ''}`}>
                                                {!isOwn && <div className="message-sender">{msg.senderName || msg.sender}</div>}
                                                
                                                {/* Show document card for document-related messages */}
                                                {!msg.isDeleted && hasDocumentContent(msg) && renderDocumentCard(msg, isOwn)}
                                                
                                                {/* Show text content if it exists and isn't just the default share message */}
                                                {!msg.isDeleted && msg.content && !hasDocumentContent(msg) && (
                                                    <div className="message-content">{msg.content}</div>
                                                )}
                                                
                                                {/* Show deleted message */}
                                                {msg.isDeleted && (
                                                    <div className="message-content">
                                                        <span className="deleted-message-text">
                                                            <i className="ri-forbid-line"></i> This message was deleted
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Legacy document attachment */}
                                                {!msg.isDeleted && !hasDocumentContent(msg) && (msg.hasDocument || msg.document) && renderDocumentAttachment(msg.document, isOwn)}
                                                
                                                <div className="message-footer">
                                                    <div className="message-time">
                                                        {formatMessageTime(msg.createdAt || msg.timestamp)}
                                                    </div>
                                                    {isOwn && !msg.isDeleted && (
                                                        <div className={`message-status status-${msg.status || 'sent'}`}>
                                                            {(msg.status === 'sent' || !msg.status) && <i className="ri-check-line"></i>}
                                                            {msg.status === 'delivered' && (
                                                                <i className="ri-check-double-line"></i>
                                                            )}
                                                            {msg.status === 'read' && (
                                                                <i className="ri-check-double-line read-tick"></i>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Typing Indicator */}
                                {Object.keys(typingUsers).length > 0 && (
                                    <div className="typing-indicator">
                                        <div className="typing-bubble">
                                            <span className="typing-name">
                                                {Object.values(typingUsers).join(', ')}
                                            </span>
                                            <span className="typing-text"> is typing</span>
                                            <div className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="message-input-container">
                                <div className="message-input">
                                    <button 
                                        className="attachment-btn" 
                                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                                    >
                                        <i className="ri-attachment-2"></i>
                                        {/* Attachment Menu */}
                                        {isAttachmentMenuOpen && (
                                            <div className="attachment-menu">
                                                <div className="attachment-option" onClick={() => openDocumentSelector('share')}>
                                                    <i className="ri-share-line icon-sm"></i>
                                                    Share Document
                                                </div>
                                                <div className="attachment-option" onClick={() => openDocumentSelector('approval')}>
                                                    <i className="ri-checkbox-circle-line icon-sm"></i>
                                                    Standard Approval
                                                </div>
                                                <div className="attachment-option" onClick={() => openDocumentSelector('digital_signature')}>
                                                    <i className="ri-quill-pen-line icon-sm"></i>
                                                    Digital Signature
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                    <input 
                                        type="text" 
                                        placeholder={selectedConversation?.isBlocked ? "You have blocked this user" : "Type your message..."}
                                        value={messageInput}
                                        onChange={handleMessageInputChange}
                                        onKeyPress={(e) => e.key === 'Enter' && !selectedConversation?.isBlocked && sendMessage()}
                                        disabled={selectedConversation?.isBlocked}
                                    />
                                    <button 
                                        className="send-btn" 
                                        onClick={sendMessage}
                                        disabled={selectedConversation?.isBlocked}
                                    >
                                        <i className="ri-send-plane-line"></i>
                                    </button>
                                </div>
                                {selectedConversation?.isBlocked ? (
                                    <div className="blocked-notice">
                                        <i className="ri-user-forbid-line icon-sm"></i>
                                        You have blocked this user. Unblock to send messages.
                                    </div>
                                ) : (
                                    <div className="security-notice">
                                        <i className="ri-shield-check-line icon-sm"></i>
                                        Shared documents are blockchain-verified
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Document Selection Modal */}
            {isDocumentSelectionModalOpen && (() => {
                // Get unique document types for filter
                const documentTypes = [...new Set(availableDocuments.map(doc => {
                    const type = doc.documentType || doc.type || '';
                    if (type.includes('pdf')) return 'PDF';
                    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return 'Image';
                    if (type.includes('word') || type.includes('doc')) return 'Word';
                    if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return 'Excel';
                    if (type.includes('text') || type.includes('txt')) return 'Text';
                    return 'Other';
                }))].filter(Boolean);
                
                // Filter and sort documents
                const filteredDocs = availableDocuments
                    .filter(doc => {
                        // Search filter
                        const name = (doc.fileName || doc.name || '').toLowerCase();
                        const matchesSearch = !docSearchQuery || name.includes(docSearchQuery.toLowerCase());
                        
                        // Type filter
                        if (docFilterType === 'all') return matchesSearch;
                        const type = doc.documentType || doc.type || '';
                        if (docFilterType === 'PDF') return matchesSearch && type.includes('pdf');
                        if (docFilterType === 'Image') return matchesSearch && (type.includes('image') || type.includes('png') || type.includes('jpg'));
                        if (docFilterType === 'Word') return matchesSearch && (type.includes('word') || type.includes('doc'));
                        if (docFilterType === 'Excel') return matchesSearch && (type.includes('excel') || type.includes('sheet') || type.includes('xls'));
                        if (docFilterType === 'Text') return matchesSearch && (type.includes('text') || type.includes('txt'));
                        return matchesSearch;
                    })
                    .sort((a, b) => {
                        let comparison = 0;
                        if (docSortBy === 'name') {
                            comparison = (a.fileName || a.name || '').localeCompare(b.fileName || b.name || '');
                        } else if (docSortBy === 'date') {
                            comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                        } else if (docSortBy === 'type') {
                            comparison = (a.documentType || a.type || '').localeCompare(b.documentType || b.type || '');
                        } else if (docSortBy === 'size') {
                            comparison = (b.fileSize || 0) - (a.fileSize || 0);
                        }
                        return docSortOrder === 'asc' ? -comparison : comparison;
                    });
                
                return (
                <div className="document-selection-modal" onClick={cancelDocumentSelection}>
                    <div className="document-selection-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Select Document</h3>
                            <button className="close-btn" onClick={closeDocumentSelectionModal}>&times;</button>
                        </div>
                        
                        {/* Search and Filter Bar */}
                        <div className="doc-search-filter-bar">
                            <div className="doc-search-input-wrapper">
                                <i className="ri-search-line"></i>
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={docSearchQuery}
                                    onChange={(e) => setDocSearchQuery(e.target.value)}
                                    className="doc-search-input"
                                />
                                {docSearchQuery && (
                                    <button className="doc-search-clear" onClick={() => setDocSearchQuery('')}>
                                        <i className="ri-close-line"></i>
                                    </button>
                                )}
                            </div>
                            
                            <div className="doc-filter-controls">
                                <select 
                                    value={docFilterType} 
                                    onChange={(e) => setDocFilterType(e.target.value)}
                                    className="doc-filter-select"
                                >
                                    <option value="all">All Types</option>
                                    {documentTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                
                                <select 
                                    value={docSortBy} 
                                    onChange={(e) => setDocSortBy(e.target.value)}
                                    className="doc-filter-select"
                                >
                                    <option value="date">Sort by Date</option>
                                    <option value="name">Sort by Name</option>
                                    <option value="type">Sort by Type</option>
                                    <option value="size">Sort by Size</option>
                                </select>
                                
                                <button 
                                    className="doc-sort-order-btn"
                                    onClick={() => setDocSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    title={docSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    <i className={`ri-sort-${docSortOrder === 'asc' ? 'asc' : 'desc'}`}></i>
                                </button>
                            </div>
                        </div>
                        
                        <div className="doc-count-info">
                            {loadingDocuments ? 'Loading documents...' : `Showing ${filteredDocs.length} of ${availableDocuments.length} documents`}
                        </div>
                        
                        <div className="document-grid">
                            {loadingDocuments ? (
                                <div className="no-documents-found">
                                    <i className="ri-loader-4-line spinning"></i>
                                    <p>Loading your documents...</p>
                                </div>
                            ) : filteredDocs.length === 0 ? (
                                <div className="no-documents-found">
                                    <i className="ri-file-search-line"></i>
                                    <p>{availableDocuments.length === 0 ? 'No documents uploaded yet. Upload documents from File Manager first.' : 'No documents match your search'}</p>
                                </div>
                            ) : (
                                filteredDocs.map(doc => {
                                    // Check if document has valid blockchain ID
                                    const blockchainId = doc.documentId || doc.document_id;
                                    const hasBlockchainId = blockchainId && 
                                        typeof blockchainId === 'string' && 
                                        blockchainId.startsWith('0x') && 
                                        blockchainId.length === 66;
                                    
                                    return (
                                    <div 
                                        key={doc.id}
                                        className={`document-card ${selectedDocument && String(selectedDocument.id) === String(doc.id) ? 'selected' : ''} ${hasBlockchainId ? 'has-blockchain' : 'no-blockchain'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('📄 Selected document:', doc);
                                            console.log('🔗 Document blockchain ID:', blockchainId, 'Valid:', hasBlockchainId);
                                            setSelectedDocument(doc);
                                        }}
                                    >
                                        {selectedDocument && String(selectedDocument.id) === String(doc.id) && (
                                            <div className="document-selected-check">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        )}
                                        {/* Blockchain indicator */}
                                        <div className={`blockchain-indicator ${hasBlockchainId ? 'on-chain' : 'off-chain'}`} title={hasBlockchainId ? 'On Blockchain' : 'Not on Blockchain'}>
                                            <i className={hasBlockchainId ? 'ri-links-line' : 'ri-link-unlink'}></i>
                                        </div>
                                        <div className="document-card-header">
                                            <div className="document-icon">
                                                <i className={`ri-${
                                                    (doc.documentType || '').includes('pdf') ? 'file-pdf' :
                                                    (doc.documentType || '').includes('image') ? 'image' :
                                                    (doc.documentType || '').includes('word') ? 'file-word' :
                                                    (doc.documentType || '').includes('excel') ? 'file-excel' :
                                                    'file-text'
                                                }-line`}></i>
                                            </div>
                                            <div className="document-card-info">
                                                <h4>{doc.fileName || doc.name}</h4>
                                                <p>{doc.documentType || doc.type} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : doc.size}</p>
                                            </div>
                                        </div>
                                        <div className="document-card-meta">
                                            <span>Uploaded: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : doc.uploadDate}</span>
                                            <span>{doc.ipfsHash ? `${doc.ipfsHash.substring(0, 10)}...` : doc.hash}</span>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={cancelDocumentSelection}>Cancel</button>
                            <button className="btn-primary" onClick={proceedWithSelectedDocument} disabled={!selectedDocument}>Continue</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Document Share Modal - Enhanced with Progress Animation */}
            {isDocumentShareModalOpen && (
                <div className="document-share-modal" onClick={sharingProgress.isSharing ? null : closeDocumentModal}>
                    <div className="modal-content share-modal-enhanced" onClick={(e) => e.stopPropagation()}>
                        {sharingProgress.isSharing ? (
                            /* Sharing Progress Animation */
                            <div className="sharing-progress-container">
                                {sharingProgress.error ? (
                                    /* Error State */
                                    <div className="sharing-error-container">
                                        <div className="error-icon">
                                            <i className="ri-error-warning-line"></i>
                                        </div>
                                        <h4 className="error-title">Sharing Failed</h4>
                                        <p className="error-message">{sharingProgress.error}</p>
                                        <div className="document-being-shared">
                                            <i className="ri-file-text-line"></i>
                                            <span>{selectedDocument?.fileName || selectedDocument?.name || 'Document'}</span>
                                        </div>
                                        <button 
                                            className="btn-secondary error-dismiss-btn"
                                            onClick={() => {
                                                setSharingProgress({
                                                    isSharing: false,
                                                    step: 0,
                                                    message: '',
                                                    error: null
                                                });
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    /* Normal Progress State */
                                    <>
                                        <div className="sharing-animation">
                                            <div className={`progress-circle ${sharingProgress.step >= 4 ? 'complete' : 'active'}`}>
                                                {sharingProgress.step >= 4 ? (
                                                    <i className="ri-check-line"></i>
                                                ) : (
                                                    <div className="spinner"></div>
                                                )}
                                            </div>
                                            {/* Group share progress bar */}
                                            {groupShareMode && groupShareProgress.total > 0 && (
                                                <div className="group-share-progress">
                                                    <div className="progress-bar-container">
                                                        <div 
                                                            className="progress-bar-fill"
                                                            style={{ 
                                                                width: `${(groupShareProgress.current / groupShareProgress.total) * 100}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="progress-text">
                                                        {groupShareProgress.current} of {groupShareProgress.total} members
                                                    </div>
                                                    {groupShareProgress.completed.length > 0 && (
                                                        <div className="completed-members">
                                                            <i className="ri-checkbox-circle-fill"></i>
                                                            {groupShareProgress.completed.slice(-3).join(', ')}
                                                            {groupShareProgress.completed.length > 3 && ` +${groupShareProgress.completed.length - 3} more`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!groupShareMode && (
                                                <div className="progress-steps">
                                                    <div className={`progress-step ${sharingProgress.step >= 1 ? 'active' : ''} ${sharingProgress.step > 1 ? 'complete' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Preparing</span>
                                                    </div>
                                                    <div className="progress-line"></div>
                                                    <div className={`progress-step ${sharingProgress.step >= 2 ? 'active' : ''} ${sharingProgress.step > 2 ? 'complete' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Sending</span>
                                                    </div>
                                                    <div className="progress-line"></div>
                                                    <div className={`progress-step ${sharingProgress.step >= 3 ? 'active' : ''} ${sharingProgress.step > 3 ? 'complete' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Confirming</span>
                                                    </div>
                                                    <div className="progress-line"></div>
                                                    <div className={`progress-step ${sharingProgress.step >= 4 ? 'active complete' : ''}`}>
                                                        <div className="step-dot"></div>
                                                        <span>Done</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="sharing-message">{sharingProgress.message}</p>
                                        <div className="document-being-shared">
                                            <i className="ri-file-text-line"></i>
                                            <span>{selectedDocument?.fileName || selectedDocument?.name || 'Document'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* Normal Share Modal Content */
                            <>
                                <div className="modal-header">
                                    <h3 className="modal-title">
                                        {currentDocumentAction === 'share' ? '📤 Share Document' : 
                                         currentDocumentAction === 'digital_signature' ? '✍️ Request Digital Signature' :
                                         '📋 Request Approval'}
                                    </h3>
                                    <button className="close-btn" onClick={closeDocumentModal}>&times;</button>
                                </div>
                                
                                {/* Document Preview - Using actual selected document */}
                                <div className="share-document-preview">
                                    <div className="doc-preview-icon">
                                        <i className={`ri-${
                                            (selectedDocument?.documentType || '').includes('pdf') ? 'file-pdf' :
                                            (selectedDocument?.documentType || '').includes('image') ? 'image' :
                                            (selectedDocument?.documentType || '').includes('word') ? 'file-word' :
                                            'file-text'
                                        }-line`}></i>
                                    </div>
                                    <div className="doc-preview-info">
                                        <h4>{selectedDocument?.fileName || selectedDocument?.name || 'No document selected'}</h4>
                                        <p>{selectedDocument?.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(1)} KB` : selectedDocument?.documentType || 'Document'}</p>
                                    </div>
                                    {selectedDocument?.ipfsHash && (
                                        <div className="doc-preview-verified">
                                            <i className="ri-shield-check-line"></i>
                                            <span>Verified</span>
                                        </div>
                                    )}
                                    {/* Blockchain status indicator */}
                                    {(() => {
                                        const blockchainId = selectedDocument?.documentId || selectedDocument?.document_id;
                                        const hasBlockchainId = blockchainId && 
                                            typeof blockchainId === 'string' && 
                                            blockchainId.startsWith('0x') && 
                                            blockchainId.length === 66;
                                        return hasBlockchainId ? (
                                            <div className="doc-blockchain-status on-chain">
                                                <i className="ri-links-line"></i>
                                                <span>On Blockchain</span>
                                            </div>
                                        ) : (
                                            <div className="doc-blockchain-status off-chain">
                                                <i className="ri-link-unlink"></i>
                                                <span>Database Only</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Recipient Info - Auto-filled from chat */}
                                <div className="share-recipient-info">
                                    <label>Sending to:</label>
                                    <div className="recipient-badge">
                                        <div className="recipient-avatar">
                                            {selectedConversation?.type !== 'direct' ? (
                                                <i className="ri-group-line"></i>
                                            ) : (
                                                selectedConversation?.avatar || selectedConversation?.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div className="recipient-details">
                                            <strong>{selectedConversation?.name || 'Recipient'}</strong>
                                            <small>
                                                {selectedConversation?.type !== 'direct' 
                                                    ? `${selectedConversation?.memberCount || selectedConversation?.members || 'Group'} members`
                                                    : selectedConversation?.role || selectedConversation?.type
                                                }
                                            </small>
                                        </div>
                                    </div>
                                    {/* Group share info badge */}
                                    {selectedConversation?.type !== 'direct' && currentDocumentAction === 'share' && (
                                        <div className="group-share-info">
                                            <i className="ri-information-line"></i>
                                            <span>Document will be shared with all group members (View Only)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Type Selection - Only show for direct chats, groups only have Share */}
                                {selectedConversation?.type === 'direct' && (
                                    <div className="share-action-types">
                                        <div 
                                            className={`action-type-option ${currentDocumentAction === 'share' ? 'selected' : ''}`}
                                            onClick={() => setCurrentDocumentAction('share')}
                                        >
                                            <i className="ri-share-line"></i>
                                            <div>
                                                <h4>Share Only</h4>
                                                <p>For viewing</p>
                                            </div>
                                        </div>
                                        <div 
                                            className={`action-type-option ${currentDocumentAction === 'approval' ? 'selected' : ''}`}
                                            onClick={() => setCurrentDocumentAction('approval')}
                                        >
                                            <i className="ri-checkbox-circle-line"></i>
                                            <div>
                                                <h4>Approval</h4>
                                                <p>Request sign-off</p>
                                            </div>
                                        </div>
                                        <div 
                                            className={`action-type-option ${currentDocumentAction === 'digital_signature' ? 'selected' : ''}`}
                                            onClick={() => setCurrentDocumentAction('digital_signature')}
                                        >
                                            <i className="ri-quill-pen-line"></i>
                                            <div>
                                                <h4>Signature</h4>
                                                <p>Legal binding</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Permission Selection - Only show for Share action in DIRECT chats */}
                                {currentDocumentAction === 'share' && selectedConversation?.type === 'direct' && (
                                    <div className="share-permission-section">
                                        <label>Permission:</label>
                                        <div className="permission-options">
                                            <div 
                                                className={`permission-option ${sharePermission === 'read' ? 'selected' : ''}`}
                                                onClick={() => setSharePermission('read')}
                                            >
                                                <i className="ri-eye-line"></i>
                                                <div>
                                                    <h4>View Only</h4>
                                                    <p>Can view and download</p>
                                                </div>
                                            </div>
                                            <div 
                                                className={`permission-option ${sharePermission === 'write' ? 'selected' : ''}`}
                                                onClick={() => setSharePermission('write')}
                                            >
                                                <i className="ri-edit-line"></i>
                                                <div>
                                                    <h4>Can Edit</h4>
                                                    <p>Full access to modify</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description/Purpose Input */}
                                <div className="share-description-section">
                                    <label>
                                        {currentDocumentAction === 'share' ? 'Message (Optional):' : 'Purpose / Notes:'}
                                    </label>
                                    <textarea 
                                        className="share-description-input" 
                                        placeholder={
                                            currentDocumentAction === 'share' 
                                                ? "Add a message with this document..." 
                                                : "Explain what needs to be approved..."
                                        }
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={closeDocumentModal}>Cancel</button>
                                    {currentDocumentAction === 'share' ? (
                                        selectedConversation?.type !== 'direct' ? (
                                            /* Group share - simple share button */
                                            <button 
                                                className="btn-primary share-btn group-share-btn" 
                                                onClick={shareWithAllGroupMembers}
                                            >
                                                <i className="ri-send-plane-line"></i>
                                                Share to Group
                                            </button>
                                        ) : (
                                            /* Direct chat - single share */
                                            <button className="btn-primary share-btn" onClick={sendDocumentRequest}>
                                                <i className="ri-send-plane-line"></i>
                                                Share Now
                                            </button>
                                        )
                                    ) : (
                                        <button className="btn-primary share-btn" onClick={openMultiRecipientModal}>
                                            <i className={currentDocumentAction === 'digital_signature' ? 'ri-quill-pen-line' : 'ri-checkbox-circle-line'}></i>
                                            {currentDocumentAction === 'digital_signature' ? 'Select Signers' : 'Select Approvers'}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileModalOpen && selectedConversation?.type === 'direct' && (
                <div className="profile-modal-overlay" onClick={closeProfileModal}>
                    <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="profile-modal-close" onClick={closeProfileModal}>
                            <i className="ri-close-line"></i>
                        </button>
                        
                        <div className="profile-modal-header">
                            <div className="profile-avatar-large">
                                <div className="avatar-circle-large">
                                    {selectedConversation.avatar}
                                </div>
                                {selectedConversation.online && <div className="online-indicator-large"></div>}
                            </div>
                            <h2>{selectedConversation.name}</h2>
                            <p className="profile-role">{selectedConversation.role} - {selectedConversation.department}</p>
                            {!selectedConversation.online && selectedConversation.lastSeen && (
                                <p className="profile-last-seen">Last seen {formatLastSeen(selectedConversation.lastSeen)}</p>
                            )}
                        </div>

                        <div className="profile-modal-body">
                            <div className="profile-section">
                                <h3><i className="ri-information-line"></i> Contact Information</h3>
                                <div className="profile-info-item">
                                    <i className="ri-mail-line"></i>
                                    <div>
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{selectedConversation.email}</span>
                                    </div>
                                </div>
                                {selectedConversation.phone && (
                                    <div className="profile-info-item">
                                        <i className="ri-phone-line"></i>
                                        <div>
                                            <span className="info-label">Phone</span>
                                            <span className="info-value">{selectedConversation.phone}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="profile-info-item">
                                    <i className="ri-building-line"></i>
                                    <div>
                                        <span className="info-label">Department</span>
                                        <span className="info-value">{selectedConversation.department}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3><i className="ri-flashlight-line"></i> Quick Actions</h3>
                                <div className="profile-actions">
                                    <button className="profile-action-btn" onClick={handleViewSharedDocuments}>
                                        <i className="ri-folder-shared-line"></i>
                                        <span>View All Shared Documents</span>
                                    </button>
                                    <button className="profile-action-btn" onClick={handleRequestDocument}>
                                        <i className="ri-file-add-line"></i>
                                        <span>Request Document</span>
                                    </button>
                                    <button className="profile-action-btn danger" onClick={handleBlockUser}>
                                        <i className={selectedConversation.isBlocked ? "ri-user-unfollow-line" : "ri-user-forbid-line"}></i>
                                        <span>{selectedConversation.isBlocked ? 'Unblock User' : 'Block User'}</span>
                                    </button>
                                    {currentUser.role === 'Admin' && (
                                        <button className="profile-action-btn warning" onClick={handleReportUser}>
                                            <i className="ri-error-warning-line"></i>
                                            <span>Report User</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-section">
                                <div className="blockchain-verification">
                                    <i className="ri-shield-check-fill"></i>
                                    <div>
                                        <h4>Document Verification</h4>
                                        <p>Shared documents are blockchain-verified</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Details Modal */}
            {isGroupDetailsModalOpen && (
                <div className="group-details-modal-overlay" onClick={() => setIsGroupDetailsModalOpen(false)}>
                    <div className="group-details-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setIsGroupDetailsModalOpen(false)}>
                            <i className="ri-close-line"></i>
                        </button>

                        {loadingGroupDetails ? (
                            <div className="loading-state">
                                <i className="ri-loader-4-line spin"></i>
                                <p>Loading group details...</p>
                            </div>
                        ) : (
                            <>
                                {/* Group Header */}
                                <div className="group-details-header">
                                    <div className="group-avatar-large">
                                        <i className="ri-team-line"></i>
                                    </div>
                                    <h2>{groupDetails?.name}</h2>
                                    <p className="group-type-badge">
                                        {groupDetails?.isAutoCreated ? (
                                            <>
                                                <i className="ri-building-line"></i>
                                                {groupDetails?.autoType === 'institution' ? 'Institution Group' : 
                                                 groupDetails?.autoType === 'department' ? 'Department Group' : 
                                                 'Default Group'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-group-line"></i>
                                                Custom Group
                                            </>
                                        )}
                                    </p>
                                    {groupDetails?.description && (
                                        <p className="group-description">{groupDetails.description}</p>
                                    )}
                                </div>

                                {/* Group Stats */}
                                <div className="group-stats">
                                    <div className="stat-item">
                                        <i className="ri-user-line"></i>
                                        <span>{groupMembers.length} Members</span>
                                    </div>
                                    <div className="stat-item">
                                        <i className="ri-calendar-line"></i>
                                        <span>Created {groupDetails?.createdAt ? new Date(groupDetails.createdAt).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                </div>

                                {/* Members Section */}
                                <div className="group-members-section">
                                    <div className="section-header">
                                        <h3><i className="ri-user-line"></i> Members ({groupMembers.length})</h3>
                                        {isGroupAdmin() && !isDefaultGroup() && (
                                            <button className="add-member-btn" onClick={() => setIsAddMemberModalOpen(true)}>
                                                <i className="ri-user-add-line"></i>
                                                Add
                                            </button>
                                        )}
                                    </div>
                                    <div className="members-list">
                                        {groupMembers.map(member => (
                                            <div key={member.userId} className="member-item">
                                                <div className="member-avatar">
                                                    {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="member-info">
                                                    <div className="member-name">
                                                        {member.name || member.email}
                                                        {String(member.userId) === String(currentUser?.id) && <span className="you-badge">You</span>}
                                                    </div>
                                                    <div className="member-role">
                                                        {member.role === 'admin' ? (
                                                            <span className="admin-badge"><i className="ri-shield-star-line"></i> Admin</span>
                                                        ) : (
                                                            <span className="member-badge">Member</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isGroupAdmin() && String(member.userId) !== String(currentUser?.id) && !isDefaultGroup() && (
                                                    <button 
                                                        className="remove-member-btn"
                                                        onClick={() => removeMember(member.userId, member.name || member.email)}
                                                        title="Remove from group"
                                                    >
                                                        <i className="ri-user-unfollow-line"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Group Actions */}
                                <div className="group-actions-section">
                                    {!isDefaultGroup() && (
                                        <>
                                            <button className="group-action-btn exit" onClick={exitGroup}>
                                                <i className="ri-logout-box-r-line"></i>
                                                Exit Group
                                            </button>
                                            {isGroupAdmin() && (
                                                <button className="group-action-btn delete" onClick={deleteGroup}>
                                                    <i className="ri-delete-bin-line"></i>
                                                    Delete Group
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {isDefaultGroup() && (
                                        <div className="default-group-notice">
                                            <i className="ri-information-line"></i>
                                            <span>This is a default institution group. You cannot leave or delete it.</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddMemberModalOpen && (
                <div className="add-member-modal-overlay" onClick={() => setIsAddMemberModalOpen(false)}>
                    <div className="add-member-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="ri-user-add-line"></i> Add Members</h3>
                            <button className="modal-close-btn" onClick={() => setIsAddMemberModalOpen(false)}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        
                        <div className="member-search-container">
                            <i className="ri-search-line"></i>
                            <input
                                type="text"
                                placeholder="Search users to add..."
                                value={memberSearchQuery}
                                onChange={(e) => {
                                    setMemberSearchQuery(e.target.value);
                                    searchMembersToAdd(e.target.value);
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="member-search-results">
                            {memberSearchResults.length === 0 && memberSearchQuery.length >= 2 && (
                                <div className="no-results">
                                    <i className="ri-user-search-line"></i>
                                    <p>No users found</p>
                                </div>
                            )}
                            {memberSearchResults.map(user => (
                                <div key={user.id} className="member-search-item" onClick={() => addMemberToGroup(user)}>
                                    <div className="member-avatar">
                                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="member-info">
                                        <div className="member-name">{user.name || user.email}</div>
                                        <div className="member-email">{user.email}</div>
                                    </div>
                                    <button className="add-btn">
                                        <i className="ri-add-line"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {isContextMenuOpen && (
                <div 
                    ref={contextMenuRef}
                    className="context-menu" 
                    style={{ 
                        position: 'fixed',
                        top: `${contextMenuPosition.y}px`,
                        right: '20px'
                    }}
                >
                    <div className="context-menu-item" onClick={handleSearchInConversation}>
                        <i className="ri-search-line"></i>
                        <span>Search in Conversation</span>
                    </div>
                    <div className="context-menu-item" onClick={handleMuteConversation}>
                        <i className={selectedConversation?.isMuted ? "ri-notification-line" : "ri-notification-off-line"}></i>
                        <span>{selectedConversation?.isMuted ? 'Unmute' : 'Mute'} Notifications</span>
                    </div>
                    <div className="context-menu-item" onClick={handlePinConversation}>
                        <i className={selectedConversation?.isPinned ? "ri-unpin-line" : "ri-pushpin-line"}></i>
                        <span>{selectedConversation?.isPinned ? 'Unpin' : 'Pin'} Conversation</span>
                    </div>
                    {selectedConversation?.type === 'direct' && (
                        <>
                            <div className="context-menu-divider"></div>
                            <div className="context-menu-item" onClick={handleBlockUser}>
                                <i className={selectedConversation?.isBlocked ? "ri-user-unfollow-line" : "ri-user-forbid-line"}></i>
                                <span>{selectedConversation?.isBlocked ? 'Unblock' : 'Block'} User</span>
                            </div>
                        </>
                    )}
                    <div className="context-menu-item" onClick={handleViewSharedDocuments}>
                        <i className="ri-folder-shared-line"></i>
                        <span>View Shared Documents</span>
                    </div>
                </div>
            )}

            {/* User Search Modal */}
            {isUserSearchModalOpen && (
                <div className="user-search-modal" onClick={() => setIsUserSearchModalOpen(false)}>
                    <div className="user-search-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Start New Chat</h3>
                            <button className="close-btn" onClick={() => setIsUserSearchModalOpen(false)}>&times;</button>
                        </div>
                        
                        <div className="user-search-input-container">
                            <i className="ri-search-line"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        
                        <div className="user-search-results">
                            {isSearching && (
                                <div className="search-loading">
                                    <i className="ri-loader-4-line spin"></i>
                                    <span>Searching...</span>
                                </div>
                            )}
                            
                            {!isSearching && userSearchQuery.length >= 2 && searchResults.length === 0 && (
                                <div className="no-results">
                                    <i className="ri-user-search-line"></i>
                                    <p>No users found</p>
                                </div>
                            )}
                            
                            {!isSearching && userSearchQuery.length < 2 && (
                                <div className="search-hint">
                                    <i className="ri-information-line"></i>
                                    <p>Type at least 2 characters to search</p>
                                </div>
                            )}
                            
                            {searchResults.map(user => (
                                <div key={user.id} className="user-search-item" onClick={() => startConversation(user)}>
                                    <div className="user-avatar-search">
                                        {user.avatar}
                                        {user.online && <div className="online-indicator-sm"></div>}
                                    </div>
                                    <div className="user-info-search">
                                        <h4>{user.name}</h4>
                                        <p>{user.role} • {user.department || 'No department'}</p>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                    <button className="connect-btn">
                                        <i className="ri-chat-1-line"></i>
                                        Chat
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateGroupModalOpen && (
                <div className="create-group-modal" onClick={() => setIsCreateGroupModalOpen(false)}>
                    <div className="create-group-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New {creationType === 'circular' ? 'Circular' : 'Group'}</h3>
                            <button className="close-btn" onClick={() => setIsCreateGroupModalOpen(false)}>&times;</button>
                        </div>
                        
                        <div className="group-form">
                            <div className="form-group">
                                <label>{creationType === 'circular' ? 'Circular' : 'Group'} Name</label>
                                <input
                                    type="text"
                                    placeholder={`Enter ${creationType} name...`}
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Add Members</label>
                                <div className="member-search-input">
                                    <i className="ri-search-line"></i>
                                    <input
                                        type="text"
                                        placeholder="Search users to add..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                {newGroupMembers.length > 0 && (
                                    <div className="selected-members">
                                        {newGroupMembers.map(member => (
                                            <div key={member.id} className="member-chip">
                                                <span>{member.name}</span>
                                                <button onClick={() => setNewGroupMembers(prev => prev.filter(m => m.id !== member.id))}>
                                                    <i className="ri-close-line"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="member-search-results">
                                    {/* Use allUsers and filter by search, fallback to searchResults */}
                                    {(() => {
                                        const usersToShow = allUsers.length > 0 ? allUsers : searchResults;
                                        const filteredUsers = usersToShow
                                            .filter(user => {
                                                // Filter out current user
                                                if (String(user.id) === String(currentUser?.id)) return false;
                                                // Filter out already selected members
                                                if (newGroupMembers.find(m => String(m.id) === String(user.id))) return false;
                                                // Filter by search query if provided
                                                if (userSearchQuery.length >= 1) {
                                                    const searchLower = userSearchQuery.toLowerCase();
                                                    const userName = (user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
                                                    const userEmail = (user.email || '').toLowerCase();
                                                    return userName.includes(searchLower) || userEmail.includes(searchLower);
                                                }
                                                return true;
                                            });
                                        
                                        if (filteredUsers.length === 0) {
                                            return (
                                                <div className="no-users-message" style={{padding: '20px', textAlign: 'center', color: '#6b7280'}}>
                                                    <i className="ri-user-search-line" style={{fontSize: '24px', marginBottom: '8px', display: 'block'}}></i>
                                                    <p>{userSearchQuery ? 'No users found matching your search' : 'No users available'}</p>
                                                </div>
                                            );
                                        }
                                        
                                        return filteredUsers.map(user => (
                                            <div 
                                                key={user.id} 
                                                className="member-search-item"
                                                onClick={() => setNewGroupMembers(prev => [...prev, {
                                                    id: user.id,
                                                    name: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                                                    avatar: user.avatar || (user.name || user.fullName || user.email || '?').charAt(0).toUpperCase(),
                                                    role: user.role || 'User'
                                                }])}
                                            >
                                                <div className="user-avatar-search">
                                                    {user.avatar || (user.name || user.fullName || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-info-search">
                                                    <h4>{user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</h4>
                                                    <p>{user.role || user.email}</p>
                                                </div>
                                                <i className="ri-add-line"></i>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setIsCreateGroupModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={createGroup}>Create Group</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Context Menu (Right-click on own messages) */}
            {messageContextMenu.show && (
                <div 
                    ref={messageContextMenuRef}
                    className="message-context-menu"
                    style={{
                        position: 'fixed',
                        top: `${messageContextMenu.y}px`,
                        left: `${messageContextMenu.x}px`
                    }}
                >
                    <div className="context-menu-item" onClick={() => {
                        navigator.clipboard.writeText(messageContextMenu.message?.content || '');
                        setMessageContextMenu({ show: false, x: 0, y: 0, message: null });
                    }}>
                        <i className="ri-file-copy-line"></i>
                        <span>Copy</span>
                    </div>
                    {!messageContextMenu.message?.isDeleted && (
                        <div className="context-menu-item danger" onClick={() => handleDeleteMessage(messageContextMenu.message?.id)}>
                            <i className="ri-delete-bin-line"></i>
                            <span>Delete Message</span>
                        </div>
                    )}
                </div>
            )}

            {/* Search in Conversation Modal */}
            {isSearchingInConversation && (
                <div className="search-in-conversation-overlay" onClick={() => setIsSearchingInConversation(false)}>
                    <div className="search-in-conversation-modal" onClick={e => e.stopPropagation()}>
                        <div className="search-modal-header">
                            <h3>Search in Conversation</h3>
                            <button className="close-btn" onClick={() => setIsSearchingInConversation(false)}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="search-input-container">
                            <i className="ri-search-line"></i>
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchInConversation}
                                onChange={(e) => performConversationSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="search-results-list">
                            {conversationSearchResults.length === 0 && searchInConversation.length >= 2 && (
                                <div className="no-results">
                                    <i className="ri-search-line"></i>
                                    <p>No messages found</p>
                                </div>
                            )}
                            {conversationSearchResults.map(msg => (
                                <div 
                                    key={msg.id} 
                                    className="search-result-item"
                                    onClick={() => {
                                        scrollToMessage(msg.id);
                                        setIsSearchingInConversation(false);
                                    }}
                                >
                                    <div className="result-sender">{msg.senderName || msg.sender || 'You'}</div>
                                    <div className="result-content">{msg.content}</div>
                                    <div className="result-time">{formatMessageTime(msg.createdAt || msg.timestamp)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Documents Modal - Enhanced with Tabs */}
            {isSharedDocsModalOpen && (
                <div className="shared-docs-overlay" onClick={() => setIsSharedDocsModalOpen(false)}>
                    <div className="shared-docs-modal enhanced" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📁 Documents & Requests</h3>
                            <button className="close-btn" onClick={() => setIsSharedDocsModalOpen(false)}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="shared-docs-tabs">
                            <button 
                                className={`tab-btn ${sharedDocsTab === 'shared' ? 'active' : ''}`}
                                onClick={() => setSharedDocsTab('shared')}
                            >
                                <i className="ri-share-line"></i>
                                <span>Shared</span>
                                {sharedDocuments.length > 0 && <span className="tab-count">{sharedDocuments.length}</span>}
                            </button>
                            <button 
                                className={`tab-btn ${sharedDocsTab === 'approvals' ? 'active' : ''}`}
                                onClick={() => setSharedDocsTab('approvals')}
                            >
                                <i className="ri-checkbox-circle-line"></i>
                                <span>Requests</span>
                                {approvalRequests.length > 0 && <span className="tab-count pending">{approvalRequests.length}</span>}
                            </button>
                            <button 
                                className={`tab-btn ${sharedDocsTab === 'signed' ? 'active' : ''}`}
                                onClick={() => setSharedDocsTab('signed')}
                            >
                                <i className="ri-quill-pen-line"></i>
                                <span>Processed</span>
                                {signedDocuments.length > 0 && <span className="tab-count">{signedDocuments.length}</span>}
                            </button>
                        </div>

                        <div className="shared-docs-content">
                            {loadingSharedDocs ? (
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <p>Loading documents...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Shared Documents Tab */}
                                    {sharedDocsTab === 'shared' && (
                                        sharedDocuments.length === 0 ? (
                                            <div className="empty-state">
                                                <i className="ri-folder-open-line"></i>
                                                <p>No documents shared in this conversation yet</p>
                                                <button className="action-btn" onClick={() => {
                                                    setIsSharedDocsModalOpen(false);
                                                    openDocumentSelector('share');
                                                }}>
                                                    <i className="ri-share-line"></i>
                                                    Share a Document
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="shared-docs-list">
                                                {sharedDocuments.map((doc, index) => (
                                                    <div key={doc.id || index} className="shared-doc-item">
                                                        <div className="doc-icon shared">
                                                            <i className="ri-file-text-line"></i>
                                                        </div>
                                                        <div className="doc-info">
                                                            <h4>{doc.name}</h4>
                                                            <p>
                                                                <span className={doc.isOwn ? 'you' : ''}>
                                                                    {doc.isOwn ? 'You shared' : `Shared by ${doc.sharedBy}`}
                                                                </span>
                                                                {doc.sharedAt && <span> • {formatMessageTime(doc.sharedAt)}</span>}
                                                                {doc.size && <span> • {(doc.size / 1024).toFixed(1)} KB</span>}
                                                            </p>
                                                        </div>
                                                        <div className="doc-actions">
                                                            {doc.hash && (
                                                                <>
                                                                    <button 
                                                                        className="action-btn-small view"
                                                                        onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${doc.hash}`, '_blank')}
                                                                        title="View"
                                                                    >
                                                                        <i className="ri-eye-line"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="action-btn-small download"
                                                                        onClick={() => {
                                                                            const link = document.createElement('a');
                                                                            link.href = `https://gateway.pinata.cloud/ipfs/${doc.hash}`;
                                                                            link.download = doc.name;
                                                                            link.target = '_blank';
                                                                            link.click();
                                                                        }}
                                                                        title="Download"
                                                                    >
                                                                        <i className="ri-download-line"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* Approval Requests Tab */}
                                    {sharedDocsTab === 'approvals' && (
                                        approvalRequests.length === 0 ? (
                                            <div className="empty-state">
                                                <i className="ri-checkbox-circle-line"></i>
                                                <p>No pending approval requests</p>
                                                <button className="action-btn" onClick={() => {
                                                    setIsSharedDocsModalOpen(false);
                                                    openDocumentSelector('approval');
                                                }}>
                                                    <i className="ri-checkbox-circle-line"></i>
                                                    Request Approval
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="shared-docs-list">
                                                {approvalRequests.map((doc, index) => (
                                                    <div key={doc.id || index} className="shared-doc-item approval-item">
                                                        <div className={`doc-icon ${doc.type === 'signature' ? 'signature' : 'approval'}`}>
                                                            <i className={doc.type === 'signature' ? 'ri-quill-pen-line' : 'ri-checkbox-circle-line'}></i>
                                                        </div>
                                                        <div className="doc-info">
                                                            <h4>{doc.name}</h4>
                                                            <p>
                                                                <span className={doc.isOwn ? 'you' : ''}>
                                                                    {doc.isOwn ? 'You requested' : `Requested by ${doc.requestedBy}`}
                                                                </span>
                                                                {doc.requestedAt && <span> • {formatMessageTime(doc.requestedAt)}</span>}
                                                            </p>
                                                            <div className="request-type-badge">
                                                                {doc.type === 'signature' ? '✍️ Digital Signature' : '📋 Standard Approval'}
                                                            </div>
                                                        </div>
                                                        <div className="doc-actions">
                                                            <span className="status-badge pending">
                                                                <i className="ri-time-line"></i>
                                                                Pending
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* Processed/Signed Documents Tab */}
                                    {sharedDocsTab === 'signed' && (
                                        signedDocuments.length === 0 ? (
                                            <div className="empty-state">
                                                <i className="ri-quill-pen-line"></i>
                                                <p>No processed documents yet</p>
                                            </div>
                                        ) : (
                                            <div className="shared-docs-list">
                                                {signedDocuments.map((doc, index) => (
                                                    <div key={doc.id || index} className={`shared-doc-item ${doc.status}`}>
                                                        <div className={`doc-icon ${doc.status}`}>
                                                            <i className={
                                                                doc.status === 'rejected' ? 'ri-close-circle-line' :
                                                                doc.status === 'signed' ? 'ri-quill-pen-fill' :
                                                                'ri-checkbox-circle-fill'
                                                            }></i>
                                                        </div>
                                                        <div className="doc-info">
                                                            <h4>{doc.name}</h4>
                                                            <p>
                                                                <span className={doc.isOwn ? 'you' : ''}>
                                                                    {doc.isOwn 
                                                                        ? `You ${doc.status}` 
                                                                        : `${doc.status.charAt(0).toUpperCase() + doc.status.slice(1)} by ${doc.processedBy}`
                                                                    }
                                                                </span>
                                                                {doc.processedAt && <span> • {formatMessageTime(doc.processedAt)}</span>}
                                                            </p>
                                                        </div>
                                                        <div className="doc-actions">
                                                            <span className={`status-badge ${doc.status}`}>
                                                                <i className={
                                                                    doc.status === 'rejected' ? 'ri-close-line' :
                                                                    doc.status === 'signed' ? 'ri-quill-pen-fill' :
                                                                    'ri-check-line'
                                                                }></i>
                                                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                            </span>
                                                            {doc.hash && (
                                                                <button 
                                                                    className="action-btn-small download"
                                                                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${doc.hash}`, '_blank')}
                                                                    title="View Document"
                                                                >
                                                                    <i className="ri-eye-line"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Recipient Approval Modal */}
            {isMultiRecipientModalOpen && (
                <div className="document-share-modal" onClick={approvalProgress.isProcessing ? null : closeMultiRecipientModal}>
                    <div className="modal-content share-modal-enhanced approval-modal" onClick={e => e.stopPropagation()}>
                        {approvalProgress.isProcessing ? (
                            /* Approval Progress Animation */
                            <div className="sharing-progress-container">
                                {approvalProgress.error ? (
                                    <div className="sharing-error-container">
                                        <div className="error-icon">
                                            <i className="ri-error-warning-line"></i>
                                        </div>
                                        <h4 className="error-title">Request Failed</h4>
                                        <p className="error-message">{approvalProgress.error}</p>
                                        <button 
                                            className="btn-secondary error-dismiss-btn"
                                            onClick={() => setApprovalProgress({
                                                isProcessing: false,
                                                step: 0,
                                                message: '',
                                                error: null
                                            })}
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="sharing-animation">
                                            <div className={`progress-circle ${approvalProgress.step >= 5 ? 'complete' : 'active'}`}>
                                                {approvalProgress.step >= 5 ? (
                                                    <i className="ri-check-line"></i>
                                                ) : (
                                                    <div className="spinner"></div>
                                                )}
                                            </div>
                                            <div className="progress-steps">
                                                <div className={`progress-step ${approvalProgress.step >= 1 ? 'active' : ''} ${approvalProgress.step > 1 ? 'complete' : ''}`}>
                                                    <div className="step-dot"></div>
                                                    <span>Preparing</span>
                                                </div>
                                                <div className="progress-line"></div>
                                                <div className={`progress-step ${approvalProgress.step >= 2 ? 'active' : ''} ${approvalProgress.step > 2 ? 'complete' : ''}`}>
                                                    <div className="step-dot"></div>
                                                    <span>Blockchain</span>
                                                </div>
                                                <div className="progress-line"></div>
                                                <div className={`progress-step ${approvalProgress.step >= 3 ? 'active' : ''} ${approvalProgress.step > 3 ? 'complete' : ''}`}>
                                                    <div className="step-dot"></div>
                                                    <span>Database</span>
                                                </div>
                                                <div className="progress-line"></div>
                                                <div className={`progress-step ${approvalProgress.step >= 4 ? 'active' : ''} ${approvalProgress.step > 4 ? 'complete' : ''}`}>
                                                    <div className="step-dot"></div>
                                                    <span>Notify</span>
                                                </div>
                                                <div className="progress-line"></div>
                                                <div className={`progress-step ${approvalProgress.step >= 5 ? 'active complete' : ''}`}>
                                                    <div className="step-dot"></div>
                                                    <span>Done</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="sharing-message">{approvalProgress.message}</p>
                                        <div className="document-being-shared">
                                            <i className="ri-file-text-line"></i>
                                            <span>{selectedDocument?.fileName || selectedDocument?.name || 'Document'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <h3 className="modal-title">
                                        {currentDocumentAction === 'digital_signature' 
                                            ? '✍️ Request Digital Signatures' 
                                            : '📋 Request Approvals'}
                                    </h3>
                                    <button className="close-btn" onClick={closeMultiRecipientModal}>&times;</button>
                                </div>

                                {/* Document Preview */}
                                <div className="share-document-preview">
                                    <div className="doc-preview-icon">
                                        <i className="ri-file-pdf-line"></i>
                                    </div>
                                    <div className="doc-preview-info">
                                        <h4>{selectedDocument?.fileName || selectedDocument?.name || 'Document'}</h4>
                                        <p>{selectedDocument?.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(1)} KB` : 'PDF Document'}</p>
                                    </div>
                                </div>

                                {/* Workflow Type Selection */}
                                <div className="approval-workflow-section">
                                    <label>Workflow Type:</label>
                                    <div className="workflow-options">
                                        <div 
                                            className={`workflow-option ${approvalWorkflow === 'parallel' ? 'selected' : ''}`}
                                            onClick={() => setApprovalWorkflow('parallel')}
                                        >
                                            <i className="ri-git-branch-line"></i>
                                            <div>
                                                <h4>Parallel</h4>
                                                <p>All approve simultaneously</p>
                                            </div>
                                        </div>
                                        <div 
                                            className={`workflow-option ${approvalWorkflow === 'sequential' ? 'selected' : ''}`}
                                            onClick={() => setApprovalWorkflow('sequential')}
                                        >
                                            <i className="ri-git-commit-line"></i>
                                            <div>
                                                <h4>Sequential</h4>
                                                <p>One after another</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Type */}
                                <div className="approval-type-section">
                                    <label>Approval Type:</label>
                                    <div className="approval-type-options">
                                        <div 
                                            className={`approval-type-option ${approvalType === 'standard' ? 'selected' : ''}`}
                                            onClick={() => setApprovalType('standard')}
                                        >
                                            <i className="ri-checkbox-circle-line"></i>
                                            <span>Standard Approval</span>
                                        </div>
                                        <div 
                                            className={`approval-type-option ${approvalType === 'digital' ? 'selected' : ''}`}
                                            onClick={() => setApprovalType('digital')}
                                        >
                                            <i className="ri-quill-pen-line"></i>
                                            <span>Digital Signature</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recipient Selection */}
                                <div className="approval-recipients-section">
                                    <label>Select {currentDocumentAction === 'digital_signature' ? 'Signers' : 'Approvers'} ({approvalRecipients.length} selected):</label>
                                    
                                    {/* Show selected users as chips */}
                                    {approvalRecipients.length > 0 && (
                                        <div className="selected-recipients-chips">
                                            {approvalRecipients.map((recipientId, index) => {
                                                const user = allUsers.find(u => String(u.id) === String(recipientId));
                                                if (!user) return null;
                                                const userName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                                                return (
                                                    <div key={recipientId} className="selected-chip">
                                                        {approvalWorkflow === 'sequential' && <span className="chip-order">#{index + 1}</span>}
                                                        <span className="chip-name">{userName}</span>
                                                        <button 
                                                            className="chip-remove"
                                                            onClick={() => toggleApprovalRecipient(recipientId)}
                                                        >
                                                            <i className="ri-close-line"></i>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    <div className="recipient-search">
                                        <i className="ri-search-line"></i>
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={approvalUserSearch}
                                            onChange={(e) => setApprovalUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="recipients-list">
                                        {isLoadingUsers ? (
                                            <div className="loading-users">
                                                <i className="ri-loader-4-line spin"></i>
                                                <span>Loading users...</span>
                                            </div>
                                        ) : allUsers.length === 0 ? (
                                            <div className="no-users-message">
                                                <i className="ri-user-unfollow-line"></i>
                                                <span>No users available in your institution</span>
                                            </div>
                                        ) : (
                                            allUsers
                                                .filter(user => {
                                                    if (!approvalUserSearch) return true;
                                                    const searchLower = approvalUserSearch.toLowerCase();
                                                    const name = (user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
                                                    const email = (user.email || '').toLowerCase();
                                                    return name.includes(searchLower) || email.includes(searchLower);
                                                })
                                                .sort((a, b) => {
                                                    // Show selected users at top
                                                    const aSelected = approvalRecipients.includes(String(a.id));
                                                    const bSelected = approvalRecipients.includes(String(b.id));
                                                    if (aSelected && !bSelected) return -1;
                                                    if (!aSelected && bSelected) return 1;
                                                    return 0;
                                                })
                                                .map(user => {
                                                    const isSelected = approvalRecipients.some(id => String(id) === String(user.id));
                                                    const hasWallet = user.walletAddress || user.wallet_address;
                                                    const userName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                                                    
                                                    return (
                                                        <div 
                                                            key={user.id}
                                                            className={`recipient-item ${isSelected ? 'selected' : ''} ${!hasWallet ? 'no-wallet' : ''}`}
                                                            onClick={() => hasWallet && toggleApprovalRecipient(String(user.id))}
                                                        >
                                                            <div className="recipient-checkbox">
                                                                {isSelected ? (
                                                                    <i className="ri-checkbox-circle-fill"></i>
                                                                ) : (
                                                                    <i className="ri-checkbox-blank-circle-line"></i>
                                                                )}
                                                            </div>
                                                            <div className="recipient-avatar">
                                                                {userName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="recipient-info">
                                                                <span className="recipient-name">{userName}</span>
                                                                <span className="recipient-email">{user.email}</span>
                                                                {user.role && <span className="recipient-role">{user.role}</span>}
                                                            </div>
                                                            {!hasWallet && (
                                                                <span className="no-wallet-badge" title="No wallet connected - cannot approve on blockchain">
                                                                    <i className="ri-wallet-line"></i> No wallet
                                                                </span>
                                                            )}
                                                            {isSelected && approvalWorkflow === 'sequential' && (
                                                                <span className="order-badge">
                                                                    #{approvalRecipients.findIndex(id => String(id) === String(user.id)) + 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                {/* Purpose Input */}
                                <div className="approval-purpose-section">
                                    <label>Purpose / Notes:</label>
                                    <textarea
                                        placeholder="Explain what needs to be approved..."
                                        value={approvalPurpose}
                                        onChange={(e) => setApprovalPurpose(e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={closeMultiRecipientModal}>Cancel</button>
                                    <button 
                                        className="btn-primary"
                                        onClick={submitApprovalRequest}
                                        disabled={approvalRecipients.length === 0}
                                    >
                                        <i className={approvalType === 'digital' ? 'ri-quill-pen-line' : 'ri-send-plane-line'}></i>
                                        Send Request ({approvalRecipients.length})
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Approval Action Modal (Approve/Reject from Chat) */}
            {approvalActionModal.show && (
                <div className="app-modal-overlay" onClick={() => !isApprovalActionProcessing && setApprovalActionModal({ show: false, type: '', request: null, message: null })}>
                    <div className="app-modal approval-action-modal" onClick={e => e.stopPropagation()}>
                        <div className="app-modal-header">
                            <h3>
                                {approvalActionModal.type === 'approve' 
                                    ? (approvalActionModal.request?.isDigitalSig ? '✍️ Sign Document' : '✅ Approve Document')
                                    : '❌ Reject Document'}
                            </h3>
                            {!isApprovalActionProcessing && (
                                <button className="close-btn" onClick={() => setApprovalActionModal({ show: false, type: '', request: null, message: null })}>
                                    <i className="ri-close-line"></i>
                                </button>
                            )}
                        </div>
                        <div className="app-modal-body">
                            <div className="approval-doc-info">
                                <i className="ri-file-pdf-line"></i>
                                <span>{approvalActionModal.message?.documentName || approvalActionModal.message?.document_name || 'Document'}</span>
                            </div>
                            
                            {approvalActionModal.type === 'approve' && (
                                <p>
                                    {approvalActionModal.request?.isDigitalSig 
                                        ? 'You will be asked to sign this document digitally using your MetaMask wallet. This creates a cryptographically verifiable signature.'
                                        : 'Are you sure you want to approve this document? This action will be recorded on the blockchain.'}
                                </p>
                            )}
                            
                            {approvalActionModal.type === 'reject' && (
                                <>
                                    <p>Please provide a reason for rejection:</p>
                                    <textarea
                                        className="rejection-reason-input"
                                        placeholder="Enter rejection reason..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        disabled={isApprovalActionProcessing}
                                    />
                                </>
                            )}
                            
                            {isApprovalActionProcessing && (
                                <div className="processing-indicator">
                                    <i className="ri-loader-4-line spin"></i>
                                    <span>Processing on blockchain...</span>
                                </div>
                            )}
                        </div>
                        <div className="app-modal-actions">
                            <button 
                                className="modal-btn secondary" 
                                onClick={() => setApprovalActionModal({ show: false, type: '', request: null, message: null })}
                                disabled={isApprovalActionProcessing}
                            >
                                Cancel
                            </button>
                            <button 
                                className={`modal-btn ${approvalActionModal.type === 'approve' ? 'primary' : 'danger'}`}
                                onClick={confirmApprovalAction}
                                disabled={isApprovalActionProcessing || (approvalActionModal.type === 'reject' && !rejectionReason.trim())}
                            >
                                {isApprovalActionProcessing ? (
                                    <><i className="ri-loader-4-line spin"></i> Processing...</>
                                ) : approvalActionModal.type === 'approve' ? (
                                    approvalActionModal.request?.isDigitalSig ? 'Sign Document' : 'Approve'
                                ) : (
                                    'Reject'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* In-App Modal (replaces browser confirm/alert/prompt) */}
            {appModal.show && (
                <div className="app-modal-overlay" onClick={() => appModal.onCancel && appModal.onCancel()}>
                    <div className="app-modal" onClick={e => e.stopPropagation()}>
                        <div className="app-modal-header">
                            <h3>{appModal.title}</h3>
                            {appModal.type !== 'confirm' && (
                                <button className="close-btn" onClick={() => appModal.onConfirm && appModal.onConfirm(appModal.inputValue)}>
                                    <i className="ri-close-line"></i>
                                </button>
                            )}
                        </div>
                        <div className="app-modal-body">
                            <p>{appModal.message}</p>
                            {appModal.type === 'prompt' && (
                                <input
                                    type="text"
                                    className="app-modal-input"
                                    placeholder={appModal.inputPlaceholder}
                                    value={appModal.inputValue}
                                    onChange={(e) => setAppModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            appModal.onConfirm && appModal.onConfirm(appModal.inputValue);
                                        }
                                    }}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="app-modal-actions">
                            {appModal.type === 'alert' && (
                                <button className="modal-btn primary" onClick={() => appModal.onConfirm && appModal.onConfirm()}>
                                    OK
                                </button>
                            )}
                            {appModal.type === 'confirm' && (
                                <>
                                    <button className="modal-btn secondary" onClick={() => appModal.onCancel && appModal.onCancel()}>
                                        Cancel
                                    </button>
                                    <button className="modal-btn primary" onClick={() => appModal.onConfirm && appModal.onConfirm()}>
                                        Confirm
                                    </button>
                                </>
                            )}
                            {appModal.type === 'prompt' && (
                                <>
                                    <button className="modal-btn secondary" onClick={() => appModal.onCancel && appModal.onCancel()}>
                                        Cancel
                                    </button>
                                    <button className="modal-btn primary" onClick={() => appModal.onConfirm && appModal.onConfirm(appModal.inputValue)}>
                                        Submit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Post Options Menu Portal - rendered outside all containers */}
            {postOptionsMenu.show && ReactDOM.createPortal(
                <div 
                    className="post-options-menu"
                    style={{
                        left: postOptionsMenu.x - 150,
                        top: postOptionsMenu.y
                    }}
                >
                    <button onClick={() => {
                        const post = circularsFeed.find(p => p.id === postOptionsMenu.postId);
                        if (post) startEditPost(post);
                    }}>
                        <i className="ri-edit-line"></i>
                        Edit Post
                    </button>
                    <button className="danger" onClick={() => deletePost(postOptionsMenu.postId)}>
                        <i className="ri-delete-bin-line"></i>
                        Delete Post
                    </button>
                </div>,
                document.body
            )}
            
            {/* Circular Options Menu Portal - rendered outside all containers */}
            {circularOptionsMenu.show && ReactDOM.createPortal(
                <div 
                    className="circular-options-menu"
                    style={{
                        left: circularOptionsMenu.x,
                        top: circularOptionsMenu.y
                    }}
                >
                    {(() => {
                        const circular = circularsList.find(c => c.id === circularOptionsMenu.circularId);
                        if (!circular) return null;
                        return circular.isCreator ? (
                            <>
                                <button onClick={() => startEditCircular(circular)}>
                                    <i className="ri-edit-line"></i>
                                    Rename Circular
                                </button>
                                <button className="danger" onClick={() => deleteCircular(circular.id)}>
                                    <i className="ri-delete-bin-line"></i>
                                    Delete Circular
                                </button>
                            </>
                        ) : (
                            <button onClick={() => leaveCircular(circular.id)}>
                                <i className="ri-logout-box-line"></i>
                                Leave Circular
                            </button>
                        );
                    })()}
                </div>,
                document.body
            )}
        </div>
    );
};

export default ChatInterface;
