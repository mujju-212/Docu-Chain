# Simple working documents route - no imports that could fail
from flask import Blueprint, jsonify

bp = Blueprint('documents', __name__)

@bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify documents blueprint works"""
    return jsonify({
        'success': True,
        'message': 'Documents API is working',
        'status': 'basic_version'
    })

@bp.route('/health', methods=['GET'])
def documents_health():
    """Health check for documents service"""
    return jsonify({
        'success': True,
        'service': 'documents',
        'status': 'healthy'
    })