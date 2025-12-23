"""
Simple Brevo Email Service using requests library
With IP-based fallback for Azure DNS issues
"""

import requests
import os
from dotenv import load_dotenv
import socket
from urllib3.util.connection import create_connection

load_dotenv()

BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'support@docuchain.tech')
BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'DocuChain')

# Brevo API IP address (fallback for DNS issues)
BREVO_API_IP = "141.101.90.104"


class SimpleBrevoEmailService:
    """Direct Brevo API calls using requests - with DNS fallback"""
    
    @staticmethod
    def send_email(to_email, subject, html_content, to_name=None):
        """Send email using Brevo REST API with DNS fallback"""
        
        # First try normal API call
        url = "https://api.brevo.com/v3/smtp/email"
        
        headers = {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
            "Host": "api.brevo.com"  # Important for SNI
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
            # Try normal DNS resolution first
            response = requests.post(
                url, 
                json=payload, 
                headers=headers, 
                timeout=30
            )
            
            if response.status_code == 201:
                print(f"[EMAIL SUCCESS] Sent to {to_email}")
                return True, {"message_id": response.json().get('messageId')}
            else:
                error_msg = f"Brevo API error: {response.status_code} - {response.text}"
                print(f"[EMAIL ERROR] {error_msg}")
                return False, error_msg
                
        except (requests.exceptions.Timeout, socket.gaierror, OSError) as e:
            # DNS or connection failed - try IP fallback
            print(f"[EMAIL] DNS failed, trying IP fallback: {str(e)}")
            
            try:
                # Use IP address directly with SNI
                ip_url = f"https://{BREVO_API_IP}/v3/smtp/email"
                
                # Create session with custom adapter for SNI
                session = requests.Session()
                
                # Make request with IP but proper Host header for SNI
                response = session.post(
                    ip_url,
                    json=payload,
                    headers=headers,
                    timeout=30,
                    verify=True  # Keep SSL verification
                )
                
                if response.status_code == 201:
                    print(f"[EMAIL SUCCESS] Sent via IP to {to_email}")
                    return True, {"message_id": response.json().get('messageId')}
                else:
                    error_msg = f"Brevo API error (IP): {response.status_code} - {response.text}"
                    print(f"[EMAIL ERROR] {error_msg}")
                    return False, error_msg
                    
            except Exception as ip_error:
                error_msg = f"Both DNS and IP fallback failed: DNS={str(e)}, IP={str(ip_error)}"
                print(f"[EMAIL ERROR] {error_msg}")
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Email sending error: {str(e)}"
            print(f"[EMAIL ERROR] {error_msg}")
            return False, error_msg
    
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
