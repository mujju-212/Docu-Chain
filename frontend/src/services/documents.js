import api from './api'

export const documentService = {
  // Upload document to IPFS
  uploadToIPFS: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/documents/upload-ipfs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      },
    })
    return response.data
  },

  // Store document metadata in blockchain
  storeDocument: async (documentData) => {
    const response = await api.post('/documents/store', documentData)
    return response.data
  },

  // Get user's documents
  getMyDocuments: async (filters = {}) => {
    const response = await api.get('/documents/my-documents', { params: filters })
    return response.data
  },

  // Get shared documents
  getSharedDocuments: async (filters = {}) => {
    const response = await api.get('/documents/shared', { params: filters })
    return response.data
  },

  // Get document by ID
  getDocumentById: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`)
    return response.data
  },

  // Share document
  shareDocument: async (shareData) => {
    const response = await api.post('/documents/share', shareData)
    return response.data
  },

  // Update document permissions
  updatePermissions: async (documentId, permissions) => {
    const response = await api.put(`/documents/${documentId}/permissions`, permissions)
    return response.data
  },

  // Delete document (soft delete)
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`)
    return response.data
  },

  // Move to trash
  moveToTrash: async (documentId) => {
    const response = await api.post(`/documents/${documentId}/trash`)
    return response.data
  },

  // Restore from trash
  restoreFromTrash: async (documentId) => {
    const response = await api.post(`/documents/${documentId}/restore`)
    return response.data
  },

  // Permanent delete
  permanentDelete: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}/permanent`)
    return response.data
  },

  // Get document versions
  getVersions: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/versions`)
    return response.data
  },

  // Download document
  downloadDocument: async (ipfsHash, fileName) => {
    const response = await api.get(`/documents/download/${ipfsHash}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
    return response.data
  },

  // Search documents
  searchDocuments: async (query) => {
    const response = await api.get('/documents/search', { params: { q: query } })
    return response.data
  },

  // Get document statistics
  getStatistics: async () => {
    const response = await api.get('/documents/statistics')
    return response.data
  },
}

export default documentService
