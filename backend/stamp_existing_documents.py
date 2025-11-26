"""
Script to stamp existing approved documents with QR codes
Run this to add QR codes to documents that were approved before the feature was added
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models import ApprovalRequest, ApprovalStep, User
from app.services.pdf_stamping import pdf_stamping_service
from config import Config
from datetime import datetime
import requests
import json

def stamp_existing_documents():
    app = create_app()
    with app.app_context():
        # Get all approved requests without stamped documents
        requests_to_stamp = ApprovalRequest.query.filter(
            ApprovalRequest.status == 'APPROVED',
            ApprovalRequest.stamped_document_ipfs_hash.is_(None)
        ).all()
        
        print(f"Found {len(requests_to_stamp)} approved documents without stamps")
        
        pinata_jwt = Config.PINATA_JWT
        if not pinata_jwt:
            print("❌ Error: PINATA_JWT not configured in environment")
            return
        
        for req in requests_to_stamp:
            print(f"\n📄 Processing: {req.document_name}")
            print(f"   IPFS Hash: {req.document_ipfs_hash}")
            print(f"   Verification Code: {req.verification_code}")
            
            try:
                # Get approvers info
                all_steps = ApprovalStep.query.filter_by(request_id=req.id).all()
                approvers_info = []
                for s in all_steps:
                    approver = User.query.get(s.approver_id)
                    if approver:
                        approvers_info.append({
                            'name': f"{approver.first_name} {approver.last_name}",
                            'role': s.approver_role or approver.role,
                            'timestamp': datetime.fromtimestamp(s.action_timestamp).isoformat() if s.action_timestamp else None
                        })
                
                # Prepare approval details
                approval_details = {
                    'verification_code': req.verification_code,
                    'document_name': req.document_name,
                    'approved_at': req.completed_at.isoformat() if req.completed_at else datetime.utcnow().isoformat(),
                    'approvers': approvers_info,
                    'blockchain_tx': req.blockchain_tx_hash,
                    'approval_type': req.approval_type
                }
                
                print(f"   Approval Type: {req.approval_type}")
                print(f"   Approvers: {[a['name'] for a in approvers_info]}")
                
                # Generate stamped PDF
                print("   ⏳ Downloading and stamping PDF...")
                stamped_pdf = pdf_stamping_service.stamp_pdf_from_url(
                    req.document_ipfs_hash,
                    approval_details,
                    req.approval_type
                )
                
                if stamped_pdf:
                    print(f"   ✅ PDF stamped successfully ({len(stamped_pdf)} bytes)")
                    
                    # Upload to Pinata
                    print("   ⏳ Uploading stamped PDF to IPFS...")
                    upload_url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
                    headers = {"Authorization": f"Bearer {pinata_jwt}"}
                    files = {
                        'file': (f"stamped_{req.document_name}", stamped_pdf, 'application/pdf')
                    }
                    pinata_metadata = {
                        "name": f"Stamped_{req.document_name}",
                        "keyvalues": {
                            "verification_code": req.verification_code,
                            "original_hash": req.document_ipfs_hash,
                            "type": "stamped_document"
                        }
                    }
                    data_payload = {"pinataMetadata": json.dumps(pinata_metadata)}
                    
                    response = requests.post(upload_url, headers=headers, files=files, data=data_payload)
                    
                    if response.status_code == 200:
                        ipfs_hash = response.json().get('IpfsHash')
                        req.stamped_document_ipfs_hash = ipfs_hash
                        req.stamped_at = datetime.utcnow()
                        db.session.commit()
                        print(f"   ✅ Uploaded to IPFS: {ipfs_hash}")
                    else:
                        print(f"   ❌ Failed to upload to IPFS: {response.text}")
                else:
                    print("   ❌ Failed to generate stamped PDF")
                    
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                import traceback
                traceback.print_exc()
        
        print("\n✅ Done!")

if __name__ == "__main__":
    stamp_existing_documents()
