import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
    initializeMetaMask, 
    connectWallet, 
    disconnectWallet, 
    getCurrentWalletAddress, 
    isWalletConnected,
    formatWalletAddress,
    isMetaMaskInstalled,
    getNetworkInfo
} from '../utils/metamask';

// Wallet state
const initialState = {
    isConnected: false,
    address: null,
    isLoading: false,
    error: null,
    isMetaMaskInstalled: false,
    networkInfo: null
};

// Wallet actions
const walletActions = {
    SET_LOADING: 'SET_LOADING',
    SET_CONNECTED: 'SET_CONNECTED',
    SET_DISCONNECTED: 'SET_DISCONNECTED',
    SET_ERROR: 'SET_ERROR',
    SET_METAMASK_INSTALLED: 'SET_METAMASK_INSTALLED',
    SET_NETWORK_INFO: 'SET_NETWORK_INFO',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Wallet reducer
const walletReducer = (state, action) => {
    switch (action.type) {
        case walletActions.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                error: null
            };
        case walletActions.SET_CONNECTED:
            return {
                ...state,
                isConnected: true,
                address: action.payload.address,
                isLoading: false,
                error: null
            };
        case walletActions.SET_DISCONNECTED:
            return {
                ...state,
                isConnected: false,
                address: null,
                isLoading: false,
                error: null
            };
        case walletActions.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };
        case walletActions.SET_METAMASK_INSTALLED:
            return {
                ...state,
                isMetaMaskInstalled: action.payload
            };
        case walletActions.SET_NETWORK_INFO:
            return {
                ...state,
                networkInfo: action.payload
            };
        case walletActions.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

// Create context
const WalletContext = createContext();

// Wallet provider component
export const WalletProvider = ({ children }) => {
    const [state, dispatch] = useReducer(walletReducer, initialState);

    // Helper function to detect MetaMask with retry (async injection handling)
    // Different browsers inject MetaMask at different times
    const detectMetaMask = async (maxRetries = 5, delay = 200) => {
        console.log('🔍 Starting MetaMask detection...');
        console.log('Browser:', navigator.userAgent);
        
        for (let i = 0; i < maxRetries; i++) {
            // Check multiple possible MetaMask indicators
            const hasEthereum = typeof window.ethereum !== 'undefined';
            const hasWeb3 = typeof window.web3 !== 'undefined';
            const isMetaMask = window.ethereum?.isMetaMask || window.web3?.currentProvider?.isMetaMask;
            
            if (hasEthereum || hasWeb3) {
                if (isMetaMask) {
                    console.log('✅ MetaMask detected on attempt', i + 1);
                    console.log('Provider details:', {
                        hasEthereum,
                        hasWeb3,
                        isMetaMask,
                        provider: window.ethereum ? 'window.ethereum' : 'window.web3'
                    });
                    return true;
                } else if (hasEthereum) {
                    // Ethereum provider exists but might not be MetaMask
                    console.log('⚠️ Ethereum provider found but isMetaMask flag missing');
                    // Still return true as some browsers don't set isMetaMask immediately
                    return true;
                }
            }
            
            console.log(`⏳ MetaMask not detected yet, retry ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.warn('❌ MetaMask not detected after', maxRetries, 'attempts');
        console.log('Please ensure MetaMask extension is installed and enabled');
        return false;
    };

    // Initialize MetaMask on mount
    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 WalletContext: Starting initialization...');
            
            // Check if MetaMask is installed (with retry for async injection)
            const isInstalled = await detectMetaMask();
            dispatch({ type: walletActions.SET_METAMASK_INSTALLED, payload: isInstalled });

            if (isInstalled) {
                try {
                    console.log('🔗 Initializing MetaMask connection...');
                    await initializeMetaMask();
                    
                    // Check if already connected
                    const currentAddress = getCurrentWalletAddress();
                    if (currentAddress && isWalletConnected()) {
                        console.log('✅ Wallet already connected:', currentAddress);
                        dispatch({ 
                            type: walletActions.SET_CONNECTED, 
                            payload: { address: currentAddress }
                        });
                        
                        // Get network info
                        const networkInfo = await getNetworkInfo();
                        dispatch({ type: walletActions.SET_NETWORK_INFO, payload: networkInfo });
                    } else {
                        console.log('ℹ️ Wallet detected but not connected yet');
                    }
                } catch (error) {
                    console.error('❌ Error initializing MetaMask:', error);
                }
            } else {
                console.warn('⚠️ MetaMask not installed or not detected');
            }
        };

        initialize();

        // Listen for MetaMask loading dynamically (for browsers that inject late)
        const handleEthereumLoad = () => {
            console.log('🦊 Ethereum provider loaded dynamically');
            if (!state.isConnected) {
                initialize();
            }
        };

        // Multiple event listeners for different browser behaviors
        window.addEventListener('ethereum#initialized', handleEthereumLoad);
        
        // Some browsers use different events
        if (window.ethereum) {
            window.ethereum.on?.('connect', handleEthereumLoad);
        }

        // Fallback: Check again after delays (some browsers are slow)
        const delayedChecks = [
            setTimeout(async () => {
                if (!state.isMetaMaskInstalled && typeof window.ethereum !== 'undefined') {
                    console.log('🔄 Delayed check (1s) - MetaMask found! Re-initializing...');
                    await initialize();
                }
            }, 1000),
            setTimeout(async () => {
                if (!state.isMetaMaskInstalled && typeof window.ethereum !== 'undefined') {
                    console.log('🔄 Delayed check (3s) - MetaMask found! Re-initializing...');
                    await initialize();
                }
            }, 3000)
        ];

        return () => {
            window.removeEventListener('ethereum#initialized', handleEthereumLoad);
            if (window.ethereum) {
                window.ethereum.removeListener?.('connect', handleEthereumLoad);
            }
            delayedChecks.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    // Listen for account and network changes
    useEffect(() => {
        if (!state.isMetaMaskInstalled || !window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            console.log('🔄 Account changed in WalletContext:', accounts);
            
            if (accounts.length === 0) {
                // User disconnected their wallet
                console.log('👋 Wallet disconnected');
                dispatch({ type: walletActions.SET_DISCONNECTED });
            } else {
                // User switched to a different account
                console.log('🔀 Switched to account:', accounts[0]);
                dispatch({ 
                    type: walletActions.SET_CONNECTED, 
                    payload: { address: accounts[0] }
                });
                
                // Update network info
                try {
                    const networkInfo = await getNetworkInfo();
                    dispatch({ type: walletActions.SET_NETWORK_INFO, payload: networkInfo });
                } catch (error) {
                    console.error('Error getting network info after account change:', error);
                }
            }
        };

        const handleChainChanged = async (chainId) => {
            console.log('🌐 Network changed in WalletContext:', chainId);
            
            // Update network info
            try {
                const networkInfo = await getNetworkInfo();
                dispatch({ type: walletActions.SET_NETWORK_INFO, payload: networkInfo });
            } catch (error) {
                console.error('Error getting network info after chain change:', error);
            }
            
            // Optionally reload the page to reset state
            // window.location.reload();
        };

        // Add event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Cleanup
        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [state.isMetaMaskInstalled]);

    // Connect wallet function
    const connect = async () => {
        if (!state.isMetaMaskInstalled) {
            dispatch({ 
                type: walletActions.SET_ERROR, 
                payload: 'MetaMask is not installed. Please install MetaMask to continue.' 
            });
            return;
        }

        dispatch({ type: walletActions.SET_LOADING, payload: true });

        try {
            const result = await connectWallet();
            
            if (result.success) {
                dispatch({ 
                    type: walletActions.SET_CONNECTED, 
                    payload: { address: result.account }
                });
                
                // Get network info
                const networkInfo = await getNetworkInfo();
                dispatch({ type: walletActions.SET_NETWORK_INFO, payload: networkInfo });
                
                return result;
            } else {
                throw new Error(result.message || 'Failed to connect wallet');
            }
        } catch (error) {
            dispatch({ type: walletActions.SET_ERROR, payload: error.message });
            throw error;
        }
    };

    // Disconnect wallet function
    const disconnect = () => {
        try {
            disconnectWallet();
            dispatch({ type: walletActions.SET_DISCONNECTED });
            return { success: true, message: 'Wallet disconnected successfully' };
        } catch (error) {
            dispatch({ type: walletActions.SET_ERROR, payload: error.message });
            throw error;
        }
    };

    // Clear error function
    const clearError = () => {
        dispatch({ type: walletActions.CLEAR_ERROR });
    };

    // Get formatted address
    const getFormattedAddress = () => {
        return state.address ? formatWalletAddress(state.address) : null;
    };

    // Context value
    const value = {
        // State
        isConnected: state.isConnected,
        address: state.address,
        isLoading: state.isLoading,
        error: state.error,
        isMetaMaskInstalled: state.isMetaMaskInstalled,
        networkInfo: state.networkInfo,
        
        // Actions
        connect,
        disconnect,
        clearError,
        getFormattedAddress
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

// Custom hook to use wallet context
export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

export default WalletContext;