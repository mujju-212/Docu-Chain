import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { io } from 'socket.io-client';
import './ChatInterface.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const ChatInterface = () => {
    const { theme } = useTheme();
    
    // Get current user from localStorage
    const [currentUser, setCurrentUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                return null;
            }
        }
        return null;
    });

    const [activeTab, setActiveTab] = useState('direct');
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentDocumentAction, setCurrentDocumentAction] = useState('share');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isDocumentShareModalOpen, setIsDocumentShareModalOpen] = useState(false);
    const [isDocumentSelectionModalOpen, setIsDocumentSelectionModalOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isMobileSidebarHidden, setIsMobileSidebarHidden] = useState(false);
    
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
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const messagesContainerRef = useRef(null);
    const contextMenuRef = useRef(null);
    const socketRef = useRef(null);
    const lastMessageTimeRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    // Online status state
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});

    // Real data from API
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [availableDocuments, setAvailableDocuments] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    // Get auth header
    const getAuthHeader = useCallback(() => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            console.log('Fetching conversations...', getAuthHeader());
            const response = await fetch(`${API_URL}/chat/conversations`, {
                headers: getAuthHeader()
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Conversations data:', data);
                setConversations(data.conversations || []);
            } else {
                console.error('Failed to fetch conversations:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

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
                    setMessages(prev => [...prev, ...data.messages]);
                    lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
                }
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    }, [selectedChat, getAuthHeader]);

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

    // Fetch user's documents for sharing
    const fetchDocuments = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/documents`, {
                headers: getAuthHeader()
            });
            
            if (response.ok) {
                const data = await response.json();
                setAvailableDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    }, [getAuthHeader]);

    // Initial data load (don't wait for WebSocket)
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
            fetchDocuments();
        } else {
            // No user logged in, stop loading
            setLoading(false);
        }
    }, [currentUser, fetchConversations, fetchDocuments]);

    // Initialize Socket.IO connection (optional enhancement)
    useEffect(() => {
        if (!currentUser) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Create socket connection
        try {
            socketRef.current = io(SOCKET_URL, {
                query: { token },
                transports: ['polling', 'websocket'], // Try polling first
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 2000,
                timeout: 5000
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
        
        // New message received
        socket.on('new_message', (message) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === message.id)) return prev;
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

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, selectedChat]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setIsContextMenuOpen(false);
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
    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'direct' ? conv.type === 'direct' :
                          activeTab === 'groups' ? conv.type === 'group' :
                          activeTab === 'circulars' ? conv.type === 'circular' : true;
        return matchesSearch && matchesTab;
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
            await updateConversationSettings('isBlocked', !conv?.isBlocked);
            setIsContextMenuOpen(false);
        }
    };

    const handleViewSharedDocuments = () => {
        setIsContextMenuOpen(false);
        alert('Opening shared documents...');
    };

    const handleRequestDocument = () => {
        closeProfileModal();
        openDocumentSelector('approval');
    };

    const handleReportUser = () => {
        closeProfileModal();
        const reason = prompt('Please provide a reason for reporting this user:');
        if (reason) {
            alert(`User reported. Reason: ${reason}\nThis will be forwarded to administrators.`);
        }
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
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Failed to start conversation');
        }
    };

    // Create a new group
    const createGroup = async () => {
        if (!newGroupName.trim()) {
            alert('Please enter a group name');
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
                    type: 'group',
                    name: newGroupName,
                    members: newGroupMembers.map(m => m.id)
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                await fetchConversations();
                setSelectedChat(data.conversation.id);
                setIsCreateGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupMembers([]);
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group');
        }
    };

    const sendMessage = async () => {
        const content = messageInput.trim();
        if (!content || !selectedChat) return;

        // Use WebSocket if connected
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('send_message', {
                conversationId: selectedChat,
                content,
                messageType: 'text'
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
            alert('Failed to send message');
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
    };

    const closeDocumentSelectionModal = () => {
        setIsDocumentSelectionModalOpen(false);
        setSelectedDocument(null);
    };

    const proceedWithSelectedDocument = () => {
        if (!selectedDocument) {
            alert('Please select a document first.');
            return;
        }
        closeDocumentSelectionModal();
        setIsDocumentShareModalOpen(true);
    };

    const closeDocumentModal = () => {
        setIsDocumentShareModalOpen(false);
        setDescription('');
        setSelectedMembers([]);
        setSelectedDocument(null);
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
            alert('No document selected.');
            return;
        }

        if (!selectedChat) {
            alert('Please select a conversation first.');
            return;
        }

        try {
            const content = currentDocumentAction === 'share' 
                ? `Shared document: ${selectedDocument.name || selectedDocument.title}`
                : `Requesting approval for: ${selectedDocument.name || selectedDocument.title}`;

            const response = await fetch(`${API_URL}/chat/conversations/${selectedChat}/messages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    messageType: currentDocumentAction === 'share' ? 'document_share' : 'approval_request',
                    documentId: selectedDocument.id,
                    documentName: selectedDocument.name || selectedDocument.title,
                    documentHash: selectedDocument.ipfs_hash || selectedDocument.hash,
                    documentSize: selectedDocument.size
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, {
                    ...data.message,
                    isOwn: true,
                    senderName: 'You'
                }]);
                closeDocumentModal();
            }
        } catch (error) {
            console.error('Error sending document:', error);
            alert('Failed to send document');
        }
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
                    <button className="document-action-btn" onClick={() => alert(`Opening document: ${document.name}`)}>
                        <i className="ri-eye-line icon-sm"></i>
                        View
                    </button>
                    <button className="document-action-btn" onClick={() => alert(`Downloading document: ${document.name}`)}>
                        <i className="ri-download-line icon-sm"></i>
                        Download
                    </button>
                    
                    {!isOwn && document.requestType === 'approval-request' && (
                        <>
                            <button className="document-action-btn approve" onClick={() => alert(`Approving document: ${document.name}`)}>
                                <i className="ri-check-line icon-sm"></i>
                                Approve
                            </button>
                            <button className="document-action-btn reject" onClick={() => {
                                const reason = prompt(`Rejecting document: ${document.name}. Please provide a reason:`);
                                if (reason) alert(`Document rejected with reason: ${reason}`);
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

    const selectedConversation = conversations.find(c => c.id === selectedChat);

    // Helper to format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 172800000) return 'Yesterday';
        return date.toLocaleDateString();
    };

    // Get user display name
    const getUserDisplayName = () => {
        if (!currentUser) return 'User';
        return currentUser.firstName 
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`
            : currentUser.name || currentUser.email || 'User';
    };

    // Format last seen
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return '';
        return formatTimestamp(lastSeen);
    };

    if (loading) {
        return (
            <div className={`chat-interface-wrapper theme-${theme}`}>
                <div className="chat-container">
                    <div className="loading-state">
                        <i className="ri-loader-4-line spin"></i>
                        <p>Loading conversations...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-interface-wrapper theme-${theme}`}>
            <div className="chat-container">
                {/* Chat Sidebar */}
                <div className={`chat-sidebar ${isMobileSidebarHidden ? 'mobile-hidden' : ''}`}>
                    {/* Header */}
                    <div className="chat-sidebar-header">
                        <h2>DocuChain Messenger</h2>
                        <div className="blockchain-badge">
                            <i className="ri-shield-check-line"></i>
                            <span>Blockchain Secured</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="user-info">
                        <div className="user-profile">
                            <div className="user-avatar">
                                <i className="ri-user-line"></i>
                            </div>
                            <div className="user-details">
                                <h3>{getUserDisplayName()}</h3>
                                <p>{currentUser?.role || 'User'}</p>
                            </div>
                        </div>
                        <button className="new-chat-btn" onClick={() => setIsUserSearchModalOpen(true)} title="New Chat">
                            <i className="ri-add-line"></i>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="search-container">
                        <div className="search-input">
                            <i className="ri-search-line search-icon"></i>
                            <input 
                                type="text" 
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
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

                    {/* Conversations List */}
                    <div className="conversations-list">
                        {filteredConversations.length === 0 ? (
                            <div className="empty-conversations">
                                <i className="ri-chat-3-line"></i>
                                <p>No conversations yet</p>
                                <span>Start a new chat to begin messaging</span>
                            </div>
                        ) : (
                        filteredConversations.map(conv => {
                            // Check if user is online via WebSocket state
                            const isUserOnline = conv.type === 'direct' && conv.userId 
                                ? (onlineUsers[conv.userId]?.online ?? conv.online)
                                : conv.online;
                            
                            return (
                            <div 
                                key={conv.id}
                                className={`conversation-item ${selectedChat === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}
                                onClick={() => selectConversation(conv.id)}
                            >
                                <div className="conversation-content">
                                    <div className={`conversation-avatar ${conv.type}`}>
                                        {conv.type === 'direct' ? (
                                            <div className="avatar-circle-sm">
                                                {conv.avatar}
                                                {isUserOnline && <div className="online-indicator-sm"></div>}
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
                        })
                        )}
                    </div>

                    {/* Create Group Button */}
                    <button className="create-group-btn" onClick={() => setIsCreateGroupModalOpen(true)}>
                        <i className="ri-add-line"></i>
                        Create Group
                    </button>
                </div>

                {/* Chat Area */}
                <div className={`chat-area ${isMobileSidebarHidden ? 'mobile-full' : ''}`}>
                    {!selectedChat ? (
                        /* Empty State */
                        <div className="empty-state">
                            <div className="empty-state-content">
                                <i className="ri-team-line empty-state-icon"></i>
                                <h3>Welcome to DocuChain Messenger</h3>
                                <p>Select a conversation to start messaging securely on blockchain</p>
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
                                    <div className="chat-header-content" onClick={selectedConversation?.type === 'direct' ? openProfileModal : null} style={{ cursor: selectedConversation?.type === 'direct' ? 'pointer' : 'default' }}>
                                        <div className="chat-avatar">
                                            {selectedConversation?.type === 'direct' ? (
                                                <div className="avatar-circle">
                                                    {selectedConversation?.avatar || <i className="ri-user-line"></i>}
                                                    {(onlineUsers[selectedConversation?.userId]?.online ?? selectedConversation?.online) && <div className="online-indicator-chat"></div>}
                                                </div>
                                            ) : (
                                                <i className="ri-team-line"></i>
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
                                                            Last seen {formatLastSeen(
                                                                onlineUsers[selectedConversation?.userId]?.lastSeen || selectedConversation?.lastSeen
                                                            )}
                                                        </span>
                                                    )
                                                ) : (
                                                    `${selectedConversation?.members || selectedConversation?.memberCount} members`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button className="chat-options" onClick={toggleContextMenu}>
                                    <i className="ri-more-2-line"></i>
                                </button>
                            </div>

                            {/* Messages Container */}
                            <div className="messages-container" ref={messagesContainerRef}>
                                {messages.map(msg => {
                                    const isOwn = msg.senderId === currentUser?.id || msg.isOwn;
                                    return (
                                        <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                                            <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                                                {!isOwn && <div className="message-sender">{msg.senderName || msg.sender}</div>}
                                                <div className="message-content">{msg.content}</div>
                                                {(msg.hasDocument || msg.document) && renderDocumentAttachment(msg.document, isOwn)}
                                                <div className="message-footer">
                                                    <div className="message-time">
                                                        {msg.createdAt 
                                                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : msg.timestamp
                                                        }
                                                    </div>
                                                    {isOwn && (
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
                                                    Request Approval
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                    <input 
                                        type="text" 
                                        placeholder="Type your message..."
                                        value={messageInput}
                                        onChange={handleMessageInputChange}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button className="send-btn" onClick={sendMessage}>
                                        <i className="ri-send-plane-line"></i>
                                    </button>
                                </div>
                                <div className="security-notice">
                                    <i className="ri-shield-check-line icon-sm"></i>
                                    All messages and files are secured on blockchain
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Document Selection Modal */}
            {isDocumentSelectionModalOpen && (
                <div className="document-selection-modal" onClick={closeDocumentSelectionModal}>
                    <div className="document-selection-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Select Document</h3>
                            <button className="close-btn" onClick={closeDocumentSelectionModal}>&times;</button>
                        </div>
                        
                        <div className="document-grid">
                            {availableDocuments.map(doc => (
                                <div 
                                    key={doc.id}
                                    className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedDocument(doc)}
                                >
                                    <div className="document-card-header">
                                        <div className="document-icon">
                                            <i className="ri-file-text-line"></i>
                                        </div>
                                        <div className="document-card-info">
                                            <h4>{doc.name}</h4>
                                            <p>{doc.type} • {doc.size}</p>
                                        </div>
                                    </div>
                                    <div className="document-card-meta">
                                        <span>Uploaded: {doc.uploadDate}</span>
                                        <span>{doc.hash}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeDocumentSelectionModal}>Cancel</button>
                            <button className="btn-primary" onClick={proceedWithSelectedDocument}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Share Modal */}
            {isDocumentShareModalOpen && (
                <div className="document-share-modal" onClick={closeDocumentModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {currentDocumentAction === 'share' ? 'Share Document' : 'Request Document Approval'}
                            </h3>
                            <button className="close-btn" onClick={closeDocumentModal}>&times;</button>
                        </div>
                        
                        <div className="share-options">
                            <div 
                                className={`share-option ${currentDocumentAction === 'share' ? 'selected' : ''}`}
                                onClick={() => setCurrentDocumentAction('share')}
                            >
                                <h4>Share</h4>
                                <p>Share document for viewing</p>
                            </div>
                            <div 
                                className={`share-option ${currentDocumentAction === 'approval' ? 'selected' : ''}`}
                                onClick={() => setCurrentDocumentAction('approval')}
                            >
                                <h4>Request Approval</h4>
                                <p>Send for verification</p>
                            </div>
                        </div>

                        <div className="member-selection">
                            <h4>Select Recipients:</h4>
                            <div className="member-list">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="member-item">
                                        <input 
                                            type="checkbox" 
                                            id={`member-${member.id}`}
                                            checked={selectedMembers.includes(member.id)}
                                            onChange={() => toggleMemberSelection(member.id)}
                                        />
                                        <label htmlFor={`member-${member.id}`}>
                                            <strong>{member.name}</strong><br/>
                                            <small>{member.role} • {member.department}</small>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ marginBottom: '8px', color: 'var(--text)', fontWeight: 600 }}>Description (Optional):</h4>
                            <textarea 
                                className="description-input" 
                                placeholder="Add a description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeDocumentModal}>Cancel</button>
                            <button className="btn-primary" onClick={sendDocumentRequest}>Send</button>
                        </div>
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
                                        <h4>Blockchain Verified</h4>
                                        <p>All conversations are secured on blockchain</p>
                                    </div>
                                </div>
                            </div>
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
                    <div className="context-menu-item" onClick={() => {
                        setSearchInConversation('');
                        setIsContextMenuOpen(false);
                        alert('Search in conversation feature coming soon!');
                    }}>
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
                            <h3 className="modal-title">Create New Group</h3>
                            <button className="close-btn" onClick={() => setIsCreateGroupModalOpen(false)}>&times;</button>
                        </div>
                        
                        <div className="group-form">
                            <div className="form-group">
                                <label>Group Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter group name..."
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
                                    {searchResults
                                        .filter(user => !newGroupMembers.find(m => m.id === user.id))
                                        .map(user => (
                                            <div 
                                                key={user.id} 
                                                className="member-search-item"
                                                onClick={() => setNewGroupMembers(prev => [...prev, user])}
                                            >
                                                <div className="user-avatar-search">
                                                    {user.avatar}
                                                </div>
                                                <div className="user-info-search">
                                                    <h4>{user.name}</h4>
                                                    <p>{user.role}</p>
                                                </div>
                                                <i className="ri-add-line"></i>
                                            </div>
                                        ))
                                    }
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
        </div>
    );
};

export default ChatInterface;
