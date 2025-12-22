# Gunicorn Configuration for 50+ Concurrent Users
# Optimized for Azure App Service B1 (1 vCPU, 1.75GB RAM)

import multiprocessing
import os

# Try to use eventlet if available, otherwise fall back to gevent or sync
try:
    import eventlet
    eventlet.monkey_patch()
    worker_class = "eventlet"
    print("Using eventlet worker class")
except ImportError:
    try:
        import gevent
        from gevent import monkey
        monkey.patch_all()
        worker_class = "gevent"
        print("Eventlet not available, using gevent worker class")
    except ImportError:
        worker_class = "sync"
        print("Neither eventlet nor gevent available, using sync worker class")

# Bind to Azure's expected port
bind = "0.0.0.0:8000"

# Workers: For B1 with 1 vCPU, use 2-4 workers
# Formula: (2 x CPU cores) + 1, but limited by RAM
workers = 3

# Threads per worker (for non-eventlet, but eventlet uses greenlets)
# threads = 2

# Max requests per worker before restart (prevents memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Timeout settings
timeout = 120           # Worker timeout (2 minutes for long operations)
graceful_timeout = 30   # Time for graceful shutdown
keepalive = 5           # Keep-alive connections

# Logging
accesslog = "-"         # Log to stdout for Azure monitoring
errorlog = "-"
loglevel = "info"

# Performance tuning
worker_connections = 1000  # Max simultaneous clients per worker

# Preload app for faster worker spawning
preload_app = True

# Security
limit_request_line = 4094
limit_request_fields = 100

def on_starting(server):
    """Log when Gunicorn starts"""
    print("DocuChain API starting with Gunicorn...")
    print(f"Workers: {workers}, Worker class: {worker_class}")
    print(f"Environment: {'Azure' if os.getenv('WEBSITE_SITE_NAME') else 'Local'}")

def worker_exit(server, worker):
    """Clean up on worker exit"""
    print(f"Worker {worker.pid} exiting...")
