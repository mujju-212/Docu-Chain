import resend
import os
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Resend with API key from environment
resend.api_key = os.getenv('RESEND_API_KEY', '')

# Email configuration - Professional business format
DEFAULT_SENDER_EMAIL = "noreply@resend.dev"  # Verified sender address
DEFAULT_SENDER_NAME = "DocuChain Educational Platform"  # Professional business name

class EmailService:
    @staticmethod
    def send_forgot_password_email(email, otp, user_name=None):
        """Send professional forgot password email with OTP"""
        subject = "[DocuChain] Account Security - Password Reset Verification"
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Security Alert - DocuChain</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    line-height: 1.6;
                    color: #333333;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .company-logo {{
                    display: inline-block;
                    background: rgba(255,255,255,0.1);
                    padding: 12px 20px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 20px;
                    font-weight: 600;
                    letter-spacing: 1px;
                }}
                .header h1 {{
                    font-size: 24px;
                    font-weight: 300;
                    margin-bottom: 8px;
                }}
                .header p {{
                    font-size: 14px;
                    opacity: 0.9;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                }}
                .security-code {{
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 25px;
                    text-align: center;
                    margin: 25px 0;
                }}
                .code-label {{
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 10px;
                }}
                .verification-code {{
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e3c72;
                    letter-spacing: 6px;
                    font-family: 'Courier New', monospace;
                    margin: 15px 0;
                }}
                .code-validity {{
                    font-size: 12px;
                    color: #6c757d;
                }}
                .security-notice {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .security-notice strong {{
                    color: #856404;
                }}
                .instructions {{
                    margin: 25px 0;
                }}
                .instructions h3 {{
                    font-size: 16px;
                    margin-bottom: 15px;
                    color: #2c3e50;
                }}
                .step-list {{
                    padding-left: 20px;
                }}
                .step-list li {{
                    margin-bottom: 8px;
                    color: #495057;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 25px 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }}
                .company-info {{
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 15px;
                }}
                .contact-info {{
                    font-size: 12px;
                    color: #adb5bd;
                    margin: 10px 0;
                }}
                .legal-text {{
                    font-size: 11px;
                    color: #adb5bd;
                    margin-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="company-logo">DocuChain</div>
                    <h1>Account Security Alert</h1>
                    <p>Educational Document Management Platform</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Dear{f" {user_name}" if user_name else " User"},
                    </div>
                    
                    <p>We have received a password reset request for your DocuChain account. To ensure the security of your account, please use the verification code provided below.</p>
                    
                    <div class="security-code">
                        <div class="code-label">Security Verification Code</div>
                        <div class="verification-code">{otp}</div>
                        <div class="code-validity">Expires in 10 minutes</div>
                    </div>
                    
                    <div class="security-notice">
                        <strong>Important Security Information:</strong><br>
                        • This verification code is valid for 10 minutes only<br>
                        • Do not share this code with anyone, including DocuChain staff<br>
                        • If you did not request this password reset, please contact our support team immediately
                    </div>
                    
                    <div class="instructions">
                        <h3>Next Steps:</h3>
                        <ol class="step-list">
                            <li>Navigate back to the DocuChain password reset page</li>
                            <li>Enter the verification code: <strong>{otp}</strong></li>
                            <li>Create a new secure password</li>
                            <li>Sign in to your account with the new password</li>
                        </ol>
                    </div>
                    
                    <p>If you encounter any issues or have questions about your account security, please contact our technical support team.</p>
                </div>
                
                <div class="footer">
                    <div class="company-info">
                        <strong>DocuChain Platform</strong><br>
                        Blockchain-Powered Document Management for Educational Institutions
                    </div>
                    <div class="contact-info">
                        Technical Support: support@docuchain.edu<br>
                        Security Team: security@docuchain.edu
                    </div>
                    <div class="legal-text">
                        This is an automated security notification. Please do not reply directly to this email.<br>
                        © 2025 DocuChain Educational Technologies. All rights reserved.<br>
                        Your account security is our priority.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": f"{DEFAULT_SENDER_NAME} <{DEFAULT_SENDER_EMAIL}>",
                "to": [email],
                "subject": subject,
                "html": html_content,
                "reply_to": "support@docuchain.app",
                "headers": {
                    "X-Entity-Ref-ID": f"docuchain-pwd-reset-{int(time.time())}",
                    "List-Unsubscribe": "<mailto:unsubscribe@docuchain.app>",
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    "X-Mailer": "DocuChain v1.0",
                    "X-Priority": "3",
                    "X-MSMail-Priority": "Normal",
                    "Message-ID": f"<pwd-reset-{int(time.time())}@docuchain.edu>",
                    "Precedence": "bulk",
                    "Auto-Submitted": "auto-generated"
                }
            }
            
            email_response = resend.Emails.send(params)
            return True, email_response
        except Exception as e:
            return False, str(e)

    @staticmethod
    def send_verification_email(email, otp, user_name=None, role=None):
        """Send email verification OTP for registration"""
        subject = "[DocuChain] Account Registration - Email Verification Required"
        
        role_info = {
            'student': {'icon': '🎓', 'title': 'Student Account'},
            'faculty': {'icon': '👨‍🏫', 'title': 'Faculty Account'},
            'admin': {'icon': '👑', 'title': 'Administrator Account'},
            'institution': {'icon': '🏛️', 'title': 'Institution Account'}
        }
        
        role_data = role_info.get(role, {'icon': '👤', 'title': 'User Account'})
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Registration - DocuChain</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    line-height: 1.6;
                    color: #333333;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .company-logo {{
                    display: inline-block;
                    background: rgba(255,255,255,0.1);
                    padding: 12px 20px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 20px;
                    font-weight: 600;
                    letter-spacing: 1px;
                }}
                .header h1 {{
                    font-size: 24px;
                    font-weight: 300;
                    margin-bottom: 8px;
                }}
                .header p {{
                    font-size: 14px;
                    opacity: 0.9;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                }}
                .role-badge {{
                    display: inline-block;
                    background: #e8f5e8;
                    color: #2d5a2d;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 15px 0;
                }}
                .verification-code {{
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 25px;
                    text-align: center;
                    margin: 25px 0;
                }}
                .code-label {{
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 10px;
                }}
                .otp-display {{
                    font-size: 32px;
                    font-weight: 700;
                    color: #28a745;
                    letter-spacing: 6px;
                    font-family: 'Courier New', monospace;
                    margin: 15px 0;
                }}
                .code-validity {{
                    font-size: 12px;
                    color: #6c757d;
                }}
                .steps-section {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .benefits-list {{
                    padding-left: 20px;
                }}
                .benefits-list li {{
                    margin-bottom: 8px;
                    color: #495057;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 25px 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }}
                .company-info {{
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 15px;
                }}
                .legal-text {{
                    font-size: 11px;
                    color: #adb5bd;
                    margin-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="company-logo">DocuChain</div>
                    <h1>Account Registration</h1>
                    <p>Educational Document Management Platform</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Dear{f" {user_name}" if user_name else " User"},
                    </div>
                    
                    <div class="role-badge">
                        {role_data['icon']} {role_data['title']}
                    </div>
                    
                    <p>Thank you for your interest in DocuChain. To complete your account registration and ensure the security of your educational records, please verify your email address using the code below.</p>
                    
                    <div class="verification-code">
                        <div class="code-label">Email Verification Code</div>
                        <div class="otp-display">{otp}</div>
                        <div class="code-validity">Valid for 10 minutes</div>
                    </div>
                    
                    <div class="steps-section">
                        <h3>Registration Steps:</h3>
                        <ol>
                            <li>Return to the DocuChain registration page</li>
                            <li>Enter the verification code: <strong>{otp}</strong></li>
                            <li>Complete your institutional profile</li>
                            <li>Begin managing your academic documents securely</li>
                        </ol>
                    </div>
                    
                    <h3>Platform Benefits:</h3>
                    <ul class="benefits-list">
                        <li>Secure blockchain-based document storage</li>
                        <li>Institutional-grade verification system</li>
                        <li>Collaborative document management tools</li>
                        <li>Real-time tracking and audit trails</li>
                    </ul>
                    
                    <p>If you require assistance with your registration or have questions about platform features, our support team is available to help.</p>
                </div>
                
                <div class="footer">
                    <div class="company-info">
                        <strong>DocuChain Platform</strong><br>
                        Blockchain-Powered Document Management for Educational Institutions
                    </div>
                    <div class="legal-text">
                        This is an automated registration notification.<br>
                        © 2025 DocuChain Educational Technologies. All rights reserved.<br>
                        Secure. Verifiable. Educational.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": f"{DEFAULT_SENDER_NAME} <{DEFAULT_SENDER_EMAIL}>",
                "to": [email],
                "subject": subject,
                "html": html_content,
                "reply_to": "support@docuchain.app",
                "headers": {
                    "X-Entity-Ref-ID": f"docuchain-verification-{int(time.time())}",
                    "List-Unsubscribe": "<mailto:unsubscribe@docuchain.app>",
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    "X-Mailer": "DocuChain v1.0",
                    "X-Priority": "3",
                    "X-MSMail-Priority": "Normal",
                    "Message-ID": f"<verification-{int(time.time())}@docuchain.edu>",
                    "Precedence": "bulk",
                    "Auto-Submitted": "auto-generated"
                }
            }
            
            email_response = resend.Emails.send(params)
            return True, email_response
        except Exception as e:
            return False, str(e)

    @staticmethod
    def send_institution_registration_email(admin_email, institution_name, admin_name, admin_password):
        """Send institution registration confirmation with admin credentials"""
        subject = "🏛️ Welcome to DocuChain - Institution Successfully Registered!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Institution Registration Successful</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #6f42c1 0%, #5a369a 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .logo {{
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .content {{
                    background: #fff;
                    padding: 40px;
                    border: 1px solid #e1e5e9;
                    border-radius: 0 0 10px 10px;
                }}
                .credentials-box {{
                    background: linear-gradient(135deg, #17a2b8, #138496);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin: 30px 0;
                    box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
                }}
                .credential-item {{
                    margin: 15px 0;
                    padding: 10px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 5px;
                }}
                .institution-badge {{
                    background: #e7e3fc;
                    color: #5a369a;
                    padding: 15px 25px;
                    border-radius: 25px;
                    display: inline-block;
                    font-weight: bold;
                    margin: 15px 0;
                    font-size: 18px;
                }}
                .security-note {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                }}
                .features-grid {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 25px 0;
                }}
                .feature-card {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }}
                .footer {{
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e1e5e9;
                }}
                .btn {{
                    display: inline-block;
                    background: #6f42c1;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🔗 DocuChain</div>
                <p>Blockchain Document Management System</p>
            </div>
            
            <div class="content">
                <h2>🎉 Congratulations!</h2>
                
                <div class="institution-badge">
                    🏛️ {institution_name}
                </div>
                
                <p>Dear {admin_name},</p>
                
                <p>We're excited to welcome <strong>{institution_name}</strong> to the DocuChain platform! Your institution has been successfully registered and your administrator account is now active.</p>
                
                <div class="credentials-box">
                    <h3 style="margin-top: 0; text-align: center;">🔐 Administrator Login Credentials</h3>
                    <div class="credential-item">
                        <strong>👤 Admin Email:</strong><br>
                        {admin_email}
                    </div>
                    <div class="credential-item">
                        <strong>🔑 Temporary Password:</strong><br>
                        {admin_password}
                    </div>
                    <div class="credential-item">
                        <strong>🏛️ Institution:</strong><br>
                        {institution_name}
                    </div>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Important Security Instructions:</strong>
                    <ol style="margin: 15px 0;">
                        <li><strong>Login immediately</strong> and change your password</li>
                        <li><strong>Enable two-factor authentication</strong> for enhanced security</li>
                        <li><strong>Never share</strong> these credentials with unauthorized personnel</li>
                        <li><strong>Store credentials</strong> in a secure password manager</li>
                    </ol>
                </div>
                
                <h3>🚀 Your Institution Dashboard Includes:</h3>
                <div class="features-grid">
                    <div class="feature-card">
                        <h4>👥 User Management</h4>
                        <p>Add and manage students, faculty, and staff accounts</p>
                    </div>
                    <div class="feature-card">
                        <h4>📄 Document Control</h4>
                        <p>Oversee all document uploads and verifications</p>
                    </div>
                    <div class="feature-card">
                        <h4>🔍 Analytics Dashboard</h4>
                        <p>Track usage statistics and document flows</p>
                    </div>
                    <div class="feature-card">
                        <h4>⚙️ Institution Settings</h4>
                        <p>Configure policies and approval workflows</p>
                    </div>
                </div>
                
                <h3>📋 Next Steps:</h3>
                <ol>
                    <li><strong>Login to DocuChain</strong> using the credentials above</li>
                    <li><strong>Update your password</strong> and profile information</li>
                    <li><strong>Configure institution settings</strong> and policies</li>
                    <li><strong>Start adding users</strong> (faculty, students, staff)</li>
                    <li><strong>Begin document management</strong> operations</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="#" class="btn">🚀 Access Your Dashboard</a>
                </div>
                
                <p>Our support team is available 24/7 to help you get started. Welcome to the future of educational document management!</p>
            </div>
            
            <div class="footer">
                <p>🏢 <strong>DocuChain</strong> - Empowering Educational Institutions</p>
                <p>For support: support@docuchain.app | Help Center: help.docuchain.app</p>
                <p>© 2025 DocuChain. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": f"{DEFAULT_SENDER_NAME} <{DEFAULT_SENDER_EMAIL}>",
                "to": [admin_email],
                "subject": subject,
                "html": html_content,
            }
            
            email_response = resend.Emails.send(params)
            return True, email_response
        except Exception as e:
            return False, str(e)

    @staticmethod
    def send_welcome_email(email, user_name, role, institution_name=None):
        """Send welcome email after successful account creation"""
        
        role_info = {
            'student': {
                'icon': '🎓',
                'title': 'Student',
                'welcome': 'Welcome to your educational journey with DocuChain!',
                'features': [
                    '📚 Access your academic documents securely',
                    '🎯 Track your academic progress',
                    '📝 Submit assignments and projects',
                    '🔐 Verify your certificates and transcripts'
                ]
            },
            'faculty': {
                'icon': '👨‍🏫',
                'title': 'Faculty Member',
                'welcome': 'Welcome to DocuChain\'s educational platform!',
                'features': [
                    '📋 Manage student documents and grades',
                    '✅ Approve and verify student submissions',
                    '📊 Access comprehensive analytics',
                    '🤝 Collaborate with other faculty members'
                ]
            },
            'admin': {
                'icon': '👑',
                'title': 'Administrator',
                'welcome': 'Welcome to DocuChain\'s administration panel!',
                'features': [
                    '🏛️ Manage institution-wide operations',
                    '👥 Oversee user accounts and permissions',
                    '📈 Monitor system usage and performance',
                    '⚙️ Configure institutional policies'
                ]
            },
            'institution': {
                'icon': '🏛️',
                'title': 'Institution Administrator',
                'welcome': 'Welcome to DocuChain\'s institutional management!',
                'features': [
                    '🏢 Complete institutional dashboard access',
                    '👥 Manage all user accounts',
                    '📊 Comprehensive reporting tools',
                    '🔧 Full system configuration'
                ]
            }
        }
        
        role_data = role_info.get(role, {
            'icon': '👤',
            'title': 'User',
            'welcome': 'Welcome to DocuChain!',
            'features': ['🔐 Secure document management', '📱 Easy-to-use interface']
        })
        
        subject = f"🎉 Welcome to DocuChain, {user_name}!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DocuChain</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    text-align: center;
                    border-radius: 15px 15px 0 0;
                }}
                .logo {{
                    font-size: 42px;
                    font-weight: bold;
                    margin-bottom: 15px;
                }}
                .welcome-badge {{
                    background: rgba(255,255,255,0.2);
                    padding: 15px 30px;
                    border-radius: 50px;
                    display: inline-block;
                    margin-top: 20px;
                    font-size: 18px;
                    font-weight: bold;
                }}
                .content {{
                    background: #fff;
                    padding: 50px;
                    border: 1px solid #e1e5e9;
                    border-radius: 0 0 15px 15px;
                }}
                .role-section {{
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    margin: 30px 0;
                    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
                }}
                .features-list {{
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 12px;
                    margin: 25px 0;
                }}
                .features-list ul {{
                    list-style: none;
                    padding: 0;
                }}
                .features-list li {{
                    padding: 12px 0;
                    border-bottom: 1px solid #e9ecef;
                    font-size: 16px;
                }}
                .features-list li:last-child {{
                    border-bottom: none;
                }}
                .cta-section {{
                    text-align: center;
                    background: linear-gradient(135deg, #17a2b8, #138496);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin: 30px 0;
                }}
                .btn {{
                    display: inline-block;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    padding: 15px 35px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 15px;
                    font-weight: bold;
                    border: 2px solid rgba(255,255,255,0.3);
                    transition: all 0.3s ease;
                }}
                .institution-info {{
                    background: #e7f3ff;
                    border: 1px solid #b3d9ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                }}
                .footer {{
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 2px solid #e1e5e9;
                }}
                .stats-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin: 25px 0;
                }}
                .stat-card {{
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🔗 DocuChain</div>
                <h1 style="margin: 0; font-size: 28px;">Account Successfully Created!</h1>
                <div class="welcome-badge">
                    {role_data['icon']} {role_data['title']} Account
                </div>
            </div>
            
            <div class="content">
                <h2>🎉 Welcome aboard, {user_name}!</h2>
                
                <p style="font-size: 18px; color: #495057;">{role_data['welcome']}</p>
                
                {f'''
                <div class="institution-info">
                    <h3>🏛️ {institution_name}</h3>
                    <p>You're now connected to your institution's secure document management system.</p>
                </div>
                ''' if institution_name else ''}
                
                <div class="role-section">
                    <h3 style="margin-top: 0;">🚀 Your {role_data['title']} Dashboard is Ready!</h3>
                    <p style="font-size: 18px; margin-bottom: 0;">You now have full access to all {role_data['title'].lower()} features and capabilities.</p>
                </div>
                
                <div class="features-list">
                    <h3>✨ What you can do with your account:</h3>
                    <ul>
                        {chr(10).join(f'<li>{feature}</li>' for feature in role_data['features'])}
                    </ul>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">🔐</div>
                        <p><strong>Blockchain Secured</strong><br>Military-grade security</p>
                    </div>
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">⚡</div>
                        <p><strong>Instant Access</strong><br>Real-time document processing</p>
                    </div>
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">🌐</div>
                        <p><strong>Global Verification</strong><br>Worldwide document recognition</p>
                    </div>
                </div>
                
                <div class="cta-section">
                    <h3 style="margin-top: 0;">🎯 Ready to get started?</h3>
                    <p>Your DocuChain journey begins now. Explore your dashboard and discover the power of blockchain-secured document management.</p>
                    <a href="#" class="btn">🚀 Open Dashboard</a>
                    <a href="#" class="btn">📚 View Tutorial</a>
                </div>
                
                <h3>💡 Pro Tips for {role_data['title']}s:</h3>
                <ul style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
                    <li><strong>Complete your profile</strong> to unlock all features</li>
                    <li><strong>Explore the help center</strong> for detailed guides</li>
                    <li><strong>Join our community</strong> for tips and best practices</li>
                    <li><strong>Contact support</strong> anytime for assistance</li>
                </ul>
                
                <p style="font-size: 16px; margin-top: 30px;">We're thrilled to have you as part of the DocuChain community. If you have any questions or need assistance, our support team is here to help!</p>
            </div>
            
            <div class="footer">
                <p>🏢 <strong>DocuChain</strong> - Revolutionizing Educational Document Management</p>
                <p>📧 Support: support@docuchain.app | 📱 Help Center: help.docuchain.app</p>
                <p>🔗 Follow us: Twitter | LinkedIn | YouTube</p>
                <p>© 2025 DocuChain. Securing the future of education.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": f"{DEFAULT_SENDER_NAME} <{DEFAULT_SENDER_EMAIL}>",
                "to": [email],
                "subject": subject,
                "html": html_content,
            }
            
            email_response = resend.Emails.send(params)
            return True, email_response
        except Exception as e:
            return False, str(e)