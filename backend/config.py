import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file at import time
load_dotenv()

# Check if running in production (gevent mode)
is_production = os.getenv('FLASK_ENV') == 'production'

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:mk0492@localhost:5432/Docu-Chain')
    
    # Connection Pool Settings
    # Production: Use QueuePool with proper sizing for 50+ concurrent users
    # Each user may need 1-3 connections at peak
    if is_production:
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_size': 20,  # Base pool size (increased from NullPool)
            'max_overflow': 30,  # Allow up to 50 total connections (20 + 30)
            'pool_recycle': 300,  # Recycle connections every 5 minutes
            'pool_pre_ping': True,  # Verify connections before use
            'pool_timeout': 30,  # Wait 30s for connection
            'echo': False,  # Disable SQL logging in production
        }
    else:
        # Standard pool for development
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_size': 10,
            'pool_recycle': 300,
            'pool_pre_ping': True,
            'max_overflow': 20,
            'pool_timeout': 30,
        }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS - Get from environment or use defaults for development
    _cors_env = os.getenv('CORS_ORIGINS', '')
    CORS_ORIGINS = _cors_env.split(',') if _cors_env else ['http://localhost:3000', 'http://localhost:5173']
    
    # Frontend URL (for verification links, QR codes, etc.)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # File Upload
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_FILE_SIZE', 52428800))  # 50MB default
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads/')
    ALLOWED_EXTENSIONS = os.getenv('ALLOWED_EXTENSIONS', 'pdf,doc,docx,txt,jpg,jpeg,png,xls,xlsx').split(',')
    
    # IPFS/Pinata
    PINATA_API_KEY = os.getenv('PINATA_API_KEY')
    PINATA_SECRET_KEY = os.getenv('PINATA_SECRET_KEY')
    PINATA_JWT = os.getenv('PINATA_JWT')
    PINATA_GATEWAY = os.getenv('PINATA_GATEWAY', 'https://gateway.pinata.cloud/ipfs/')
    
    # Blockchain
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
    SEPOLIA_RPC_URL = os.getenv('SEPOLIA_RPC_URL')
    CHAIN_ID = int(os.getenv('CHAIN_ID', 11155111))
    
    # Email
    EMAILJS_SERVICE_ID = os.getenv('EMAILJS_SERVICE_ID')
    EMAILJS_TEMPLATE_ID = os.getenv('EMAILJS_TEMPLATE_ID')
    EMAILJS_PUBLIC_KEY = os.getenv('EMAILJS_PUBLIC_KEY')
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    
    # Other
    TRASH_RETENTION_DAYS = int(os.getenv('TRASH_RETENTION_DAYS', 30))
    
    # Performance & Caching
    CACHE_TYPE = 'simple'  # Use 'redis' in production with Redis server
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes default cache
    
    # Compression
    COMPRESS_MIMETYPES = ['text/html', 'text/css', 'application/json', 'application/javascript']
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 500

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_docuchain.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
