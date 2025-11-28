"""
PDF Stamping Service - Adds QR code, approval stamps, and digital signatures to PDFs
"""
import io
import os
import qrcode
from datetime import datetime
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfReader, PdfWriter
import tempfile
import requests


class PDFStampingService:
    """Service to add QR codes, stamps, and digital signatures to PDF documents"""
    
    # Stamp dimensions and positions
    QR_SIZE = 80  # pixels
    QR_MARGIN = 20  # margin from page edge
    STAMP_WIDTH = 250
    STAMP_HEIGHT = 80
    SIGNATURE_HEIGHT = 100
    
    def __init__(self, base_url="http://localhost:5173"):
        """
        Initialize the PDF stamping service
        
        Args:
            base_url: Base URL for the verification link in QR code
        """
        self.base_url = base_url
    
    def generate_qr_code(self, verification_code: str) -> Image.Image:
        """
        Generate a QR code image for the verification code
        
        Args:
            verification_code: The unique verification code (e.g., DCH-2025-A7X9K3)
            
        Returns:
            PIL Image of the QR code
        """
        # Create verification URL
        verification_url = f"{self.base_url}/verify/{verification_code}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=4,
            border=2,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        # Create image with white background
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        return qr_image.get_image()
    
    def create_approval_stamp(self, approver_name: str, approval_date: datetime, 
                              verification_code: str, approval_type: str = "STANDARD") -> io.BytesIO:
        """
        Create an approval stamp overlay
        
        Args:
            approver_name: Name of the approver
            approval_date: Date of approval
            verification_code: Verification code
            approval_type: "STANDARD" or "DIGITAL_SIGNATURE"
            
        Returns:
            BytesIO containing the stamp PDF
        """
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        width, height = letter
        
        # Stamp position (bottom center, above margin)
        stamp_x = (width - self.STAMP_WIDTH) / 2
        stamp_y = 50
        
        if approval_type == "DIGITAL_SIGNATURE":
            self._draw_digital_signature_stamp(can, stamp_x, stamp_y, approver_name, 
                                               approval_date, verification_code)
        else:
            self._draw_approval_stamp(can, stamp_x, stamp_y, approver_name, 
                                      approval_date, verification_code)
        
        can.save()
        packet.seek(0)
        return packet
    
    def _draw_approval_stamp(self, can, x, y, approver_name, approval_date, verification_code):
        """Draw a standard approval stamp"""
        # Background rectangle with border
        can.setFillColor(HexColor('#f0fdf4'))  # Light green background
        can.setStrokeColor(HexColor('#22c55e'))  # Green border
        can.setLineWidth(2)
        can.roundRect(x, y, self.STAMP_WIDTH, self.STAMP_HEIGHT, 10, fill=1, stroke=1)
        
        # Checkmark circle
        circle_x = x + 25
        circle_y = y + self.STAMP_HEIGHT / 2
        can.setFillColor(HexColor('#22c55e'))
        can.circle(circle_x, circle_y, 12, fill=1, stroke=0)
        
        # Checkmark (simplified)
        can.setStrokeColor(white)
        can.setLineWidth(2)
        can.line(circle_x - 5, circle_y, circle_x - 1, circle_y - 5)
        can.line(circle_x - 1, circle_y - 5, circle_x + 6, circle_y + 5)
        
        # Text
        text_x = x + 50
        can.setFillColor(HexColor('#166534'))  # Dark green
        can.setFont("Helvetica-Bold", 14)
        can.drawString(text_x, y + self.STAMP_HEIGHT - 22, "APPROVED")
        
        can.setFont("Helvetica", 9)
        can.setFillColor(HexColor('#374151'))  # Gray
        can.drawString(text_x, y + self.STAMP_HEIGHT - 38, f"By: {approver_name}")
        can.drawString(text_x, y + self.STAMP_HEIGHT - 52, 
                      f"Date: {approval_date.strftime('%d/%m/%Y %H:%M')}")
        can.drawString(text_x, y + self.STAMP_HEIGHT - 66, f"Ref: {verification_code}")
    
    def _draw_digital_signature_stamp(self, can, x, y, approver_name, approval_date, 
                                      verification_code, signature_hash=None, tx_hash=None,
                                      signer_address=None):
        """Draw a digital signature stamp with cryptographic verification info"""
        # Increase stamp height to fit more info
        stamp_height = 120 if signer_address else self.SIGNATURE_HEIGHT
        stamp_width = self.STAMP_WIDTH + 50  # Wider for address
        
        # Adjust x position for wider stamp
        x = x - 25
        
        # Background rectangle with border
        can.setFillColor(HexColor('#eff6ff'))  # Light blue background
        can.setStrokeColor(HexColor('#3b82f6'))  # Blue border
        can.setLineWidth(2)
        can.roundRect(x, y, stamp_width, stamp_height, 10, fill=1, stroke=1)
        
        # Shield icon area
        shield_x = x + 25
        shield_y = y + stamp_height / 2 + 10
        can.setFillColor(HexColor('#3b82f6'))
        can.circle(shield_x, shield_y, 14, fill=1, stroke=0)
        
        # Lock icon (simplified checkmark for verified)
        can.setStrokeColor(white)
        can.setFillColor(white)
        can.setLineWidth(2)
        can.line(shield_x - 5, shield_y, shield_x - 1, shield_y - 5)
        can.line(shield_x - 1, shield_y - 5, shield_x + 6, shield_y + 5)
        
        # Text
        text_x = x + 50
        can.setFillColor(HexColor('#1e40af'))  # Dark blue
        can.setFont("Helvetica-Bold", 13)
        can.drawString(text_x, y + stamp_height - 18, "DIGITALLY SIGNED & VERIFIED")
        
        can.setFont("Helvetica", 8)
        can.setFillColor(HexColor('#374151'))  # Gray
        
        line_height = 12
        current_y = y + stamp_height - 34
        
        # Signed by
        can.drawString(text_x, current_y, f"Signed by: {approver_name}")
        current_y -= line_height
        
        # Date and time
        can.drawString(text_x, current_y, 
                      f"Date: {approval_date.strftime('%d/%m/%Y %H:%M:%S UTC')}")
        current_y -= line_height
        
        # Signer wallet address (for verification)
        if signer_address:
            can.setFont("Helvetica", 7)
            short_address = f"{signer_address[:10]}...{signer_address[-8:]}" if len(signer_address) > 20 else signer_address
            can.drawString(text_x, current_y, f"Signer Address: {short_address}")
            current_y -= line_height
        
        # Signature hash
        if signature_hash:
            can.setFont("Helvetica", 7)
            short_sig = signature_hash[:30] + "..." if len(signature_hash) > 30 else signature_hash
            can.drawString(text_x, current_y, f"Signature: {short_sig}")
            current_y -= line_height
        
        # Transaction hash
        if tx_hash:
            can.setFont("Helvetica", 7)
            short_tx = f"{tx_hash[:10]}...{tx_hash[-8:]}" if len(tx_hash) > 20 else tx_hash
            can.drawString(text_x, current_y, f"Blockchain TX: {short_tx}")
            current_y -= line_height
        
        # Verification code
        can.setFont("Helvetica", 7)
        can.drawString(text_x, current_y, f"Verification: {verification_code}")
        
        # Add verification note at bottom
        can.setFont("Helvetica-Oblique", 6)
        can.setFillColor(HexColor('#6b7280'))
        can.drawString(x + 10, y + 6, "Verify signature by recovering address from signature using ecrecover")
    
    def create_qr_overlay(self, verification_code: str, page_width: float, page_height: float) -> io.BytesIO:
        """
        Create a PDF overlay with QR code in top-right corner
        
        Args:
            verification_code: The verification code
            page_width: Width of the page
            page_height: Height of the page
            
        Returns:
            BytesIO containing the QR overlay PDF
        """
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        # Generate QR code
        qr_image = self.generate_qr_code(verification_code)
        
        # Save QR to temp file for reportlab
        qr_buffer = io.BytesIO()
        qr_image.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Position: top-right corner
        qr_x = page_width - self.QR_SIZE - self.QR_MARGIN
        qr_y = page_height - self.QR_SIZE - self.QR_MARGIN
        
        # Draw white background for QR
        can.setFillColor(white)
        can.rect(qr_x - 5, qr_y - 5, self.QR_SIZE + 10, self.QR_SIZE + 10, fill=1, stroke=0)
        
        # Draw border
        can.setStrokeColor(HexColor('#e5e7eb'))
        can.setLineWidth(1)
        can.rect(qr_x - 5, qr_y - 5, self.QR_SIZE + 10, self.QR_SIZE + 10, fill=0, stroke=1)
        
        # Draw QR code
        can.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=self.QR_SIZE, height=self.QR_SIZE)
        
        # Add small label below QR
        can.setFont("Helvetica", 6)
        can.setFillColor(HexColor('#6b7280'))
        label_width = can.stringWidth(verification_code, "Helvetica", 6)
        can.drawString(qr_x + (self.QR_SIZE - label_width) / 2, qr_y - 10, verification_code)
        
        can.save()
        packet.seek(0)
        return packet
    
    def stamp_pdf(self, pdf_content: bytes, verification_code: str, 
                  approver_name: str, approval_date: datetime,
                  approval_type: str = "STANDARD",
                  signature_hash: str = None, tx_hash: str = None,
                  signer_address: str = None) -> bytes:
        """
        Add QR code and approval stamp to a PDF document
        
        Args:
            pdf_content: Original PDF content as bytes
            verification_code: Verification code for QR
            approver_name: Name of the approver
            approval_date: Date of approval
            approval_type: "STANDARD" or "DIGITAL_SIGNATURE"
            signature_hash: Digital signature hash (for digital signatures)
            tx_hash: Blockchain transaction hash
            signer_address: Wallet address of the signer (for digital signatures)
            
        Returns:
            Stamped PDF content as bytes
        """
        print(f"📄 stamp_pdf called with approval_type: {approval_type}")
        print(f"📄 signature_hash: {signature_hash}")
        print(f"📄 tx_hash: {tx_hash}")
        print(f"📄 signer_address: {signer_address}")
        
        try:
            # Read original PDF
            original_pdf = PdfReader(io.BytesIO(pdf_content))
            output_pdf = PdfWriter()
            print(f"📄 Original PDF has {len(original_pdf.pages)} pages")
            
            # Process each page
            for page_num, page in enumerate(original_pdf.pages):
                # Get page dimensions
                page_box = page.mediabox
                page_width = float(page_box.width)
                page_height = float(page_box.height)
                print(f"📄 Processing page {page_num + 1}, size: {page_width}x{page_height}")
                
                # Create QR overlay for first page only
                if page_num == 0:
                    # Create QR overlay
                    qr_overlay = self.create_qr_overlay(verification_code, page_width, page_height)
                    qr_pdf = PdfReader(qr_overlay)
                    page.merge_page(qr_pdf.pages[0])
                    print(f"📄 QR overlay merged")
                    
                    # Create stamp overlay
                    stamp_overlay = self.create_approval_stamp(
                        approver_name, approval_date, verification_code, approval_type
                    )
                    
                    # For digital signature, update the stamp creation
                    if approval_type == "DIGITAL_SIGNATURE":
                        print(f"📄 Creating DIGITAL_SIGNATURE stamp overlay")
                        stamp_overlay = self._create_digital_stamp_overlay(
                            page_width, page_height, approver_name, approval_date,
                            verification_code, signature_hash, tx_hash, signer_address
                        )
                    else:
                        print(f"📄 Using standard approval stamp")
                    
                    stamp_pdf = PdfReader(stamp_overlay)
                    page.merge_page(stamp_pdf.pages[0])
                    print(f"📄 Stamp overlay merged")
                
                output_pdf.add_page(page)
            
            # Write output
            output_buffer = io.BytesIO()
            output_pdf.write(output_buffer)
            output_buffer.seek(0)
            
            result = output_buffer.read()
            print(f"📄 Stamped PDF created, size: {len(result)} bytes")
            return result
        except Exception as e:
            print(f"❌ Error in stamp_pdf: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _create_digital_stamp_overlay(self, page_width, page_height, approver_name, 
                                       approval_date, verification_code, 
                                       signature_hash=None, tx_hash=None,
                                       signer_address=None) -> io.BytesIO:
        """Create digital signature stamp overlay"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        stamp_x = (page_width - self.STAMP_WIDTH) / 2
        stamp_y = 50
        
        self._draw_digital_signature_stamp(can, stamp_x, stamp_y, approver_name, 
                                           approval_date, verification_code,
                                           signature_hash, tx_hash, signer_address)
        
        can.save()
        packet.seek(0)
        return packet
    
    def stamp_pdf_from_url(self, ipfs_hash: str, approval_details: dict,
                           approval_type: str = "STANDARD") -> bytes:
        """
        Download PDF from IPFS and stamp it
        
        Args:
            ipfs_hash: IPFS hash of the document
            approval_details: Dictionary containing:
                - verification_code: Verification code
                - document_name: Name of the document
                - approved_at: Approval timestamp
                - approvers: List of approver info dicts
                - blockchain_tx: Blockchain transaction hash
                - digital_signature: (optional) Digital signature data
            approval_type: Type of approval (STANDARD or DIGITAL_SIGNATURE)
            
        Returns:
            Stamped PDF content as bytes, or None if failed
        """
        try:
            # Build IPFS gateway URL
            pdf_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            print(f"📥 Downloading PDF from: {pdf_url}")
            
            # Download PDF
            response = requests.get(pdf_url, timeout=60)
            response.raise_for_status()
            print(f"📥 PDF downloaded successfully, size: {len(response.content)} bytes")
            print(f"📥 Content-Type: {response.headers.get('content-type', 'unknown')}")
            
            # Verify it's a PDF
            content_type = response.headers.get('content-type', '')
            if 'pdf' not in content_type.lower() and not response.content[:4] == b'%PDF':
                print(f"⚠️ Warning: Content may not be a PDF. Content-Type: {content_type}")
                # Check if it's HTML (directory listing)
                if b'<!DOCTYPE' in response.content[:100] or b'<html' in response.content[:100]:
                    print(f"❌ Error: Received HTML instead of PDF. This might be a directory CID.")
                    return None
            
            # Extract details
            verification_code = approval_details.get('verification_code', 'N/A')
            approvers = approval_details.get('approvers', [])
            approved_at = approval_details.get('approved_at', datetime.utcnow().isoformat())
            tx_hash = approval_details.get('blockchain_tx')
            is_digital_signature = approval_details.get('is_digital_signature', False)
            digital_signature = approval_details.get('digital_signature')
            
            # Get first approver name or use generic
            approver_name = approvers[0]['name'] if approvers else 'Authorized Signatory'
            
            # For digital signature, get signer wallet address
            signature_hash = None
            signer_address = None
            if is_digital_signature and digital_signature:
                signature_hash = digital_signature.get('signature', '')[:42] + '...'  # Truncate for display
                signer_address = digital_signature.get('signer_address')
            elif approvers and approvers[0].get('signature_hash'):
                signature_hash = approvers[0]['signature_hash'][:42] + '...'
                signer_address = approvers[0].get('wallet_address')
            
            # Parse approval date
            if isinstance(approved_at, str):
                approval_date = datetime.fromisoformat(approved_at.replace('Z', '+00:00'))
            else:
                approval_date = approved_at
            
            # Use DIGITAL_SIGNATURE type if digital signature data is present
            effective_approval_type = "DIGITAL_SIGNATURE" if is_digital_signature else approval_type
            
            print(f"📄 Stamping PDF with type: {effective_approval_type}")
            print(f"📄 Approver: {approver_name}")
            print(f"📄 Verification code: {verification_code}")
            print(f"📄 Signature hash: {signature_hash}")
            print(f"📄 Signer address: {signer_address}")
            print(f"📄 TX hash: {tx_hash}")
            
            stamped_result = self.stamp_pdf(
                response.content, verification_code, approver_name, approval_date,
                effective_approval_type, signature_hash, tx_hash, signer_address
            )
            
            if stamped_result:
                print(f"✅ PDF stamped successfully, size: {len(stamped_result)} bytes")
            else:
                print(f"❌ PDF stamping returned None")
            
            return stamped_result
        except Exception as e:
            print(f"Error stamping PDF from URL: {e}")
            import traceback
            traceback.print_exc()
            return None


# Singleton instance
pdf_stamping_service = PDFStampingService()
