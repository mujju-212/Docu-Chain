"""
Fallback Email Service with Multiple Providers
For critical email delivery in Azure environments
"""

import requests
import smtplib
import os
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from dotenv import load_dotenv

load_dotenv()

# Primary: Brevo
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'support@docuchain.tech')
BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'DocuChain')

# Fallback: SMTP (Gmail, Outlook, etc.)
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'


class FallbackEmailService:
    """Email service with multiple provider fallback"""
    
    @staticmethod
    def send_via_brevo(to_email, subject, html_content, to_name=None):
        """Primary: Send via Brevo API"""
        try:
            from .brevo_email_simple import SimpleBrevoEmailService
            return SimpleBrevoEmailService.send_email(to_email, subject, html_content, to_name)
        except Exception as e:
            return False, f"Brevo service error: {str(e)}"
    
    @staticmethod
    def send_via_smtp(to_email, subject, html_content, to_name=None):
        """Fallback: Send via SMTP"""
        try:
            if not SMTP_USERNAME or not SMTP_PASSWORD:
                return False, "SMTP credentials not configured"
            
            # Create message
            msg = MimeMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{BREVO_SENDER_NAME} <{SMTP_USERNAME}>"
            msg['To'] = to_email
            
            # Add HTML content
            html_part = MimeText(html_content, 'html')
            msg.attach(html_part)
            
            # Send via SMTP
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            
            return True, {"message": "Email sent via SMTP"}
            
        except Exception as e:
            return False, f"SMTP error: {str(e)}"
    
    @staticmethod
    def send_email(to_email, subject, html_content, to_name=None):
        """Send email with fallback providers"""
        
        # Try primary provider (Brevo)
        success, response = FallbackEmailService.send_via_brevo(to_email, subject, html_content, to_name)
        
        if success:
            print(f"[EMAIL] Sent via Brevo to {to_email}")
            return True, response
        
        # Log primary failure
        print(f"[EMAIL] Brevo failed for {to_email}: {response}")
        
        # Try fallback (SMTP)
        success, response = FallbackEmailService.send_via_smtp(to_email, subject, html_content, to_name)
        
        if success:
            print(f"[EMAIL] Sent via SMTP fallback to {to_email}")
            return True, response
        
        # All providers failed
        print(f"[EMAIL] All providers failed for {to_email}: {response}")
        return False, f"All email providers failed. Last error: {response}"
    
    @staticmethod
    def send_verification_email(email, otp, user_name=None, role=None):
        """Send verification email with fallback"""
        subject = "[DocuChain] Email Verification Code"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3c72;">Verify Your Email</h1>
            <p>Hello{f" {user_name}" if user_name else ""}!</p>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <strong style="font-size: 32px; color: #1e3c72; letter-spacing: 5px;">{otp}</strong>
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
                © DocuChain - Blockchain Document Management<br>
                This is an automated message, please do not reply.
            </p>
        </div>
        """
        return FallbackEmailService.send_email(email, subject, html_content, user_name)
    
    @staticmethod
    def send_forgot_password_email(email, otp, user_name=None):
        """Send password reset email with fallback"""
        subject = "[DocuChain] Password Reset Code"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3c72;">Password Reset Request</h1>
            <p>Hello{f" {user_name}" if user_name else ""}!</p>
            <p>Your password reset code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <strong style="font-size: 32px; color: #1e3c72; letter-spacing: 5px;">{otp}</strong>
            </div>
            <p>This code expires in 10 minutes.</p>
            <p><strong>Security Notice:</strong> If you didn't request this reset, please secure your account immediately.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
                © DocuChain - Blockchain Document Management<br>
                This is an automated message, please do not reply.
            </p>
        </div>
        """
        return FallbackEmailService.send_email(email, subject, html_content, user_name)


# Use this as the main email service
EmailService = FallbackEmailService