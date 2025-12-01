"""
Script to check which documents in the database exist on the blockchain.
This helps identify orphaned records where document_id doesn't match blockchain.

Usage: python check_blockchain_documents.py
"""

import os
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.document import Document

def check_documents():
    """List all documents and their blockchain IDs"""
    app = create_app()
    
    with app.app_context():
        documents = Document.query.filter_by(is_active=True).all()
        
        print(f"\n{'='*80}")
        print(f"DOCUMENT DATABASE CHECK")
        print(f"{'='*80}")
        print(f"\nTotal documents in database: {len(documents)}")
        print(f"\n{'='*80}")
        
        valid_blockchain_ids = 0
        invalid_blockchain_ids = 0
        
        for doc in documents:
            doc_id = doc.document_id
            
            # Check if document_id has valid format (0x + 64 hex chars)
            is_valid = (
                doc_id and 
                isinstance(doc_id, str) and 
                doc_id.startswith('0x') and 
                len(doc_id) == 66
            )
            
            # Also check if it's 64 chars without 0x prefix
            is_fixable = (
                doc_id and 
                isinstance(doc_id, str) and 
                not doc_id.startswith('0x') and 
                len(doc_id) == 64 and
                all(c in '0123456789abcdefABCDEF' for c in doc_id)
            )
            
            status = "✅ VALID" if is_valid else ("⚠️ FIXABLE (missing 0x)" if is_fixable else "❌ INVALID")
            
            if is_valid:
                valid_blockchain_ids += 1
            else:
                invalid_blockchain_ids += 1
            
            print(f"\n📄 {doc.file_name}")
            print(f"   Database ID: {doc.id}")
            print(f"   Blockchain ID: {doc_id}")
            print(f"   Length: {len(doc_id) if doc_id else 0}")
            print(f"   Starts with 0x: {doc_id.startswith('0x') if doc_id else False}")
            print(f"   Status: {status}")
            print(f"   Transaction Hash: {doc.transaction_hash}")
            print(f"   Owner Address: {doc.owner_address}")
        
        print(f"\n{'='*80}")
        print(f"SUMMARY")
        print(f"{'='*80}")
        print(f"✅ Valid blockchain IDs: {valid_blockchain_ids}")
        print(f"❌ Invalid/Missing IDs: {invalid_blockchain_ids}")
        print(f"\n")
        
        # Show documents that need the 0x prefix added
        fixable_docs = [doc for doc in documents if doc.document_id and not doc.document_id.startswith('0x') and len(doc.document_id) == 64]
        if fixable_docs:
            print(f"⚠️ Documents that need 0x prefix added:")
            for doc in fixable_docs:
                print(f"   - {doc.file_name}: {doc.document_id}")
            
            response = input("\nDo you want to fix these document IDs by adding 0x prefix? (y/n): ")
            if response.lower() == 'y':
                for doc in fixable_docs:
                    old_id = doc.document_id
                    doc.document_id = '0x' + doc.document_id
                    print(f"   Fixed: {doc.file_name}")
                    print(f"     Old: {old_id}")
                    print(f"     New: {doc.document_id}")
                db.session.commit()
                print("\n✅ All fixable documents updated!")

if __name__ == '__main__':
    check_documents()
