"""
Migration script to update folder structure for Document Approval
- Removes old Approved/Rejected folders from root
- Creates new Document Approval folder structure
"""
from app import create_app, db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document

app = create_app()

def migrate_folders_for_user(user):
    """Migrate folder structure for a user"""
    print(f"\n📁 Migrating folders for: {user.email} (Role: {user.role})")
    
    user_role = (user.role or '').lower()
    changes_made = []
    
    # Get all root-level folders for this user
    root_folders = Folder.query.filter_by(owner_id=user.id, parent_id=None).all()
    root_folder_names = {f.name: f for f in root_folders}
    
    # 1. Delete old Approved folder from root (if exists and empty)
    if "Approved" in root_folder_names:
        approved_folder = root_folder_names["Approved"]
        # Check if it has any documents
        docs_count = Document.query.filter_by(folder_id=approved_folder.id).count()
        subfolders_count = Folder.query.filter_by(parent_id=approved_folder.id).count()
        
        if docs_count == 0 and subfolders_count == 0:
            db.session.delete(approved_folder)
            changes_made.append("Removed empty Approved folder from root")
        else:
            print(f"   ⚠️  Approved folder has {docs_count} documents and {subfolders_count} subfolders - not deleting")
    
    # 2. Delete old Rejected folder from root (if exists and empty)
    if "Rejected" in root_folder_names:
        rejected_folder = root_folder_names["Rejected"]
        docs_count = Document.query.filter_by(folder_id=rejected_folder.id).count()
        subfolders_count = Folder.query.filter_by(parent_id=rejected_folder.id).count()
        
        if docs_count == 0 and subfolders_count == 0:
            db.session.delete(rejected_folder)
            changes_made.append("Removed empty Rejected folder from root")
        else:
            print(f"   ⚠️  Rejected folder has {docs_count} documents and {subfolders_count} subfolders - not deleting")
    
    # 3. Create Document Approval folder structure (if not exists)
    if "Document Approval" not in root_folder_names:
        # Create main Document Approval folder
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
        
        # Create Sent folder
        sent_folder = Folder(
            name="Sent",
            owner_id=user.id,
            parent_id=doc_approval_folder.id,
            path="/Document Approval/Sent",
            level=1,
            is_system_folder=True
        )
        db.session.add(sent_folder)
        db.session.flush()
        
        # Create subfolders under Sent: Approved, Rejected, Pending, Canceled
        for status_name in ["Approved", "Rejected", "Pending", "Canceled"]:
            status_folder = Folder(
                name=status_name,
                owner_id=user.id,
                parent_id=sent_folder.id,
                path=f"/Document Approval/Sent/{status_name}",
                level=2,
                is_system_folder=True
            )
            db.session.add(status_folder)
        
        changes_made.append("Created Document Approval/Sent with subfolders")
        
        # Create Received folder (only for faculty and admin)
        if user_role in ['faculty', 'admin', 'staff']:
            received_folder = Folder(
                name="Received",
                owner_id=user.id,
                parent_id=doc_approval_folder.id,
                path="/Document Approval/Received",
                level=1,
                is_system_folder=True
            )
            db.session.add(received_folder)
            db.session.flush()
            
            # Create subfolders under Received: Approved, Rejected, Pending
            for status_name in ["Approved", "Rejected", "Pending"]:
                status_folder = Folder(
                    name=status_name,
                    owner_id=user.id,
                    parent_id=received_folder.id,
                    path=f"/Document Approval/Received/{status_name}",
                    level=2,
                    is_system_folder=True
                )
                db.session.add(status_folder)
            
            changes_made.append("Created Document Approval/Received with subfolders")
    else:
        print(f"   ℹ️  Document Approval folder already exists")
    
    if changes_made:
        print(f"   ✅ Changes: {', '.join(changes_made)}")
    else:
        print(f"   ℹ️  No changes needed")
    
    return len(changes_made)


with app.app_context():
    try:
        print("🚀 Migrating folder structure for Document Approval...")
        print("=" * 70)
        print("\nThis migration will:")
        print("  1. Remove empty Approved/Rejected folders from root level")
        print("  2. Create new 'Document Approval' folder with:")
        print("     - Sent/Approved, Sent/Rejected, Sent/Pending, Sent/Canceled")
        print("     - Received/Approved, Received/Rejected, Received/Pending (faculty/admin only)")
        print("=" * 70)
        
        # Get all users
        users = User.query.all()
        print(f"\n📊 Found {len(users)} users")
        
        total_changes = 0
        
        for user in users:
            changes_count = migrate_folders_for_user(user)
            total_changes += changes_count
        
        db.session.commit()
        
        print("\n" + "=" * 70)
        print(f"✅ Migration complete! Made {total_changes} changes.")
        print("✅ All new folders are marked as system folders (protected)")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
