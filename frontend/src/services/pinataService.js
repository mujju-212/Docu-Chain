import axios from 'axios';

class PinataService {
    constructor() {
        console.log('🚀 PinataService constructor called');
        console.log('🔍 process.env check:', typeof process, typeof process.env);
        console.log('🔍 All REACT_APP env vars:', Object.keys(process.env || {}).filter(key => key.startsWith('REACT_APP_')));
        
        // Use process.env for Create React App (not import.meta.env which is for Vite)
        this.apiKey = process.env.REACT_APP_PINATA_API_KEY;
        this.secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;
        this.jwtToken = process.env.REACT_APP_PINATA_JWT;
        this.gateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        
        console.log('🔑 Raw values:');
        console.log('  - API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'UNDEFINED');
        console.log('  - Secret Key:', this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'UNDEFINED');
        console.log('  - JWT Token:', this.jwtToken ? `${this.jwtToken.substring(0, 30)}...` : 'UNDEFINED');
        
        console.log('🔑 Pinata API Key configured:', this.apiKey ? 'YES' : 'NO');
        console.log('🔑 Pinata Secret Key configured:', this.secretKey ? 'YES' : 'NO');
        console.log('🔑 Pinata JWT Token configured:', this.jwtToken ? 'YES' : 'NO');
        
        if (!this.jwtToken && (!this.apiKey || !this.secretKey)) {
            console.error('⚠️ NO PINATA CREDENTIALS FOUND!');
            console.error('⚠️ Environment variables missing. Please restart the development server.');
        }
    }

    // Method to reinitialize credentials if they weren't loaded initially
    reinitialize() {
        console.log('🔄 Reinitializing Pinata credentials...');
        this.apiKey = process.env.REACT_APP_PINATA_API_KEY;
        this.secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;
        this.jwtToken = process.env.REACT_APP_PINATA_JWT;
        
        console.log('🔑 After reinit - API Key:', this.apiKey ? 'YES' : 'NO');
        console.log('🔑 After reinit - JWT Token:', this.jwtToken ? 'YES' : 'NO');
        
        return this.jwtToken || (this.apiKey && this.secretKey);
    }

    // Debug method to check credentials
    debugCredentials() {
        console.log('🔍 PINATA CREDENTIALS DEBUG:');
        console.log('================================');
        console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
        console.log('Secret Key:', this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'NOT SET');
        console.log('JWT Token:', this.jwtToken ? `${this.jwtToken.substring(0, 30)}...` : 'NOT SET');
        console.log('Gateway:', this.gateway);
        console.log('================================');
        console.log('Environment Variables:');
        console.log('REACT_APP_PINATA_API_KEY:', process.env.REACT_APP_PINATA_API_KEY ? 'SET' : 'NOT SET');
        console.log('REACT_APP_PINATA_SECRET_KEY:', process.env.REACT_APP_PINATA_SECRET_KEY ? 'SET' : 'NOT SET');
        console.log('REACT_APP_PINATA_JWT:', process.env.REACT_APP_PINATA_JWT ? 'SET' : 'NOT SET');
        console.log('================================');
        return {
            hasApiKey: !!this.apiKey,
            hasSecretKey: !!this.secretKey,
            hasJwtToken: !!this.jwtToken,
            hasAnyCredentials: !!(this.jwtToken || (this.apiKey && this.secretKey))
        };
    }

    async uploadFile(file, metadata = {}) {
        try {
            console.log('📋 Original metadata received:', metadata);
            console.log('📋 Metadata types:', Object.entries(metadata).map(([k, v]) => `${k}: ${typeof v} ${Array.isArray(v) ? '(array)' : ''}`));
            
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
                        console.log(`📋 Converted array ${key}: ${value} → ${sanitizedKeyValues[key]}`);
                    } else if (typeof value === 'object') {
                        // Convert objects to JSON strings
                        sanitizedKeyValues[key] = JSON.stringify(value);
                        console.log(`📋 Converted object ${key}: ${typeof value} → ${sanitizedKeyValues[key]}`);
                    } else {
                        // Convert other types to strings
                        sanitizedKeyValues[key] = String(value);
                        console.log(`📋 Converted ${key}: ${typeof value} ${value} → ${sanitizedKeyValues[key]}`);
                    }
                }
            });
            
            console.log('📋 Final sanitized keyvalues:', sanitizedKeyValues);
            
            const pinataMetadata = JSON.stringify({
                name: metadata.name || file.name,
                keyvalues: sanitizedKeyValues
            });
            
            console.log('📋 Final pinataMetadata:', pinataMetadata);
            
            formData.append('pinataMetadata', pinataMetadata);
            
            const pinataOptions = JSON.stringify({
                cidVersion: 0
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
                console.log('🔄 No credentials found, attempting to reinitialize...');
                const hasCredentials = this.reinitialize();
                
                if (this.jwtToken) {
                    headers['Authorization'] = `Bearer ${this.jwtToken}`;
                } else if (this.apiKey && this.secretKey) {
                    headers['pinata_api_key'] = this.apiKey;
                    headers['pinata_secret_api_key'] = this.secretKey;
                } else {
                    throw new Error('No valid Pinata authentication credentials found. Please restart the development server.');
                }
            }

            console.log('📤 Uploading to Pinata with headers:', Object.keys(headers));

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
            console.error('Error uploading to Pinata:', error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Request config:', error.config);
            
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
            console.error('Error uploading JSON to Pinata:', error);
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
            console.error('Error retrieving from IPFS:', error);
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
            console.error('Error getting pinned files:', error);
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
            console.error('Error unpinning file:', error);
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

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    window.pinataService = pinataServiceInstance;
}

export default pinataServiceInstance;