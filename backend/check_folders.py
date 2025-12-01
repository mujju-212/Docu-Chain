"""Check folder structure for admin user"""
from app import create_app, db
from app.models.folder import Folder
from app.models.user import User

app = create_app()
with app.app_context():
    admin = User.query.filter_by(email='admin@mu.ac.in').first()
    
    if admin:
        print(f'Admin ID: {admin.id}')
        print()
        print('=== Folder Structure for Admin ===')
        
        # Get all folders for admin
        folders = Folder.query.filter_by(owner_id=admin.id).all()
        
        # Build tree
        root_folders = [f for f in folders if f.parent_id is None]
        
        def print_folder(folder, indent=0):
            prefix = '  ' * indent
            print(f'{prefix}- {folder.name} (ID: {folder.id})')
            children = [f for f in folders if str(f.parent_id) == str(folder.id)]
            for child in children:
                print_folder(child, indent + 1)
        
        for folder in root_folders:
            print_folder(folder)
        
        # Find the Shared > Received folder specifically
        print()
        print('=== Looking for Shared > Received folder ===')
        shared_folder = Folder.query.filter_by(owner_id=admin.id, name='Shared', parent_id=None).first()
        if shared_folder:
            print(f'Found Shared folder: {shared_folder.id}')
            received_folder = Folder.query.filter_by(owner_id=admin.id, name='Received', parent_id=shared_folder.id).first()
            if received_folder:
                print(f'Found Received folder: {received_folder.id}')
            else:
                print('Received folder NOT found under Shared!')
        else:
            print('Shared folder NOT found!')
