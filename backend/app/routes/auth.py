from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.institution import Institution
from app.models.folder import Folder
from app.services.email_service import EmailService
from datetime import datetime, timedelta
from functools import wraps
import random
import string

bp = Blueprint('auth', __name__)


def create_default_folders_for_user(user):
    """Create default folder structure for a new user based on their role"""
    try:
        user_role = (user.role or '').lower()
        
        # 1. Shared folder with subfolders
        shared_folder = Folder(
            name="Shared",
            owner_id=user.id,
            parent_id=None,
            path="/Shared",
            level=0,
            is_system_folder=True
        )
        db.session.add(shared_folder)
        db.session.flush()
        
        # Sent subfolder
        sent_folder = Folder(
            name="Sent",
            owner_id=user.id,
            parent_id=shared_folder.id,
            path="/Shared/Sent",
            level=1,
            is_system_folder=True
        )
        db.session.add(sent_folder)
        
        # Received subfolder
        received_folder = Folder(
            name="Received",
            owner_id=user.id,
            parent_id=shared_folder.id,
            path="/Shared/Received",
            level=1,
            is_system_folder=True
        )
        db.session.add(received_folder)
        
        # 2. Generated folder (root level - empty, no subfolders)
        generated_folder = Folder(
            name="Generated",
            owner_id=user.id,
            parent_id=None,
            path="/Generated",
            level=0,
            is_system_folder=True
        )
        db.session.add(generated_folder)
        
        # 3. Document Approval folder structure (NEW)
        doc_approval_folder = Folder(
            name="Document Approval",
            owner_id=user.id,
            parent_id=None,
            path="/Document Approval",
            level=0,
            is_system_folder=True
        )
        db.session.add(doc_approval_folder)
        db.session.flush()
        
        # 3a. Sent folder under Document Approval (for all users)
        sent_approval_folder = Folder(
            name="Sent",
            owner_id=user.id,
            parent_id=doc_approval_folder.id,
            path="/Document Approval/Sent",
            level=1,
            is_system_folder=True
        )
        db.session.add(sent_approval_folder)
        db.session.flush()
        
        # Subfolders under Sent: Approved, Rejected, Pending, Canceled
        for status_name in ["Approved", "Rejected", "Pending", "Canceled"]:
            status_folder = Folder(
                name=status_name,
                owner_id=user.id,
                parent_id=sent_approval_folder.id,
                path=f"/Document Approval/Sent/{status_name}",
                level=2,
                is_system_folder=True
            )
            db.session.add(status_folder)
        
        # 3b. Received folder under Document Approval (only for faculty and admin)
        if user_role in ['faculty', 'admin', 'staff']:
            received_approval_folder = Folder(
                name="Received",
                owner_id=user.id,
                parent_id=doc_approval_folder.id,
                path="/Document Approval/Received",
                level=1,
                is_system_folder=True
            )
            db.session.add(received_approval_folder)
            db.session.flush()
            
            # Subfolders under Received: Approved, Rejected, Pending
            for status_name in ["Approved", "Rejected", "Pending"]:
                status_folder = Folder(
                    name=status_name,
                    owner_id=user.id,
                    parent_id=received_approval_folder.id,
                    path=f"/Document Approval/Received/{status_name}",
                    level=2,
                    is_system_folder=True
                )
                db.session.add(status_folder)
        
        # 4. Department folder (if user has department)
        if user.department_id:
            from app.models.institution import Department
            department = Department.query.get(user.department_id)
            if department:
                dept_folder = Folder(
                    name=department.name,
                    owner_id=user.id,
                    parent_id=None,
                    path=f"/{department.name}",
                    level=0,
                    is_system_folder=True
                )
                db.session.add(dept_folder)
        
        # 5. Institution folder
        if user.institution_id:
            institution = Institution.query.get(user.institution_id)
            if institution:
                inst_folder = Folder(
                    name=institution.name,
                    owner_id=user.id,
                    parent_id=None,
                    path=f"/{institution.name}",
                    level=0,
                    is_system_folder=True
                )
                db.session.add(inst_folder)
        
        print(f"✅ Created default folders for user: {user.email} (role: {user_role})")
        
    except Exception as e:
        print(f"❌ Error creating default folders for {user.email}: {str(e)}")
        raise
