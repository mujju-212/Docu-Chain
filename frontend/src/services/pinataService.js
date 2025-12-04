import axios from 'axios';

class PinataService {
    constructor() {
        // Use process.env for Create React App
        this.apiKey = process.env.REACT_APP_PINATA_API_KEY;
        this.secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;
        this.jwtToken = process.env.REACT_APP_PINATA_JWT;
        this.gateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    }

    // Method to reinitialize credentials if they weren't loaded initially
    reinitialize() {
        this.apiKey = process.env.REACT_APP_PINATA_API_KEY;
        this.secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;
        this.jwtToken = process.env.REACT_APP_PINATA_JWT;
        
        return this.jwtToken || (this.apiKey && this.secretKey);
    }

    // Check if credentials are configured
    hasCredentials() {
        return !!(this.jwtToken || (this.apiKey && this.secretKey));
    }

    async uploadFile(file, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Convert all metadata values to strings or numbers for Pinata compatibility
            const sanitizedKeyValues = {
                fileName: file.name,
                fileSize: file.size.toString(),
                fileType: file.type || 'unknown',
                uploadedAt: new Date().toISOString()
            };
            
            // Process additional metadata, ensuring all values are strings or numbers
            Object.entries(metadata).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        // Convert arrays to comma-separated strings
                        sanitizedKeyValues[key] = value.join(',');
                    } else if (typeof value === 'object') {
                        // Convert objects to JSON strings
                        sanitizedKeyValues[key] = JSON.stringify(value);
                    } else {
                        // Convert other types to strings
                        sanitizedKeyValues[key] = String(value);
                    }
                }
            });
            
            const pinataMetadata = JSON.stringify({
                name: metadata.name || file.name,
                keyvalues: sanitizedKeyValues
            });
            
            formData.append('pinataMetadata', pinataMetadata);
            
            const pinataOptions = JSON.stringify({
                cidVersion: 1,
                wrapWithDirectory: false
            });
            
            formData.append('pinataOptions', pinataOptions);

            // Prepare headers with authentication (do NOT set Content-Type for FormData)
            const headers = {};

            // Use JWT Bearer token if available, otherwise fall back to API key headers
            if (this.jwtToken) {
                headers['Authorization'] = `Bearer ${this.jwtToken}`;
            } else if (this.apiKey && this.secretKey) {
                headers['pinata_api_key'] = this.apiKey;
                headers['pinata_secret_api_key'] = this.secretKey;
            } else {
                // Try to reinitialize credentials
                this.reinitialize();
                
                if (this.jwtToken) {
                    headers['Authorization'] = `Bearer ${this.jwtToken}`;
                } else if (this.apiKey && this.secretKey) {
                    headers['pinata_api_key'] = this.apiKey;
                    headers['pinata_secret_api_key'] = this.secretKey;
                } else {
                    throw new Error('No valid Pinata authentication credentials found. Please restart the development server.');
                }
            }

            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    maxBodyLength: 'Infinity',
                    headers
                }
            );

            return {
                success: true,
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
                url: `${this.gateway}${response.data.IpfsHash}`
            };
        } catch (error) {
            let errorMessage = 'Upload failed';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async uploadJSON(jsonObject, metadata = {}) {
        try {
            // Prepare headers with authentication
            const headers = {
                'Content-Type': 'application/json'
            };

            // Use JWT Bearer token if available, otherwise fall back to API key headers
            if (this.jwtToken) {
                headers['Authorization'] = `Bearer ${this.jwtToken}`;
            } else if (this.apiKey && this.secretKey) {
                headers['pinata_api_key'] = this.apiKey;
                headers['pinata_secret_api_key'] = this.secretKey;
            } else {
                throw new Error('No valid Pinata authentication credentials found');
            }

            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                {
                    pinataContent: jsonObject,
                    pinataMetadata: {
                        name: metadata.name || 'JSON Document',
                        keyvalues: {
                            type: 'json',
                            uploadedAt: new Date().toISOString(),
                            ...metadata
                        }
                    }
                },
                { headers }
            );

            return {
                success: true,
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
                url: `${this.gateway}${response.data.IpfsHash}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'JSON upload failed'
            };
        }
    }

    async getFileFromIPFS(ipfsHash) {
        try {
            const response = await axios.get(`${this.gateway}${ipfsHash}`, {
                timeout: 10000
            });
            return {
                success: true,
                data: response.data,
                url: `${this.gateway}${ipfsHash}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve file'
            };
        }
    }

    async getPinnedFiles() {
        try {
            const response = await axios.get(
                'https://api.pinata.cloud/data/pinList?status=pinned',
                {
                    headers: {
                        'pinata_api_key': this.apiKey,
                        'pinata_secret_api_key': this.secretKey
                    }
                }
            );

            return {
                success: true,
                files: response.data.rows
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to get pinned files'
            };
        }
    }

    async unpinFile(ipfsHash) {
        try {
            const response = await axios.delete(
                `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
                {
                    headers: {
                        'pinata_api_key': this.apiKey,
                        'pinata_secret_api_key': this.secretKey
                    }
                }
            );

            return {
                success: true,
                message: 'File unpinned successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to unpin file'
            };
        }
    }

    getFileUrl(ipfsHash) {
        return `${this.gateway}${ipfsHash}`;
    }

    validateFile(file, maxSize = 50 * 1024 * 1024) { // 50MB default
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        if (file.size > maxSize) {
            errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }

        // Check file type - expanded to include more image and video formats
        const allowedTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'image/webp',
            'image/bmp',
            'image/tiff',
            // Videos
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime', // .mov
            'video/x-msvideo', // .avi
            'video/x-ms-wmv',  // .wmv
            'video/x-flv',     // .flv
            'video/x-matroska' // .mkv
        ];

        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type "${file.type}" not supported. Supported: PDF, Word, Excel, PowerPoint, Images (JPEG, PNG, GIF, SVG, WebP, BMP), Videos (MP4, WebM, MOV, AVI, WMV)`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async testConnection() {
        try {
            // Prepare headers with authentication
            const headers = {};
            
            // Use JWT Bearer token if available, otherwise fall back to API key headers
            if (this.jwtToken) {
                headers['Authorization'] = `Bearer ${this.jwtToken}`;
            } else if (this.apiKey && this.secretKey) {
                headers['pinata_api_key'] = this.apiKey;
                headers['pinata_secret_api_key'] = this.secretKey;
            } else {
                throw new Error('No valid Pinata authentication credentials found');
            }

            const response = await axios.get(
                'https://api.pinata.cloud/data/testAuthentication',
                { headers }
            );

            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Authentication failed'
            };
        }
    }
}

const pinataServiceInstance = new PinataService();

export default pinataServiceInstance;