"""
Create default folder structure for all users
"""
from app import create_app, db
from app.models.user import User
from app.models.folder import Folder
from app.models.institution import Institution

app = create_app()

def create_default_folders_for_user(user):
    """Create default folder structure for a user"""
    print(f"\n📁 Creating default folders for: {user.email}")
    
    # Check if user already has default folders
    existing_folders = Folder.query.filter_by(owner_id=user.id, parent_id=None).all()
    existing_folder_names = [f.name for f in existing_folders]
    
    folders_created = []
    
    # 1. Shared folder with subfolders
    if "Shared" not in existing_folder_names:
        shared_folder = Folder(
            name="Shared",
            owner_id=user.id,
            parent_id=None,
            path="/Shared",
            level=0,
            is_system_folder=True  # Mark as protected
        )
        db.session.add(shared_folder)
        db.session.flush()  # Get the ID
        
        # Sent subfolder
        sent_folder = Folder(
            name="Sent",
            owner_id=user.id,
            parent_id=shared_folder.id,
            path="/Shared/Sent",
            level=1,
            is_system_folder=True
        )
        db.session.add(sent_folder)
        
        # Received subfolder
        received_folder = Folder(
            name="Received",
            owner_id=user.id,
            parent_id=shared_folder.id,
            path="/Shared/Received",
            level=1,
            is_system_folder=True
        )
        db.session.add(received_folder)
        
        folders_created.append("Shared (with Sent & Received)")
    
    # 2. Generated folder with subfolders
    if "Generated" not in existing_folder_names:
        generated_folder = Folder(
            name="Generated",
            owner_id=user.id,
            parent_id=None,
            path="/Generated",
            level=0,
            is_system_folder=True
        )
        db.session.add(generated_folder)
        db.session.flush()
        
        # Approved subfolder
        approved_folder = Folder(
            name="Approved",
            owner_id=user.id,
            parent_id=generated_folder.id,
            path="/Generated/Approved",
            level=1,
            is_system_folder=True
        )
        db.session.add(approved_folder)
        
        # Rejected subfolder
        rejected_folder = Folder(
            name="Rejected",
            owner_id=user.id,
            parent_id=generated_folder.id,
            path="/Generated/Rejected",
            level=1,
            is_system_folder=True
        )
        db.session.add(rejected_folder)
        
        folders_created.append("Generated (with Approved & Rejected)")
    
    # 3. Department folder (if user has department)
    if user.department_id:
        from app.models.institution import Department
        department = Department.query.get(user.department_id)
        if department and department.name not in existing_folder_names:
            dept_folder = Folder(
                name=department.name,
                owner_id=user.id,
                parent_id=None,
                path=f"/{department.name}",
                level=0,
                is_system_folder=True
            )
            db.session.add(dept_folder)
            folders_created.append(f"Department: {department.name}")
    
    # 4. Institution folder (if user has institution)
    if user.institution_id:
        institution = Institution.query.get(user.institution_id)
        if institution and institution.name not in existing_folder_names:
            inst_folder = Folder(
                name=institution.name,
                owner_id=user.id,
                parent_id=None,
                path=f"/{institution.name}",
                level=0,
                is_system_folder=True
            )
            db.session.add(inst_folder)
            folders_created.append(f"Institution: {institution.name}")
    
    if folders_created:
        print(f"   ✅ Created: {', '.join(folders_created)}")
    else:
        print(f"   ℹ️  All default folders already exist")
    
    return len(folders_created)


with app.app_context():
    try:
        print("🚀 Creating default folder structure for all users...")
        print("=" * 60)
        
        # Get all users
        users = User.query.all()
        print(f"\n📊 Found {len(users)} users")
        
        total_created = 0
        
        for user in users:
            created_count = create_default_folders_for_user(user)
            total_created += created_count
        
        db.session.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Successfully created {total_created} default folders!")
        print("✅ All default folders are marked as system folders (protected)")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
