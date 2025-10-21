import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './FileManagerNew.css';

const FileManager = () => {
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
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [trashedItems, setTrashedItems] = useState([]);

  // File system data with nested folder structure
  const [fileSystem, setFileSystem] = useState({
    currentPath: '/',
    folders: {
      '/': {
        folders: [
          { id: 'f1', name: 'Main Documents', type: 'folder' },
          { id: 'f2', name: 'Images', type: 'folder' },
          { id: 'f3', name: 'Projects', type: 'folder' },
          { id: 'f4', name: 'Shared', type: 'folder' }
        ],
        files: [
          { id: 1, name: 'Welcome_Guide.pdf', type: 'pdf', size: '1.2 MB', modified: 'Oct 20, 2025', owner: 'Me', starred: true, hash: 'QmX1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', sharedWith: 0, content: 'Welcome guide for new users' }
        ]
      },
      '/Main Documents': {
        folders: [
          { id: 'f5', name: 'Academic Papers', type: 'folder' },
          { id: 'f6', name: 'Legal Documents', type: 'folder' }
        ],
        files: [
          { id: 2, name: 'Annual_Report_2025.pdf', type: 'pdf', size: '3.4 MB', modified: 'Oct 19, 2025', owner: 'Admin', starred: false, hash: 'QmY2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a', sharedWith: 2, content: 'Comprehensive annual report with financial data' },
          { id: 3, name: 'Company_Policy.pdf', type: 'pdf', size: '850 KB', modified: 'Oct 18, 2025', owner: 'HR', starred: true, hash: 'QmZ3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b', sharedWith: 5, content: 'Updated company policies and procedures' }
        ]
      },
      '/Main Documents/Academic Papers': {
        folders: [
          { id: 'f7', name: 'Research Papers', type: 'folder' },
          { id: 'f8', name: 'Thesis Collection', type: 'folder' }
        ],
        files: [
          { id: 4, name: 'Blockchain_Research.pdf', type: 'pdf', size: '4.2 MB', modified: 'Oct 17, 2025', owner: 'Dr. Johnson', starred: true, hash: 'QmA4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c', sharedWith: 1, content: 'Comprehensive research on blockchain technology applications' },
          { id: 5, name: 'ML_Algorithms_Study.pdf', type: 'pdf', size: '2.8 MB', modified: 'Oct 16, 2025', owner: 'Prof. Smith', starred: false, hash: 'QmB5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d', sharedWith: 3, content: 'Study on machine learning algorithms and their implementations' },
          { id: 6, name: 'AI_Ethics_Paper.pdf', type: 'pdf', size: '1.9 MB', modified: 'Oct 15, 2025', owner: 'Ethics Committee', starred: true, hash: 'QmC6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e', sharedWith: 0, content: 'Analysis of ethical considerations in AI development' }
        ]
      },
      '/Main Documents/Academic Papers/Research Papers': {
        folders: [],
        files: [
          { id: 7, name: 'Quantum_Computing.pdf', type: 'pdf', size: '5.1 MB', modified: 'Oct 14, 2025', owner: 'Research Team', starred: false, hash: 'QmD7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f', sharedWith: 2, content: 'Research paper on quantum computing advancements' },
          { id: 8, name: 'Cybersecurity_Analysis.pdf', type: 'pdf', size: '3.7 MB', modified: 'Oct 13, 2025', owner: 'Security Team', starred: true, hash: 'QmE8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g', sharedWith: 1, content: 'Comprehensive cybersecurity threat analysis' },
          { id: 9, name: 'IoT_Applications.pdf', type: 'pdf', size: '2.6 MB', modified: 'Oct 12, 2025', owner: 'IoT Lab', starred: false, hash: 'QmF9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h', sharedWith: 4, content: 'Internet of Things applications in smart cities' },
          { id: 10, name: 'Data_Science_Methods.pdf', type: 'pdf', size: '4.3 MB', modified: 'Oct 11, 2025', owner: 'Data Team', starred: true, hash: 'QmG0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i', sharedWith: 0, content: 'Advanced data science methodologies and techniques' },
          { id: 11, name: 'Cloud_Architecture.pdf', type: 'pdf', size: '3.9 MB', modified: 'Oct 10, 2025', owner: 'Cloud Team', starred: false, hash: 'QmH1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j', sharedWith: 3, content: 'Modern cloud architecture patterns and best practices' }
        ]
      },
      '/Main Documents/Academic Papers/Thesis Collection': {
        folders: [],
        files: [
          { id: 12, name: 'PhD_Thesis_AI.pdf', type: 'pdf', size: '15.2 MB', modified: 'Oct 9, 2025', owner: 'Dr. Wilson', starred: true, hash: 'QmI2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k', sharedWith: 2, content: 'Doctoral thesis on artificial intelligence applications' },
          { id: 13, name: 'Masters_Blockchain.pdf', type: 'pdf', size: '8.7 MB', modified: 'Oct 8, 2025', owner: 'Sarah Chen', starred: false, hash: 'QmJ3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l', sharedWith: 1, content: 'Masters thesis on blockchain implementation in healthcare' },
          { id: 14, name: 'Undergrad_ML.pdf', type: 'pdf', size: '4.5 MB', modified: 'Oct 7, 2025', owner: 'Student', starred: true, hash: 'QmK4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m', sharedWith: 0, content: 'Undergraduate project on machine learning in finance' },
          { id: 15, name: 'Research_Proposal.pdf', type: 'pdf', size: '2.1 MB', modified: 'Oct 6, 2025', owner: 'Graduate Student', starred: false, hash: 'QmL5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n', sharedWith: 2, content: 'Research proposal for advanced neural networks' }
        ]
      },
      '/Main Documents/Legal Documents': {
        folders: [],
        files: [
          { id: 16, name: 'Contract_Agreement.pdf', type: 'pdf', size: '1.8 MB', modified: 'Oct 5, 2025', owner: 'Legal Team', starred: true, hash: 'QmM6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o', sharedWith: 3, content: 'Legal contract agreement for partnership' }
        ]
      },
      '/Images': {
        folders: [],
        files: [
          { id: 17, name: 'Team_Photo.jpg', type: 'image', size: '5.2 MB', modified: 'Oct 4, 2025', owner: 'HR', starred: false, hash: 'QmN7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p', sharedWith: 0, content: 'Annual team photograph' }
        ]
      },
      '/Projects': {
        folders: [],
        files: [
          { id: 18, name: 'Project_Summary.xlsx', type: 'sheet', size: '2.3 MB', modified: 'Oct 3, 2025', owner: 'Project Manager', starred: true, hash: 'QmO8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q', sharedWith: 4, content: 'Comprehensive project summary with milestones' }
        ]
      },
      '/Shared': {
        folders: [],
        files: [
          { id: 19, name: 'Shared_Notes.txt', type: 'doc', size: '125 KB', modified: 'Oct 2, 2025', owner: 'Collaboration', starred: false, hash: 'QmP9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r', sharedWith: 6, content: 'Shared collaborative notes and ideas' }
        ]
      }
    }
  });

  // Connected users data
  const connectedUsers = [
    { id: 'user1', name: 'Alice Johnson', username: '@alice.j', wallet: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', status: 'online', avatar: 'AJ', lastSeen: 'now', chatHistory: true },
    { id: 'user2', name: 'Bob Chen', username: '@bob.chen', wallet: '0x853e46Dd7745D0643036b4c9E5D0643036b4c9E5', status: 'online', avatar: 'BC', lastSeen: '2 min ago', chatHistory: true },
    { id: 'user3', name: 'Carol Davis', username: '@carol.d', wallet: '0x964f57Ee8856E0754147c5dF6E0754147c5dF6E', status: 'offline', avatar: 'CD', lastSeen: '1 hour ago', chatHistory: true },
    { id: 'user4', name: 'David Wilson', username: '@d.wilson', wallet: '0xa75068Ff9967F0865258d6eG7F0865258d6eG7F', status: 'online', avatar: 'DW', lastSeen: 'now', chatHistory: false },
    { id: 'user5', name: 'Emma Brown', username: '@emma.b', wallet: '0xb86179G0a078G0976369e7fH8G0976369e7fH8G', status: 'online', avatar: 'EB', lastSeen: '5 min ago', chatHistory: true },
    { id: 'user6', name: 'Frank Miller', username: '@frank.m', wallet: '0xc9728aH1b189H1a87470f8gI9H1a87470f8gI9H', status: 'offline', avatar: 'FM', lastSeen: '3 hours ago', chatHistory: false },
    { id: 'user7', name: 'Grace Lee', username: '@grace.lee', wallet: '0xda839bI2c29aI2b98581g9hJ0I2b98581g9hJ0I', status: 'online', avatar: 'GL', lastSeen: 'now', chatHistory: true },
    { id: 'user8', name: 'Henry Taylor', username: '@h.taylor', wallet: '0xeb94acJ3d3abJ3ca9692h0iK1J3ca9692h0iK1J', status: 'online', avatar: 'HT', lastSeen: '1 min ago', chatHistory: false }
  ];

  const [starredItems, setStarredItems] = useState([1, 3, 4, 6, 10, 12, 14, 16]);
  const [recentItems, setRecentItems] = useState([
    { fileId: 1, action: 'opened', time: '2025-10-21 10:12', name: 'Welcome_Guide.pdf' },
    { fileId: 2, action: 'opened', time: '2025-10-21 09:45', name: 'Annual_Report_2025.pdf' },
    { fileId: 3, action: 'opened', time: '2025-10-20 16:30', name: 'Company_Policy.pdf' },
    { fileId: 4, action: 'opened', time: '2025-10-20 14:22', name: 'Blockchain_Research.pdf' },
    { fileId: 5, action: 'opened', time: '2025-10-19 11:15', name: 'ML_Algorithms_Study.pdf' },
    { fileId: 6, action: 'opened', time: '2025-10-19 09:33', name: 'AI_Ethics_Paper.pdf' },
    { fileId: 7, action: 'opened', time: '2025-10-18 15:45', name: 'Quantum_Computing.pdf' },
    { fileId: 8, action: 'opened', time: '2025-10-18 13:20', name: 'Cybersecurity_Analysis.pdf' },
    { fileId: 9, action: 'opened', time: '2025-10-17 11:00', name: 'IoT_Applications.pdf' },
    { fileId: 10, action: 'uploaded', time: '2025-10-17 10:30', name: 'Data_Science_Methods.pdf' },
    { fileId: 11, action: 'uploaded', time: '2025-10-16 14:15', name: 'Cloud_Architecture.pdf' },
    { fileId: 12, action: 'opened', time: '2025-10-16 12:45', name: 'PhD_Thesis_AI.pdf' },
    { fileId: 13, action: 'opened', time: '2025-10-15 16:20', name: 'Masters_Blockchain.pdf' },
    { fileId: 14, action: 'uploaded', time: '2025-10-15 14:10', name: 'Undergrad_ML.pdf' },
    { fileId: 15, action: 'created', time: '2025-10-14 13:30', name: 'Research_Proposal.pdf' }
  ]);

  // Version history data
  const mockVersionHistory = {
    1: [
      { version: 3, date: 'Feb 10, 2025 10:15', user: 'Me', action: 'Content updated', size: '2.4 MB' },
      { version: 2, date: 'Feb 08, 2025 14:30', user: 'John Smith', action: 'Formatting changes', size: '2.3 MB' },
      { version: 1, date: 'Feb 05, 2025 09:00', user: 'Me', action: 'Initial version', size: '2.1 MB' }
    ],
    2: [
      { version: 7, date: 'Feb 09, 2025 16:45', user: 'John Smith', action: 'Updated Q4 figures', size: '1.8 MB' },
      { version: 6, date: 'Feb 07, 2025 11:20', user: 'Finance Team', action: 'Added new categories', size: '1.7 MB' },
      { version: 5, date: 'Feb 05, 2025 13:15', user: 'John Smith', action: 'Corrected formulas', size: '1.6 MB' }
    ],
    8: [
      { version: 12, date: 'Feb 03, 2025 15:30', user: 'Legal Team', action: 'Updated blockchain clauses', size: '890 KB' },
      { version: 11, date: 'Jan 28, 2025 10:45', user: 'Legal Team', action: 'Added privacy terms', size: '845 KB' },
      { version: 10, date: 'Jan 25, 2025 14:20', user: 'Compliance', action: 'Regulatory updates', size: '820 KB' }
    ]
  };
  const [sharedWithMe] = useState([
    { id: 7, name: 'Research_Notes.pdf', type: 'pdf', size: 1258291, sharedBy: 'Dr. Johnson', dateShared: '2025-02-05', access: 'read', hash: 'QmD3j0cK4e4bcK4db0703i1jL2K4db0703i1jL2K4db0703i1jL' },
    { id: 8, name: 'Lecture_01.mp4', type: 'video', size: 125829120, sharedBy: 'Prof. Davis', dateShared: '2025-02-01', access: 'read', hash: 'QmE4k1dL5f5cdL5ec1814j2kM3L5ec1814j2kM3L5ec1814j2kM' },
    { id: 9, name: 'Group_Project.docx', type: 'doc', size: 512000, sharedBy: 'Alice Chen', dateShared: '2025-01-28', access: 'write', hash: 'QmF5l2eM6g6deM6fd2925k3lN4M6fd2925k3lN4M6fd2925k3lN' }
  ]);

  // Mock data for demonstration (keeping existing for compatibility)
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

  // Get current files and folders
  const getCurrentFiles = () => {
    const currentFolder = fileSystem.folders[currentPath] || { folders: [], files: [] };
    let items = [];
    
    // Add folders
    items.push(...currentFolder.folders.map(folder => ({ ...folder, type: 'folder' })));
    
    // Add files  
    items.push(...currentFolder.files.map(file => ({ ...file, type: 'file' })));
    
    return items;
  };

  // Get all starred files from the file system
  const getStarredFiles = () => {
    let starredFiles = [];
    
    try {
      // Iterate through all folders in the file system
      Object.values(fileSystem.folders || {}).forEach(folder => {
        // Check starred folders
        if (folder.folders && Array.isArray(folder.folders)) {
          starredFiles.push(...folder.folders.filter(f => f && starredItems.includes(f.id)));
        }
        // Check starred files
        if (folder.files && Array.isArray(folder.files)) {
          starredFiles.push(...folder.files.filter(f => f && starredItems.includes(f.id)));
        }
      });
    } catch (error) {
      console.error('Error getting starred files:', error);
    }
    
    return starredFiles;
  };

  // Combined filtering and sorting
  const getProcessedFiles = (files) => {
    return sortFiles(filterByType(filterFiles(files)));
  };

  const mockFiles = [
    {
      id: 1,
      name: 'Project Proposal.pdf',
      type: 'pdf',
      size: '2.4 MB',
      modified: 'Feb 10, 2025',
      owner: 'Me',
      starred: true,
      hash: 'QmX7d4B2mP8kL9nR5tY6uI3oP7qW8eR2tY5uI',
      shared: false,
      content: 'This is a comprehensive project proposal for the blockchain document management system...',
      versions: 3
    },
    {
      id: 2,
      name: 'Budget Analysis.xlsx',
      type: 'sheet',
      size: '1.8 MB',
      modified: 'Feb 09, 2025',
      owner: 'John Smith',
      starred: false,
      hash: 'QmA9k2L7pN3mR8sT4uV6wX1yZ5eR7tY9uI',
      shared: true,
      content: 'Financial analysis spreadsheet with budget breakdowns and forecasts',
      versions: 7
    },
    {
      id: 3,
      name: 'Marketing Assets',
      type: 'folder',
      size: '24 files',
      modified: 'Feb 08, 2025',
      owner: 'Me',
      starred: false,
      hash: null,
      shared: false,
      folderContents: ['logos', 'banners', 'social-media', 'presentations']
    },
    {
      id: 4,
      name: 'Team Photo.jpg',
      type: 'image',
      size: '5.2 MB',
      modified: 'Feb 07, 2025',
      owner: 'Sarah Wilson',
      starred: true,
      hash: 'QmP3k8M2nQ5rS9tU7vW1xY4zA6bC8dE',
      shared: true,
      content: 'High-resolution team photograph taken during annual company retreat',
      versions: 1
    },
    {
      id: 5,
      name: 'Presentation.pptx',
      type: 'doc',
      size: '3.6 MB',
      modified: 'Feb 06, 2025',
      owner: 'Me',
      starred: false,
      hash: 'QmR8k3N7pQ2mS5tU9vW7xY1zA4bC',
      shared: false,
      content: 'PowerPoint presentation for Q1 review meeting with stakeholders',
      versions: 4
    },
    {
      id: 6,
      name: 'Demo Video.mp4',
      type: 'video',
      size: '45.8 MB',
      modified: 'Feb 05, 2025',
      owner: 'Mike Johnson',
      starred: false,
      hash: 'QmT5k1L9pM3nR7sU2vW8xY6zA',
      shared: true,
      content: 'Product demonstration video showing key features and functionality',
      versions: 2
    },
    {
      id: 7,
      name: 'Research Documents',
      type: 'folder',
      size: '15 files',
      modified: 'Feb 04, 2025',
      owner: 'Me',
      starred: true,
      hash: null,
      shared: true,
      folderContents: ['surveys', 'interviews', 'analysis', 'reports']
    },
    {
      id: 8,
      name: 'Contract_Template.docx',
      type: 'doc',
      size: '890 KB',
      modified: 'Feb 03, 2025',
      owner: 'Legal Team',
      starred: false,
      hash: 'QmS6j9H4kM1nP3qR7sT2uV8wX',
      shared: true,
      content: 'Standard contract template with blockchain verification clauses',
      versions: 12
    },
    {
      id: 9,
      name: 'Financial_Report_Q4.pdf',
      type: 'pdf',
      size: '4.7 MB',
      modified: 'Feb 02, 2025',
      owner: 'Finance Dept',
      starred: false,
      hash: 'QmU8l1K6oO3rQ5sV9xY2zA7bD',
      shared: false,
      content: 'Comprehensive Q4 financial report with blockchain transaction logs',
      versions: 5
    },
    {
      id: 10,
      name: 'Client Database.xlsx',
      type: 'sheet',
      size: '2.1 MB',
      modified: 'Feb 01, 2025',
      owner: 'Sales Team',
      starred: true,
      hash: 'QmW0n3M8qS5tR7uX1yB4zC9eF',
      shared: true,
      content: 'Complete client database with contact information and transaction history',
      versions: 8
    }
  ];

  const quickAccessItems = [
    { id: 1, name: 'Documents', icon: 'ri-file-text-line', count: 23 },
    { id: 2, name: 'Images', icon: 'ri-image-line', count: 12 },
    { id: 3, name: 'Videos', icon: 'ri-video-line', count: 5 },
    { id: 4, name: 'Shared', icon: 'ri-share-line', count: 8 },
    { id: 5, name: 'Recent', icon: 'ri-time-line', count: 15 },
    { id: 6, name: 'Starred', icon: 'ri-star-line', count: 6 }
  ];

  const mockUsers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@university.edu', avatar: 'AJ', online: true, wallet: '0x1a2b3c...789def' },
    { id: 2, name: 'Bob Smith', email: 'bob@university.edu', avatar: 'BS', online: false, wallet: '0x4e5f6g...123abc' },
    { id: 3, name: 'Carol Davis', email: 'carol@university.edu', avatar: 'CD', online: true, wallet: '0x7h8i9j...456def' },
  ];

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

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    // Clear selection when switching sections
    setSelectedFiles([]);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Utility Functions
  const getFileColor = (type) => {
    const colors = {
      pdf: '#b42318',
      doc: '#2563eb',
      sheet: '#059669',
      image: '#7c3aed',
      video: '#dc2626'
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const generateHash = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
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
        break;
      case 'update':
        handleUpdateFile(item);
        break;
      case 'paste':
        handlePaste();
        break;
      default:
        break;
    }
    hideContextMenu();
  };

  // Paste functionality
  const handlePaste = () => {
    if (clipboard.items.length === 0) return;
    
    clipboard.items.forEach(item => {
      const newItem = {
        ...item,
        id: clipboard.action === 'move' ? item.id : Date.now() + Math.random(),
        modified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      };
      
      // Add to current folder
      setFileSystem(prev => {
        const newFS = { ...prev };
        if (!newFS.folders[currentPath]) {
          newFS.folders[currentPath] = { folders: [], files: [] };
        }
        
        if (item.type === 'folder') {
          newFS.folders[currentPath].folders.push(newItem);
        } else {
          newFS.folders[currentPath].files.push(newItem);
        }
        
        return newFS;
      });
    });
    
    const actionText = clipboard.action === 'copy' ? 'copied' : 'moved';
    const itemNames = clipboard.items.map(item => item.name).join(', ');
    
    showNotification('success', 'Paste Complete', 
      `${clipboard.items.length} item(s) ${actionText}: ${itemNames}`);
    
    // Clear clipboard if it was a move operation
    if (clipboard.action === 'move') {
      setClipboard({ items: [], action: null });
    }
  };

  // Delete functionality
  const handleDelete = (item) => {
    // Add to trash
    setTrashedItems(prev => [...prev, {
      ...item,
      deletedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      originalPath: currentPath
    }]);

    // Remove from file system
    setFileSystem(prev => {
      const newFS = { ...prev };
      if (newFS.folders[currentPath]) {
        if (item.type === 'folder') {
          newFS.folders[currentPath].folders = newFS.folders[currentPath].folders.filter(f => f.id !== item.id);
        } else {
          newFS.folders[currentPath].files = newFS.folders[currentPath].files.filter(f => f.id !== item.id);
        }
      }
      return newFS;
    });

    showNotification('warning', 'Deleted', `${item.name} moved to trash`);
  };

  // Update file functionality
  const handleUpdateFile = (file) => {
    const newVersion = (file.versions || 1) + 1;
    showNotification('success', 'File Updated', 
      `${file.name} updated to version ${newVersion}`);
    
    // Add to version history
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    
    // Update version history (in real app, this would be API call)
    setVersionHistory(prev => ({
      ...prev,
      [file.id]: [
        { 
          version: newVersion, 
          date: currentDate, 
          user: 'Me', 
          action: 'File updated', 
          size: file.size 
        },
        ...(prev[file.id] || [])
      ]
    }));
  };

  // Rename functionality
  const handleRename = () => {
    if (!newName.trim()) return;
    
    showNotification('success', 'Renamed', 
      `${renameItem.name} renamed to ${newName}`);
    
    setRenameItem(null);
    setNewName('');
  };

  // Create new folder/file
  const handleCreateNew = () => {
    setIsCreateFolderModalOpen(true);
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: `f${Date.now()}`,
        name: newFolderName.trim(),
        type: 'folder',
        size: '0 files',
        modified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        owner: 'Me',
        starred: false,
        hash: null,
        shared: false
      };
      
      // Add to file system
      setFileSystem(prev => {
        const newFS = { ...prev };
        if (!newFS.folders[currentPath]) {
          newFS.folders[currentPath] = { folders: [], files: [] };
        }
        newFS.folders[currentPath].folders.push(newFolder);
        
        // Create empty folder structure for the new folder
        const newFolderPath = currentPath === '/' ? `/${newFolderName.trim()}` : `${currentPath}/${newFolderName.trim()}`;
        newFS.folders[newFolderPath] = { folders: [], files: [] };
        
        return newFS;
      });

      // Add to recent items
      setRecentItems(prev => {
        const newItem = {
          fileId: newFolder.id,
          action: 'created',
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          name: newFolder.name
        };
        return [newItem, ...prev].slice(0, 15);
      });
      
      showNotification('success', 'Folder Created', `Created folder "${newFolderName}"`);
      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      files.forEach(file => {
        const fileType = getFileTypeFromExtension(file.name);
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: fileType,
          size: formatFileSize(file.size),
          modified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          owner: 'Me',
          starred: false,
          hash: generateHash(),
          shared: false,
          content: `Uploaded file: ${file.name}`,
          versions: 1
        };
        
        // Add to file system
        setFileSystem(prev => {
          const newFS = { ...prev };
          if (!newFS.folders[currentPath]) {
            newFS.folders[currentPath] = { folders: [], files: [] };
          }
          newFS.folders[currentPath].files.push(newFile);
          return newFS;
        });

        // Add to recent items
        setRecentItems(prev => {
          const newItem = {
            fileId: newFile.id,
            action: 'uploaded',
            time: new Date().toISOString().replace('T', ' ').slice(0, 16),
            name: newFile.name
          };
          return [newItem, ...prev].slice(0, 15);
        });
        
        showNotification('success', 'File Uploaded', `Uploaded "${file.name}"`);
      });
    }
    event.target.value = '';
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
  const toggleStar = (file) => {
    const isStarred = starredItems.includes(file.id);
    if (isStarred) {
      setStarredItems(prev => prev.filter(id => id !== file.id));
    } else {
      setStarredItems(prev => [...prev, file.id]);
    }
    showNotification('success', 'Star Updated', 
      isStarred ? `Removed ${file.name} from starred` : `Added ${file.name} to starred`);
  };

  // Single click - show details
  const handleSingleClick = (file) => {
    setCurrentFile(file);
    setIsDetailsModalOpen(true);
  };

  // Double click - open file/folder
  const handleDoubleClick = (file) => {
    if (file.type === 'folder') {
      // Navigate into folder
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      navigateToFolder(newPath);
      showNotification('info', 'Folder Opened', `Opened ${file.name} folder`);
    } else {
      // Open file for viewing/editing
      setRecentItems(prev => {
        const newItem = {
          fileId: file.id,
          action: 'opened',
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          name: file.name
        };
        return [newItem, ...prev.filter(item => item.fileId !== file.id)].slice(0, 15);
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
    setRecentItems(prev => {
      const newItem = {
        fileId: file.id,
        action: 'opened',
        time: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      return [newItem, ...prev.filter(item => item.fileId !== file.id)].slice(0, 10);
    });
    setCurrentFile(file);
    setIsFileModalOpen(true);
  };

  const shareFile = (file) => {
    setCurrentSharingItems([file]);
    setIsShareModalOpen(true);
  };

  const downloadFile = (file) => {
    // Create a blob with some sample content
    const content = file.content || `Sample content for ${file.name}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Download Complete', 
      `${file.name} downloaded successfully`);
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
    const currentFolder = fileSystem.folders[fileSystem.currentPath];
    if (!currentFolder) return [];
    
    let items = [];
    
    // Add folders
    currentFolder.folders.forEach(folderName => {
      const folderPath = fileSystem.currentPath === '/' ? `/${folderName}` : `${fileSystem.currentPath}/${folderName}`;
      items.push({ type: 'folder', name: folderName, path: folderPath });
    });
    
    // Add files
    items.push(...currentFolder.files.map(file => ({ ...file, type: 'file' })));
    
    return items;
  };

  const navigateToFolder = (path) => {
    setCurrentPath(path);
    clearSelection();
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
  const toggleUserSelection = (user) => {
    setSelectedRecipients(prev => {
      const existingIndex = prev.findIndex(r => r.id === user.id);
      if (existingIndex > -1) {
        return prev.filter(r => r.id !== user.id);
      } else {
        return [...prev, { ...user, permission: 'read' }];
      }
    });
  };

  const executeBlockchainShare = () => {
    if (selectedRecipients.length === 0) {
      showNotification('warning', 'No Recipients', 'Please select at least one recipient');
      return;
    }
    
    setIsProgressModalOpen(true);
    setTimeout(() => {
      setIsProgressModalOpen(false);
      setIsShareModalOpen(false);
      setSelectedRecipients([]);
      setCurrentSharingItems([]);
      showNotification('success', 'Blockchain Share Complete', 
        `Successfully shared files with ${selectedRecipients.length} users`);
    }, 3000);
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
    if (files) {
      setSelectedFiles(Array.isArray(files) ? files : [files]);
    }
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
          <h2 style={{margin: 0, fontSize: '24px', fontWeight: '600', color: '#1f2937'}}>
            {currentSection === 'section-all' && 'All Files'}
            {currentSection === 'section-shared' && 'Shared with me'}
            {currentSection === 'section-recent' && 'Recent'}
            {currentSection === 'section-starred' && 'Starred'}
            {currentSection === 'section-trash' && 'Trash'}
          </h2>
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
            <button 
              className="fm-btn" 
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
              <i className="ri-upload-cloud-2-line" style={{marginRight: '6px'}}></i> Upload
            </button>
            <button 
              className="fm-btn" 
              onClick={() => document.getElementById('fileInput').click()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
              <i className="ri-upload-cloud-2-line" style={{marginRight: '6px'}}></i> Upload
            </button>
            <button 
              className="fm-btn fm-primary" 
              onClick={handleCreateNew}
              style={{
                padding: '8px 16px',
                backgroundColor: currentTheme.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
              <i className="ri-add-line" style={{marginRight: '6px'}}></i> Create
            </button>
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
                {quickAccessItems.map(item => (
                  <div key={item.id} className="fm-qa-card">
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
                {getBreadcrumbs().map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.path}>
                    {index > 0 && <i className="ri-arrow-right-s-line"></i>}
                    {index === getBreadcrumbs().length - 1 ? (
                      <span className="fm-current">{breadcrumb.name}</span>
                    ) : (
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToFolder(breadcrumb.path);
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
                <div className="fm-collection" id="gridView">
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
                          <div className="fm-action-btn" onClick={(e) => {
                            e.stopPropagation();
                            openShareModal([file.id]);
                          }}>
                            <i className="ri-share-line"></i>
                          </div>
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
                        <div>{renameItem?.id === file.id ? (
                          <input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                            onBlur={handleRename}
                            autoFocus
                            style={{width: '100%', padding: '2px', border: '1px solid #0ea5e9', borderRadius: '3px'}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : file.name}</div>
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
                        ) : file.name}</div>
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
            <section className="fm-section">
              <div className="fm-section-head">
                <h3 style={{margin:0}}>Shared with me</h3>
              </div>
              <div className="fm-empty">
                <i className="ri-share-line" style={{fontSize: '48px', color: 'var(--icon)', marginBottom: '16px'}}></i>
                <p>No files shared with you yet.</p>
              </div>
            </section>
          )}

          {currentSection === 'section-recent' && (
            <div className="fm-tab-content" id="recent" style={{display: 'block'}}>
              <div className="fm-section-header">
                <h3>Recent</h3>
                <span className="fm-pill">
                  <i className="ri-time-line"></i> Last 15 files
                </span>
              </div>
              
              {recentItems.length === 0 ? (
                <div className="fm-empty-state">
                  <i className="ri-time-line"></i>
                  <p>No recent activity</p>
                </div>
              ) : (
                <>
                  <div className="fm-list-header">
                    <div className="fm-header-icon"></div>
                    <div className="fm-header-name">Name</div>
                    <div className="fm-header-date fm-hide-mobile">Date</div>
                    <div className="fm-header-owner fm-hide-mobile">Owner</div>
                    <div className="fm-header-size fm-hide-mobile">Size</div>
                    <div className="fm-header-shared fm-hide-mobile">Shared</div>
                    <div className="fm-header-actions"></div>
                  </div>
                  
                  <div className="fm-files-grid">
                    {recentItems.map((recentItem, index) => {
                      // Find the actual file from all folders
                      let file = null;
                      Object.values(fileSystem.folders).forEach(folder => {
                        if (folder.files) {
                          const found = folder.files.find(f => f.id === recentItem.fileId);
                          if (found) file = found;
                        }
                        if (!file && folder.folders) {
                          const foundFolder = folder.folders.find(f => f.id === recentItem.fileId);
                          if (foundFolder) file = foundFolder;
                        }
                      });
                      
                      // If file not found, use recent item data
                      if (!file) {
                        file = {
                          id: recentItem.fileId,
                          name: recentItem.name || 'Unknown File',
                          type: 'pdf', // default type
                          size: '2.1 MB',
                          modified: recentItem.time ? recentItem.time.split(' ')[0] : 'Unknown',
                          owner: 'Me',
                          sharedWith: 0
                        };
                      }
                      
                      return (
                        <div 
                          key={`${recentItem.fileId}-${index}`} 
                          className="fm-row"
                          onClick={() => handleFileClick(file)}
                          onContextMenu={(e) => showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file')}>
                          
                          <div>
                            <i className={getFileIcon(file.type)} style={{
                              color: file.type === 'folder' ? '#f59e0b' : getFileColor(file.type),
                              fontSize: '18px'
                            }}></i>
                          </div>
                          
                          <div className="fm-file-name">
                            <span>{file.name}</span>
                            <div className="fm-recent-badge">
                              <i className={`ri-${recentItem.action === 'opened' ? 'eye' : recentItem.action === 'uploaded' ? 'upload' : 'add'}-line`}></i>
                              {recentItem.action} • {recentItem.time}
                            </div>
                          </div>
                          
                          <div className="fm-hide-mobile">{recentItem.time ? recentItem.time.split(' ')[0] : 'Unknown'}</div>
                          <div className="fm-hide-mobile">{file.owner || 'Unknown'}</div>
                          <div className="fm-hide-mobile">{file.size || 'Unknown'}</div>
                          <div className="fm-hide-mobile">
                            {file.sharedWith ? `${file.sharedWith} people` : 'Private'}
                          </div>
                          
                          <div>
                            <div 
                              className="fm-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                              }}>
                              <i className="ri-more-2-line"></i>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {currentSection === 'section-starred' && (
            <section className="fm-section">
              <div className="fm-section-head">
                <h3 style={{margin:0}}>Starred</h3>
                <span className="fm-pill">
                  <i className="ri-star-line"></i> Favorites
                </span>
              </div>
              {searchTerm && (
                <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px'}}>
                  <span style={{fontSize: '14px', color: '#1e40af'}}>
                    <i className="ri-search-line" style={{marginRight: '6px'}}></i>
                    Showing results for "{searchTerm}"
                  </span>
                </div>
              )}
              {searchTerm && (
                <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px'}}>
                  <span style={{fontSize: '14px', color: '#1e40af'}}>
                    <i className="ri-search-line" style={{marginRight: '6px'}}></i>
                    Showing starred results for "{searchTerm}"
                  </span>
                </div>
              )}
              <div className="fm-collection">
                <div className="fm-grid">
                  {filterFiles(getStarredFiles()).map(file => (
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
                        <div className="fm-action-btn" onClick={(e) => {
                          e.stopPropagation();
                          openShareModal([file.id]);
                        }}>
                          <i className="ri-share-line"></i>
                        </div>
                        <div 
                          className="fm-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            showContextMenu(e, file, file.type === 'folder' ? 'folder' : 'file');
                          }}>
                          <i className="ri-more-2-line"></i>
                        </div>
                      </div>

                      <div className="fm-thumb">
                        <i className={getFileIcon(file.type)} style={{color: file.type === 'folder' ? '#f59e0b' : getFileColor(file.type)}}></i>
                        <i className="ri-star-fill" style={{position: 'absolute', top: '8px', right: '8px', color: '#fbbf24', fontSize: '12px'}}></i>
                      </div>
                      <div className="fm-title">{file.name}</div>
                      <div className="fm-meta">{file.size} • {file.modified}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {currentSection === 'section-trash' && (
            <section className="fm-section">
              <div className="fm-section-head">
                <h3 style={{margin:0}}>Trash</h3>
                <button 
                  className="fm-btn" 
                  style={{color:'#9b1c1c', borderColor:'#ffd2d2', background:'#fff5f5'}}
                  onClick={() => {
                    setTrashedItems([]);
                    showNotification('info', 'Trash Emptied', 'All items permanently deleted');
                  }}
                >
                  <i className="ri-delete-bin-5-line"></i> Empty trash
                </button>
              </div>
              {trashedItems.length === 0 ? (
                <div className="fm-empty">Trash is empty.</div>
              ) : (
                <div className="fm-collection">
                  <div className="fm-grid">
                    {trashedItems.map(item => (
                      <div key={item.id} className="fm-card" style={{opacity: 0.7}}>
                        <div className="fm-thumb">
                          <i className={getFileIcon(item.type)} style={{color: '#9b1c1c'}}></i>
                        </div>
                        <div className="fm-title">{item.name}</div>
                        <div className="fm-meta">Deleted: {item.deletedDate}</div>
                        <div className="fm-meta">From: {item.originalPath}</div>
                        <div className="fm-card-actions">
                          <button 
                            className="fm-btn" 
                            onClick={() => {
                              // Restore functionality
                              showNotification('success', 'Restored', `${item.name} restored`);
                              setTrashedItems(prev => prev.filter(t => t.id !== item.id));
                            }}
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {currentFile.type === 'pdf' && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-file-pdf-line" style={{fontSize: '64px', color: '#b42318', marginBottom: '16px'}}></i>
                      <h4>PDF Document Viewer</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        {currentFile.content}
                      </p>
                      <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'left', marginTop: '16px'}}>
                        <h5>Document Preview:</h5>
                        <p style={{fontFamily: 'serif', lineHeight: '1.6', color: '#374151'}}>
                          This would show the actual PDF content. In a real application, you would use a PDF viewer 
                          component like react-pdf or pdf.js to render the PDF content here. The document contains 
                          detailed information about the project proposal including objectives, timeline, budget, 
                          and implementation strategy.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentFile.type === 'doc' && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}>
                      <i className="ri-file-word-line" style={{fontSize: '64px', color: '#2563eb', marginBottom: '16px'}}></i>
                      <h4>Document Viewer</h4>
                      <p style={{color: '#6b7280', marginBottom: '16px'}}>
                        {currentFile.content}
                      </p>
                      <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'left', marginTop: '16px'}}>
                        <h5>Document Content:</h5>
                        <div style={{fontFamily: 'system-ui', lineHeight: '1.6', color: '#374151'}}>
                          <p><strong>Title:</strong> {currentFile.name.replace(/\.[^/.]+$/, "")}</p>
                          <p><strong>Content Preview:</strong></p>
                          <p>This document contains important information and would be rendered using an appropriate 
                          document viewer. In a real application, you could use components like react-docx-preview 
                          or convert the document to HTML for display.</p>
                        </div>
                      </div>
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
                <button className="fm-btn fm-primary" onClick={() => {
                  closeFileModal();
                  openShareModal([currentFile.id]);
                }}>
                  <i className="ri-share-line"></i> Share
                </button>
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
                  {(mockVersionHistory[currentFile.id] || versionHistory[currentFile.id] || []).map((version, index) => (
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
                      {index !== 0 && (
                        <div style={{marginTop: '8px', display: 'flex', gap: '8px'}}>
                          <button style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}>
                            Restore
                          </button>
                          <button style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}>
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!mockVersionHistory[currentFile.id] && !versionHistory[currentFile.id]) && (
                    <div style={{textAlign: 'center', padding: '32px', color: '#6b7280'}}>
                      <i className="ri-history-line" style={{fontSize: '48px', marginBottom: '16px'}}></i>
                      <p>No version history available</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="fm-modal-footer">
                <button className="fm-btn" onClick={() => setIsVersionModalOpen(false)}>Close</button>
                <button className="fm-btn fm-primary" onClick={() => handleUpdateFile(currentFile)}>
                  <i className="ri-upload-line"></i> Upload New Version
                </button>
              </div>
            </div>
          </div>
        )}      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fm-modal fm-share-modal fm-open">
          <div className="fm-modal-content">
            <div className="fm-modal-header">
              <h3>Share on Blockchain</h3>
              <button className="fm-close-btn" onClick={closeShareModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="fm-modal-body">
              <div className="fm-blockchain-info">
                <h5><i className="ri-links-line"></i> Blockchain Document Sharing</h5>
                <p>Share documents securely on the blockchain with immutable access records and smart contract permissions.</p>
              </div>

              <div className="fm-share-section">
                <h4><i className="ri-team-line"></i> Select Recipients</h4>
                <div className="fm-user-list">
                  {mockUsers.map(user => (
                    <div key={user.id} className="fm-user-item">
                      <div className="fm-user-avatar">{user.avatar}</div>
                      <div className="fm-user-info">
                        <div className="fm-user-name">{user.name}</div>
                        <div className="fm-user-details">
                          <span className={`fm-status-indicator ${user.online ? '' : 'offline'}`}></span>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="fm-modal-footer">
              <button className="fm-btn" onClick={closeShareModal}>Cancel</button>
              <button className="fm-btn fm-primary">
                <i className="ri-send-plane-line"></i> Share on Blockchain
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
                    <i className="ri-file-copy-line"></i> Make a copy
                  </div>
                  <div {...getContextMenuItemProps('move')}>
                    <i className="ri-arrow-up-down-line"></i> Move
                  </div>
                  <div {...getContextMenuItemProps('rename')}>
                    <i className="ri-edit-line"></i> Rename
                  </div>
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('delete', true)}>
                    <i className="ri-delete-bin-line"></i> Delete
                  </div>
                </>
              ) : (
                // File Context Menu
                <>
                  <div {...getContextMenuItemProps('details')}>
                    <i className="ri-eye-line"></i> View details
                  </div>
                  <div {...getContextMenuItemProps('download')}>
                    <i className="ri-download-line"></i> Download
                  </div>
                  <div {...getContextMenuItemProps('share')}>
                    <i className="ri-share-line"></i> Share on Blockchain
                  </div>
                  <div {...getContextMenuItemProps('copy')}>
                    <i className="ri-file-copy-line"></i> Make a copy
                  </div>
                  <div {...getContextMenuItemProps('move')}>
                    <i className="ri-arrow-up-down-line"></i> Move
                  </div>
                  <div {...getContextMenuItemProps('rename')}>
                    <i className="ri-edit-line"></i> Rename
                  </div>
                  <div {...getContextMenuItemProps('star')}>
                    <i className="ri-star-line"></i> {starredItems.includes(contextMenu.item?.id) ? 'Remove star' : 'Add star'}
                  </div>
                  <div {...getContextMenuItemProps('version')}>
                    <i className="ri-history-line"></i> Version history
                  </div>
                  <div {...getContextMenuItemProps('update')}>
                    <i className="ri-refresh-line"></i> Update file
                  </div>
                  <hr style={{margin: '6px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                  <div {...getContextMenuItemProps('delete', true)}>
                    <i className="ri-delete-bin-line"></i> Move to trash
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

        {/* Hidden file input */}
        <input 
          type="file" 
          id="hiddenFileInput" 
          multiple 
          onChange={handleFileUpload}
          style={{display:'none'}} 
        />
      </div>
    </div>
  );
};

export default FileManager;