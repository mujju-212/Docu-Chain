"""
Performance optimizations for high concurrency (50+ users)
- Response caching
- Query optimization
- Compression
"""

from flask import request, jsonify
from functools import wraps
from flask_compress import Compress
import hashlib
import json
from datetime import datetime, timedelta

# Simple in-memory cache (use Redis in production for multi-server)
cache_store = {}
cache_timestamps = {}

def cache_response(timeout=300):
    """
    Cache decorator for API responses
    timeout: cache duration in seconds (default 5 minutes)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Create cache key from route + query params + user
            from flask_jwt_extended import get_jwt_identity
            try:
                user_id = get_jwt_identity()
            except:
                user_id = 'anonymous'
            
            cache_key = f"{f.__name__}:{user_id}:{request.full_path}"
            cache_key_hash = hashlib.md5(cache_key.encode()).hexdigest()
            
            # Check if cached and not expired
            if cache_key_hash in cache_store:
                timestamp = cache_timestamps.get(cache_key_hash)
                if timestamp and datetime.now() < timestamp:
                    return cache_store[cache_key_hash]
            
            # Call function and cache result
            result = f(*args, **kwargs)
            cache_store[cache_key_hash] = result
            cache_timestamps[cache_key_hash] = datetime.now() + timedelta(seconds=timeout)
            
            # Clean old cache entries (simple cleanup)
            if len(cache_store) > 1000:
                cleanup_cache()
            
            return result
        return decorated_function
    return decorator


def cleanup_cache():
    """Remove expired cache entries"""
    now = datetime.now()
    expired_keys = [k for k, v in cache_timestamps.items() if v < now]
    for key in expired_keys:
        cache_store.pop(key, None)
        cache_timestamps.pop(key, None)


def invalidate_cache(pattern=None):
    """Invalidate cache entries matching pattern"""
    if pattern:
        keys_to_remove = [k for k in cache_store.keys() if pattern in k]
        for key in keys_to_remove:
            cache_store.pop(key, None)
            cache_timestamps.pop(key, None)
    else:
        cache_store.clear()
        cache_timestamps.clear()


def setup_compression(app):
    """Setup gzip compression for responses"""
    compress = Compress()
    compress.init_app(app)
    
    # Compress responses larger than 500 bytes
    app.config['COMPRESS_MIMETYPES'] = [
        'text/html',
        'text/css',
        'text/xml',
        'application/json',
        'application/javascript',
        'text/javascript'
    ]
    app.config['COMPRESS_LEVEL'] = 6  # Balanced compression
    app.config['COMPRESS_MIN_SIZE'] = 500  # Only compress responses > 500 bytes
    
    return compress


def optimize_query_joins(query, relationships):
    """
    Optimize query with eager loading to prevent N+1 problems
    relationships: list of relationship names to joinedload
    """
    from sqlalchemy.orm import joinedload
    for rel in relationships:
        query = query.options(joinedload(rel))
    return query