import os

bp = Blueprint('auth', __name__)

def token_required(f):
    """Decorator to require a valid JWT token for protected routes"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user (requires admin approval)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'firstName', 'lastName', 'role', 'institutionName', 'institutionUniqueId', 'uniqueId']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({
                'success': False, 
                'message': f'This email ({data["email"]}) is already registered. Please use a different email or try logging in.'
            }), 409
        
        # Verify institution exists
        institution = Institution.query.filter_by(
            name=data['institutionName'],
            unique_id=data['institutionUniqueId']
        ).first()
        
        if not institution:
            return jsonify({'success': False, 'message': 'Institution not found'}), 404
        
        # Create new user (pending approval by default)
        user = User(
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            role=data['role'],
            institution_id=institution.id,
            phone=data.get('phone'),
            unique_id=data['uniqueId'],
            wallet_address=data.get('walletAddress'),
            status='pending'  # Requires admin approval
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create default folder structure for the new user
        try:
            create_default_folders_for_user(user)
            db.session.commit()
        except Exception as e:
            print(f"Warning: Failed to create default folders: {str(e)}")
            # Don't fail registration if folder creation fails
        
        # Send welcome email
        try:
            full_name = f"{user.first_name} {user.last_name}"
            EmailService.send_welcome_email(
                user.email, 
                full_name, 
                user.role, 
                institution.name
            )
        except Exception as e:
            print(f"Warning: Failed to send welcome email to {user.email}: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please wait for admin approval.'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    """Login user with institution validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Missing email or password'}), 400
        
        if not data.get('institutionId'):
            return jsonify({'success': False, 'message': 'Missing institution selection'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Validate institution access
        if str(user.institution_id) != str(data['institutionId']):
            return jsonify({'success': False, 'message': 'Institution access denied'}), 403
        
        # Check if user is active
        if user.status != 'active':
            if user.status == 'pending':
                return jsonify({'success': False, 'message': 'Account pending admin approval'}), 403
            else:
                return jsonify({'success': False, 'message': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/create-institution', methods=['POST'])
def create_institution():
    """Create a new institution with admin user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['institutionName', 'institutionType', 'institutionUniqueId', 
                         'adminUsername', 'adminEmail', 'adminPassword', 'adminFirstName', 'adminLastName']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Check if institution already exists
        if Institution.query.filter_by(name=data['institutionName']).first():
            return jsonify({'success': False, 'message': 'Institution name already exists'}), 400
        
        if Institution.query.filter_by(unique_id=data['institutionUniqueId']).first():
            return jsonify({'success': False, 'message': 'Institution unique ID already exists'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['adminUsername']).first():
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['adminEmail']).first():
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Create institution
        institution = Institution(
            name=data['institutionName'],
            institution_type=data['institutionType'],
            unique_id=data['institutionUniqueId'],
            address=data.get('address'),
            website=data.get('website'),
            email=data.get('institutionEmail'),
            phone_number=data.get('phoneNumber')
        )
        db.session.add(institution)
        db.session.flush()  # Get institution ID
        
        # Create admin user (auto-approved)
        admin = User(
            username=data['adminUsername'],
            email=data['adminEmail'],
            first_name=data['adminFirstName'],
            last_name=data['adminLastName'],
            role='admin',
            institution_id=institution.id,
            phone_number=data.get('adminPhone'),
            department=data.get('adminDepartment'),
            wallet_address=data.get('walletAddress'),
            is_approved=True,  # Admin is auto-approved
            is_active=True
        )
        admin.set_password(data['adminPassword'])
        
        db.session.add(admin)
        db.session.commit()
        
        # Send institution registration email with credentials
        try:
            admin_full_name = f"{admin.first_name} {admin.last_name}"
            EmailService.send_institution_registration_email(
                admin.email,
                institution.name,
                admin_full_name,
                data['adminPassword']  # Send the original password before hashing
            )
        except Exception as e:
            print(f"Warning: Failed to send institution registration email to {admin.email}: {str(e)}")
        
        # Send welcome email too
        try:
            EmailService.send_welcome_email(
                admin.email,
                admin_full_name,
                'institution',
                institution.name
            )
        except Exception as e:
            print(f"Warning: Failed to send welcome email to {admin.email}: {str(e)}")
        
        # Create access token
        access_token = create_access_token(identity=admin.id)
        
        return jsonify({
            'success': True,
            'message': 'Institution created successfully',
            'user': admin.to_dict(),
            'institution': institution.to_dict(),
            'token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    # JWT tokens are stateless, so logout is handled client-side
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


# In-memory OTP storage (in production, use Redis or database)
otp_storage = {}

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

# Email functions moved to EmailService class

@bp.route('/send-email-verification', methods=['POST'])
def send_email_verification():
    """Send OTP to email for verification"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        # Check if email already exists in the system
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with expiration (10 minutes)
        otp_storage[email] = {
            'otp': otp,
            'expires_at': datetime.utcnow() + timedelta(minutes=10),
            'attempts': 0
        }
        
        # Send verification email using Resend
        success, response = EmailService.send_verification_email(email, otp)
        if success:
            response_data = {
                'success': True, 
                'message': 'Verification OTP sent to your email'
            }
            
            # Add OTP to response in development mode
            if os.getenv('FLASK_ENV') == 'development':
                response_data['otp'] = otp
                
            return jsonify(response_data), 200
        else:
            # Handle Resend API limitations in development
            if 'testing emails to your own email address' in str(response):
                response_data = {
                    'success': True, 
                    'message': f'Verification OTP generated. In development mode, only {os.getenv("VERIFIED_EMAIL", "mujju718263@gmail.com")} can receive emails.'
                }
                
                # Always return OTP in development when email can't be sent
                if os.getenv('FLASK_ENV') == 'development':
                    response_data['otp'] = otp
                    response_data['dev_note'] = 'Email service limited to verified addresses. Use OTP above for testing.'
                    
                return jsonify(response_data), 200
            else:
                return jsonify({'success': False, 'message': 'Failed to send verification email. Please try again.'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/verify-email-otp', methods=['POST'])
def verify_email_otp():
    """Verify OTP for email"""
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({'success': False, 'message': 'Email and OTP are required'}), 400
        
        # Check if OTP exists
        if email not in otp_storage:
            return jsonify({'success': False, 'message': 'No OTP found for this email'}), 400
        
        stored_otp_data = otp_storage[email]
        
        # Check if OTP has expired
        if datetime.utcnow() > stored_otp_data['expires_at']:
            del otp_storage[email]
            return jsonify({'success': False, 'message': 'OTP has expired'}), 400
        
        # Check attempt limit
        if stored_otp_data['attempts'] >= 3:
            del otp_storage[email]
            return jsonify({'success': False, 'message': 'Too many failed attempts'}), 400
        
        # Verify OTP
        if otp != stored_otp_data['otp']:
            stored_otp_data['attempts'] += 1
            return jsonify({
                'success': False, 
                'message': f'Invalid OTP. {3 - stored_otp_data["attempts"]} attempts remaining'
            }), 400
        
        # OTP verified successfully
        del otp_storage[email]
        return jsonify({
            'success': True, 
            'message': 'Email verified successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate forgot password process by sending OTP to email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'This email is not registered with DocuChain. Please check your email or sign up first.'}), 404
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with reset identifier
        reset_key = f"reset_{email}"
        otp_storage[reset_key] = {
            'otp': otp,
            'expires_at': datetime.utcnow() + timedelta(minutes=10),
            'attempts': 0,
            'email': email
        }
        
        # Send OTP email using Resend
        success, response = EmailService.send_forgot_password_email(email, otp, user.first_name)
        if success:
            # For development, also return OTP in response
            response_data = {
                'success': True, 
                'message': 'Password reset OTP sent to your email'
            }
            
            # Add OTP to response in development mode
            if os.getenv('FLASK_ENV') == 'development':
                response_data['otp'] = otp
                
            return jsonify(response_data), 200
        else:
            # Handle Resend API limitations in development
            if 'testing emails to your own email address' in str(response):
                response_data = {
                    'success': True, 
                    'message': f'Password reset OTP generated. In development mode, only {os.getenv("VERIFIED_EMAIL", "mujju718263@gmail.com")} can receive emails.'
                }
                
                # Always return OTP in development when email can't be sent
                if os.getenv('FLASK_ENV') == 'development':
                    response_data['otp'] = otp
                    response_data['dev_note'] = 'Email service limited to verified addresses. Use OTP above for testing.'
                    
                return jsonify(response_data), 200
            else:
                return jsonify({'success': False, 'message': 'Failed to send OTP email. Please try again.'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/verify-reset-otp', methods=['POST'])
def verify_reset_otp():
    """Verify OTP for password reset"""
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({'success': False, 'message': 'Email and OTP are required'}), 400
        
        reset_key = f"reset_{email}"
        
        # Check if reset OTP exists
        if reset_key not in otp_storage:
            return jsonify({'success': False, 'message': 'No password reset request found for this email'}), 400
        
        stored_otp_data = otp_storage[reset_key]
        
        # Check if OTP has expired
        if datetime.utcnow() > stored_otp_data['expires_at']:
            del otp_storage[reset_key]
            return jsonify({'success': False, 'message': 'Reset code has expired'}), 400
        
        # Check attempt limit
        if stored_otp_data['attempts'] >= 3:
            del otp_storage[reset_key]
            return jsonify({'success': False, 'message': 'Too many failed attempts'}), 400
        
        # Verify OTP
        if otp != stored_otp_data['otp']:
            stored_otp_data['attempts'] += 1
            return jsonify({
                'success': False, 
                'message': f'Invalid reset code. {3 - stored_otp_data["attempts"]} attempts remaining'
            }), 400
        
        # OTP verified successfully - mark as verified but don't delete yet
        stored_otp_data['verified'] = True
        stored_otp_data['expires_at'] = datetime.utcnow() + timedelta(minutes=5)  # 5 minute window to reset
        
        return jsonify({
            'success': True, 
            'message': 'Reset code verified successfully. You can now set your new password.'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password after OTP verification"""
    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('newPassword')
        
        if not email or not new_password:
            return jsonify({'success': False, 'message': 'Email and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
        
        reset_key = f"reset_{email}"
        
        # Check if verified reset session exists
        if reset_key not in otp_storage:
            return jsonify({'success': False, 'message': 'No verified reset session found'}), 400
        
        stored_data = otp_storage[reset_key]
        
        # Check if OTP was verified and session is still valid
        if not stored_data.get('verified') or datetime.utcnow() > stored_data['expires_at']:
            del otp_storage[reset_key]
            return jsonify({'success': False, 'message': 'Reset session has expired. Please start over.'}), 400
        
        # Find user and update password
        user = User.query.filter_by(email=email).first()
        if not user:
            del otp_storage[reset_key]
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        # Clean up reset session
        del otp_storage[reset_key]
        
        return jsonify({
            'success': True, 
            'message': 'Password reset successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/test-email/<email_type>', methods=['POST'])
def test_email(email_type):
    """Test email templates - Development only"""
    if not os.getenv('FLASK_ENV') == 'development':
        return jsonify({'success': False, 'message': 'Test endpoint only available in development'}), 403
    
    try:
        data = request.get_json() or {}
        email = data.get('email', 'test@docuchain.app')
        
        if email_type == 'forgot-password':
            success, response = EmailService.send_forgot_password_email(email, '123456', 'Test User')
        elif email_type == 'verification':
            success, response = EmailService.send_verification_email(email, '789012', 'Test User', 'student')
        elif email_type == 'institution':
            success, response = EmailService.send_institution_registration_email(
                email, 'Test University', 'Test Admin', 'TempPass123'
            )
        elif email_type == 'welcome':
            role = data.get('role', 'student')
            success, response = EmailService.send_welcome_email(email, 'Test User', role, 'Test University')
        else:
            return jsonify({'success': False, 'message': 'Invalid email type'}), 400
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'{email_type.title()} email sent successfully',
                'email_id': response.get('id', 'N/A') if isinstance(response, dict) else str(response)
            }), 200
        else:
            return jsonify({'success': False, 'message': f'Failed to send email: {response}'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
