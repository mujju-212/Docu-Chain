import Web3 from 'web3'
import toast from 'react-hot-toast'

// This will be populated with the actual ABI after contract deployment
import CONTRACT_ABI from '../contracts/DocumentManager.json'

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY

class BlockchainService {
  constructor() {
    this.web3 = null
    this.contract = null
    this.account = null
  }

  // Initialize Web3 and contract
  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    this.web3 = new Web3(window.ethereum)
    
    // Initialize contract
    this.contract = new this.web3.eth.Contract(CONTRACT_ABI.abi || [], CONTRACT_ADDRESS)
    
    // Get current account
    const accounts = await this.web3.eth.getAccounts()
    this.account = accounts[0]

    return this.account
  }

  // Upload document to blockchain
  async uploadDocument(ipfsHash, fileName, fileSize, documentType) {
    try {
      if (!this.contract || !this.account) {
        await this.initialize()
      }

      const gasEstimate = await this.contract.methods
        .uploadDocument(ipfsHash, fileName, fileSize, documentType)
        .estimateGas({ from: this.account })

      const tx = await this.contract.methods
        .uploadDocument(ipfsHash, fileName, fileSize, documentType)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        })

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        documentId: tx.events.DocumentUploaded?.returnValues?.documentId,
      }
    } catch (error) {
      console.error('Error uploading to blockchain:', error)
      throw error
    }
  }

  // Get document details from blockchain
  async getDocument(documentId) {
    try {
      if (!this.contract) {
        await this.initialize()
      }

      const document = await this.contract.methods.getDocument(documentId).call()
      
      return {
        ipfsHash: document.ipfsHash,
        owner: document.owner,
        timestamp: Number(document.timestamp),
        fileName: document.fileName,
        fileSize: Number(document.fileSize),
        isActive: document.isActive,
        documentType: document.documentType,
      }
    } catch (error) {
      console.error('Error getting document from blockchain:', error)
      throw error
    }
  }

  // Share document on blockchain
  async shareDocument(documentId, recipientAddress, permission) {
    try {
      if (!this.contract || !this.account) {
        await this.initialize()
      }

      const gasEstimate = await this.contract.methods
        .shareDocument(documentId, recipientAddress, permission)
        .estimateGas({ from: this.account })

      const tx = await this.contract.methods
        .shareDocument(documentId, recipientAddress, permission)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2),
        })

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      }
    } catch (error) {
      console.error('Error sharing document on blockchain:', error)
      throw error
    }
  }

  // Request document approval
  async requestApproval(documentId, approvers, approvalType, process) {
    try {
      if (!this.contract || !this.account) {
        await this.initialize()
      }

      const gasEstimate = await this.contract.methods
        .requestApproval(documentId, approvers, approvalType, process)
        .estimateGas({ from: this.account })

      const tx = await this.contract.methods
        .requestApproval(documentId, approvers, approvalType, process)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2),
        })

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        requestId: tx.events.ApprovalRequested?.returnValues?.requestId,
      }
    } catch (error) {
      console.error('Error requesting approval:', error)
      throw error
    }
  }

  // Approve document
  async approveDocument(requestId, signature = null) {
    try {
      if (!this.contract || !this.account) {
        await this.initialize()
      }

      const gasEstimate = await this.contract.methods
        .approveDocument(requestId, signature || '')
        .estimateGas({ from: this.account })

      const tx = await this.contract.methods
        .approveDocument(requestId, signature || '')
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2),
        })

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      }
    } catch (error) {
      console.error('Error approving document:', error)
      throw error
    }
  }

  // Reject document
  async rejectDocument(requestId, reason) {
    try {
      if (!this.contract || !this.account) {
        await this.initialize()
      }

      const gasEstimate = await this.contract.methods
        .rejectDocument(requestId, reason)
        .estimateGas({ from: this.account })

      const tx = await this.contract.methods
        .rejectDocument(requestId, reason)
        .send({
          from: this.account,
          gas: Math.floor(gasEstimate * 1.2),
        })

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      }
    } catch (error) {
      console.error('Error rejecting document:', error)
      throw error
    }
  }

  // Verify document authenticity
  async verifyDocument(documentId, fileHash) {
    try {
      if (!this.contract) {
        await this.initialize()
      }

      const document = await this.getDocument(documentId)
      
      return {
        isValid: document.ipfsHash === fileHash && document.isActive,
        document,
      }
    } catch (error) {
      console.error('Error verifying document:', error)
      throw error
    }
  }

  // Get IPFS URL
  getIPFSUrl(ipfsHash) {
    return `${IPFS_GATEWAY}${ipfsHash}`
  }

  // Get transaction details
  async getTransaction(txHash) {
    try {
      if (!this.web3) {
        await this.initialize()
      }

      const tx = await this.web3.eth.getTransaction(txHash)
      const receipt = await this.web3.eth.getTransactionReceipt(txHash)

      return {
        transaction: tx,
        receipt,
      }
    } catch (error) {
      console.error('Error getting transaction:', error)
      throw error
    }
  }

  // Get gas price
  async getGasPrice() {
    try {
      if (!this.web3) {
        await this.initialize()
      }

      const gasPrice = await this.web3.eth.getGasPrice()
      return this.web3.utils.fromWei(gasPrice, 'gwei')
    } catch (error) {
      console.error('Error getting gas price:', error)
      throw error
    }
  }

  // Get account balance
  async getBalance(address = this.account) {
    try {
      if (!this.web3) {
        await this.initialize()
      }

      const balance = await this.web3.eth.getBalance(address)
      return this.web3.utils.fromWei(balance, 'ether')
    } catch (error) {
      console.error('Error getting balance:', error)
      throw error
    }
  }
}

// Export singleton instance
const blockchainService = new BlockchainService()
export default blockchainService
