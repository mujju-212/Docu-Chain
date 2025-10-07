from flask import Blueprint, request, jsonify
from app import db
from app.models.institution import Institution
from sqlalchemy import text

bp = Blueprint('institutions', __name__)

@bp.route('/list', methods=['GET', 'OPTIONS'])
def list_institutions():
    """Get all available institutions for dropdown selection"""
    try:
        institutions = Institution.query.order_by(Institution.name).all()
        
        institution_list = [{
            'id': str(institution.id),
            'name': institution.name,
            'unique_id': institution.unique_id,
            'type': institution.type
        } for institution in institutions]
        
        return jsonify({
            'success': True,
            'institutions': institution_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/<institution_id>/departments', methods=['GET', 'OPTIONS'])
def get_institution_departments(institution_id):
    """Get departments for a specific institution"""
    try:
        # Get departments for this institution
        departments_query = text("""
            SELECT id, name 
            FROM departments 
            WHERE institution_id = :institution_id 
            ORDER BY name
        """)
        
        result = db.session.execute(departments_query, {'institution_id': institution_id})
        departments = [{'id': str(row.id), 'name': row.name} for row in result]
        
        return jsonify({
            'success': True,
            'departments': departments
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/validate', methods=['POST'])
def validate_institution():
    """Validate institution and return its departments"""
    try:
        data = request.get_json()
        name = data.get('name')
        unique_id = data.get('uniqueId')
        
        if not name or not unique_id:
            return jsonify({'success': False, 'message': 'Name and unique ID are required'}), 400
        
        # Find institution
        institution = Institution.query.filter_by(name=name, unique_id=unique_id).first()
        
        if not institution:
            return jsonify({'success': False, 'message': 'Institution not found'}), 404
        
        # Get departments for this institution
        departments_query = text("""
            SELECT id, name 
            FROM departments 
            WHERE institution_id = :institution_id 
            ORDER BY name
        """)
        
        result = db.session.execute(departments_query, {'institution_id': str(institution.id)})
        departments = [{'id': str(row.id), 'name': row.name} for row in result]
        
        return jsonify({
            'success': True,
            'institution': {
                'id': str(institution.id),
                'name': institution.name,
                'unique_id': institution.unique_id
            },
            'departments': departments
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/departments/<department_id>/sections', methods=['GET', 'OPTIONS'])
def get_sections(department_id):
    """Get sections for a specific department"""
    try:
        # Get sections for this department
        sections_query = text("""
            SELECT id, name 
            FROM sections 
            WHERE department_id = :department_id 
            ORDER BY name
        """)
        
        result = db.session.execute(sections_query, {'department_id': department_id})
        sections = [{'id': str(row.id), 'name': row.name} for row in result]
        
        return jsonify({
            'success': True,
            'sections': sections
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/create-with-admin', methods=['POST'])
def create_institution_with_admin():
    """Create a new institution along with its primary admin account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'institutionName', 'institutionType', 'institutionUniqueId', 
            'institutionAddress', 'institutionEmail', 'institutionPhone',
            'adminFirstName', 'adminLastName', 'adminId', 
            'adminEmail', 'adminPhone', 'adminPassword'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False, 
                    'message': f'{field} is required'
                }), 400
        
        # Check if institution unique ID already exists
        existing_institution = Institution.query.filter_by(
            unique_id=data['institutionUniqueId']
        ).first()
        
        if existing_institution:
            return jsonify({
                'success': False, 
                'message': 'Institution with this unique ID already exists'
            }), 400
        
        # Check if institution email already exists  
        existing_email = Institution.query.filter_by(
            email=data['institutionEmail']
        ).first()
        
        if existing_email:
            return jsonify({
                'success': False,
                'message': 'Institution with this email already exists'
            }), 400
        
        # Import User model here to avoid circular imports
        from app.models.user import User
        from werkzeug.security import generate_password_hash
        
        # Check if admin email already exists in users
        existing_admin = User.query.filter_by(email=data['adminEmail']).first()
        if existing_admin:
            return jsonify({
                'success': False,
                'message': 'Admin email already exists'
            }), 400
        
        # Create institution
        new_institution = Institution(
            name=data['institutionName'],
            type=data['institutionType'],
            unique_id=data['institutionUniqueId'],
            address=data['institutionAddress'],
            email=data['institutionEmail'],
            phone=data.get('institutionCountryCode', '+91') + data['institutionPhone'],
            website=data.get('institutionWebsite', ''),
            status='pending'  # Institution needs approval
        )
        
        # Add and flush to get the ID
        db.session.add(new_institution)
        db.session.flush()
        
        # Create admin user for this institution
        admin_user = User(
            email=data['adminEmail'],
            password_hash=generate_password_hash(data['adminPassword']),
            first_name=data['adminFirstName'],
            last_name=data['adminLastName'],
            role='admin',
            unique_id=data['adminId'],
            phone=data.get('adminCountryCode', '+91') + data['adminPhone'],
            institution_id=str(new_institution.id),
            is_approved=False  # Admin needs approval
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Institution and admin account created successfully. Awaiting approval.',
            'institution_id': str(new_institution.id),
            'admin_id': str(admin_user.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating institution and admin: {str(e)}")
        return jsonify({
            'success': False, 
            'message': 'Failed to create institution and admin account. Please try again.'
        }), 500
