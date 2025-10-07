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
    
    # Setup CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True
        }
    })
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, document, institution
    
    # Register blueprints
    from app.routes import auth, documents, users, approvals, chat, circulars, institutions
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(documents.bp, url_prefix='/api/documents')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(approvals.bp, url_prefix='/api/approvals')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    app.register_blueprint(circulars.bp, url_prefix='/api/circulars')
    app.register_blueprint(institutions.bp, url_prefix='/api/institutions')
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'DocuChain API is running'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'success': False, 'message': 'Internal server error'}, 500
    
    return app
