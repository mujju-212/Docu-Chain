# Gevent monkey-patching MUST be done before any other imports
import os
if os.getenv('FLASK_ENV') == 'production':
    from gevent import monkey
    monkey.patch_all()

from app import create_app, socketio, db
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create Flask app
app = create_app()

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Run the app with SocketIO (threading mode for development)
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG'],
        allow_unsafe_werkzeug=True  # Allow debug mode with SocketIO
    )
