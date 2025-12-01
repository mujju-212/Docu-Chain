"""
Cleanup script to remove documents from database that:
1. Don't exist on the blockchain
2. Have invalid owner addresses (0x000...000)

This ensures database is in sync with blockchain state.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from web3 import Web3
from app import create_app, db
from app.models import Document

# Sepolia network configuration
SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"
CONTRACT_ADDRESS = "0xb19f78B9c32dceaA01DE778Fa46784F5437DF373"

# DocumentManagerV2 ABI (minimal for documentExists and getDocument)
CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "name": "documentExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "_documentId", "type": "bytes32"}],
        "name": "getDocument",
        "outputs": [
            {
                "components": [
                    {"internalType": "string", "name": "ipfsHash", "type": "string"},
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "string", "name": "fileName", "type": "string"},
                    {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
                    {"internalType": "bool", "name": "isActive", "type": "bool"},
                    {"internalType": "string", "name": "documentType", "type": "string"},
                    {"internalType": "uint256", "name": "version", "type": "uint256"}
                ],
                "internalType": "struct DocumentManagerV2.Document",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

def cleanup_documents(dry_run=True):
    """
    Clean up documents that are not properly on blockchain.
    
    Args:
        dry_run: If True, only show what would be deleted without actually deleting
    """
    
    # Connect to Sepolia
    w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
    if not w3.is_connected():
        print("❌ Failed to connect to Sepolia network")
        return
    
    print(f"✅ Connected to Sepolia (Chain ID: {w3.eth.chain_id})")
    print(f"📋 Contract Address: {CONTRACT_ADDRESS}")
    print(f"🔧 Mode: {'DRY RUN (no changes)' if dry_run else '⚠️  LIVE MODE - Will delete documents!'}")
    
    # Get contract instance
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        # Get all documents
        all_docs = Document.query.filter(Document.is_active == True).all()
        
        print(f"\n{'='*80}")
        print(f"ANALYZING {len(all_docs)} DOCUMENTS")
        print(f"{'='*80}\n")
        
        to_delete = []
        to_update_owner = []
        valid_docs = []
        
        for doc in all_docs:
            doc_id = doc.document_id
            file_name = doc.file_name or 'Unknown'
            
            # Check if document has no blockchain ID at all
            if not doc_id:
                print(f"❌ NO BLOCKCHAIN ID: {file_name[:50]}")
                to_delete.append({
                    'doc': doc,
                    'reason': 'No blockchain ID'
                })
                continue
            
            # Check if blockchain ID format is invalid (not starting with 0x or wrong length)
            is_valid_format = (
                isinstance(doc_id, str) and 
                doc_id.startswith('0x') and 
                len(doc_id) == 66
            )
            
            if not is_valid_format:
                print(f"❌ INVALID ID FORMAT: {file_name[:50]} (ID: {doc_id})")
                to_delete.append({
                    'doc': doc,
                    'reason': f'Invalid blockchain ID format: {doc_id}'
                })
                continue
            
            # Check if document exists on blockchain
            try:
                doc_id_bytes = bytes.fromhex(doc_id[2:])
                exists = contract.functions.documentExists(doc_id_bytes).call()
                
                if not exists:
                    print(f"❌ NOT ON BLOCKCHAIN: {file_name[:50]}")
                    to_delete.append({
                        'doc': doc,
                        'reason': 'Document ID not found on blockchain'
                    })
                    continue
                
                # Document exists - check owner
                blockchain_doc = contract.functions.getDocument(doc_id_bytes).call()
                blockchain_owner = blockchain_doc[1]
                is_active_on_chain = blockchain_doc[5]
                
                # Check if owner is zero address
                if blockchain_owner.lower() == ZERO_ADDRESS.lower():
                    print(f"⚠️  ZERO OWNER: {file_name[:50]} - Owner is {ZERO_ADDRESS}")
                    # Zero owner means document was somehow registered but owner not set properly
                    # This is an invalid state, mark for deletion
                    to_delete.append({
                        'doc': doc,
                        'reason': 'Document has zero address as owner on blockchain'
                    })
                    continue
                
                # Check if document is inactive on blockchain
                if not is_active_on_chain:
                    print(f"⚠️  INACTIVE ON CHAIN: {file_name[:50]}")
                    to_delete.append({
                        'doc': doc,
                        'reason': 'Document is marked inactive on blockchain'
                    })
                    continue
                
                # Document is valid!
                # Check if DB owner_address matches blockchain owner
                db_owner = doc.owner_address or ''
                if db_owner.lower() != blockchain_owner.lower():
                    print(f"🔄 OWNER MISMATCH: {file_name[:50]}")
                    print(f"   DB: {db_owner or 'None'}")
                    print(f"   Blockchain: {blockchain_owner}")
                    to_update_owner.append({
                        'doc': doc,
                        'new_owner': blockchain_owner
                    })
                
                valid_docs.append({
                    'doc': doc,
                    'owner': blockchain_owner
                })
                print(f"✅ VALID: {file_name[:50]} | Owner: {blockchain_owner[:10]}...")
                
            except Exception as e:
                print(f"⚠️  ERROR checking {file_name[:50]}: {str(e)[:80]}")
                to_delete.append({
                    'doc': doc,
                    'reason': f'Error verifying on blockchain: {str(e)[:50]}'
                })
        
        # Summary
        print(f"\n{'='*80}")
        print("SUMMARY")
        print(f"{'='*80}")
        print(f"✅ Valid documents: {len(valid_docs)}")
        print(f"🔄 Need owner update: {len(to_update_owner)}")
        print(f"❌ To be deleted: {len(to_delete)}")
        
        if to_delete:
            print(f"\n{'='*80}")
            print("DOCUMENTS TO DELETE")
            print(f"{'='*80}")
            for item in to_delete:
                doc = item['doc']
                print(f"\n📄 {doc.file_name or 'Unknown'}")
                print(f"   DB ID: {doc.id}")
                print(f"   Blockchain ID: {doc.document_id or 'None'}")
                print(f"   Reason: {item['reason']}")
        
        if to_update_owner:
            print(f"\n{'='*80}")
            print("DOCUMENTS TO UPDATE OWNER")
            print(f"{'='*80}")
            for item in to_update_owner:
                doc = item['doc']
                print(f"\n📄 {doc.file_name or 'Unknown'}")
                print(f"   Current owner: {doc.owner_address or 'None'}")
                print(f"   New owner: {item['new_owner']}")
        
        if dry_run:
            print(f"\n{'='*80}")
            print("⚠️  DRY RUN - No changes made")
            print("Run with --execute to perform actual cleanup")
            print(f"{'='*80}")
        else:
            print(f"\n{'='*80}")
            print("🔧 EXECUTING CLEANUP...")
            print(f"{'='*80}")
            
            # Update owners
            updated_count = 0
            for item in to_update_owner:
                try:
                    item['doc'].owner_address = item['new_owner']
                    updated_count += 1
                    print(f"✅ Updated owner for: {item['doc'].file_name}")
                except Exception as e:
                    print(f"❌ Failed to update owner for {item['doc'].file_name}: {e}")
            
            # Delete documents
            deleted_count = 0
            for item in to_delete:
                try:
                    doc = item['doc']
                    # Mark as inactive instead of hard delete
                    doc.is_active = False
                    deleted_count += 1
                    print(f"✅ Deactivated: {doc.file_name}")
                except Exception as e:
                    print(f"❌ Failed to deactivate {item['doc'].file_name}: {e}")
            
            # Commit changes
            try:
                db.session.commit()
                print(f"\n✅ Changes committed to database")
                print(f"   - Updated owners: {updated_count}")
                print(f"   - Deactivated documents: {deleted_count}")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Failed to commit changes: {e}")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Cleanup blockchain orphan documents')
    parser.add_argument('--execute', action='store_true', 
                        help='Actually execute the cleanup (default is dry run)')
    args = parser.parse_args()
    
    cleanup_documents(dry_run=not args.execute)
