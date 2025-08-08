import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletProvider } from '../context/WalletContext'
import { SocketProvider } from '../context/SocketContext'
import { P2PProvider } from '../context/P2PContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <SocketProvider>
        <P2PProvider>
          <Component {...pageProps} />
        </P2PProvider>
      </SocketProvider>
    </WalletProvider>
  )
}