/*eslint-disable*/
import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

export function WalletConnect() {
    const [account, setAccount] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if wallet is already connected on mount
    useEffect(() => {
        checkWalletConnection();
        const handleChainChanged = () => window.location.reload();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    const checkWalletConnection = async () => {
        if (!isMetamaskInstalled()) {
            setError('Metamask is not installed. Please install it from https://metamask.io');
            return;
        }

        try {
            const accounts = await window.ethereum!.request({
                method: 'eth_accounts',
            }) as string[];

            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setConnected(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error checking wallet connection:', err);
        }
    };

    const handleAccountsChanged = (...args: unknown[]) => {
        // Cast the first argument safely to a string array
        const accounts = args[0] as string[];

        if (!accounts || accounts.length === 0) {
            setAccount(null);
            setConnected(false);
        } else {
            setAccount(accounts[0]);
            setConnected(true);
        }
    };

    const isMetamaskInstalled = (): boolean => {
        if (typeof window === 'undefined') return false;
        return (
            window.ethereum !== undefined &&
            window.ethereum.isMetaMask === true
        );
    };

    const connectWallet = async () => {
        if (!isMetamaskInstalled()) {
            setError('Metamask is not installed. Please install it from https://metamask.io');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request account access
            const accounts = await window.ethereum!.request({
                method: 'eth_requestAccounts',
            }) as string[];

            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setConnected(true);
                setError(null);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes('User rejected')) {
                    setError('You rejected the connection request');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Failed to connect wallet');
            }
            setConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setConnected(false);
        setError(null);
    };

    const getSigner = async () => {
        if (!connected || !account) {
            throw new Error('Wallet not connected');
        }

        const provider = new BrowserProvider(window.ethereum!);
        return provider.getSigner(account);
    };

    const getProvider = () => {
        if (!window.ethereum) {
            throw new Error('Metamask not installed');
        }
        return new BrowserProvider(window.ethereum);
    };

    return (
        <div className="card">
            <h2>Wallet Connection</h2>

            {error && (
                <div className="status error">
                    ⚠ {error}
                </div>
            )}

            {connected ? (
                <div>
                    <div className="status success">
                        ✓ Connected
                    </div>
                    <div className="account-info">
                        <strong>Connected Account:</strong>
                        <p>{account}</p>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="btn btn-danger"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            )}
        </div>
    );
}

// Extend window type to include ethereum
declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, callback: (...args: unknown[]) => void) => void;
            removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
        };
    }
}