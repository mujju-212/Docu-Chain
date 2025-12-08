"""
Brevo (Sendinblue) Email Service for DocuChain
Professional transactional email service with beautiful HTML templates
"""

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Brevo API client with environment variable
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.getenv('BREVO_API_KEY', '')

# Email configuration from environment variables
DEFAULT_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'support@docuchain.tech')
DEFAULT_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'DocuChain')


class BrevoEmailService:
    """Email service using Brevo (formerly Sendinblue) for transactional emails"""
    
    @staticmethod
    def _get_api_instance():
        """Get configured API instance"""
        return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    @staticmethod
    def _get_base_styles():
        """Return base CSS styles for all email templates"""
        return """
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
            color: #333333;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            padding: 35px;
            text-align: center;
            color: white;
        }
        .header-gradient-blue {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        }
        .header-gradient-green {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .header-gradient-purple {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        .header-gradient-orange {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .company-logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(255,255,255,0.15);
            padding: 12px 24px;
            border-radius: 50px;
            margin-bottom: 20px;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 35px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
            font-weight: 500;
        }
        .message-text {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 25px;
            line-height: 1.7;
        }
        .otp-container {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
            padding: 15px 25px;
            background: white;
            border-radius: 12px;
            display: inline-block;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .otp-code-blue { color: #1e3c72; }
        .otp-code-green { color: #059669; }
        .otp-code-purple { color: #7c3aed; }
        .otp-validity {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 10px;
        }
        .validity-icon {
            display: inline-block;
            margin-right: 5px;
        }
        .alert-box {
            border-radius: 10px;
            padding: 18px 20px;
            margin: 25px 0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .alert-warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
        }
        .alert-info {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
        }
        .alert-success {
            background: #d1fae5;
            border-left: 4px solid #10b981;
        }
        .alert-icon {
            font-size: 20px;
            flex-shrink: 0;
        }
        .alert-content {
            font-size: 14px;
            color: #374151;
        }
        .alert-content strong {
            display: block;
            margin-bottom: 5px;
        }
        .steps-container {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .steps-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .steps-list {
            list-style: none;
            padding: 0;
        }
        .steps-list li {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #4b5563;
        }
        .step-number {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .footer {
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px 35px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-logo {
            font-weight: 700;
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .footer-tagline {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 20px;
        }
        .footer-links {
            margin: 15px 0;
        }
        .footer-links a {
            color: #3b82f6;
            text-decoration: none;
            font-size: 13px;
            margin: 0 10px;
        }
        .footer-legal {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 20px;
            line-height: 1.6;
        }
        .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        """

    @staticmethod
    def send_verification_email(email, otp, user_name=None, role=None):
        """Send email verification OTP for registration"""
        
        role_config = {
            'student': {'icon': '🎓', 'title': 'Student Account', 'color': 'green'},
            'faculty': {'icon': '👨‍🏫', 'title': 'Faculty Account', 'color': 'blue'},
            'admin': {'icon': '👑', 'title': 'Administrator Account', 'color': 'purple'},
            'institution': {'icon': '🏛️', 'title': 'Institution Account', 'color': 'orange'}
        }
        
        role_data = role_config.get(role, {'icon': '👤', 'title': 'User Account', 'color': 'green'})
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - DocuChain</title>
            <style>{BrevoEmailService._get_base_styles()}</style>
        </head>
        <body>
            <div class="email-container">
                <div class="header header-gradient-{role_data['color']}">
                    <div class="company-logo">
                        <div class="logo-icon">📄</div>
                        DocuChain
                    </div>
                    <h1>Verify Your Email</h1>
                    <p>Complete your account registration</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello{f" {user_name}" if user_name else ""}! 👋
                    </div>
                    
                    <p class="message-text">
                        Thank you for registering with <strong>DocuChain</strong>. To complete your 
                        <span class="highlight">{role_data['icon']} {role_data['title']}</span> registration 
                        and secure your account, please verify your email address using the code below.
                    </p>
                    
                    <div class="otp-container">
                        <div class="otp-label">Your Verification Code</div>
                        <div class="otp-code otp-code-{role_data['color']}">{otp}</div>
                        <div class="otp-validity">
                            <span class="validity-icon">⏱️</span>
                            Valid for 10 minutes
                        </div>
                    </div>
                    
                    <div class="steps-container">
                        <div class="steps-title">📋 How to complete verification:</div>
                        <ol class="steps-list">
                            <li>
                                <span class="step-number">1</span>
                                <span>Return to the DocuChain registration page</span>
                            </li>
                            <li>
                                <span class="step-number">2</span>
                                <span>Enter the verification code: <strong>{otp}</strong></span>
                            </li>
                            <li>
                                <span class="step-number">3</span>
                                <span>Complete your profile information</span>
                            </li>
                            <li>
                                <span class="step-number">4</span>
                                <span>Start managing your documents securely!</span>
                            </li>
                        </ol>
                    </div>
                    
                    <div class="alert-box alert-warning">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <strong>Security Notice</strong>
                            Never share this code with anyone. DocuChain staff will never ask for your verification code.
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">DocuChain</div>
                    <div class="footer-tagline">Blockchain-Powered Document Management for Education</div>
                    <div class="footer-links">
                        <a href="#">Help Center</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                    <div class="footer-legal">
                        This is an automated message. Please do not reply directly to this email.<br>
                        © {datetime.now().year} DocuChain Educational Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return BrevoEmailService._send_email(
            to_email=email,
            to_name=user_name,
            subject="[DocuChain] Email Verification Code",
            html_content=html_content
        )

    @staticmethod
    def send_forgot_password_email(email, otp, user_name=None):
        """Send password reset OTP email"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - DocuChain</title>
            <style>{BrevoEmailService._get_base_styles()}</style>
        </head>
        <body>
            <div class="email-container">
                <div class="header header-gradient-blue">
                    <div class="company-logo">
                        <div class="logo-icon">🔐</div>
                        DocuChain
                    </div>
                    <h1>Password Reset Request</h1>
                    <p>Secure your account</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello{f" {user_name}" if user_name else ""}! 🔒
                    </div>
                    
                    <p class="message-text">
                        We received a request to reset your DocuChain account password. 
                        Use the security code below to proceed with resetting your password.
                    </p>
                    
                    <div class="otp-container">
                        <div class="otp-label">Password Reset Code</div>
                        <div class="otp-code otp-code-blue">{otp}</div>
                        <div class="otp-validity">
                            <span class="validity-icon">⏱️</span>
                            Expires in 10 minutes
                        </div>
                    </div>
                    
                    <div class="alert-box alert-warning">
                        <span class="alert-icon">🛡️</span>
                        <div class="alert-content">
                            <strong>Important Security Information</strong>
                            • This code expires in 10 minutes<br>
                            • Never share this code with anyone<br>
                            • If you didn't request this, please secure your account immediately
                        </div>
                    </div>
                    
                    <div class="steps-container">
                        <div class="steps-title">🔑 Reset your password:</div>
                        <ol class="steps-list">
                            <li>
                                <span class="step-number">1</span>
                                <span>Go to the password reset page</span>
                            </li>
                            <li>
                                <span class="step-number">2</span>
                                <span>Enter the code: <strong>{otp}</strong></span>
                            </li>
                            <li>
                                <span class="step-number">3</span>
                                <span>Create a new secure password</span>
                            </li>
                            <li>
                                <span class="step-number">4</span>
                                <span>Sign in with your new password</span>
                            </li>
                        </ol>
                    </div>
                    
                    <div class="alert-box alert-info">
                        <span class="alert-icon">💡</span>
                        <div class="alert-content">
                            <strong>Didn't request this?</strong>
                            If you didn't request a password reset, you can safely ignore this email. 
                            Your password will remain unchanged.
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">DocuChain</div>
                    <div class="footer-tagline">Blockchain-Powered Document Management for Education</div>
                    <div class="footer-links">
                        <a href="#">Help Center</a>
                        <a href="#">Security</a>
                        <a href="#">Contact Support</a>
                    </div>
                    <div class="footer-legal">
                        This is an automated security notification.<br>
                        © {datetime.now().year} DocuChain Educational Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return BrevoEmailService._send_email(
            to_email=email,
            to_name=user_name,
            subject="[DocuChain] Password Reset Code",
            html_content=html_content
        )

    @staticmethod
    def send_welcome_email(email, user_name, role, institution_name=None):
        """Send welcome email after successful registration"""
        
        role_config = {
            'student': {'icon': '🎓', 'title': 'Student', 'color': 'green'},
            'faculty': {'icon': '👨‍🏫', 'title': 'Faculty Member', 'color': 'blue'},
            'admin': {'icon': '👑', 'title': 'Administrator', 'color': 'purple'},
        }
        
        role_data = role_config.get(role, {'icon': '👤', 'title': 'User', 'color': 'green'})
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DocuChain!</title>
            <style>{BrevoEmailService._get_base_styles()}</style>
        </head>
        <body>
            <div class="email-container">
                <div class="header header-gradient-{role_data['color']}">
                    <div class="company-logo">
                        <div class="logo-icon">🎉</div>
                        DocuChain
                    </div>
                    <h1>Welcome to DocuChain!</h1>
                    <p>Your account has been created successfully</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Welcome, {user_name}! 🎊
                    </div>
                    
                    <p class="message-text">
                        Congratulations! Your <span class="highlight">{role_data['icon']} {role_data['title']}</span> 
                        account has been successfully created{f" at <strong>{institution_name}</strong>" if institution_name else ""}.
                        You now have access to our blockchain-powered document management platform.
                    </p>
                    
                    <div class="alert-box alert-success">
                        <span class="alert-icon">✅</span>
                        <div class="alert-content">
                            <strong>Account Ready!</strong>
                            You can now log in and start using DocuChain's features.
                        </div>
                    </div>
                    
                    <div class="steps-container">
                        <div class="steps-title">🚀 Get started with DocuChain:</div>
                        <ol class="steps-list">
                            <li>
                                <span class="step-number">1</span>
                                <span><strong>Connect your wallet</strong> - Link your MetaMask for blockchain features</span>
                            </li>
                            <li>
                                <span class="step-number">2</span>
                                <span><strong>Upload documents</strong> - Securely store your files with blockchain verification</span>
                            </li>
                            <li>
                                <span class="step-number">3</span>
                                <span><strong>Request approvals</strong> - Get documents signed and verified</span>
                            </li>
                            <li>
                                <span class="step-number">4</span>
                                <span><strong>Share securely</strong> - Share documents with tamper-proof verification</span>
                            </li>
                        </ol>
                    </div>
                    
                    <div class="alert-box alert-info">
                        <span class="alert-icon">💡</span>
                        <div class="alert-content">
                            <strong>Need Help?</strong>
                            Check our Help Center or contact support if you have any questions about using DocuChain.
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">DocuChain</div>
                    <div class="footer-tagline">Blockchain-Powered Document Management for Education</div>
                    <div class="footer-links">
                        <a href="#">Get Started Guide</a>
                        <a href="#">Help Center</a>
                        <a href="#">Contact Support</a>
                    </div>
                    <div class="footer-legal">
                        © {datetime.now().year} DocuChain Educational Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return BrevoEmailService._send_email(
            to_email=email,
            to_name=user_name,
            subject=f"[DocuChain] Welcome to DocuChain, {user_name}!",
            html_content=html_content
        )

    @staticmethod
    def send_institution_registration_email(email, institution_name, admin_name, registration_code=None):
        """Send institution registration confirmation email"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Institution Registration - DocuChain</title>
            <style>{BrevoEmailService._get_base_styles()}</style>
        </head>
        <body>
            <div class="email-container">
                <div class="header header-gradient-orange">
                    <div class="company-logo">
                        <div class="logo-icon">🏛️</div>
                        DocuChain
                    </div>
                    <h1>Institution Registration</h1>
                    <p>Welcome to DocuChain for Education</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello, {admin_name}! 🏫
                    </div>
                    
                    <p class="message-text">
                        <strong>{institution_name}</strong> has been successfully registered on DocuChain. 
                        As the institution administrator, you now have access to manage your institution's 
                        document workflow and user accounts.
                    </p>
                    
                    {f'''
                    <div class="otp-container">
                        <div class="otp-label">Institution Registration Code</div>
                        <div class="otp-code otp-code-purple">{registration_code}</div>
                        <div class="otp-validity">
                            Share this code with faculty and students to join
                        </div>
                    </div>
                    ''' if registration_code else ''}
                    
                    <div class="alert-box alert-success">
                        <span class="alert-icon">✅</span>
                        <div class="alert-content">
                            <strong>Institution Registered!</strong>
                            Your institution is now ready to use DocuChain's document management features.
                        </div>
                    </div>
                    
                    <div class="steps-container">
                        <div class="steps-title">🛠️ Admin Setup Checklist:</div>
                        <ol class="steps-list">
                            <li>
                                <span class="step-number">1</span>
                                <span><strong>Add Departments</strong> - Set up your institution's departments</span>
                            </li>
                            <li>
                                <span class="step-number">2</span>
                                <span><strong>Create Sections</strong> - Organize students into sections</span>
                            </li>
                            <li>
                                <span class="step-number">3</span>
                                <span><strong>Invite Users</strong> - Add faculty and approve student registrations</span>
                            </li>
                            <li>
                                <span class="step-number">4</span>
                                <span><strong>Configure Approvals</strong> - Set up document approval workflows</span>
                            </li>
                        </ol>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">DocuChain</div>
                    <div class="footer-tagline">Blockchain-Powered Document Management for Education</div>
                    <div class="footer-links">
                        <a href="#">Admin Guide</a>
                        <a href="#">Help Center</a>
                        <a href="#">Enterprise Support</a>
                    </div>
                    <div class="footer-legal">
                        © {datetime.now().year} DocuChain Educational Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return BrevoEmailService._send_email(
            to_email=email,
            to_name=admin_name,
            subject=f"[DocuChain] Institution Registration - {institution_name}",
            html_content=html_content
        )

    @staticmethod
    def send_document_approval_notification(email, user_name, document_name, status, approver_name=None, comments=None):
        """Send notification when a document approval status changes"""
        
        status_config = {
            'approved': {'icon': '✅', 'title': 'Document Approved', 'color': 'green', 'header_color': 'green'},
            'rejected': {'icon': '❌', 'title': 'Document Rejected', 'color': 'red', 'header_color': 'blue'},
            'pending': {'icon': '⏳', 'title': 'Approval Pending', 'color': 'orange', 'header_color': 'orange'},
        }
        
        status_data = status_config.get(status.lower(), status_config['pending'])
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{status_data['title']} - DocuChain</title>
            <style>{BrevoEmailService._get_base_styles()}</style>
        </head>
        <body>
            <div class="email-container">
                <div class="header header-gradient-{status_data['header_color']}">
                    <div class="company-logo">
                        <div class="logo-icon">{status_data['icon']}</div>
                        DocuChain
                    </div>
                    <h1>{status_data['title']}</h1>
                    <p>Document Approval Update</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello, {user_name}! 📄
                    </div>
                    
                    <p class="message-text">
                        Your document <strong>"{document_name}"</strong> has been 
                        <span class="highlight">{status.upper()}</span>
                        {f" by <strong>{approver_name}</strong>" if approver_name else ""}.
                    </p>
                    
                    {f'''
                    <div class="alert-box alert-info">
                        <span class="alert-icon">💬</span>
                        <div class="alert-content">
                            <strong>Approver Comments</strong>
                            {comments}
                        </div>
                    </div>
                    ''' if comments else ''}
                    
                    <div class="alert-box alert-{'success' if status.lower() == 'approved' else 'warning' if status.lower() == 'rejected' else 'info'}">
                        <span class="alert-icon">{status_data['icon']}</span>
                        <div class="alert-content">
                            <strong>What's Next?</strong>
                            {'Your document is now verified and can be shared with blockchain verification.' if status.lower() == 'approved' else 'Please review the feedback and submit a revised document if needed.' if status.lower() == 'rejected' else 'Your document is being reviewed. You will be notified once a decision is made.'}
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">DocuChain</div>
                    <div class="footer-tagline">Blockchain-Powered Document Management for Education</div>
                    <div class="footer-legal">
                        © {datetime.now().year} DocuChain Educational Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return BrevoEmailService._send_email(
            to_email=email,
            to_name=user_name,
            subject=f"[DocuChain] {status_data['title']} - {document_name}",
            html_content=html_content
        )

    @staticmethod
    def _send_email(to_email, subject, html_content, to_name=None):
        """Send email using Brevo API"""
        try:
            api_instance = BrevoEmailService._get_api_instance()
            
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                sender=sib_api_v3_sdk.SendSmtpEmailSender(
                    name=DEFAULT_SENDER_NAME,
                    email=DEFAULT_SENDER_EMAIL
                ),
                to=[sib_api_v3_sdk.SendSmtpEmailTo(
                    email=to_email,
                    name=to_name if to_name else to_email
                )],
                subject=subject,
                html_content=html_content,
                headers={
                    "X-Mailin-custom": f"docuchain-{int(time.time())}",
                    "charset": "utf-8"
                }
            )
            
            api_response = api_instance.send_transac_email(send_smtp_email)
            return True, {"message_id": api_response.message_id if hasattr(api_response, 'message_id') else str(api_response)}
            
        except ApiException as e:
            error_msg = f"Brevo API error: {e}"
            return False, error_msg
        except Exception as e:
            error_msg = f"Email sending error: {str(e)}"
            return False, error_msg


# Create an alias for backward compatibility
EmailService = BrevoEmailService
