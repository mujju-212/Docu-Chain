"""
Health Check Routes for DocuChain
Monitors critical services including email connectivity
"""

from flask import Blueprint, jsonify
import socket
import requests
import os
from datetime import datetime

bp = Blueprint('health', __name__, url_prefix='/api/health')


def check_brevo_connectivity():
    """Check if Brevo API is accessible"""
    try:
        # DNS resolution check
        socket.gethostbyname('api.brevo.com')
        
        # Connection test
        response = requests.get(
            'https://api.brevo.com',
            timeout=10,
            headers={'User-Agent': 'DocuChain-Health-Check'}
        )
        
        return {
            'status': 'healthy' if response.status_code in [200, 404] else 'unhealthy',
            'response_code': response.status_code,
            'dns_resolved': True
        }
    except socket.gaierror:
        return {
            'status': 'unhealthy',
            'error': 'DNS resolution failed',
            'dns_resolved': False
        }
    except requests.exceptions.Timeout:
        return {
            'status': 'unhealthy',
            'error': 'Connection timeout',
            'dns_resolved': True
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'dns_resolved': None
        }


def check_smtp_connectivity():
    """Check SMTP fallback service"""
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    
    try:
        import smtplib
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.quit()
        return {'status': 'healthy', 'host': smtp_host, 'port': smtp_port}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e), 'host': smtp_host, 'port': smtp_port}


@bp.route('/', methods=['GET'])
def health_check():
    """Basic health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'DocuChain API'
    }), 200


@bp.route('/detailed', methods=['GET'])
def detailed_health_check():
    """Detailed health check including all services"""
    
    # Check database connection
    try:
        from app import db
        db.session.execute('SELECT 1')
        db_status = 'healthy'
        db_error = None
    except Exception as e:
        db_status = 'unhealthy'
        db_error = str(e)
    
    # Check email services
    brevo_status = check_brevo_connectivity()
    smtp_status = check_smtp_connectivity()
    
    # Overall status
    overall_healthy = (
        db_status == 'healthy' and 
        (brevo_status['status'] == 'healthy' or smtp_status['status'] == 'healthy')
    )
    
    return jsonify({
        'status': 'healthy' if overall_healthy else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': {
                'status': db_status,
                'error': db_error
            },
            'email_primary': {
                'provider': 'brevo',
                **brevo_status
            },
            'email_fallback': {
                'provider': 'smtp',
                **smtp_status
            }
        },
        'environment': {
            'azure_app_service': os.getenv('WEBSITE_SITE_NAME') is not None,
            'python_version': os.getenv('PYTHON_VERSION', 'unknown')
        }
    }), 200 if overall_healthy else 503


@bp.route('/email', methods=['GET'])
def email_health_check():
    """Specific email service health check"""
    brevo_status = check_brevo_connectivity()
    smtp_status = check_smtp_connectivity()
    
    # Determine which service is primary
    primary_healthy = brevo_status['status'] == 'healthy'
    fallback_available = smtp_status['status'] == 'healthy'
    
    return jsonify({
        'status': 'healthy' if (primary_healthy or fallback_available) else 'unhealthy',
        'primary_service': {
            'name': 'brevo',
            'status': brevo_status['status'],
            'available': primary_healthy,
            'details': brevo_status
        },
        'fallback_service': {
            'name': 'smtp',
            'status': smtp_status['status'],
            'available': fallback_available,
            'details': smtp_status
        },
        'recommendation': (
            'All email services operational' if primary_healthy and fallback_available
            else 'Primary service down, using fallback' if not primary_healthy and fallback_available
            else 'Fallback service down, using primary' if primary_healthy and not fallback_available
            else 'All email services down - critical issue'
        )
    }), 200