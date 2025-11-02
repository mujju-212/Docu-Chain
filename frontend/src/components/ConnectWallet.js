import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';

const ConnectWallet = ({ className = '', variant = 'default', style = {} }) => {
    const { 
        isConnected, 
        address, 
        isLoading, 
        error, 
        isMetaMaskInstalled, 
        networkInfo,
        connect, 
        disconnect, 
        clearError,
        getFormattedAddress 
    } = useWallet();
    
    const { currentTheme } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);

    // Fallback theme values in case theme context is not available
    const theme = currentTheme || {
        primary: '#10b981',
        success: '#10b981',
        text: '#111827',
        muted: '#6b7280',
        line: '#e5e7eb',
        surface: '#ffffff',
        background: '#f9fafb'
    };

    const handleConnect = async () => {
        try {
            clearError();
            await connect();
        } catch (error) {
            console.error('Connect wallet error:', error);
        }
    };

    const handleDisconnect = () => {
        try {
            disconnect();
            setShowDropdown(false);
        } catch (error) {
            console.error('Disconnect wallet error:', error);
        }
    };

    const getButtonStyle = () => {
        const baseStyle = {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
        };

        if (variant === 'minimal') {
            return {
                ...baseStyle,
                background: 'transparent',
                color: theme.text,
                border: `1px solid ${theme.line}`,
                padding: '6px 12px',
                ...style
            };
        }

        if (isConnected) {
            return {
                ...baseStyle,
                background: theme.success,
                color: 'white',
                ...style
            };
        }

        return {
            ...baseStyle,
            background: theme.primary,
            color: 'white',
            ...style
        };
    };

    const getDropdownStyle = () => ({
        position: 'absolute',
        top: '100%',
        right: '0',
        background: theme.surface,
        border: `1px solid ${theme.line}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        minWidth: '220px',
        zIndex: 1000,
        marginTop: '4px'
    });

    if (!isMetaMaskInstalled) {
        return (
            <div className={className} style={style}>
                <button
                    style={{
                        ...getButtonStyle(),
                        background: '#ff6b35',
                        color: 'white'
                    }}
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                >
                    <i className="ri-download-line"></i>
                    Install MetaMask
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={className} style={style}>
                <button style={getButtonStyle()} disabled>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid currentColor',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Connecting...
                </button>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className={className} style={{ position: 'relative', ...style }}>
                <button
                    style={getButtonStyle()}
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <i className="ri-wallet-3-line"></i>
                    {getFormattedAddress()}
                    <i className={`ri-arrow-${showDropdown ? 'up' : 'down'}-s-line`}></i>
                </button>

                {showDropdown && (
                    <div style={getDropdownStyle()}>
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: `1px solid ${theme.line}`,
                            fontSize: '12px',
                            color: theme.muted
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Wallet Address:</strong>
                            </div>
                            <div style={{
                                fontFamily: 'monospace',
                                background: theme.background,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                wordBreak: 'break-all'
                            }}>
                                {address}
                            </div>
                        </div>

                        {networkInfo && (
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: `1px solid ${theme.line}`,
                                fontSize: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: networkInfo.isCorrectNetwork ? theme.success : '#ff6b35'
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: networkInfo.isCorrectNetwork ? theme.success : '#ff6b35'
                                    }}></div>
                                    {networkInfo.networkName}
                                </div>
                                {!networkInfo.isCorrectNetwork && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#ff6b35',
                                        marginTop: '4px'
                                    }}>
                                        Please switch to Sepolia Testnet
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ padding: '8px' }}>
                            <button
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ff6b35',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = theme.background}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                onClick={handleDisconnect}
                            >
                                <i className="ri-logout-box-line"></i>
                                Disconnect Wallet
                            </button>
                        </div>
                    </div>
                )}

                {/* Close dropdown when clicking outside */}
                {showDropdown && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                        onClick={() => setShowDropdown(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={className} style={style}>
            <button
                style={getButtonStyle()}
                onClick={handleConnect}
            >
                <i className="ri-wallet-line"></i>
                Connect Wallet
            </button>
            
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    background: '#ff6b35',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '4px',
                    zIndex: 1000
                }}>
                    {error}
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            float: 'right',
                            fontSize: '12px'
                        }}
                        onClick={clearError}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConnectWallet;