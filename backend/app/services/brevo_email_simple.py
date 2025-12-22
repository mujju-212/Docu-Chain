"""
Simple Brevo Email Service using requests library
Bypasses SDK DNS issues in Azure
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'support@docuchain.tech')
BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'DocuChain')


class SimpleBrevoEmailService:
    """Direct Brevo API calls using requests - more reliable in Azure"""
    
    @staticmethod
    def send_email(to_email, subject, html_content, to_name=None):
        """Send email using Brevo REST API directly"""
        
        url = "https://api.brevo.com/v3/smtp/email"
        
        headers = {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": BREVO_SENDER_NAME,
                "email": BREVO_SENDER_EMAIL
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_name if to_name else to_email
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 201:
                return True, {"message_id": response.json().get('messageId')}
            else:
                error_msg = f"Brevo API error: {response.status_code} - {response.text}"
                return False, error_msg
                
        except requests.exceptions.Timeout:
            return False, "Request timeout - check network connectivity"
        except requests.exceptions.ConnectionError as e:
            return False, f"Connection error: {str(e)}"
        except Exception as e:
            return False, f"Email sending error: {str(e)}"
    
    @staticmethod
    def send_verification_email(email, otp, user_name=None, role=None):
        """Send verification email"""
        subject = "[DocuChain] Email Verification Code"
        html_content = f"""
        <h1>Verify Your Email</h1>
        <p>Hello{f" {user_name}" if user_name else ""}!</p>
        <p>Your verification code is: <strong style="font-size: 24px; color: #1e3c72;">{otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p><small>© DocuChain - Blockchain Document Management</small></p>
        """
        return SimpleBrevoEmailService.send_email(email, subject, html_content, user_name)
    
    @staticmethod
    def send_forgot_password_email(email, otp, user_name=None):
        """Send password reset email"""
        subject = "[DocuChain] Password Reset Code"
        html_content = f"""
        <h1>Password Reset Request</h1>
        <p>Hello{f" {user_name}" if user_name else ""}!</p>
        <p>Your password reset code is: <strong style="font-size: 24px; color: #1e3c72;">{otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please secure your account immediately.</p>
        <hr>
        <p><small>© DocuChain - Blockchain Document Management</small></p>
        """
        return SimpleBrevoEmailService.send_email(email, subject, html_content, user_name)


# Alias for compatibility
EmailService = SimpleBrevoEmailService
