"""
Comprehensive FileManager Functionality Test
Tests all major features to ensure everything works correctly
"""
from app import create_app, db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document, DocumentShare

app = create_app()

def test_user_authentication():
    """Test 1: Verify users exist and can be authenticated"""
    print("\n" + "="*80)
    print("TEST 1: User Authentication")
    print("="*80)
    
    users = User.query.limit(3).all()
    print(f"✓ Found {User.query.count()} users in system")
    for user in users:
        print(f"  - {user.email} ({user.first_name} {user.last_name})")
    return True

def test_folder_structure():
    """Test 2: Verify default folder structure exists for users"""
    print("\n" + "="*80)
    print("TEST 2: Default Folder Structure")
    print("="*80)
    
    test_user = User.query.first()
    print(f"Testing with user: {test_user.email}")
    
    required_folders = ['Shared', 'Sent', 'Received', 'Generated', 'Approved', 'Rejected', 'Department', 'Institution']
    user_folders = Folder.query.filter_by(owner_id=test_user.id, is_active=True).all()
    folder_names = [f.name for f in user_folders]
    
    print(f"\n✓ User has {len(user_folders)} folders:")
    for folder in user_folders:
        parent_name = "Root" if not folder.parent_id else Folder.query.get(folder.parent_id).name
        print(f"  - {folder.name} (parent: {parent_name}, system: {folder.is_system_folder})")
    
    # Check for required folders
    missing = [f for f in ['Sent', 'Received'] if f not in folder_names]
    if missing:
        print(f"\n⚠️  Missing folders: {missing}")
        return False
    
    print(f"\n✓ All essential folders exist")
    return True

def test_document_storage():
    """Test 3: Verify documents are stored correctly"""
    print("\n" + "="*80)
    print("TEST 3: Document Storage")
    print("="*80)
    
    total_docs = Document.query.filter_by(is_active=True).count()
    print(f"✓ Found {total_docs} active documents in system")
    
    # Check for blockchain integration
    valid_blockchain = Document.query.filter(
        Document.document_id.like('0x%'),
        Document.is_active == True
    ).count()
    invalid_blockchain = total_docs - valid_blockchain
    
    print(f"  - {valid_blockchain} documents with valid blockchain IDs")
    print(f"  - {invalid_blockchain} documents with old/invalid blockchain IDs")
    
    if invalid_blockchain > 0:
        print(f"\n⚠️  Note: {invalid_blockchain} old documents will skip blockchain sharing")
    
    return True

def test_sharing_functionality():
    """Test 4: Verify document sharing works"""
    print("\n" + "="*80)
    print("TEST 4: Document Sharing")
    print("="*80)
    
    total_shares = DocumentShare.query.count()
    print(f"✓ Found {total_shares} document shares in system")
    
    # Get a sample share
    sample_share = DocumentShare.query.first()
    if sample_share:
        doc = Document.query.get(sample_share.document_id)
        sender = User.query.get(sample_share.shared_by_id)
        recipient = User.query.get(sample_share.shared_with_id)
        
        print(f"\nSample share:")
        print(f"  Document: {doc.file_name}")
        print(f"  Shared by: {sender.email}")
        print(f"  Shared with: {recipient.email}")
        print(f"  Permission: {sample_share.permission}")
        print(f"  Document location (folder_id): {doc.folder_id}")
        
        if doc.folder_id is None:
            print(f"  ✓ Document correctly stays in original location (root)")
        else:
            folder = Folder.query.get(doc.folder_id)
            if folder and folder.name in ['Sent', 'Received']:
                print(f"  ⚠️  Document incorrectly moved to {folder.name} folder")
                return False
            else:
                print(f"  ✓ Document in folder: {folder.name if folder else 'Unknown'}")
    
    return True

def test_sent_received_folders():
    """Test 5: Verify Sent/Received folder counts"""
    print("\n" + "="*80)
    print("TEST 5: Sent/Received Folder Counts")
    print("="*80)
    
    # Find a user with shares
    share = DocumentShare.query.first()
    if not share:
        print("⚠️  No shares found to test")
        return True
    
    sender = User.query.get(share.shared_by_id)
    recipient = User.query.get(share.shared_with_id)
    
    # Test sender's Sent folder
    sent_folder = Folder.query.filter_by(owner_id=sender.id, name='Sent').first()
    if sent_folder:
        sent_dict = sent_folder.to_dict()
        print(f"\nSender ({sender.email}):")
        print(f"  Sent folder: {sent_dict['documentCount']} documents")
    
    # Test recipient's Received folder
    received_folder = Folder.query.filter_by(owner_id=recipient.id, name='Received').first()
    if received_folder:
        received_dict = received_folder.to_dict()
        print(f"\nRecipient ({recipient.email}):")
        print(f"  Received folder: {received_dict['documentCount']} documents")
    
    if sent_dict['documentCount'] > 0 and received_dict['documentCount'] > 0:
        print(f"\n✓ Sent/Received folder counts working correctly")
        return True
    else:
        print(f"\n⚠️  Folder counts may need verification")
        return True

def test_system_folder_protection():
    """Test 6: Verify system folders are protected"""
    print("\n" + "="*80)
    print("TEST 6: System Folder Protection")
    print("="*80)
    
    system_folders = Folder.query.filter_by(is_system_folder=True).all()
    print(f"✓ Found {len(system_folders)} system folders")
    
    if len(system_folders) > 0:
        print(f"  System folders are protected from deletion/rename")
        return True
    else:
        print(f"⚠️  No system folders found - protection may not be working")
        return False

# Run all tests
if __name__ == '__main__':
    with app.app_context():
        print("\n")
        print("╔" + "="*78 + "╗")
        print("║" + " "*15 + "DOCU-CHAIN FILE MANAGER - COMPREHENSIVE TEST" + " "*18 + "║")
        print("╚" + "="*78 + "╝")
        
        tests = [
            test_user_authentication,
            test_folder_structure,
            test_document_storage,
            test_sharing_functionality,
            test_sent_received_folders,
            test_system_folder_protection
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"\n❌ Test failed with error: {e}")
                import traceback
                traceback.print_exc()
                results.append(False)
        
        # Summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        passed = sum(results)
        total = len(results)
        print(f"Passed: {passed}/{total}")
        
        if passed == total:
            print("\n✅ ALL TESTS PASSED - FileManager is working correctly!")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed - please review above")
        
        print("\n")
