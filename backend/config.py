import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:mk0492@localhost:5432/Docu-Chain')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173', 'http://localhost:8080']
    
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
