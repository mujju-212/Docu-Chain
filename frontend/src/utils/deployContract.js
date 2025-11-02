/**
 * Smart Contract Deployment Utility
 * Handles deployment of EnhancedDocumentManager contract to Sepolia testnet
 */

import Web3 from 'web3';
import { enhancedMetaMask } from './enhancedMetamask.js';

// Contract ABI and Bytecode (will be populated from compiled contract)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "fileId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "filename",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      }
    ],
    "name": "FileCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "folderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "FolderCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_filename",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_size",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_fileType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_parentFolderId",
        "type": "uint256"
      }
    ],
    "name": "createFile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_parentFolderId",
        "type": "uint256"
      }
    ],
    "name": "createFolder",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_fileId",
        "type": "uint256"
      }
    ],
    "name": "getFile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "filename",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "size",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "fileType",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "parentFolderId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct EnhancedDocumentManager.File",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_folderId",
        "type": "uint256"
      }
    ],
    "name": "getFolder",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "parentFolderId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct EnhancedDocumentManager.Folder",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserFiles",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserFolders",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract bytecode (placeholder - will be updated after compilation)
const CONTRACT_BYTECODE = "0x"; // This will be populated from compiled contract

class ContractDeployer {
  constructor() {
    this.web3 = null;
    this.account = null;
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.web3 = new Web3(window.ethereum);
        
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        this.account = accounts[0];
        
        // Check if we're on Sepolia testnet
        const networkId = await this.web3.eth.net.getId();
        if (networkId !== 11155111) { // Sepolia network ID
          throw new Error('Please switch to Sepolia testnet');
        }
        
        return true;
      } else {
        throw new Error('MetaMask not detected');
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      throw error;
    }
  }

  /**
   * Deploy the EnhancedDocumentManager contract
   */
  async deployContract() {
    if (!this.web3 || !this.account) {
      throw new Error('Web3 not initialized');
    }

    if (!CONTRACT_BYTECODE || CONTRACT_BYTECODE === "0x") {
      throw new Error('Contract bytecode not available. Please compile the contract first.');
    }

    try {
      // Create contract instance
      const contract = new this.web3.eth.Contract(CONTRACT_ABI);
      
      // Get gas estimate
      const gasEstimate = await contract.deploy({
        data: CONTRACT_BYTECODE
      }).estimateGas({ from: this.account });

      // Deploy contract
      const deployedContract = await contract.deploy({
        data: CONTRACT_BYTECODE
      }).send({
        from: this.account,
        gas: Math.ceil(gasEstimate * 1.2), // Add 20% buffer
        gasPrice: await this.web3.eth.getGasPrice()
      });

      return {
        success: true,
        contractAddress: deployedContract.options.address,
        transactionHash: deployedContract.transactionHash,
        blockNumber: deployedContract.blockNumber
      };
    } catch (error) {
      console.error('Contract deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update blockchain configuration with deployed contract address
   */
  async updateConfiguration(contractAddress) {
    try {
      const config = {
        contractAddress: contractAddress,
        networkId: 11155111, // Sepolia
        networkName: "Sepolia Testnet",
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        explorerUrl: "https://sepolia.etherscan.io",
        pinata: {
          apiKey: "YOUR_PINATA_API_KEY",
          secretKey: "YOUR_PINATA_SECRET_KEY",
          jwt: "YOUR_PINATA_JWT"
        }
      };

      // In a real application, this would update the configuration file
      // For now, we'll store it in localStorage
      localStorage.setItem('docuchain-blockchain-config', JSON.stringify(config));
      
      return {
        success: true,
        config: config
      };
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get deployment status and information
   */
  async getDeploymentInfo() {
    try {
      const config = localStorage.getItem('docuchain-blockchain-config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        return {
          isDeployed: !!parsedConfig.contractAddress && parsedConfig.contractAddress !== "0x0000000000000000000000000000000000000000",
          contractAddress: parsedConfig.contractAddress,
          networkId: parsedConfig.networkId,
          networkName: parsedConfig.networkName
        };
      }
      
      return {
        isDeployed: false,
        contractAddress: null,
        networkId: null,
        networkName: null
      };
    } catch (error) {
      console.error('Failed to get deployment info:', error);
      return {
        isDeployed: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const contractDeployer = new ContractDeployer();

export { contractDeployer, ContractDeployer, CONTRACT_ABI };
export default contractDeployer;