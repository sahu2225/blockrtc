import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'

interface WalletContextType {
    account: string | null
    isConnected: boolean
    isAuthenticated: boolean
    connectWallet: () => Promise<void>
    disconnectWallet: () => void
    signMessage: (message: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        checkConnection()
    }, [])

    const checkConnection = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' })
                if (accounts.length > 0) {
                    const account = accounts[0]
                    setAccount(account)
                    setIsConnected(true)

                    // Check if user was previously authenticated
                    const storedAuth = localStorage.getItem('wallet_auth')
                    if (storedAuth) {
                        const authData = JSON.parse(storedAuth)
                        if (authData.account === account) {
                            setIsAuthenticated(true)
                        } else {
                            // Different account, need to re-authenticate
                            await authenticateUser(account)
                        }
                    } else {
                        // No previous auth, need to authenticate
                        await authenticateUser(account)
                    }
                }
            } catch (error) {
                console.error('Error checking connection:', error)
            }
        }
    }

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                const account = accounts[0]
                setAccount(account)
                setIsConnected(true)

                // Authenticate with signature
                await authenticateUser(account)
            } catch (error) {
                console.error('Error connecting wallet:', error)
            }
        } else {
            alert('Please install MetaMask!')
        }
    }

    const authenticateUser = async (account: string) => {
        try {
            const message = `Welcome to WhatsApp Clone!\n\nSign this message to authenticate your wallet.\n\nWallet: ${account}\nTimestamp: ${Date.now()}`
            const signature = await signMessage(message)

            // Store authentication in localStorage
            localStorage.setItem('wallet_auth', JSON.stringify({
                account,
                signature,
                timestamp: Date.now()
            }))

            setIsAuthenticated(true)
        } catch (error) {
            console.error('Authentication failed:', error)
            setAccount(null)
            setIsConnected(false)
        }
    }

    const signMessage = async (message: string): Promise<string> => {
        if (!window.ethereum) throw new Error('MetaMask not found')

        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        return await signer.signMessage(message)
    }

    const disconnectWallet = () => {
        setAccount(null)
        setIsConnected(false)
        setIsAuthenticated(false)
        localStorage.removeItem('wallet_auth')
        localStorage.removeItem('chat_messages')
        localStorage.removeItem('contacts')
    }

    return (
        <WalletContext.Provider value={{ account, isConnected, isAuthenticated, connectWallet, disconnectWallet, signMessage }}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const context = useContext(WalletContext)
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider')
    }
    return context
}