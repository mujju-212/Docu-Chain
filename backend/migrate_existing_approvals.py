"""
Migration script to populate Document Approval folders with existing approved/rejected documents
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import ApprovalRequest, ApprovalStep, User
from app.services.approval_folder_service import ApprovalFolderService

def migrate_existing_approvals():
    """Populate Document Approval folders with existing approved/rejected documents"""
    
    app = create_app()
    with app.app_context():
        print("=" * 70)
        print("🚀 Migrating existing approval requests to Document Approval folders...")
        print("=" * 70)
        
        # Get all completed approval requests (APPROVED or REJECTED)
        completed_requests = ApprovalRequest.query.filter(
            ApprovalRequest.status.in_(['APPROVED', 'REJECTED', 'CANCELLED'])
        ).all()
        
        print(f"\n📊 Found {len(completed_requests)} completed approval requests\n")
        
        migrated_count = 0
        error_count = 0
        
        for request in completed_requests:
            try:
                requester = User.query.get(request.requester_id)
                requester_name = requester.email if requester else "Unknown"
                
                print(f"📄 Processing: {request.document_name}")
                print(f"   Status: {request.status}")
                print(f"   Requester: {requester_name}")
                
                # Get all approval steps for this request
                steps = ApprovalStep.query.filter_by(
                    blockchain_request_id=request.request_id
                ).all()
                
                if request.status == 'APPROVED':
                    # Add to requester's Sent/Approved folder
                    ApprovalFolderService.create_document_in_folder(
                        request,
                        request.requester_id,
                        'sent',
                        'approved',
                        is_stamped=bool(request.stamped_document_ipfs_hash)
                    )
                    print(f"   ✅ Added to Sent/Approved for requester")
                    
                    # Add to all approvers' Received/Approved folders
                    for step in steps:
                        if step.has_approved:
                            approver = User.query.get(step.approver_id)
                            approver_name = approver.email if approver else "Unknown"
                            ApprovalFolderService.create_document_in_folder(
                                request,
                                step.approver_id,
                                'received',
                                'approved',
                                is_stamped=bool(request.stamped_document_ipfs_hash)
                            )
                            print(f"   ✅ Added to Received/Approved for approver: {approver_name}")
                    
                elif request.status == 'REJECTED':
                    # Add to requester's Sent/Rejected folder
                    ApprovalFolderService.create_document_in_folder(
                        request,
                        request.requester_id,
                        'sent',
                        'rejected'
                    )
                    print(f"   ❌ Added to Sent/Rejected for requester")
                    
                    # Add to the rejecting approver's Received/Rejected folder
                    for step in steps:
                        if step.has_rejected:
                            approver = User.query.get(step.approver_id)
                            approver_name = approver.email if approver else "Unknown"
                            ApprovalFolderService.create_document_in_folder(
                                request,
                                step.approver_id,
                                'received',
                                'rejected'
                            )
                            print(f"   ❌ Added to Received/Rejected for approver: {approver_name}")
                
                elif request.status == 'CANCELLED':
                    # Add to requester's Sent/Canceled folder
                    ApprovalFolderService.create_document_in_folder(
                        request,
                        request.requester_id,
                        'sent',
                        'canceled'
                    )
                    print(f"   🚫 Added to Sent/Canceled for requester")
                
                migrated_count += 1
                print()
                
            except Exception as e:
                error_count += 1
                print(f"   ⚠️ Error: {str(e)}")
                print()
        
        # Commit all changes
        db.session.commit()
        
        print("=" * 70)
        print(f"✅ Migration complete!")
        print(f"   Migrated: {migrated_count} requests")
        print(f"   Errors: {error_count}")
        print("=" * 70)


if __name__ == '__main__':
    migrate_existing_approvals()
