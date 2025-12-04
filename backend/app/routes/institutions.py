from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.institution import Institution
from app.models.user import User
from app.routes.auth import token_required
from sqlalchemy import text
from werkzeug.security import generate_password_hash

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
                'message': f"Institution with unique ID '{data['institutionUniqueId']}' already exists"
            }), 400
        
        # Check if institution email already exists  
        existing_email = Institution.query.filter_by(
            email=data['institutionEmail']
        ).first()
        
        if existing_email:
            return jsonify({
                'success': False,
                'message': f"Institution with email '{data['institutionEmail']}' already exists"
            }), 400
        
        # Import User model here to avoid circular imports
        from app.models.user import User
        from werkzeug.security import generate_password_hash
        
        # Check if admin email already exists in users
        existing_admin = User.query.filter_by(email=data['adminEmail']).first()
        if existing_admin:
            return jsonify({
                'success': False,
                'message': f"User with email '{data['adminEmail']}' already exists"
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
            status='approved'  # Auto-approve institution for now (can add system admin approval later)
        )
        
        # Add and flush to get the ID
        db.session.add(new_institution)
        db.session.flush()
        
        # Create admin user for this institution
        # The founding admin is auto-approved since they created the institution
        admin_user = User(
            email=data['adminEmail'],
            password_hash=generate_password_hash(data['adminPassword']),
            first_name=data['adminFirstName'],
            last_name=data['adminLastName'],
            role='admin',
            unique_id=data['adminId'],
            phone=data.get('adminCountryCode', '+91') + data['adminPhone'],
            institution_id=new_institution.id,
            status='active'  # Founding admin is auto-approved
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
        return jsonify({
            'success': False, 
            'message': 'Failed to create institution and admin account. Please try again.'
        }), 500


# ==========================================
# INSTITUTION MANAGEMENT ENDPOINTS (Admin)
# ==========================================

@bp.route('/details', methods=['GET', 'OPTIONS'])
@token_required
def get_institution_details():
    """Get details of the current user's institution"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if not current_user.institution_id:
            return jsonify({'success': False, 'error': 'No institution associated with user'}), 404
        
        institution = Institution.query.get(current_user.institution_id)
        if not institution:
            return jsonify({'success': False, 'error': 'Institution not found'}), 404
        
        return jsonify({
            'success': True,
            'institution': {
                'id': str(institution.id),
                'name': institution.name,
                'type': institution.type,
                'uniqueId': institution.unique_id,
                'address': institution.address or '',
                'website': institution.website or '',
                'email': institution.email or '',
                'phone': institution.phone or '',
                'status': institution.status or 'active'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/update', methods=['PUT', 'OPTIONS'])
@token_required
def update_institution():
    """Update institution details (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can update institution details'}), 403
        
        if not current_user.institution_id:
            return jsonify({'success': False, 'error': 'No institution associated with user'}), 404
        
        institution = Institution.query.get(current_user.institution_id)
        if not institution:
            return jsonify({'success': False, 'error': 'Institution not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            institution.name = data['name']
        if 'type' in data:
            institution.type = data['type']
        if 'address' in data:
            institution.address = data['address']
        if 'website' in data:
            institution.website = data['website']
        if 'email' in data:
            institution.email = data['email']
        if 'phone' in data:
            institution.phone = data['phone']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'institution': {
                'id': str(institution.id),
                'name': institution.name,
                'type': institution.type,
                'uniqueId': institution.unique_id,
                'address': institution.address or '',
                'website': institution.website or '',
                'email': institution.email or '',
                'phone': institution.phone or '',
                'status': institution.status or 'active'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/departments', methods=['GET', 'OPTIONS'])
@token_required
def get_departments_with_sections():
    """Get all departments with their sections for admin's institution"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if not current_user.institution_id:
            return jsonify({'success': False, 'error': 'No institution associated'}), 404
        
        # Get departments with HOD info
        departments_query = text("""
            SELECT d.id, d.name, d.head_of_department,
                   u.first_name as hod_first_name, u.last_name as hod_last_name
            FROM departments d
            LEFT JOIN users u ON d.head_of_department = u.id
            WHERE d.institution_id = :institution_id
            ORDER BY d.name
        """)
        
        dept_result = db.session.execute(departments_query, {'institution_id': current_user.institution_id})
        
        departments = []
        for row in dept_result:
            dept_id = str(row.id)
            hod_name = None
            if row.hod_first_name and row.hod_last_name:
                hod_name = f"{row.hod_first_name} {row.hod_last_name}"
            
            # Get sections for this department
            sections_query = text("""
                SELECT s.id, s.name, s.class_teacher,
                       u.first_name as teacher_first_name, u.last_name as teacher_last_name
                FROM sections s
                LEFT JOIN users u ON s.class_teacher = u.id
                WHERE s.department_id = :dept_id
                ORDER BY s.name
            """)
            
            section_result = db.session.execute(sections_query, {'dept_id': dept_id})
            sections = []
            for sec_row in section_result:
                teacher_name = None
                if sec_row.teacher_first_name and sec_row.teacher_last_name:
                    teacher_name = f"{sec_row.teacher_first_name} {sec_row.teacher_last_name}"
                
                sections.append({
                    'id': str(sec_row.id),
                    'name': sec_row.name,
                    'classTeacherId': str(sec_row.class_teacher) if sec_row.class_teacher else None,
                    'teacherName': teacher_name,
                    'departmentId': dept_id
                })
            
            departments.append({
                'id': dept_id,
                'name': row.name,
                'hodId': str(row.head_of_department) if row.head_of_department else None,
                'hodName': hod_name,
                'sections': sections,
                'sectionCount': len(sections)
            })
        
        return jsonify({
            'success': True,
            'departments': departments
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/departments', methods=['POST', 'OPTIONS'])
@token_required
def create_department():
    """Create a new department"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can create departments'}), 403
        
        if not current_user.institution_id:
            return jsonify({'success': False, 'error': 'No institution associated'}), 404
        
        data = request.get_json()
        name = data.get('name', '').strip()
        hod_id = data.get('hodId')
        
        if not name:
            return jsonify({'success': False, 'error': 'Department name is required'}), 400
        
        # Check for duplicate name in same institution
        check_query = text("""
            SELECT id FROM departments 
            WHERE institution_id = :inst_id AND LOWER(name) = LOWER(:name)
        """)
        existing = db.session.execute(check_query, {
            'inst_id': current_user.institution_id,
            'name': name
        }).fetchone()
        
        if existing:
            return jsonify({'success': False, 'error': 'Department with this name already exists'}), 400
        
        # Insert department
        insert_query = text("""
            INSERT INTO departments (id, name, institution_id, head_of_department)
            VALUES (gen_random_uuid(), :name, :inst_id, :hod_id)
            RETURNING id
        """)
        
        result = db.session.execute(insert_query, {
            'name': name,
            'inst_id': current_user.institution_id,
            'hod_id': hod_id if hod_id else None
        })
        
        new_id = result.fetchone()[0]
        db.session.commit()
        
        return jsonify({
            'success': True,
            'department': {
                'id': str(new_id),
                'name': name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/departments/<dept_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_department(dept_id):
    """Update a department"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can update departments'}), 403
        
        data = request.get_json()
        name = data.get('name', '').strip()
        hod_id = data.get('hodId')
        
        if not name:
            return jsonify({'success': False, 'error': 'Department name is required'}), 400
        
        # Check if department exists and belongs to admin's institution
        check_query = text("""
            SELECT id FROM departments 
            WHERE id = :dept_id AND institution_id = :inst_id
        """)
        dept = db.session.execute(check_query, {
            'dept_id': dept_id,
            'inst_id': current_user.institution_id
        }).fetchone()
        
        if not dept:
            return jsonify({'success': False, 'error': 'Department not found'}), 404
        
        # Update department
        update_query = text("""
            UPDATE departments 
            SET name = :name, head_of_department = :hod_id
            WHERE id = :dept_id
        """)
        
        db.session.execute(update_query, {
            'name': name,
            'hod_id': hod_id if hod_id else None,
            'dept_id': dept_id
        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Department updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/departments/<dept_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_department(dept_id):
    """Delete a department and its sections"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can delete departments'}), 403
        
        # Check if department exists and belongs to admin's institution
        check_query = text("""
            SELECT id FROM departments 
            WHERE id = :dept_id AND institution_id = :inst_id
        """)
        dept = db.session.execute(check_query, {
            'dept_id': dept_id,
            'inst_id': current_user.institution_id
        }).fetchone()
        
        if not dept:
            return jsonify({'success': False, 'error': 'Department not found'}), 404
        
        # Delete sections first
        delete_sections = text("DELETE FROM sections WHERE department_id = :dept_id")
        db.session.execute(delete_sections, {'dept_id': dept_id})
        
        # Delete department
        delete_dept = text("DELETE FROM departments WHERE id = :dept_id")
        db.session.execute(delete_dept, {'dept_id': dept_id})
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Department and its sections deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/sections', methods=['POST', 'OPTIONS'])
@token_required
def create_section():
    """Create a new section in a department"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can create sections'}), 403
        
        data = request.get_json()
        name = data.get('name', '').strip()
        department_id = data.get('departmentId')
        class_teacher_id = data.get('classTeacherId')
        
        if not name:
            return jsonify({'success': False, 'error': 'Section name is required'}), 400
        if not department_id:
            return jsonify({'success': False, 'error': 'Department ID is required'}), 400
        
        # Verify department belongs to admin's institution
        check_query = text("""
            SELECT id FROM departments 
            WHERE id = :dept_id AND institution_id = :inst_id
        """)
        dept = db.session.execute(check_query, {
            'dept_id': department_id,
            'inst_id': current_user.institution_id
        }).fetchone()
        
        if not dept:
            return jsonify({'success': False, 'error': 'Department not found'}), 404
        
        # Check for duplicate section name in same department
        duplicate_check = text("""
            SELECT id FROM sections 
            WHERE department_id = :dept_id AND LOWER(name) = LOWER(:name)
        """)
        existing = db.session.execute(duplicate_check, {
            'dept_id': department_id,
            'name': name
        }).fetchone()
        
        if existing:
            return jsonify({'success': False, 'error': 'Section with this name already exists in this department'}), 400
        
        # Insert section
        insert_query = text("""
            INSERT INTO sections (id, name, department_id, class_teacher)
            VALUES (gen_random_uuid(), :name, :dept_id, :teacher_id)
            RETURNING id
        """)
        
        result = db.session.execute(insert_query, {
            'name': name,
            'dept_id': department_id,
            'teacher_id': class_teacher_id if class_teacher_id else None
        })
        
        new_id = result.fetchone()[0]
        db.session.commit()
        
        return jsonify({
            'success': True,
            'section': {
                'id': str(new_id),
                'name': name,
                'departmentId': department_id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/sections/<section_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_section(section_id):
    """Update a section"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can update sections'}), 403
        
        data = request.get_json()
        name = data.get('name', '').strip()
        class_teacher_id = data.get('classTeacherId')
        
        if not name:
            return jsonify({'success': False, 'error': 'Section name is required'}), 400
        
        # Verify section belongs to admin's institution
        check_query = text("""
            SELECT s.id FROM sections s
            JOIN departments d ON s.department_id = d.id
            WHERE s.id = :section_id AND d.institution_id = :inst_id
        """)
        section = db.session.execute(check_query, {
            'section_id': section_id,
            'inst_id': current_user.institution_id
        }).fetchone()
        
        if not section:
            return jsonify({'success': False, 'error': 'Section not found'}), 404
        
        # Update section
        update_query = text("""
            UPDATE sections 
            SET name = :name, class_teacher = :teacher_id
            WHERE id = :section_id
        """)
        
        db.session.execute(update_query, {
            'name': name,
            'teacher_id': class_teacher_id if class_teacher_id else None,
            'section_id': section_id
        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Section updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/sections/<section_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_section(section_id):
    """Delete a section"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Only admins can delete sections'}), 403
        
        # Verify section belongs to admin's institution
        check_query = text("""
            SELECT s.id FROM sections s
            JOIN departments d ON s.department_id = d.id
            WHERE s.id = :section_id AND d.institution_id = :inst_id
        """)
        section = db.session.execute(check_query, {
            'section_id': section_id,
            'inst_id': current_user.institution_id
        }).fetchone()
        
        if not section:
            return jsonify({'success': False, 'error': 'Section not found'}), 404
        
        # Delete section
        delete_query = text("DELETE FROM sections WHERE id = :section_id")
        db.session.execute(delete_query, {'section_id': section_id})
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Section deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/search-users', methods=['GET'])
@token_required
def search_users_for_assignment():
    """Search users for HOD/Class Teacher assignment"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', '')  # optional: filter by role
        
        if len(search) < 2:
            return jsonify({'success': True, 'users': []}), 200
        
        # Search users in the same institution
        query = text("""
            SELECT id, first_name, last_name, email, role
            FROM users
            WHERE institution_id = :inst_id
            AND (
                LOWER(first_name) LIKE LOWER(:search)
                OR LOWER(last_name) LIKE LOWER(:search)
                OR LOWER(email) LIKE LOWER(:search)
                OR LOWER(first_name || ' ' || last_name) LIKE LOWER(:search)
            )
            AND is_approved = true
            ORDER BY first_name, last_name
            LIMIT 10
        """)
        
        result = db.session.execute(query, {
            'inst_id': current_user.institution_id,
            'search': f'%{search}%'
        })
        
        users = []
        for row in result:
            # Apply role filter if specified
            if role_filter and row.role != role_filter:
                continue
            
            users.append({
                'id': str(row.id),
                'firstName': row.first_name,
                'lastName': row.last_name,
                'email': row.email,
                'role': row.role
            })
        
        return jsonify({
            'success': True,
            'users': users
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
