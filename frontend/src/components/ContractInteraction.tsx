import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI } from '../../../Solidity/abi.js';

// Contract address - Make sure this matches your deployed contract
const CONTRACT_ADDRESS = '0x07573cF0a4a7DC586D42b5ED14Ff69a5a52105C4';

interface ContractState {
    name: string | null;
}

export function ContractInteraction() {
    const [contractState, setContractState] = useState<ContractState>({
        name: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Check wallet connection on mount
    useEffect(() => {
        checkWalletConnection();
    }, []);

    const checkWalletConnection = async () => {
        if (!window.ethereum) {
            setError('Metamask not installed');
            return;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts',
            }) as string[];

            setIsConnected(accounts.length > 0);
        } catch (err) {
            console.error('Error checking wallet:', err);
        }
    };

    const readContractState = async () => {
        if (!window.ethereum) {
            setError('Metamask not installed');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create a provider instance
            const provider = new BrowserProvider(window.ethereum);

            // Create a contract instance (read-only, no signer needed for view functions)
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                provider
            );

            // Read the public state variable 'name'
            const nameValue = await contract.name();

            setContractState({
                name: nameValue,
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(`Failed to read contract: ${err.message}`);
            } else {
                setError('Failed to read contract state');
            }
            console.error('Contract read error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateContractName = async (newName: string) => {
        if (!window.ethereum) {
            setError('Metamask not installed');
            return;
        }

        if (!newName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            const tx = await contract.setName(newName);

            setLoading(true);
            await tx.wait();

            const updatedName = await contract.name();
            setContractState({
                name: updatedName,
            });

            setError(null);
            setInputValue('');
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes('User rejected')) {
                    setError('Transaction rejected by user');
                } else {
                    setError(`Transaction failed: ${err.message}`);
                }
            } else {
                setError('Transaction failed');
            }
            console.error('Transaction error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Contract Interaction</h2>

            {!isConnected && (
                <div className="status warning">
                    ⚠ Please connect your wallet first to interact with the contract
                </div>
            )}

            {error && (
                <div className="status error">
                    ✗ {error}
                </div>
            )}

            {/* Read State Variables Section */}
            <div>
                <h3>Read State Variables</h3>
                <button
                    onClick={readContractState}
                    disabled={loading || !isConnected}
                    className="btn btn-primary"
                >
                    {loading ? 'Loading...' : 'Fetch Contract State'}
                </button>

                <div className="account-info">
                    <strong>Contract Name:</strong>
                    <p>
                        {contractState.name !== null ? (
                            <span>{contractState.name || '(empty)'}</span>
                        ) : (
                            <span style={{ color: '#999' }}>(not loaded yet)</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Write State Variables Section */}
            <div>
                <h3>Update State Variables</h3>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        updateContractName(inputValue);
                    }}
                >
                    <div className="form-group">
                        <label htmlFor="nameInput">New Name:</label>
                        <input
                            type="text"
                            id="nameInput"
                            placeholder="Enter new contract name"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={loading || !isConnected}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !isConnected}
                        className="btn btn-success"
                    >
                        {loading ? 'Processing...' : 'Update Name'}
                    </button>
                </form>
            </div>
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
