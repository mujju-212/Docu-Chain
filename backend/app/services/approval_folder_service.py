"""
Approval Folder Service
Handles creating and managing document approval folder references.
Documents are MOVED between folders as approval status changes.
"""
from app import db
from app.models.folder import Folder
from app.models.document import Document
from app.models.approval import ApprovalRequest
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


class ApprovalFolderService:
    """Service for managing approval folder document references"""
    
    @staticmethod
    def get_approval_folder(user_id, folder_type, status):
        """
        Get the appropriate approval folder for a user
        
        Args:
            user_id: The user's ID
            folder_type: 'sent' or 'received'
            status: 'approved', 'rejected', 'pending', or 'canceled'
        
        Returns:
            Folder object or None
        """
        # Find the Document Approval folder
        doc_approval = Folder.query.filter_by(
            owner_id=user_id,
            name="Document Approval",
            parent_id=None
        ).first()
        
        if not doc_approval:
            logger.warning(f"Document Approval folder not found for user {user_id}")
            return None
        
        # Find the Sent or Received folder
        type_folder = Folder.query.filter_by(
            owner_id=user_id,
            name=folder_type.capitalize(),
            parent_id=doc_approval.id
        ).first()
        
        if not type_folder:
            logger.warning(f"{folder_type.capitalize()} folder not found for user {user_id}")
            return None
        
        # Find the status folder
        status_folder = Folder.query.filter_by(
            owner_id=user_id,
            name=status.capitalize(),
            parent_id=type_folder.id
        ).first()
        
        if not status_folder:
            logger.warning(f"{status.capitalize()} folder not found under {folder_type.capitalize()} for user {user_id}")
        
        return status_folder
    
    @staticmethod
    def find_document_by_request_id(folder_id, request_id):
        """
        Find a document in a folder by the approval request ID (stored in document_id)
        
        Args:
            folder_id: The folder to search in
            request_id: The approval request ID
        
        Returns:
            Document object or None
        """
        # The document_id field stores the original document ID from the approval request
        return Document.query.filter_by(
            folder_id=folder_id
        ).filter(
            Document.name.contains(request_id[:8]) if request_id else False
        ).first()
    
    @staticmethod
    def find_document_by_ipfs_hash(folder_id, ipfs_hash):
        """
        Find a document in a folder by IPFS hash
        """
        return Document.query.filter_by(
            folder_id=folder_id,
            ipfs_hash=ipfs_hash
        ).first()
    
    @staticmethod
    def delete_document_from_folder(user_id, folder_type, status, ipfs_hash):
        """
        Delete a document from a specific folder
        
        Args:
            user_id: The user's ID
            folder_type: 'sent' or 'received'
            status: 'approved', 'rejected', 'pending', or 'canceled'
            ipfs_hash: The IPFS hash of the document
        
        Returns:
            True if deleted, False otherwise
        """
        folder = ApprovalFolderService.get_approval_folder(user_id, folder_type, status)
        if not folder:
            return False
        
        doc = Document.query.filter_by(
            folder_id=folder.id,
            ipfs_hash=ipfs_hash
        ).first()
        
        if doc:
            db.session.delete(doc)
            logger.info(f"🗑️ Deleted document from {folder_type.capitalize()}/{status.capitalize()}")
            return True
        
        return False
    
    @staticmethod
    def create_document_in_folder(approval_request, user_id, folder_type, status, is_stamped=False):
        """
        Create a document reference in the specified folder
        
        Args:
            approval_request: The ApprovalRequest object
            user_id: The user who owns the folder
            folder_type: 'sent' or 'received'
            status: 'approved', 'rejected', 'pending', or 'canceled'
            is_stamped: Whether to use the stamped document hash
        
        Returns:
            Document object or None
        """
        folder = ApprovalFolderService.get_approval_folder(user_id, folder_type, status)
        if not folder:
            logger.error(f"❌ Folder {folder_type}/{status} not found for user {user_id}")
            return None
        
        ipfs_hash = approval_request.stamped_document_ipfs_hash if is_stamped and approval_request.stamped_document_ipfs_hash else approval_request.document_ipfs_hash
        
        # Check if document already exists in this folder
        existing = Document.query.filter_by(
            ipfs_hash=ipfs_hash,
            folder_id=folder.id
        ).first()
        
        if existing:
            logger.info(f"📄 Document already exists in {folder_type.capitalize()}/{status.capitalize()}")
            return existing
        
        # Create new document reference
        doc = Document(
            id=uuid.uuid4(),
            document_id=approval_request.document_id,
            ipfs_hash=ipfs_hash,
            name=approval_request.document_name,
            file_name=approval_request.document_name,
            file_size=approval_request.document_file_size or 0,
            document_type=approval_request.document_file_type or 'application/pdf',
            owner_id=user_id,
            owner_address=approval_request.requester_wallet,
            folder_id=folder.id,
            transaction_hash=approval_request.blockchain_tx_hash or '',
            timestamp=int(datetime.utcnow().timestamp()),
            is_active=True
        )
        
        db.session.add(doc)
        logger.info(f"✅ Created document in {folder_type.capitalize()}/{status.capitalize()} for user {user_id}")
        return doc
    
    @staticmethod
    def move_document(approval_request, user_id, folder_type, from_status, to_status, use_stamped=False):
        """
        Move a document from one status folder to another
        
        Args:
            approval_request: The ApprovalRequest object
            user_id: The user who owns the folder
            folder_type: 'sent' or 'received'
            from_status: Current status folder ('pending', 'approved', 'rejected', 'canceled')
            to_status: New status folder
            use_stamped: Whether to use the stamped document for the new location
        
        Returns:
            Document object or None
        """
        try:
            # Delete from old folder
            ipfs_hash = approval_request.document_ipfs_hash
            ApprovalFolderService.delete_document_from_folder(user_id, folder_type, from_status, ipfs_hash)
            
            # Create in new folder (use stamped version if approved)
            is_stamped = use_stamped or (to_status.lower() == 'approved' and approval_request.stamped_document_ipfs_hash)
            doc = ApprovalFolderService.create_document_in_folder(
                approval_request, user_id, folder_type, to_status, is_stamped
            )
            
            logger.info(f"📦 Moved document from {folder_type}/{from_status} to {folder_type}/{to_status}")
            return doc
            
        except Exception as e:
            logger.error(f"❌ Error moving document: {str(e)}")
            return None
    
    # ========== HIGH-LEVEL WORKFLOW METHODS ==========
    
    @staticmethod
    def on_request_created(approval_request):
        """
        Called when a new approval request is created.
        - Adds document to requester's Sent/Pending folder
        - Adds document to all approvers' Received/Pending folders
        """
        try:
            from app.models.approval import ApprovalStep
            
            # Add to requester's Sent/Pending
            ApprovalFolderService.create_document_in_folder(
                approval_request,
                approval_request.requester_id,
                'sent',
                'pending'
            )
            logger.info(f"📤 Added document to Sent/Pending for requester {approval_request.requester_id}")
            
            # Add to all approvers' Received/Pending
            steps = ApprovalStep.query.filter_by(
                blockchain_request_id=approval_request.request_id
            ).all()
            
            for step in steps:
                ApprovalFolderService.create_document_in_folder(
                    approval_request,
                    step.approver_id,
                    'received',
                    'pending'
                )
                logger.info(f"📥 Added document to Received/Pending for approver {step.approver_id}")
            
            db.session.flush()
            logger.info(f"✅ Created initial folder references for approval request {approval_request.request_id}")
            
        except Exception as e:
            logger.error(f"❌ Error creating folder references: {str(e)}")
    
    @staticmethod
    def on_approved(approval_request, approver_id):
        """
        Called when an approval step is approved.
        - Moves document from Received/Pending to Received/Approved for the approver
        - If fully approved, moves document from Sent/Pending to Sent/Approved for requester
        """
        try:
            # Move approver's document from Pending to Approved
            ApprovalFolderService.move_document(
                approval_request,
                approver_id,
                'received',
                'pending',
                'approved',
                use_stamped=True
            )
            logger.info(f"✅ Moved to Received/Approved for approver {approver_id}")
            
            # If fully approved, move requester's document too
            if approval_request.status == 'APPROVED':
                ApprovalFolderService.move_document(
                    approval_request,
                    approval_request.requester_id,
                    'sent',
                    'pending',
                    'approved',
                    use_stamped=True
                )
                logger.info(f"✅ Moved to Sent/Approved for requester {approval_request.requester_id}")
            
            db.session.flush()
            
        except Exception as e:
            logger.error(f"❌ Error on approval: {str(e)}")
    
    @staticmethod
    def on_rejected(approval_request, approver_id):
        """
        Called when an approval step is rejected.
        - Moves document from Received/Pending to Received/Rejected for the approver
        - Moves document from Sent/Pending to Sent/Rejected for requester
        """
        try:
            # Move approver's document from Pending to Rejected
            ApprovalFolderService.move_document(
                approval_request,
                approver_id,
                'received',
                'pending',
                'rejected'
            )
            logger.info(f"❌ Moved to Received/Rejected for approver {approver_id}")
            
            # Move requester's document from Pending to Rejected
            ApprovalFolderService.move_document(
                approval_request,
                approval_request.requester_id,
                'sent',
                'pending',
                'rejected'
            )
            logger.info(f"❌ Moved to Sent/Rejected for requester {approval_request.requester_id}")
            
            db.session.flush()
            
        except Exception as e:
            logger.error(f"❌ Error on rejection: {str(e)}")
    
    @staticmethod
    def on_canceled(approval_request):
        """
        Called when an approval request is canceled.
        - Moves document from Sent/Pending to Sent/Canceled for requester
        - Removes document from all approvers' Received/Pending folders
        """
        try:
            from app.models.approval import ApprovalStep
            
            # Move requester's document from Pending to Canceled
            ApprovalFolderService.move_document(
                approval_request,
                approval_request.requester_id,
                'sent',
                'pending',
                'canceled'
            )
            logger.info(f"🚫 Moved to Sent/Canceled for requester {approval_request.requester_id}")
            
            # Remove from all approvers' Received/Pending folders
            steps = ApprovalStep.query.filter_by(
                blockchain_request_id=approval_request.request_id
            ).all()
            
            for step in steps:
                ApprovalFolderService.delete_document_from_folder(
                    step.approver_id,
                    'received',
                    'pending',
                    approval_request.document_ipfs_hash
                )
                logger.info(f"🗑️ Removed from Received/Pending for approver {step.approver_id}")
            
            db.session.flush()
            
        except Exception as e:
            logger.error(f"❌ Error on cancellation: {str(e)}")


# Create a singleton instance for easy import
approval_folder_service = ApprovalFolderService()
