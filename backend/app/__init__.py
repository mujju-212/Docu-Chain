from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from config import config
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Setup CORS - Allow all origins during development
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins during development
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True
        }
    })
    
    # Initialize SocketIO with polling support (more reliable for development)
    socketio.init_app(
        app, 
        cors_allowed_origins="*", 
        async_mode='threading',
        ping_timeout=60,
        ping_interval=25,
        logger=False,
        engineio_logger=False
    )
    
    # Import WebSocket events (must be after socketio init)
    from app import websocket_events
    
    # Global OPTIONS handler - handle ALL preflight requests BEFORE any other processing
    @app.before_request
    def handle_preflight():
        from flask import request, make_response
        if request.method == 'OPTIONS':
            response = make_response('', 200)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, document, institution, folder, recent_activity, approval, document_template, chat
    
    # Register blueprints
    from app.routes import auth, documents, users, approvals, chat, circulars, institutions, folders, shares, recent, document_generation
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(documents.bp, url_prefix='/api/documents')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(approvals.bp, url_prefix='/api/approvals')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    app.register_blueprint(circulars.bp, url_prefix='/api/circulars')
    app.register_blueprint(institutions.bp, url_prefix='/api/institutions')
    app.register_blueprint(folders.bp, url_prefix='/api/folders')
    app.register_blueprint(shares.bp)  # /api/shares prefix already in blueprint
    app.register_blueprint(recent.bp)  # /api/recent prefix already in blueprint
    app.register_blueprint(document_generation.bp, url_prefix='/api/document-generation')
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'DocuChain API is running'}, 200
    
    # Simple test endpoint for CORS testing
    @app.route('/api/test', methods=['GET', 'OPTIONS'])
    def test_cors():
        return {'message': 'CORS test successful', 'timestamp': 'now'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'success': False, 'message': 'Internal server error'}, 500
    
    return app
