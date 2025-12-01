"""
Verify if documents in the database actually exist on the blockchain.
This script queries the smart contract directly to check document existence.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from web3 import Web3
from app import create_app
from app.models import Document, User
from app import db

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

def verify_documents():
    """Verify documents against blockchain"""
    
    # Connect to Sepolia
    w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
    if not w3.is_connected():
        print("❌ Failed to connect to Sepolia network")
        return
    
    print(f"✅ Connected to Sepolia (Chain ID: {w3.eth.chain_id})")
    print(f"📋 Contract Address: {CONTRACT_ADDRESS}")
    
    # Get contract instance
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        # Get documents with valid-looking blockchain IDs
        docs = Document.query.filter(
            Document.is_active == True,
            Document.document_id != None,
            Document.document_id.like('0x%')
        ).all()
        
        print(f"\n{'='*80}")
        print("BLOCKCHAIN VERIFICATION")
        print(f"{'='*80}\n")
        print(f"Documents with valid format (0x prefix): {len(docs)}")
        
        exists_count = 0
        not_exists_count = 0
        error_count = 0
        
        existing_docs = []
        non_existing_docs = []
        
        for doc in docs:
            doc_id = doc.document_id
            try:
                # Convert hex string to bytes32
                doc_id_bytes = bytes.fromhex(doc_id[2:]) if doc_id.startswith('0x') else bytes.fromhex(doc_id)
                
                # Check if document exists using the public mapping
                exists = contract.functions.documentExists(doc_id_bytes).call()
                
                if exists:
                    exists_count += 1
                    # Get document details from blockchain
                    try:
                        blockchain_doc = contract.functions.getDocument(doc_id_bytes).call()
                        existing_docs.append({
                            'db_id': doc.id,
                            'file_name': doc.file_name,
                            'blockchain_id': doc_id,
                            'blockchain_owner': blockchain_doc[1],
                            'blockchain_filename': blockchain_doc[3],
                            'is_active_on_chain': blockchain_doc[5]
                        })
                        print(f"✅ EXISTS: {doc.file_name[:40]:<40} | Owner: {blockchain_doc[1][:10]}...")
                    except Exception as e:
                        exists_count += 1
                        print(f"✅ EXISTS (but getDocument failed): {doc.file_name[:40]:<40}")
                else:
                    not_exists_count += 1
                    non_existing_docs.append({
                        'db_id': doc.id,
                        'file_name': doc.file_name,
                        'blockchain_id': doc_id
                    })
                    print(f"❌ NOT ON BLOCKCHAIN: {doc.file_name[:40]:<40}")
                    
            except Exception as e:
                error_count += 1
                print(f"⚠️  ERROR checking {doc.file_name[:40]:<40}: {str(e)[:50]}")
        
        print(f"\n{'='*80}")
        print("SUMMARY")
        print(f"{'='*80}")
        print(f"✅ Exists on blockchain: {exists_count}")
        print(f"❌ NOT on blockchain:    {not_exists_count}")
        print(f"⚠️  Errors:              {error_count}")
        
        if existing_docs:
            print(f"\n{'='*80}")
            print("DOCUMENTS THAT EXIST ON BLOCKCHAIN (CAN BE SHARED)")
            print(f"{'='*80}")
            for doc in existing_docs[:10]:  # Show first 10
                print(f"\n📄 {doc['file_name']}")
                print(f"   Blockchain ID: {doc['blockchain_id']}")
                print(f"   Owner on chain: {doc['blockchain_owner']}")
                print(f"   Active on chain: {doc['is_active_on_chain']}")
        
        if non_existing_docs:
            print(f"\n{'='*80}")
            print("DOCUMENTS NOT ON BLOCKCHAIN (CANNOT BE SHARED VIA BLOCKCHAIN)")
            print(f"{'='*80}")
            for doc in non_existing_docs[:10]:  # Show first 10
                print(f"\n📄 {doc['file_name']}")
                print(f"   DB ID: {doc['db_id']}")
                print(f"   Stored Blockchain ID: {doc['blockchain_id']}")
                print(f"   ⚠️  This document was uploaded to DB but never registered on blockchain")

if __name__ == '__main__':
    verify_documents()
