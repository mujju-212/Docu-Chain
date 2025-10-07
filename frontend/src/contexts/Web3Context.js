import React, { createContext, useContext, useState, useEffect } from 'react'
import Web3 from 'web3'
import toast from 'react-hot-toast'

const Web3Context = createContext(null)

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Contract ABI (will be populated after deployment)
const CONTRACT_ABI = [] // Import from generated ABI file

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [contract, setContract] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS
  const REQUIRED_CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID)
  const CHAIN_NAME = process.env.REACT_APP_CHAIN_NAME

  useEffect(() => {
    // Check if already connected on mount
    if (window.ethereum) {
      checkConnection()
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    try {
      if (!window.ethereum) return

      const web3Instance = new Web3(window.ethereum)
      const accounts = await web3Instance.eth.getAccounts()
      
      if (accounts.length > 0) {
        setWeb3(web3Instance)
        setAccount(accounts[0])
        
        const chainId = await web3Instance.eth.getChainId()
        setChainId(Number(chainId))
        setIsCorrectNetwork(Number(chainId) === REQUIRED_CHAIN_ID)
        
        // Initialize contract
        if (CONTRACT_ABI.length > 0) {
          const contractInstance = new web3Instance.eth.Contract(
            CONTRACT_ABI,
            CONTRACT_ADDRESS
          )
          setContract(contractInstance)
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setAccount(null)
      setWeb3(null)
      setContract(null)
      toast.error('MetaMask disconnected')
    } else if (accounts[0] !== account) {
      // User switched accounts
      setAccount(accounts[0])
      toast.success('Wallet account changed')
    }
  }

  const handleChainChanged = (chainId) => {
    // Reload the page to reset state
    window.location.reload()
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask to use this feature')
      window.open('https://metamask.io/download/', '_blank')
      return { success: false, error: 'MetaMask not installed' }
    }

    setIsConnecting(true)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      // Initialize Web3
      const web3Instance = new Web3(window.ethereum)
      setWeb3(web3Instance)
      setAccount(accounts[0])

      // Get chain ID
      const chainId = await web3Instance.eth.getChainId()
      setChainId(Number(chainId))

      // Check if correct network
      if (Number(chainId) !== REQUIRED_CHAIN_ID) {
        await switchNetwork()
      } else {
        setIsCorrectNetwork(true)
      }

      // Initialize contract
      if (CONTRACT_ABI.length > 0) {
        const contractInstance = new web3Instance.eth.Contract(
          CONTRACT_ABI,
          CONTRACT_ADDRESS
        )
        setContract(contractInstance)
      }

      toast.success('Wallet connected successfully!')
      return { success: true, account: accounts[0] }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      const message = error.message || 'Failed to connect wallet'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWeb3(null)
    setAccount(null)
    setContract(null)
    setChainId(null)
    setIsCorrectNetwork(false)
    toast.success('Wallet disconnected')
  }

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
      })
      setIsCorrectNetwork(true)
      toast.success(`Switched to ${CHAIN_NAME} network`)
      return { success: true }
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
                chainName: CHAIN_NAME,
                rpcUrls: [process.env.REACT_APP_RPC_URL],
                blockExplorerUrls: [process.env.REACT_APP_BLOCK_EXPLORER],
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          })
          setIsCorrectNetwork(true)
          toast.success(`Added and switched to ${CHAIN_NAME} network`)
          return { success: true }
        } catch (addError) {
          console.error('Error adding network:', addError)
          toast.error('Failed to add network')
          return { success: false, error: addError.message }
        }
      }
      console.error('Error switching network:', error)
      toast.error('Failed to switch network')
      return { success: false, error: error.message }
    }
  }

  const getBalance = async (address = account) => {
    if (!web3 || !address) return '0'
    
    try {
      const balance = await web3.eth.getBalance(address)
      return web3.utils.fromWei(balance, 'ether')
    } catch (error) {
      console.error('Error getting balance:', error)
      return '0'
    }
  }

  const sendTransaction = async (to, value, data = '0x') => {
    if (!web3 || !account) {
      toast.error('Please connect your wallet first')
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      const gasPrice = await web3.eth.getGasPrice()
      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to,
        value,
        data,
      })

      const tx = await web3.eth.sendTransaction({
        from: account,
        to,
        value,
        data,
        gas: gasEstimate,
        gasPrice,
      })

      return { success: true, txHash: tx.transactionHash }
    } catch (error) {
      console.error('Transaction error:', error)
      const message = error.message || 'Transaction failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    web3,
    account,
    chainId,
    contract,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    sendTransaction,
  }

  return React.createElement(Web3Context.Provider, { value: value }, children)
}