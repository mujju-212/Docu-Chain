import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

/**
 * MetaMask Debugger Component
 * Shows detailed information about MetaMask detection
 * Use this to debug browser-specific issues
 */
const MetaMaskDebugger = () => {
    const wallet = useWallet();
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        // Gather comprehensive debug information
        const gatherDebugInfo = () => {
            const info = {
                // Browser info
                browser: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                },
                
                // Window object checks
                window: {
                    hasEthereum: typeof window.ethereum !== 'undefined',
                    hasWeb3: typeof window.web3 !== 'undefined',
                    ethereumType: typeof window.ethereum,
                    web3Type: typeof window.web3,
                },
                
                // Ethereum provider details
                ethereum: window.ethereum ? {
                    isMetaMask: window.ethereum.isMetaMask,
                    isConnected: window.ethereum.isConnected?.(),
                    chainId: window.ethereum.chainId,
                    selectedAddress: window.ethereum.selectedAddress,
                    networkVersion: window.ethereum.networkVersion,
                    _metamask: typeof window.ethereum._metamask !== 'undefined',
                } : null,
                
                // Web3 provider details (legacy)
                web3Provider: window.web3?.currentProvider ? {
                    isMetaMask: window.web3.currentProvider.isMetaMask,
                    selectedAddress: window.web3.currentProvider.selectedAddress,
                } : null,
                
                // WalletContext state
                walletContext: {
                    isConnected: wallet.isConnected,
                    address: wallet.address,
                    isLoading: wallet.isLoading,
                    isMetaMaskInstalled: wallet.isMetaMaskInstalled,
                    error: wallet.error,
                    networkInfo: wallet.networkInfo,
                },
                
                // Timestamp
                timestamp: new Date().toISOString(),
            };
            
            setDebugInfo(info);
        };

        // Initial gather
        gatherDebugInfo();

        // Re-gather every 2 seconds to catch late injections
        const interval = setInterval(gatherDebugInfo, 2000);

        return () => clearInterval(interval);
    }, [wallet]);

    const copyToClipboard = () => {
        const text = JSON.stringify(debugInfo, null, 2);
        navigator.clipboard.writeText(text);
        alert('Debug info copied to clipboard!');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            maxWidth: '400px',
            maxHeight: '600px',
            overflow: 'auto',
            backgroundColor: '#1a1a1a',
            color: '#00ff00',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            border: '2px solid #00ff00'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px'
            }}>
                <h3 style={{ margin: 0, color: '#00ff00' }}>🔍 MetaMask Debug</h3>
                <button 
                    onClick={copyToClipboard}
                    style={{
                        padding: '5px 10px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        backgroundColor: '#00ff00',
                        color: '#1a1a1a',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Copy
                </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Browser:</strong>
                <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
                    {debugInfo.browser?.userAgent?.includes('Chrome') && '🌐 Chrome/Chromium'}
                    {debugInfo.browser?.userAgent?.includes('Firefox') && '🦊 Firefox'}
                    {debugInfo.browser?.userAgent?.includes('Safari') && '🧭 Safari'}
                    {debugInfo.browser?.userAgent?.includes('Edge') && '🌊 Edge'}
                    {debugInfo.browser?.userAgent?.includes('Opera') && '🎭 Opera'}
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Detection Status:</strong>
                <div style={{ paddingLeft: '10px' }}>
                    <div>window.ethereum: {debugInfo.window?.hasEthereum ? '✅ Found' : '❌ Missing'}</div>
                    <div>window.web3: {debugInfo.window?.hasWeb3 ? '✅ Found' : '❌ Missing'}</div>
                    <div>isMetaMask: {debugInfo.ethereum?.isMetaMask ? '✅ True' : '❌ False/Missing'}</div>
                </div>
            </div>

            {debugInfo.ethereum && (
                <div style={{ marginBottom: '10px' }}>
                    <strong>Ethereum Provider:</strong>
                    <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
                        <div>Connected: {debugInfo.ethereum.isConnected ? '✅' : '❌'}</div>
                        <div>Chain ID: {debugInfo.ethereum.chainId || 'N/A'}</div>
                        <div>Address: {debugInfo.ethereum.selectedAddress ? 
                            `${debugInfo.ethereum.selectedAddress.slice(0, 6)}...${debugInfo.ethereum.selectedAddress.slice(-4)}` : 
                            'Not connected'
                        }</div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '10px' }}>
                <strong>WalletContext:</strong>
                <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
                    <div>Installed: {debugInfo.walletContext?.isMetaMaskInstalled ? '✅' : '❌'}</div>
                    <div>Connected: {debugInfo.walletContext?.isConnected ? '✅' : '❌'}</div>
                    <div>Loading: {debugInfo.walletContext?.isLoading ? '⏳' : '✅'}</div>
                    {debugInfo.walletContext?.error && (
                        <div style={{ color: '#ff0000' }}>Error: {debugInfo.walletContext.error}</div>
                    )}
                </div>
            </div>

            {!debugInfo.window?.hasEthereum && !debugInfo.window?.hasWeb3 && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#ff000020',
                    border: '1px solid #ff0000',
                    borderRadius: '4px'
                }}>
                    <strong style={{ color: '#ff0000' }}>⚠️ MetaMask Not Detected!</strong>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        <p>Possible issues:</p>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            <li>Extension not installed</li>
                            <li>Extension disabled</li>
                            <li>Browser hasn't loaded extension yet</li>
                            <li>Conflicting wallet extension</li>
                        </ul>
                        <p style={{ marginTop: '10px' }}>
                            <strong>Try:</strong>
                        </p>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            <li>Refresh the page (F5)</li>
                            <li>Check extension is enabled</li>
                            <li>Disable other wallet extensions</li>
                            <li>Restart browser</li>
                        </ul>
                    </div>
                </div>
            )}

            <details style={{ marginTop: '10px', fontSize: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#00ffff' }}>
                    📋 Full Debug Data (click to expand)
                </summary>
                <pre style={{ 
                    marginTop: '10px', 
                    fontSize: '9px', 
                    overflow: 'auto',
                    maxHeight: '200px',
                    backgroundColor: '#0a0a0a',
                    padding: '10px',
                    borderRadius: '4px'
                }}>
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default MetaMaskDebugger;
