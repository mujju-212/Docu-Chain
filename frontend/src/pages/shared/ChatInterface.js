import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ChatInterface.css';

const ChatInterface = () => {
    const { theme } = useTheme();
    
    // Application State
    const [currentUser, setCurrentUser] = useState({
        name: 'John Doe',
        role: 'Student',
        department: 'Computer Science',
        email: 'john.doe@university.edu',
        phone: '+1 (555) 123-4567'
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

    const messagesContainerRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Sample Data - Enhanced with more users and groups
    const [conversations, setConversations] = useState([
        {
            id: 1,
            type: 'direct',
            name: 'Dr. John Smith',
            role: 'Faculty',
            department: 'Computer Science',
            email: 'john.smith@university.edu',
            phone: '+1 (555) 234-5678',
            lastMessage: 'Document verification completed',
            timestamp: '2 min ago',
            unread: 2,
            online: true,
            avatar: 'JS',
            lastSeen: null,
            isTyping: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 2,
            type: 'direct',
            name: 'Prof. Sarah Wilson',
            role: 'Faculty',
            department: 'Mathematics',
            email: 'sarah.wilson@university.edu',
            phone: '+1 (555) 345-6789',
            lastMessage: 'Your assignment has been graded',
            timestamp: '15 min ago',
            unread: 0,
            online: true,
            avatar: 'SW',
            lastSeen: null,
            isTyping: true,
            isPinned: true,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 3,
            type: 'direct',
            name: 'Dr. Michael Chen',
            role: 'Faculty',
            department: 'Computer Science',
            email: 'michael.chen@university.edu',
            phone: '+1 (555) 456-7890',
            lastMessage: 'Research proposal looks good',
            timestamp: '1 hour ago',
            unread: 0,
            online: false,
            avatar: 'MC',
            lastSeen: '1 hour ago',
            isTyping: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 4,
            type: 'direct',
            name: 'Alice Rodriguez',
            role: 'Student',
            department: 'Computer Science',
            email: 'alice.rodriguez@university.edu',
            phone: '+1 (555) 567-8901',
            lastMessage: 'Can we work on the project together?',
            timestamp: '2 hours ago',
            unread: 3,
            online: true,
            avatar: 'AR',
            lastSeen: null,
            isTyping: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 5,
            type: 'direct',
            name: 'Bob Anderson',
            role: 'Student',
            department: 'Computer Science',
            email: 'bob.anderson@university.edu',
            phone: '+1 (555) 678-9012',
            lastMessage: 'Thanks for sharing the notes!',
            timestamp: '3 hours ago',
            unread: 0,
            online: false,
            avatar: 'BA',
            lastSeen: '30 minutes ago',
            isTyping: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 6,
            type: 'direct',
            name: 'Dr. Emily Foster',
            role: 'Faculty',
            department: 'Physics',
            email: 'emily.foster@university.edu',
            phone: '+1 (555) 789-0123',
            lastMessage: 'Lab report approved',
            timestamp: 'Yesterday',
            unread: 0,
            online: false,
            avatar: 'EF',
            lastSeen: 'Yesterday at 5:30 PM',
            isTyping: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 7,
            type: 'direct',
            name: 'David Kim',
            role: 'Student',
            department: 'Mathematics',
            email: 'david.kim@university.edu',
            phone: '+1 (555) 890-1234',
            lastMessage: 'See you in class tomorrow',
            timestamp: 'Yesterday',
            unread: 0,
            online: true,
            avatar: 'DK',
            lastSeen: null,
            isTyping: false,
            isPinned: false,
            isMuted: true,
            isBlocked: false
        },
        {
            id: 8,
            type: 'direct',
            name: 'Admin Office',
            role: 'Admin',
            department: 'Administration',
            email: 'admin@university.edu',
            phone: '+1 (555) 901-2345',
            lastMessage: 'Your document request has been processed',
            timestamp: '2 days ago',
            unread: 1,
            online: true,
            avatar: 'AO',
            lastSeen: null,
            isTyping: false,
            isPinned: true,
            isMuted: false,
            isBlocked: false
        },
        {
            id: 101,
            type: 'group',
            name: 'CS Department - Faculty',
            members: 12,
            lastMessage: 'Meeting scheduled for next Monday',
            timestamp: '30 min ago',
            unread: 2,
            avatar: 'CS',
            isPinned: false,
            isMuted: false
        },
        {
            id: 102,
            type: 'group',
            name: 'CS Section A - 2024',
            members: 45,
            lastMessage: 'Assignment submission deadline extended',
            timestamp: '1 hour ago',
            unread: 5,
            isSection: true,
            avatar: 'SA',
            isPinned: true,
            isMuted: false
        },
        {
            id: 103,
            type: 'group',
            name: 'Research Group - AI/ML',
            members: 8,
            lastMessage: 'New paper published in the journal',
            timestamp: '2 hours ago',
            unread: 0,
            avatar: 'AI',
            isPinned: false,
            isMuted: false
        },
        {
            id: 104,
            type: 'group',
            name: 'Project Team - DocuChain',
            members: 5,
            lastMessage: 'Sprint review tomorrow at 10 AM',
            timestamp: '4 hours ago',
            unread: 8,
            avatar: 'DC',
            isPinned: false,
            isMuted: false
        },
        {
            id: 105,
            type: 'group',
            name: 'Math Department Study Group',
            members: 20,
            lastMessage: 'Practice problems uploaded',
            timestamp: 'Yesterday',
            unread: 0,
            avatar: 'MG',
            isPinned: false,
            isMuted: true
        },
        {
            id: 201,
            type: 'circular',
            name: 'University Announcements',
            members: 1250,
            lastMessage: 'New examination schedule released',
            timestamp: '1 hour ago',
            unread: 1,
            isCircular: true,
            avatar: 'UA',
            isPinned: false,
            isMuted: false
        },
        {
            id: 202,
            type: 'circular',
            name: 'Emergency Alerts',
            members: 1250,
            lastMessage: 'Campus will be closed on Monday',
            timestamp: '3 days ago',
            unread: 0,
            isCircular: true,
            avatar: 'EA',
            isPinned: true,
            isMuted: false
        }
    ]);

    const [availableDocuments] = useState([
        {
            id: 1,
            name: 'Thesis_Chapter1.pdf',
            type: 'PDF',
            size: '2.5 MB',
            hash: '0x1a2b3c4d...',
            uploadDate: '2024-01-15'
        },
        {
            id: 2,
            name: 'Assignment_Report.docx',
            type: 'DOCX',
            size: '1.8 MB',
            hash: '0x5e6f7g8h...',
            uploadDate: '2024-01-10'
        },
        {
            id: 3,
            name: 'Research_Paper.pdf',
            type: 'PDF',
            size: '3.2 MB',
            hash: '0x9i0j1k2l...',
            uploadDate: '2024-01-08'
        },
        {
            id: 4,
            name: 'Project_Proposal.pdf',
            type: 'PDF',
            size: '1.2 MB',
            hash: '0xm3n4o5p6...',
            uploadDate: '2024-01-05'
        },
        {
            id: 5,
            name: 'Lab_Report.docx',
            type: 'DOCX',
            size: '900 KB',
            hash: '0xq7r8s9t0...',
            uploadDate: '2024-01-03'
        }
    ]);

    const [teamMembers] = useState([
        { id: 1, name: 'Dr. John Smith', role: 'Faculty', department: 'Computer Science' },
        { id: 2, name: 'Prof. Sarah Wilson', role: 'Faculty', department: 'Mathematics' },
        { id: 3, name: 'Dr. Mike Johnson', role: 'Faculty', department: 'Computer Science' },
        { id: 4, name: 'Alice Brown', role: 'Student', department: 'Computer Science' },
        { id: 5, name: 'Bob Davis', role: 'Student', department: 'Computer Science' }
    ]);

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'Dr. John Smith',
            content: 'I have reviewed your thesis document. Please check the verification status.',
            timestamp: '10:30 AM',
            isOwn: false,
            hasDocument: true,
            document: {
                name: 'Thesis_Chapter1.pdf',
                type: 'approved',
                hash: '0x1a2b3c4d...',
                size: '2.5 MB',
                requestType: 'approval-response'
            }
        },
        {
            id: 2,
            sender: 'You',
            content: 'Thank you for the quick review. I can see it\'s been approved on the blockchain.',
            timestamp: '10:32 AM',
            isOwn: true,
            status: 'read' // 'sent', 'delivered', 'read'
        },
        {
            id: 3,
            sender: 'You',
            content: 'Requesting approval for my research paper',
            timestamp: '10:35 AM',
            isOwn: true,
            status: 'delivered',
            hasDocument: true,
            document: {
                name: 'Research_Paper.pdf',
                type: 'approval-request',
                hash: '0x9i0j1k2l...',
                size: '3.2 MB',
                requestType: 'approval-request',
                approvalMembers: ['Dr. John Smith', 'Prof. Sarah Wilson'],
                description: 'Please review my research paper on blockchain applications in education'
            }
        },
        {
            id: 4,
            sender: 'You',
            content: 'Let me know if you need any additional information.',
            timestamp: '10:36 AM',
            isOwn: true,
            status: 'sent'
        }
    ]);

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

    const handleMuteConversation = () => {
        setConversations(conversations.map(c => 
            c.id === selectedChat ? { ...c, isMuted: !c.isMuted } : c
        ));
        setIsContextMenuOpen(false);
        alert(`Conversation ${conversations.find(c => c.id === selectedChat)?.isMuted ? 'unmuted' : 'muted'}`);
    };

    const handlePinConversation = () => {
        setConversations(conversations.map(c => 
            c.id === selectedChat ? { ...c, isPinned: !c.isPinned } : c
        ));
        setIsContextMenuOpen(false);
        alert(`Conversation ${conversations.find(c => c.id === selectedChat)?.isPinned ? 'unpinned' : 'pinned'}`);
    };

    const handleBlockUser = () => {
        const conv = conversations.find(c => c.id === selectedChat);
        if (conv && conv.type === 'direct') {
            setConversations(conversations.map(c => 
                c.id === selectedChat ? { ...c, isBlocked: !c.isBlocked } : c
            ));
            setIsContextMenuOpen(false);
            alert(`User ${conv.isBlocked ? 'unblocked' : 'blocked'}`);
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

    const sendMessage = () => {
        const content = messageInput.trim();
        if (!content) return;

        const newMessage = {
            id: messages.length + 1,
            sender: 'You',
            content: content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true,
            status: 'sent' // Initial status
        };

        setMessages([...messages, newMessage]);
        setMessageInput('');

        // Simulate message delivery and read status
        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === newMessage.id ? { ...m, status: 'delivered' } : m
            ));
        }, 1000);

        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === newMessage.id ? { ...m, status: 'read' } : m
            ));
        }, 3000);

        // Update conversation
        setConversations(conversations.map(c => 
            c.id === selectedChat ? { ...c, lastMessage: content, timestamp: 'now' } : c
        ));
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

    const sendDocumentRequest = () => {
        if (selectedMembers.length === 0) {
            alert('Please select at least one recipient.');
            return;
        }

        if (!selectedDocument) {
            alert('No document selected.');
            return;
        }

        const selectedMemberNames = selectedMembers.map(id => 
            teamMembers.find(m => m.id === id).name
        );

        const newMessage = {
            id: messages.length + 1,
            sender: 'You',
            content: currentDocumentAction === 'share' ? 
                `Shared document: ${selectedDocument.name}` : 
                `Requesting approval for: ${selectedDocument.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true,
            hasDocument: true,
            document: {
                name: selectedDocument.name,
                type: currentDocumentAction === 'share' ? 'shared' : 'approval-request',
                hash: selectedDocument.hash,
                size: selectedDocument.size,
                requestType: currentDocumentAction,
                approvalMembers: selectedMemberNames,
                description: description
            }
        };

        setMessages([...messages, newMessage]);
        closeDocumentModal();

        // Update conversation
        setConversations(conversations.map(c => 
            c.id === selectedChat ? { ...c, lastMessage: newMessage.content, timestamp: 'now' } : c
        ));
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
                                <h3>{currentUser.name}</h3>
                                <p>{currentUser.role} • {currentUser.department}</p>
                            </div>
                        </div>
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
                        {filteredConversations.map(conv => (
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
                                                {conv.online && <div className="online-indicator-sm"></div>}
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
                                            <div className="conversation-time">{conv.timestamp}</div>
                                        </div>
                                        <div className="conversation-footer">
                                            <div className="conversation-message">
                                                {conv.isMuted && <i className="ri-notification-off-line muted-icon"></i>}
                                                {conv.isTyping ? (
                                                    <span className="typing-text">typing...</span>
                                                ) : (
                                                    conv.lastMessage
                                                )}
                                            </div>
                                            {conv.unread > 0 && <div className="unread-badge">{conv.unread}</div>}
                                        </div>
                                        {conv.type !== 'direct' && <div className="conversation-meta">{conv.members} members</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Create Group Button (Admin only) */}
                    {currentUser.role === 'Admin' && (
                        <button className="create-group-btn" onClick={() => alert('Create Group functionality')}>
                            <i className="ri-add-line"></i>
                            Create Group
                        </button>
                    )}
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
                                                    {selectedConversation?.online && <div className="online-indicator-chat"></div>}
                                                </div>
                                            ) : (
                                                <i className="ri-team-line"></i>
                                            )}
                                        </div>
                                        <div className="chat-info">
                                            <h3>{selectedConversation?.name}</h3>
                                            <p className="chat-status">
                                                {selectedConversation?.type === 'direct' ? (
                                                    selectedConversation?.isTyping ? (
                                                        <span className="typing-indicator-text">
                                                            <span className="typing-dots">
                                                                <span></span><span></span><span></span>
                                                            </span>
                                                            typing...
                                                        </span>
                                                    ) : selectedConversation?.online ? (
                                                        <span className="online-status">Online</span>
                                                    ) : (
                                                        <span className="last-seen">Last seen {selectedConversation?.lastSeen}</span>
                                                    )
                                                ) : (
                                                    `${selectedConversation?.members} members`
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
                                {/* Typing Indicator */}
                                {selectedConversation?.isTyping && (
                                    <div className="typing-indicator">
                                        <div className="typing-bubble">
                                            <div className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {messages.map(msg => (
                                    <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
                                        <div className={`message-bubble ${msg.isOwn ? 'own' : 'other'}`}>
                                            {!msg.isOwn && <div className="message-sender">{msg.sender}</div>}
                                            <div className="message-content">{msg.content}</div>
                                            {msg.hasDocument && renderDocumentAttachment(msg.document, msg.isOwn)}
                                            <div className="message-footer">
                                                <div className="message-time">{msg.timestamp}</div>
                                                {msg.isOwn && msg.status && (
                                                    <div className={`message-status status-${msg.status}`}>
                                                        {msg.status === 'sent' && <i className="ri-check-line"></i>}
                                                        {msg.status === 'delivered' && (
                                                            <>
                                                                <i className="ri-check-line tick-1"></i>
                                                                <i className="ri-check-line tick-2"></i>
                                                            </>
                                                        )}
                                                        {msg.status === 'read' && (
                                                            <>
                                                                <i className="ri-check-double-line read-tick"></i>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                        onChange={(e) => setMessageInput(e.target.value)}
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
                                <p className="profile-last-seen">Last seen {selectedConversation.lastSeen}</p>
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
        </div>
    );
};

export default ChatInterface;
