import React, { useState, useEffect } from 'react';
import './FileManagerNew.css';

const FileManager = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple API call to get folders
    const fetchFolders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/folders/');
        const data = await response.json();
        console.log('Folders from API:', data);
        setFolders(data.folders || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  if (loading) {
    return (
      <div className="file-manager">
        <div className="loading-state">
          <i className="ri-loader-4-line"></i>
          <span>Loading file manager...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <div className="header-left">
          <h2>File Manager</h2>
          <p>Manage your documents and folders</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => alert('Folder creation will be implemented')}>
            <i className="ri-add-line"></i>
            Create Folder
          </button>
        </div>
      </div>

      <div className="file-manager-content">
        <div className="files-grid">
          {folders.length > 0 ? (
            folders.map(folder => (
              <div key={folder.id} className="file-item folder-item" style={{cursor: 'pointer'}}>
                <div className="file-icon">
                  <i className="ri-folder-line"></i>
                </div>
                <div className="file-info">
                  <div className="file-name">{folder.name}</div>
                  <div className="file-details">
                    <span className="file-date">
                      {new Date(folder.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="ri-folder-line"></i>
              </div>
              <h3>No folders found</h3>
              <p>Create your first folder to get started</p>
              <button className="btn btn-primary" onClick={() => alert('Create folder functionality coming soon')}>
                <i className="ri-add-line"></i>
                Create Folder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;